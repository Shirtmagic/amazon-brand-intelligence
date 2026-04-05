'use client';

import { PaletteEntry } from '@/lib/types';
import { useState } from 'react';

interface Props {
  palettes: PaletteEntry[];
}

export function PaletteAccordion({ palettes }: Props) {
  const [open, setOpen] = useState<string | undefined>(palettes[0]?.brand);

  return (
    <section className="card-shell">
      <header className="mb-4">
        <p className="text-xs tracking-[0.3em] uppercase text-white/60">Palettes</p>
        <h2 className="text-xl font-semibold">Color Systems</h2>
      </header>
      <div className="space-y-2">
        {palettes.map((entry) => (
          <div key={entry.brand} className="rounded-2xl border border-white/10 overflow-hidden">
            <button
              className="w-full flex items-center justify-between px-4 py-3 text-left text-sm font-medium"
              onClick={() => setOpen(entry.brand === open ? undefined : entry.brand)}
            >
              <span>{entry.brand}</span>
              <span className="text-xs text-white/60">Updated {new Date(entry.updatedAt).toLocaleDateString()}</span>
            </button>
            {open === entry.brand && (
              <div className="px-4 pb-4">
                <div className="flex gap-3 flex-wrap">
                  {entry.swatches.map((swatch) => (
                    <div key={swatch.hex} className="flex-1 min-w-[120px]">
                      <div className="h-12 rounded-xl" style={{ backgroundColor: swatch.hex }} />
                      <p className="text-xs mt-1 text-white/80">{swatch.name}</p>
                      <p className="text-[10px] text-white/60">{swatch.hex}</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-white/50 mt-3">Source: {entry.source}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
