'use client';

import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { Navigation, TopBar } from './navigation';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: ReactNode;
  brandName?: string;
  periodLabel?: string;
  isInternal?: boolean;
  showLiveIndicator?: boolean;
}

export function DashboardLayout({
  children,
  brandName = 'Renuv',
  periodLabel,
  isInternal,
  showLiveIndicator = true
}: DashboardLayoutProps) {
  const pathname = usePathname();

  // Generate breadcrumbs from pathname
  const breadcrumbs = generateBreadcrumbs(pathname);

  return (
    <div className="flex min-h-screen bg-[radial-gradient(circle_at_top,rgba(94,168,255,0.18),transparent_32%),linear-gradient(180deg,#eef5fb_0%,#f7f9fc_58%,#edf3f9_100%)]">
      <Navigation />
      
      <div className="flex-1 lg:pl-60">
        <TopBar
          brandName={brandName}
          isInternal={isInternal}
          showLiveIndicator={showLiveIndicator}
        />
        
        {/* Breadcrumbs */}
        {breadcrumbs.length > 1 && (
          <div className="border-b border-[var(--line-soft)] bg-white/40 px-6 py-3">
            <nav className="flex items-center gap-2 text-xs text-[var(--ink-600)]">
              {breadcrumbs.map((crumb, i) => (
                <div key={i} className="flex items-center gap-2">
                  {i > 0 && <ChevronRight size={12} className="opacity-50" />}
                  {crumb.href ? (
                    <Link
                      href={crumb.href}
                      className="font-medium transition-colors hover:text-[var(--blue-700)]"
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="font-semibold text-[var(--ink-900)]">{crumb.label}</span>
                  )}
                </div>
              ))}
            </nav>
          </div>
        )}

        <main className="p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

function generateBreadcrumbs(pathname: string) {
  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs: { label: string; href?: string }[] = [];

  // Home
  breadcrumbs.push({ label: 'Mission Control', href: '/' });

  // Build path incrementally
  let currentPath = '';
  segments.forEach((segment, i) => {
    currentPath += `/${segment}`;
    const isLast = i === segments.length - 1;
    
    const label = formatSegmentLabel(segment);
    
    breadcrumbs.push({
      label,
      href: isLast ? undefined : currentPath
    });
  });

  return breadcrumbs;
}

function formatSegmentLabel(segment: string): string {
  // Handle special cases
  const labelMap: Record<string, string> = {
    'internal': 'Internal',
    'client': 'Client Portal',
    'renuv': 'Renuv',
    'asins': 'ASIN Performance',
    'traffic-conversion': 'Traffic & Conversion',
    'retail-health': 'Retail Health',
    'advertising': 'Advertising',
    'search': 'Search',
    'alerts': 'Alerts',
    'notes': 'Notes & Actions',
    'freshness': 'Data Freshness',
    'performance': 'Performance',
    'recommendations': 'Recommendations'
  };

  return labelMap[segment] || segment.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
}
