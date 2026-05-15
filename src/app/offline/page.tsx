'use client';

export default function OfflinePage() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-6 text-center px-6"
      style={{ backgroundColor: '#0A0D14', fontFamily: "'Inter', sans-serif" }}
    >
      <div
        className="h-12 w-12 rounded-2xl flex items-center justify-center"
        style={{ backgroundColor: '#F5F1E8' }}
      >
        <span className="text-xl font-bold" style={{ color: '#0A0D14' }}>M</span>
      </div>

      <div className="space-y-2">
        <h1 className="text-xl font-semibold" style={{ color: '#F5F1E8' }}>You're offline</h1>
        <p className="text-sm max-w-xs" style={{ color: '#8A9099' }}>
          Minerva OS requires a connection to your Convex workspace. Check your network and try again.
        </p>
      </div>

      <button
        onClick={() => window.location.reload()}
        className="px-6 py-2.5 rounded-xl text-sm font-medium transition-opacity hover:opacity-80"
        style={{ backgroundColor: '#F5F1E8', color: '#0A0D14' }}
      >
        Retry connection
      </button>
    </div>
  );
}
