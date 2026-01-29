'use client';

import Image from 'next/image';

interface LogoProps {
  collapsed?: boolean;
  invert?: boolean;
}

export default function Logo({ collapsed = false, invert = true }: LogoProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-4">
      <Image
        src="/logo.png"
        alt="CoreMachine Logo"
        width={32}
        height={32}
        className={invert ? 'invert' : ''}
      />
      {!collapsed && (
        <span className="font-bold text-lg">CoreMachine</span>
      )}
    </div>
  );
}
