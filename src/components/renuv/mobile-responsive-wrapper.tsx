/**
 * Mobile Responsive Wrapper Component
 * Provides mobile-optimized styling for Renuv client portal sections
 */

import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ResponsiveSectionProps {
  children: ReactNode;
  className?: string;
  id?: string;
  variant?: 'default' | 'hero' | 'compact';
  printKeepTogether?: boolean;
}

export function ResponsiveSection({ 
  children, 
  className, 
  id,
  variant = 'default',
  printKeepTogether = false
}: ResponsiveSectionProps) {
  const baseClasses = cn(
    // Spacing
    'mb-4 md:mb-6',
    // Border radius - smaller on mobile
    variant === 'hero' ? 'rounded-[24px] md:rounded-[34px]' : 'rounded-[20px] md:rounded-[28px]',
    // Padding - reduced on mobile
    variant === 'compact' ? 'p-3 md:p-4' : 'p-4 md:p-6 lg:p-8',
    // Standard styling
    'border border-[var(--line-soft)] bg-[rgba(255,255,255,0.78)] shadow-[0_24px_70px_rgba(19,44,74,0.08)] backdrop-blur',
    // Print handling
    printKeepTogether && 'long-section',
    className
  );

  return (
    <section 
      id={id} 
      className={baseClasses}
      data-print-keep-together={printKeepTogether}
    >
      {children}
    </section>
  );
}

interface ResponsiveGridProps {
  children: ReactNode;
  columns?: 1 | 2 | 3;
  className?: string;
}

export function ResponsiveGrid({ children, columns = 3, className }: ResponsiveGridProps) {
  const gridClasses = cn(
    'grid gap-3 md:gap-4',
    columns === 1 && 'grid-cols-1',
    columns === 2 && 'sm:grid-cols-2',
    columns === 3 && 'sm:grid-cols-2 xl:grid-cols-3',
    className
  );

  return <div className={gridClasses}>{children}</div>;
}

interface ResponsiveTextProps {
  children: ReactNode;
  variant: 'hero' | 'h2' | 'h3' | 'body' | 'caption';
  className?: string;
}

export function ResponsiveText({ children, variant, className }: ResponsiveTextProps) {
  const variantClasses = {
    hero: 'text-3xl md:text-4xl lg:text-6xl font-semibold tracking-[-0.04em]',
    h2: 'text-xl md:text-2xl font-semibold tracking-[-0.03em]',
    h3: 'text-lg md:text-xl font-semibold tracking-[-0.03em]',
    body: 'text-sm md:text-base leading-6 md:leading-7',
    caption: 'text-xs md:text-sm'
  };

  const Tag = variant === 'hero' ? 'h1' : variant === 'h2' ? 'h2' : variant === 'h3' ? 'h3' : 'p';

  return <Tag className={cn(variantClasses[variant], className)}>{children}</Tag>;
}

interface ResponsiveChartWrapperProps {
  children: ReactNode;
  className?: string;
}

export function ResponsiveChartWrapper({ children, className }: ResponsiveChartWrapperProps) {
  return (
    <div 
      className={cn(
        'mt-4 md:mt-6',
        'h-48 md:h-64',
        'rounded-[18px] md:rounded-[24px]',
        'border border-[var(--line-soft)]',
        'bg-gradient-to-br from-[rgba(94,168,255,0.04)] to-white',
        'p-4 md:p-6',
        'overflow-x-auto',
        'chart-wrapper',
        className
      )}
      data-print-keep-together
    >
      {children}
    </div>
  );
}
