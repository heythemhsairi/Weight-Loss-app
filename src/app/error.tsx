'use client';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const isConfig = /Supabase is not configured/i.test(error.message);
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="card max-w-md text-center space-y-3">
        <div className="text-4xl">⚠️</div>
        <h1 className="text-lg font-bold">Something went wrong</h1>
        {isConfig ? (
          <p className="text-sm text-muted">
            The app can&apos;t reach its database. On Vercel, add
            <code className="text-brand"> NEXT_PUBLIC_SUPABASE_URL </code> and
            <code className="text-brand"> NEXT_PUBLIC_SUPABASE_ANON_KEY </code>
            under Settings → Environment Variables, then redeploy.
          </p>
        ) : (
          <p className="text-sm text-muted break-words">{error.message || 'Unexpected error.'}</p>
        )}
        {error.digest && <p className="text-[11px] text-muted">Digest: {error.digest}</p>}
        <button onClick={reset} className="btn-primary">Try again</button>
      </div>
    </div>
  );
}
