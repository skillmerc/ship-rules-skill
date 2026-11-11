// External MCP client check for Ship Rules for Jira.
// Connects to the Atlassian MCP server endpoint of the Forge app from outside Atlassian, using the official MCP SDK
// (Streamable HTTP transport, OAuth 2.1 with dynamic client registration and PKCE), then lists and calls the tools.
//
//   node check.mjs connect                      first run: prints where the sign-in link was written, waits for the browser consent
//   node check.mjs list                         list the tools the server exposes
//   node check.mjs call <tool> '<json args>'    call one tool and print the result
//
// Tokens are kept in .auth/ (mode 600) and are never printed.
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { UnauthorizedError } from '@modelcontextprotocol/sdk/client/auth.js';

const APP_ID = process.env.SHIP_RULES_APP_ID || '932dfe8d-13dd-4afd-9d48-5ffcaa208b8d';
const SERVER = new URL(process.env.SHIP_RULES_MCP_URL || `https://mcp.atlassian.com/forge/${APP_ID}`);
const PORT = Number(process.env.MCP_CALLBACK_PORT || 33418);
const REDIRECT = `http://localhost:${PORT}/callback`;
// MCP_PROFILE keeps separate sign-ins apart, for example one per Jira site.
const DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '.auth', APP_ID + (process.env.MCP_PROFILE ? `-${process.env.MCP_PROFILE.replace(/[^a-z0-9-]/gi, '')}` : ''));
fs.mkdirSync(DIR, { recursive: true, mode: 0o700 });
const file = (n) => path.join(DIR, n);
const read = (n) => { try { return JSON.parse(fs.readFileSync(file(n), 'utf8')); } catch { return undefined; } };
const write = (n, v) => fs.writeFileSync(file(n), typeof v === 'string' ? v : JSON.stringify(v), { mode: 0o600 });

const provider = {
  get redirectUrl() { return REDIRECT; },
  get clientMetadata() { return { client_name: 'Ship Rules external MCP check', redirect_uris: [REDIRECT], grant_types: ['authorization_code', 'refresh_token'], response_types: ['code'], token_endpoint_auth_method: 'none' }; },
  clientInformation: () => read('client.json'),
  saveClientInformation: (v) => write('client.json', v),
  tokens: () => read('tokens.json'),
  saveTokens: (v) => write('tokens.json', v),
  redirectToAuthorization: (url) => {
    // The client asks for the scopes the server advertises. On 11 Nov 2026 Atlassian's sign-in page rejected a narrower list, so MCP_SCOPE is only an override for testing.
    if (process.env.MCP_SCOPE) url.searchParams.set('scope', process.env.MCP_SCOPE);
    write('auth-url.txt', url.toString()); console.log(`SIGN-IN LINK WRITTEN to ${file('auth-url.txt')} (open it in the browser)`); },
  saveCodeVerifier: (v) => write('verifier.txt', v),
  codeVerifier: () => fs.readFileSync(file('verifier.txt'), 'utf8'),
};

const newClient = () => new Client({ name: 'ship-rules-external-check', version: '1.0.0' }, { capabilities: {} });

async function connect({ interactive }) {
  let transport = new StreamableHTTPClientTransport(SERVER, { authProvider: provider });
  let client = newClient();
  try { await client.connect(transport); return client; }
  catch (e) {
    if (!(e instanceof UnauthorizedError) || !interactive) throw e;
  }
  const code = await new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const u = new URL(req.url, REDIRECT);
      if (u.pathname !== '/callback') { res.writeHead(404).end(); return; }
      const c = u.searchParams.get('code'); const err = u.searchParams.get('error');
      res.writeHead(200, { 'Content-Type': 'text/html' }).end(`<h1>${c ? 'Signed in. You can close this tab.' : 'Sign-in failed.'}</h1>`);
      server.close();
      c ? resolve(c) : reject(new Error(`authorization failed: ${err ?? 'no code'}`));
    });
    server.listen(PORT, '127.0.0.1', () => console.log(`WAITING for the browser consent on ${REDIRECT}`));
    setTimeout(() => { server.close(); reject(new Error('timed out waiting for the browser consent')); }, Number(process.env.MCP_WAIT_MS || 540000)).unref?.();
  });
  await transport.finishAuth(code);
  console.log('TOKEN EXCHANGE DONE (tokens saved, not printed)');
  transport = new StreamableHTTPClientTransport(SERVER, { authProvider: provider });
  client = newClient();
  await client.connect(transport);
  return client;
}

const [cmd = 'list', toolName, argJson] = process.argv.slice(2);
const client = await connect({ interactive: cmd === 'connect' });
const info = client.getServerVersion();
console.log(`CONNECTED to ${SERVER.href}`);
console.log(`server: ${JSON.stringify(info)}`);
if (cmd === 'connect' || cmd === 'list') {
  const { tools } = await client.listTools();
  console.log(`TOOLS (${tools.length}):`);
  for (const t of tools) console.log(`- ${t.name}: ${(t.description ?? '').replace(/\s+/g, ' ').slice(0, 160)}\n    inputs: ${JSON.stringify(Object.keys(t.inputSchema?.properties ?? {}))} required: ${JSON.stringify(t.inputSchema?.required ?? [])}`);
  if (process.env.MCP_DUMP) fs.writeFileSync(process.env.MCP_DUMP, JSON.stringify(tools, null, 2));
} else if (cmd === 'call') {
  const args = argJson ? JSON.parse(argJson) : {};
  const started = Date.now();
  const result = await client.callTool({ name: toolName, arguments: args });
  console.log(`CALL ${toolName} ${JSON.stringify(args)} -> isError=${!!result.isError} in ${Date.now() - started} ms`);
  for (const c of result.content ?? []) console.log(c.type === 'text' ? c.text : JSON.stringify(c));
  if (result.structuredContent) console.log('structured:', JSON.stringify(result.structuredContent));
}
await client.close();
process.exit(0);
