import type { ReactNode } from 'react';

import AppNavbar from '../components/AppNavbar';

type AppLayoutProps = {
  children: ReactNode;
};

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="app-background">
      <AppNavbar />

      <main className="container py-4">
        {children}
      </main>
    </div>
  );
}