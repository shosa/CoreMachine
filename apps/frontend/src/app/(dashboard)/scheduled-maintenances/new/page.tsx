'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axiosInstance from '@/lib/axios';
import { useToast } from '@/components/Toast';
import Widget from '@/components/Widget';

export default function NewScheduledMaintenancePage() {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [machines, setMachines] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    machineId: '',
    frequency: 'monthly',
    nextDueDate: '',
    isActive: true,
  });

  useEffect(() => {
    fetchMachines();
  }, []);

  const fetchMachines = async () => {
    try {
      const response = await axiosInstance.get('/machines');
      setMachines(response.data.data || response.data);
    } catch (error) {
      toast.showError('Errore nel caricamento dei macchinari');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.machineId || !formData.nextDueDate) {
      toast.showWarning('Compila tutti i campi obbligatori');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        nextDueDate: new Date(formData.nextDueDate).toISOString(),
      };

      await axiosInstance.post('/scheduled-maintenances', payload);
      toast.showSuccess('Manutenzione programmata creata con successo');
      router.push('/scheduled-maintenances');
    } catch (error: any) {
      toast.showError(error.response?.data?.message || 'Errore durante la creazione');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <nav className="flex items-center gap-1 text-sm text-gray-500 mb-2">
          <Link href="/dashboard" className="hover:text-gray-900 transition-colors">Dashboard</Link>
          <span>/</span>
          <Link href="/scheduled-maintenances" className="hover:text-gray-900 transition-colors">Manutenzioni Programmate</Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">Nuova</span>
        </nav>
        <h1 className="text-2xl font-bold text-gray-900">Nuova Manutenzione Programmata</h1>
      </div>

      <Widget>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Titolo */}
            <div className="md:col-span-2">
              <label className="label">Titolo *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="Es: Controllo periodico freni"
                className="input"
                required
              />
            </div>

            {/* Descrizione */}
            <div className="md:col-span-2">
              <label className="label">Descrizione</label>
              <textarea
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Descrizione dettagliata della manutenzione..."
                rows={4}
                className="input"
              />
            </div>

            {/* Macchinario */}
            <div>
              <label className="label">Macchinario *</label>
              <select
                value={formData.machineId}
                onChange={(e) => handleChange('machineId', e.target.value)}
                className="input"
                required
              >
                <option value="">Seleziona macchinario</option>
                {machines.map((machine) => (
                  <option key={machine.id} value={machine.id}>
                    {machine.serialNumber} - {machine.manufacturer} {machine.model}
                  </option>
                ))}
              </select>
            </div>

            {/* Frequenza */}
            <div>
              <label className="label">Frequenza *</label>
              <select
                value={formData.frequency}
                onChange={(e) => handleChange('frequency', e.target.value)}
                className="input"
                required
              >
                <option value="daily">Giornaliera</option>
                <option value="weekly">Settimanale</option>
                <option value="monthly">Mensile</option>
                <option value="quarterly">Trimestrale</option>
                <option value="biannual">Semestrale</option>
                <option value="annual">Annuale</option>
              </select>
            </div>

            {/* Prossima Scadenza */}
            <div>
              <label className="label">Prossima Scadenza *</label>
              <input
                type="date"
                value={formData.nextDueDate}
                onChange={(e) => handleChange('nextDueDate', e.target.value)}
                className="input"
                required
              />
            </div>

            {/* Attiva */}
            <div className="flex items-center">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => handleChange('isActive', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gray-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-900"></div>
                <span className="ml-3 text-sm font-medium text-gray-900">Attiva</span>
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 mt-8">
            <button
              type="button"
              onClick={() => router.back()}
              disabled={loading}
              className="btn btn-secondary flex items-center gap-2"
            >
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
        </form>
      </Widget>
    </div>
  );
}
