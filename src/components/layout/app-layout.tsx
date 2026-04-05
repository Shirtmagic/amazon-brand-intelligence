import { ReactNode } from 'react';
import { Clock, MessageSquare } from 'lucide-react';

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-neutral-950 text-sand-50 font-sans">
      <header className="border-b border-white/10 bg-neutral-950/80 backdrop-blur px-6 py-4 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-honey-400">Mission Control</p>
          <h1 className="text-2xl font-semibold text-white">Agent Operations Dashboard</h1>
        </div>
        <div className="flex items-center gap-6 text-sm text-white/70">
          <div className="flex items-center gap-2"><Clock size={16}/> <span>EST</span></div>
          <div className="flex items-center gap-2"><MessageSquare size={16}/> <span>Live Threads</span></div>
        </div>
      </header>
      <main className="px-6 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-6">
          {children}
        </div>
      </main>
    </div>
  );
}
