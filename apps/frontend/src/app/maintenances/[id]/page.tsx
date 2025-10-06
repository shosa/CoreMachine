'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Container,
  Typography,
  Card,
  Button,
  Grid,
  Chip,
  Stack,
  Divider,
  Box,
  alpha,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import BuildIcon from '@mui/icons-material/Build';
import PersonIcon from '@mui/icons-material/Person';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import EuroIcon from '@mui/icons-material/Euro';
import { PageHeader } from '@/components/PageHeader';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import api from '@/lib/axios';
import { enqueueSnackbar } from 'notistack';
import { useAuthStore } from '@/store/authStore';

interface Maintenance {
  id: string;
  type: string;
  date: string;
  description: string;
  workDone: string;
  spareParts: string | null;
  cost: number | null;
  machine: {
    id: string;
    manufacturer: string;
    model: string;
    serialNumber: string;
  };
  technician: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

const maintenanceTypeLabels = {
  ordinaria: 'Ordinaria',
  straordinaria: 'Straordinaria',
  guasto: 'Guasto',
  riparazione: 'Riparazione',
};

const maintenanceTypeColors = {
  ordinaria: 'primary',
  straordinaria: 'secondary',
  guasto: 'error',
  riparazione: 'warning',
} as const;

export default function MaintenanceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { hasRole } = useAuthStore();
  const [maintenance, setMaintenance] = useState<Maintenance | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMaintenance();
  }, [params.id]);

  const fetchMaintenance = async () => {
    try {
      const response = await api.get(`/maintenances/${params.id}`);
      setMaintenance(response.data);
    } catch (error) {
      enqueueSnackbar('Errore nel caricamento della manutenzione', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (loading || !maintenance) {
    return (
      <DashboardLayout>
        <Container maxWidth="lg">
          <Typography>Caricamento...</Typography>
        </Container>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Container maxWidth="lg">
        <PageHeader
        title="Dettaglio Manutenzione"
        breadcrumbs={['Manutenzioni', 'Dettaglio']}
        renderRight={
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={() => router.back()}
              sx={{ borderRadius: 1 }}
            >
              Indietro
            </Button>
            {hasRole(['admin', 'tecnico']) && (
              <Button
                variant="contained"
                startIcon={<EditIcon />}
                onClick={() => router.push(`/maintenances/${params.id}/edit`)}
                sx={{ borderRadius: 1 }}
              >
                Modifica
              </Button>
            )}
          </Stack>
        }
      />

      <Card elevation={2} sx={{ p: 4, borderRadius: 1, mb: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                <BuildIcon color="primary" />
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Tipo Manutenzione
                  </Typography>
                  <Chip
                    label={maintenanceTypeLabels[maintenance.type as keyof typeof maintenanceTypeLabels]}
                    color={maintenanceTypeColors[maintenance.type as keyof typeof maintenanceTypeColors]}
                    sx={{ fontWeight: 600, mt: 0.5 }}
                  />
                </Box>
              </Stack>
            </Grid>

            <Grid item xs={12} md={6}>
              <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                <CalendarTodayIcon color="primary" />
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Data
                  </Typography>
                  <Typography variant="h6" fontWeight={600}>
                    {new Date(maintenance.date).toLocaleDateString('it-IT', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </Typography>
                </Box>
              </Stack>
            </Grid>

            <Grid item xs={12} md={6}>
              <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                <PersonIcon color="primary" />
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Tecnico
                  </Typography>
                  <Typography variant="h6" fontWeight={600}>
                    {maintenance.technician?.firstName || '-'} {maintenance.technician?.lastName || ''}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {maintenance.technician?.email || '-'}
                  </Typography>
                </Box>
              </Stack>
            </Grid>

            <Grid item xs={12} md={6}>
              <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                <EuroIcon color="primary" />
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Costo
                  </Typography>
                  <Typography variant="h6" fontWeight={600}>
                    {maintenance.cost !== null ? `${maintenance.cost.toFixed(2)}€` : 'Non specificato'}
                  </Typography>
                </Box>
              </Stack>
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom sx={{ color: 'primary.main' }}>
              Macchina
            </Typography>
            <Button
              variant="outlined"
              onClick={() => router.push(`/machines/${maintenance.machine.id}`)}
              sx={{ borderRadius: 1 }}
            >
              {maintenance.machine.manufacturer} {maintenance.machine.model} - {maintenance.machine.serialNumber}
            </Button>
          </Box>

          <Divider sx={{ my: 3 }} />

          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom sx={{ color: 'primary.main' }}>
              Descrizione Problema
            </Typography>
            <Card
              sx={{
                p: 2,
                bgcolor: theme => alpha(theme.palette.primary.main, 0.02),
                border: theme => `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                borderRadius: 1,
              }}
            >
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                {maintenance.description}
              </Typography>
            </Card>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom sx={{ color: 'primary.main' }}>
              Lavoro Eseguito
            </Typography>
            <Card
              sx={{
                p: 2,
                bgcolor: theme => alpha(theme.palette.success.main, 0.02),
                border: theme => `1px solid ${alpha(theme.palette.success.main, 0.1)}`,
                borderRadius: 1,
              }}
            >
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                {maintenance.workDone}
              </Typography>
            </Card>
          </Box>

          {maintenance.spareParts && (
            <Box>
              <Typography variant="h6" fontWeight={700} gutterBottom sx={{ color: 'primary.main' }}>
                Ricambi Utilizzati
              </Typography>
              <Card
                sx={{
                  p: 2,
                  bgcolor: theme => alpha(theme.palette.secondary.main, 0.02),
                  border: theme => `1px solid ${alpha(theme.palette.secondary.main, 0.1)}`,
                  borderRadius: 1,
                }}
              >
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  {maintenance.spareParts}
                </Typography>
              </Card>
            </Box>
          )}
      </Card>
      </Container>
    </DashboardLayout>
  );
}
