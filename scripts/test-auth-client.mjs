import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';

const file = new URL('../src/lib/auth-client.ts', import.meta.url);
async function loadClient() {
  assert.ok(fs.existsSync(file), 'Shared authenticated client must exist');
  const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
  return import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
}
const valid = () => ({user_id: 7, role: 'user', access_token: 'opaque-session', expires_at: new Date(Date.now() + 60000).toISOString()});
function setup(createAuthClient, value = valid(), response = new Response('{}')) {
  const data = new Map([['user', JSON.stringify(value)]]);
  const calls = [], events = [];
  const client = createAuthClient({apiUrl: 'https://api.example', origin: 'https://app.example', storage: {getItem: k => data.get(k) ?? null, setItem: (k,v) => data.set(k,v), removeItem: k => data.delete(k)}, fetchImpl: async (...args) => { calls.push(args); return response; }, onAuthEvent: e => events.push(e)});
  return {client, calls, data, events};
}
test('sends bearer only to configured API origin, never external URLs', async () => {
  const {createAuthClient} = await loadClient();
  const {client, calls} = setup(createAuthClient);
  await client.apiFetch('/api/profile');
  assert.equal(calls[0][0], 'https://api.example/api/profile');
  assert.equal(calls[0][1].headers.get('Authorization'), 'Bearer opaque-session');
  await client.apiFetch('https://untrusted.example/api/profile', {headers: {Authorization: 'Bearer explicit'}, credentials: 'include'});
  assert.equal(calls[1][1].headers.has('Authorization'), false);
  assert.equal(calls[1][1].credentials, 'omit');
});
test('rejects legacy, malformed, expired sessions and suppresses public bearer', async () => {
  const {createAuthClient} = await loadClient();
  for (const value of [{user_id: 7}, null, [], {...valid(), expires_at: 'invalid'}, {...valid(), expires_at: '2000-01-01'}, {...valid(), access_token: ' '}, {...valid(), user_id: null}]) {
    const {client} = setup(createAuthClient, value);
    assert.equal(client.readSession(), null);
  }
  const {client, data, calls} = setup(createAuthClient);
  data.set('user', '{broken');
  assert.equal(client.readSession(), null);
  client.saveSession(valid());
  await client.publicFetch('/api/login', {headers: {Authorization: 'Bearer bad'}});
  assert.equal(calls[0][1].headers.has('Authorization'), false);
});
test('server session validation refreshes role without losing bearer; logout revokes before clearing', async () => {
  const {createAuthClient} = await loadClient();
  const {client, calls, data} = setup(createAuthClient, {...valid(), role: 'superadmin'}, Response.json({user_id: 7, role: 'user'}));
  assert.equal((await client.validateSession()).role, 'user');
  assert.equal(client.readSession().access_token, 'opaque-session');
  assert.equal(calls[0][0], 'https://api.example/api/auth/me');
  await client.logout();
  assert.equal(calls[1][0], 'https://api.example/api/logout');
  assert.equal(calls[1][1].method, 'POST');
  assert.equal(calls[1][1].headers.get('Authorization'), 'Bearer opaque-session');
  assert.equal(data.has('user'), false);
});
test('401 clears session and requests login, while 403 denies without elevation', async () => {
  const {createAuthClient} = await loadClient();
  for (const status of [401, 403]) {
    const {client, data, events} = setup(createAuthClient, valid(), new Response('{}', {status}));
    await assert.rejects(client.apiFetch('/api/admin/users'), e => e.status === status);
    assert.ok(events.includes(status === 401 ? 'unauthorized' : 'forbidden'));
    assert.equal(data.has('user'), status === 403);
  }
});
export {loadClient, setup, valid};
