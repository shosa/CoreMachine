'use client';

import Image from 'next/image';

interface MainFooterLogoProps {
  opacity?: number;
}

export default function MainFooterLogo({ opacity = 1 }: MainFooterLogoProps) {
  return (
    <div
      className="absolute bottom-0 right-0 p-3"
      style={{ opacity }}
    >
      <Image
        src="/logo.png"
        alt="CoreMachine Logo"
        width={80}
        height={80}
      />
    </div>
  );
}
