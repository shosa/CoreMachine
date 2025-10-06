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
  Tabs,
  Tab,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Paper,
  Box,
  alpha,
} from '@mui/material';
import {
  DataGrid,
  GridColDef,
  GridRenderCellParams,
} from '@mui/x-data-grid';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import QrCodeIcon from '@mui/icons-material/QrCode';
import BuildIcon from '@mui/icons-material/Build';
import DescriptionIcon from '@mui/icons-material/Description';
import InfoIcon from '@mui/icons-material/Info';
import HistoryIcon from '@mui/icons-material/History';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import DownloadIcon from '@mui/icons-material/Download';
import { PageHeader } from '@/components/PageHeader';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import api from '@/lib/axios';
import { enqueueSnackbar } from 'notistack';
import { useAuthStore } from '@/store/authStore';

interface Machine {
  id: string;
  serialNumber: string;
  description: string;
  manufacturer: string;
  model: string;
  yearBuilt: number | null;
  purchaseDate: string | null;
  dealer: string | null;
  invoiceReference: string | null;
  status: 'operativa' | 'manutenzione' | 'fuori_servizio';
  location: string;
  type: {
    id: string;
    name: string;
    category: {
      id: string;
      name: string;
    };
  };
}

interface Maintenance {
  id: string;
  type: string;
  date: string;
  description: string;
  workDone: string;
  cost: number | null;
  technician: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

interface Document {
  id: string;
  filename: string;
  category: string;
  uploadedAt: string;
  size: number;
}

const statusColors = {
  operativa: 'success',
  manutenzione: 'warning',
  fuori_servizio: 'error',
} as const;

const statusLabels = {
  operativa: 'Operativa',
  manutenzione: 'Manutenzione',
  fuori_servizio: 'Fuori Servizio',
};

const maintenanceTypeLabels = {
  ordinaria: 'Ordinaria',
  straordinaria: 'Straordinaria',
  guasto: 'Guasto',
  riparazione: 'Riparazione',
};

export default function MachineDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { hasRole } = useAuthStore();
  const [machine, setMachine] = useState<Machine | null>(null);
  const [maintenances, setMaintenances] = useState<Maintenance[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    fetchMachineData();
  }, [params.id]);

  const fetchMachineData = async () => {
    try {
      const [machineRes, maintenancesRes, documentsRes] = await Promise.all([
        api.get(`/machines/${params.id}`),
        api.get(`/machines/${params.id}/maintenances`),
        api.get(`/machines/${params.id}/documents`),
      ]);
      setMachine(machineRes.data);
      setMaintenances(maintenancesRes.data);
      setDocuments(documentsRes.data);
    } catch (error) {
      enqueueSnackbar('Errore nel caricamento dei dati', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateQRCode = async () => {
    try {
      const response = await api.get(`/machines/${params.id}/qrcode`);
      const qrCode = response.data.qrCode;

      const win = window.open('', '_blank');
      if (win) {
        win.document.write(`
          <html>
            <head><title>QR Code - ${machine?.model}</title></head>
            <body style="display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f5f5f5;">
              <div style="text-align: center; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <h2 style="margin: 0 0 20px 0; color: #333;">QR Code - ${machine?.model}</h2>
                <img src="${qrCode}" alt="QR Code" style="max-width: 300px;" />
                <p style="margin: 20px 0 0 0; color: #666;">Scansiona per accedere alla manutenzione</p>
              </div>
            </body>
          </html>
        `);
      }
    } catch (error) {
      enqueueSnackbar('Errore nella generazione del QR Code', { variant: 'error' });
    }
  };

  const handleDownloadDocument = async (documentId: string, filename: string) => {
    try {
      const response = await api.get(`/documents/${documentId}/download`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      enqueueSnackbar('Errore nel download del documento', { variant: 'error' });
    }
  };

  const maintenanceColumns: GridColDef[] = [
    {
      field: 'date',
      headerName: 'Data',
      width: 120,
      valueFormatter: (params) => new Date(params).toLocaleDateString('it-IT'),
    },
    {
      field: 'type',
      headerName: 'Tipo',
      width: 140,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={maintenanceTypeLabels[params.value as keyof typeof maintenanceTypeLabels]}
          size="small"
          color={params.value === 'ordinaria' ? 'primary' : params.value === 'guasto' ? 'error' : 'warning'}
          sx={{ fontWeight: 600 }}
        />
      ),
    },
    {
      field: 'description',
      headerName: 'Descrizione',
      flex: 1,
      minWidth: 200,
    },
    {
      field: 'technician',
      headerName: 'Tecnico',
      width: 150,
      valueGetter: (params) => `${params.row.technician.firstName} ${params.row.technician.lastName}`,
    },
    {
      field: 'cost',
      headerName: 'Costo',
      width: 100,
      valueFormatter: (params) => params ? `${params.toFixed(2)}€` : '-',
    },
    {
      field: 'actions',
      headerName: 'Azioni',
      width: 80,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <IconButton
          size="small"
          onClick={() => router.push(`/maintenances/${params.row.id}`)}
          sx={{ color: 'primary.main' }}
        >
          <InfoIcon fontSize="small" />
        </IconButton>
      ),
    },
  ];

  if (loading || !machine) {
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
        title={`${machine.manufacturer} ${machine.model}`}
        breadcrumbs={['Macchinari', machine.serialNumber]}
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
            <Button
              variant="outlined"
              startIcon={<QrCodeIcon />}
              onClick={handleGenerateQRCode}
              sx={{ borderRadius: 1 }}
            >
              QR Code
            </Button>
            {hasRole(['admin', 'tecnico']) && (
              <Button
                variant="contained"
                startIcon={<EditIcon />}
                onClick={() => router.push(`/machines/${params.id}/edit`)}
                sx={{ borderRadius: 1 }}
              >
                Modifica
              </Button>
            )}
          </Stack>
        }
      />

        {/* Tabs */}
        <Card sx={{ borderRadius: 1, mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            sx={{
              borderBottom: 1,
              borderColor: 'divider',
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 600,
              },
            }}
          >
            <Tab icon={<InfoIcon />} iconPosition="start" label="Informazioni" />
            <Tab icon={<HistoryIcon />} iconPosition="start" label="Storico Manutenzioni" />
            <Tab icon={<AttachFileIcon />} iconPosition="start" label="Documenti" />
          </Tabs>

          {/* Tab: Informazioni */}
          {activeTab === 0 && (
            <Box sx={{ p: 4 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Numero di Serie
                  </Typography>
                  <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                    {machine.serialNumber}
                  </Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Stato
                  </Typography>
                  <Chip
                    label={statusLabels[machine.status]}
                    color={statusColors[machine.status]}
                    sx={{ fontWeight: 600, mb: 2 }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Produttore
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {machine.manufacturer}
                  </Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Modello
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {machine.model}
                  </Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Anno di Costruzione
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {machine.yearBuilt || '-'}
                  </Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Ubicazione
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {machine.location}
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Descrizione
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {machine.description}
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Data di Acquisto
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {machine.purchaseDate
                      ? new Date(machine.purchaseDate).toLocaleDateString('it-IT')
                      : '-'}
                  </Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Rivenditore
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {machine.dealer || '-'}
                  </Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Riferimento Fattura
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {machine.invoiceReference || '-'}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}

          {/* Tab: Storico Manutenzioni */}
          {activeTab === 1 && (
            <Box sx={{ p: 3 }}>
              {hasRole(['admin', 'tecnico']) && (
                <Stack direction="row" justifyContent="flex-end" sx={{ mb: 2 }}>
                  <Button
                    variant="contained"
                    startIcon={<BuildIcon />}
                    onClick={() => router.push(`/maintenances/new?machineId=${params.id}`)}
                    sx={{ borderRadius: 1 }}
                  >
                    Nuova Manutenzione
                  </Button>
                </Stack>
              )}
              <Paper sx={{ borderRadius: 1, overflow: 'hidden' }}>
                <DataGrid
                  rows={maintenances}
                  columns={maintenanceColumns}
                  autoHeight
                  disableRowSelectionOnClick
                  initialState={{
                    pagination: {
                      paginationModel: { pageSize: 10 },
                    },
                  }}
                  pageSizeOptions={[10, 25, 50]}
                  sx={{ border: 'none' }}
                />
              </Paper>
            </Box>
          )}

          {/* Tab: Documenti */}
          {activeTab === 2 && (
            <Box sx={{ p: 3 }}>
              {hasRole(['admin', 'tecnico']) && (
                <Stack direction="row" justifyContent="flex-end" sx={{ mb: 2 }}>
                  <Button
                    variant="contained"
                    startIcon={<DescriptionIcon />}
                    onClick={() => router.push(`/documents/new?machineId=${params.id}`)}
                    sx={{ borderRadius: 1 }}
                  >
                    Carica Documento
                  </Button>
                </Stack>
              )}
              {documents.length === 0 ? (
                <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                  Nessun documento disponibile
                </Typography>
              ) : (
                <List>
                  {documents.map((doc) => (
                    <ListItem
                      key={doc.id}
                      sx={{
                        mb: 1,
                        borderRadius: 1,
                        bgcolor: theme => alpha(theme.palette.primary.main, 0.02),
                        '&:hover': {
                          bgcolor: theme => alpha(theme.palette.primary.main, 0.05),
                        },
                      }}
                      secondaryAction={
                        <IconButton
                          edge="end"
                          onClick={() => handleDownloadDocument(doc.id, doc.filename)}
                          sx={{ color: 'primary.main' }}
                        >
                          <DownloadIcon />
                        </IconButton>
                      }
                    >
                      <ListItemIcon>
                        <DescriptionIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary={doc.filename}
                        secondary={
                          <Stack direction="row" spacing={2} alignItems="center">
                            <Chip label={doc.category} size="small" />
                            <Typography variant="caption" color="text.secondary">
                              {new Date(doc.uploadedAt).toLocaleDateString('it-IT')}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {(doc.size / 1024).toFixed(2)} KB
                            </Typography>
                          </Stack>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </Box>
          )}
        </Card>
      </Container>
    </DashboardLayout>
  );
}
