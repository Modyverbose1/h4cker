#!/usr/bin/env node
// App-based approver & merger for baseline PRs
// Reads APP_ID and APP_PRIVATE_KEY from env, finds the PR (from PR_NUMBER env or from GITHUB_SHA),
// verifies conditions (branch prefix, combined status success), then approves & merges the PR,
// adds label and posts audit comment.

const { Octokit } = require('@octokit/rest');
const { createAppAuth } = require('@octokit/auth-app');

async function run() {
  const appId = process.env.GITHUB_APP_ID || process.env.APP_ID;
  const privateKey = process.env.GITHUB_APP_PRIVATE_KEY || process.env.APP_PRIVATE_KEY;
  if (!appId || !privateKey) {
    console.error('Missing GITHUB_APP_ID or GITHUB_APP_PRIVATE_KEY in environment');
    process.exit(2);
  }

  const repoFull = process.env.GITHUB_REPOSITORY;
  if (!repoFull) {
    console.error('Missing GITHUB_REPOSITORY (owner/repo)');
    process.exit(2);
  }
  const [owner, repo] = repoFull.split('/');

  const prNumber = process.env.PR_NUMBER ? parseInt(process.env.PR_NUMBER, 10) : null;
  const sha = process.env.GITHUB_SHA;

  // Create an Octokit that can act as the App to fetch installation
  const appOctokit = new Octokit({ authStrategy: createAppAuth, auth: { appId, privateKey } });

  // Get installation id for this repo
  const { data: installation } = await appOctokit.rest.apps.getRepoInstallation({ owner, repo });
  const installationId = installation.id;

  // Create installation token
  const appAuth = createAppAuth({ appId, privateKey, installationId });
  const installationAuthentication = await appAuth({ type: 'installation' });
  const installationToken = installationAuthentication.token;

  const octokit = new Octokit({ auth: installationToken });

  // Determine PR number if not provided
  let prNum = prNumber;
  if (!prNum) {
    if (!sha) {
      console.error('No PR_NUMBER and no GITHUB_SHA to search PRs from');
      process.exit(2);
    }
    const prs = await octokit.rest.repos.listPullRequestsAssociatedWithCommit({ owner, repo, commit_sha: sha });
    if (!prs.data || prs.data.length === 0) {
      console.error('No PR associated with commit', sha);
      process.exit(1);
    }
    // take the first open PR (should be the head PR)
    const openPr = prs.data.find(p => p.state === 'open');
    if (!openPr) {
      console.error('No open PR associated with commit', sha);
      process.exit(1);
    }
    prNum = openPr.number;
  }

  console.log('Target PR number:', prNum);

  // Fetch PR details
  const { data: pr } = await octokit.rest.pulls.get({ owner, repo, pull_number: prNum });
  console.log(`PR #${prNum} head ref: ${pr.head.ref} author=${pr.user.login}`);

  // Only operate on the expected branch pattern
  if (!pr.head.ref.startsWith('auto/update-secrets-baseline-')) {
    console.log('PR branch does not match auto baseline pattern; skipping.');
    return;
  }

  // Check combined status for head SHA
  const headSha = pr.head.sha;
  const { data: combined } = await octokit.rest.repos.getCombinedStatusForRef({ owner, repo, ref: headSha });
  console.log('Combined status state:', combined.state);
  if (combined.state !== 'success') {
    console.log('Combined status is not success; skipping approval/merge.');
    return;
  }

  // Check if there is already an approved review from a non-author (leave if exists)
  const reviewsResp = await octokit.rest.pulls.listReviews({ owner, repo, pull_number: prNum });
  const reviews = reviewsResp.data || [];
  let foundNonAuthorApproval = false;
  for (let i = reviews.length - 1; i >= 0; i--) {
    const r = reviews[i];
    if (r.state === 'APPROVED' && r.user && r.user.login !== pr.user.login) {
      foundNonAuthorApproval = true;
      console.log('Found existing non-author approver:', r.user.login);
      break;
    }
  }
  if (!foundNonAuthorApproval) {
    // Create APP approval review
    console.log('Submitting APPROVE review as the App');
    await octokit.rest.pulls.createReview({ owner, repo, pull_number: prNum, event: 'APPROVE', body: 'Approved by automerge app (conditions met).' });
  } else {
    console.log('Already has a non-author approval; skipping creating approval review.');
  }

  // Attempt merge (squash)
  console.log('Merging PR via App (squash)');
  const mergeRes = await octokit.rest.pulls.merge({ owner, repo, pull_number: prNum, merge_method: 'squash', commit_title: 'chore: update detect-secrets baseline' });
  const mergedSha = (mergeRes.data && (mergeRes.data.sha || mergeRes.data.merge_commit_sha)) || null;
  console.log('Merge API response:', mergeRes.data ? mergeRes.data.message || mergeRes.data : mergeRes);

  // Add audit label
  const auditLabel = 'automerge-baseline';
  try {
    await octokit.rest.issues.addLabels({ owner, repo, issue_number: prNum, labels: [auditLabel] });
  } catch (err) {
    console.warn('Adding label failed, attempting to create label then add it:', err.message);
    try {
      await octokit.rest.issues.createLabel({ owner, repo, name: auditLabel, color: '0e8a16', description: 'Automerged baseline PRs' });
      await octokit.rest.issues.addLabels({ owner, repo, issue_number: prNum, labels: [auditLabel] });
    } catch (err2) {
      console.warn('Failed to create/add label:', err2.message);
    }
  }

  // Add audit comment
  const actor = `GitHub App (id: ${appId})`;
  const comment = `Automerged baseline update by ${actor} after conditions met.\n\nMerged commit: ${mergedSha || headSha}`;
  await octokit.rest.issues.createComment({ owner, repo, issue_number: prNum, body: comment });

  console.log('Automerge completed for PR', prNum, 'mergedSha:', mergedSha || headSha);
}

run().catch(err => {
  console.error('Fatal error in app_approve_merge:', err);
  process.exit(1);
});
