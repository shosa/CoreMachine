'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Box,
  Container,
  Card,
  CardContent,
  TextField,
  Button,
  Grid,
  MenuItem,
  Stack,
  Alert,
  LinearProgress,
  Typography,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
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

const documentCategories = [
  { value: 'manuale', label: 'Manuale' },
  { value: 'certificazione', label: 'Certificazione' },
  { value: 'scheda_tecnica', label: 'Scheda Tecnica' },
  { value: 'fattura', label: 'Fattura' },
  { value: 'garanzia', label: 'Garanzia' },
  { value: 'contratto', label: 'Contratto' },
  { value: 'altro', label: 'Altro' },
];

export default function NewDocumentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const machineIdFromQuery = searchParams.get('machineId');

  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    machineId: machineIdFromQuery || '',
    category: '',
    description: '',
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Limita a 10MB
      if (file.size > 10 * 1024 * 1024) {
        enqueueSnackbar('Il file supera la dimensione massima di 10MB', { variant: 'error' });
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile) {
      enqueueSnackbar('Seleziona un file da caricare', { variant: 'error' });
      return;
    }

    setLoading(true);
    setUploadProgress(0);

    try {
      // Crea FormData per multipart/form-data
      const formDataToSend = new FormData();
      formDataToSend.append('file', selectedFile);
      formDataToSend.append('machineId', formData.machineId);
      formDataToSend.append('category', formData.category);
      if (formData.description) {
        formDataToSend.append('description', formData.description);
      }

      // Upload con progress tracking
      await api.post('/documents', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(progress);
          }
        },
      });

      enqueueSnackbar('Documento caricato con successo', { variant: 'success' });

      // Reindirizza alla pagina della macchina se proveniente da lì
      if (machineIdFromQuery) {
        router.push(`/machines/${machineIdFromQuery}`);
      } else {
        router.push('/documents');
      }
    } catch (error: any) {
      enqueueSnackbar(error.response?.data?.message || 'Errore nel caricamento del documento', {
        variant: 'error',
      });
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  return (
    <DashboardLayout>
      <Container maxWidth="lg">
        <PageHeader
        title="Carica Documento"
        breadcrumbs={['Documenti', 'Nuovo']}
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
              <Grid item xs={12}>
                <Alert severity="info">
                  Dimensione massima file: 10MB. Formati supportati: PDF, DOC, DOCX, XLS, XLSX, PNG, JPG, JPEG
                </Alert>
              </Grid>

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
                  label="Categoria Documento"
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  required
                >
                  {documentCategories.map(category => (
                    <MenuItem key={category.value} value={category.value}>
                      {category.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Descrizione (opzionale)"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  multiline
                  rows={3}
                  helperText="Aggiungi una breve descrizione del documento"
                />
              </Grid>

              <Grid item xs={12}>
                <Button
                  component="label"
                  variant="outlined"
                  startIcon={<CloudUploadIcon />}
                  sx={{
                    width: '100%',
                    height: 120,
                    borderStyle: 'dashed',
                    borderWidth: 2,
                    borderRadius: 1,
                    '&:hover': {
                      borderStyle: 'dashed',
                      borderWidth: 2,
                    },
                  }}
                >
                  {selectedFile ? (
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="body1" fontWeight={600}>
                        {selectedFile.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {(selectedFile.size / 1024).toFixed(2)} KB
                      </Typography>
                    </Box>
                  ) : (
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="body1">Clicca per selezionare un file</Typography>
                      <Typography variant="caption" color="text.secondary">
                        oppure trascina un file qui
                      </Typography>
                    </Box>
                  )}
                  <input
                    type="file"
                    hidden
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                  />
                </Button>
              </Grid>

              {loading && (
                <Grid item xs={12}>
                  <Box sx={{ width: '100%' }}>
                    <LinearProgress variant="determinate" value={uploadProgress} />
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                      Caricamento in corso: {uploadProgress}%
                    </Typography>
                  </Box>
                </Grid>
              )}

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
                    disabled={loading || !selectedFile}
                    sx={{ borderRadius: 1 }}
                  >
                    Carica Documento
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
