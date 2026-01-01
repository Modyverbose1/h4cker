GitHub App setup for automerge (recommended)

Overview
--------
This repository supports an optional GitHub App that can safely approve and merge automated baseline update PRs (branches starting with `auto/update-secrets-baseline-`) when CI checks are green.

Why use a GitHub App
- Least privilege: grant just the permissions the app needs.
- Auditability: App interactions appear in the audit log and PR review history.
- Security: Use short-lived installation tokens rather than long-lived PATs.

Required permissions for the GitHub App
- Pull requests: Read & Write (required to create reviews and merge)
- Checks: Read
- Contents: Read (to get commits/refs)

Creating the GitHub App
1. Go to https://github.com/settings/apps and click **New GitHub App**.
2. Fill in a name (e.g., "h4cker-automerge-bot").
3. Set the webhook URL to your preference (not required for this usage) and optionally supply a webhook secret.
4. Under **Repository permissions** set:
   - Pull requests: **Read & Write**
   - Checks: **Read**
   - Contents: **Read**
5. Leave the other permissions unset or at their minimum.
6. Under **Where can this GitHub App be installed?** choose the repository and install it on `The-Art-of-Hacking/h4cker`.
7. Generate a private key for the App and download it (this is used to create signed JWTs to get installation tokens).
8. Note the **App ID** shown on the App settings page.

Add secrets to the repository
-----------------------------
Add these repository secrets to the destination repository (The-Art-of-Hacking/h4cker) or an organizational secret if preferred:
- `GITHUB_APP_ID` - The numerical GitHub App ID
- `GITHUB_APP_PRIVATE_KEY` - The private key PEM content (multi-line)

How the workflow works
----------------------
A workflow (`.github/workflows/automerge-via-app.yml`) runs on PR-related events and check completions. It authenticates as the GitHub App, checks that:
- The PR branch name starts with `auto/update-secrets-baseline-`
- Combined status/check-suite for the head commit is `success`
- (Optional) Additional conditions (labels, files changed, etc.)

If all checks pass the App:
1. Creates an **APPROVE** review on the PR
2. Performs a squash merge on the PR
3. Adds the `automerge-baseline` label and posts an audit comment with the App identity and merged SHA

Security notes
--------------
- Keep the App private key secret. Only store it in GitHub Actions secrets and rotate it periodically.
- Use the App only for well-scoped automation (e.g., baseline updates). Avoid giving it broader permissions.
- Monitor audit logs and PR history for the App's activity.

Support
-------
If you want, I can help create the App resource and set this up for you; you'll need to either: 1) add the `GITHUB_APP_ID` and `GITHUB_APP_PRIVATE_KEY` secrets to `The-Art-of-Hacking/h4cker`, or 2) create the App yourself and provide the values.
