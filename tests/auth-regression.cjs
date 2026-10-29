const assert = require('node:assert/strict');
const { loader } = require('./feedback-regression.cjs');

async function main() {
  let authState = { loading: true, session: null };
  let dataRequests = 0;
  const loadPage = loader({
    '../hooks/useAuth': { useAuth: () => authState },
    '../hooks/useFeedbackList': { useFeedbackList() { dataRequests++; throw Error('Inbox mounted without permission'); } },
    '../services/clients.service': { listClients() { dataRequests++; } },
    '../lib/supabase': { getSupabase() { throw Error('Unexpected network access'); } },
  });
  const { AdminPage } = loadPage('src/pages/AdminPage.tsx');
  assert.equal(AdminPage({}).type, 'div');
  authState = { loading: false, session: null };
  const redirect = AdminPage({});
  assert.equal(redirect.props.to, '/admin/login');
  assert.equal(redirect.props.replace, true);
  assert.equal(dataRequests, 0);
  authState.session = { user: { id: 'admin' } };
  assert.equal(typeof AdminPage({}).type, 'function');

  let session = null;
  let user = null;
  let error = null;
  let checks = 0;
  const service = loader({
    '../lib/supabase': { getSupabase: () => ({ auth: {
      getSession: async () => ({ data: { session }, error: null }),
      getUser: async () => { checks++; return { data: { user }, error }; },
    } }) },
  })('src/services/auth.service.ts');
  assert.equal(await service.getSession(), null);
  assert.equal(checks, 0);
  session = { access_token: 'test-token', user: { id: 'admin' } };
  user = { id: 'admin' };
  assert.equal((await service.getSession()).user.id, 'admin');
  user = { id: 'different-user' };
  assert.equal(await service.getSession(), null);
  error = new Error('Expired session');
  await assert.rejects(service.getSession());

  // A late session response must never restore access after sign-out.
  const states = [];
  let cursor = 0, effect, callback, finish;
  const hooks = loader({
    react: {
      useState(initial) { const i = cursor++; states[i] = initial; return [initial, (v) => { states[i] = v; }]; },
      useEffect(fn) { effect = fn; },
    },
    '../services/auth.service': {
      getSession: () => new Promise((resolve) => { finish = resolve; }),
      onAuthChange(fn) { callback = fn; return () => {}; },
    },
  })('src/hooks/useAuth.ts');
  hooks.useAuth();
  const cleanup = effect();
  await Promise.resolve();
  callback(null);
  finish(session);
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(states[0], null);
  assert.equal(states[1], false);
  cleanup();

  let options;
  const client = loader({
    '@supabase/supabase-js': { createClient(url, key, value) { options = value; return {}; } },
    './env': { env: () => ({ supabaseUrl: 'https://example.invalid', supabaseAnonKey: 'test' }) },
  })('src/lib/supabase.ts');
  client.getSupabase();
  assert.equal(options.auth.persistSession, false);
  console.log('PASS: login redirect, no pre-auth inbox mount, server session verification, rejected sessions, logout race, no persisted login.');
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
