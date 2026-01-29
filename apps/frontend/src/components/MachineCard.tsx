'use client';

import { Machine } from '@/types';

interface MachineCardProps {
  machine: Machine;
  onView: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onQRCode?: (id: string) => void;
}

export default function MachineCard({ machine, onView, onEdit, onDelete, onQRCode }: MachineCardProps) {
  return (
    <div className="card p-4 h-full flex flex-col hover:-translate-y-1 hover:shadow-lg transition-all duration-200">
      <div className="flex-1">
        <div className="mb-3">
          <h3 className="font-semibold text-gray-900 text-lg mb-1">{machine.serialNumber}</h3>
          <span className="badge badge-gray">{machine.type?.name || 'N/A'}</span>
        </div>

        <div className="space-y-2 text-sm">
          <div>
            <span className="text-gray-400 text-xs">Produttore</span>
            <p className="font-medium text-gray-700">{machine.manufacturer || '-'}</p>
          </div>
          <div>
            <span className="text-gray-400 text-xs">Modello</span>
            <p className="font-medium text-gray-700">{machine.model || '-'}</p>
          </div>
          {machine.yearBuilt && (
            <div>
              <span className="text-gray-400 text-xs">Anno</span>
              <p className="font-medium text-gray-700">{machine.yearBuilt}</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-1 mt-4 pt-3 border-t border-gray-100">
        <button
          onClick={() => onView(machine.id)}
          className="p-2 rounded-lg bg-gray-900 text-white hover:bg-gray-800 transition-colors"
          title="Visualizza"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        </button>

        {onQRCode && (
          <button
            onClick={() => onQRCode(machine.id)}
            className="p-2 rounded-lg bg-gray-900 text-white hover:bg-gray-800 transition-colors"
            title="QR Code"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
          </button>
        )}

        {onEdit && (
          <button
            onClick={() => onEdit(machine.id)}
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
            onClick={() => onDelete(machine.id)}
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
