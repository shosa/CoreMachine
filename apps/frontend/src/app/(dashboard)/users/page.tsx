'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import UserCard from '@/components/UserCard';
import axiosInstance from '@/lib/axios';
import { useToast } from '@/components/Toast';
import { User } from '@/types';
import DeleteConfirmModal, { RelatedEntity } from '@/components/DeleteConfirmModal';

type ViewMode = 'grid' | 'table';
type SortOption = 'name' | 'email' | 'role' | 'newest' | 'oldest';

interface Filters {
  role: string;
  isActive: string;
}

const roleLabels: Record<string, string> = {
  admin: 'Admin',
  tecnico: 'Tecnico',
  utente: 'Utente',
};

const roleBadgeClass: Record<string, string> = {
  admin: 'badge badge-blue',
  tecnico: 'badge badge-green',
  utente: 'badge',
};

export default function UsersPage() {
  const router = useRouter();
  const toast = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  const [filters, setFilters] = useState<Filters>({
    role: '',
    isActive: '',
  });
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; user: User | null }>({ open: false, user: null });
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setExportMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/users');
      setUsers(response.data.data || response.data);
    } catch (error: any) {
      toast.showError('Errore nel caricamento degli utenti');
    } finally {
      setLoading(false);
    }
  };

  const getUserRelated = (user: User): RelatedEntity[] => {
    const counts = (user as any)._count || {};
    return [
      { label: 'manutenzioni eseguite', count: counts.maintenances || 0 },
      { label: 'documenti caricati', count: counts.uploadedDocuments || 0 },
      { label: 'manutenzioni programmate create', count: counts.scheduledMaintenances || 0 },
    ];
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.user) return;
    setIsDeleting(true);
    try {
      await axiosInstance.delete(`/users/${deleteModal.user.id}`);
      toast.showSuccess('Utente eliminato');
      setDeleteModal({ open: false, user: null });
      fetchUsers();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Errore durante l'eliminazione";
      toast.showError(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  // Keep handleDelete for UserCard compatibility (wraps modal)
  const handleDelete = (id: string) => {
    const user = users.find(u => String(u.id) === String(id));
    if (user) setDeleteModal({ open: true, user });
  };

  const handleClearFilters = () => {
    setFilters({ role: '', isActive: '' });
    setSearchQuery('');
  };

  const filteredAndSortedUsers = useMemo(() => {
    let filtered = users.filter((user) => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        user.firstName?.toLowerCase().includes(searchLower) ||
        user.lastName?.toLowerCase().includes(searchLower) ||
        user.email?.toLowerCase().includes(searchLower);

      const matchesRole = !filters.role || user.role === filters.role;
      const matchesActive = !filters.isActive || user.isActive.toString() === filters.isActive;

      return matchesSearch && matchesRole && matchesActive;
    });

    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
        case 'email':
          return (a.email || '').localeCompare(b.email || '');
        case 'role':
          return (a.role || '').localeCompare(b.role || '');
        case 'newest':
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        case 'oldest':
          return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
        default:
          return 0;
      }
    });
  }, [users, searchQuery, filters, sortBy]);

  const handleExportCSV = () => {
    const headers = ['Nome', 'Cognome', 'Email', 'Ruolo', 'Stato'];
    const rows = filteredAndSortedUsers.map((u) => [
      u.firstName,
      u.lastName,
      u.email,
      u.role,
      u.isActive ? 'Attivo' : 'Inattivo',
    ]);

    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `utenti-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setExportMenuOpen(false);
    toast.showSuccess('Export CSV completato');
  };

  const handleExportJSON = () => {
    const data = JSON.stringify(filteredAndSortedUsers, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `utenti-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setExportMenuOpen(false);
    toast.showSuccess('Export JSON completato');
  };

  const activeFiltersCount = Object.values(filters).filter(Boolean).length;

  return (
    <div>
      {/* Page Header */}
      <div className="mb-6">
        <nav className="flex items-center gap-1 text-sm text-gray-500 mb-2">
          <Link href="/dashboard" className="hover:text-gray-900 transition-colors">Dashboard</Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">Utenti</span>
        </nav>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-900">Utenti</h1>
          <div className="flex gap-2">
            <div className="relative" ref={exportMenuRef}>
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
              onClick={() => router.push('/users/new')}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Aggiungi Utente
            </button>
          </div>
        </div>
      </div>

      <div className="card p-6">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Cerca per nome, cognome o email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-10"
            />
          </div>

          <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden">
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 transition-colors ${viewMode === 'table' ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              aria-label="vista tabella"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              aria-label="vista griglia"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="input w-full sm:w-48"
          >
            <option value="name">Nome</option>
            <option value="email">Email</option>
            <option value="role">Ruolo</option>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Ruolo</label>
              <select
                value={filters.role}
                onChange={(e) => setFilters({ ...filters, role: e.target.value })}
                className="input"
              >
                <option value="">Tutti</option>
                <option value="admin">Admin</option>
                <option value="tecnico">Tecnico</option>
                <option value="utente">Utente</option>
              </select>
            </div>

            <div>
              <label className="label">Stato</label>
              <select
                value={filters.isActive}
                onChange={(e) => setFilters({ ...filters, isActive: e.target.value })}
                className="input"
              >
                <option value="">Tutti</option>
                <option value="true">Attivi</option>
                <option value="false">Inattivi</option>
              </select>
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-10 h-10 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
          </div>
        ) : filteredAndSortedUsers.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            Nessun utente trovato con i filtri selezionati.
          </div>
        ) : viewMode === 'table' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Nome Completo</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Ruolo</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Stato</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Azioni</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedUsers.map((user) => (
                  <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {user.firstName} {user.lastName}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{user.email}</td>
                    <td className="px-4 py-3">
                      <span className={roleBadgeClass[user.role] || 'badge'}>
                        {roleLabels[user.role] || user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={user.isActive ? 'badge badge-green' : 'badge'}>
                        {user.isActive ? 'Attivo' : 'Inattivo'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          className="p-1.5 bg-gray-900 text-white rounded-md hover:bg-gray-700 transition-colors"
                          onClick={() => router.push(`/users/${user.id}/edit`)}
                          title="Modifica"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          className="p-1.5 bg-gray-900 text-white rounded-md hover:bg-red-600 transition-colors"
                          onClick={() => setDeleteModal({ open: true, user })}
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
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredAndSortedUsers.map((user) => (
              <UserCard
                key={user.id}
                user={user}
                onEdit={(id) => router.push(`/users/${id}/edit`)}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      <DeleteConfirmModal
        open={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, user: null })}
        onConfirm={handleDeleteConfirm}
        entityName="Utente"
        entityLabel={deleteModal.user ? `${deleteModal.user.firstName} ${deleteModal.user.lastName}` : ''}
        staticRelated={deleteModal.user ? getUserRelated(deleteModal.user) : []}
        isDeleting={isDeleting}
      />
    </div>
  );
}
