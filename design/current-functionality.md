# What works today, and what is demo content

Written for the November 2026 redesign. The redesign changes how screens look. It does not change what the app sends
to the daemon or the cloud server, or what it saves. In the app, everything in the "Demo" column carries a purple
dashed **Demo** label (or "Not wired yet").

## Screen by screen

| Screen | Works today | Demo or not wired |
| --- | --- | --- |
| **Sign in / Create account** | Calls the cloud server (`/auth/login`, `/auth/signup`, `/auth/social`, `/health`). Saves the device token. If the server is unreachable it signs you in on this laptop only | GitHub and Google do **not** do a real OAuth login: they send a placeholder name and email. "Forgot password" does nothing |
| **Top bar and sidebar** | All pages, live task lists, back and forward, hide sidebar (Ctrl+B), daemon status, notifications from real tasks, theme switch (not remembered after restart) | |
| **Command palette** (Ctrl+K) and Ctrl+N | Navigation, new task, theme switch | |
| **Home** | Waiting and running tasks, recent runs, spend, your projects with approved counts, run a task on a project (fills in the folder), search, filters, grid or list, stars (not saved), link to the review queue | Sample projects when you have none. The five-step bar says "Estimated" unless the daemon sent step events |
| **New task** | Sends the `start` command with folder, task text, agent, model, and a model per step when that is on | The model names in the lists are fixed |
| **All tasks** | Search, All / Active / Review filters, project filter, open a task, delete finished tasks | |
| **One task** | **Approve, Reject, Stop, Resume, Delete**, failure reason, cost, time, model, live events in Logs and Timeline, Copy logs, **the real diff when the daemon stores one** | "Message the agent". **Sample code when there is no diff**. Sample comments. Commit message and file ticks (not sent). Split view and log level filter. Reports tab, including the milestone wording. Sample log and timeline lines when a task has no events |
| **Review queue** | Lists waiting tasks, **Approve & commit, Reject**, open the task | |
| **Projects** | Your projects, filter, a page per project with runs, counts and spend, new task on a project. "Add project" only opens New task with that folder | Sample projects when you have none. Project health. Branch and remote. Workflow, Memory and Settings tabs |
| **Insights** | Task count, approval rate, spend, projects, models used, 14-day chart, recent tasks | The 7/30/90 day buttons do not filter |
| **Settings → Account** | Sign in, sign up, sign out, save display name (on this laptop) | Password change, device identifier, cloud sync |
| **Settings → General** | Dark and light theme | Density, notification choices, workspace folder and port |
| **Settings → other pages** | The three shortcuts listed as working | AI & model routing, planned shortcuts |
| **Terminal strip** | Connection status and the counts it repeats | Every reply is canned text. It is not a shell |
| **Workflows, Models & Routing, Repository Memory, Scheduler & Queue, Environments, Runtime & Logs, Integrations, Security** | Nothing. Local clicks and edits only | All of it. Each is tagged **Demo** in the sidebar |

## How to try it

1. In `codehands-desktop`, start the daemon with the demo runner: `$env:CODEHANDS_RUNNER = 'fake'; node local-daemon-bridge.mjs`
2. In a second terminal: `pnpm dev`, then open http://localhost:1420 (the desktop window needs Rust: `pnpm tauri dev`).
3. In New task, choose **Claude Code CLI**, enter the folder of a throwaway git repository, describe a task, and start it.

The demo runner replays a fixed script. It does not read your task, edit files, create a branch or commit.

## How this was checked

- **Behaviour comparison, before and after.** A script ran the app in a headless browser with a stand-in daemon and a
  stand-in cloud server, and recorded everything the app sent or saved. 41 scenarios, 49 recorded messages (daemon
  commands, HTTP requests, saved settings, copied text): identical to `main`. 57 on-screen checks: unchanged. The
  script's way of moving around was updated for the new layout; what it checks was not. Its reconnect check now waits
  for the reconnect instead of a fixed 2.6 s.
- **Real local daemon.** With `local-daemon-bridge.mjs`, the backend watcher (demo runner), a throwaway database and
  a throwaway git repository: start and approve, start and reject, delete, stop, resume. 10 of 10 steps passed.
- **Screens.** Captured at 1440×900 and at the 1024×700 minimum, checked for sideways overflow and console errors.
  The sample-code warning was checked both ways: shown without a diff, hidden with a real one.
- Not covered: the packaged Tauri window, a real Claude Code run, a real cloud server, and use by another person.
- The test script is not part of this repository.

## Changed on purpose

- All 14 pages stay in the sidebar, in the old three groups. Overview is now "Home", Tasks "All tasks", Usage &
  Analytics "Insights". The top bar spans the window; live task lists sit under the pages.
- Duplicate controls removed: the top bar's second "New Task" button, the sidebar search box, the second set of
  Approve, Reject and Stop buttons, and a sidebar user menu that nothing could open.
- All tasks is its own page, and a task opens full width. The task list's resize, collapse and "Maximize" are gone.
  "Execution" is "Summary" and "Artifacts" is "Reports". Sample comments start closed.
- Projects shows cards first, then one page per project.
- Settings: General now holds theme and notifications.
- Home no longer has the fixed "AI Model Orchestration" box. Models & Routing covers that.
- Cards for real projects no longer show made-up values ("5 phases", "GSD", "main", "Just now"). A real project with
  no runs shows 0 tasks, not 8. Project pages show real counts and spend; the old made-up numbers are folded under
  "Project health (Demo)".
- Review no longer says "Tests passing, staged": nothing had checked that. In the five-step bar, "Test" turns green
  only when the daemon reports a test step.
- New warnings, which change no behaviour: sample code is flagged wherever you can approve; New task says which agents
  the daemon cannot run; sign-in says the password is not checked while the server is down.
- Not built from the design: the review verdict, grouped changes, plan approval and line comments. Each needs backend
  work first.
- Build: 30 TypeScript errors on `main` are fixed with type-only changes (`src/types/auth.ts`).

## Problems found, not fixed here

These change behaviour, so each deserves its own pull request.

1. **The daemon the app starts never stores a diff** (`daemon/src/watcher.ts` in codehands-backend; only the
   `fake.ts` command-line script does). So in the running app the Changes tab shows sample code, next to a real
   Approve button.
2. `parseDiffToFiles` splits a standard `git diff` into two entries for each changed file. The first has no code.
3. New task selects "CodeHands Native Orchestrator" by default, which the daemon cannot run.
4. With the cloud server down, sign-in accepts any password.
5. Insights shows every Claude model as "Claude 3.5 Sonnet".
6. The desktop saves the device token in a plain file under `~/.codehands`, not in the system keychain.
