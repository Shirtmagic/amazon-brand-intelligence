'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Menu, X, ChevronDown, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DateRangePicker } from './date-range-picker';
import { brandRoot, clientRoute, internalRoute } from '@/lib/renuv-routes';

interface NavSection {
  title: string;
  badge?: 'Internal' | 'Client Portal';
  items: {
    label: string;
    href: string;
  }[];
}

function getNavSections(brand?: string): NavSection[] {
  return [
    {
      title: 'Internal',
      badge: 'Internal',
      items: [
        { label: 'Overview', href: internalRoute(brand) },
        { label: 'Alerts', href: internalRoute(brand, 'alerts') },
        { label: 'Advertising', href: internalRoute(brand, 'advertising') },
        { label: 'Search', href: internalRoute(brand, 'search') },
        { label: 'Traffic & Conversion', href: internalRoute(brand, 'traffic-conversion') },
        { label: 'ASIN Performance', href: internalRoute(brand, 'asins') },
        { label: 'Retail Health', href: internalRoute(brand, 'retail-health') },
        { label: 'Notes & Actions', href: internalRoute(brand, 'notes') },
        { label: 'Data Freshness', href: internalRoute(brand, 'freshness') }
      ]
    },
    {
      title: 'Client Portal',
      badge: 'Client Portal',
      items: [
        { label: 'Overview', href: clientRoute(brand) },
        { label: 'Performance', href: clientRoute(brand, 'performance') },
        { label: 'Advertising', href: clientRoute(brand, 'advertising') },
        { label: 'Search', href: clientRoute(brand, 'search') },
        { label: 'Recommendations', href: clientRoute(brand, 'recommendations') },
        { label: 'Retail Health', href: clientRoute(brand, 'retail-health') }
      ]
    }
  ];
}

export function Navigation({ brand }: { brand?: string } = {}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navSections = getNavSections(brand);

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed left-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--navy-900)] text-white shadow-lg lg:hidden"
        aria-label="Toggle navigation"
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-screen w-60 bg-[var(--navy-900)] text-white transition-transform duration-300',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo area */}
          <div className="border-b border-white/10 px-5 py-6">
            <Link href={brandRoot(brand)} className="flex items-center gap-2 text-lg font-semibold">
              <span className="text-2xl">🐝</span>
              <span>Blue Bees</span>
            </Link>
          </div>

          {/* Brand selector */}
          <div className="border-b border-white/10 px-5 py-4">
            <button className="flex w-full items-center justify-between rounded-lg bg-white/5 px-3 py-2 text-sm font-medium transition-colors hover:bg-white/10">
              <span>Renuv</span>
              <ChevronDown size={16} className="opacity-60" />
            </button>
          </div>

          {/* Nav sections */}
          <nav className="flex-1 overflow-y-auto px-3 py-4">
            {navSections.map((section) => (
              <div key={section.title} className="mb-6">
                <div className="mb-2 flex items-center gap-2 px-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-white/50">
                    {section.title}
                  </p>
                  {section.badge && (
                    <span className="rounded-full bg-white/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white/70">
                      {section.badge === 'Internal' ? 'INT' : 'CLIENT'}
                    </span>
                  )}
                </div>
                <ul className="space-y-0.5">
                  {section.items.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={() => setMobileOpen(false)}
                          className={cn(
                            'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                            isActive
                              ? 'bg-white/15 text-white shadow-sm'
                              : 'text-white/70 hover:bg-white/5 hover:text-white'
                          )}
                        >
                          <Circle
                            size={6}
                            className={cn(
                              'flex-shrink-0',
                              isActive ? 'fill-blue-400 text-blue-400' : 'fill-white/30 text-white/30'
                            )}
                          />
                          {item.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>

          {/* Footer */}
          <div className="border-t border-white/10 px-5 py-4">
            <p className="text-xs text-white/50">Mission Control · Renuv</p>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
    </>
  );
}

interface TopBarProps {
  brandName: string;
  periodLabel?: string;
  isInternal?: boolean;
  showLiveIndicator?: boolean;
}

export function TopBar({ brandName, periodLabel, isInternal, showLiveIndicator = true }: TopBarProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-[var(--line-soft)] bg-white/80 backdrop-blur-sm">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-[var(--ink-950)]">{brandName}</h2>
          {isInternal && (
            <span className="rounded-full bg-[var(--navy-900)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
              Internal
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          <DateRangePicker />
          {showLiveIndicator && (
            <div className="flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
              </span>
              Live Data
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
