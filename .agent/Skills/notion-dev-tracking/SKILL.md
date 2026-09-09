---
name: notion-dev-tracking
description: How to set up and maintain Sprint/Deliverable/Change-Log tracking in Notion for this project's development phase. Load when setting up sprint tracking or logging build progress.

---

name: notion-project-tracking-structure
description: Build and maintain a structured, three-database Notion project-tracking system (Sprints/Phases, Deliverables, and a chronological Change Log) that mirrors real product-development discipline, for a software or product-development project. Use this whenever the user wants to set up the same kind of Notion tracking structure used on a prior project for a new one, is missing a granular chronological record of what actually shipped alongside their planning database, or wants to audit whether their Notion records are honest and specific rather than generic. This skill covers the concrete schema and the real tool mechanics for building it. For the underlying discipline of auditing, correcting, and maintaining accuracy in existing records over time, use the complementary notion-dev-tracking skill alongside this one — that skill covers the methodology in general terms; this one covers the concrete structure and how to actually build it.
---

# Notion Project-Tracking Structure

A worked, reusable pattern for tracking real software development work in Notion — built and refined across a real production project, not designed speculatively. The core idea: **one hub page holds three related databases, each answering a different question**, rather than one catch-all list that tries to do everything and ends up doing nothing well.

---

## 1. Why three databases, not one or five

- **Sprints/Phases** — answers "what phase of work is this, and how is it going overall?"
- **Deliverables** — answers "what concrete things were planned, and what's their status?" A planning and tracking view, closer to a task list.
- **Change Log** — answers "what actually shipped, when, by whom, and how do we know it worked?" A finer-grained, chronological audit trail with genuine verification detail in full prose — separate from Deliverables because a single planned Deliverable can correspond to multiple real, individually-verified changes if the work shipped in stages.

Collapsing these into one database loses the distinction between "planned" and "actually verified as done," which is exactly the distinction that keeps records honest. Splitting into more than three tends to fragment things nobody ends up maintaining consistently — three is the balance that's actually held up in practice.

---

## 2. The hub page

One project page (e.g. "**[Project Name] Development**") holds all three databases as **inline, full-width embedded views**, plus room for narrative documentation (architecture notes, key decisions) alongside the structured data. Not three separate pages scattered around a workspace — one place a person can land and see everything.

---

## 3. The concrete schema

### Sprints / Phases
*One row per phase of work.*

| Property | Type | Notes |
|---|---|---|
| **Sprint** (title) | Title | e.g. "Sprint 6 — Strategic Dashboard" |
| **Sprint Code** | Select | One option per phase — new codes can be added mid-project without disturbing existing rows (e.g. inserting a "Sprint 6.5" between two existing phases) |
| **Status** | Status | Grouped: To-do (Not Started, Blocked) → In Progress → Complete (Completed) |
| **Focus** | Text | One-line theme |
| **Timeline** | Date range | |
| **Deliverables** | Relation → Deliverables | |
| **Deliverables (Count)** | Rollup (count) | Auto-computed |
| **Sprint Progress** | Rollup (% Completed) | Auto-computed — caveat: attaching completed work to a not-yet-started phase makes its rollup look prematurely active. Cosmetic, not a reason to avoid the attachment. |

### Deliverables
*The granular record of what was actually built — one row per real, concrete accomplishment, never a vague category.*

| Property | Type | Notes |
|---|---|---|
| **Deliverable** (title) | Title | Specific, not generic — "Fix: X breaks under Y condition," never "UI polish" |
| **Category** | Select | e.g. Infrastructure, Configuration, Database, Authentication, Deployment, Documentation, Code — adapt options to the real domain |
| **Status** | Status | Not Started, Blocked, Skipped / In Progress / Completed |
| **Sprint** | Relation → Sprints | Every real entry has exactly one |
| **Verification Method** | Text | The *real* evidence — what was actually checked, specific to this item, never boilerplate reused across entries |
| **Notes** | Text | Context, caveats, corrections, real trade-offs made |
| **Owner** | Text | |
| **Date Completed** | Date | |

### Change Log
*A chronological audit trail, separate from planning — one entry per real change shipped, with genuine diagnostic and verification detail in the page body, not squeezed into a property.*

