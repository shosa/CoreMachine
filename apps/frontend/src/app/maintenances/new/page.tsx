'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Container,
  Card,
  CardContent,
  TextField,
  Button,
  Grid,
  MenuItem,
  Stack,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { PageHeader } from '@/components/PageHeader';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import api from '@/lib/axios';
import { enqueueSnackbar } from 'notistack';

interface Machine {
  id: string;
  manufacturer: string;
  model: string;
  serialNumber: string;
}

const maintenanceTypes = [
  { value: 'ordinaria', label: 'Ordinaria' },
  { value: 'straordinaria', label: 'Straordinaria' },
  { value: 'guasto', label: 'Guasto' },
  { value: 'riparazione', label: 'Riparazione' },
];

export default function NewMaintenancePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const machineIdFromQuery = searchParams.get('machineId');

  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    machineId: machineIdFromQuery || '',
    type: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    workDone: '',
    spareParts: '',
    cost: '',
  });

  useEffect(() => {
    fetchMachines();
  }, []);

  const fetchMachines = async () => {
    try {
      const response = await api.get('/machines');
      setMachines(response.data);
    } catch (error) {
      enqueueSnackbar('Errore nel caricamento delle macchine', { variant: 'error' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        machineId: formData.machineId,
        type: formData.type,
        date: formData.date,
        description: formData.description,
        workDone: formData.workDone,
        spareParts: formData.spareParts || null,
        cost: formData.cost ? parseFloat(formData.cost) : null,
      };

      await api.post('/maintenances', payload);
      enqueueSnackbar('Manutenzione creata con successo', { variant: 'success' });

      // Reindirizza alla pagina della macchina se proveniente da lì
      if (machineIdFromQuery) {
        router.push(`/machines/${machineIdFromQuery}`);
      } else {
        router.push('/maintenances');
      }
    } catch (error: any) {
      enqueueSnackbar(error.response?.data?.message || 'Errore nella creazione della manutenzione', {
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <Container maxWidth="lg">
        <PageHeader
        title="Nuova Manutenzione"
        breadcrumbs={['Manutenzioni', 'Nuova']}
        renderRight={
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => router.back()}
            variant="outlined"
            sx={{ borderRadius: 1 }}
          >
            Indietro
          </Button>
        }
      />

      <Card elevation={2} sx={{ borderRadius: 1 }}>
        <CardContent sx={{ p: 4 }}>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  select
                  label="Macchina"
                  value={formData.machineId}
                  onChange={e => setFormData({ ...formData, machineId: e.target.value })}
                  required
                  disabled={!!machineIdFromQuery}
                >
                  {machines.map(machine => (
                    <MenuItem key={machine.id} value={machine.id}>
                      {machine.manufacturer} {machine.model} - {machine.serialNumber}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  select
                  label="Tipo Manutenzione"
                  value={formData.type}
                  onChange={e => setFormData({ ...formData, type: e.target.value })}
                  required
                >
                  {maintenanceTypes.map(type => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Data"
                  type="date"
                  value={formData.date}
                  onChange={e => setFormData({ ...formData, date: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Costo (€)"
                  type="number"
                  value={formData.cost}
                  onChange={e => setFormData({ ...formData, cost: e.target.value })}
                  inputProps={{ step: '0.01', min: '0' }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Descrizione Problema"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  multiline
                  rows={4}
                  required
                  helperText="Descrivi il problema riscontrato o il tipo di manutenzione da effettuare"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Lavoro Eseguito"
                  value={formData.workDone}
                  onChange={e => setFormData({ ...formData, workDone: e.target.value })}
                  multiline
                  rows={4}
                  required
                  helperText="Descrivi dettagliatamente il lavoro svolto e le operazioni effettuate"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Ricambi Utilizzati"
                  value={formData.spareParts}
                  onChange={e => setFormData({ ...formData, spareParts: e.target.value })}
                  multiline
                  rows={3}
                  helperText="Elenco dei ricambi utilizzati (opzionale)"
                />
              </Grid>

              <Grid item xs={12}>
                <Stack direction="row" spacing={2} justifyContent="flex-end">
                  <Button
                    variant="outlined"
                    onClick={() => router.back()}
                    disabled={loading}
                  >
                    Annulla
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={<SaveIcon />}
                    disabled={loading}
                    sx={{ borderRadius: 1 }}
                  >
                    Salva Manutenzione
                  </Button>
                </Stack>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
      </Container>
    </DashboardLayout>
  );
}
