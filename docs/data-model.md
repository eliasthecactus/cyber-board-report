# Data model

Reports and settings live only in the browser (IndexedDB database
`cyber-board-reports-local`, stores `reports` and `settings`). The JSON backup
and single-report export files use the same shapes, so this document is also
the file format reference.

The source of truth for the types is [`src/types.ts`](../src/types.ts); the
code that validates and upgrades data is `normalizeReport` in
[`src/lib/reportFactory.ts`](../src/lib/reportFactory.ts).

## Report (`schemaVersion` 3)

| Field | Type | Notes |
|---|---|---|
| `schemaVersion` | number | Shape version, see [Versioning](#versioning) |
| `id` | string | Unique; regenerated on import if it already exists |
| `quarter` | `"Q1"`–`"Q4"` | |
| `year` | number | |
| `createdAt`, `updatedAt` | ISO 8601 string | |
| `createdBy` | string | Local display name |
| `title`, `presenter` | string | Empty means the default title / `createdBy` |
| `participants` | string[] | |
| `showRiskMatrix` | boolean | Top-risks slide layout |
| `hideEmptySlides` | boolean | Drop slides without content from preview and exports |
| `executiveSummary`, `executiveSummaryHighlight` | string | |
| `topRisks` | Risk[] | `likelihood`/`businessImpact`: `low` `medium` `high` `critical`; `trend`: `improving` `stable` `worsening` |
| `threatLandscape`, `processItems`, `humanItems`, `technologyItems` | Item[] | `{ id, text, detail, trend: "more" \| "stable" \| "less" }`; items with empty `text` are dropped |
| `kpis` | KPI[] | `value`, optional `targetValue`, `trend` (`up` `stable` `down`), `direction` (`higher` \| `lower` is better), `historicalData: { quarter: "Q1-2026", value }[]` |
| `incidents` | Incident[] | `severity` level plus free-text impact, outcome, lessons |
| `initiatives` | Initiative[] | `status`: `on-track` `at-risk` `delayed` `not-started`; `progress` 0–100 |
| `outlook` | string | |
| `emergingRisks` | `{ description, impact }[]` | Shown under the outlook |
| `decisionsRequired` | `{ id, title, rationale, impact }[]` | |

Unknown fields are dropped, and invalid values (wrong enum, `NaN`, wrong type)
are replaced with defaults. A hand-edited file therefore can't break the
slides; at worst a field comes back empty.

## Backup file

```jsonc
{
  "version": 1,               // snapshot format version
  "exportedAt": "2026-09-27T10:00:00.000Z",
  "profile": { "displayName": "…", "updatedAt": "…" },
  "reports": [ /* Report[] */ ],
  "settings": {
    "language": "en",         // "en" | "de"
    "openRouterApiKey": "",   // empty unless explicitly included on export
    "openRouterModel": "…",
    "redactionRules": [{ "id": "…", "keyword": "Acme", "placeholder": "[COMPANY]" }],
    "logo": "data:image/png;base64,…", // only image data URLs are accepted
    "primaryColor": "#1e3a5f",
    "lastBackupAt": "",
    "updatedAt": "…"
  }
}
```

A single-report export is just one `Report` object. The importer accepts both.

When importing, the user picks what to restore. AI settings (model and
redaction rules) and the API key are **not** preselected, because they change
what gets sent to a third party.

## Versioning

| Version | Change |
|---|---|
| 1 | `threatLandscape` was one free-text string |
| 2 | Threat landscape and domain sections became structured item lists |
| 3 | `schemaVersion` stored on each report, `hideEmptySlides` added, editable `emergingRisks`, unused `Risk.historicalData` removed |

To change the shape:

1. Bump `REPORT_SCHEMA_VERSION` in `reportFactory.ts`.
2. Make `normalizeReport` accept both the old and the new shape. It runs on
   every load and import, so old data is upgraded transparently.
3. Add a case to `src/lib/reportFactory.test.ts` with an old-format fixture.
4. Add a row to the table above.
