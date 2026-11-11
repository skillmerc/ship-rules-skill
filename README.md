# Ship rules skill for coding agents

An open-source skill file (`SKILL.md`) and an `AGENTS.md` snippet that tell a coding agent when and how to use the tools of **Ship Rules for Jira**, a Forge app that exposes its tools through the Atlassian MCP server.

Ship Rules for Jira keeps a team's ship rules per Jira project: what must be true before a work item ships (tests linked, reviewed by a person, rollback noted, security review for sign-in changes, and so on), chosen by work type, label and component. People attach evidence on the work item. Agents read the same rules and attach evidence through five MCP tools. Rules marked "a person must confirm" stay open until a person confirms them in Jira, whatever an agent attaches.

Built by SKILLMERC with an AI coding agent.

## What is in this repository

| Path | What it is |
| --- | --- |
| `ship-rules/SKILL.md` | The skill. Works as an Agent Skill in clients that load `SKILL.md` folders, and is the same file the Forge app ships as its `rovo:skill`. |
| `AGENTS-snippet.md` | A short section to paste into `AGENTS.md`, `CLAUDE.md` or your editor's rules file. |
| `examples/mcp-client-check/` | A small Node script that connects to the app's MCP endpoint with the official MCP SDK, lists the tools and calls them. Useful to check your setup. |

## The tools

| Tool | What it does |
| --- | --- |
| `get-ship-readiness` | The rules that apply to one work item, the state and evidence of each, whether it is ready, and the next steps. |
| `check-ready-to-ship` | A short yes or no with the open rules and reasons. |
| `attach-ship-evidence` | Attach a link or a note to one rule. Needs edit permission on the work item. Cannot confirm rules that need a person. |
| `list-blocked-work-items` | Open work items of a project that are not ready, optionally only those blocked on one rule. |
| `get-ship-rules` | Every rule of a project, or the rules that apply to one work item. |

The tools act for the signed-in person. An agent sees only the work items that person can see, and can attach evidence only where that person can edit. No tool confirms or waives a rule.

## Set up

1. Install Ship Rules for Jira on your Jira site and set up ship rules in a project (Project page "Ship readiness").
2. An organization admin opens Atlassian Administration, then Apps, Sites, your site, Connected apps, Ship Rules for Jira, View app details, and under Tools enables "Expose tools to MCP-compatible apps". It is off by default.
3. Add the MCP server to your agent. The endpoint is `https://mcp.atlassian.com/forge/932dfe8d-13dd-4afd-9d48-5ffcaa208b8d`. For example:

   ```
   claude mcp add --transport http ship-rules https://mcp.atlassian.com/forge/932dfe8d-13dd-4afd-9d48-5ffcaa208b8d
   ```

   Your client opens an Atlassian sign-in page. Pick your site and accept.
4. Add the skill. Either copy the `ship-rules` folder into your agent's skills folder (for Claude Code: `.claude/skills/ship-rules/`), or paste `AGENTS-snippet.md` into your `AGENTS.md`.

If your site runs a development build of the app, the tool names end in `_development`. The skill tells the agent to use whichever form the client lists.

## Check your setup without an agent

```
cd examples/mcp-client-check
npm install
node check.mjs connect     # writes a sign-in link to .auth/, open it in a browser and accept
node check.mjs list
node check.mjs call get-ship-readiness '{"issueKey":"PAY-12"}'
```

Tokens are kept in `.auth/` with owner-only permissions and are never printed.

## What was tested

On 11 November 2026, from a laptop outside Atlassian, against two Jira Cloud sites (one running the development build of the app, one the production build):

- The example client in this repository (official MCP SDK, Streamable HTTP, OAuth with dynamic client registration and PKCE) connected to the endpoint above, listed five tools and called all five, including `attach-ship-evidence`. The evidence showed up on the Jira work item as attached "through an agent", for the signed-in person. A rule that needs a person stayed open until a person confirmed it in Jira.
- The MCP Inspector CLI listed the same five tools and called `check-ready-to-ship`.
- A custom agent in Rovo Studio with two of the tools added ran both.

Not tested yet: Claude Code, Cursor or other packaged coding agents end to end. The endpoint and sign-in flow are the ones Atlassian documents for them.

One thing we learned: on the day of the test, a call from an external client could not use the signed-in person's own Jira credentials inside the app (Atlassian documents this as a known issue for third-party clients). The app therefore falls back to reading as the app and asking Jira what that person's account may do on that work item, and refuses when Jira does not confirm it.

## Licence

MIT. See `LICENSE`. Jira, Rovo and Atlassian are trademarks of Atlassian. This project is not affiliated with or endorsed by Atlassian.

Questions: kyle@skillmerc.com
