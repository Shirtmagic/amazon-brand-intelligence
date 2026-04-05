import { DashboardLayout } from '@/components/renuv/dashboard-layout';
import { ReactNode } from 'react';

export default function InternalRenuvLayout({ children }: { children: ReactNode }) {
  return (
    <DashboardLayout
      brandName="Renuv"
      isInternal={true}
      showLiveIndicator={true}
    >
      {children}
    </DashboardLayout>
  );
}
