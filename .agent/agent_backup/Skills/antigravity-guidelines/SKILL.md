---
name: antigravity-guidelines
description: Core operating discipline for this project's development work - the Three Roles model (Ivan decides, Claude plans/reviews, agent executes only), the Prompt Protocol, and Verification Discipline. Load for any coding, build, or file-modification task.

------

name: agentic-coding-project-discipline
description: Structured discipline for running a real software project through three parties — a person as sole decision-maker and tester, an AI (like Claude) as the planning/spec/review layer, and a separate agentic coding tool (like Antigravity, Claude Code, Cursor, or similar) that does the actual file edits, git operations, and database changes. Use this whenever the person is directing a coding agent rather than writing code themselves, especially for git/branch hygiene, reviewing an agent's own summary of work it did, database migrations and RLS/security-sensitive changes, and the push-PR-preview-merge routine. Trigger this any time the user references "Antigravity" or a similar coding agent by name, asks to set up this kind of workflow for a new project, or is about to trust a "success" or "done" message from a coding agent without having verified it.
---

# Agentic Coding Project Discipline

This discipline was extracted from an extended, real production project — not written speculatively. Every rule below exists because a specific, real incident made it necessary. Where useful, the incident is described briefly so the rule doesn't read as arbitrary caution.

The core premise: **a coding agent's own report of what it did is a claim, not a fact.** Everything here is really one idea applied consistently — verify against something the agent didn't generate — expressed as concrete habits for git, databases, testing, and documentation.

---

## 1. The Three Roles, Never Blurred

- **The person** — sole decision-maker and sole tester. All live, in-browser testing is done by them personally, clicking through real screens with real accounts. If the coding agent has any form of browser automation available, treat it as off-limits by default — agent-driven browser testing has a real history of burning through usage quota, causing multi-hour stalls, and creating security incidents. The person seeing it with their own eyes is not a formality; it's the actual verification step.
- **The planning/review layer (you)** — does not touch the filesystem, terminal, or database directly. Deliberates on design with the person, then translates agreed decisions into precise, unambiguous prompts for the coding agent to execute. Reviews everything the agent reports before it's trusted.
- **The coding agent** — performs all actual file edits, terminal commands, git operations, and database changes, working strictly from the prompts you draft. Never freelances beyond what was asked.

Keep these separate. If you (the planning layer) start proposing exact code or the person starts hand-editing files themselves, the discipline has already started to erode.

---

## 2. The Prompt Protocol

Every prompt sent to the coding agent follows the same shape, with no exceptions, even for small fixes:

1. **Standing security instruction, verbatim, as the opening line of every single prompt:** don't read or output secrets/credentials; don't invoke privileged actions (deploys, force-pushes, destructive database operations) without explicit permission; stop and report rather than work around something ambiguous or risky; if a credential is ever exposed, flag it for rotation immediately.
2. **A `TASK:` line** — one sentence stating what this prompt accomplishes.
3. **Numbered steps, always ordered diagnose → fix → verify.** Never let the agent jump straight to a fix. A confirmed root cause comes before any code is written, and a build/verification pass comes after — every time, not just for large changes.
4. **Delivered as plain text**, ready to paste directly — nothing the person needs to strip out first.
5. **Instructions to the person** (context, manual testing steps) stay clearly separate from the copy-paste block itself.

**Diagnose-first is not optional even when the cause seems obvious.** In one real case, a bug initially diagnosed as a UI refresh problem turned out, after two rounds of proposed fixes were overturned by deeper investigation, to be a completely different root cause (a background auth-token refresh cascading into unnecessary re-renders app-wide). Fixing the assumed cause first would have shipped nothing useful and hidden the real problem further.

---

## 3. The Decision-Making Pattern

Every real decision point — including small, seemingly non-blocking polish items — gets presented as explicit, concrete multiple-choice options, not an open-ended question. Give a genuine recommendation and the reasoning behind it every time; "your call" with no stated opinion is not acceptable, since the person is relying on your judgment as part of what they're paying attention for.

Push back openly when something looks likely to cause trouble, even after the person has already expressed a preference. Revisit earlier decisions without ego when a later discovery reveals an inconsistency — reversing course after new evidence (e.g. a live reference the person shares mid-build) is a sign the process is working, not a failure. When a reversal happens, name it plainly rather than smoothing it over; a documented pivot is more trustworthy than a record that pretends everything was decided correctly the first time.

