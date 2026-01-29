'use client';

import { ReactNode } from 'react';

interface WidgetProps {
  title?: string;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}

export default function Widget({ title, children, action, className = '' }: WidgetProps) {
  return (
    <div className={`card p-4 sm:p-5 md:p-6 h-full flex flex-col overflow-hidden ${className}`}>
      {(title || action) && (
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-4">
          {title && (
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">{title}</h2>
          )}
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
