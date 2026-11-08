# Typography

CodeHands AI uses a dual-type system designed for clarity, data density, and technical precision.

## Font Families

- **Primary UI:** `Inter`, with fallbacks to system sans-serif (`-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, `Roboto`, `sans-serif`). Used for all headings, body text, buttons, modals, and navigation controls.
- **Technical & Code:** `JetBrains Mono`, with fallbacks to `Consolas`, `Menlo`, `monospace`. Used for code snippets, diffs, terminal outputs, execution logs, IDs, Git branches, tokens, and technical telemetry.

## Hierarchy & Scales

| Role | Font Family | Size | Weight | Line Height | Tracking |
| --- | --- | --- | --- | --- | --- |
| Hero / Page Title | Inter | 22–26px | 600 / SemiBold | 1.25 | -0.02em |
| Section Header | Inter | 16–18px | 600 / SemiBold | 1.3 | -0.01em |
| Card Title / Subhead | Inter | 13–14px | 600 / SemiBold | 1.4 | 0 |
| Body Text | Inter | 12–13px | 400 / Regular | 1.5 | 0 |
| Small / Captions | Inter | 11–12px | 500 / Medium | 1.4 | 0.01em |
| Eyebrows / Section Labels | Inter | 10–11px | 600 / SemiBold | 1.2 | 0.06em (Uppercase) |
| Code / Diff / Logs | JetBrains Mono | 11–12px | 400 / 500 | 1.6 | 0 |
| Numbers & Badges | JetBrains Mono | 11–12px | 500 / SemiBold | 1.2 | 0 |

## Rules

- Always render code changes, diff lines, terminal messages, and commit SHAs in `JetBrains Mono`.
- Headings and action labels utilize `Inter` with tight letter spacing for a modern, crisp feel.
- Maintain consistent line height in terminal and diff views to prevent jitter when scrolling through large outputs.
