'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import axiosInstance from '@/lib/axios';
import { useToast } from '@/components/Toast';
import { Machine } from '@/types';
import { useAuthStore } from '@/store/authStore';
import DeleteConfirmModal, { RelatedEntity } from '@/components/DeleteConfirmModal';

type ViewMode = 'grid' | 'table';
type SortOption = 'serialNumber' | 'manufacturer' | 'model' | 'yearBuilt' | 'newest' | 'oldest';

interface Filters {
  category: string;
  type: string;
  manufacturer: string;
  yearBuilt: string;
}

export default function MachinesPage() {
  const router = useRouter();
  const { hasRole } = useAuthStore();
  const { showSuccess, showError } = useToast();
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [sortBy, setSortBy] = useState<SortOption>('serialNumber');
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [filters, setFilters] = useState<Filters>({
    category: '',
    type: '',
    manufacturer: '',
    yearBuilt: '',
  });

  const [categories, setCategories] = useState<any[]>([]);
  const [types, setTypes] = useState<any[]>([]);
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; machine: Machine | null }>({ open: false, machine: null });
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchMachines();
    fetchCategories();
  }, []);

  const fetchMachines = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/machines');
      setMachines(response.data.data || response.data);
    } catch (error: any) {
      showError('Errore nel caricamento dei macchinari');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axiosInstance.get('/categories');
      setCategories(response.data.data || response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  useEffect(() => {
    if (filters.category) {
      const category = categories.find((c) => c.id === filters.category);
      setTypes(category?.types || []);
      setFilters((prev) => ({ ...prev, type: '' }));
    } else {
      setTypes([]);
    }
  }, [filters.category, categories]);

  const getMachineRelated = (machine: Machine): RelatedEntity[] => {
    const counts = (machine as any)._count || {};
    return [
      { label: 'manutenzioni', count: counts.maintenances || 0 },
      { label: 'documenti', count: counts.documents || 0 },
      { label: 'manutenzioni programmate', count: counts.scheduledMaintenances || 0 },
    ];
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.machine) return;
    setIsDeleting(true);
    try {
      await axiosInstance.delete(`/machines/${deleteModal.machine.id}`);
      showSuccess('Macchinario eliminato con successo');
      setDeleteModal({ open: false, machine: null });
      fetchMachines();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Errore durante l'eliminazione";
      showError(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClearFilters = () => {
    setFilters({ category: '', type: '', manufacturer: '', yearBuilt: '' });
    setSearchQuery('');
  };

  const handleExportCSV = () => {
    const headers = ['Matricola', 'Tipo', 'Categoria', 'Produttore', 'Modello', 'Anno'];
    const rows = filteredAndSortedMachines.map((m) => [
      m.serialNumber,
      m.type?.name || '',
      m.type?.category?.name || '',
      m.manufacturer,
      m.model,
      m.yearBuilt || '',
    ]);
    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `macchinari-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setExportMenuOpen(false);
    showSuccess('Export CSV completato');
  };

  const handleExportJSON = () => {
    const data = JSON.stringify(filteredAndSortedMachines, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `macchinari-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setExportMenuOpen(false);
    showSuccess('Export JSON completato');
  };

  let filteredMachines = machines.filter((machine) => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      machine.serialNumber?.toLowerCase().includes(searchLower) ||
      machine.manufacturer?.toLowerCase().includes(searchLower) ||
      machine.model?.toLowerCase().includes(searchLower) ||
      machine.type?.name?.toLowerCase().includes(searchLower);

    const matchesCategory = !filters.category || machine.type?.categoryId === filters.category;
    const matchesType = !filters.type || machine.type?.id === filters.type;
    const matchesManufacturer = !filters.manufacturer || machine.manufacturer === filters.manufacturer;
    const matchesYear = !filters.yearBuilt || machine.yearBuilt?.toString() === filters.yearBuilt;

    return matchesSearch && matchesCategory && matchesType && matchesManufacturer && matchesYear;
  });

  const filteredAndSortedMachines = [...filteredMachines].sort((a, b) => {
    switch (sortBy) {
      case 'serialNumber':
        return (a.serialNumber || '').localeCompare(b.serialNumber || '');
      case 'manufacturer':
        return (a.manufacturer || '').localeCompare(b.manufacturer || '');
      case 'model':
        return (a.model || '').localeCompare(b.model || '');
      case 'yearBuilt':
        return (a.yearBuilt || 0) - (b.yearBuilt || 0);
      case 'newest':
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      case 'oldest':
        return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
      default:
        return 0;
    }
  });

  const uniqueManufacturers = Array.from(new Set(machines.map((m) => m.manufacturer).filter(Boolean)));
  const uniqueYears = Array.from(new Set(machines.map((m) => m.yearBuilt).filter(Boolean))).sort((a, b) => b - a);
  const activeFiltersCount = Object.values(filters).filter(Boolean).length;

  return (
    <div>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Macchinari</h1>
          <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
            <Link href="/dashboard" className="hover:text-gray-700">Dashboard</Link>
            <span>/</span>
            <span>Macchinari</span>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <button
              onClick={() => setExportMenuOpen(!exportMenuOpen)}
              className="btn btn-secondary"
            >
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
                  <button onClick={handleExportCSV} className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Esporta CSV
                  </button>
                  <button onClick={handleExportJSON} className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Esporta JSON
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          {hasRole('admin') && (
            <Link href="/machines/new" className="btn btn-primary">
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
              placeholder="Cerca per matricola, produttore, modello o tipo..."
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

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="input w-auto min-w-[150px]"
          >
            <option value="serialNumber">Matricola</option>
            <option value="manufacturer">Produttore</option>
            <option value="model">Modello</option>
            <option value="yearBuilt">Anno</option>
            <option value="newest">Più recenti</option>
            <option value="oldest">Più vecchi</option>
          </select>

          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            className={`btn ${filtersOpen || activeFiltersCount > 0 ? 'btn-primary' : 'btn-secondary'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            {activeFiltersCount > 0 && (
              <span className="bg-white text-gray-900 text-xs rounded-full px-1.5">{activeFiltersCount}</span>
            )}
          </button>
        </div>

        {/* Filters Panel */}
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
                  <span className="font-semibold text-gray-900">Filtri Avanzati</span>
                  {activeFiltersCount > 0 && (
                    <button onClick={handleClearFilters} className="text-sm text-gray-500 hover:text-gray-700">
                      Pulisci filtri
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <select
                    value={filters.category}
                    onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                    className="input"
                  >
                    <option value="">Tutte le categorie</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                  <select
                    value={filters.type}
                    onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                    className="input"
                    disabled={!filters.category}
                  >
                    <option value="">Tutti i tipi</option>
                    {types.map((type) => (
                      <option key={type.id} value={type.id}>{type.name}</option>
                    ))}
                  </select>
                  <select
                    value={filters.manufacturer}
                    onChange={(e) => setFilters({ ...filters, manufacturer: e.target.value })}
                    className="input"
                  >
                    <option value="">Tutti i produttori</option>
                    {uniqueManufacturers.map((mfr) => (
                      <option key={mfr} value={mfr}>{mfr}</option>
                    ))}
                  </select>
                  <select
                    value={filters.yearBuilt}
                    onChange={(e) => setFilters({ ...filters, yearBuilt: e.target.value })}
                    className="input"
                  >
                    <option value="">Tutti gli anni</option>
                    {uniqueYears.map((year) => (
                      <option key={year} value={year.toString()}>{year}</option>
                    ))}
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
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Matricola</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Tipo</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 hidden md:table-cell">Categoria</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 hidden lg:table-cell">Produttore</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 hidden lg:table-cell">Modello</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 hidden xl:table-cell">Anno</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Azioni</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedMachines.map((machine) => (
                  <tr key={machine.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <span className="font-medium text-gray-900">{machine.serialNumber}</span>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{machine.type?.name || '-'}</td>
                    <td className="py-3 px-4 text-gray-600 hidden md:table-cell">{machine.type?.category?.name || '-'}</td>
                    <td className="py-3 px-4 text-gray-600 hidden lg:table-cell">{machine.manufacturer}</td>
                    <td className="py-3 px-4 text-gray-600 hidden lg:table-cell">{machine.model}</td>
                    <td className="py-3 px-4 text-gray-600 hidden xl:table-cell">{machine.yearBuilt || '-'}</td>
                    <td className="py-3 px-4">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => router.push(`/machines/${machine.id}`)}
                          className="p-2 rounded-lg bg-gray-900 text-white hover:bg-gray-800"
                          title="Visualizza"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        {hasRole(['admin', 'tecnico']) && (
                          <button
                            onClick={() => router.push(`/machines/${machine.id}/edit`)}
                            className="p-2 rounded-lg bg-gray-900 text-white hover:bg-gray-800"
                            title="Modifica"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        )}
                        {hasRole('admin') && (
                          <button
                            onClick={() => setDeleteModal({ open: true, machine })}
                            className="p-2 rounded-lg bg-gray-900 text-white hover:bg-red-600"
                            title="Elimina"
                          >
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
            {filteredAndSortedMachines.map((machine) => (
              <div key={machine.id} className="bg-gray-50 border border-gray-100 rounded-xl p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{machine.serialNumber}</h3>
                    <p className="text-sm text-gray-500">{machine.type?.name}</p>
                  </div>
                  <span className="badge badge-blue">{machine.type?.category?.name}</span>
                </div>
                <div className="space-y-1 text-sm text-gray-600 mb-4">
                  <p><span className="text-gray-400">Produttore:</span> {machine.manufacturer}</p>
                  <p><span className="text-gray-400">Modello:</span> {machine.model}</p>
                  {machine.yearBuilt && <p><span className="text-gray-400">Anno:</span> {machine.yearBuilt}</p>}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => router.push(`/machines/${machine.id}`)}
                    className="flex-1 btn btn-primary text-sm py-2"
                  >
                    Visualizza
                  </button>
                  {hasRole(['admin', 'tecnico']) && (
                    <button
                      onClick={() => router.push(`/machines/${machine.id}/edit`)}
                      className="btn btn-secondary text-sm py-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && filteredAndSortedMachines.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            Nessun macchinario trovato con i filtri selezionati.
          </div>
        )}
      </div>

      <DeleteConfirmModal
        open={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, machine: null })}
        onConfirm={handleDeleteConfirm}
        entityName="Macchinario"
        entityLabel={deleteModal.machine ? `${deleteModal.machine.manufacturer} ${deleteModal.machine.model} (${deleteModal.machine.serialNumber})` : ''}
        staticRelated={deleteModal.machine ? getMachineRelated(deleteModal.machine) : []}
        isDeleting={isDeleting}
      />
    </div>
  );
}
