const normalizeEmail = (email) =>
  String(email || "")
    .trim()
    .toLowerCase();

// This is a client-side navigation gate. Database authorization belongs in RLS.
export function isAllowedAdmin(user, adminEmail) {
  const configuredEmail = normalizeEmail(adminEmail);
  return Boolean(
    configuredEmail &&
    user?.id &&
    normalizeEmail(user.email) === configuredEmail,
  );
}

export async function signInAdmin(auth, email, password, adminEmail) {
  if (!normalizeEmail(adminEmail))
    throw new Error("Konfigurasi email admin belum tersedia.");
  const normalizedEmail = normalizeEmail(email);
  if (normalizedEmail !== normalizeEmail(adminEmail))
    throw new Error("Akun ini tidak memiliki izin untuk masuk.");
  const { data, error } = await auth.signInWithPassword({
    email: normalizedEmail,
    password,
  });
  if (error) throw error;
  if (!data?.session || !isAllowedAdmin(data.session.user, adminEmail)) {
    throw new Error("Sesi admin tidak tersedia. Silakan masuk kembali.");
  }
  return data.session;
}

export async function signOutAdmin(auth) {
  const { error } = await auth.signOut();
  if (error) throw error;
}

export function createAuthSession({ auth, queryClient, adminEmail, onChange }) {
  let active = true;
  let revision = 0;
  let publishedIdentity;

  const accept = (candidate, error = null) => {
    if (!active) return;
    const currentRevision = ++revision;
    const allowed = candidate && isAllowedAdmin(candidate.user, adminEmail);
    const session = allowed ? candidate : null;
    const identity = session?.user.id ?? null;
    const state = {
      status: session ? "authenticated" : "anonymous",
      session,
      error:
        error ||
        (candidate && !allowed
          ? new Error("Akun ini tidak memiliki izin untuk mengakses SIMANTEP.")
          : null),
    };
    if (identity === publishedIdentity) {
      onChange(state);
      return;
    }

    // Hide the previous account immediately. Clearing detaches old queries so
    // even a request that ignores AbortSignal cannot populate the next cache.
    onChange({ status: "loading", session: null, error: null });
    const cancellation = queryClient.cancelQueries();
    queryClient.clear();
    Promise.resolve(cancellation)
      .catch(() => {})
      .then(() => {
        if (!active || revision !== currentRevision) return;
        publishedIdentity = identity;
        onChange(state);
      });
  };

  // Keep this callback synchronous: awaited Supabase calls here can deadlock
  // the SDK's auth lock. Cache work does not call the auth client.
  const { data } = auth.onAuthStateChange((_event, session) => {
    accept(session);
  });
  const bootstrapRevision = revision;
  auth
    .getSession()
    .then(({ data: result, error }) => {
      if (active && revision === bootstrapRevision)
        accept(error ? null : (result?.session ?? null), error);
    })
    .catch((error) => {
      if (active && revision === bootstrapRevision) accept(null, error);
    });

  return () => {
    active = false;
    data?.subscription?.unsubscribe();
  };
}
