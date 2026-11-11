<!-- Paste this section into the AGENTS.md (or CLAUDE.md, .cursorrules, copilot-instructions.md) of a repository whose work is tracked in Jira. -->

## Ship rules

This team keeps its ship rules in Jira with the Ship Rules for Jira app. The rules say what must be true before a work item ships. You reach them through the `ship-rules` MCP server.

- Before you start a Jira work item, call `get-ship-readiness` with its key (for example `PAY-12`) and plan for every rule it lists.
- When a rule is truly met, call `attach-ship-evidence` with the work item key, the rule's `checkId`, and a real `link` or a short factual `note`. Set `agentName` to your own name.
- Before you open a pull request or say the work is done, call `check-ready-to-ship`. If `ready` is false, list what is still open instead of calling the work done.
- Never invent evidence. Never attach secrets or links that contain credentials.
- Rules that need a person stay open until a person confirms them on the work item in Jira. You cannot confirm or waive a rule. Say who needs to do what.
- If a tool says the user cannot edit the work item, stop and tell the person.
