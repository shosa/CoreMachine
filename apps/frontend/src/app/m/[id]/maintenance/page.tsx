'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

type MaintenanceType = 'ordinaria' | 'straordinaria' | 'guasto' | 'riparazione';

const TYPE_LABELS: Record<MaintenanceType, string> = {
  ordinaria: 'Ordinaria',
  straordinaria: 'Straordinaria',
  guasto: 'Guasto',
  riparazione: 'Riparazione',
};

export default function MobileMaintenancePage() {
  const params = useParams();
  const today = new Date().toISOString().split('T')[0];

  const [form, setForm] = useState({
    date: today,
    type: 'ordinaria' as MaintenanceType,
    problemDescription: '',
    workPerformed: '',
    mobileNote: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.workPerformed.trim()) {
      setError('Il campo "Lavoro eseguito" è obbligatorio.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/public/maintenances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          machineId: params.id,
          date: form.date,
          type: form.type,
          problemDescription: form.problemDescription || undefined,
          workPerformed: form.workPerformed,
          mobileNote: form.mobileNote || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message || 'Errore durante la registrazione');
      }

      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Errore di rete. Riprova.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Registrato!</h2>
        <p className="text-gray-500 text-sm mb-2">La manutenzione è stata registrata.</p>
        <p className="text-gray-400 text-xs mb-8">Verrà revisionata e confermata dal personale tecnico.</p>
        <Link
          href={`/m/${params.id}`}
          className="bg-gray-900 text-white px-6 py-3 rounded-2xl font-medium text-sm hover:bg-gray-800 transition-colors"
        >
          Torna alla macchina
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 pb-8">
      {/* Header */}
      <div className="flex items-center gap-3 py-4 mb-4">
        <Link href={`/m/${params.id}`} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-lg font-bold text-gray-900">Registra Manutenzione</h1>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 mb-4">
        <p className="text-xs text-amber-800">
          La manutenzione sarà registrata come bozza e completata dal personale tecnico.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col gap-4">
          {/* Data */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Data *</label>
            <input
              type="date"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              required
            />
          </div>

          {/* Tipo */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Tipo intervento *</label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(TYPE_LABELS) as MaintenanceType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, type: t }))}
                  className={`py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                    form.type === t
                      ? 'bg-gray-900 text-white border-gray-900'
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {TYPE_LABELS[t]}
                </button>
              ))}
            </div>
          </div>

          {/* Descrizione problema */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Descrizione problema <span className="font-normal text-gray-400">(opzionale)</span>
            </label>
            <textarea
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
              rows={3}
              placeholder="Descrivi il problema riscontrato..."
              value={form.problemDescription}
              onChange={(e) => setForm((f) => ({ ...f, problemDescription: e.target.value }))}
            />
          </div>

          {/* Lavoro eseguito */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Lavoro eseguito *</label>
            <textarea
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
              rows={4}
              placeholder="Descrivi il lavoro svolto..."
              value={form.workPerformed}
              onChange={(e) => setForm((f) => ({ ...f, workPerformed: e.target.value }))}
              required
            />
          </div>

          {/* Nota/firma */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Chi sei? <span className="font-normal text-gray-400">(opzionale)</span>
            </label>
            <input
              type="text"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              placeholder="Nome o firma..."
              value={form.mobileNote}
              onChange={(e) => setForm((f) => ({ ...f, mobileNote: e.target.value }))}
            />
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-gray-900 text-white py-3.5 rounded-2xl font-semibold text-sm hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? 'Invio in corso...' : 'Registra Manutenzione'}
        </button>
      </form>
    </div>
  );
}
