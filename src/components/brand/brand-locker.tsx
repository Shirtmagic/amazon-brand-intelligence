import { BrandCard } from '@/lib/types';
import { ExternalLink } from 'lucide-react';

interface Props {
  brands: BrandCard[];
}

export function BrandLocker({ brands }: Props) {
  return (
    <section className="card-shell">
      <header className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs tracking-[0.3em] uppercase text-white/60">Brands</p>
          <h2 className="text-xl font-semibold">Brand Locker</h2>
        </div>
      </header>
      <div className="space-y-3">
        {brands.map((brand) => (
          <article key={brand.slug} className="p-3 rounded-2xl border border-white/10 bg-white/[0.02] flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white">{brand.name}</p>
              <p className="text-xs text-white/60">{brand.dropboxPath}</p>
            </div>
            {brand.dropboxLink ? (
              <a
                href={brand.dropboxLink}
                className="text-xs inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-evergreen/20 text-white"
                target="_blank"
                rel="noreferrer"
              >
                Open <ExternalLink size={14} />
              </a>
            ) : (
              <span className="text-xs px-3 py-1.5 rounded-full border border-dashed border-white/30 text-white/70">
                Waiting on link
              </span>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
