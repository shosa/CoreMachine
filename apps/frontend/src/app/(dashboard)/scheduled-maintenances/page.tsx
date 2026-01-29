'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import axiosInstance from '@/lib/axios';
import { useToast } from '@/components/Toast';
import { ScheduledMaintenance } from '@/types';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

type SortOption = 'title' | 'date' | 'frequency' | 'newest' | 'oldest';

interface Filters {
  frequency: string;
  isActive: string;
  machine: string;
}

const frequencyLabels: Record<string, string> = {
  daily: 'Giornaliera',
  weekly: 'Settimanale',
  monthly: 'Mensile',
  quarterly: 'Trimestrale',
  biannual: 'Semestrale',
  annual: 'Annuale',
};

export default function ScheduledMaintenancesPage() {
  const router = useRouter();
  const toast = useToast();
  const [maintenances, setMaintenances] = useState<ScheduledMaintenance[]>([]);
  const [machines, setMachines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('date');
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(true);

  const [filters, setFilters] = useState<Filters>({
    frequency: '',
    isActive: '',
    machine: '',
  });

  useEffect(() => {
    fetchMaintenances();
    fetchMachines();
  }, []);

  const fetchMaintenances = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/scheduled-maintenances');
      setMaintenances(response.data.data || response.data);
    } catch (error: any) {
      toast.showError('Errore nel caricamento');
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
    if (!confirm('Sei sicuro di voler eliminare questa manutenzione programmata?')) return;
    try {
      await axiosInstance.delete(`/scheduled-maintenances/${id}`);
      toast.showSuccess('Eliminata con successo');
      fetchMaintenances();
    } catch (error: any) {
      toast.showError(error.response?.data?.message || "Errore durante l'eliminazione");
    }
  };

  const handleClearFilters = () => {
    setFilters({ frequency: '', isActive: '', machine: '' });
    setSearchQuery('');
  };

  const filteredAndSortedMaintenances = useMemo(() => {
    let filtered = maintenances.filter((m) => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        m.title?.toLowerCase().includes(searchLower) ||
        m.machine?.serialNumber?.toLowerCase().includes(searchLower) ||
        m.description?.toLowerCase().includes(searchLower);

      const matchesFrequency = !filters.frequency || m.frequency === filters.frequency;
      const matchesActive = !filters.isActive || m.isActive.toString() === filters.isActive;
      const matchesMachine = !filters.machine || m.machine?.id === filters.machine;

      return matchesSearch && matchesFrequency && matchesActive && matchesMachine;
    });

    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return (a.title || '').localeCompare(b.title || '');
        case 'date':
          return new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime();
        case 'frequency':
          return (a.frequency || '').localeCompare(b.frequency || '');
        case 'newest':
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        case 'oldest':
          return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
        default:
          return 0;
      }
    });
  }, [maintenances, searchQuery, filters, sortBy]);

  const handleExportCSV = () => {
    const headers = ['Titolo', 'Macchinario', 'Frequenza', 'Prossima Scadenza', 'Stato'];
    const rows = filteredAndSortedMaintenances.map((m) => [
      m.title,
      m.machine?.serialNumber || '',
      frequencyLabels[m.frequency] || m.frequency,
      format(new Date(m.nextDueDate), 'dd/MM/yyyy'),
      m.isActive ? 'Attiva' : 'Inattiva',
    ]);

    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `manutenzioni-programmate-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setExportMenuOpen(false);
    toast.showSuccess('Export CSV completato');
  };

  const handleExportJSON = () => {
    const data = JSON.stringify(filteredAndSortedMaintenances, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `manutenzioni-programmate-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setExportMenuOpen(false);
    toast.showSuccess('Export JSON completato');
  };

  const activeFiltersCount = Object.values(filters).filter(Boolean).length;

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <nav className="flex items-center gap-1 text-sm text-gray-500 mb-2">
          <Link href="/dashboard" className="hover:text-gray-900 transition-colors">Dashboard</Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">Manutenzioni Programmate</span>
        </nav>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-900">Manutenzioni Programmate</h1>
          <div className="flex gap-2">
            <div className="relative">
              <button
                className="btn btn-secondary flex items-center gap-2"
                onClick={() => setExportMenuOpen(!exportMenuOpen)}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Esporta
              </button>
              <AnimatePresence>
                {exportMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50"
                  >
                    <button
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                      onClick={handleExportCSV}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Esporta CSV
                    </button>
                    <button
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                      onClick={handleExportJSON}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Esporta JSON
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <button
              className="btn btn-primary flex items-center gap-2"
              onClick={() => router.push('/scheduled-maintenances/new')}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Aggiungi
            </button>
          </div>
        </div>
      </div>

      <div className="card p-6">
        {/* Search & Sort */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Cerca per titolo, macchinario o descrizione..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-10"
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="input w-full sm:w-48"
          >
            <option value="title">Titolo</option>
            <option value="date">Prossima Scadenza</option>
            <option value="frequency">Frequenza</option>
            <option value="newest">Più recenti</option>
            <option value="oldest">Più vecchi</option>
          </select>
        </div>

        {/* Filters */}
        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <span className="font-semibold text-gray-900">Filtri</span>
              {activeFiltersCount > 0 && (
                <span className="badge badge-blue">{activeFiltersCount} attivi</span>
              )}
            </div>
            {activeFiltersCount > 0 && (
              <button className="text-sm text-gray-500 hover:text-gray-900" onClick={handleClearFilters}>
                Pulisci filtri
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="label">Frequenza</label>
              <select
                value={filters.frequency}
                onChange={(e) => setFilters({ ...filters, frequency: e.target.value })}
                className="input"
              >
                <option value="">Tutte</option>
                <option value="daily">Giornaliera</option>
                <option value="weekly">Settimanale</option>
                <option value="monthly">Mensile</option>
                <option value="quarterly">Trimestrale</option>
                <option value="biannual">Semestrale</option>
                <option value="annual">Annuale</option>
              </select>
            </div>

            <div>
              <label className="label">Stato</label>
              <select
                value={filters.isActive}
                onChange={(e) => setFilters({ ...filters, isActive: e.target.value })}
                className="input"
              >
                <option value="">Tutte</option>
                <option value="true">Attive</option>
                <option value="false">Inattive</option>
              </select>
            </div>

            <div>
              <label className="label">Macchinario</label>
              <select
                value={filters.machine}
                onChange={(e) => setFilters({ ...filters, machine: e.target.value })}
                className="input"
              >
                <option value="">Tutti</option>
                {machines.map((machine) => (
                  <option key={machine.id} value={machine.id}>
                    {machine.serialNumber}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-10 h-10 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
          </div>
        ) : filteredAndSortedMaintenances.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            Nessuna manutenzione programmata trovata con i filtri selezionati.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Titolo</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Macchinario</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Frequenza</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Prossima Scadenza</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Stato</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Azioni</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedMaintenances.map((m) => (
                  <tr key={m.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{m.title}</td>
                    <td className="px-4 py-3 text-gray-700">
                      {m.machine
                        ? `${m.machine.model || m.machine.manufacturer || ''} (${m.machine.serialNumber})`
                        : '-'}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{frequencyLabels[m.frequency] || m.frequency}</td>
                    <td className="px-4 py-3 text-gray-700">
                      {format(new Date(m.nextDueDate), 'dd/MM/yyyy', { locale: it })}
                    </td>
                    <td className="px-4 py-3">
                      <span className={m.isActive ? 'badge badge-green' : 'badge'}>
                        {m.isActive ? 'Attiva' : 'Inattiva'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          className="p-1.5 bg-gray-900 text-white rounded-md hover:bg-gray-700 transition-colors"
                          onClick={() => router.push(`/scheduled-maintenances/${m.id}/edit`)}
                          title="Modifica"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          className="p-1.5 bg-gray-900 text-white rounded-md hover:bg-red-600 transition-colors"
                          onClick={() => handleDelete(m.id)}
                          title="Elimina"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
