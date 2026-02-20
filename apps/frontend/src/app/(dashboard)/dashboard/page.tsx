'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import axiosInstance from '@/lib/axios';
import { useToast } from '@/components/Toast';
import { useAuthStore } from '@/store/authStore';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  trend?: number;
  subtitle?: string;
}

function StatCard({ title, value, icon, color, trend, subtitle }: StatCardProps) {
  return (
    <div className="card p-6">
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          <p className="text-3xl md:text-4xl font-bold text-gray-900">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
          )}
          {trend !== undefined && trend !== 0 && (
            <div className="flex items-center gap-1 mt-2">
              {trend > 0 ? (
                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                </svg>
              )}
              <span className={`text-xs font-semibold ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {Math.abs(trend)}% vs mese scorso
              </span>
            </div>
          )}
        </div>
        <div
          className="w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${color}15`, color: color }}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [trends, setTrends] = useState<any[]>([]);
  const [typeAnalysis, setTypeAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [draftsCount, setDraftsCount] = useState<number>(0);
  const { showError } = useToast();
  const { hasRole } = useAuthStore();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const requests: Promise<any>[] = [
        axiosInstance.get('/stats/dashboard'),
        axiosInstance.get('/stats/maintenance-trends'),
        axiosInstance.get('/stats/type-analysis'),
      ];

      const [statsRes, trendsRes, typesRes] = await Promise.all(requests);
      setStats(statsRes.data);
      setTrends(trendsRes.data);
      setTypeAnalysis(typesRes.data);
    } catch (error: any) {
      showError('Errore nel caricamento dei dati');
      console.error('Dashboard error:', error);
    } finally {
      setLoading(false);
    }

    // Fetch drafts count separately (only for admin/tecnico, non-blocking)
    if (hasRole(['admin', 'tecnico'])) {
      axiosInstance.get('/maintenances/drafts')
        .then((r) => setDraftsCount(Array.isArray(r.data) ? r.data.length : 0))
        .catch(() => {});
    }
  };

  const CATEGORY_COLORS = ['#1976d2', '#ed6c02', '#2e7d32', '#9c27b0', '#d32f2f', '#0288d1'];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <div className="w-10 h-10 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
      </div>
    );
  }

  const machinesByCategoryData = stats?.machinesByCategory
    ? Object.entries(stats.machinesByCategory).map(([category, count], index) => ({
        name: category,
        value: count,
        color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
      }))
    : [];

  const trendsChartData = trends.map((t) => ({
    month: format(new Date(t.month + '-01'), 'MMM yyyy', { locale: it }),
    manutenzioni: t.count,
  }));

  return (
    <div>
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Panoramica del sistema</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6">
        <StatCard
          title="Macchinari Censiti"
          value={stats?.overview?.totalMachines || 0}
          icon={
            <svg className="w-6 h-6 md:w-7 md:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
          color="#1976d2"
          trend={stats?.thisMonth?.machinesTrend}
        />
        <StatCard
          title="Manutenzioni (Mese)"
          value={stats?.thisMonth?.maintenances || 0}
          icon={
            <svg className="w-6 h-6 md:w-7 md:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
            </svg>
          }
          color="#ed6c02"
          trend={stats?.thisMonth?.maintenanceTrend}
        />
        <StatCard
          title="Manutenzioni in Scadenza"
          value={stats?.overview?.upcomingScheduled || 0}
          icon={
            <svg className="w-6 h-6 md:w-7 md:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          color="#9c27b0"
          subtitle="Prossimi 30 giorni"
        />
      </div>

      {/* Drafts Widget — visible only to admin/tecnico when there are pending drafts */}
      {hasRole(['admin', 'tecnico']) && draftsCount > 0 && (
        <Link href="/maintenances/pending" className="block mb-6">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-4 hover:bg-amber-100 transition-colors">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-amber-900">
                {draftsCount} {draftsCount === 1 ? 'bozza mobile in attesa' : 'bozze mobile in attesa'}
              </p>
              <p className="text-xs text-amber-700 mt-0.5">
                Manutenzioni registrate da QR code da revisionare e confermare
              </p>
            </div>
            <svg className="w-5 h-5 text-amber-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </Link>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-6">
        {/* Line Chart */}
        <div className="lg:col-span-2 card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Trend Manutenzioni (Ultimi 6 Mesi)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendsChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" style={{ fontSize: 11 }} angle={-45} textAnchor="end" height={60} />
              <YAxis style={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: 12,
                  fontSize: '0.875rem',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '0.875rem' }} />
              <Line
                type="monotone"
                dataKey="manutenzioni"
                stroke="#1976d2"
                strokeWidth={2}
                name="N° Manutenzioni"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribuzione Macchinari</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={machinesByCategoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.name}: ${entry.value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                style={{ fontSize: '0.75rem' }}
              >
                {machinesByCategoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ fontSize: '0.875rem' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Type Analysis */}
      {typeAnalysis?.byType && typeAnalysis.byType.length > 0 && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Analisi per Tipologia Macchinario</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {typeAnalysis.byType.slice(0, 6).map((type: any) => (
              <div
                key={type.type}
                className="bg-gray-50 border border-gray-100 rounded-xl p-4"
              >
                <h4 className="font-semibold text-gray-900 truncate mb-2">{type.type}</h4>
                <span className="badge badge-blue mb-3">{type.category}</span>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Macchinari</span>
                    <span className="font-semibold">{type.machineCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Tot. Manutenzioni</span>
                    <span className="font-semibold">{type.totalMaintenances}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Tot. Documenti</span>
                    <span className="font-semibold">{type.totalDocuments}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-200">
                    <span className="text-gray-400 text-xs">Media manut./macchina</span>
                    <span className="font-semibold text-blue-600 text-xs">
                      {type.avgMaintenancesPerMachine.toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
