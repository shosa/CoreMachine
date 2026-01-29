'use client';

import { Maintenance } from '@/types';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { motion } from 'framer-motion';

interface MaintenanceCardProps {
  maintenance: Maintenance;
  onView?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

const typeBadgeClass: Record<string, string> = {
  ordinaria: 'badge badge-green',
  straordinaria: 'badge badge-blue',
  guasto: 'badge badge-red',
  riparazione: 'badge badge-yellow',
};

const typeLabels: Record<string, string> = {
  ordinaria: 'Ordinaria',
  straordinaria: 'Straordinaria',
  guasto: 'Guasto',
  riparazione: 'Riparazione',
};

export default function MaintenanceCard({ maintenance, onView, onEdit, onDelete }: MaintenanceCardProps) {
  return (
    <motion.div
      className="card flex flex-col h-full hover:shadow-md transition-shadow duration-200"
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex-1 p-5">
        {/* Header */}
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-1.5">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-xs text-gray-500">
              {format(new Date(maintenance.date), 'dd MMM yyyy', { locale: it })}
            </span>
          </div>
          <span className={typeBadgeClass[maintenance.type] || 'badge badge-gray'}>
            {typeLabels[maintenance.type] || maintenance.type}
          </span>
        </div>

        {/* Details */}
        <div className="flex flex-col gap-3">
          <div>
            <span className="text-xs text-gray-500 block">Macchinario</span>
            <span className="text-sm font-semibold text-gray-900">
              {maintenance.machine
                ? `${maintenance.machine.model || maintenance.machine.manufacturer || ''} (${maintenance.machine.serialNumber})`.trim()
                : '-'}
            </span>
          </div>

          <div>
            <span className="text-xs text-gray-500 block">Operatore</span>
            <span className="text-sm font-medium text-gray-900">
              {maintenance.operator
                ? `${maintenance.operator.firstName} ${maintenance.operator.lastName}`
                : '-'}
            </span>
          </div>

          <div>
            <span className="text-xs text-gray-500 block">Lavoro Eseguito</span>
            <p className="text-sm text-gray-700 line-clamp-2">
              {maintenance.workPerformed || '-'}
            </p>
          </div>

          {maintenance.cost && (
            <div>
              <span className="text-xs text-gray-500 block">Costo</span>
              <span className="text-sm font-semibold text-gray-900">
                &euro;{Number(maintenance.cost).toFixed(2)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-1.5 px-4 pb-4">
        {onView && (
          <button
            onClick={() => onView(maintenance.id)}
            title="Visualizza"
            className="p-1.5 bg-gray-900 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </button>
        )}

        {onEdit && (
          <button
            onClick={() => onEdit(maintenance.id)}
            title="Modifica"
            className="p-1.5 bg-gray-900 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        )}

        {onDelete && (
          <button
            onClick={() => onDelete(maintenance.id)}
            title="Elimina"
            className="p-1.5 bg-gray-900 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>
    </motion.div>
  );
}
