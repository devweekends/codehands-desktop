# Components

The CodeHands AI component system provides cohesive, reusable interactive primitives across all engineering modules.

## Primitives

### 1. Buttons & Action Bars
- **Primary:** Violet background (`#7857FF`), white text (`#F4F5FA`), subtle hover lift and focus glow.
- **Secondary:** Surface background (`#141827`), border (`#272D40`), hover state (`#1A2031`).
- **Danger / Stop:** Red tone (`#FF647C`), used for aborting active agent runs or rejecting changes.
- **Icon Buttons:** Compact, 28x28px or 32x32px square buttons for view switching, expand, and filters.

### 2. Navigation & Sidebar
- **Section Headers:** Uppercase tracking (`0.06em`), muted text (`#687087`).
- **Active Route Items:** Highlighted background (`rgba(120, 87, 255, 0.1)`), left accent bar (`#7857FF`), white text.
- **Badges:** Compact status pills (e.g., pending tasks, warnings, active runs).

### 3. Task & Project Cards
- **GSD / Active Badge:** Violet pill with glowing accent.
- **Progress Trackers:** Gradient bar (`#7857FF` to `#27B7F5`) showing completed phases / tasks.
- **Metadata Footers:** Branch name (`JetBrains Mono`), last updated timestamp, quick actions.

### 4. Diff Viewer (Unified & Split)
- **Deleted Lines:** Background `rgba(255, 100, 124, 0.15)`, red indicator, line numbers.
- **Added Lines:** Background `rgba(32, 201, 151, 0.15)`, green indicator, line numbers.
- **Inline Comments:** Dedicated discussion cards with file and line range references, feedback tags, and "Export for Agent" actions.

### 5. Terminal & Execution Logs
- **Terminal Canvas:** Obsidian background (`#0B0D16`), monospace font (`JetBrains Mono`), color-coded levels (`INFO`, `WARN`, `ERROR`, `SUCCESS`).
- **Docked Drawer:** Collapsible bottom tray with quick terminal access and daemon health.

### 6. Workflow Nodes & Fallback Chains
- **Node Cards:** Surface (`#141827`) with state indicators (Analyze, Plan, Implement, Test, Review).
- **Fallback Connectors:** Visual flow arrows linking primary models (e.g. GPT-4o -> Claude 3.5 -> Llama 3.1 -> Mistral).
