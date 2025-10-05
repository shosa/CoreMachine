'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  TextField,
  MenuItem,
  CircularProgress,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import api from '@/lib/axios';

export default function MachineQRPage() {
  const params = useParams();
  const { enqueueSnackbar } = useSnackbar();
  const [machine, setMachine] = useState<any>(null);
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
      <Container sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!machine) {
    return (
      <Container sx={{ mt: 4 }}>
        <Typography>Macchina non trovata</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          {machine.description}
        </Typography>
        <Typography color="text.secondary" gutterBottom>
          Matricola: {machine.serialNumber}
        </Typography>
        <Typography color="text.secondary" gutterBottom>
          Costruttore: {machine.manufacturer} - Modello: {machine.model}
        </Typography>

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Registra Manutenzione
          </Typography>

          <TextField
            select
            fullWidth
            label="Tipo"
            value={formData.type}
            onChange={e => setFormData({ ...formData, type: e.target.value })}
            margin="normal"
          >
            <MenuItem value="ordinaria">Ordinaria</MenuItem>
            <MenuItem value="straordinaria">Straordinaria</MenuItem>
            <MenuItem value="guasto">Guasto</MenuItem>
            <MenuItem value="riparazione">Riparazione</MenuItem>
          </TextField>

          <TextField
            fullWidth
            type="date"
            label="Data"
            value={formData.date}
            onChange={e => setFormData({ ...formData, date: e.target.value })}
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            fullWidth
            multiline
            rows={3}
            label="Lavori Eseguiti"
            value={formData.workPerformed}
            onChange={e => setFormData({ ...formData, workPerformed: e.target.value })}
            required
            margin="normal"
          />

          <TextField
            fullWidth
            multiline
            rows={2}
            label="Descrizione Problema (opzionale)"
            value={formData.problemDescription}
            onChange={e => setFormData({ ...formData, problemDescription: e.target.value })}
            margin="normal"
          />

          <TextField
            fullWidth
            label="Ricambi Utilizzati (opzionale)"
            value={formData.spareParts}
            onChange={e => setFormData({ ...formData, spareParts: e.target.value })}
            margin="normal"
          />

          <TextField
            fullWidth
            type="number"
            label="Costo (€) (opzionale)"
            value={formData.cost}
            onChange={e => setFormData({ ...formData, cost: e.target.value })}
            margin="normal"
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={submitting}
            sx={{ mt: 3 }}
          >
            {submitting ? 'Salvataggio...' : 'Salva Manutenzione'}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}
