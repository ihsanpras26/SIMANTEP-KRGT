import test from 'node:test';
import assert from 'node:assert/strict';
import { QueryClient } from '@tanstack/react-query';
import {
  createAuthSession,
  isAllowedAdmin,
  signInAdmin,
  signOutAdmin,
} from '../src/features/auth/services/authSession.js';

const adminEmail = 'admin@example.test';
const session = (id = 'admin-1', email = adminEmail) => ({
  user: { id, email },
  access_token: `token-${id}`,
});
const tick = () => new Promise((resolve) => setImmediate(resolve));
function fixture() {
  let listener;
  let resolveBootstrap;
  let stopped = false;
  const states = [];
  const client = new QueryClient();
  const auth = {
    getSession: () =>
      new Promise((resolve) => {
        resolveBootstrap = resolve;
      }),
    onAuthStateChange(callback) {
      listener = callback;
      return {
        data: {
          subscription: {
            unsubscribe: () => {
              stopped = true;
            },
          },
        },
      };
    },
  };
  const stop = createAuthSession({
    auth,
    queryClient: client,
    adminEmail,
    onChange: (state) => states.push(state),
  });
  return {
    client,
    states,
    stop,
    emit: (event, value) => listener(event, value),
    bootstrap: (value) => resolveBootstrap(value),
    get stopped() {
      return stopped;
    },
  };
}

test('admin UI gate fails closed and never trusts user-editable role metadata', () => {
  assert.equal(isAllowedAdmin(session().user, ''), false);
  assert.equal(
    isAllowedAdmin(
      { email: 'other@example.test', user_metadata: { role: 'admin' } },
      adminEmail,
    ),
    false,
  );
  assert.equal(isAllowedAdmin(session().user, ' ADMIN@example.test '), true);
});

test('a later sign-out event wins over an older getSession result', async () => {
  const env = fixture();
  env.emit('SIGNED_OUT', null);
  env.bootstrap({ data: { session: session() }, error: null });
  await tick();
  assert.equal(env.states.at(-1).status, 'anonymous');
  assert.equal(env.states.at(-1).session, null);
  env.stop();
});

test('account changes remove cached records before exposing the next authenticated session', async () => {
  const env = fixture();
  env.bootstrap({ data: { session: session() }, error: null });
  await tick();
  env.client.setQueryData(['arsip'], [{ id: 'private-record' }]);
  env.emit('SIGNED_IN', session('admin-2'));
  assert.equal(env.client.getQueryData(['arsip']), undefined);
  assert.equal(env.states.at(-1).session, null);
  await tick();
  assert.equal(env.states.at(-1).session.user.id, 'admin-2');
  env.stop();
});

test('sign-out aborts pending queries and their late result cannot restore cache', async () => {
  const env = fixture();
  env.bootstrap({ data: { session: session() }, error: null });
  await tick();
  let finish;
  let signal;
  const query = env.client
    .fetchQuery({
      queryKey: ['arsip'],
      queryFn: (context) => {
        signal = context.signal;
        return new Promise((resolve) => {
          finish = resolve;
        });
      },
    })
    .catch(() => undefined);
  env.emit('SIGNED_OUT', null);
  finish([{ id: 'private-record' }]);
  await query;
  await tick();
  assert.equal(signal.aborted, true);
  assert.equal(env.client.getQueryData(['arsip']), undefined);
  assert.equal(env.states.at(-1).status, 'anonymous');
  env.stop();
});

test('token refresh for the same user preserves query cache', async () => {
  const env = fixture();
  env.bootstrap({ data: { session: session() }, error: null });
  await tick();
  env.client.setQueryData(['arsip'], [{ id: 1 }]);
  env.emit('TOKEN_REFRESHED', { ...session(), access_token: 'fresh-token' });
  await tick();
  assert.deepEqual(env.client.getQueryData(['arsip']), [{ id: 1 }]);
  assert.equal(env.states.at(-1).session.access_token, 'fresh-token');
  env.stop();
});

test('a restored non-admin session stays outside the authenticated branch', async () => {
  const env = fixture();
  env.bootstrap({
    data: { session: session('other', 'other@example.test') },
    error: null,
  });
  await tick();
  assert.equal(env.states.at(-1).session, null);
  assert.match(env.states.at(-1).error.message, /izin/i);
  env.stop();
});

test('bootstrap failures surface and unmount ignores late session results', async () => {
  const env = fixture();
  env.bootstrap({ data: null, error: new Error('connection failed') });
  await tick();
  assert.equal(env.states.at(-1).status, 'anonymous');
  assert.equal(env.states.at(-1).error.message, 'connection failed');
  env.stop();
  assert.equal(env.stopped, true);
  const second = fixture();
  second.stop();
  const count = second.states.length;
  second.bootstrap({ data: { session: session() }, error: null });
  await tick();
  assert.equal(second.states.length, count);
});

test('login submits the entered password to Supabase and surfaces rejected credentials', async () => {
  const auth = {
    signInWithPassword: async (credentials) => {
      assert.deepEqual(credentials, {
        email: adminEmail,
        password: 'entered password',
      });
      return {
        data: { session: session(), user: session().user },
        error: null,
      };
    },
  };
  assert.equal(
    (
      await signInAdmin(
        auth,
        ' ADMIN@example.test ',
        'entered password',
        adminEmail,
      )
    ).user.id,
    'admin-1',
  );
  await assert.rejects(
    signInAdmin(
      {
        signInWithPassword: async () => ({
          error: new Error('Invalid login credentials'),
        }),
      },
      adminEmail,
      'wrong',
      adminEmail,
    ),
    /Invalid login credentials/,
  );
});

test('login rejects unsupported accounts and missing admin configuration before authentication', async () => {
  const auth = {
    signInWithPassword: () =>
      assert.fail('must not call auth for disallowed email'),
  };
  await assert.rejects(
    signInAdmin(auth, 'other@example.test', 'password', adminEmail),
    /izin/i,
  );
  await assert.rejects(
    signInAdmin(auth, adminEmail, 'password', ''),
    /konfigurasi/i,
  );
});

test('logout rejects Supabase returned errors rather than reporting success', async () => {
  await assert.rejects(
    signOutAdmin({
      signOut: async () => ({ error: new Error('Network unavailable') }),
    }),
    /Network unavailable/,
  );
  await assert.doesNotReject(
    signOutAdmin({ signOut: async () => ({ error: null }) }),
  );
});
