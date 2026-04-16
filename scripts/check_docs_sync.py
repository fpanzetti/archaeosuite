#!/usr/bin/env python3
import os
import pathlib
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]

# TODO: set these to your project-specific core paths, e.g. ["src/", "services/", "api/"]
CORE_PREFIXES = []

DOC_PREFIXES = ["specs/", "docs/"]
DOC_FILES = ["SESSION_LOG.md", "AGENTS.md"]

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
        print(f"[docs-guard] git diff failed: {result.stderr.strip()}", file=sys.stderr)
        sys.exit(2)
    return [line.strip() for line in result.stdout.splitlines() if line.strip()]

def matches(path, prefixes):
    return any(path == p or path.startswith(p) for p in prefixes)

def needs_docs(changed):
    return bool(CORE_PREFIXES) and any(matches(path, CORE_PREFIXES) for path in changed)

def has_docs(changed):
    return any(
        matches(path, DOC_PREFIXES) or path in DOC_FILES
        for path in changed
    )

def main():
    base = os.environ.get("DOCS_GUARD_BASE")
    changed = git_diff(base)
    if not changed:
        print(f"[docs-guard] No changes vs {base or 'HEAD~1'}. Nothing to check.")
        return 0

    print("[docs-guard] Changed files:\n" + "\n".join(f"  - {p}" for p in changed))

    if not needs_docs(changed):
        if not CORE_PREFIXES:
            print("[docs-guard] CORE_PREFIXES is empty. Configure it to enforce spec/log updates.")
        else:
            print("[docs-guard] No core prefixes touched. Skipping spec/log requirement.")
        return 0

    if has_docs(changed):
        print("[docs-guard] Detected spec/log updates. OK.")
        return 0

    print("[docs-guard] Core change detected without documentation updates.")
    return 1

if __name__ == "__main__":
    raise SystemExit(main())
