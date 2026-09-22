import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';

const file = new URL('../src/lib/auth-client.ts', import.meta.url);
async function loadClient() {
  assert.ok(fs.existsSync(file), 'Shared authenticated client must exist');
  const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: {module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022},
  }).outputText;
  return import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
}
const valid = () => ({
  user_id: 7, role: 'user', email: 'user@example.test',
  expires_at: new Date(Date.now() + 60000).toISOString(),
});
function setup(createAuthClient, value = valid(), response = new Response('{}')) {
  const data = new Map(value ? [['user', JSON.stringify(value)]] : []);
  const calls = [], events = [];
  const client = createAuthClient({
    apiUrl: 'https://api.example',
    origin: 'https://app.example',
    storage: {
      getItem: (key) => data.get(key) ?? null,
      setItem: (key, stored) => data.set(key, stored),
      removeItem: (key) => data.delete(key),
    },
    csrfToken: () => 'csrf-value',
    fetchImpl: async (...args) => { calls.push(args); return response; },
    onAuthEvent: (event) => events.push(event),
  });
  return {client, calls, data, events};
}

test('uses cookies only for backend origin and strips bearer headers', async () => {
  const {createAuthClient} = await loadClient();
  const {client, calls} = setup(createAuthClient);
  await client.apiFetch('/api/profile', {headers: {Authorization: 'Bearer leaked'}});
  assert.equal(calls[0][0], 'https://api.example/api/profile');
  assert.equal(calls[0][1].headers.has('Authorization'), false);
  assert.equal(calls[0][1].credentials, 'include');
  await client.apiFetch('https://untrusted.example/api/profile', {credentials: 'include'});
  assert.equal(calls[1][1].credentials, 'omit');
});

test('stores only a non-sensitive profile and removes legacy access tokens', async () => {
  const {createAuthClient} = await loadClient();
  const {client, data} = setup(createAuthClient, null);
  const saved = client.saveSession({...valid(), access_token: 'must-not-persist', password: 'secret'});
  assert.equal(saved.access_token, undefined);
  const stored = JSON.parse(data.get('user'));
  assert.equal(stored.access_token, undefined);
  assert.equal(stored.password, undefined);
});

test('adds CSRF token to mutating backend requests', async () => {
  const {createAuthClient} = await loadClient();
  const {client, calls} = setup(createAuthClient);
  await client.apiFetch('/api/logout', {method: 'POST'});
  assert.equal(calls[0][1].headers.get('X-CSRF-Token'), 'csrf-value');
});

test('server validation refreshes profile and logout clears it', async () => {
  const {createAuthClient} = await loadClient();
  const {client, calls, data} = setup(
    createAuthClient, {...valid(), role: 'superadmin'},
    Response.json({user_id: 7, role: 'user', email: 'user@example.test'}),
  );
  assert.equal((await client.validateSession()).role, 'user');
  assert.equal(calls[0][0], 'https://api.example/api/auth/me');
  await client.logout();
  assert.equal(calls[1][0], 'https://api.example/api/logout');
  assert.equal(calls[1][1].headers.get('X-CSRF-Token'), 'csrf-value');
  assert.equal(data.has('user'), false);
});

test('401 clears profile while 403 preserves it', async () => {
  const {createAuthClient} = await loadClient();
  for (const status of [401, 403]) {
    const {client, data, events} = setup(createAuthClient, valid(), new Response('{}', {status}));
    await assert.rejects(client.apiFetch('/api/admin/users'), (error) => error.status === status);
    assert.ok(events.includes(status === 401 ? 'unauthorized' : 'forbidden'));
    assert.equal(data.has('user'), status === 403);
  }
});

export {loadClient, setup, valid};
