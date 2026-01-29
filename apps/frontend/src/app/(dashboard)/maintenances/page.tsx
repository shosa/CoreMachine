'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import axiosInstance from '@/lib/axios';
import { useToast } from '@/components/Toast';
import { Maintenance } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import MaintenanceCard from '@/components/MaintenanceCard';

type ViewMode = 'grid' | 'table';
type SortOption = 'date' | 'machine' | 'type' | 'cost' | 'newest' | 'oldest';

interface Filters {
  type: string;
  machine: string;
}

const typeLabels: Record<string, string> = {
  ordinaria: 'Ordinaria',
  straordinaria: 'Straordinaria',
  guasto: 'Guasto',
  riparazione: 'Riparazione',
};

const typeBadgeClass: Record<string, string> = {
  ordinaria: 'badge badge-green',
  straordinaria: 'badge badge-blue',
  guasto: 'badge badge-red',
  riparazione: 'badge badge-yellow',
};

export default function MaintenancesPage() {
  const router = useRouter();
  const { hasRole } = useAuthStore();
  const { showSuccess, showError } = useToast();
  const [maintenances, setMaintenances] = useState<Maintenance[]>([]);
  const [machines, setMachines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [sortBy, setSortBy] = useState<SortOption>('date');
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [filters, setFilters] = useState<Filters>({
    type: '',
    machine: '',
  });

  useEffect(() => {
    fetchMaintenances();
    fetchMachines();
  }, []);

  const fetchMaintenances = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/maintenances');
      setMaintenances(response.data.data || response.data);
    } catch (error: any) {
      showError('Errore nel caricamento delle manutenzioni');
    } finally {
      setLoading(false);
    }
  };

  const fetchMachines = async () => {
    try {
      const response = await axiosInstance.get('/machines');
      setMachines(response.data.data || response.data);
    } catch (error) {
      console.error('Error fetching machines:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Sei sicuro di voler eliminare questa manutenzione?')) return;
    try {
      await axiosInstance.delete(`/maintenances/${id}`);
      showSuccess('Manutenzione eliminata con successo');
      fetchMaintenances();
    } catch (error: any) {
      showError(error.response?.data?.message || "Errore durante l'eliminazione");
    }
  };

  const handleClearFilters = () => {
    setFilters({ type: '', machine: '' });
    setSearchQuery('');
  };

  const handleExportCSV = () => {
    const headers = ['Data', 'Macchinario', 'Tipo', 'Operatore', 'Lavoro Eseguito', 'Costo'];
    const rows = filteredAndSortedMaintenances.map((m) => [
      format(new Date(m.date), 'dd/MM/yyyy'),
      m.machine?.serialNumber || '',
      m.type,
      m.operator ? `${m.operator.firstName} ${m.operator.lastName}` : '',
      m.workPerformed,
      m.cost ? `€${Number(m.cost).toFixed(2)}` : '',
    ]);
    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `manutenzioni-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setExportMenuOpen(false);
    showSuccess('Export CSV completato');
  };

  let filteredMaintenances = maintenances.filter((maintenance) => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      maintenance.machine?.serialNumber?.toLowerCase().includes(searchLower) ||
      maintenance.workPerformed?.toLowerCase().includes(searchLower) ||
      maintenance.type?.toLowerCase().includes(searchLower);

    const matchesType = !filters.type || maintenance.type === filters.type;
    const matchesMachine = !filters.machine || maintenance.machine?.id === filters.machine;

    return matchesSearch && matchesType && matchesMachine;
  });

  const filteredAndSortedMaintenances = [...filteredMaintenances].sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      case 'machine':
        return (a.machine?.serialNumber || '').localeCompare(b.machine?.serialNumber || '');
      case 'type':
        return (a.type || '').localeCompare(b.type || '');
      case 'cost':
        return (Number(b.cost) || 0) - (Number(a.cost) || 0);
      default:
        return 0;
    }
  });

  const activeFiltersCount = Object.values(filters).filter(Boolean).length;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manutenzioni</h1>
          <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
            <Link href="/dashboard" className="hover:text-gray-700">Dashboard</Link>
            <span>/</span>
            <span>Manutenzioni</span>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <button onClick={() => setExportMenuOpen(!exportMenuOpen)} className="btn btn-secondary">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span className="hidden sm:inline">Esporta</span>
            </button>
            <AnimatePresence>
              {exportMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50"
                >
                  <button onClick={handleExportCSV} className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50">
                    Esporta CSV
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          {hasRole(['admin', 'tecnico']) && (
            <Link href="/maintenances/new" className="btn btn-primary">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="hidden sm:inline">Aggiungi</span>
            </Link>
          )}
        </div>
      </div>

      <div className="card p-6">
        {/* Toolbar */}
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="flex-1 min-w-[200px] relative">
            <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Cerca..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-10"
            />
          </div>

          <div className="hidden sm:flex border border-gray-200 rounded-xl overflow-hidden">
            <button
              onClick={() => setViewMode('table')}
              className={`p-2.5 ${viewMode === 'table' ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2.5 ${viewMode === 'grid' ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
          </div>

          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortOption)} className="input w-auto min-w-[150px]">
            <option value="date">Data</option>
            <option value="machine">Macchinario</option>
            <option value="type">Tipo</option>
            <option value="cost">Costo</option>
          </select>

          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            className={`btn ${filtersOpen || activeFiltersCount > 0 ? 'btn-primary' : 'btn-secondary'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            {activeFiltersCount > 0 && <span className="bg-white text-gray-900 text-xs rounded-full px-1.5">{activeFiltersCount}</span>}
          </button>
        </div>

        {/* Filters */}
        <AnimatePresence>
          {filtersOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-gray-50 rounded-xl p-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold text-gray-900">Filtri</span>
                  {activeFiltersCount > 0 && (
                    <button onClick={handleClearFilters} className="text-sm text-gray-500 hover:text-gray-700">Pulisci</button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <select value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })} className="input">
                    <option value="">Tutti i tipi</option>
                    <option value="ordinaria">Ordinaria</option>
                    <option value="straordinaria">Straordinaria</option>
                    <option value="guasto">Guasto</option>
                    <option value="riparazione">Riparazione</option>
                  </select>
                  <select value={filters.machine} onChange={(e) => setFilters({ ...filters, machine: e.target.value })} className="input">
                    <option value="">Tutti i macchinari</option>
                    {machines.map((m) => <option key={m.id} value={m.id}>{m.serialNumber}</option>)}
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-10 h-10 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
          </div>
        ) : viewMode === 'table' ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Data</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Macchinario</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Tipo</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 hidden md:table-cell">Operatore</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 hidden lg:table-cell">Costo</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Azioni</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedMaintenances.map((m) => (
                  <tr key={m.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm">{format(new Date(m.date), 'dd/MM/yyyy', { locale: it })}</td>
                    <td className="py-3 px-4 text-sm font-medium">{m.machine?.serialNumber || '-'}</td>
                    <td className="py-3 px-4">
                      <span className={typeBadgeClass[m.type] || 'badge badge-gray'}>{typeLabels[m.type] || m.type}</span>
                    </td>
                    <td className="py-3 px-4 text-sm hidden md:table-cell">{m.operator ? `${m.operator.firstName} ${m.operator.lastName}` : '-'}</td>
                    <td className="py-3 px-4 text-sm hidden lg:table-cell">{m.cost ? `€${Number(m.cost).toFixed(2)}` : '-'}</td>
                    <td className="py-3 px-4">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => router.push(`/maintenances/${m.id}`)} className="p-2 rounded-lg bg-gray-900 text-white hover:bg-gray-800">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        {hasRole(['admin', 'tecnico']) && (
                          <button onClick={() => router.push(`/maintenances/${m.id}/edit`)} className="p-2 rounded-lg bg-gray-900 text-white hover:bg-gray-800">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        )}
                        {hasRole('admin') && (
                          <button onClick={() => handleDelete(m.id)} className="p-2 rounded-lg bg-gray-900 text-white hover:bg-red-600">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredAndSortedMaintenances.map((m) => (
              <MaintenanceCard
                key={m.id}
                maintenance={m}
                onView={(id) => router.push(`/maintenances/${id}`)}
                onEdit={hasRole(['admin', 'tecnico']) ? (id) => router.push(`/maintenances/${id}/edit`) : undefined}
                onDelete={hasRole('admin') ? handleDelete : undefined}
              />
            ))}
          </div>
        )}

        {!loading && filteredAndSortedMaintenances.length === 0 && (
          <div className="text-center py-12 text-gray-500">Nessuna manutenzione trovata.</div>
        )}
      </div>
    </div>
  );
}
