---
name: plan-to-issues
description: Split this repo's plan.md into GitHub issues with gh, one per unit of work, after a human has reviewed the split. Use when a plan is ready and has no issues yet.
---

# plan-to-issues

Turns `plan.md` into GitHub issues that workers can pick up cold. Easiest with `gh`, authenticated,
in a shell this agent can run.

## Steps

1. Read `plan.md`, `AGENTS.md` and `docs/adr/`.
2. Draft the split as a table: title · plan section · scope · done when · blocked by.
   One issue per unit of work.
3. **Stop and show the table to the human.** Publish nothing until they approve it.
4. Every issue carries the shape under "Issue shape" below. Ask the human only if they want
   to change it for this plan.
5. Create the label once (`gh label create plan:<plan>`), then each issue in dependency order,
   so blocked-by can cite real numbers:

   ```sh
   gh issue create --title "<title>" --label plan:<plan> --body-file <tmp.md>
   ```

6. Record every issue URL from gh's output (not from memory) and reply with the list.

## Issue shape

Approved by the human on 2026-10-29 (plan morning-digest). `<plan>` is the `plan:` key in the
plan's frontmatter.

- Label: `plan:<plan>`. The reviewer sorts by it.
- Body, in this order:

  ```md
  Source: plan.md § <n>

  ## Scope
  <what to build, from the plan's section; the rules from the styleguide and ADRs that apply>

  ## Done when
  <the plan's "Done when", word for word>

  ## Blocked by
  <#n (and what exactly it needs from #n), or —>

  ## Suggested worker
  <strongest model for logic, a cheaper one for views and tests, or "coordinator" for steps
  that need a human's yes (publish, upload)>
  ```

- The first line is always `Source: plan.md § <n>`, nothing before it.

## Closing

Close an issue only when its "Done when" holds for the people outside the lane, not when your
part is sent. A step that waits on someone else (a reviewer, a human) stays open, with a comment
saying what it waits on, until they confirm. Steps blocked by it wait too.

A commit with `closes #n` closes the issue on push; then add the closing comment from AGENTS.md
with `gh issue comment`. Otherwise:

```sh
gh issue close <n> -c "<closing comment>"
```

## No `gh`

Steps 1–4 hold either way. GitHub reachable another way (a connector, the REST API, the web UI):
the same issues, made that way. GitHub issues out of reach altogether: write them as files in
`docs/issues/`, format in ADR 0004, then commit and push.

## Don'ts

- Don't paste the whole plan into one issue, and don't keep issues only in chat.
- Don't invent sections the plan doesn't have. If the plan is unclear, ask.
