'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Card,
  Typography,
  TextField,
  MenuItem,
  Button,
  CircularProgress,
  Grid,
  Alert,
} from '@mui/material';
import { Build, Save, CheckCircle } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import axiosInstance from '@/lib/axios';
import { useSnackbar } from 'notistack';
import { useAuthStore } from '@/store/authStore';
import { Machine, MaintenanceFormData } from '@/types';

export default function QuickMaintenancePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const { enqueueSnackbar } = useSnackbar();
  const [machine, setMachine] = useState<Machine | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const { control, handleSubmit } = useForm<Partial<MaintenanceFormData>>({
    defaultValues: {
      machineId: params.id as string,
      date: new Date().toISOString().split('T')[0],
      type: 'ordinaria',
      workPerformed: '',
      problemDescription: '',
    },
  });

  useEffect(() => {
    fetchMachine();
  }, [params.id]);

  const fetchMachine = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/machines/${params.id}`);
      setMachine(response.data);
    } catch (error: any) {
      enqueueSnackbar('Errore nel caricamento del macchinario', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: Partial<MaintenanceFormData>) => {
    if (!user) {
      enqueueSnackbar('Devi effettuare il login per registrare una manutenzione', { variant: 'warning' });
      router.push(`/login?redirect=/m/${params.id}`);
      return;
    }

    try {
      setSubmitting(true);
      const maintenanceData = {
        ...data,
        operatorId: user.id,
      };
      await axiosInstance.post('/maintenances', maintenanceData);
      setSuccess(true);
      enqueueSnackbar('Manutenzione registrata con successo', { variant: 'success' });
    } catch (error: any) {
      enqueueSnackbar(error.response?.data?.message || 'Errore durante la registrazione', { variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!machine) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Card sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h5">Macchinario non trovato</Typography>
        </Card>
      </Container>
    );
  }

  if (success) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', py: 4, display: 'flex', alignItems: 'center' }}>
        <Container maxWidth="sm">
          <Card sx={{ p: 5, textAlign: 'center' }}>
            <CheckCircle sx={{ fontSize: 80, color: 'success.main', mb: 3 }} />
            <Typography variant="h4" fontWeight={700} gutterBottom>
              Manutenzione Registrata!
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              La manutenzione per il macchinario <strong>{machine?.serialNumber}</strong> è stata registrata con successo.
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={() => router.push(`/machines/${params.id}`)}
            >
              Visualizza Scheda Macchinario
            </Button>
          </Card>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', py: 4 }}>
      <Container maxWidth="md">
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 4 }}>
          <Build sx={{ fontSize: 48, color: 'primary.main', mr: 2 }} />
          <Typography variant="h4" fontWeight={700}>
            CoreMachine
          </Typography>
        </Box>

        <Card sx={{ p: 4, mb: 3 }}>
          <Typography variant="h5" fontWeight={600} gutterBottom>
            Registrazione Rapida Manutenzione
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Macchinario: {machine.serialNumber}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Tipo: {machine.type?.name}
          </Typography>
          {!user && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Devi essere loggato per registrare una manutenzione
            </Alert>
          )}
        </Card>

        <Card sx={{ p: 4 }}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Controller
                  name="date"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Data"
                      type="date"
                      InputLabelProps={{ shrink: true }}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="type"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} fullWidth select label="Tipo">
                      <MenuItem value="ordinaria">Ordinaria</MenuItem>
                      <MenuItem value="straordinaria">Straordinaria</MenuItem>
                      <MenuItem value="guasto">Guasto</MenuItem>
                      <MenuItem value="riparazione">Riparazione</MenuItem>
                    </TextField>
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="problemDescription"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Descrizione Problema (opzionale)"
                      multiline
                      rows={3}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="workPerformed"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Lavoro Eseguito *"
                      multiline
                      rows={4}
                      required
                    />
                  )}
                />
              </Grid>
            </Grid>

            <Button
              type="submit"
              variant="contained"
              size="large"
              fullWidth
              startIcon={submitting ? <CircularProgress size={20} /> : <Save />}
              disabled={submitting}
              sx={{ mt: 3 }}
            >
              Registra Manutenzione
            </Button>
          </form>
        </Card>
      </Container>
    </Box>
  );
}
