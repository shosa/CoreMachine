'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Container,
  Paper,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  TextField,
  MenuItem,
  CircularProgress,
  Stack,
  Divider,
} from '@mui/material';
import QrCodeIcon from '@mui/icons-material/QrCode';
import BuildIcon from '@mui/icons-material/Build';
import { enqueueSnackbar } from 'notistack';
import api from '@/lib/axios';

interface Machine {
  id: string;
  description: string;
  serialNumber: string;
  manufacturer: string;
  model: string;
}

export default function MachineQRPage() {
  const params = useParams();
  const [machine, setMachine] = useState<Machine | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    type: 'ordinaria',
    date: new Date().toISOString().split('T')[0],
    workPerformed: '',
    problemDescription: '',
    spareParts: '',
    cost: '',
  });

  useEffect(() => {
    const fetchMachine = async () => {
      try {
        const response = await api.get(`/machines/${params.id}`);
        setMachine(response.data);
      } catch (error) {
        enqueueSnackbar('Errore nel caricamento della macchina', { variant: 'error' });
      } finally {
        setLoading(false);
      }
    };

    fetchMachine();
  }, [params.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await api.post('/maintenances', {
        machineId: params.id,
        ...formData,
        cost: formData.cost ? parseFloat(formData.cost) : undefined,
      });

      enqueueSnackbar('Manutenzione registrata con successo', { variant: 'success' });
      setFormData({
        type: 'ordinaria',
        date: new Date().toISOString().split('T')[0],
        workPerformed: '',
        problemDescription: '',
        spareParts: '',
        cost: '',
      });
    } catch (error) {
      enqueueSnackbar('Errore nella registrazione', { variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!machine) {
    return (
      <Container maxWidth="md" sx={{ mt: 8 }}>
        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 1 }}>
          <Typography variant="h5" color="error">
            Macchina non trovata
          </Typography>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* Header Card */}
      <Card elevation={2} sx={{ mb: 3, borderRadius: 1 }}>
        <CardContent sx={{ p: 3 }}>
          <Stack direction="row" spacing={2} alignItems="center" mb={2}>
            <QrCodeIcon sx={{ fontSize: 40, color: 'primary.main' }} />
            <Box>
              <Typography variant="h5" fontWeight={600}>
                {machine.description}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Accesso rapido tramite QR Code
              </Typography>
            </Box>
          </Stack>

          <Divider sx={{ my: 2 }} />

          <Stack spacing={1}>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Matricola
              </Typography>
              <Typography variant="body1" fontWeight={500}>
                {machine.serialNumber}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Costruttore
              </Typography>
              <Typography variant="body1" fontWeight={500}>
                {machine.manufacturer}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Modello
              </Typography>
              <Typography variant="body1" fontWeight={500}>
                {machine.model}
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {/* Maintenance Form Card */}
      <Card elevation={2} sx={{ borderRadius: 1 }}>
        <CardContent sx={{ p: 3 }}>
          <Stack direction="row" spacing={1.5} alignItems="center" mb={3}>
            <BuildIcon sx={{ color: 'primary.main' }} />
            <Typography variant="h6" fontWeight={600}>
              Registra Manutenzione
            </Typography>
          </Stack>

          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={2.5}>
              <TextField
                select
                fullWidth
                label="Tipo Manutenzione"
                value={formData.type}
                onChange={e => setFormData({ ...formData, type: e.target.value })}
                required
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
              >
                <MenuItem value="ordinaria">Ordinaria</MenuItem>
                <MenuItem value="straordinaria">Straordinaria</MenuItem>
                <MenuItem value="guasto">Guasto</MenuItem>
                <MenuItem value="riparazione">Riparazione</MenuItem>
              </TextField>

              <TextField
                fullWidth
                type="date"
                label="Data Intervento"
                value={formData.date}
                onChange={e => setFormData({ ...formData, date: e.target.value })}
                required
                InputLabelProps={{ shrink: true }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
              />

              <TextField
                fullWidth
                multiline
                rows={4}
                label="Lavori Eseguiti"
                value={formData.workPerformed}
                onChange={e => setFormData({ ...formData, workPerformed: e.target.value })}
                required
                placeholder="Descrivi i lavori eseguiti..."
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
              />

              <TextField
                fullWidth
                multiline
                rows={3}
                label="Descrizione Problema"
                value={formData.problemDescription}
                onChange={e => setFormData({ ...formData, problemDescription: e.target.value })}
                placeholder="Descrivi il problema riscontrato (opzionale)..."
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
              />

              <TextField
                fullWidth
                label="Ricambi Utilizzati"
                value={formData.spareParts}
                onChange={e => setFormData({ ...formData, spareParts: e.target.value })}
                placeholder="Elenca i ricambi utilizzati (opzionale)..."
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
              />

              <TextField
                fullWidth
                type="number"
                label="Costo Intervento (€)"
                value={formData.cost}
                onChange={e => setFormData({ ...formData, cost: e.target.value })}
                inputProps={{ step: '0.01', min: '0' }}
                placeholder="0.00"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={submitting}
                sx={{
                  mt: 2,
                  borderRadius: 1,
                  py: 1.5,
                  fontSize: '1rem',
                  fontWeight: 600,
                }}
              >
                {submitting ? 'Salvataggio in corso...' : 'Salva Manutenzione'}
              </Button>
            </Stack>
          </Box>
        </CardContent>
      </Card>

      {/* Footer Info */}
      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Typography variant="caption" color="text.secondary">
          CoreMachine - Sistema di Gestione Parco Macchine
        </Typography>
      </Box>
    </Container>
  );
}
