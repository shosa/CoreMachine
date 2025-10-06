'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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

interface Category {
  id: string;
  name: string;
}

interface Type {
  id: string;
  name: string;
  categoryId: string;
}

export default function NewMachinePage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [types, setTypes] = useState<Type[]>([]);
  const [loading, setLoading] = useState(false);
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
  });
  const [selectedCategory, setSelectedCategory] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [categoriesRes, typesRes] = await Promise.all([
        api.get('/categories'),
        api.get('/types'),
      ]);
      setCategories(categoriesRes.data);
      setTypes(typesRes.data);
    } catch (error) {
      enqueueSnackbar('Errore nel caricamento dei dati', { variant: 'error' });
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

      await api.post('/machines', payload);
      enqueueSnackbar('Macchina creata con successo', { variant: 'success' });
      router.push('/machines');
    } catch (error: any) {
      enqueueSnackbar(error.response?.data?.message || 'Errore nella creazione della macchina', {
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
        title="Nuova Macchina"
        breadcrumbs={['Macchinari', 'Nuova']}
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
                    Salva Macchina
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
