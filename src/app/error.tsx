'use client';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[#eef5fb] p-8 text-center">
      <h1 className="text-2xl font-semibold tracking-[-0.02em] text-[#16324a]">
        Something went wrong
      </h1>
      <p className="max-w-md text-sm leading-6 text-[#627587]">
        {error.message || 'An unexpected error occurred while rendering Mission Control.'}
      </p>
      <button
        type="button"
        onClick={reset}
        className="rounded-full bg-[#16324a] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1f3e5f]"
      >
        Try again
      </button>
    </main>
  );
}
