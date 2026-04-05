import { DashboardLayout } from '@/components/renuv/dashboard-layout';
import { ReactNode } from 'react';

export default function ClientRenuvLayout({ children }: { children: ReactNode }) {
  return (
    <DashboardLayout
      brandName="Renuv"
      isInternal={false}
      showLiveIndicator={true}
    >
      {children}
    </DashboardLayout>
  );
}
