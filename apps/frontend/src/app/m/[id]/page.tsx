'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface PublicMachine {
  id: string;
  serialNumber: string;
  description: string;
  manufacturer: string;
  model: string;
  yearBuilt?: number;
  type?: { name: string; category?: { name: string } };
}

export default function MobileOverviewPage() {
  const params = useParams();
  const [machine, setMachine] = useState<PublicMachine | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`/api/public/machines/${params.id}`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then(setMachine)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-10 h-10 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
    </div>
  );

  if (error || !machine) return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
      <h2 className="text-xl font-semibold text-gray-700 mb-2">Macchinario non trovato</h2>
      <p className="text-gray-500 text-sm">Il codice QR potrebbe essere scaduto o non valido.</p>
    </div>
  );

  return (
    <div className="p-4 pb-8">
      <div className="flex items-center gap-2 py-4 mb-2">
        <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span className="font-bold text-gray-900 text-lg">CoreMachine</span>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-4">
        <h1 className="text-xl font-bold text-gray-900 mb-1">{machine.description}</h1>
        <p className="text-sm text-gray-500 font-mono mb-3">#{machine.serialNumber}</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {machine.type?.category?.name && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {machine.type.category.name}
            </span>
          )}
          {machine.type?.name && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
              {machine.type.name}
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-xs text-gray-400 block">Produttore</span>
            <span className="font-medium text-gray-800">{machine.manufacturer || '—'}</span>
          </div>
          <div>
            <span className="text-xs text-gray-400 block">Modello</span>
            <span className="font-medium text-gray-800">{machine.model || '—'}</span>
          </div>
          {machine.yearBuilt && (
            <div>
              <span className="text-xs text-gray-400 block">Anno</span>
              <span className="font-medium text-gray-800">{machine.yearBuilt}</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <Link href={`/m/${params.id}/documents`}
          className="flex items-center gap-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:bg-gray-50 transition-colors">
          <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <div className="font-semibold text-gray-900 text-sm">Vedi Documenti</div>
            <div className="text-xs text-gray-500">Manuali, schede tecniche, certificazioni</div>
          </div>
          <svg className="w-4 h-4 text-gray-400 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>

        <Link href={`/m/${params.id}/maintenance`}
          className="flex items-center gap-3 bg-gray-900 rounded-2xl p-4 hover:bg-gray-800 transition-colors">
          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
            </svg>
          </div>
          <div>
            <div className="font-semibold text-white text-sm">Registra Manutenzione</div>
            <div className="text-xs text-gray-400">Segnala intervento o guasto</div>
          </div>
          <svg className="w-4 h-4 text-gray-400 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      <p className="text-center text-xs text-gray-400 mt-8">Powered by CoreMachine</p>
    </div>
  );
}
