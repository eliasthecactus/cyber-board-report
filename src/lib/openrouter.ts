import type { AppSettings, RedactionRule } from "@/types";

export type AiAction = "fill" | "rephrase" | "summarize" | "extend";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** A safe default token when the user did not supply a placeholder. */
function tokenFor(rule: RedactionRule): string {
  const placeholder = rule.placeholder.trim();
  if (placeholder) {
    return placeholder;
  }
  const slug = rule.keyword.trim().toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_|_$/g, "");
  return `[REDACTED_${slug || rule.id}]`;
}

/** Replace every keyword with its placeholder before sending text to the AI. */
export function applyRedaction(text: string, rules: RedactionRule[]): string {
  let output = text;
  for (const rule of rules) {
    const keyword = rule.keyword.trim();
    if (!keyword) {
      continue;
    }
    // Case-insensitive so variations are caught; restored to the canonical keyword.
    output = output.replace(new RegExp(escapeRegExp(keyword), "gi"), tokenFor(rule));
  }
  return output;
}

/** Swap placeholders back to their original keyword in the AI's response. */
export function restoreRedaction(text: string, rules: RedactionRule[]): string {
  let output = text;
  for (const rule of rules) {
    const keyword = rule.keyword.trim();
    if (!keyword) {
      continue;
    }
    const token = tokenFor(rule);
    output = output.replace(new RegExp(escapeRegExp(token), "g"), keyword);
  }
  return output;
}

interface ChatMessage {
  role: "system" | "user";
  content: string;
}

async function callOpenRouter(
  settings: AppSettings,
  messages: ChatMessage[],
): Promise<string> {
  const apiKey = settings.openRouterApiKey.trim();
  if (!apiKey) {
    throw new Error("No OpenRouter API key configured.");
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
    throw new Error("Could not reach OpenRouter. Check your network connection.");
  }

  if (!response.ok) {
    let detail = "";
    try {
      const errJson = (await response.json()) as { error?: { message?: string } };
      detail = errJson?.error?.message ?? "";
    } catch {
      detail = "";
    }
    throw new Error(
      `OpenRouter request failed (${response.status})${detail ? `: ${detail}` : ""}.`,
    );
  }

  const data = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) {
    throw new Error("OpenRouter returned an empty response.");
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
 * Run an AI writing action. All outbound text is redacted using the configured
 * rules; placeholders are restored in the returned text.
 */
export async function assistText(params: AssistParams): Promise<string> {
  const { action, fieldLabel, fieldText, context = "", itemContext = "", settings } = params;
  const rules = settings.redactionRules;

  const system =
    `You are an expert assistant helping a CISO write a quarterly cyber security board report. ` +
    `Write clearly and concisely for a non-technical board of directors. ` +
    `Always respond in ${languageName(settings)}. ` +
    `Return only the requested field text — no preamble, no explanations, no quotation marks, no markdown code fences, ` +
    `and never prefix your answer with the field name or a label like "Field:".`;

  const safeField = applyRedaction(fieldText, rules);
  const safeContext = applyRedaction(context, rules);
  const safeItemContext = applyRedaction(itemContext, rules);
  const userPrompt = buildUserPrompt(action, fieldLabel, safeField, safeContext, safeItemContext);

  const raw = await callOpenRouter(settings, [
    { role: "system", content: system },
    { role: "user", content: userPrompt },
  ]);

  return stripLabelEcho(restoreRedaction(raw, rules), fieldLabel);
}
