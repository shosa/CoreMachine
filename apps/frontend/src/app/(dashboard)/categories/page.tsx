'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import axiosInstance from '@/lib/axios';
import { useToast } from '@/components/Toast';
import { Category, CategoryFormData } from '@/types';
import { useForm, Controller } from 'react-hook-form';

export default function CategoriesPage() {
  const toast = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const { control, handleSubmit, reset } = useForm<CategoryFormData>({
    defaultValues: { name: '', description: '' },
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/categories');
      setCategories(response.data.data || response.data);
    } catch (error: any) {
      toast.showError('Errore nel caricamento');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (category?: Category) => {
    if (category) {
      setEditingId(category.id);
      reset({ name: category.name, description: category.description || '' });
    } else {
      setEditingId(null);
      reset({ name: '', description: '' });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingId(null);
    reset({ name: '', description: '' });
  };

  const onSubmit = async (data: CategoryFormData) => {
    try {
      if (editingId) {
        await axiosInstance.patch(`/categories/${editingId}`, data);
        toast.showSuccess('Categoria aggiornata');
      } else {
        await axiosInstance.post('/categories', data);
        toast.showSuccess('Categoria creata');
      }
      fetchCategories();
      handleCloseDialog();
    } catch (error: any) {
      toast.showError('Errore durante il salvataggio');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Sei sicuro di voler eliminare questa categoria?')) return;
    try {
      await axiosInstance.delete(`/categories/${id}`);
      toast.showSuccess('Categoria eliminata');
      fetchCategories();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Errore durante l\'eliminazione';

      if (error.response?.status === 400 || errorMessage.includes('vincoli') || errorMessage.includes('foreign key')) {
        toast.showError('Impossibile eliminare: la categoria \u00e8 utilizzata da altri elementi');
      } else {
        toast.showError(errorMessage);
      }
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categorie</h1>
          <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
            <Link href="/dashboard" className="hover:text-gray-700 transition-colors">Dashboard</Link>
            <span>/</span>
            <span>Categorie</span>
          </div>
        </div>
        <button
          className="btn btn-primary inline-flex items-center gap-2"
          onClick={() => handleOpenDialog()}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Aggiungi Categoria
        </button>
      </div>

      {/* Table Widget */}
      <div className="card p-6">
        {loading ? (
          <div className="flex justify-center p-8">
            <div className="w-10 h-10 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-600">Nome</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600">Descrizione</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-600 w-[120px]">Azioni</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => (
                  <tr key={category.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4">{category.name}</td>
                    <td className="py-3 px-4 text-gray-600">{category.description || '-'}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenDialog(category)}
                          className="p-1.5 bg-gray-900 text-white rounded-md hover:bg-gray-700 transition-colors"
                          title="Modifica"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(category.id)}
                          className="p-1.5 bg-gray-900 text-white rounded-md hover:bg-gray-700 transition-colors"
                          title="Elimina"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {categories.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-gray-400">
                      Nessuna categoria trovata.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Dialog / Modal */}
      <AnimatePresence>
        {dialogOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-40"
              onClick={handleCloseDialog}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                <form onSubmit={handleSubmit(onSubmit)}>
                  <div className="px-6 py-4 border-b border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-900">
                      {editingId ? 'Modifica Categoria' : 'Nuova Categoria'}
                    </h2>
                  </div>
                  <div className="px-6 py-4 flex flex-col gap-4">
                    <div>
                      <label className="label">Nome *</label>
                      <Controller
                        name="name"
                        control={control}
                        render={({ field }) => (
                          <input {...field} className="input" placeholder="Nome categoria" />
                        )}
                      />
                    </div>
                    <div>
                      <label className="label">Descrizione</label>
                      <Controller
                        name="description"
                        control={control}
                        render={({ field }) => (
                          <textarea {...field} className="input min-h-[80px] resize-y" rows={3} placeholder="Descrizione categoria" />
                        )}
                      />
                    </div>
                  </div>
                  <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
                    <button type="button" className="btn btn-secondary" onClick={handleCloseDialog}>
                      Annulla
                    </button>
                    <button type="submit" className="btn btn-primary">
                      Salva
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
