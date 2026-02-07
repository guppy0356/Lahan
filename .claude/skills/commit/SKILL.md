---
name: commit
description: Create a git commit with an auto-generated message. Use when the user wants to commit changes, says "commit", "/commit", or asks to save their work to git. Workflow includes reviewing staged/unstaged changes, optionally excluding files, generating a concise English commit message, and executing the commit.
---

# Commit

## Workflow

1. **Review changes** — Run `git status` (never use `-uall`) and `git diff` (staged + unstaged) in parallel to understand what changed.

2. **Exclude files** — If there are untracked or modified files that look like they might not belong (e.g., `.env`, credentials, large binaries, build artifacts), ask the user if any files should be excluded. Skip this step if all changes look intentional.

3. **Stage files** — Stage relevant files by name. Prefer `git add <file>...` over `git add -A` to avoid accidentally including sensitive files.

4. **Generate commit message** — Write a concise 1-line English commit message (no Conventional Commits prefix). Focus on *why* the change was made, not *what* files changed. Keep it under 72 characters when possible.

5. **Commit** — Execute `git commit` with the generated message. Use a HEREDOC for the message body:
   ```bash
   git commit -m "$(cat <<'EOF'
   <message>
   EOF
   )"
   ```

6. **Verify** — Run `git status` after committing to confirm success.

## Rules

- Never push to remote unless explicitly asked.
- Never amend existing commits unless explicitly asked.
- Never use `--no-verify` or skip hooks.
- Never force-push.
- If a pre-commit hook fails, fix the issue, re-stage, and create a NEW commit (do not amend).
- Do not include `Co-Authored-By` trailers unless the user requests it.
