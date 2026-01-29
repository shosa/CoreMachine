'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import axiosInstance from '@/lib/axios';

interface SearchResult {
  id: string;
  type: 'machine' | 'document' | 'maintenance';
  title: string;
  subtitle: string;
  url: string;
}

export default function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const searchTimeout = setTimeout(async () => {
      if (query.length >= 2) {
        setLoading(true);
        setOpen(true);
        try {
          const [machinesRes, docsRes, maintenancesRes] = await Promise.all([
            axiosInstance.get(`/machines/search?q=${encodeURIComponent(query)}`).catch(() => ({ data: [] })),
            axiosInstance.get(`/documents/search?q=${encodeURIComponent(query)}`).catch(() => ({ data: [] })),
            axiosInstance.get(`/maintenances/search?q=${encodeURIComponent(query)}`).catch(() => ({ data: [] })),
          ]);

          const machines = (machinesRes.data?.data || machinesRes.data || []).map((m: any) => ({
            id: m.id,
            type: 'machine' as const,
            title: m.serialNumber,
            subtitle: `${m.manufacturer || ''} ${m.model || ''}`.trim(),
            url: `/machines/${m.id}`,
          }));

          const documents = (docsRes.data?.data || docsRes.data || []).map((d: any) => ({
            id: d.id,
            type: 'document' as const,
            title: d.fileName,
            subtitle: d.machine?.serialNumber || '',
            url: `/documents`,
          }));

          const maintenances = (maintenancesRes.data?.data || maintenancesRes.data || []).map((m: any) => ({
            id: m.id,
            type: 'maintenance' as const,
            title: m.workPerformed?.substring(0, 60) || '',
            subtitle: `${m.machine?.serialNumber || ''} - ${new Date(m.date).toLocaleDateString()}`,
            url: `/maintenances/${m.id}`,
          }));

          setResults([...machines.slice(0, 3), ...documents.slice(0, 3), ...maintenances.slice(0, 3)]);
        } catch (error) {
          console.error('Search error:', error);
        } finally {
          setLoading(false);
        }
      } else {
        setResults([]);
        setOpen(false);
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [query]);

  const handleResultClick = (url: string) => {
    router.push(url);
    setQuery('');
    setResults([]);
    setOpen(false);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'machine':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        );
      case 'document':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case 'maintenance':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        );
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'machine':
        return 'Macchinario';
      case 'document':
        return 'Documento';
      case 'maintenance':
        return 'Manutenzione';
      default:
        return '';
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'machine':
        return 'bg-blue-100 text-blue-700';
      case 'document':
        return 'bg-green-100 text-green-700';
      case 'maintenance':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-[600px]">
      <div className="flex items-center px-4 py-2 bg-white rounded-xl border border-gray-200 hover:border-gray-400 focus-within:border-gray-900 focus-within:ring-2 focus-within:ring-gray-900/10 transition-all">
        <svg className="w-5 h-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Cerca..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setOpen(true)}
          className="flex-1 bg-transparent border-none outline-none text-gray-900 placeholder-gray-400 text-sm"
        />
        {loading && (
          <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
        )}
      </div>

      <AnimatePresence>
        {open && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 max-h-[400px] overflow-y-auto"
          >
            {results.map((result, index) => (
              <div key={`${result.type}-${result.id}`}>
                {index > 0 && results[index - 1].type !== result.type && (
                  <div className="h-px bg-gray-100" />
                )}
                <button
                  onClick={() => handleResultClick(result.url)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                >
                  <span className="text-gray-400">{getIcon(result.type)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900 truncate">{result.title}</span>
                      <span className={`badge text-[10px] ${getTypeBadgeColor(result.type)}`}>
                        {getTypeLabel(result.type)}
                      </span>
                    </div>
                    {result.subtitle && (
                      <p className="text-xs text-gray-500 truncate">{result.subtitle}</p>
                    )}
                  </div>
                </button>
              </div>
            ))}
          </motion.div>
        )}

        {open && query.length >= 2 && results.length === 0 && !loading && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 p-6 z-50"
          >
            <p className="text-sm text-gray-500 text-center">
              Nessun risultato trovato per "{query}"
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
