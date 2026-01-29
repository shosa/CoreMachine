'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import DocumentCard from '@/components/DocumentCard';
import axiosInstance from '@/lib/axios';
import { useToast } from '@/components/Toast';
import { Document } from '@/types';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

type ViewMode = 'grid' | 'table';
type SortOption = 'fileName' | 'date' | 'size' | 'category' | 'newest' | 'oldest';

interface Filters {
  documentCategory: string;
  machine: string;
}

export default function DocumentsPage() {
  const router = useRouter();
  const toast = useToast();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [machines, setMachines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [sortBy, setSortBy] = useState<SortOption>('date');
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const [docPreviewOpen, setDocPreviewOpen] = useState(false);
  const [docPreviewUrl, setDocPreviewUrl] = useState('');
  const [docPreviewName, setDocPreviewName] = useState('');

  const [filters, setFilters] = useState<Filters>({
    documentCategory: '',
    machine: '',
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  useEffect(() => {
    fetchDocuments();
    fetchMachines();
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

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/documents');
      setDocuments(response.data.data || response.data);
    } catch (error: any) {
      toast.showError('Errore nel caricamento dei documenti');
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
    if (!confirm('Sei sicuro di voler eliminare questo documento?')) return;
    try {
      await axiosInstance.delete(`/documents/${id}`);
      toast.showSuccess('Documento eliminato');
      fetchDocuments();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Errore durante l'eliminazione";
      toast.showError(errorMessage);
    }
  };

  const handlePreview = async (id: string) => {
    try {
      const doc = documents.find(d => String(d.id) === String(id));
      if (!doc) return;

      const response = await axiosInstance.get(`/documents/${id}/download`, {
        responseType: 'blob',
      });
      const contentType = response.headers['content-type'] || 'application/pdf';
      const blob = new Blob([response.data], { type: contentType });
      const blobUrl = URL.createObjectURL(blob);
      setDocPreviewUrl(blobUrl);
      setDocPreviewName(doc.fileName);
      setDocPreviewOpen(true);
    } catch (error) {
      toast.showError('Errore durante la visualizzazione');
    }
  };

  const handleDownload = async (id: string) => {
    try {
      const response = await axiosInstance.get(`/documents/${id}/download`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const doc = documents.find(d => String(d.id) === String(id));
      link.setAttribute('download', doc?.fileName || 'download');
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.showSuccess('Download avviato');
    } catch (error) {
      toast.showError('Errore durante il download');
    }
  };

  const handleClearFilters = () => {
    setFilters({
      documentCategory: '',
      machine: '',
    });
    setSearchQuery('');
  };

  const handleExportCSV = () => {
    const headers = ['Nome File', 'Macchinario', 'Categoria', 'Dimensione', 'Data Caricamento'];
    const rows = filteredAndSortedDocuments.map(d => [
      d.fileName,
      d.machine?.serialNumber || '',
      categoryLabels[d.documentCategory] || d.documentCategory,
      formatFileSize(d.fileSize || 0),
      format(new Date(d.uploadedAt || new Date()), 'dd/MM/yyyy'),
    ]);

    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `documenti-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setExportMenuOpen(false);
    toast.showSuccess('Export CSV completato');
  };

  const handleExportJSON = () => {
    const data = JSON.stringify(filteredAndSortedDocuments, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `documenti-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setExportMenuOpen(false);
    toast.showSuccess('Export JSON completato');
  };

  const categoryLabels: Record<string, string> = {
    manuale_uso: "Manuale d'uso",
    certificazione_ce: 'Certificazione CE',
    scheda_tecnica: 'Scheda Tecnica',
    fattura_acquisto: 'Fattura Acquisto',
    altro: 'Altro',
  };

  const formatFileSize = (bytes: number) => {
    const kb = bytes / 1024;
    return kb > 1024 ? `${(kb / 1024).toFixed(2)} MB` : `${kb.toFixed(2)} KB`;
  };

  let filteredDocuments = documents.filter(document => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      document.fileName?.toLowerCase().includes(searchLower) ||
      document.machine?.serialNumber?.toLowerCase().includes(searchLower);

    const matchesCategory =
      !filters.documentCategory || document.documentCategory === filters.documentCategory;
    const matchesMachine =
      !filters.machine || String(document.machine?.id) === String(filters.machine);

    return matchesSearch && matchesCategory && matchesMachine;
  });

  const filteredAndSortedDocuments = [...filteredDocuments].sort((a, b) => {
    switch (sortBy) {
      case 'fileName':
        return (a.fileName || '').localeCompare(b.fileName || '');
      case 'date':
        return new Date(b.uploadedAt || 0).getTime() - new Date(a.uploadedAt || 0).getTime();
      case 'size':
        return (b.fileSize || 0) - (a.fileSize || 0);
      case 'category':
        return (a.documentCategory || '').localeCompare(b.documentCategory || '');
      case 'newest':
        return new Date(b.uploadedAt || 0).getTime() - new Date(a.uploadedAt || 0).getTime();
      case 'oldest':
        return new Date(a.uploadedAt || 0).getTime() - new Date(b.uploadedAt || 0).getTime();
      default:
        return 0;
    }
  });

  const activeFiltersCount = Object.values(filters).filter(Boolean).length;

  const totalPages = Math.ceil(filteredAndSortedDocuments.length / pageSize);
  const paginatedDocuments = filteredAndSortedDocuments.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filters, sortBy]);

  const getMachineDisplay = (row: Document) => {
    const machine = row.machine;
    if (!machine) return '-';
    const model = machine.model || machine.manufacturer || '';
    const serial = machine.serialNumber || '';
    return model ? `${model} (${serial})` : serial;
  };

  return (
    <div>
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/dashboard" className="hover:text-gray-900 transition-colors">Dashboard</Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">Documenti</span>
        </div>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Documenti</h1>
          <div className="flex items-center gap-2">
            <div className="relative" ref={exportMenuRef}>
              <button
                className="btn btn-secondary inline-flex items-center gap-2"
                onClick={() => setExportMenuOpen(!exportMenuOpen)}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Esporta
              </button>
              {exportMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 z-50 py-1">
                  <button
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    onClick={handleExportCSV}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Esporta CSV
                  </button>
                  <button
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    onClick={handleExportJSON}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Esporta JSON
                  </button>
                </div>
              )}
            </div>

            <button
              className="btn btn-primary inline-flex items-center gap-2"
              onClick={() => router.push('/documents/new')}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Carica Documento
            </button>
          </div>
        </div>
      </div>

      <div className="card p-6">
        {/* Toolbar */}
        <div className="mb-4 flex gap-3 items-center flex-wrap">
          <div className="relative flex-1 min-w-[250px]">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              className="input pl-10"
              placeholder="Cerca per nome file o macchinario..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
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

          <div className="min-w-[180px]">
            <select
              className="input"
              value={sortBy}
              onChange={e => setSortBy(e.target.value as SortOption)}
            >
              <option value="fileName">Nome File</option>
              <option value="date">Data Caricamento</option>
              <option value="size">Dimensione</option>
              <option value="category">Categoria</option>
              <option value="newest">Piu recenti</option>
              <option value="oldest">Piu vecchi</option>
            </select>
          </div>
        </div>

        {/* Filtri */}
        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <span className="font-semibold text-gray-900">Filtri</span>
              {activeFiltersCount > 0 && (
                <span className="badge badge-primary">{activeFiltersCount} attivi</span>
              )}
            </div>
            {activeFiltersCount > 0 && (
              <button
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                onClick={handleClearFilters}
              >
                Pulisci filtri
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <label className="label">Categoria</label>
              <select
                className="input"
                value={filters.documentCategory}
                onChange={e => setFilters({ ...filters, documentCategory: e.target.value })}
              >
                <option value="">Tutte</option>
                <option value="manuale_uso">Manuale d&apos;uso</option>
                <option value="certificazione_ce">Certificazione CE</option>
                <option value="scheda_tecnica">Scheda Tecnica</option>
                <option value="fattura_acquisto">Fattura Acquisto</option>
                <option value="altro">Altro</option>
              </select>
            </div>

            <div>
              <label className="label">Macchinario</label>
              <select
                className="input"
                value={filters.machine}
                onChange={e => setFilters({ ...filters, machine: e.target.value })}
              >
                <option value="">Tutti</option>
                {machines.map(machine => (
                  <option key={machine.id} value={machine.id}>
                    {machine.serialNumber}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Contenuto */}
        {loading ? (
          <div className="flex justify-center p-8">
            <div className="w-10 h-10 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
          </div>
        ) : viewMode === 'table' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-600">Nome File</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600">Macchinario</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600">Categoria</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600">Dimensione</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600">Caricato il</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600">Azioni</th>
                </tr>
              </thead>
              <tbody>
                {paginatedDocuments.map(doc => (
                  <tr key={doc.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 font-medium text-gray-900">{doc.fileName}</td>
                    <td className="py-3 px-4 text-gray-600">{getMachineDisplay(doc)}</td>
                    <td className="py-3 px-4">
                      <span className="badge badge-info">
                        {categoryLabels[doc.documentCategory] || doc.documentCategory}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{formatFileSize(doc.fileSize || 0)}</td>
                    <td className="py-3 px-4 text-gray-600">
                      {format(new Date(doc.uploadedAt || new Date()), 'dd/MM/yyyy', { locale: it })}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handlePreview(doc.id)}
                          title="Anteprima"
                          className="p-1.5 bg-gray-900 text-white rounded-md hover:bg-gray-700 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDownload(doc.id)}
                          title="Scarica"
                          className="p-1.5 bg-gray-900 text-white rounded-md hover:bg-gray-700 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(doc.id)}
                          title="Elimina"
                          className="p-1.5 bg-gray-900 text-white rounded-md hover:bg-gray-700 transition-colors"
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

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>Righe per pagina:</span>
                  <select
                    className="input w-auto py-1 px-2 text-sm"
                    value={pageSize}
                    onChange={e => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                  <span>
                    {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, filteredAndSortedDocuments.length)} di {filteredAndSortedDocuments.length}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    className="p-1.5 rounded-md hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    onClick={() => setCurrentPage(p => p - 1)}
                    disabled={currentPage === 1}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <span className="text-sm text-gray-600 px-2">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    className="p-1.5 rounded-md hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    onClick={() => setCurrentPage(p => p + 1)}
                    disabled={currentPage === totalPages}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredAndSortedDocuments.map(document => (
              <DocumentCard
                key={document.id}
                document={document}
                onPreview={handlePreview}
                onDownload={handleDownload}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}

        {!loading && filteredAndSortedDocuments.length === 0 && (
          <div className="text-center py-16 text-gray-500">
            Nessun documento trovato con i filtri selezionati.
          </div>
        )}
      </div>

      {/* Document Preview Modal */}
      <AnimatePresence>
        {docPreviewOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => {
                setDocPreviewOpen(false);
                URL.revokeObjectURL(docPreviewUrl);
              }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white rounded-2xl shadow-xl w-full max-w-5xl flex flex-col"
              style={{ height: '90vh', maxHeight: '90vh' }}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">
                  Anteprima Documento: {docPreviewName}
                </h2>
                <button
                  onClick={() => {
                    setDocPreviewOpen(false);
                    URL.revokeObjectURL(docPreviewUrl);
                  }}
                  className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="flex-1 overflow-hidden">
                {docPreviewUrl && (
                  <iframe
                    src={docPreviewUrl}
                    className="w-full h-full border-0"
                    title="Anteprima Documento"
                  />
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
