'use client';

import { User } from '@/types';

interface UserAvatarProps {
  user: User;
  size?: number;
}

export default function UserAvatar({ user, size = 40 }: UserAvatarProps) {
  const getInitials = () => {
    const firstInitial = user.firstName?.charAt(0) || '';
    const lastInitial = user.lastName?.charAt(0) || '';
    return `${firstInitial}${lastInitial}`.toUpperCase();
  };

  return (
    <div
      className="rounded-full bg-white text-gray-900 flex items-center justify-center font-semibold"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.4,
      }}
    >
      {getInitials()}
    </div>
  );
}
