import type { AppSettings, RedactionRule } from "@/types";

export type AiAction = "fill" | "rephrase" | "summarize" | "extend";

export const OPENROUTER_ORIGIN = "https://openrouter.ai";
const OPENROUTER_URL = `${OPENROUTER_ORIGIN}/api/v1/chat/completions`;

/** Error with a stable `code` so the UI can show a translated message. */
export class AiError extends Error {
  constructor(
    public readonly code: "noKey" | "network" | "http" | "empty",
    public readonly detail = "",
  ) {
    super(`AI request failed: ${code}${detail ? ` (${detail})` : ""}`);
    this.name = "AiError";
  }
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

interface ActiveRule {
  keyword: string;
  token: string;
}

/**
 * Resolve the rules that will actually be applied: blank keywords dropped,
 * longest keywords first (so "Acme Bank" wins over "Acme"), and a neutral
 * numbered token for rules without a placeholder. The generated token must
 * not be derived from the keyword, or the keyword would leak to the AI.
 */
export function activeRules(rules: RedactionRule[]): ActiveRule[] {
  return rules
    .map((rule, index) => ({
      keyword: rule.keyword.trim(),
      token: rule.placeholder.trim() || `[ENTITY_${index + 1}]`,
    }))
    .filter((rule) => rule.keyword)
    .sort((a, b) => b.keyword.length - a.keyword.length);
}

/**
 * Match the keyword only as a whole word/phrase, so "Acme" doesn't redact the
 * inside of "Acmetrics". Letters and digits of any script count as word chars.
 */
function keywordPattern(keyword: string): RegExp {
  return new RegExp(`(?<![\\p{L}\\p{N}_])${escapeRegExp(keyword)}(?![\\p{L}\\p{N}_])`, "giu");
}

/** Replace every keyword with its placeholder before sending text to the AI. */
export function applyRedaction(text: string, rules: RedactionRule[]): string {
  let output = text;
  for (const rule of activeRules(rules)) {
    output = output.replace(keywordPattern(rule.keyword), rule.token);
  }
  return output;
}

/** Swap placeholders back to their original keyword in the AI's response. */
export function restoreRedaction(text: string, rules: RedactionRule[]): string {
  let output = text;
  // Longest token first so "[CLIENT_A]" isn't partially matched by "[CLIENT]".
  const byToken = [...activeRules(rules)].sort((a, b) => b.token.length - a.token.length);
  for (const rule of byToken) {
    output = output.replace(new RegExp(escapeRegExp(rule.token), "gi"), () => rule.keyword);
  }
  return output;
}

/** Placeholders used by more than one rule can't be restored unambiguously. */
export function duplicatePlaceholders(rules: RedactionRule[]): string[] {
  const seen = new Map<string, number>();
  for (const rule of activeRules(rules)) {
    const key = rule.token.toLowerCase();
    seen.set(key, (seen.get(key) ?? 0) + 1);
  }
  return [...seen].filter(([, count]) => count > 1).map(([token]) => token);
}

export interface ChatMessage {
  role: "system" | "user";
  content: string;
}

async function callOpenRouter(settings: AppSettings, messages: ChatMessage[]): Promise<string> {
  const apiKey = settings.openRouterApiKey.trim();
  if (!apiKey) {
    throw new AiError("noKey");
  }

  let response: Response;
  try {
    response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": window.location.origin,
        "X-Title": "Cyber Board Reports",
      },
      body: JSON.stringify({
        model: settings.openRouterModel,
        messages,
        temperature: 0.4,
      }),
    });
  } catch {
    throw new AiError("network");
  }

  if (!response.ok) {
    let detail: string;
    try {
      const errJson = (await response.json()) as { error?: { message?: string } };
      detail = errJson?.error?.message ?? "";
    } catch {
      detail = "";
    }
    throw new AiError("http", `${response.status}${detail ? `: ${detail}` : ""}`);
  }

  const data = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) {
    throw new AiError("empty");
  }
  return content.trim();
}

function languageName(settings: AppSettings): string {
  return settings.language === "de" ? "German" : "English";
}

/** Drop a trailing colon and surrounding whitespace from a UI label ("Description:" -> "Description"). */
function cleanLabel(label: string): string {
  return label.replace(/\s*[:：]\s*$/, "").trim();
}

/**
 * Remove a leading "<field label>:" the model sometimes prepends to its answer
 * (e.g. "Description: ..."), even if it used a translated form of the label.
 */
