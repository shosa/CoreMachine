import type { ReactNode } from 'react';

export default function MobileLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto">
        {children}
      </div>
    </div>
  );
}
