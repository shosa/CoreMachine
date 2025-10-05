'use client';

import { useEffect, useState } from 'react';
import { Grid, Typography, Box, Container, alpha } from '@mui/material';
import PrecisionManufacturingIcon from '@mui/icons-material/PrecisionManufacturing';
import BuildIcon from '@mui/icons-material/Build';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import DescriptionIcon from '@mui/icons-material/Description';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import StatsCard from '@/components/StatsCard';
import api from '@/lib/axios';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalMachines: 0,
    totalMaintenances: 0,
    upcomingMaintenances: 0,
    totalDocuments: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [machines, maintenances, scheduled, documents] = await Promise.all([
          api.get('/machines'),
          api.get('/maintenances'),
          api.get('/scheduled-maintenances/upcoming?days=30'),
          api.get('/documents'),
        ]);

        setStats({
          totalMachines: machines.data.length,
          totalMaintenances: maintenances.data.length,
          upcomingMaintenances: scheduled.data.length,
          totalDocuments: documents.data.length,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <DashboardLayout>
      <Container maxWidth="xl">
        {/* Header */}
        <Box mb={5}>
          <Typography
            variant="h3"
            fontWeight={700}
            sx={{
              background: theme =>
                `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 1,
            }}
          >
            Dashboard
          </Typography>
          <Typography variant="h6" color="text.secondary" fontWeight={400}>
            Panoramica del sistema di gestione parco macchine
          </Typography>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} sm={6} lg={3}>
            <StatsCard
              title="Macchinari"
              value={stats.totalMachines}
              icon={<PrecisionManufacturingIcon sx={{ fontSize: 40 }} />}
              color="primary"
              subtitle="Totale inventario"
            />
          </Grid>

          <Grid item xs={12} sm={6} lg={3}>
            <StatsCard
              title="Manutenzioni"
              value={stats.totalMaintenances}
              icon={<BuildIcon sx={{ fontSize: 40 }} />}
              color="success"
              subtitle="Interventi completati"
            />
          </Grid>

          <Grid item xs={12} sm={6} lg={3}>
            <StatsCard
              title="In Scadenza"
              value={stats.upcomingMaintenances}
              icon={<WarningAmberIcon sx={{ fontSize: 40 }} />}
              color="warning"
              subtitle="Prossimi 30 giorni"
            />
          </Grid>

          <Grid item xs={12} sm={6} lg={3}>
            <StatsCard
              title="Documenti"
              value={stats.totalDocuments}
              icon={<DescriptionIcon sx={{ fontSize: 40 }} />}
              color="secondary"
              subtitle="File archiviati"
            />
          </Grid>
        </Grid>

        {/* Welcome Section */}
        <Box
          sx={{
            p: 4,
            borderRadius: 4,
            background: theme =>
              `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)}, ${alpha(theme.palette.secondary.main, 0.05)})`,
            border: theme => `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
          }}
        >
          <Typography variant="h5" fontWeight={600} gutterBottom>
            👋 Benvenuto in CoreMachine
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 800 }}>
            Sistema completo per la gestione del parco macchine aziendale. Monitora l'inventario,
            pianifica manutenzioni, archivia documenti e genera QR code per accesso rapido on-site.
          </Typography>
        </Box>
      </Container>
    </DashboardLayout>
  );
}
