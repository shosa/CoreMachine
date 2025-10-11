'use client';

import { useEffect, useState } from 'react';
import {
  Grid,
  Box,
  Typography,
  CircularProgress,
  Card,
  CardContent,
  Chip,
} from '@mui/material';
import {
  PrecisionManufacturing,
  Build,
  TrendingUp,
  TrendingDown,
  Schedule,
} from '@mui/icons-material';
import PageHeader from '@/components/PageHeader';
import Widget from '@/components/Widget';
import axiosInstance from '@/lib/axios';
import { useSnackbar } from 'notistack';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import {
  BarChart,
  Bar,
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
    <Widget>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {title}
          </Typography>
          <Typography variant="h3" fontWeight={700} sx={{ mb: 0.5 }}>
            {value}
          </Typography>
          {subtitle && (
            <Typography variant="caption" color="text.secondary">
              {subtitle}
            </Typography>
          )}
          {trend !== undefined && trend !== 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              {trend > 0 ? (
                <TrendingUp sx={{ fontSize: 16, color: 'success.main', mr: 0.5 }} />
              ) : (
                <TrendingDown sx={{ fontSize: 16, color: 'error.main', mr: 0.5 }} />
              )}
              <Typography
                variant="caption"
                color={trend > 0 ? 'success.main' : 'error.main'}
                fontWeight={600}
              >
                {Math.abs(trend)}% vs mese scorso
              </Typography>
            </Box>
          )}
        </Box>
        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: 2,
            bgcolor: `${color}15`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: color,
          }}
        >
          {icon}
        </Box>
      </Box>
    </Widget>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [trends, setTrends] = useState<any[]>([]);
  const [typeAnalysis, setTypeAnalysis] = useState<any>(null);
  const [machineHealth, setMachineHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, trendsRes, typesRes, healthRes] = await Promise.all([
        axiosInstance.get('/stats/dashboard'),
        axiosInstance.get('/stats/maintenance-trends'),
        axiosInstance.get('/stats/type-analysis'),
        axiosInstance.get('/stats/machine-health'),
      ]);

      setStats(statsRes.data);
      setTrends(trendsRes.data);
      setTypeAnalysis(typesRes.data);
      setMachineHealth(healthRes.data);
    } catch (error: any) {
      enqueueSnackbar('Errore nel caricamento dei dati', { variant: 'error' });
      console.error('Dashboard error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Category colors
  const CATEGORY_COLORS = ['#1976d2', '#ed6c02', '#2e7d32', '#9c27b0', '#d32f2f', '#0288d1'];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Prepare data for charts
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
    <Box>
      <PageHeader title="Dashboard" />

      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Macchinari Censiti"
            value={stats?.overview?.totalMachines || 0}
            icon={<PrecisionManufacturing sx={{ fontSize: 28 }} />}
            color="#1976d2"
            trend={stats?.thisMonth?.machinesTrend}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Manutenzioni (Mese)"
            value={stats?.thisMonth?.maintenances || 0}
            icon={<Build sx={{ fontSize: 28 }} />}
            color="#ed6c02"
            trend={stats?.thisMonth?.maintenanceTrend}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Manutenzioni in Scadenza"
            value={stats?.overview?.upcomingScheduled || 0}
            icon={<Schedule sx={{ fontSize: 28 }} />}
            color="#9c27b0"
            subtitle="Prossimi 30 giorni"
          />
        </Grid>
      </Grid>

      {/* Charts Row 1 */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} lg={8}>
          <Widget title="Trend Manutenzioni (Ultimi 6 Mesi)">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendsChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" style={{ fontSize: 12 }} />
                <YAxis style={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #ccc',
                    borderRadius: 8,
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="manutenzioni"
                  stroke="#1976d2"
                  strokeWidth={2}
                  name="N° Manutenzioni"
                />
              </LineChart>
            </ResponsiveContainer>
          </Widget>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Widget title="Distribuzione Macchinari per Categoria">
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
                >
                  {machinesByCategoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Widget>
        </Grid>
      </Grid>

      {/* Type Analysis */}
      {typeAnalysis?.byType && typeAnalysis.byType.length > 0 && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12}>
            <Widget title="Analisi per Tipologia Macchinario">
              <Grid container spacing={2}>
                {typeAnalysis.byType.slice(0, 6).map((type: any, index: number) => (
                  <Grid item xs={12} sm={6} md={4} key={type.type}>
                    <Card
                      sx={{
                        bgcolor: 'background.default',
                        border: '1px solid',
                        borderColor: 'divider',
                      }}
                    >
                      <CardContent>
                        <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                          {type.type}
                        </Typography>
                        <Chip
                          label={type.category}
                          size="small"
                          sx={{ mb: 2 }}
                          color="primary"
                          variant="outlined"
                        />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            Macchinari
                          </Typography>
                          <Typography variant="body2" fontWeight={600}>
                            {type.machineCount}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            Tot. Manutenzioni
                          </Typography>
                          <Typography variant="body2" fontWeight={600}>
                            {type.totalMaintenances}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            Tot. Documenti
                          </Typography>
                          <Typography variant="body2" fontWeight={600}>
                            {type.totalDocuments}
                          </Typography>
                        </Box>
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            pt: 1,
                            borderTop: '1px solid',
                            borderColor: 'divider',
                          }}
                        >
                          <Typography variant="caption" color="text.secondary">
                            Media manut./macchina
                          </Typography>
                          <Typography variant="caption" fontWeight={600} color="primary">
                            {type.avgMaintenancesPerMachine.toFixed(1)}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Widget>
          </Grid>
        </Grid>
      )}

    </Box>
  );
}
