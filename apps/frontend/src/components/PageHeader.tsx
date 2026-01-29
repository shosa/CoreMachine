'use client';

import Link from 'next/link';
import { ReactNode } from 'react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  breadcrumbs?: BreadcrumbItem[];
  renderRight?: ReactNode;
}

export default function PageHeader({ title, breadcrumbs, renderRight }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4 mb-6">
      <div className="min-w-0 flex-1">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            {breadcrumbs.map((crumb, index) => {
              const isLast = index === breadcrumbs.length - 1;
              return (
                <span key={index} className="flex items-center gap-2">
                  {index > 0 && <span>/</span>}
                  {isLast || !crumb.href ? (
                    <span className="truncate">{crumb.label}</span>
                  ) : (
                    <Link href={crumb.href} className="hover:text-gray-700 truncate">
                      {crumb.label}
                    </Link>
                  )}
                </span>
              );
            })}
          </div>
        )}
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
      </div>
      {renderRight && (
        <div className="flex gap-2 flex-wrap items-center">
          {renderRight}
        </div>
      )}
    </div>
  );
}
