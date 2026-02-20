'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import axiosInstance from '@/lib/axios';
import { useToast } from '@/components/Toast';
import { Maintenance, User } from '@/types';

const TYPE_LABELS: Record<string, string> = {
  ordinaria: 'Ordinaria',
  straordinaria: 'Straordinaria',
  guasto: 'Guasto',
  riparazione: 'Riparazione',
};

const TYPE_COLORS: Record<string, string> = {
  ordinaria: 'bg-green-100 text-green-800',
  straordinaria: 'bg-blue-100 text-blue-800',
  guasto: 'bg-red-100 text-red-800',
  riparazione: 'bg-amber-100 text-amber-800',
};

interface ApproveModal {
  open: boolean;
  maintenance: Maintenance | null;
}

export default function PendingMaintenancesPage() {
  const toast = useToast();
  const [drafts, setDrafts] = useState<Maintenance[]>([]);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [approveModal, setApproveModal] = useState<ApproveModal>({ open: false, maintenance: null });
  const [approveForm, setApproveForm] = useState({ operatorId: '', spareParts: '', cost: '' });
  const [approving, setApproving] = useState(false);

  const fetchDrafts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/maintenances/drafts');
      setDrafts(res.data);
    } catch {
      toast.showError('Errore nel caricamento delle bozze');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDrafts();
    axiosInstance.get('/users').then((r) => setUsers(r.data)).catch(() => {});
  }, [fetchDrafts]);

  const openApprove = (m: Maintenance) => {
    setApproveForm({ operatorId: '', spareParts: '', cost: '' });
    setApproveModal({ open: true, maintenance: m });
  };

  const handleApprove = async () => {
    if (!approveModal.maintenance || !approveForm.operatorId) return;
    setApproving(true);
    try {
      await axiosInstance.post(`/maintenances/${approveModal.maintenance.id}/approve`, {
        operatorId: approveForm.operatorId,
        spareParts: approveForm.spareParts || undefined,
        cost: approveForm.cost ? Number(approveForm.cost) : undefined,
      });
      toast.showSuccess('Manutenzione approvata e confermata');
      setApproveModal({ open: false, maintenance: null });
      fetchDrafts();
    } catch (err: any) {
      toast.showError(err.response?.data?.message || 'Errore durante l\'approvazione');
    } finally {
      setApproving(false);
    }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bozze Mobile</h1>
          <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
            <Link href="/dashboard" className="hover:text-gray-700">Dashboard</Link>
            <span>/</span>
            <Link href="/maintenances" className="hover:text-gray-700">Manutenzioni</Link>
            <span>/</span>
            <span>Bozze Mobile</span>
          </div>
        </div>
        <span className="text-sm text-gray-500">{drafts.length} bozze in attesa</span>
      </div>

      {/* Info banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3">
        <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-sm text-amber-800">
          Queste manutenzioni sono state registrate da dispositivi mobili tramite QR code.
          Completale assegnando un operatore e confermandole.
        </p>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="flex justify-center p-12">
            <div className="w-10 h-10 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
          </div>
        ) : drafts.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="font-medium text-gray-500">Nessuna bozza in attesa</p>
            <p className="text-sm mt-1">Le manutenzioni registrate da mobile appariranno qui.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-3 px-4 font-semibold text-gray-600">Data</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600">Macchinario</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600">Tipo</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600">Lavoro eseguito</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600">Nota</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600">Azioni</th>
                </tr>
              </thead>
              <tbody>
                {drafts.map((m) => (
                  <tr key={m.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap text-gray-600">{formatDate(m.date)}</td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900">{(m.machine as any)?.serialNumber}</div>
                      <div className="text-xs text-gray-500">{(m.machine as any)?.description}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${TYPE_COLORS[m.type] ?? ''}`}>
                        {TYPE_LABELS[m.type] ?? m.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-700 max-w-xs">
                      <p className="truncate">{m.workPerformed}</p>
                    </td>
                    <td className="py-3 px-4 text-gray-500 text-xs">
                      {m.mobileNote || <span className="text-gray-300">—</span>}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => openApprove(m)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white rounded-lg text-xs font-medium hover:bg-gray-700 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Approva
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Approve Modal */}
      <AnimatePresence>
        {approveModal.open && approveModal.maintenance && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40"
              onClick={() => !approving && setApproveModal({ open: false, maintenance: null })}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden z-10"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">Approva Manutenzione</h2>
                <button
                  onClick={() => setApproveModal({ open: false, maintenance: null })}
                  disabled={approving}
                  className="p-1 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-6 space-y-4">
                {/* Summary */}
                <div className="bg-gray-50 rounded-xl p-3 text-sm space-y-1">
                  <div className="flex gap-2">
                    <span className="text-gray-500 w-20 flex-shrink-0">Data:</span>
                    <span className="font-medium">{formatDate(approveModal.maintenance.date)}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-gray-500 w-20 flex-shrink-0">Macchina:</span>
                    <span className="font-medium">{(approveModal.maintenance.machine as any)?.serialNumber}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-gray-500 w-20 flex-shrink-0">Tipo:</span>
                    <span className="font-medium">{TYPE_LABELS[approveModal.maintenance.type]}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-gray-500 w-20 flex-shrink-0">Lavoro:</span>
                    <span className="font-medium text-xs">{approveModal.maintenance.workPerformed}</span>
                  </div>
                  {approveModal.maintenance.mobileNote && (
                    <div className="flex gap-2">
                      <span className="text-gray-500 w-20 flex-shrink-0">Nota:</span>
                      <span className="text-gray-700 italic text-xs">{approveModal.maintenance.mobileNote}</span>
                    </div>
                  )}
                </div>

                {/* Operatore */}
                <div>
                  <label className="label">Operatore *</label>
                  <select
                    className="input"
                    value={approveForm.operatorId}
                    onChange={(e) => setApproveForm((f) => ({ ...f, operatorId: e.target.value }))}
                    required
                  >
                    <option value="">Seleziona operatore...</option>
                    {users.map((u) => (
                      <option key={u.id} value={String(u.id)}>
                        {u.firstName} {u.lastName} ({u.role})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Pezzi di ricambio */}
                <div>
                  <label className="label">Pezzi di ricambio <span className="text-gray-400 font-normal">(opzionale)</span></label>
                  <input
                    className="input"
                    placeholder="Es. filtro olio, cinghia..."
                    value={approveForm.spareParts}
                    onChange={(e) => setApproveForm((f) => ({ ...f, spareParts: e.target.value }))}
                  />
                </div>

                {/* Costo */}
                <div>
                  <label className="label">Costo € <span className="text-gray-400 font-normal">(opzionale)</span></label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="input"
                    placeholder="0.00"
                    value={approveForm.cost}
                    onChange={(e) => setApproveForm((f) => ({ ...f, cost: e.target.value }))}
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    className="btn btn-secondary flex-1"
                    onClick={() => setApproveModal({ open: false, maintenance: null })}
                    disabled={approving}
                  >
                    Annulla
                  </button>
                  <button
                    className="btn btn-primary flex-1"
                    onClick={handleApprove}
                    disabled={approving || !approveForm.operatorId}
                  >
                    {approving ? 'Salvataggio...' : 'Conferma'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
