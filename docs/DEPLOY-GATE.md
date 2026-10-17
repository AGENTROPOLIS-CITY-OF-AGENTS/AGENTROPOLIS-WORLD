# Deploy gate

Recommendation for Neuro. This change does not modify ruleset `24971649` or the `github-pages` environment. Nothing here has been applied.

`pages.yml` now fails closed on `push` to `main` and on `workflow_dispatch`. After the spatial-runtime injection, and before `actions/upload-pages-artifact`, the build job runs `REQUIRE_DIST=1 npm test` and `npm run smoke`. Either failure stops the job, so the deploy job (`needs: build`, environment `github-pages`) does not run.

That workflow gate does not by itself stop a merge, and it does not require a person to approve the Pages deployment. The two settings below are what closes those gaps. SRI on the vendored script does not replace them: a commit can change `index.html` and `agentropolis-loop-baseline.js` together. The pin test is what fails that closed, because the git blob must stay `15254b442f33e009f4c78a1c19568e75ea2121b2` and `dist/index.html` must keep:

```html
integrity="sha384-YXPNohgGheUM32mm6qMBBKuRXhwU5Wkrwu9dgTmQBJRRIY0TdgcgxoEtvhxgTaqY"
```

Chrome 154 enforces that digest on the same-origin classic script without `crossorigin`. A one-byte change of the served file is blocked and the script does not run. `crossorigin="anonymous"` is not part of the tag because that check did not need it.

## 1. Required status check on ruleset 24971649

Observed on 2026-10-17. Ruleset `24971649` “Protect Main” is active on the default branch. It has deletion, non-fast-forward, and pull-request rules. It has no required status checks. `current_user_can_bypass` is `never`.

https://github.com/AGENTROPOLIS-CITY-OF-AGENTS/AGENTROPOLIS-WORLD/rules/24971649

Add one rule in the ruleset editor. Do not remove or edit the existing rules. Do not add a bypass actor.

Rule: **Require status checks to pass**.

| Setting | Value |
| --- | --- |
| Status check | `Vendored baseline` |
| Source app | GitHub Actions (`integration_id` `15368`) |
| Require branches to be up to date before merging | on (`strict_required_status_checks_policy: true`) |
| Do not enforce on create | off (`do_not_enforce_on_create: false`) |

`Vendored baseline` is the job `name` in `.github/workflows/pr-qualify.yml`. Check run `117308743834` on commit `1743551a7697fab5d64fdcce110f34bd5674ac38` was reported by GitHub Actions app id `15368`. The context string must match exactly, including the space and the capital letters.

Exact rule object to append:

```json
{
  "type": "required_status_checks",
  "parameters": {
    "strict_required_status_checks_policy": true,
    "do_not_enforce_on_create": false,
    "required_status_checks": [
      {
        "context": "Vendored baseline",
        "integration_id": 15368
      }
    ]
  }
}
```

Keep these rules as returned by `GET /repos/AGENTROPOLIS-CITY-OF-AGENTS/AGENTROPOLIS-WORLD/rulesets/24971649`:

```json
[
  { "type": "deletion" },
  { "type": "non_fast_forward" },
  {
    "type": "pull_request",
    "parameters": {
      "required_approving_review_count": 0,
      "dismiss_stale_reviews_on_push": true,
      "required_reviewers": [],
      "require_code_owner_review": false,
      "dismissal_restriction": { "enabled": false, "allowed_actors": [] },
      "require_last_push_approval": false,
      "required_review_thread_resolution": false,
      "require_extra_approval_for_unattributed_changes": true,
      "allowed_merge_methods": ["merge", "squash", "rebase"]
    }
  }
]
```

If the update is done with `PUT /repos/AGENTROPOLIS-CITY-OF-AGENTS/AGENTROPOLIS-WORLD/rulesets/24971649`, send the current ruleset body with only that rule appended. A PUT replaces the ruleset. Fetch it first and preserve `name`, `target`, `enforcement`, `conditions`, and `bypass_actors`.

## 2. `github-pages` environment protection

Observed on 2026-10-17 via `GET /repos/AGENTROPOLIS-CITY-OF-AGENTS/AGENTROPOLIS-WORLD/environments/github-pages`:

| Field | Current value |
| --- | --- |
| `can_admins_bypass` | `true` |
| `protection_rules` | one `branch_policy` (`id` `63431911`) |
| `deployment_branch_policy.protected_branches` | `false` |
| `deployment_branch_policy.custom_branch_policies` | `true` |
| Deployment branch policy | `name: main`, `type: branch`, `id` `58025743` |
| Required reviewers | none |
| Wait timer | none |

The deploy job in `pages.yml` uses `environment.name: github-pages`. Apply these settings. Leave branch policy `58025743` (`main`) in place. Do not add any other branch.

Settings → Environments → `github-pages`:

| Setting | Value |
| --- | --- |
| Deployment branches | Selected branches, only `main` |
| Required reviewers | 1 reviewer: Neuro's GitHub account |
| Prevent self-review | on |
| Wait timer | 0 minutes |
| Allow administrators to bypass configured protection rules | off |

The collaborators and org-members APIs available to this change did not return a user id, so the reviewer id is the one value Neuro fills in. Only one of the required reviewers must approve. The person who triggered the workflow cannot approve their own job.

API body for `PUT /repos/AGENTROPOLIS-CITY-OF-AGENTS/AGENTROPOLIS-WORLD/environments/github-pages`, after substituting Neuro's numeric GitHub user id:

```json
{
  "wait_timer": 0,
  "prevent_self_review": true,
  "can_admins_bypass": false,
  "reviewers": [
    { "type": "User", "id": 0 }
  ],
  "deployment_branch_policy": {
    "protected_branches": false,
    "custom_branch_policies": true
  }
}
```

Replace `0` with Neuro's user id before sending. Do not send that placeholder. After the PUT, `GET /repos/AGENTROPOLIS-CITY-OF-AGENTS/AGENTROPOLIS-WORLD/environments/github-pages/deployment-branch-policies` must still list only `main`. If that policy is missing, recreate it with `{"name":"main","type":"branch"}`. Do not delete policy `58025743` if it is still `main`.

`can_admins_bypass` is the field the live environment object already returns. The matching control in the environment UI is “Allow administrators to bypass configured protection rules.”

## What each control covers

| Path | What stops it |
| --- | --- |
| Pull request into the default branch whose `Vendored baseline` check failed or is stale | ruleset `24971649` once the status check above is added |
| `push` to `main` or `workflow_dispatch` whose built `dist` fails the pin or the headless smoke | `pages.yml`, before the Pages artifact upload |
| Deploy job reaching GitHub Pages without a human approval, including an admin bypass | `github-pages` environment, once the settings above are applied |