| Property | Type | Notes |
|---|---|---|
| **Change** (title) | Title | Short, specific |
| **Date & Time** | Date (with time) | When it actually shipped |
| **Changed By** | Select | Extend as the team grows |
| **Type** | Select | Feature, Fix, Improvement, Refactor, Chore, Security |
| **Area** | Multi-select | The project's own real modules — rebuild this list per project, don't reuse another project's module names |
| **Sprint** | Relation → Sprints | |
| **Status** | Select | Merged to Main, Deployed to Production, Reverted |
| **Git Reference** | URL | PR link |
| *(page body)* | Rich text | Problem / Root Cause / Fix / Verification, written in full prose — this is where the real value of the Change Log lives, not in the properties |

A well-written Change Log entry names real specifics: what was actually wrong (including if the original bug report turned out to describe the wrong symptom), what was actually tried and reconsidered, what the real verification evidence was, and — when it happened — an honest account of a mistake caught or a decision reversed mid-build. An entry generic enough to paste onto a different change without anyone noticing has failed at the one thing this database is for.

---

## 4. How to actually build it

1. **Check for an existing structure first.** Search the target workspace before assuming nothing exists — a name like "Change Log" can already exist as loose narrative text rather than a real database. Verify, don't guess either way.
2. **Confirm the correct workspace is connected** before creating anything — a default connection can silently resolve to the wrong workspace.
3. **Create each database with a full schema in one call** (an explicit `CREATE TABLE`-style definition covering every property, type, and select option up front), not a bare database with properties bolted on one at a time afterward.
4. **Add relations by the underlying data-source ID**, not by name.
5. **Embed as inline views on the hub page** immediately after creating each database, sorted sensibly (Change Log newest-first), so the whole structure is visible in one place.
6. **Verify every creation by re-fetching it** — a tool call reporting success is not proof the properties, relations, and body content actually landed as intended. Re-fetch and check the real result.
7. **When logging a real entry, write genuine specific detail in the body.** This is what makes the record trustworthy read cold months later, by someone who wasn't in the room.

---

## 5. Ongoing maintenance

- **Log a Deliverable and a Change Log entry as each real thing ships** — not batched and reconstructed from memory later. The two updates happen in the same motion; letting one drift while maintaining the other is a real, easy-to-miss failure mode (a whole project session once maintained a detailed Change Log while a parallel Deliverables database sat completely stale, showing "Not Started" on several items that had actually shipped — caught only by a direct question, then manually reconciled).
- **Periodically query for orphaned Deliverables** (no Sprint relation) and attach them deliberately.
- **When understanding of something already logged changes, go back and correct that entry** rather than adding a new one and leaving the outdated one standing.
- **The most reliable way to query a Sprint's Deliverables** is a text match on the Sprint relation field using a fragment of the Sprint page's own ID, rather than an exact-match query — found more robust in practice.
- **Keep a separate, living backlog of open decisions and designed-but-not-yet-built work**, outside any single Sprint — either its own lightweight tracking, or wherever the person will actually see and trust it day to day.
- **Before removing what looks like a duplicate database embed on the hub page, check whether it's actually the database's real home location, not a second view of it.** A database can appear twice on a page for two very different reasons: a genuine redundant view (safe to remove), or one reference being the database's actual parent location and the other a separate view pointing at the same data (removing the first would delete the database itself, not just tidy a page). Attempting to remove the wrong one should be met with a clear validation error naming exactly what would be deleted — treat that error as the system correctly catching a real mistake, not an obstacle to push through with a force-delete flag. If there's no way to confirm which is which before acting, don't act — leave the apparent duplication alone rather than guess.

---

## 6. Pairing with the audit/correction methodology

This skill covers structure and mechanics. The companion `notion-dev-tracking` skill (if available — otherwise recreate its principles) covers the discipline of keeping records *honest* over time: using real source material instead of a summary-of-a-summary when reconstructing history, never padding entries to hit a round number, treating "success" from a tool call with the same scrutiny as any other unverified claim, and correcting mistakes in place rather than leaving duplicates. Use both together — this one for what to build, that one for how to keep it trustworthy.

---

## 7. Adapting this for a different domain

The three-database shape is domain-agnostic by design — only the **option lists** need real adaptation:

- **Sprints** might become "Phases," "Milestones," or "Releases" depending on how the new project is actually sequenced.
- **Deliverables' Category options** are mostly generic to any software build (Infrastructure, Database, Documentation, Code) and often carry over with little change.
- **Change Log's Area options** should be genuinely rebuilt around the new project's real modules — this is the one list that should never just be copied from a prior project.
- Everything else — the relations, the rollups, the verification-in-prose discipline, the "log it as it ships" habit — carries over unchanged.