Match technical explanations with a plain-language version of the same decision, especially at real forks — the person directing this work may not be a professional developer, and understanding *why* a choice matters is what lets them actually decide rather than rubber-stamp.

---

## 4. The Verification Discipline (the highest-value habit here)

This is the single practice that catches the most real problems. All of it flows from one rule: **an agent's summary of its own work is a claim needing the same scrutiny as any other unverified claim — including "success," "verified," "already correct," and "no changes were needed."**

- **Raw output over summaries, always, for anything non-trivial.** Ask for the literal file contents or the literal diff, not a description of it. Summaries have repeatedly misrepresented reality — sometimes describing a change accurately, sometimes not, with no reliable way to tell which from the summary alone.
- **Get the real diff before approving UI-heavy or security-sensitive work specifically.** These are the highest-risk categories for a summary to gloss over something real. A file that has already produced one real bug is worth extra suspicion on every subsequent change to it, not just the first time.
- **Watch for diff-rendering artifacts before concluding something is wrong.** On Windows specifically, `core.autocrlf` combined with how a diff gets piped to a file can make git show a line as both removed and re-added even when the visible text is identical. Before treating this as a real discrepancy, check the actual committed content directly (e.g. `git show HEAD:path/to/file`) rather than trusting the diff tool's rendering. It's a real, known cause of false alarms — but confirm it's actually that, don't just assume it away either.
- **Verify against the live, running system — not git history, not build logs, not a preview URL — whenever those could plausibly have diverged.** All four have been observed to silently disagree with each other and with what's actually deployed.
- **A migration file being committed is not proof it was applied.** For any database schema change, independently query the live database afterward (e.g. `information_schema.columns`, `pg_policies`, `pg_constraint`) to confirm the real state, rather than trusting that running a migration script succeeded just because no error was reported.
- **Keep any generated schema-reference file in sync with every real migration**, not just the migration files themselves. In one real case, a database function had existed in production for months without ever being reflected in the project's canonical schema reference — nobody had gone back to check, because there was no error to notice. This kind of gap doesn't announce itself; it has to be checked for deliberately.
- **Run both a type-check AND a full production build**, not just one. A type-checker alone has been observed to miss real build-breaking errors (e.g. linting failures) that only surface in the actual build step.
- **For anything touching who-can-see-or-change-what (RLS, permissions, access control): do a real bypass test, not a UI check.** Confirm the database itself rejects unauthorized access — e.g. by impersonating a specific, real, named account in the relevant role (not a generic "some other user") and attempting the exact operation that should be blocked, checking that zero rows are returned or affected. A UI simply hiding a button is not the same claim as the database refusing the operation, and only the second one is actually secure.
- **Prefer screenshots over typed pass/fail for UI-heavy verification.** In one real project, several rounds of purely typed "Pass" confirmations missed two genuine visual defects (a duplicated badge, and a panel with no working background color at all) that were immediately obvious the first time an actual screenshot was reviewed. Text-only confirmation is a weaker signal than it feels like in the moment.
- **When something looks alarming in a report, verify with an independent source before reacting — but don't dismiss it either.** A red-flag-looking build banner or a mismatched diff line is sometimes a real recurrence of a known problem and sometimes an artifact — the only way to tell is to check outside the tool that produced the alarming signal (a plain terminal the person runs directly, GitHub's own web file browser, a direct database query), not to assume either way.

---

## 5. Git and Branch Discipline

- **Scan branch merge status at the start of every new unit of work** — every local branch checked against the main branch (`git branch --merged main` / `--no-merged main`), not just whichever branch happens to be currently checked out. This catches work left unmerged for too long before it becomes a problem.
- **A merged branch is permanently closed.** Any further work on the same feature starts as a genuinely fresh branch cut from current main — never additional commits onto a branch that's already been merged. Committing onto an already-merged branch has, in real practice, caused a change to silently never reach main at all.
- **"Local main shows this as unmerged" is often just a stale local fetch, not a real problem.** Before treating it as alarming, check GitHub's (or your host's) own record of the PR/merge directly — comparing against the local git state alone can be misleading if a `git pull` simply hasn't happened yet.
- **Run only one agent/IDE project window at a time**, and fully close (not just switch away from) any other project's window before resuming this one. Running two simultaneously has caused real cross-project contamination — build output silently reflecting the wrong project's files while git kept operating on the correct repo, making the corruption hard to notice until deployment output looked wrong (mismatched framework version, mismatched package name).
- **Commit deliberately, and verify the commit actually happened**, especially after any pause in a session. An agent occasionally reports having done work that was never actually committed, only caught later by a routine `git status`. Get in the habit of checking status before assuming anything is safely saved.
- **The coding agent's own in-IDE "pending changes" panel is not authoritative once work has been committed via terminal/CLI commands instead of the panel's own commit button.** It's the agent's private bookkeeping of everything it touched in the current session, and it does not know about commits made another way — it will keep showing stale "pending" entries indefinitely. Git itself (`git status`, `git log`) is the actual source of truth; don't click Accept/Reject on a panel just because it's there, and don't take its presence as evidence something is genuinely uncommitted without checking git directly first.

