# Colors

The values below reflect the current UI in `src/App.css`. Some component styles still use literal colors instead of CSS variables; the table documents their present visual roles, not a fully centralized implementation.

## Core palette

| Role | Value | Current usage |
| --- | --- | --- |
| App background (`--bg`) | `#101116` | Main canvas and page background |
| Surface (`--surface`) | `#17191f` | Cards, panels, and form surfaces |
| Raised surface (`--surface-raised`) | `#1d2027` | Elevated content (available token) |
| Hover surface (`--surface-hover`) | `#232630` | Interactive surface hover (available token) |
| Sidebar | `#14151b` | Navigation rail |
| Input background | `#111319` | Text fields and diff background |
| Border (`--border`) | `#2a2d37` | Shared border token; components also use close variants |
| Primary text (`--text`) | `#e8eaf0` | Main content text |
| Muted text (`--muted`) | `#8d929f` | Supporting copy |
| Subtle text (`--subtle`) | `#626775` | Placeholders and low-emphasis content |

## Brand and actions

| Role | Value | Usage |
| --- | --- | --- |
| Accent (`--accent`) | `#9c8cff` | Focus ring, active indicator, and accent details |
| Strong accent (`--accent-strong`) | `#846df3` | Checkbox accent |
| Primary action fill | `#b6a8ff` | Main buttons and selected emphasis |
| Brand mark gradient | `#a18eff` → `#6952d8` | Sidebar “C” mark |
| Informational blue (`--blue`) | `#70a7ff` | Running and informational states |

Primary buttons currently pair a pale violet fill with dark foreground text. Preserve clear text contrast and keep focus styling visible against both surfaces and controls.

## Semantic status palette

| Meaning | Accent | Typical dark treatment |
| --- | --- | --- |
| Success / ready | `#63d4a0` | `#20372a`–`#244333` |
| Warning / awaiting action | `#f0bc65` | `#3a3023`–`#493a26` |
| Error / rejected / failed | `#f07d82` | `#3b262b`–`#3d272c` |
| Running / information | `#70a7ff` | `#233149`–`#25364e` |
| Neutral / queued | `#c6bddf` | `#2b2838` |

Use semantic color consistently, and pair it with text, an icon, or another non-color cue. Exact status surface/border values vary by component; check `src/App.css` before introducing a new pattern.

## Guidance

- Use dark neutrals for large areas; reserve saturated colors for actions, focus, and status.
- Do not use the semantic status colors interchangeably.
- Avoid low-contrast muted text for essential instructions or state.
- When changing a repeated palette value, update the CSS and [design-tokens.json](design-tokens.json) together.
