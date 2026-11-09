# Accessibility

This checklist supplements the existing UI patterns; verify actual contrast and behavior when changing the interface.

## Keyboard and focus

- Keep every interactive element keyboard reachable and in a logical order.
- Preserve the global `:focus-visible` outline from `src/App.css`; do not remove it without providing an equally visible replacement.
- Ensure focus remains visible on dark surfaces, buttons, inputs, tabs, and modal controls.
- Support keyboard operation for dialogs and provide a clear, reachable close action where dismissal is allowed.

## Color and text

- Never communicate task state, validation, or selection with color alone; include text, an icon, or another cue.
- Check text and control contrast against their actual backgrounds, especially small muted labels and badges.
- Do not reduce essential instructions to the smallest metadata size.
- Respect browser/system text scaling and avoid clipping important labels at narrow widths.

## Semantics and assistive technology

- Use native buttons, labels, inputs, headings, lists, and dialog semantics where appropriate.
- Give icon-only controls an accessible name, and ensure decorative icons are hidden from assistive technology.
- Maintain a meaningful heading hierarchy and announce important asynchronous state changes when appropriate.
- Associate field errors and descriptions with their controls.

## Motion and responsive use

- Avoid unnecessary animation; honor reduced-motion preferences when adding motion beyond brief state feedback.
- Ensure hover-only cues have keyboard and touch equivalents.
- Check layouts at narrow widths and high zoom so primary actions and review controls remain available.
