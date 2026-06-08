'use client';

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 text-center px-6 bg-background font-sans">
      <div className="h-12 w-12 rounded-2xl flex items-center justify-center bg-foreground">
        <span className="text-xl font-bold text-background">M</span>
      </div>

      <div className="space-y-2">
        <h1 className="text-xl font-semibold text-foreground">You&apos;re offline</h1>
        <p className="text-sm max-w-xs text-muted-foreground">
          Minerva OS requires a connection to your workspace. Check your network and try again.
        </p>
      </div>

      <button
        onClick={() => window.location.reload()}
        className="px-6 py-2.5 rounded-xl text-sm font-medium transition-opacity hover:opacity-80 bg-foreground text-background"
      >
        Retry connection
      </button>
    </div>
  );
}
