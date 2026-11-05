# Components and interaction patterns

These patterns describe the current application in `src/App.css` and its React components. Reuse existing classes and component behavior where possible; this document is not a request to rebuild the CSS architecture.

## Actions

- **Primary:** pale violet fill, dark text, medium/semibold label. Use for the main action in a region.
- **Secondary:** dark filled surface with a neutral border. Use for alternate or reversible actions.
- **Danger:** red-tinted surface and label. Use only for consequential or destructive actions; make the effect explicit.
- **Success:** green-tinted treatment. Reserve for a successful or ready state.
- **Text/link:** transparent background with violet text; use for lightweight navigation or secondary inline actions.

Buttons should have visible hover and keyboard-focus states. Disabled controls must look and behave disabled.

## Cards and panels

Use a dark surface, subtle neutral border, and approximately 8–12px corner radius. Keep related card content grouped, with a clear title, supporting text, and actions. Metric cards use a small colored icon tile; color should reinforce, not replace, the metric label.

## Status and feedback

Status badges use compact text, a tinted background, and a border. The current task statuses distinguish running (blue), awaiting approval (amber), approved (green), and rejected/failed (red); queued/stopped are neutral-violet. Always show a readable status label alongside color.

Notices, empty states, provider status, and daemon connectivity should explain what happened or what the person can do. Do not describe a local queue connection as active agent execution.

## Forms

Labels sit above controls. Inputs use a dark inset surface, neutral border, and a violet focus treatment. Error, warning, and success messages use separate semantic treatments. Keep field help close to the relevant field and preserve clear submit/cancel actions.

The new-task landing view uses a large natural-language prompt as the primary control, with repository, agent, model, and submit controls grouped in a compact toolbar. Keep per-phase model routing in a secondary disclosure. The composer must state clearly that the current local daemon queues and tracks tasks but does not execute them.

The sidebar lists real task sessions by title and readable status; the selected session has a distinct surface and a semantic current-page state. Keep task filters, project/configuration navigation, daemon connectivity, and account controls available alongside that list.

## Data and review

Task lists prioritize task identity and status, then agent/model and secondary metrics. The change-review panel distinguishes added lines (green), removed lines (red), and hunk metadata (blue). Preserve file paths, line context, and explicit approve/reject actions in review flows.

## Interaction states

For interactive components, account for default, hover, focus-visible, active/selected, disabled, loading, and error states where relevant. Use semantic HTML and accessible names; do not rely on hover alone to reveal an action.
