'use client';

import { useState, useEffect, useCallback } from 'react';
import { KeywordTrackerSection } from '@/components/renuv/keyword-tracker';
import type { KeywordTrackerData } from '@/lib/renuv-keyword-tracker';

const STORAGE_KEY = 'renuv_tracked_keywords';

export function KeywordTrackerPageClient({ initialData, defaultKeywords }: {
  initialData: KeywordTrackerData;
  defaultKeywords: string[];
}) {
  const [data, setData] = useState<KeywordTrackerData>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // On mount, check localStorage for saved keywords and refetch if different
  useEffect(() => {
    if (initialized) return;
    setInitialized(true);

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved: string[] = JSON.parse(raw);
        // Check if saved keywords differ from defaults
        const savedSet = new Set(saved);
        const defaultSet = new Set(defaultKeywords);
        const isDifferent = saved.length !== defaultKeywords.length ||
          saved.some(k => !defaultSet.has(k));

        if (isDifferent && saved.length > 0) {
          fetchData(saved);
        }
      }
    } catch {
      // ignore
    }
  }, [initialized, defaultKeywords]);

  const fetchData = useCallback(async (keywords: string[]) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/keyword-tracker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keywords }),
      });
      if (res.ok) {
        const newData = await res.json();
        setData(newData);
      }
    } catch (err) {
      console.error('Failed to fetch keyword tracker data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  function handleKeywordsChange(keywords: string[]) {
    // Save to localStorage and refetch
    localStorage.setItem(STORAGE_KEY, JSON.stringify(keywords));
    fetchData(keywords);
  }

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6">
      {isLoading && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-[#eef2f6] px-4 py-2">
          <div className="h-3 w-3 animate-spin rounded-full border-2 border-[var(--blue-700)] border-t-transparent" />
          <p className="text-xs font-medium text-[var(--ink-700)]">Updating keyword data...</p>
        </div>
      )}
      <KeywordTrackerSection data={data} onKeywordsChange={handleKeywordsChange} />
    </div>
  );
}
