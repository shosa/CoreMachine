'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import axiosInstance from '@/lib/axios';
import { useToast } from '@/components/Toast';
import { MaintenanceFormData, Machine, User, Maintenance } from '@/types';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

const schema = yup.object({
  machineId: yup.string().required('Macchinario richiesto'),
  operatorId: yup.string().required('Operatore richiesto'),
  date: yup.string().required('Data richiesta'),
  type: yup.string().required('Tipo richiesto'),
  problemDescription: yup.string(),
  workPerformed: yup.string().required('Lavoro eseguito richiesto'),
  spareParts: yup.string(),
  cost: yup.number().nullable().transform((v, o) => (o === '' ? null : v)),
});

export default function EditMaintenancePage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [operators, setOperators] = useState<User[]>([]);
  const [documents, setDocuments] = useState<File[]>([]);
  const [existingMaintenance, setExistingMaintenance] = useState<Maintenance | null>(null);

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<MaintenanceFormData>({
    resolver: yupResolver(schema),
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (existingMaintenance) {
      setValue('machineId', existingMaintenance.machineId);
      setValue('operatorId', existingMaintenance.operatorId);
      setValue('date', new Date(existingMaintenance.date).toISOString().split('T')[0]);
      setValue('type', existingMaintenance.type);
      setValue('problemDescription', existingMaintenance.problemDescription || '');
      setValue('workPerformed', existingMaintenance.workPerformed);
      setValue('spareParts', existingMaintenance.spareParts || '');
      setValue('cost', existingMaintenance.cost || undefined);
    }
  }, [existingMaintenance]);

  const fetchData = async () => {
    try {
      setFetchLoading(true);
      const [machinesRes, usersRes, maintenanceRes] = await Promise.all([
        axiosInstance.get('/machines'),
        axiosInstance.get('/users'),
        axiosInstance.get(`/maintenances/${params.id}`),
      ]);

      setMachines(Array.isArray(machinesRes.data) ? machinesRes.data : []);
      setOperators(Array.isArray(usersRes.data) ? usersRes.data : []);
      setExistingMaintenance(maintenanceRes.data);
    } catch (error: any) {
      toast.showError('Errore nel caricamento dei dati');
      router.push('/maintenances');
    } finally {
      setFetchLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setDocuments(prev => [...prev, ...files]);
  };

  const removeDocument = (index: number) => {
    setDocuments(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: MaintenanceFormData) => {
    try {
      setLoading(true);

      const payload = {
        ...data,
        date: new Date(data.date).toISOString(),
      };

      const formData = new FormData();

      Object.entries(payload).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, value.toString());
        }
      });

      documents.forEach((file) => {
        formData.append('documents', file);
      });

      await axiosInstance.patch(`/maintenances/${params.id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.showSuccess('Manutenzione aggiornata con successo');
      router.push(`/maintenances/${params.id}`);
    } catch (error: any) {
      toast.showError(error.response?.data?.message || 'Errore durante l\'aggiornamento');
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <div className="w-10 h-10 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
      </div>
    );
  }

  if (!existingMaintenance) {
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
          <Link href={`/maintenances/${params.id}`} className="hover:text-gray-900 transition-colors">
            #{existingMaintenance.id.slice(0, 8)}
          </Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">Modifica</span>
        </nav>
        <h1 className="text-2xl font-bold text-gray-900">Modifica Manutenzione</h1>
      </div>

      {/* Machine Info Card */}
      <div className="card p-4 mb-6">
        <span className="text-xs text-gray-500 block mb-1">Macchinario</span>
        <h3 className="text-lg font-semibold text-gray-900">{existingMaintenance.machine?.description}</h3>
        <div className="flex flex-wrap gap-2 mt-2">
          <span className="badge">Matr.: {existingMaintenance.machine?.serialNumber}</span>
          <span className="badge">
            {existingMaintenance.machine?.manufacturer} {existingMaintenance.machine?.model || ''}
          </span>
          <span className="badge badge-blue">{existingMaintenance.machine?.type?.name || 'N/A'}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="card p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tipo */}
            <div>
              <label className="label">Tipo Manutenzione *</label>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <select {...field} className={`input ${errors.type ? 'border-red-500' : ''}`}>
                    <option value="ordinaria">Ordinaria</option>
                    <option value="straordinaria">Straordinaria</option>
                    <option value="guasto">Guasto</option>
                    <option value="riparazione">Riparazione</option>
                  </select>
                )}
              />
              {errors.type && <p className="text-red-500 text-xs mt-1">{errors.type.message}</p>}
            </div>

            {/* Data */}
            <div>
              <label className="label">Data Intervento *</label>
              <Controller
                name="date"
                control={control}
                render={({ field }) => (
                  <input {...field} type="date" className={`input ${errors.date ? 'border-red-500' : ''}`} />
                )}
              />
              {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date.message}</p>}
            </div>

            {/* Operatore */}
            <div>
              <label className="label">Operatore *</label>
              <Controller
                name="operatorId"
                control={control}
                render={({ field }) => (
                  <select {...field} className={`input ${errors.operatorId ? 'border-red-500' : ''}`}>
                    <option value="">Seleziona operatore</option>
                    {operators.map((op) => (
                      <option key={op.id} value={op.id}>
                        {op.firstName} {op.lastName}
                      </option>
                    ))}
                  </select>
                )}
              />
              {errors.operatorId && <p className="text-red-500 text-xs mt-1">{errors.operatorId.message}</p>}
            </div>

            {/* Costo */}
            <div>
              <label className="label">Costo (&euro;)</label>
              <Controller
                name="cost"
                control={control}
                render={({ field }) => (
                  <input
                    {...field}
                    type="number"
                    step="0.01"
                    min="0"
                    className={`input ${errors.cost ? 'border-red-500' : ''}`}
                  />
                )}
              />
              {errors.cost && <p className="text-red-500 text-xs mt-1">{errors.cost.message}</p>}
            </div>

            {/* Descrizione Problema */}
            <div className="md:col-span-2">
              <label className="label">Descrizione Problema</label>
              <Controller
                name="problemDescription"
                control={control}
                render={({ field }) => (
                  <textarea
                    {...field}
                    rows={3}
                    placeholder="Descrivi il problema riscontrato (opzionale)"
                    className={`input ${errors.problemDescription ? 'border-red-500' : ''}`}
                  />
                )}
              />
              {errors.problemDescription && <p className="text-red-500 text-xs mt-1">{errors.problemDescription.message}</p>}
            </div>

            {/* Lavori Eseguiti */}
            <div className="md:col-span-2">
              <label className="label">Lavori Eseguiti *</label>
              <Controller
                name="workPerformed"
                control={control}
                render={({ field }) => (
                  <textarea
                    {...field}
                    rows={4}
                    placeholder="Descrivi nel dettaglio i lavori eseguiti"
                    className={`input ${errors.workPerformed ? 'border-red-500' : ''}`}
                  />
                )}
              />
              {errors.workPerformed && <p className="text-red-500 text-xs mt-1">{errors.workPerformed.message}</p>}
            </div>

            {/* Ricambi */}
            <div className="md:col-span-2">
              <label className="label">Ricambi Utilizzati</label>
              <Controller
                name="spareParts"
                control={control}
                render={({ field }) => (
                  <textarea
                    {...field}
                    rows={2}
                    placeholder="Elenca i ricambi utilizzati (opzionale)"
                    className={`input ${errors.spareParts ? 'border-red-500' : ''}`}
                  />
                )}
              />
              {errors.spareParts && <p className="text-red-500 text-xs mt-1">{errors.spareParts.message}</p>}
            </div>

            {/* Document Upload Section */}
            <div className="md:col-span-2">
              <div className="card p-4 bg-gray-50 border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Documenti Allegati</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Puoi aggiungere nuovi documenti alla manutenzione
                </p>

                <div className="mb-4">
                  <input
                    accept="image/*,.pdf,.doc,.docx,.txt"
                    className="hidden"
                    id="document-upload"
                    multiple
                    type="file"
                    onChange={handleFileSelect}
                  />
                  <label htmlFor="document-upload">
                    <span className="btn btn-secondary inline-flex items-center gap-2 cursor-pointer">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      Seleziona File
                    </span>
                  </label>
                </div>

                {documents.length > 0 && (
                  <div className="space-y-2 mb-4">
                    {documents.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-gray-900">{file.name}</p>
                          <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeDocument(index)}
                          className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Existing Documents */}
                {existingMaintenance.documents && existingMaintenance.documents.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Documenti Esistenti</h4>
                    <div className="space-y-2">
                      {existingMaintenance.documents.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg"
                        >
                          <div>
                            <p className="font-medium text-gray-900">{doc.fileName}</p>
                            <p className="text-xs text-gray-500">
                              Caricato il {format(new Date(doc.uploadedAt), 'dd/MM/yyyy', { locale: it })} da{' '}
                              {doc.uploadedBy?.firstName} {doc.uploadedBy?.lastName}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => window.open(`/api/documents/${doc.id}/download`, '_blank')}
                            className="btn btn-secondary text-sm"
                          >
                            Scarica
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-3 mt-8">
            <button
              type="button"
              onClick={() => router.back()}
              className="btn btn-secondary flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Annulla
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary flex items-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
              {loading ? 'Salvataggio...' : 'Salva Modifiche'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
