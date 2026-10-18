import { lazy, Suspense, useRef } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { supabase, configurationError } from '../lib/supabaseClient';
import { useAuthSession } from '../features/auth/hooks/useAuthSession';
import {
  signInAdmin,
  signOutAdmin,
} from '../features/auth/services/authSession';
import LoginPage from '../features/auth/components/LoginPage';
import ConfigurationMessage from '../features/auth/components/ConfigurationMessage';
import RouteLoading from './RouteLoading';
import RouteErrorBoundary from './RouteErrorBoundary';

import { NavigationGuardContext } from '../lib/navigationGuard';

const AuthenticatedApp = lazy(() => import('./AuthenticatedApp'));
// Preserve main's temporary development-access switch.
const AUTH_ENABLED = import.meta.env.VITE_AUTH_ENABLED === 'true';
const adminEmail = String(import.meta.env.VITE_ADMIN_EMAIL || '').trim();

export default function App() {
  const auth = useAuthSession(AUTH_ENABLED ? supabase : null, adminEmail);
  const onLogin = (email, password) =>
    signInAdmin(supabase.auth, email, password, adminEmail);
  const logoutGuard = useRef(null);
  const performLogout = async () => {
    try {
      await signOutAdmin(supabase.auth);
      toast.success('Anda telah keluar.');
    } catch (error) {
      toast.error(error.message || 'Gagal keluar. Silakan coba kembali.');
    }
  };

  const onLogout = () =>
    logoutGuard.current ? logoutGuard.current(performLogout) : performLogout();

  if (!supabase || (AUTH_ENABLED && !adminEmail))
    return (
      <ConfigurationMessage
        reason={configurationError || 'Email admin belum dikonfigurasi.'}
      />
    );

  return (
    <NavigationGuardContext.Provider value={logoutGuard}>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: 'var(--surface)',
            color: 'var(--text-primary)',
            border: '1px solid var(--line)',
            borderRadius: '16px',
          },
          success: { iconTheme: { primary: '#8052ff', secondary: '#fff' } },
        }}
      />
      {AUTH_ENABLED && auth.status === 'loading' ? (
        <div className="min-h-dvh bg-[var(--canvas)]">
          <RouteLoading message="Memeriksa sesi…" />
        </div>
      ) : !AUTH_ENABLED || auth.session ? (
        <RouteErrorBoundary>
          <Suspense
            fallback={<RouteLoading message="Menyiapkan ruang kerja…" />}
          >
            <AuthenticatedApp
              key={auth.session?.user?.id || 'development'}
              session={AUTH_ENABLED ? auth.session : null}
              onLogout={AUTH_ENABLED ? onLogout : undefined}
            />
          </Suspense>
        </RouteErrorBoundary>
      ) : (
        <LoginPage onSubmit={onLogin} error={auth.error} />
      )}
    </NavigationGuardContext.Provider>
  );
}
