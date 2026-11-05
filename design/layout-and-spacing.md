# Layout and spacing

## App structure

The desktop shell is a persistent left navigation sidebar next to a flexible main area. The sidebar contains workspace filters, selectable session rows, configuration navigation, and daemon/account information. The top bar provides page context, while page content is centered and width-limited. Below 760px the sidebar stacks above the main area and session rows scroll horizontally.

## Current layout references

These are present in `src/App.css`; they are reference points, not a mandate to force every component to the same dimensions.

| Pattern | Current value |
| --- | --- |
| Sidebar width | 252px; 228px below 1050px; full-width stacked navigation below 760px |
| Top bar height | 60px; 52px below 760px |
| Main page max width | 1320px for dashboard/detail/workspace pages |
| Main page padding | 35px 40px; reduced at tablet/mobile breakpoints |
| Main content max width | 1480px |
| Card radius | Commonly 8–12px |
| Control radius | Commonly 5–9px |
| Base card border | 1px solid a dark neutral border |

## Spacing approach

The existing CSS uses compact spacing values, commonly around 4, 7–14, 17–20, and 24–40px, with CSS declarations often tuned per component. Reuse nearby spacing and preserve visual grouping rather than introducing an unrelated scale. Keep gaps consistent within repeated grids, forms, and toolbars.

## Responsive behavior

- At 1050px, reduce the sidebar and page gutters and simplify less-critical table columns.
- At 760px, stack the sidebar above the main area, make session rows horizontally scrollable, stack detail content, and collapse multi-column forms and grids.
- At 480px, stack page headings and hide secondary metadata where necessary.
- Preserve task identity, status, primary actions, and review affordances at all widths.
- Keep the new-task prompt visually primary; allow its repository/agent/model toolbar to wrap at narrow widths.
- Avoid horizontal overflow; allow dense data regions such as code diffs to scroll within their own container.

## Surfaces and density

Use subtle surface and border separation rather than heavy shadows. Group related information inside a panel and keep controls visually distinct from static content. Compact metadata may be dense, but primary task titles, warnings, and decision controls should remain easy to find.
