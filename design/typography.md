# Typography

## Font families

- **UI:** `DM Sans`, with `Segoe UI`, then system sans-serif fallbacks. The root stack is declared in `src/App.css`; ensure the font is actually available/loaded before relying on it across platforms.
- **Technical metadata:** `JetBrains Mono`, with `Consolas` and monospace fallbacks. Used for IDs, counts, paths, timestamps, table labels, and code/diff content.
- **Fallback:** use the platform sans-serif stack for general interface text and monospace for code or tabular technical values.

## Hierarchy

The current interface is compact and information-dense. The approximate sizes below summarize existing patterns; match the nearest component style rather than adding a new global scale casually.

| Role | Current range / example |
| --- | --- |
| Page title | 24–32px, weight 600, tight tracking |
| Section / card title | 12–20px, weight 600 |
| Body and form copy | 10–12px, regular |
| Labels, metadata, badges | 8–10px; monospace for technical metadata |
| Metrics | 22px, semibold monospace |
| Diff/code | 9px with approximately 1.65 line-height |

## Usage

- Use DM Sans for headings, body copy, navigation, controls, and prose.
- Use JetBrains Mono for values that benefit from alignment or a technical character; avoid setting whole paragraphs in monospace.
- Use weight and color before adding more font sizes to establish hierarchy.
- Keep line-height comfortable for explanatory copy and dense data readable at desktop and narrow widths.
- Use sentence case for labels and headings; uppercase is reserved for small eyebrow labels and table metadata.
- Avoid relying on font weight alone to communicate status or importance.
