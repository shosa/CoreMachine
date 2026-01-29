'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import Widget from '@/components/Widget';
import axiosInstance from '@/lib/axios';
import { useToast } from '@/components/Toast';
import { UserFormData } from '@/types';

const schema = yup.object({
  email: yup.string().email('Email non valida').required('Email richiesta'),
  password: yup.string().required('Password richiesta').min(6, 'Minimo 6 caratteri'),
  firstName: yup.string().required('Nome richiesto'),
  lastName: yup.string().required('Cognome richiesto'),
  role: yup.string().required('Ruolo richiesto'),
  isActive: yup.boolean(),
});

export default function NewUserPage() {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<UserFormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      role: 'utente',
      isActive: true,
    },
  });

  const onSubmit = async (data: UserFormData) => {
    try {
      setLoading(true);
      await axiosInstance.post('/users', data);
      toast.showSuccess('Utente creato con successo');
      router.push('/users');
    } catch (error: any) {
      toast.showError('Errore durante la creazione');
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
          <Link href="/users" className="hover:text-gray-900 transition-colors">Utenti</Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">Nuovo</span>
        </nav>
        <h1 className="text-2xl font-bold text-gray-900">Nuovo Utente</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Widget>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nome */}
            <div>
              <label className="label">Nome *</label>
              <Controller
                name="firstName"
                control={control}
                render={({ field }) => (
                  <input {...field} className={`input ${errors.firstName ? 'border-red-500' : ''}`} />
                )}
              />
              {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName.message}</p>}
            </div>

            {/* Cognome */}
            <div>
              <label className="label">Cognome *</label>
              <Controller
                name="lastName"
                control={control}
                render={({ field }) => (
                  <input {...field} className={`input ${errors.lastName ? 'border-red-500' : ''}`} />
                )}
              />
              {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName.message}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="label">Email *</label>
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <input {...field} type="email" className={`input ${errors.email ? 'border-red-500' : ''}`} />
                )}
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="label">Password *</label>
              <Controller
                name="password"
                control={control}
                render={({ field }) => (
                  <input {...field} type="password" className={`input ${errors.password ? 'border-red-500' : ''}`} />
                )}
              />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>

            {/* Ruolo */}
            <div>
              <label className="label">Ruolo *</label>
              <Controller
                name="role"
                control={control}
                render={({ field }) => (
                  <select {...field} className={`input ${errors.role ? 'border-red-500' : ''}`}>
                    <option value="admin">Admin</option>
                    <option value="tecnico">Tecnico</option>
                    <option value="utente">Utente</option>
                  </select>
                )}
              />
              {errors.role && <p className="text-red-500 text-xs mt-1">{errors.role.message}</p>}
            </div>

            {/* Attivo */}
            <div className="flex items-center">
              <Controller
                name="isActive"
                control={control}
                render={({ field }) => (
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gray-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-900"></div>
                    <span className="ml-3 text-sm font-medium text-gray-900">Attivo</span>
                  </label>
                )}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-8">
            <button
              type="button"
              onClick={() => router.push('/users')}
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
