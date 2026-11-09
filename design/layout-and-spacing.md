# Layout & Spacing

## Layout System

CodeHands AI uses an integrated multi-panel desktop layout architecture:

### 1. Application Shell
- **Left Sidebar:** 240px default (collapsible to 64px icon-only rail). Houses Workspace, Engineering, Management, and Recents navigation.
- **Top Navigation Bar:** 52px height. Breadcrumbs, global search, command palette shortcut (`Ctrl+K`), notifications, daemon health pill, theme toggle.
- **Main View Area:** Dynamic fluid workspace with responsive container constraints.
- **Bottom Terminal Dock:** 40px collapsed bar expanding into a full terminal drawer with live daemon logs and interactive controls.

### 2. Multi-Panel Task Workspace
- **Left Panel (260px):** Task listing, live statuses, "+ New Task" trigger, and filters.
- **Center Panel (Flexible 1fr):** Prompt instructions, agent thinking state, task step checklist, and interactive input bar.
- **Right Panel (Flexible 1.2fr):** 5-Tab engineering execution workspace:
  1. **Execution:** Workflow phase timeline, model routing, progress bars, pause/stop/approval actions.
  2. **Changes:** 3-column Git change inspector, Staged/Unstaged file manager, Split/Unified diff viewer, inline review comment stream.
  3. **Logs:** Streaming terminal logs with level filtering (`INFO`, `DEBUG`, `WARN`, `ERROR`), search, and auto-scroll.
  4. **Artifacts:** Generated patch files, test results, markdown reports, and download/preview actions.
  5. **Timeline:** Chronological event stream covering task lifecycle from ingestion to review.

## Spacing Tokens

- `space-1`: 4px
- `space-2`: 8px
- `space-3`: 12px
- `space-4`: 16px
- `space-5`: 20px
- `space-6`: 24px
- `space-8`: 32px

## Border Radius

- Small (badges, pills, tags): 4px - 6px
- Standard (buttons, inputs, dropdowns): 8px - 10px
- Cards & Modals: 12px
- Full Pill: 9999px
