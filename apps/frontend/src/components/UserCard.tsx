'use client';

import { User } from '@/types';

interface UserCardProps {
  user: User;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export default function UserCard({ user, onEdit, onDelete }: UserCardProps) {
  const roleBadgeClass: Record<string, string> = {
    admin: 'badge badge-blue',
    tecnico: 'badge badge-green',
    utente: 'badge badge-gray',
  };

  const roleLabels: Record<string, string> = {
    admin: 'Admin',
    tecnico: 'Tecnico',
    utente: 'Utente',
  };

  const initials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase();

  return (
    <div className="card p-4 h-full flex flex-col hover:-translate-y-1 hover:shadow-lg transition-all duration-200">
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-3">
          <div
            className={`w-14 h-14 rounded-full flex items-center justify-center font-semibold text-white ${
              user.isActive ? 'bg-blue-600' : 'bg-gray-400'
            }`}
          >
            {initials || (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate">
              {user.firstName} {user.lastName}
            </h3>
            <p className="text-sm text-gray-500 truncate">{user.email}</p>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          <span className={roleBadgeClass[user.role] || 'badge badge-gray'}>
            {roleLabels[user.role] || user.role}
          </span>
          <span className={user.isActive ? 'badge badge-green' : 'badge badge-gray'}>
            {user.isActive ? 'Attivo' : 'Inattivo'}
          </span>
        </div>
      </div>

      <div className="flex justify-end gap-1 mt-4 pt-3 border-t border-gray-100">
        {onEdit && (
          <button
            onClick={() => onEdit(user.id)}
            className="p-2 rounded-lg bg-gray-900 text-white hover:bg-gray-800 transition-colors"
            title="Modifica"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        )}

        {onDelete && (
          <button
            onClick={() => onDelete(user.id)}
            className="p-2 rounded-lg bg-gray-900 text-white hover:bg-red-600 transition-colors"
            title="Elimina"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
