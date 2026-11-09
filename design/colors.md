# Colors

The design tokens and colors define the visual foundation of **CodeHands AI**, embodying a premium dark-first developer workspace theme: *"Engineering work, orchestrated."*

## Core Palette

| Role | Token Name | Hex Value | Usage |
| --- | --- | --- | --- |
| Main Canvas | `--bg-main` | `#0B0D16` | Deep obsidian desktop app shell & main workspace background |
| Secondary Canvas | `--bg-secondary` | `#101421` | Sidebar, navigation rails, and grouped panels |
| Surface | `--surface` | `#141827` | Content cards, diff panes, modals, and container surfaces |
| Elevated Surface | `--surface-elevated` | `#1A2031` | Flyout menus, active selection highlights, dropdowns, popovers |
| Primary Accent | `--accent-primary` | `#7857FF` | Electric violet for active buttons, selected nodes, brand focus |
| Secondary Accent | `--accent-secondary` | `#27B7F5` | Neon cyan for secondary highlights, links, metrics, progress |
| Primary Text | `--text-primary` | `#F4F5FA` | Headings, high-contrast values, active labels |
| Secondary Text | `--text-secondary` | `#969DB0` | Body text, descriptions, table contents, and secondary labels |
| Muted Text | `--text-muted` | `#687087` | Placeholders, keyboard shortcut hints, timestamps, subtitles |
| Border | `--border` | `#272D40` | Subtle hairline dividers, card borders, and input boundaries |

## Semantic Status Palette

| Meaning | Hex Value | Dark Background Shade | Usage |
| --- | --- | --- | --- |
| Success / Done | `#20C997` | `rgba(32, 201, 151, 0.12)` | Passing tests, approved pull requests, completed execution |
| Warning / Review | `#FFB547` | `rgba(255, 181, 71, 0.12)` | Awaiting approval, blockers, rate limit thresholds |
| Error / Failed | `#FF647C` | `rgba(255, 100, 124, 0.12)` | Execution failure, rejected changes, lint errors |
| Info / Running | `#27B7F5` | `rgba(39, 183, 245, 0.12)` | Active daemon running, streaming logs, queued tasks |

## Guidance

- Dark neutrals (`#0B0D16`, `#101421`, `#141827`) dominate large viewports to minimize eye fatigue during extended engineering sessions.
- Accents (`#7857FF`, `#27B7F5`) are used purposefully on interactive states, active workflow nodes, and critical actions.
- Text contrast strictly complies with WCAG AA standards: `#F4F5FA` and `#969DB0` provide sharp legibility across all dark surfaces.
