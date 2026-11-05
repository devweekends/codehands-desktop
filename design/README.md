# Code Hands design system

This folder documents the visual language currently used by the Code Hands desktop app. The React UI is implemented in `src/App.css`; treat that stylesheet as the source of truth when documenting existing behavior. If a design document and the running UI disagree, update the docs or the UI deliberately rather than assuming the change is already implemented.

## Documents

- [Brand](brand.md) — product identity, voice, and visual principles.
- [Colors](colors.md) — current palette, semantic roles, and status colors.
- [Typography](typography.md) — font families, hierarchy, and usage.
- [Layout and spacing](layout-and-spacing.md) — responsive structure, spacing, and shape conventions.
- [Components](components.md) — shared UI patterns and interaction states.
- [Accessibility](accessibility.md) — keyboard, contrast, semantics, and motion guidance.
- [Design tokens](design-tokens.json) — a machine-readable snapshot of frequently reused values.

## Product context

Code Hands is a local-first desktop workspace for delegating coding tasks, tracking local sessions, and reviewing changes. Keep the interface clear about what happens locally and what involves cloud account features. Avoid implying that planned or unavailable capabilities are already active.

## Working with the system

1. Inspect the relevant component and `src/App.css` before changing UI.
2. Reuse existing CSS custom properties and established component patterns where practical.
3. Keep this documentation and `design-tokens.json` aligned with implemented values; the JSON file is a reference snapshot, not an imported runtime theme.
4. Check narrow layouts and keyboard focus whenever an interaction or layout changes.
