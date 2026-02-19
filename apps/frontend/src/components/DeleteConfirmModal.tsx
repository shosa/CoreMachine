'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface RelatedEntity {
  label: string;
  count: number;
}

interface DeleteConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  entityName: string;
  entityLabel: string;
  fetchRelated?: () => Promise<RelatedEntity[]>;
  staticRelated?: RelatedEntity[];
  isDeleting?: boolean;
}

const IconTrashLarge = () => (
  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const IconWarning = () => (
  <svg className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

export default function DeleteConfirmModal({
  open,
  onClose,
  onConfirm,
  entityName,
  entityLabel,
  fetchRelated,
  staticRelated,
  isDeleting = false,
}: DeleteConfirmModalProps) {
  const [loading, setLoading] = useState(false);
  const [related, setRelated] = useState<RelatedEntity[]>(staticRelated ?? []);

  useEffect(() => {
    if (open && fetchRelated) {
      setLoading(true);
      fetchRelated()
        .then(setRelated)
        .catch(() => setRelated([]))
        .finally(() => setLoading(false));
    } else if (open && staticRelated) {
      setRelated(staticRelated);
    }
    if (!open) {
      setRelated(staticRelated ?? []);
    }
  }, [open]);

  const filteredRelated = related.filter(r => r.count > 0);
  const hasRelated = filteredRelated.length > 0;

  const handleBackdropClick = () => {
    if (!isDeleting && !loading) onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40"
            onClick={handleBackdropClick}
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="relative bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 z-10 overflow-hidden"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <IconTrashLarge />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Conferma Eliminazione</h2>
                <p className="text-sm text-gray-500">{entityName}</p>
              </div>
            </div>

            {/* Body */}
            <div className="px-6 py-5">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-6 gap-3">
                  <div className="w-8 h-8 border-4 border-gray-200 border-t-gray-700 rounded-full animate-spin" />
                  <p className="text-sm text-gray-500">Caricamento informazioni...</p>
                </div>
              ) : (
                <>
                  <p className="text-gray-700 mb-4">
                    Sei sicuro di voler eliminare{' '}
                    <span className="font-semibold text-gray-900">{entityLabel}</span>?{' '}
                    Questa azione non può essere annullata.
                  </p>

                  {hasRelated && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                      <div className="flex items-start gap-2 mb-2">
                        <IconWarning />
                        <p className="text-sm font-semibold text-amber-800">
                          Verranno eliminati anche:
                        </p>
                      </div>
                      <ul className="space-y-1.5 ml-6">
                        {filteredRelated.map(r => (
                          <li key={r.label} className="text-sm text-amber-700 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                            <span className="font-semibold">{r.count}</span>&nbsp;{r.label}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={onClose}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
              >
                Annulla
              </button>
              <button
                onClick={onConfirm}
                disabled={loading || isDeleting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Eliminazione...
                  </>
                ) : (
                  'Elimina'
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