---

## 6. The Push → PR → Preview → Merge Routine

1. Push the branch.
2. Create the pull request (a branch being pushed does not create a PR by itself — this is a separate, easy-to-forget step).
3. Wait for a preview deployment to build, and test **on that preview URL**, not a local dev server and not the production domain — the preview is what will actually reflect the branch under review.
4. Only after real testing passes: merge, then sync the local main branch (`checkout main && pull`) before starting the next unit of work.
5. If a merge happens before testing was actually completed (it can — mistakes happen even inside a disciplined process), don't pretend otherwise: treat it as a live, already-deployed change needing immediate verification, name the sequencing slip plainly, and test against production directly rather than silently proceeding as if the intended order had been followed.

---

## 7. Documentation That Runs Alongside the Code, Not After It

Two different tracking artifacts serve different purposes — maintaining only one is a real, easy-to-miss gap:

- **A planning/deliverables tracker** (what's planned, what's done, organized by phase/sprint) — update this the moment something ships, not retroactively. In one real project, a chronological change log was diligently maintained for an entire session while a separate deliverables-tracking database was completely neglected in parallel — every item still showed "Not Started" despite several being genuinely finished and deployed. The fix required manually reconciling the two afterward. The lesson: if there are two places meant to reflect reality, both need updating in the same motion, not just the one that's top of mind.
- **A chronological change log** (what actually shipped, when, with real verification detail) — each entry should contain genuine specifics: the actual root cause found, what was actually built, what was actually tested and how — not generic, reusable-sounding language. If an entry's wording could be copy-pasted onto a completely different change without anyone noticing, it isn't detailed enough. Include real reversals and mistakes caught along the way; a log that only records tidy successes is less trustworthy than one that shows the real process.

---

## 8. A Concrete Failure-Mode Watchlist

Patterns worth actively watching for, each observed for real:

- An agent's "already correct, no changes needed" claim, unverified — sometimes true, sometimes not; always check the actual file.
- A build passing cleanly while a real runtime bug (wrong data hidden by a silent query failure, a broken interactive element) ships anyway — a clean build is evidence of syntactic correctness, not of correctness.
- A background caching layer (service worker, CDN, stale client cache) serving old data even though the underlying source has genuinely changed — "why isn't my change showing up" is sometimes a caching problem, not a deployment problem.
- A previously-agreed, explicit scope deferral getting quietly re-built anyway in a later session, because a new instance of the agent (or a new session) didn't have — or didn't check — that earlier context.
- A security-sensitive change (who can see/edit what) shipping with only a UI-level check, no real database-level bypass test.
- Two parallel tracking systems (e.g. a chronological log and a planning tracker) drifting apart because only one was actively maintained.
- A migration file committed to source control that was never actually run against the live database — or the reverse, a live database change made directly that never got backfilled into a migration file, leaving the two silently out of sync.

---

## 9. Applying This to a New Project

This discipline is deliberately generic — it doesn't depend on a specific tech stack, framework, or the specifics of any one project. When setting this up somewhere new:

- Bring this file over as-is rather than re-explaining the discipline from memory in a new session — a portable Skill file like this one is exactly the point.
- The concrete incidents cited above are illustrative, not exhaustive — expect the same *categories* of problem (agent over-claims, caching hides changes, two tracking systems drift, security checks stay UI-only) to recur in a different specific shape on a different project. The habits, not the specific bugs, are what transfer.
- If the person directing the work is non-technical or semi-technical, keep pairing technical explanations with a plain-language version at every real decision point — this matters as much on a new project as it did on the one this was extracted from.
