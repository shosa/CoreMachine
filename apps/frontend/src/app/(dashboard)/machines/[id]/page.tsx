'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box,
  Button,
  Grid,
  Typography,
  Tabs,
  Tab,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Card,
  CardContent,
  Divider,
  Chip,
  TextField,
  MenuItem,
  Paper,
  Stack,
  Avatar,
} from '@mui/material';
import {
  Edit,
  QrCode2,
  Close,
  Build,
  Category as CategoryIcon,
  Factory,
  CalendarMonth,
  Receipt,
  Description,
  CloudUpload,
  Download,
  Delete,
  Visibility,
  Print,
} from '@mui/icons-material';
import PageHeader from '@/components/PageHeader';
import Widget from '@/components/Widget';
import axiosInstance from '@/lib/axios';
import { useSnackbar } from 'notistack';
import { Machine, Maintenance, Document } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { DataGrid, GridColDef, GridActionsCellItem } from '@mui/x-data-grid';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import QRCode from 'qrcode';
import jsPDF from 'jspdf';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function MachineDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { hasRole } = useAuthStore();
  const { enqueueSnackbar } = useSnackbar();
  const [machine, setMachine] = useState<Machine | null>(null);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentCategory, setDocumentCategory] = useState('');
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState('');
  const [docPreviewOpen, setDocPreviewOpen] = useState(false);
  const [docPreviewUrl, setDocPreviewUrl] = useState('');
  const [docPreviewName, setDocPreviewName] = useState('');

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

  const handleGenerateQR = async () => {
    try {
      const url = `${window.location.origin}/m/${params.id}`;
      const qrUrl = await QRCode.toDataURL(url, { width: 400 });
      setQrCodeUrl(qrUrl);
      setQrDialogOpen(true);
    } catch (error) {
      enqueueSnackbar('Errore nella generazione del QR code', { variant: 'error' });
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile || !documentCategory) {
      enqueueSnackbar('Seleziona un file e una categoria', { variant: 'warning' });
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('machineId', params.id as string);
      formData.append('documentCategory', documentCategory);

      await axiosInstance.post('/documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      enqueueSnackbar('Documento caricato con successo', { variant: 'success' });
      setUploadDialogOpen(false);
      setSelectedFile(null);
      setDocumentCategory('');
      fetchMachine(); // Refresh data
    } catch (error: any) {
      enqueueSnackbar(error.response?.data?.message || 'Errore durante il caricamento', {
        variant: 'error',
      });
    } finally {
      setUploading(false);
    }
  };

  const handlePreviewDocument = async (doc: Document) => {
    try {
      const response = await axiosInstance.get(`/documents/${doc.id}/download`, {
        responseType: 'blob',
      });
      // Get content type from response headers or default to application/pdf
      const contentType = response.headers['content-type'] || 'application/pdf';
      const blob = new Blob([response.data], { type: contentType });
      const blobUrl = URL.createObjectURL(blob);
      setDocPreviewUrl(blobUrl);
      setDocPreviewName(doc.fileName);
      setDocPreviewOpen(true);
    } catch (error) {
      enqueueSnackbar('Errore durante la visualizzazione', { variant: 'error' });
    }
  };

  const handleDownloadDocument = async (doc: Document) => {
    try {
      const response = await axiosInstance.get(`/documents/${doc.id}/download`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', doc.fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      enqueueSnackbar('Errore durante il download', { variant: 'error' });
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo documento?')) return;

    try {
      await axiosInstance.delete(`/documents/${docId}`);
      enqueueSnackbar('Documento eliminato', { variant: 'success' });
      fetchMachine();
    } catch (error) {
      enqueueSnackbar("Errore durante l'eliminazione", { variant: 'error' });
    }
  };

  const handlePrintMachineSheet = async () => {
    if (!machine) return;

    try {
      // Generate QR Code
      const qrUrl = `${window.location.origin}/m/${params.id}`;
      const qrCodeDataUrl = await QRCode.toDataURL(qrUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      });

      // Create PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      let yPos = margin;

      // Helper function to add text
      const addText = (
        text: string,
        fontSize: number,
        isBold: boolean = false,
        color: number[] = [0, 0, 0],
      ) => {
        pdf.setFontSize(fontSize);
        pdf.setFont('helvetica', isBold ? 'bold' : 'normal');
        pdf.setTextColor(color[0], color[1], color[2]);
        pdf.text(text, margin, yPos);
        yPos += fontSize * 0.5;
      };

      // Header - Title and Logo Area
      pdf.setFillColor(0, 0, 0); // Black header
      pdf.rect(0, 0, pageWidth, 40, 'F');

      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.text('SCHEDA MACCHINARIO', pageWidth / 2, 15, { align: 'center' });

      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text('CoreMachine', pageWidth / 2, 25, { align: 'center' });

      pdf.setFontSize(10);
      pdf.text(format(new Date(), 'dd/MM/yyyy HH:mm', { locale: it }), pageWidth / 2, 33, {
        align: 'center',
      });

      yPos = 50;

      // Machine Description - Big Title
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 0, 0);
      pdf.text(machine.description || 'Macchinario senza descrizione', margin, yPos);
      yPos += 10;

      // Divider line
      pdf.setDrawColor(200, 200, 200);
      pdf.setLineWidth(0.5);
      pdf.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 8;

      // Section 1: Identificazione
      pdf.setFillColor(240, 240, 240);
      pdf.rect(margin, yPos - 5, pageWidth - 2 * margin, 8, 'F');
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 0, 0);
      pdf.text('IDENTIFICAZIONE', margin + 2, yPos);
      yPos += 10;

      const col1X = margin + 5;
      const col2X = pageWidth / 2 + 5;
      const lineHeight = 7;

      // Row 1
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(100, 100, 100);
      pdf.text('MATRICOLA:', col1X, yPos);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(0, 0, 0);
      pdf.text(machine.serialNumber, col1X + 25, yPos);

      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(100, 100, 100);
      pdf.text('CATEGORIA:', col2X, yPos);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(0, 0, 0);
      pdf.text(machine.type?.category?.name || '-', col2X + 25, yPos);
      yPos += lineHeight;

      // Row 2
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(100, 100, 100);
      pdf.text('PRODUTTORE:', col1X, yPos);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(0, 0, 0);
      pdf.text(machine.manufacturer || '-', col1X + 25, yPos);

      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(100, 100, 100);
      pdf.text('TIPO:', col2X, yPos);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(0, 0, 0);
      pdf.text(machine.type?.name || '-', col2X + 25, yPos);
      yPos += lineHeight;

      // Row 3
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(100, 100, 100);
      pdf.text('MODELLO:', col1X, yPos);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(0, 0, 0);
      pdf.text(machine.model || '-', col1X + 25, yPos);

      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(100, 100, 100);
      pdf.text('ANNO:', col2X, yPos);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(0, 0, 0);
      pdf.text(machine.yearBuilt?.toString() || '-', col2X + 25, yPos);
      yPos += lineHeight + 5;

      // Section 2: Informazioni Acquisto
      pdf.setFillColor(240, 240, 240);
      pdf.rect(margin, yPos - 5, pageWidth - 2 * margin, 8, 'F');
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 0, 0);
      pdf.text('INFORMAZIONI ACQUISTO', margin + 2, yPos);
      yPos += 10;

      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(100, 100, 100);
      pdf.text('DATA ACQUISTO:', col1X, yPos);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(0, 0, 0);
      pdf.text(
        machine.purchaseDate
          ? format(new Date(machine.purchaseDate), 'dd/MM/yyyy', { locale: it })
          : '-',
        col1X + 30,
        yPos,
      );

      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(100, 100, 100);
      pdf.text('RIVENDITORE:', col2X, yPos);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(0, 0, 0);
      pdf.text(machine.dealer || '-', col2X + 30, yPos);
      yPos += lineHeight;

      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(100, 100, 100);
      pdf.text('RIF. FATTURA:', col1X, yPos);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(0, 0, 0);
      pdf.text(machine.invoiceReference || '-', col1X + 30, yPos);

      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(100, 100, 100);
      pdf.text('POSIZIONE DOC.:', col2X, yPos);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(0, 0, 0);
      pdf.text(machine.documentLocation || '-', col2X + 30, yPos);
      yPos += lineHeight + 5;

      // Section 3: QR Code per Manutenzione
      pdf.setFillColor(240, 240, 240);
      pdf.rect(margin, yPos - 5, pageWidth - 2 * margin, 8, 'F');
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 0, 0);
      pdf.text('ACCESSO RAPIDO MANUTENZIONE', margin + 2, yPos);
      yPos += 10;

      // QR Code centered
      const qrSize = 60;
      const qrX = (pageWidth - qrSize) / 2;
      pdf.addImage(qrCodeDataUrl, 'PNG', qrX, yPos, qrSize, qrSize);
      yPos += qrSize + 5;

      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(100, 100, 100);
      pdf.text('Scansiona per registrare manutenzione', pageWidth / 2, yPos, { align: 'center' });
      yPos += 10;

      // Section 4: Statistiche Manutenzione
      if (machine.maintenances && machine.maintenances.length > 0) {
        pdf.setFillColor(240, 240, 240);
        pdf.rect(margin, yPos - 5, pageWidth - 2 * margin, 8, 'F');
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(26, 115, 232);
        pdf.text('STATISTICHE MANUTENZIONE', margin + 2, yPos);
        yPos += 10;

        const totalMaintenances = machine.maintenances.length;
        const lastMaintenance = machine.maintenances[0];

        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(100, 100, 100);
        pdf.text('TOT. MANUTENZIONI:', col1X, yPos);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(0, 0, 0);
        pdf.text(totalMaintenances.toString(), col1X + 40, yPos);

        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(100, 100, 100);
        pdf.text('ULTIMA MANUTENZIONE:', col2X, yPos);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(0, 0, 0);
        pdf.text(
          lastMaintenance
            ? format(new Date(lastMaintenance.date), 'dd/MM/yyyy', { locale: it })
            : '-',
          col2X + 45,
          yPos,
        );
        yPos += lineHeight + 5;
      }

      // Footer
      const footerY = pageHeight - 15;
      pdf.setDrawColor(0, 0, 0);
      pdf.setLineWidth(0.5);
      pdf.line(margin, footerY - 5, pageWidth - margin, footerY - 5);

      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'italic');
      pdf.setTextColor(100, 100, 100);
      pdf.text('CoreMachine', margin, footerY);
      pdf.text(
        `Stampato il ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: it })}`,
        pageWidth - margin,
        footerY,
        { align: 'right' },
      );

      // Create Blob URL for preview
      const pdfBlob = pdf.output('blob');
      const blobUrl = URL.createObjectURL(pdfBlob);
      setPdfPreviewUrl(blobUrl);
      setPdfPreviewOpen(true);
    } catch (error) {
      console.error('Error generating PDF:', error);
      enqueueSnackbar('Errore durante la generazione del PDF', { variant: 'error' });
    }
  };

  const maintenanceColumns: GridColDef[] = [
    {
      field: 'date',
      headerName: 'Data',
      width: 120,
      valueFormatter: value => format(new Date(value), 'dd/MM/yyyy', { locale: it }),
    },
    {
      field: 'type',
      headerName: 'Tipo',
      width: 150,
      renderCell: params => {
        const colors: Record<string, any> = {
          ordinaria: 'success',
          straordinaria: 'info',
          guasto: 'error',
          riparazione: 'warning',
        };
        const labels: Record<string, string> = {
          ordinaria: 'Ordinaria',
          straordinaria: 'Straordinaria',
          guasto: 'Guasto',
          riparazione: 'Riparazione',
        };
        return (
          <Chip
            label={labels[params.value] || params.value}
            color={colors[params.value] || 'default'}
            size="small"
          />
        );
      },
    },
    {
      field: 'workPerformed',
      headerName: 'Lavoro Eseguito',
      flex: 1,
    },
    {
      field: 'cost',
      headerName: 'Costo',
      width: 120,
      valueFormatter: value => (value ? `€${Number(value).toFixed(2)}` : '-'),
    },
    {
      field: 'actions',
      headerName: 'Azioni',
      width: 80,
      sortable: false,
      renderCell: params => (
        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          <IconButton
            size="small"
            onClick={() => router.push(`/maintenances/${params.id}`)}
            title="Visualizza"
            sx={{
              bgcolor: 'black',
              color: 'white',
              borderRadius: '6px',
              '&:hover': { bgcolor: 'grey.800' },
            }}
          >
            <Visibility fontSize="small" />
          </IconButton>
        </Box>
      ),
    },
  ];

  const documentColumns: GridColDef[] = [
    {
      field: 'fileName',
      headerName: 'Nome File',
      flex: 1,
    },
    {
      field: 'documentCategory',
      headerName: 'Categoria',
      width: 180,
      renderCell: params => {
        const categories: Record<string, string> = {
          manuale_uso: "Manuale d'uso",
          certificazione_ce: 'Certificazione CE',
          scheda_tecnica: 'Scheda Tecnica',
          fattura_acquisto: 'Fattura Acquisto',
          altro: 'Altro',
        };
        return <Chip label={categories[params.value] || params.value} size="small" />;
      },
    },
    {
      field: 'fileSize',
      headerName: 'Dimensione',
      width: 120,
      valueFormatter: value => {
        const kb = value / 1024;
        return kb > 1024 ? `${(kb / 1024).toFixed(2)} MB` : `${kb.toFixed(2)} KB`;
      },
    },
    {
      field: 'uploadedAt',
      headerName: 'Caricato il',
      width: 150,
      valueFormatter: value => format(new Date(value), 'dd/MM/yyyy HH:mm', { locale: it }),
    },
    {
      field: 'actions',
      headerName: 'Azioni',
      width: 160,
      sortable: false,
      renderCell: params => (
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', height: '100%' }}>
          <IconButton
            size="small"
            onClick={() => handlePreviewDocument(params.row)}
            title="Anteprima"
            sx={{
              bgcolor: 'black',
              color: 'white',
              borderRadius: '6px',
              '&:hover': { bgcolor: 'grey.800' },
            }}
          >
            <Visibility fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => handleDownloadDocument(params.row)}
            title="Scarica"
            sx={{
              bgcolor: 'black',
              color: 'white',
              borderRadius: '6px',
              '&:hover': { bgcolor: 'grey.800' },
            }}
          >
            <Download fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => handleDeleteDocument(params.id as string)}
            title="Elimina"
            sx={{
              bgcolor: 'black',
              color: 'white',
              borderRadius: '6px',
              '&:hover': { bgcolor: 'grey.800' },
            }}
          >
            <Delete fontSize="small" />
          </IconButton>
        </Box>
      ),
    },
  ];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!machine) {
    return (
      <Box>
        <Typography>Macchinario non trovato</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title={machine.description || `Macchinario ${machine.serialNumber}`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Macchinari', href: '/machines' },
          { label: machine.serialNumber },
        ]}
      />

      {/* Header Card con info principali */}
      <Card elevation={0} sx={{ mb: 3, border: 1, borderColor: 'divider', borderRadius: 1 }}>
        <CardContent sx={{ p: 3 }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={8}>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="h4" fontWeight={700} gutterBottom>
                    {machine.description}
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1 }}>
                    <Chip label={`${machine.manufacturer} ${machine.model}`} variant="outlined" />
                    <Chip
                      label={machine.type?.category?.name || 'N/A'}
                      color="primary"
                      variant="outlined"
                    />
                    <Chip label={machine.type?.name || 'N/A'} variant="outlined" />
                  </Stack>
                </Box>

                <Grid container spacing={2}>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Matricola
                    </Typography>
                    <Typography variant="body1" fontWeight={600}>
                      {machine.serialNumber}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Anno
                    </Typography>
                    <Typography variant="body1" fontWeight={600}>
                      {machine.yearBuilt || '-'}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Data Acquisto
                    </Typography>
                    <Typography variant="body1" fontWeight={600}>
                      {machine.purchaseDate
                        ? format(new Date(machine.purchaseDate), 'dd/MM/yyyy', { locale: it })
                        : '-'}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Rivenditore
                    </Typography>
                    <Typography variant="body1" fontWeight={600}>
                      {machine.dealer || '-'}
                    </Typography>
                  </Grid>
                </Grid>
              </Stack>
            </Grid>

            <Grid item xs={12} md={4}>
              <Stack spacing={1.5}>
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<Build />}
                  onClick={() => router.push(`/maintenances/new?machineId=${params.id}`)}
                  size="large"
                >
                  Nuova Manutenzione
                </Button>
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<Print />}
                  onClick={handlePrintMachineSheet}
                  sx={{
                    bgcolor: 'success.main',
                    '&:hover': { bgcolor: 'success.dark' },
                  }}
                >
                  Stampa Scheda
                </Button>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<QrCode2 />}
                  onClick={handleGenerateQR}
                >
                  Genera QR Code
                </Button>
                {hasRole(['admin', 'tecnico']) && (
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<Edit />}
                    onClick={() => router.push(`/machines/${params.id}/edit`)}
                  >
                    Modifica Scheda
                  </Button>
                )}
              </Stack>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabs Content */}
      <Card elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}>
        <Tabs
          value={tabValue}
          onChange={(_, v) => setTabValue(v)}
          sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
        >
          <Tab label="Dettagli Tecnici" />
          <Tab
            label={`Storico Manutenzioni (${machine.maintenances?.length || 0})`}
            icon={<Build fontSize="small" />}
            iconPosition="start"
          />
          <Tab
            label={`Documenti (${machine.documents?.length || 0})`}
            icon={<Description fontSize="small" />}
            iconPosition="start"
          />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <Box sx={{ p: 3 }}>
            <Grid container spacing={4}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom fontWeight={600}>
                  Informazioni Generali
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <Stack spacing={0.5}>
                  <Typography variant="caption" color="text.secondary">
                    Categoria
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {machine.type?.category?.name || '-'}
                  </Typography>
                </Stack>
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <Stack spacing={0.5}>
                  <Typography variant="caption" color="text.secondary">
                    Tipo Macchinario
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {machine.type?.name || '-'}
                  </Typography>
                </Stack>
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <Stack spacing={0.5}>
                  <Typography variant="caption" color="text.secondary">
                    Numero Seriale
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {machine.serialNumber}
                  </Typography>
                </Stack>
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <Stack spacing={0.5}>
                  <Typography variant="caption" color="text.secondary">
                    Produttore
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {machine.manufacturer || '-'}
                  </Typography>
                </Stack>
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <Stack spacing={0.5}>
                  <Typography variant="caption" color="text.secondary">
                    Modello
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {machine.model || '-'}
                  </Typography>
                </Stack>
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <Stack spacing={0.5}>
                  <Typography variant="caption" color="text.secondary">
                    Anno di Costruzione
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {machine.yearBuilt || '-'}
                  </Typography>
                </Stack>
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <Stack spacing={0.5}>
                  <Typography variant="caption" color="text.secondary">
                    Data di Acquisto
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {machine.purchaseDate
                      ? format(new Date(machine.purchaseDate), 'dd MMMM yyyy', { locale: it })
                      : '-'}
                  </Typography>
                </Stack>
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <Stack spacing={0.5}>
                  <Typography variant="caption" color="text.secondary">
                    Rivenditore
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {machine.dealer || '-'}
                  </Typography>
                </Stack>
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <Stack spacing={0.5}>
                  <Typography variant="caption" color="text.secondary">
                    Riferimento Fattura
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {machine.invoiceReference || '-'}
                  </Typography>
                </Stack>
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <Stack spacing={0.5}>
                  <Typography variant="caption" color="text.secondary">
                    Locazione Documenti
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {machine.documentLocation || '-'}
                  </Typography>
                </Stack>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom fontWeight={600} sx={{ mt: 2 }}>
                  Descrizione
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
                  <Typography variant="body1">
                    {machine.description || 'Nessuna descrizione'}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Box sx={{ p: 2 }}>
            {machine.maintenances && machine.maintenances.length > 0 ? (
              <DataGrid
                rows={machine.maintenances}
                columns={maintenanceColumns}
                autoHeight
                pageSizeOptions={[10, 25, 50]}
                initialState={{
                  pagination: { paginationModel: { pageSize: 10 } },
                  sorting: { sortModel: [{ field: 'date', sort: 'desc' }] },
                }}
                disableRowSelectionOnClick
                sx={{
                  border: 0,
                  '& .MuiDataGrid-cell': { borderColor: 'divider' },
                  '& .MuiDataGrid-columnHeaders': {
                    bgcolor: 'background.default',
                    borderColor: 'divider',
                  },
                }}
              />
            ) : (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Build sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Nessuna manutenzione registrata
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Build />}
                  onClick={() => router.push(`/maintenances/new?machineId=${params.id}`)}
                  sx={{ mt: 2 }}
                >
                  Registra Prima Manutenzione
                </Button>
              </Box>
            )}
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Box sx={{ p: 2 }}>
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                startIcon={<CloudUpload />}
                onClick={() => setUploadDialogOpen(true)}
              >
                Carica Documento
              </Button>
            </Box>

            {machine.documents && machine.documents.length > 0 ? (
              <DataGrid
                rows={machine.documents}
                columns={documentColumns}
                autoHeight
                pageSizeOptions={[10, 25, 50]}
                initialState={{
                  pagination: { paginationModel: { pageSize: 10 } },
                  sorting: { sortModel: [{ field: 'uploadedAt', sort: 'desc' }] },
                }}
                disableRowSelectionOnClick
                sx={{
                  border: 0,
                  '& .MuiDataGrid-cell': { borderColor: 'divider' },
                  '& .MuiDataGrid-columnHeaders': {
                    bgcolor: 'background.default',
                    borderColor: 'divider',
                  },
                }}
              />
            ) : (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Description sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Nessun documento caricato
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Carica manuali, certificazioni, schede tecniche e altri documenti
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<CloudUpload />}
                  onClick={() => setUploadDialogOpen(true)}
                >
                  Carica Primo Documento
                </Button>
              </Box>
            )}
          </Box>
        </TabPanel>
      </Card>

      {/* QR Code Dialog */}
      <Dialog open={qrDialogOpen} onClose={() => setQrDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          QR Code Macchinario
          <IconButton
            onClick={() => setQrDialogOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: 'center', p: 2 }}>
            {qrCodeUrl && <img src={qrCodeUrl} alt="QR Code" style={{ maxWidth: '100%' }} />}
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Scansiona questo QR code per accedere rapidamente alla registrazione manutenzione
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
              {`${window.location.origin}/m/${params.id}`}
            </Typography>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Upload Document Dialog */}
      <Dialog
        open={uploadDialogOpen}
        onClose={() => !uploading && setUploadDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Carica Documento
          <IconButton
            onClick={() => setUploadDialogOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
            disabled={uploading}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <TextField
              select
              label="Categoria Documento"
              value={documentCategory}
              onChange={e => setDocumentCategory(e.target.value)}
              fullWidth
              required
            >
              <MenuItem value="manuale_uso">Manuale d'uso</MenuItem>
              <MenuItem value="certificazione_ce">Certificazione CE</MenuItem>
              <MenuItem value="scheda_tecnica">Scheda Tecnica</MenuItem>
              <MenuItem value="fattura_acquisto">Fattura Acquisto</MenuItem>
              <MenuItem value="altro">Altro</MenuItem>
            </TextField>

            <Box>
              <input
                accept="*/*"
                style={{ display: 'none' }}
                id="file-upload"
                type="file"
                onChange={e => setSelectedFile(e.target.files?.[0] || null)}
              />
              <label htmlFor="file-upload">
                <Button
                  variant="outlined"
                  component="span"
                  fullWidth
                  startIcon={<CloudUpload />}
                  sx={{ py: 2 }}
                >
                  {selectedFile ? selectedFile.name : 'Seleziona File'}
                </Button>
              </label>
              {selectedFile && (
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                  Dimensione: {(selectedFile.size / 1024).toFixed(2)} KB
                </Typography>
              )}
            </Box>

            <Button
              variant="contained"
              onClick={handleFileUpload}
              disabled={!selectedFile || !documentCategory || uploading}
              fullWidth
              size="large"
            >
              {uploading ? 'Caricamento...' : 'Carica Documento'}
            </Button>
          </Stack>
        </DialogContent>
      </Dialog>

      {/* PDF Preview Dialog */}
      <Dialog
        open={pdfPreviewOpen}
        onClose={() => {
          setPdfPreviewOpen(false);
          URL.revokeObjectURL(pdfPreviewUrl);
        }}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            height: '90vh',
            maxHeight: '90vh',
          },
        }}
      >
        <DialogTitle>
          Anteprima Scheda Macchinario
          <IconButton
            onClick={() => {
              setPdfPreviewOpen(false);
              URL.revokeObjectURL(pdfPreviewUrl);
            }}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column' }}>
          {pdfPreviewUrl && (
            <iframe
              src={pdfPreviewUrl}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                flexGrow: 1,
              }}
              title="Anteprima PDF"
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Document Preview Dialog */}
      <Dialog
        open={docPreviewOpen}
        onClose={() => {
          setDocPreviewOpen(false);
          URL.revokeObjectURL(docPreviewUrl);
        }}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            height: '90vh',
            maxHeight: '90vh',
          },
        }}
      >
        <DialogTitle>
          Anteprima Documento: {docPreviewName}
          <IconButton
            onClick={() => {
              setDocPreviewOpen(false);
              URL.revokeObjectURL(docPreviewUrl);
            }}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column' }}>
          {docPreviewUrl && (
            <iframe
              src={docPreviewUrl}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                flexGrow: 1,
              }}
              title="Anteprima Documento"
            />
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
