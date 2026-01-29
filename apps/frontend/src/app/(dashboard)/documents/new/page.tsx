'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm, Controller } from 'react-hook-form';
import Widget from '@/components/Widget';
import axiosInstance from '@/lib/axios';
import { useToast } from '@/components/Toast';
import { Machine } from '@/types';

export default function NewDocumentPage() {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [file, setFile] = useState<File | null>(null);

  const { control, handleSubmit, watch } = useForm({
    defaultValues: {
      machineId: '',
      documentCategory: 'altro',
    },
  });

  useEffect(() => {
    fetchMachines();
  }, []);

  const fetchMachines = async () => {
    try {
      const response = await axiosInstance.get('/machines');
      setMachines(response.data.data || response.data);
    } catch (error: any) {
      toast.showError('Errore nel caricamento dei macchinari');
    }
  };

  const onSubmit = async (data: any) => {
    if (!file) {
      toast.showError('Seleziona un file');
      return;
    }

    if (!data.machineId) {
      toast.showError('Seleziona un macchinario');
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('machineId', data.machineId.toString());
      formData.append('documentCategory', data.documentCategory);

      await axiosInstance.post('/documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.showSuccess('Documento caricato con successo');
      router.push('/documents');
    } catch (error: any) {
      toast.showError('Errore durante il caricamento');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <nav className="flex items-center gap-1 text-sm text-gray-500 mb-2">
          <Link href="/dashboard" className="hover:text-gray-900 transition-colors">Dashboard</Link>
          <span>/</span>
          <Link href="/documents" className="hover:text-gray-900 transition-colors">Documenti</Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">Nuovo</span>
        </nav>
        <h1 className="text-2xl font-bold text-gray-900">Carica Documento</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Widget>
          <div className="grid grid-cols-1 gap-6 max-w-xl">
            {/* Macchinario */}
            <div>
              <label className="label">Macchinario *</label>
              <Controller
                name="machineId"
                control={control}
                render={({ field }) => (
                  <select {...field} className="input">
                    <option value="">Seleziona macchinario</option>
                    {machines.map((machine) => (
                      <option key={machine.id} value={machine.id}>
                        {machine.serialNumber} - {machine.type?.name}
                      </option>
                    ))}
                  </select>
                )}
              />
            </div>

            {/* Categoria */}
            <div>
              <label className="label">Categoria *</label>
              <Controller
                name="documentCategory"
                control={control}
                render={({ field }) => (
                  <select {...field} className="input">
                    <option value="manuale_uso">Manuale d&apos;uso</option>
                    <option value="certificazione_ce">Certificazione CE</option>
                    <option value="scheda_tecnica">Scheda Tecnica</option>
                    <option value="fattura_acquisto">Fattura Acquisto</option>
                    <option value="altro">Altro</option>
                  </select>
                )}
              />
            </div>

            {/* File Upload */}
            <div>
              <label className="label">File *</label>
              <label className="flex items-center justify-center gap-2 w-full p-4 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-colors">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span className="text-gray-600">{file ? file.name : 'Seleziona File'}</span>
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              </label>
              {file && (
                <p className="text-xs text-gray-500 mt-2">
                  Dimensione: {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-8">
            <button
              type="button"
              onClick={() => router.push('/documents')}
              disabled={loading}
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              )}
              Carica
            </button>
          </div>
        </Widget>
      </form>
    </div>
  );
}
