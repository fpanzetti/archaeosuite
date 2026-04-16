<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# AGENTS.md — AI Collaboration Entry / Constitution

This repository uses a spec-driven, CI-guarded workflow called HANDOFF.

Goals:
- Every core change is backed by specs, tasks, and session logs.
- Any agent can safely pause work and hand it off to someone else.

---

## 0. First agent checklist

1. Fill in `specs/overview.md` with project background and goals.
2. Copy `specs/features/F-000-template.md` to at least one real feature spec.
3. Initialize `SESSION_LOG.md` with the first real session.
4. Turn the demo entry in `tasks/backlog.yaml` into a real task, or add new ones.
5. Configure `CORE_PREFIXES` in:
   - `scripts/check_docs_sync.py`
   - `scripts/check_task_sync.py`
   so that CI knows which paths are considered "core".

Until `CORE_PREFIXES` is configured, the guards only print warnings and do not fail the build.

---

## 1. Recommended flow for core changes

This flow can be spread across multiple PRs / sessions:

1. Clarify
   Read existing specs, tasks, and logs. If something is unclear, record questions in `specs/notes/` or `SESSION_LOG.md`.

2. Specify (what & why)
   Update the relevant feature spec under `specs/features/` with context, user stories, acceptance criteria (they can start as TODOs).

3. Plan (how)
   Add or update a "Technical Plan" section in the feature spec, or create a file under `specs/plans/`.

4. Tasks
   Create or update tasks in `tasks/backlog.yaml`, linking them to feature IDs and (optionally) assignees.

5. Implement
   Change code under `CORE_PREFIXES`. The CI guards will require spec/log and task updates for these changes.

6. Log & handoff
   Append a session entry to `SESSION_LOG.md`. If you are not finishing the work, create/update an appropriate file under `tasks/handoff/` describing current status and next steps.

---

## 2. Directory conventions

- `specs/`
  - `overview.md` — project background and goals
  - `features/` — feature-level specs (`F-XXX-*.md`)
  - `plans/` — larger technical plans
  - `adr/` — architecture decision records
  - `notes/` — ad-hoc notes and questions

- `SESSION_LOG.md` — chronological sessions and plans

- `tasks/`
  - `backlog.yaml` — tasks and their status
  - `handoff/` — handoff notes such as `T-001.md`

---

## 3. Handoff rules

When you pause or stop working on something:

- Update relevant tasks in `tasks/backlog.yaml`.
- Create or update a file under `tasks/handoff/` explaining:
  - context
  - what is done
  - what is not done
  - recommendations for the next agent

At the end of every session, update `SESSION_LOG.md` with:
- what was achieved
- open questions
- suggested next steps
