'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import Widget from '@/components/Widget';
import axiosInstance from '@/lib/axios';
import { useToast } from '@/components/Toast';
import { MachineFormData, Type } from '@/types';

const schema = yup.object({
  typeId: yup.string().required('Tipo richiesto'),
  serialNumber: yup.string().required('Matricola richiesta'),
  description: yup.string(),
  manufacturer: yup.string(),
  model: yup.string(),
  yearBuilt: yup.number().nullable().transform((v, o) => (o === '' ? null : v)),
  purchaseDate: yup.string(),
  dealer: yup.string(),
  invoiceReference: yup.string(),
  documentLocation: yup.string(),
});

export default function NewMachinePage() {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [types, setTypes] = useState<Type[]>([]);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<MachineFormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      typeId: '',
      serialNumber: '',
      description: '',
      manufacturer: '',
      model: '',
      yearBuilt: undefined,
      purchaseDate: '',
      dealer: '',
      invoiceReference: '',
      documentLocation: '',
    },
  });

  useEffect(() => {
    fetchTypes();
  }, []);

  const fetchTypes = async () => {
    try {
      const response = await axiosInstance.get('/types');
      setTypes(response.data.data || response.data);
    } catch (error: any) {
      toast.showError('Errore nel caricamento dei tipi');
    }
  };

  const onSubmit = async (data: MachineFormData) => {
    try {
      setLoading(true);

      const payload = {
        ...data,
        purchaseDate: data.purchaseDate ? new Date(data.purchaseDate).toISOString() : null,
      };

      await axiosInstance.post('/machines', payload);
      toast.showSuccess('Macchinario creato con successo');
      router.push('/machines');
    } catch (error: any) {
      toast.showError(error.response?.data?.message || 'Errore durante la creazione');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Breadcrumbs + title */}
      <div className="mb-6">
        <nav className="flex items-center gap-1 text-sm text-gray-500 mb-2">
          <Link href="/dashboard" className="hover:text-gray-900 transition-colors">Dashboard</Link>
          <span>/</span>
          <Link href="/machines" className="hover:text-gray-900 transition-colors">Macchinari</Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">Nuovo</span>
        </nav>
        <h1 className="text-2xl font-bold text-gray-900">Nuovo Macchinario</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Widget>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tipo */}
            <div>
              <label className="label">Tipo *</label>
              <Controller
                name="typeId"
                control={control}
                render={({ field }) => (
                  <select {...field} className={`input ${errors.typeId ? 'border-red-500' : ''}`}>
                    <option value="">Seleziona un tipo</option>
                    {types.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name} ({type.category?.name})
                      </option>
                    ))}
                  </select>
                )}
              />
              {errors.typeId && <p className="text-red-500 text-xs mt-1">{errors.typeId.message}</p>}
            </div>

            {/* Matricola */}
            <div>
              <label className="label">Matricola *</label>
              <Controller
                name="serialNumber"
                control={control}
                render={({ field }) => (
                  <input {...field} className={`input ${errors.serialNumber ? 'border-red-500' : ''}`} />
                )}
              />
              {errors.serialNumber && <p className="text-red-500 text-xs mt-1">{errors.serialNumber.message}</p>}
            </div>

            {/* Descrizione - full width */}
            <div className="md:col-span-2">
              <label className="label">Descrizione</label>
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <textarea {...field} rows={3} className={`input ${errors.description ? 'border-red-500' : ''}`} />
                )}
              />
              {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
            </div>

            {/* Produttore */}
            <div>
              <label className="label">Produttore</label>
              <Controller
                name="manufacturer"
                control={control}
                render={({ field }) => (
                  <input {...field} className={`input ${errors.manufacturer ? 'border-red-500' : ''}`} />
                )}
              />
              {errors.manufacturer && <p className="text-red-500 text-xs mt-1">{errors.manufacturer.message}</p>}
            </div>

            {/* Modello */}
            <div>
              <label className="label">Modello</label>
              <Controller
                name="model"
                control={control}
                render={({ field }) => (
                  <input {...field} className={`input ${errors.model ? 'border-red-500' : ''}`} />
                )}
              />
              {errors.model && <p className="text-red-500 text-xs mt-1">{errors.model.message}</p>}
            </div>

            {/* Anno di Costruzione */}
            <div>
              <label className="label">Anno di Costruzione</label>
              <Controller
                name="yearBuilt"
                control={control}
                render={({ field }) => (
                  <input {...field} type="number" className={`input ${errors.yearBuilt ? 'border-red-500' : ''}`} />
                )}
              />
              {errors.yearBuilt && <p className="text-red-500 text-xs mt-1">{errors.yearBuilt.message}</p>}
            </div>

            {/* Data di Acquisto */}
            <div>
              <label className="label">Data di Acquisto</label>
              <Controller
                name="purchaseDate"
                control={control}
                render={({ field }) => (
                  <input {...field} type="date" className={`input ${errors.purchaseDate ? 'border-red-500' : ''}`} />
                )}
              />
              {errors.purchaseDate && <p className="text-red-500 text-xs mt-1">{errors.purchaseDate.message}</p>}
            </div>

            {/* Rivenditore */}
            <div>
              <label className="label">Rivenditore</label>
              <Controller
                name="dealer"
                control={control}
                render={({ field }) => (
                  <input {...field} className={`input ${errors.dealer ? 'border-red-500' : ''}`} />
                )}
              />
              {errors.dealer && <p className="text-red-500 text-xs mt-1">{errors.dealer.message}</p>}
            </div>

            {/* Riferimento Fattura */}
            <div>
              <label className="label">Riferimento Fattura</label>
              <Controller
                name="invoiceReference"
                control={control}
                render={({ field }) => (
                  <input {...field} className={`input ${errors.invoiceReference ? 'border-red-500' : ''}`} />
                )}
              />
              {errors.invoiceReference && <p className="text-red-500 text-xs mt-1">{errors.invoiceReference.message}</p>}
            </div>

            {/* Locazione Documenti */}
            <div>
              <label className="label">Locazione Documenti</label>
              <Controller
                name="documentLocation"
                control={control}
                render={({ field }) => (
                  <input {...field} className={`input ${errors.documentLocation ? 'border-red-500' : ''}`} />
                )}
              />
              {errors.documentLocation && <p className="text-red-500 text-xs mt-1">{errors.documentLocation.message}</p>}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 mt-8">
            <button
              type="button"
              onClick={() => router.push('/machines')}
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
              Salva
            </button>
          </div>
        </Widget>
      </form>
    </div>
  );
}
