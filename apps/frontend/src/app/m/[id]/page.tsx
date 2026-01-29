'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import axiosInstance from '@/lib/axios';
import { useToast } from '@/components/Toast';
import { useAuthStore } from '@/store/authStore';
import { Machine, MaintenanceFormData } from '@/types';

export default function QuickMaintenancePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const toast = useToast();
  const [machine, setMachine] = useState<Machine | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const { control, handleSubmit } = useForm<Partial<MaintenanceFormData>>({
    defaultValues: {
      machineId: params.id as string,
      date: new Date().toISOString().split('T')[0],
      type: 'ordinaria',
      workPerformed: '',
      problemDescription: '',
    },
  });

  useEffect(() => {
    fetchMachine();
  }, [params.id]);

  const fetchMachine = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/machines/${params.id}`);
      setMachine(response.data);
    } catch (error: any) {
      toast.showError('Errore nel caricamento del macchinario');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: Partial<MaintenanceFormData>) => {
    if (!user) {
      toast.showWarning('Devi effettuare il login per registrare una manutenzione');
      router.push(`/login?redirect=/m/${params.id}`);
      return;
    }

    try {
      setSubmitting(true);
      const maintenanceData = {
        ...data,
        operatorId: user.id,
      };
      await axiosInstance.post('/maintenances', maintenanceData);
      setSuccess(true);
      toast.showSuccess('Manutenzione registrata con successo');
    } catch (error: any) {
      toast.showError(error.response?.data?.message || 'Errore durante la registrazione');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="w-10 h-10 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
      </div>
    );
  }

  if (!machine) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="card p-8 text-center max-w-md w-full">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 20a8 8 0 100-16 8 8 0 000 16z" />
          </svg>
          <h2 className="text-xl font-bold text-gray-900">Macchinario non trovato</h2>
          <p className="text-gray-500 mt-2">Il macchinario richiesto non esiste o è stato rimosso.</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="card p-8 text-center max-w-md w-full">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Manutenzione Registrata!</h2>
          <p className="text-gray-500 mb-6">
            La manutenzione per il macchinario <strong>{machine?.serialNumber}</strong> è stata registrata con successo.
          </p>
          <button
            className="btn btn-primary w-full"
            onClick={() => router.push(`/machines/${params.id}`)}
          >
            Visualizza Scheda Macchinario
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Logo/Header */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="p-3 bg-gray-900 rounded-xl">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">CoreMachine</h1>
        </div>

        {/* Machine Info Card */}
        <div className="card p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Registrazione Rapida Manutenzione</h2>
          <div className="flex flex-wrap gap-2 mt-3">
            <span className="badge">Matr.: {machine.serialNumber}</span>
            <span className="badge badge-blue">{machine.type?.name || 'N/A'}</span>
            {machine.manufacturer && (
              <span className="badge">{machine.manufacturer} {machine.model || ''}</span>
            )}
          </div>
          {machine.description && (
            <p className="text-gray-600 mt-3 text-sm">{machine.description}</p>
          )}

          {!user && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="font-medium text-blue-900">Accesso richiesto</p>
                  <p className="text-sm text-blue-700 mt-1">Devi essere loggato per registrare una manutenzione</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Form Card */}
        <div className="card p-6">
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Data */}
              <div>
                <label className="label">Data</label>
                <Controller
                  name="date"
                  control={control}
                  render={({ field }) => (
                    <input {...field} type="date" className="input" />
                  )}
                />
              </div>

              {/* Tipo */}
              <div>
                <label className="label">Tipo</label>
                <Controller
                  name="type"
                  control={control}
                  render={({ field }) => (
                    <select {...field} className="input">
                      <option value="ordinaria">Ordinaria</option>
                      <option value="straordinaria">Straordinaria</option>
                      <option value="guasto">Guasto</option>
                      <option value="riparazione">Riparazione</option>
                    </select>
                  )}
                />
              </div>

              {/* Descrizione Problema */}
              <div className="md:col-span-2">
                <label className="label">Descrizione Problema (opzionale)</label>
                <Controller
                  name="problemDescription"
                  control={control}
                  render={({ field }) => (
                    <textarea {...field} rows={3} className="input" placeholder="Descrivi il problema riscontrato..." />
                  )}
                />
              </div>

              {/* Lavoro Eseguito */}
              <div className="md:col-span-2">
                <label className="label">Lavoro Eseguito *</label>
                <Controller
                  name="workPerformed"
                  control={control}
                  render={({ field }) => (
                    <textarea {...field} rows={4} className="input" placeholder="Descrivi il lavoro eseguito..." required />
                  )}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary w-full mt-6 py-3 text-base flex items-center justify-center gap-2"
            >
              {submitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
              Registra Manutenzione
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
