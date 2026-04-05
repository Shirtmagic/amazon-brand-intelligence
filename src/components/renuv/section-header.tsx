import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SectionHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  actions?: ReactNode;
  className?: string;
}

export function SectionHeader({
  title,
  description,
  icon: Icon,
  actions,
  className
}: SectionHeaderProps) {
  return (
    <div className={cn('mb-6', className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--blue-700)]/10">
                <Icon size={20} className="text-[var(--blue-700)]" />
              </div>
            )}
            <h2 className="text-2xl font-semibold tracking-tight text-[var(--ink-950)]">
              {title}
            </h2>
          </div>
          {description && (
            <p className="mt-2 text-sm leading-relaxed text-[var(--ink-700)]">
              {description}
            </p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      <div className="mt-4 h-px bg-gradient-to-r from-[var(--line-soft)] via-[var(--line-soft)] to-transparent" />
    </div>
  );
}
