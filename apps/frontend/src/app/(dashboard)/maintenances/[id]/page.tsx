'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import axiosInstance from '@/lib/axios';
import { useToast } from '@/components/Toast';
import { Maintenance } from '@/types';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

const typeBadgeClass: Record<string, string> = {
  ordinaria: 'badge badge-green',
  straordinaria: 'badge badge-blue',
  guasto: 'badge badge-red',
  riparazione: 'badge badge-yellow',
};

const typeLabels: Record<string, string> = {
  ordinaria: 'Ordinaria',
  straordinaria: 'Straordinaria',
  guasto: 'Guasto',
  riparazione: 'Riparazione',
};

export default function MaintenanceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [maintenance, setMaintenance] = useState<Maintenance | null>(null);

  useEffect(() => {
    fetchMaintenance();
  }, [params.id]);

  const fetchMaintenance = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/maintenances/${params.id}`);
      setMaintenance(response.data);
    } catch (error: any) {
      toast.showError('Errore nel caricamento della manutenzione');
      router.push('/maintenances');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveDocument = async (documentId: string) => {
    if (!confirm('Sei sicuro di voler rimuovere questo documento?')) {
      return;
    }

    try {
      await axiosInstance.delete(`/maintenances/${params.id}/documents/${documentId}`);
      toast.showSuccess('Documento rimosso con successo');
      fetchMaintenance();
    } catch (error: any) {
      toast.showError('Errore nella rimozione del documento');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <div className="w-10 h-10 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
      </div>
    );
  }

  if (!maintenance) {
    return null;
  }

  return (
    <div>
      {/* Breadcrumbs + title */}
      <div className="mb-6">
        <nav className="flex items-center gap-1 text-sm text-gray-500 mb-2">
          <Link href="/dashboard" className="hover:text-gray-900 transition-colors">Dashboard</Link>
          <span>/</span>
          <Link href="/maintenances" className="hover:text-gray-900 transition-colors">Manutenzioni</Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">#{maintenance.id.slice(0, 8)}</span>
        </nav>
        <h1 className="text-2xl font-bold text-gray-900">Dettaglio Manutenzione</h1>
      </div>

      {/* Header Card */}
      <div className="card p-6 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold text-gray-900">
                Manutenzione #{maintenance.id.slice(0, 8)}
              </h2>
              <span className={typeBadgeClass[maintenance.type] || 'badge'}>
                {typeLabels[maintenance.type] || maintenance.type}
              </span>
            </div>
            <p className="text-gray-500">
              Eseguita il {format(new Date(maintenance.date), 'dd MMMM yyyy', { locale: it })}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              className="btn btn-secondary flex items-center gap-2"
              onClick={() => router.back()}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Indietro
            </button>
            <button
              className="btn btn-primary flex items-center gap-2"
              onClick={() => router.push(`/maintenances/${params.id}/edit`)}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Modifica
            </button>
          </div>
        </div>

        <hr className="border-gray-200 my-6" />

        {/* Quick Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <span className="text-xs text-gray-500 block">Macchinario</span>
              <span className="text-sm font-semibold text-gray-900">
                {maintenance.machine?.serialNumber} - {maintenance.machine?.description}
              </span>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <span className="text-xs text-gray-500 block">Operatore</span>
              <span className="text-sm font-semibold text-gray-900">
                {maintenance.operator?.firstName} {maintenance.operator?.lastName}
              </span>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <span className="text-xs text-gray-500 block">Data Intervento</span>
              <span className="text-sm font-semibold text-gray-900">
                {format(new Date(maintenance.date), 'dd MMMM yyyy', { locale: it })}
              </span>
            </div>
          </div>

          {maintenance.cost && (
            <div className="flex items-start gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.121 15.536c-1.171 1.952-3.07 1.952-4.242 0-1.172-1.953-1.172-5.119 0-7.072 1.171-1.952 3.07-1.952 4.242 0M8 10.5h4m-4 3h4m9-1.5a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <span className="text-xs text-gray-500 block">Costo</span>
                <span className="text-sm font-semibold text-gray-900">
                  &euro;{Number(maintenance.cost).toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Work Performed */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900">Lavori Eseguiti</h3>
          </div>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{maintenance.workPerformed}</p>
        </div>

        {/* Problem Description */}
        {maintenance.problemDescription && (
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900">Descrizione Problema</h3>
            </div>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{maintenance.problemDescription}</p>
          </div>
        )}

        {/* Spare Parts */}
        {maintenance.spareParts && (
          <div className="card p-6 md:col-span-2">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Ricambi Utilizzati</h3>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{maintenance.spareParts}</p>
          </div>
        )}

        {/* Documents Section */}
        {maintenance.documents && maintenance.documents.length > 0 && (
          <div className="card p-6 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900">
                Documenti Allegati ({maintenance.documents.length})
              </h3>
            </div>
            <div className="space-y-2">
              {maintenance.documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-xl"
                >
                  <div>
                    <p className="font-medium text-gray-900">{doc.fileName}</p>
                    <p className="text-xs text-gray-500">
                      {format(new Date(doc.uploadedAt), 'dd/MM/yyyy', { locale: it })} &bull;{' '}
                      {(doc.fileSize / 1024 / 1024).toFixed(2)} MB &bull;{' '}
                      Caricato da {doc.uploadedBy?.firstName} {doc.uploadedBy?.lastName}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="btn btn-secondary text-sm"
                      onClick={() => window.open(`/api/documents/${doc.id}/download`, '_blank')}
                    >
                      Scarica
                    </button>
                    <button
                      className="btn text-sm bg-red-50 text-red-600 hover:bg-red-100"
                      onClick={() => handleRemoveDocument(doc.id)}
                    >
                      Rimuovi
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Machine Link Card */}
        <div className="card p-6 md:col-span-2">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <span className="text-xs text-gray-500 block">Macchinario Associato</span>
              <h3 className="text-lg font-semibold text-gray-900">{maintenance.machine?.description}</h3>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="badge">Matr.: {maintenance.machine?.serialNumber}</span>
                {maintenance.machine?.manufacturer && (
                  <span className="badge">
                    {maintenance.machine.manufacturer} {maintenance.machine.model || ''}
                  </span>
                )}
              </div>
            </div>
            <button
              className="btn btn-secondary"
              onClick={() => router.push(`/machines/${maintenance.machineId}`)}
            >
              Visualizza Macchinario
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
