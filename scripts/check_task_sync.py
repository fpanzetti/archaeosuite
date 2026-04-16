#!/usr/bin/env python3
import os
import pathlib
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]

# TODO: keep in sync with check_docs_sync.py
CORE_PREFIXES = []

def ensure_base(ref):
    return ref or "HEAD~1"

def git_diff(base):
    base = ensure_base(base)
    result = subprocess.run(
        ["git", "diff", "--name-only", f"{base}...HEAD"],
        cwd=ROOT,
        capture_output=True,
        text=True,
        check=False,
    )
    if result.returncode not in (0, 1):
        print(f"[tasks-guard] git diff failed: {result.stderr.strip()}", file=sys.stderr)
        sys.exit(2)
    return [line.strip() for line in result.stdout.splitlines() if line.strip()]

def matches_core(path):
    return any(path == p or path.startswith(p) for p in CORE_PREFIXES)

def needs_tasks(changed):
    return bool(CORE_PREFIXES) and any(matches_core(path) for path in changed)

def has_tasks(changed):
    return any(path.startswith("tasks/") for path in changed)

def main():
    base = os.environ.get("TASKS_GUARD_BASE")
    changed = git_diff(base)
    if not changed:
        print("[tasks-guard] No changes detected.")
        return 0

    print("[tasks-guard] Changed files:\n" + "\n".join(f"  - {p}" for p in changed))

    if not needs_tasks(changed):
        if not CORE_PREFIXES:
            print("[tasks-guard] CORE_PREFIXES is empty. Configure it to enforce backlog/handoff updates.")
        else:
            print("[tasks-guard] No core prefixes touched. Skipping tasks requirement.")
        return 0

    if has_tasks(changed):
        print("[tasks-guard] Detected tasks/backlog updates. OK.")
        return 0

    print("[tasks-guard] Core change detected without tasks/backlog updates.")
    return 1

if __name__ == "__main__":
    raise SystemExit(main())
