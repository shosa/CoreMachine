'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface PublicMaintenance {
  id: string;
  date: string;
  type: string;
  problemDescription?: string;
  workPerformed: string;
  createdAt: string;
}

const TYPE_LABELS: Record<string, string> = {
  ordinaria: 'Ordinaria',
  straordinaria: 'Straordinaria',
  guasto: 'Guasto',
  riparazione: 'Riparazione',
};

const TYPE_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  ordinaria:    { bg: 'bg-green-50',  text: 'text-green-700',  dot: 'bg-green-500' },
  straordinaria:{ bg: 'bg-blue-50',   text: 'text-blue-700',   dot: 'bg-blue-500' },
  guasto:       { bg: 'bg-red-50',    text: 'text-red-700',    dot: 'bg-red-500' },
  riparazione:  { bg: 'bg-amber-50',  text: 'text-amber-700',  dot: 'bg-amber-500' },
};

export default function MobileHistoryPage() {
  const params = useParams();
  const [maintenances, setMaintenances] = useState<PublicMaintenance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/public/machines/${params.id}/maintenances`)
      .then((r) => r.json())
      .then(setMaintenances)
      .catch(() => setMaintenances([]))
      .finally(() => setLoading(false));
  }, [params.id]);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div className="p-4 pb-10">
      {/* Header */}
      <div className="flex items-center gap-3 py-4 mb-2">
        <Link href={`/m/${params.id}`} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-lg font-bold text-gray-900">Storico Manutenzioni</h1>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
        </div>
      ) : maintenances.length === 0 ? (
        <div className="text-center py-16">
          <svg className="w-16 h-16 text-gray-200 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-gray-500 text-sm font-medium">Nessuna manutenzione registrata</p>
        </div>
      ) : (
        /* Timeline verticale con alternanza destra/sinistra */
        <div className="relative mt-4">
          {/* Linea centrale verticale */}
          <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gray-200 -translate-x-1/2" />

          <div className="flex flex-col gap-6">
            {maintenances.map((m, idx) => {
              const isLeft = idx % 2 === 0;
              const colors = TYPE_COLORS[m.type] ?? { bg: 'bg-gray-50', text: 'text-gray-700', dot: 'bg-gray-400' };

              return (
                <div key={m.id} className="relative flex items-start">
                  {/* Dot centrale */}
                  <div className={`absolute left-1/2 -translate-x-1/2 w-3 h-3 rounded-full ${colors.dot} ring-2 ring-white z-10 mt-4`} />

                  {/* Card a sinistra */}
                  {isLeft ? (
                    <>
                      <div className="w-1/2 pr-5">
                        <div className={`rounded-2xl p-4 shadow-sm border border-gray-100 ${colors.bg}`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${colors.bg} ${colors.text}`}>
                              {TYPE_LABELS[m.type] ?? m.type}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mb-1">{formatDate(m.date)}</p>
                          {m.problemDescription && (
                            <p className="text-xs text-gray-600 mb-1 italic">"{m.problemDescription}"</p>
                          )}
                          <p className="text-sm text-gray-800 font-medium leading-snug">{m.workPerformed}</p>
                        </div>
                      </div>
                      <div className="w-1/2" />
                    </>
                  ) : (
                    /* Card a destra */
                    <>
                      <div className="w-1/2" />
                      <div className="w-1/2 pl-5">
                        <div className={`rounded-2xl p-4 shadow-sm border border-gray-100 ${colors.bg}`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${colors.bg} ${colors.text}`}>
                              {TYPE_LABELS[m.type] ?? m.type}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mb-1">{formatDate(m.date)}</p>
                          {m.problemDescription && (
                            <p className="text-xs text-gray-600 mb-1 italic">"{m.problemDescription}"</p>
                          )}
                          <p className="text-sm text-gray-800 font-medium leading-snug">{m.workPerformed}</p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* Fine timeline */}
          <div className="relative flex justify-center mt-6">
            <div className="absolute left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-gray-300 ring-2 ring-white" />
          </div>
        </div>
      )}
    </div>
  );
}
