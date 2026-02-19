'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import axiosInstance from '@/lib/axios';
import { AuditLog, AuditLogResponse, AuditAction, AuditEntity } from '@/types';

const ACTION_LABELS: Record<AuditAction, string> = {
  CREATE: 'Creazione',
  UPDATE: 'Modifica',
  DELETE: 'Eliminazione',
};

const ACTION_COLORS: Record<AuditAction, string> = {
  CREATE: 'bg-green-100 text-green-800',
  UPDATE: 'bg-blue-100 text-blue-800',
  DELETE: 'bg-red-100 text-red-800',
};

const ENTITY_LABELS: Record<AuditEntity, string> = {
  Machine: 'Macchinario',
  Maintenance: 'Manutenzione',
  ScheduledMaintenance: 'Man. Programmata',
  Document: 'Documento',
  Category: 'Categoria',
  Type: 'Tipo',
  User: 'Utente',
};

const ENTITY_OPTIONS: AuditEntity[] = [
  'Machine', 'Maintenance', 'ScheduledMaintenance', 'Document', 'Category', 'Type', 'User',
];

interface Filters {
  entity: string;
  action: string;
  userId: string;
  startDate: string;
  endDate: string;
}

function ChangesViewer({ changes }: { changes: AuditLog['changes'] }) {
  if (!changes) return <span className="text-gray-400 text-xs">—</span>;

  const { before, after } = changes;
  const keys = Array.from(new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})]));

  if (keys.length === 0) return <span className="text-gray-400 text-xs">Nessuna modifica registrata</span>;

  return (
    <div className="mt-2 rounded-lg border border-gray-200 overflow-hidden text-xs">
      <table className="w-full">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="text-left px-3 py-2 font-semibold text-gray-600 w-1/3">Campo</th>
            <th className="text-left px-3 py-2 font-semibold text-red-600 w-1/3">Prima</th>
            <th className="text-left px-3 py-2 font-semibold text-green-600 w-1/3">Dopo</th>
          </tr>
        </thead>
        <tbody>
          {keys.map((key, i) => {
            const bval = before?.[key];
            const aval = after?.[key];
            const changed = JSON.stringify(bval) !== JSON.stringify(aval);
            return (
              <tr key={key} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-3 py-2 font-mono text-gray-700">{key}</td>
                <td className={`px-3 py-2 font-mono ${changed && bval !== undefined ? 'bg-red-50 text-red-800' : 'text-gray-500'}`}>
                  {bval !== undefined ? String(bval) : <span className="text-gray-300">—</span>}
                </td>
                <td className={`px-3 py-2 font-mono ${changed && aval !== undefined ? 'bg-green-50 text-green-800' : 'text-gray-500'}`}>
                  {aval !== undefined ? String(aval) : <span className="text-gray-300">—</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<Filters>({
    entity: '',
    action: '',
    userId: '',
    startDate: '',
    endDate: '',
  });
  const [appliedFilters, setAppliedFilters] = useState<Filters>(filters);

  const limit = 50;

  const fetchLogs = useCallback(async (f: Filters, p: number) => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(p), limit: String(limit) };
      if (f.entity) params.entity = f.entity;
      if (f.action) params.action = f.action;
      if (f.userId) params.userId = f.userId;
      if (f.startDate) params.startDate = f.startDate;
      if (f.endDate) params.endDate = f.endDate;

      const res = await axiosInstance.get<AuditLogResponse>('/audit', { params });
      setLogs(res.data.data);
      setTotal(res.data.total);
      setTotalPages(res.data.totalPages);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs(appliedFilters, page);
  }, [fetchLogs, appliedFilters, page]);

  const handleApplyFilters = () => {
    setPage(1);
    setAppliedFilters(filters);
  };

  const handleResetFilters = () => {
    const empty: Filters = { entity: '', action: '', userId: '', startDate: '', endDate: '' };
    setFilters(empty);
    setPage(1);
    setAppliedFilters(empty);
  };

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString('it-IT', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const hasChanges = (log: AuditLog) => {
    if (!log.changes) return false;
    const keys = [
      ...Object.keys(log.changes.before ?? {}),
      ...Object.keys(log.changes.after ?? {}),
    ];
    return keys.length > 0;
  };

  return (
    <div>
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Registro Attività</h1>
          <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
            <Link href="/dashboard" className="hover:text-gray-700 transition-colors">Dashboard</Link>
            <span>/</span>
            <span>Registro Attività</span>
          </div>
        </div>
        <span className="text-sm text-gray-500">{total} eventi totali</span>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div>
            <label className="label">Entità</label>
            <select
              className="input"
              value={filters.entity}
              onChange={(e) => setFilters((f) => ({ ...f, entity: e.target.value }))}
            >
              <option value="">Tutte</option>
              {ENTITY_OPTIONS.map((e) => (
                <option key={e} value={e}>{ENTITY_LABELS[e]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Azione</label>
            <select
              className="input"
              value={filters.action}
              onChange={(e) => setFilters((f) => ({ ...f, action: e.target.value }))}
            >
              <option value="">Tutte</option>
              <option value="CREATE">Creazione</option>
              <option value="UPDATE">Modifica</option>
              <option value="DELETE">Eliminazione</option>
            </select>
          </div>
          <div>
            <label className="label">Utente (ID)</label>
            <input
              className="input"
              placeholder="ID utente..."
              value={filters.userId}
              onChange={(e) => setFilters((f) => ({ ...f, userId: e.target.value }))}
            />
          </div>
          <div>
            <label className="label">Data inizio</label>
            <input
              type="date"
              className="input"
              value={filters.startDate}
              onChange={(e) => setFilters((f) => ({ ...f, startDate: e.target.value }))}
            />
          </div>
          <div>
            <label className="label">Data fine</label>
            <input
              type="date"
              className="input"
              value={filters.endDate}
              onChange={(e) => setFilters((f) => ({ ...f, endDate: e.target.value }))}
            />
          </div>
        </div>
        <div className="flex gap-2 mt-3 justify-end">
          <button className="btn btn-secondary" onClick={handleResetFilters}>
            Azzera
          </button>
          <button className="btn btn-primary" onClick={handleApplyFilters}>
            Filtra
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="flex justify-center p-12">
            <div className="w-10 h-10 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left py-3 px-4 font-semibold text-gray-600 w-[170px]">Data</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600 w-[130px]">Entità</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">ID Entità</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600 w-[130px]">Azione</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Utente</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600 w-[90px]">Dettagli</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <>
                      <tr
                        key={log.id}
                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                      >
                        <td className="py-3 px-4 text-gray-600 whitespace-nowrap font-mono text-xs">
                          {formatDate(log.createdAt)}
                        </td>
                        <td className="py-3 px-4 text-gray-700 font-medium">
                          {ENTITY_LABELS[log.entity] ?? log.entity}
                        </td>
                        <td className="py-3 px-4 text-gray-500 font-mono text-xs">
                          {log.entityId.substring(0, 8)}…
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ACTION_COLORS[log.action]}`}>
                            {ACTION_LABELS[log.action]}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-700">{log.userName}</td>
                        <td className="py-3 px-4">
                          {hasChanges(log) ? (
                            <button
                              onClick={() => toggleRow(log.id)}
                              className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-900 transition-colors"
                            >
                              <svg
                                className={`w-4 h-4 transition-transform ${expandedRows.has(log.id) ? 'rotate-180' : ''}`}
                                fill="none" stroke="currentColor" viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                              Vedi
                            </button>
                          ) : (
                            <span className="text-gray-300 text-xs">—</span>
                          )}
                        </td>
                      </tr>
                      <AnimatePresence>
                        {expandedRows.has(log.id) && (
                          <motion.tr
                            key={`${log.id}-expanded`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                          >
                            <td colSpan={6} className="px-4 pb-4 bg-gray-50">
                              <ChangesViewer changes={log.changes} />
                            </td>
                          </motion.tr>
                        )}
                      </AnimatePresence>
                    </>
                  ))}
                  {logs.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-gray-400">
                        Nessun evento trovato.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
                <span className="text-sm text-gray-500">
                  Pagina {page} di {totalPages} ({total} totali)
                </span>
                <div className="flex gap-2">
                  <button
                    className="btn btn-secondary"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    ← Precedente
                  </button>
                  <button
                    className="btn btn-secondary"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Successiva →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