function stripLabelEcho(text: string, fieldLabel: string): string {
  const label = cleanLabel(fieldLabel);
  if (!label) {
    return text;
  }
  // Match the first line if it is just "<something short>:" followed by the real text.
  const match = text.match(/^\s*([^\n:：]{1,40})[:：]\s+/);
  if (match) {
    const prefix = match[1].trim().toLowerCase();
    // Only strip when it looks like a label echo, not a real sentence.
    if (prefix === label.toLowerCase() || (!prefix.includes(" ") && prefix.length <= 24)) {
      return text.slice(match[0].length).trimStart();
    }
  }
  return text;
}

function buildUserPrompt(
  action: AiAction,
  fieldLabel: string,
  fieldText: string,
  context: string,
  itemContext: string,
): string {
  const label = cleanLabel(fieldLabel);
  const contextBlock = context.trim()
    ? `\n\nFor context, here is the rest of the board report:\n"""\n${context.trim()}\n"""`
    : "";
  // Structured facts about the specific item this field belongs to (e.g. the
  // particular risk's name, likelihood, impact and trend). This is what makes
  // the output accurate and specific rather than a generic summary.
  const itemBlock = itemContext.trim()
    ? `\n\nThis field belongs to one specific item whose key attributes are already known. ` +
      `Write text that is accurate for and consistent with these attributes; do not contradict them and do not simply list them back:\n"""\n${itemContext.trim()}\n"""`
    : "";

  switch (action) {
    case "fill":
      return (
        `Write the content for the "${label}" field of a quarterly cyber security board report. ` +
        `Produce NEW prose written specifically for the "${label}" field — do not copy, restate, or echo any other section verbatim. ` +
        `The surrounding report is provided only as background so your text stays consistent with it; it is not the answer. ` +
        `Keep it concise and board-appropriate, and write only the text that belongs in "${label}". ` +
        `Do not begin your answer with the field name or any label such as "${label}:".` +
        itemBlock +
        contextBlock +
        (fieldText.trim()
          ? `\n\nThe "${label}" field currently contains these rough notes to build on:\n"""\n${fieldText.trim()}\n"""`
          : "")
      );
    case "rephrase":
      return (
        `Rephrase the following "${label}" text for a board of directors. ` +
        `Keep the meaning and roughly the same length, but make it clearer and more professional. ` +
        `Do not begin your answer with the field name or any label.` +
        itemBlock +
        contextBlock +
        `\n\nText to rephrase:\n"""\n${fieldText.trim()}\n"""`
      );
    case "summarize":
      return (
        `Summarize the following "${label}" text into a tighter, board-ready version. ` +
        `Keep only the most important points. Do not begin your answer with the field name or any label.` +
        itemBlock +
        contextBlock +
        `\n\nText to summarize:\n"""\n${fieldText.trim()}\n"""`
      );
    case "extend":
      return (
        `Expand the following "${label}" text with relevant detail appropriate for a board report, ` +
        `keeping the existing tone and staying consistent with the rest of the report. ` +
        `Do not begin your answer with the field name or any label.` +
        itemBlock +
        contextBlock +
        `\n\nText to expand:\n"""\n${fieldText.trim()}\n"""`
      );
    default:
      return fieldText;
  }
}

export interface AssistParams {
  action: AiAction;
  fieldLabel: string;
  fieldText: string;
  context?: string;
  /** Structured facts about the specific item this field belongs to. */
  itemContext?: string;
  settings: AppSettings;
}

/**
 * Build the exact, already-redacted messages that would be sent to the AI.
 * Used both for the request itself and for the "what will be sent" preview.
 */
export function buildAssistMessages(params: AssistParams): ChatMessage[] {
  const { action, fieldLabel, fieldText, context = "", itemContext = "", settings } = params;
  const rules = settings.redactionRules;

  const system =
    `You are an expert assistant helping a CISO write a quarterly cyber security board report. ` +
    `Write clearly and concisely for a non-technical board of directors. ` +
    `Always respond in ${languageName(settings)}. ` +
    `Return only the requested field text — no preamble, no explanations, no quotation marks, no markdown code fences, ` +
    `and never prefix your answer with the field name or a label like "Field:".`;

  const userPrompt = buildUserPrompt(
    action,
    fieldLabel,
    applyRedaction(fieldText, rules),
    applyRedaction(context, rules),
    applyRedaction(itemContext, rules),
  );

  return [
    { role: "system", content: system },
    { role: "user", content: userPrompt },
  ];
}

/**
 * Run an AI writing action. All outbound text is redacted using the configured
 * rules; placeholders are restored in the returned text.
 */
export async function assistText(params: AssistParams): Promise<string> {
  const raw = await callOpenRouter(params.settings, buildAssistMessages(params));
  return stripLabelEcho(restoreRedaction(raw, params.settings.redactionRules), params.fieldLabel);
}
