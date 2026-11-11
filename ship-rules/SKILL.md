---
name: ship-rules
description: Check a Jira work item against the team's ship rules before, during and after coding, and attach real evidence as each rule is met. Use when you start work on a Jira work item, before you open a pull request or call the work done, and when someone asks whether an item is ready to ship or what is blocking a project.
compatibility: Needs the Ship Rules for Jira app installed on the Jira site, and its tools connected (Atlassian MCP server or Rovo).
allowed-tools: get-ship-readiness check-ready-to-ship attach-ship-evidence list-blocked-work-items get-ship-rules
---

# Ship rules

A team's ship rules say what must be true before a Jira work item ships: tests linked, a person's review, a rollback note, a security review for sign-in changes, and so on. The rules are set per project and chosen by work type, label and component. The Ship Rules for Jira app keeps them, and keeps the evidence for each work item.

Your job is to work to those rules and leave proof, not to decide them.

## Tools

Your client may show these names with a prefix or suffix (for example `mcp__ship-rules__get-ship-readiness` or `get-ship-readiness_development`). Use whichever form your client lists.

| Tool | Use it to |
| --- | --- |
| `get-ship-readiness` | Get the rules that apply to one work item, the state and evidence of each, and the next steps. |
| `check-ready-to-ship` | Get a short yes or no with the open rules and reasons. |
| `attach-ship-evidence` | Attach a link or a note to one rule. |
| `list-blocked-work-items` | List the open work items of a project that are not ready, or only those blocked on one rule. |
| `get-ship-rules` | Read every rule of a project, or the rules for one work item. |

## When you start a work item

1. Find the work item key (for example `PAY-12`) in the task, the branch name or the commit messages. If you cannot find one, ask.
2. Call `get-ship-readiness` with the key.
3. Read every rule in `checks`. Use `guidance` to plan: if "Rollback noted" applies, design the change so it can be rolled back; if "Regression test added" applies, write the failing test first.
4. Tell the person which rules apply and which of them need a person (`whoCanSatisfyIt`).

## While you work

When a rule is truly met, call `attach-ship-evidence` with the work item key, the rule's `checkId`, and:

- `link`: the pull request, the CI run, the migration file, the docs page. Required when `needs` says "a link".
- `note`: one to three plain sentences that state the fact, for example how to roll the change back. Required when `needs` says "a note".
- `agentName`: your own name, for example "Claude Code". It is shown next to the evidence in Jira.

## Before you open a pull request or say you are done

1. Call `check-ready-to-ship`.
2. If `ready` is false, list every entry in `blockedBy` with its reason. Do not describe the work as done or ready.
3. For a rule in state `waiting`, the evidence is there but a person must confirm it on the work item in Jira. Say who needs to do what. You cannot confirm it.
4. For a rule in state `missing` that you can meet, meet it and attach the evidence. For one you cannot meet, say so.

## Rules for you

- Never invent evidence. Only attach links that exist and that you have seen, and notes that are true. If the tests did not run, do not link a test run.
- Never use a note to argue that a rule does not apply. Only a person can waive a rule, in Jira, with a reason.
- Do not attach secrets, tokens, customer data or links with credentials in them.
- One fact per piece of evidence. Do not attach the same link twice.
- If a tool returns `error`, read the message: it says what to change (a bad key, a rule that does not apply to this work item, a missing link). Do not retry the same call unchanged.
- If the tool says the user cannot edit the work item, stop and tell the person. Do not look for another way to record the evidence.
- The tools act as the signed-in person. You can only see work items that person can see.

## Answering "what is blocking this project?"

Call `list-blocked-work-items` with the project key. To focus on one rule, pass its `checkId` (get the ids from `get-ship-rules`). Report the work item keys, what each is missing, and which are only waiting for a person to confirm.
