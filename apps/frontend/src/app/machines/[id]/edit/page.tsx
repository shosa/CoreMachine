'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Container,
  Card,
  CardContent,
  TextField,
  Button,
  Grid,
  MenuItem,
  Stack,
  Typography,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { PageHeader } from '@/components/PageHeader';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import api from '@/lib/axios';
import { enqueueSnackbar } from 'notistack';

interface Category {
  id: string;
  name: string;
}

interface Type {
  id: string;
  name: string;
  categoryId: string;
}

export default function EditMachinePage() {
  const router = useRouter();
  const params = useParams();
  const [categories, setCategories] = useState<Category[]>([]);
  const [types, setTypes] = useState<Type[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [formData, setFormData] = useState({
    typeId: '',
    serialNumber: '',
    description: '',
    manufacturer: '',
    model: '',
    yearBuilt: '',
    purchaseDate: '',
    dealer: '',
    invoiceReference: '',
    status: 'operativa',
    location: '',
  });
  const [selectedCategory, setSelectedCategory] = useState('');

  useEffect(() => {
    fetchData();
  }, [params.id]);

  const fetchData = async () => {
    try {
      const [machineRes, categoriesRes, typesRes] = await Promise.all([
        api.get(`/machines/${params.id}`),
        api.get('/categories'),
        api.get('/types'),
      ]);

      const machine = machineRes.data;
      setCategories(categoriesRes.data);
      setTypes(typesRes.data);

      // Precompila il form con i dati della macchina
      setFormData({
        typeId: machine.type.id,
        serialNumber: machine.serialNumber,
        description: machine.description,
        manufacturer: machine.manufacturer,
        model: machine.model,
        yearBuilt: machine.yearBuilt?.toString() || '',
        purchaseDate: machine.purchaseDate
          ? new Date(machine.purchaseDate).toISOString().split('T')[0]
          : '',
        dealer: machine.dealer || '',
        invoiceReference: machine.invoiceReference || '',
        status: machine.status,
        location: machine.location || '',
      });
      setSelectedCategory(machine.type.categoryId);
    } catch (error) {
      enqueueSnackbar('Errore nel caricamento dei dati', { variant: 'error' });
    } finally {
      setLoadingData(false);
    }
  };

  const filteredTypes = selectedCategory
    ? types.filter(type => type.categoryId === selectedCategory)
    : types;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        yearBuilt: formData.yearBuilt ? parseInt(formData.yearBuilt) : null,
        purchaseDate: formData.purchaseDate || null,
      };

      await api.put(`/machines/${params.id}`, payload);
      enqueueSnackbar('Macchina aggiornata con successo', { variant: 'success' });
      router.push(`/machines/${params.id}`);
    } catch (error: any) {
      enqueueSnackbar(error.response?.data?.message || 'Errore nell\'aggiornamento della macchina', {
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
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
        title="Modifica Macchina"
        breadcrumbs={['Macchinari', 'Modifica']}
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
                  label="Categoria"
                  value={selectedCategory}
                  onChange={e => {
                    setSelectedCategory(e.target.value);
                    setFormData({ ...formData, typeId: '' });
                  }}
                  required
                >
                  {categories.map(cat => (
                    <MenuItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  select
                  label="Tipologia"
                  value={formData.typeId}
                  onChange={e => setFormData({ ...formData, typeId: e.target.value })}
                  disabled={!selectedCategory}
                  required
                >
                  {filteredTypes.map(type => (
                    <MenuItem key={type.id} value={type.id}>
                      {type.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Numero di Serie / Matricola"
                  value={formData.serialNumber}
                  onChange={e => setFormData({ ...formData, serialNumber: e.target.value })}
                  required
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  select
                  label="Stato"
                  value={formData.status}
                  onChange={e => setFormData({ ...formData, status: e.target.value })}
                  required
                >
                  <MenuItem value="operativa">Operativa</MenuItem>
                  <MenuItem value="manutenzione">Manutenzione</MenuItem>
                  <MenuItem value="fuori_servizio">Fuori Servizio</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Produttore"
                  value={formData.manufacturer}
                  onChange={e => setFormData({ ...formData, manufacturer: e.target.value })}
                  required
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Modello"
                  value={formData.model}
                  onChange={e => setFormData({ ...formData, model: e.target.value })}
                  required
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Anno di Costruzione"
                  type="number"
                  value={formData.yearBuilt}
                  onChange={e => setFormData({ ...formData, yearBuilt: e.target.value })}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Ubicazione"
                  value={formData.location}
                  onChange={e => setFormData({ ...formData, location: e.target.value })}
                  required
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Descrizione"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  multiline
                  rows={3}
                  required
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Data di Acquisto"
                  type="date"
                  value={formData.purchaseDate}
                  onChange={e => setFormData({ ...formData, purchaseDate: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Rivenditore"
                  value={formData.dealer}
                  onChange={e => setFormData({ ...formData, dealer: e.target.value })}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Riferimento Fattura"
                  value={formData.invoiceReference}
                  onChange={e => setFormData({ ...formData, invoiceReference: e.target.value })}
                />
              </Grid>

              <Grid item xs={12}>
                <Stack direction="row" spacing={2} justifyContent="flex-end">
                  <Button
                    variant="outlined"
                    onClick={() => router.back()}
                    disabled={loading}
                    sx={{ borderRadius: 1 }}
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
                    Salva Modifiche
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
