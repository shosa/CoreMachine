'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box,
  Button,
  TextField,
  MenuItem,
  Grid,
  CircularProgress,
  Card,
  CardContent,
  Typography,
  Chip,
  Stack,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import { Save, ArrowBack, AttachFile, Delete, CloudUpload, Edit } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import PageHeader from '@/components/PageHeader';
import axiosInstance from '@/lib/axios';
import { useSnackbar } from 'notistack';
import { MaintenanceFormData, Machine, User, Maintenance } from '@/types';
import { useAuthStore } from '@/store/authStore';

const schema = yup.object({
  machineId: yup.string().required('Macchinario richiesto'),
  operatorId: yup.string().required('Operatore richiesto'),
  date: yup.string().required('Data richiesta'),
  type: yup.string().required('Tipo richiesto'),
  problemDescription: yup.string(),
  workPerformed: yup.string().required('Lavoro eseguito richiesto'),
  spareParts: yup.string(),
  cost: yup.number().nullable().transform((v, o) => (o === '' ? null : v)),
});

export default function EditMaintenancePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [operators, setOperators] = useState<User[]>([]);
  const [documents, setDocuments] = useState<File[]>([]);
  const [existingMaintenance, setExistingMaintenance] = useState<Maintenance | null>(null);

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<MaintenanceFormData>({
    resolver: yupResolver(schema),
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (existingMaintenance) {
      // Populate form with existing data
      setValue('machineId', existingMaintenance.machineId);
      setValue('operatorId', existingMaintenance.operatorId);
      setValue('date', new Date(existingMaintenance.date).toISOString().split('T')[0]);
      setValue('type', existingMaintenance.type);
      setValue('problemDescription', existingMaintenance.problemDescription || '');
      setValue('workPerformed', existingMaintenance.workPerformed);
      setValue('spareParts', existingMaintenance.spareParts || '');
      setValue('cost', existingMaintenance.cost || undefined);
    }
  }, [existingMaintenance]);

  const fetchData = async () => {
    try {
      setFetchLoading(true);
      const [machinesRes, usersRes, maintenanceRes] = await Promise.all([
        axiosInstance.get('/machines'),
        axiosInstance.get('/users'),
        axiosInstance.get(`/maintenances/${params.id}`),
      ]);

      setMachines(Array.isArray(machinesRes.data) ? machinesRes.data : []);
      setOperators(Array.isArray(usersRes.data) ? usersRes.data : []);
      setExistingMaintenance(maintenanceRes.data);
    } catch (error: any) {
      enqueueSnackbar('Errore nel caricamento dei dati', { variant: 'error' });
      router.push('/maintenances');
    } finally {
      setFetchLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setDocuments(prev => [...prev, ...files]);
  };

  const removeDocument = (index: number) => {
    setDocuments(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: MaintenanceFormData) => {
    try {
      setLoading(true);

      // Convert date to ISO DateTime
      const payload = {
        ...data,
        date: new Date(data.date).toISOString(),
      };

      // Create FormData for multipart upload
      const formData = new FormData();

      // Add form fields
      Object.entries(payload).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, value.toString());
        }
      });

      // Add documents
      documents.forEach((file, index) => {
        formData.append('documents', file);
      });

      await axiosInstance.patch(`/maintenances/${params.id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      enqueueSnackbar('Manutenzione aggiornata con successo', { variant: 'success' });
      router.push(`/maintenances/${params.id}`);
    } catch (error: any) {
      enqueueSnackbar(error.response?.data?.message || 'Errore durante l\'aggiornamento', {
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!existingMaintenance) {
    return null;
  }

  return (
    <Box>
      <PageHeader
        title="Modifica Manutenzione"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Manutenzioni', href: '/maintenances' },
          { label: `Manutenzione #${existingMaintenance.id.slice(0, 8)}`, href: `/maintenances/${params.id}` },
          { label: 'Modifica' },
        ]}
      />

      {/* Machine Info Card */}
      <Card elevation={0} sx={{ mb: 3, border: 1, borderColor: 'divider', borderRadius: 1 }}>
        <CardContent>
          <Stack spacing={1}>
            <Typography variant="subtitle2" color="text.secondary">
              Macchinario
            </Typography>
            <Typography variant="h6" fontWeight={600}>
              {existingMaintenance.machine?.description}
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Chip
                label={`Matr.: ${existingMaintenance.machine?.serialNumber}`}
                size="small"
                variant="outlined"
              />
              <Chip
                label={`${existingMaintenance.machine?.manufacturer} ${existingMaintenance.machine?.model || ''}`}
                size="small"
                variant="outlined"
              />
              <Chip
                label={existingMaintenance.machine?.type?.name || 'N/A'}
                size="small"
                color="primary"
                variant="outlined"
              />
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}>
          <CardContent sx={{ p: 4 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Controller
                  name="type"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      select
                      fullWidth
                      label="Tipo Manutenzione *"
                      error={!!errors.type}
                      helperText={errors.type?.message}
                    >
                      <MenuItem value="ordinaria">Ordinaria</MenuItem>
                      <MenuItem value="straordinaria">Straordinaria</MenuItem>
                      <MenuItem value="guasto">Guasto</MenuItem>
                      <MenuItem value="riparazione">Riparazione</MenuItem>
                    </TextField>
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="date"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      type="date"
                      fullWidth
                      label="Data Intervento *"
                      InputLabelProps={{ shrink: true }}
                      error={!!errors.date}
                      helperText={errors.date?.message}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="operatorId"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      select
                      fullWidth
                      label="Operatore *"
                      error={!!errors.operatorId}
                      helperText={errors.operatorId?.message}
                    >
                      <MenuItem value="">Seleziona operatore</MenuItem>
                      {operators.map((op) => (
                        <MenuItem key={op.id} value={op.id}>
                          {op.firstName} {op.lastName}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="cost"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      type="number"
                      fullWidth
                      label="Costo (€)"
                      inputProps={{ step: '0.01', min: '0' }}
                      error={!!errors.cost}
                      helperText={errors.cost?.message}
                    />
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
                      multiline
                      rows={3}
                      label="Descrizione Problema"
                      placeholder="Descrivi il problema riscontrato (opzionale)"
                      error={!!errors.problemDescription}
                      helperText={errors.problemDescription?.message}
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
                      multiline
                      rows={4}
                      label="Lavori Eseguiti *"
                      placeholder="Descrivi nel dettaglio i lavori eseguiti"
                      error={!!errors.workPerformed}
                      helperText={errors.workPerformed?.message}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12}>
                <Controller
                  name="spareParts"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      multiline
                      rows={2}
                      label="Ricambi Utilizzati"
                      placeholder="Elenca i ricambi utilizzati (opzionale)"
                      error={!!errors.spareParts}
                      helperText={errors.spareParts?.message}
                    />
                  )}
                />
              </Grid>

              {/* Document Upload Section */}
              <Grid item xs={12}>
                <Card elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Documenti Allegati
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Puoi aggiungere nuovi documenti alla manutenzione (foto, ricevute, schede tecniche, ecc.)
                    </Typography>

                    <Box sx={{ mb: 2 }}>
                      <input
                        accept="image/*,.pdf,.doc,.docx,.txt"
                        style={{ display: 'none' }}
                        id="document-upload"
                        multiple
                        type="file"
                        onChange={handleFileSelect}
                      />
                      <label htmlFor="document-upload">
                        <Button
                          variant="outlined"
                          component="span"
                          startIcon={<CloudUpload />}
                          size="small"
                        >
                          Seleziona File
                        </Button>
                      </label>
                    </Box>

                    {documents.length > 0 && (
                      <List dense>
                        {documents.map((file, index) => (
                          <ListItem key={index} divider>
                            <ListItemText
                              primary={file.name}
                              secondary={`${(file.size / 1024 / 1024).toFixed(2)} MB`}
                            />
                            <ListItemSecondaryAction>
                              <IconButton
                                edge="end"
                                onClick={() => removeDocument(index)}
                                size="small"
                              >
                                <Delete />
                              </IconButton>
                            </ListItemSecondaryAction>
                          </ListItem>
                        ))}
                      </List>
                    )}

                    {/* Existing Documents */}
                    {existingMaintenance.documents && existingMaintenance.documents.length > 0 && (
                      <>
                        <Typography variant="subtitle1" sx={{ mt: 3, mb: 1 }}>
                          Documenti Esistenti
                        </Typography>
                        <List dense>
                          {existingMaintenance.documents.map((doc) => (
                            <ListItem key={doc.id} divider>
                              <ListItemText
                                primary={doc.fileName}
                                secondary={`Caricato il ${new Date(doc.uploadedAt).toLocaleDateString('it-IT')} da ${doc.uploadedBy?.firstName} ${doc.uploadedBy?.lastName}`}
                              />
                              <ListItemSecondaryAction>
                                <Button
                                  size="small"
                                  onClick={() => window.open(`/api/documents/${doc.id}/download`, '_blank')}
                                >
                                  Scarica
                                </Button>
                              </ListItemSecondaryAction>
                            </ListItem>
                          ))}
                        </List>
                      </>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                  <Button
                    variant="outlined"
                    startIcon={<ArrowBack />}
                    onClick={() => router.back()}
                  >
                    Annulla
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={<Save />}
                    disabled={loading}
                    size="large"
                  >
                    {loading ? 'Salvataggio...' : 'Salva Modifiche'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </form>
    </Box>
  );
}