# What works today, and what is demo content

Written for the November 2026 redesign. The redesign changes how screens look. It does not change what the app sends
to the daemon or the cloud server, or what it saves. In the app, everything in the "Demo" column carries a purple
dashed **Demo** label (or "Not wired yet").

## Screen by screen

| Screen | Works today, unchanged | Demo or not wired |
| --- | --- | --- |
| **Sign in / Create account** | Calls the cloud server (`/auth/login`, `/auth/signup`, `/auth/social`, `/health`). Saves the device token. If the server is unreachable it signs you in on this laptop only | GitHub and Google do **not** do a real OAuth login: they send a placeholder name and email. "Forgot password" does nothing |
| **Sidebar and top bar** | Navigation, back and forward, hide sidebar (Ctrl+B), daemon status, notifications from real tasks, theme switch (not remembered after restart) | |
| **Command palette** (Ctrl+K) and Ctrl+N | Navigation, new task, theme switch | |
| **Home** (was Overview) | Waiting and running tasks, recent runs with cost, your projects with approved counts, run a task on a project (fills in the folder), search, filters, grid or list, stars (not saved) | Sample projects when you have none. The model routing box |
| **New task** | Sends the `start` command with folder, task text, agent, model, and a model per step when that section is open | The model names in the lists are fixed |
| **Tasks** | Task list, filters, project filter, **Approve, Reject, Stop, Resume, Delete**, failure reason, status, time, model, cost, live events in Logs and Timeline, Copy logs, **the real diff when the daemon stores one** | Progress bar (guessed from the status). Milestone view. "Message the agent" box. **Sample code when there is no diff**. Sample comments. Commit message and file ticks (not sent). Split view and log level filter (no effect). Artifacts. Sample log and timeline lines when a task has no events |
| **Review** (was Review Queue) | Lists waiting tasks, **Approve & commit, Reject**, open the task | |
| **Projects** | Projects from the daemon, filter, runs and Tasks tab, folder path, new task on a project. "Add project" only opens New task with that folder | Sample projects when you have none. Project health numbers. Branch and remote. Workflow, Memory and Settings tabs |
| **Insights** (was Usage & Analytics) | Task count, approval rate, spend, projects, models used, 14-day chart, recent tasks table | The 7/30/90 day buttons do not filter. The model split shown before any task exists |
| **Settings → Account** | Sign in, sign up, sign out, save display name (on this laptop) | Password change, device identifier, cloud sync |
| **Settings → Appearance** | Dark and light theme | Accent colour, density |
| **Settings → other pages** | The three shortcuts listed as working | General, AI & Model Routing, Notifications, planned shortcuts |
| **Terminal strip** | Connection status and the task and project counts it repeats | Every reply is canned text. It is not a shell |
| **Workflows, Models & Routing, Repository Memory, Scheduler & Queue, Environments, Runtime & Logs, Integrations, Security** | Nothing. Local clicks and edits only | All of it. They now sit under **More screens (Demo)** |

## How this was checked

- **Behaviour comparison, before and after.** A script ran the app in a headless browser with a stand-in daemon and a
  stand-in cloud server, and recorded everything the app sent or saved. 41 scenarios, 49 recorded messages (daemon
  commands, HTTP requests, saved settings, copied text): identical before and after. 57 on-screen checks: unchanged.
- **Real local daemon.** With `local-daemon-bridge.mjs`, the backend daemon watcher (fake runner), a throwaway
  database and a throwaway git repo: start a task, approve it; start another, reject it. 6 of 6 steps passed, both
  before and after.
- **Screens.** Every screen was captured at 1440×900 and at the 1024×700 minimum window and checked for content spilling
  sideways, with no console errors. The captures were also read by eye, which found a few layout faults that were then
  fixed. The sample-code warning was checked both ways: shown without a diff, hidden with a real one.
- Not covered: the packaged Tauri window, a real Claude Code run, and a real cloud server.
- The test script is not part of this repository.

## Changed on purpose

- Left menu: 14 items became Home, Projects, Tasks, Review, Insights, with the 8 demo screens under "More screens".
- Duplicate controls removed: the second "New Task" button in the top bar, the second search box in the sidebar, and
  the second set of Approve, Reject and Stop buttons at the bottom of a task. Each action now has one place (the
  Changes tab keeps its Commit button).
- A user menu in the sidebar that nothing could open was removed.
- Task screen: the middle feed and the right panel are one panel. "Maximize" now hides the task list. Sample comments
  start closed. The tab "Execution" is called "Summary".
- Cards for real projects no longer show values the app made up for them ("5 phases", "GSD", "main", "Just now").
  A real project with no runs shows 0 tasks, not 8.
- Review no longer says "Tests passing, staged": nothing had checked that.
- New warnings, which change no behaviour: sample code is flagged wherever you can approve; New task says which agents
  the daemon cannot run; sign-in says the password is not checked while the server is down.
- Command palette no longer lists shortcuts that did nothing.
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
