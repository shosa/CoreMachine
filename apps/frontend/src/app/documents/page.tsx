'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Paper,
  Button,
  Card,
  TextField,
  Chip,
  IconButton,
  Stack,
  InputAdornment,
} from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import DownloadIcon from '@mui/icons-material/Download';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteIcon from '@mui/icons-material/Delete';
import FilterListIcon from '@mui/icons-material/FilterList';
import { PageHeader } from '@/components/PageHeader';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/axios';
import { enqueueSnackbar } from 'notistack';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

interface Document {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  documentCategory: string;
  uploadedAt: string;
  machine: {
    id: string;
    model: string;
    manufacturer: string;
    serialNumber: string;
  };
  uploadedBy: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

const categoryLabels: Record<string, string> = {
  manuale_uso: 'Manuale d\'uso',
  certificazione_ce: 'Certificazione CE',
  scheda_tecnica: 'Scheda Tecnica',
  fattura_acquisto: 'Fattura d\'acquisto',
  altro: 'Altro',
};

export default function DocumentsPage() {
  const router = useRouter();
  const { hasRole } = useAuthStore();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const response = await api.get('/documents');
      setDocuments(response.data);
    } catch (error) {
      enqueueSnackbar('Errore nel caricamento dei documenti', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (id: string) => {
    try {
      const response = await api.get(`/documents/${id}/download-url`);
      window.open(response.data.url, '_blank');
    } catch (error) {
      enqueueSnackbar('Errore nel download del documento', { variant: 'error' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo documento?')) return;

    try {
      await api.delete(`/documents/${id}`);
      enqueueSnackbar('Documento eliminato con successo', { variant: 'success' });
      fetchDocuments();
    } catch (error) {
      enqueueSnackbar('Errore nell\'eliminazione del documento', { variant: 'error' });
    }
  };

  const filteredDocuments = documents.filter(doc =>
    doc.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.machine.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.machine.manufacturer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns: GridColDef[] = [
    {
      field: 'fileName',
      headerName: 'Nome File',
      flex: 1,
      minWidth: 200,
    },
    {
      field: 'machine',
      headerName: 'Macchina',
      flex: 1,
      minWidth: 180,
      valueGetter: (params) => `${params.row.machine.manufacturer} ${params.row.machine.model}`,
    },
    {
      field: 'documentCategory',
      headerName: 'Categoria',
      width: 160,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={categoryLabels[params.value] || params.value}
          color="primary"
          variant="outlined"
          size="small"
        />
      ),
    },
    {
      field: 'fileSize',
      headerName: 'Dimensione',
      width: 120,
      valueFormatter: (params) => {
        const mb = params.value / (1024 * 1024);
        return mb > 1 ? `${mb.toFixed(2)} MB` : `${(params.value / 1024).toFixed(2)} KB`;
      },
    },
    {
      field: 'uploadedAt',
      headerName: 'Caricato il',
      width: 130,
      valueFormatter: (params) => format(new Date(params.value), 'dd/MM/yyyy', { locale: it }),
    },
    {
      field: 'uploadedBy',
      headerName: 'Caricato da',
      width: 150,
      valueGetter: (params) => `${params.row.uploadedBy.firstName} ${params.row.uploadedBy.lastName}`,
    },
    {
      field: 'actions',
      headerName: 'Azioni',
      width: 140,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Stack direction="row" spacing={0.5}>
          <IconButton
            size="small"
            onClick={() => handleDownload(params.row.id)}
            sx={{ color: 'primary.main' }}
          >
            <DownloadIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => router.push(`/documents/${params.row.id}`)}
            sx={{ color: 'secondary.main' }}
          >
            <VisibilityIcon fontSize="small" />
          </IconButton>
          {hasRole(['admin']) && (
            <IconButton
              size="small"
              onClick={() => handleDelete(params.row.id)}
              sx={{ color: 'error.main' }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          )}
        </Stack>
      ),
    },
  ];

  return (
    <DashboardLayout>
      <Container maxWidth="lg">
        <PageHeader
        title="Documenti"
        breadcrumbs={['Documenti']}
        renderRight={
          hasRole(['admin', 'tecnico']) ? (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => router.push('/documents/new')}
              sx={{ borderRadius: 1 }}
            >
              Carica Documento
            </Button>
          ) : undefined
        }
      />

      {/* Search */}
      <Card elevation={2} sx={{ mb: 3, p: 3, borderRadius: 1 }}>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
          <FilterListIcon sx={{ color: 'primary.main' }} />
        </Stack>
          <TextField
            fullWidth
            placeholder="Cerca documenti..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 1,
              },
            }}
          />
        </Card>

      {/* DataGrid */}
      <Paper sx={{ borderRadius: 1, overflow: 'hidden' }}>
        <DataGrid
          rows={filteredDocuments}
          columns={columns}
          loading={loading}
          autoHeight
          disableRowSelectionOnClick
          initialState={{
            pagination: { paginationModel: { pageSize: 10 } },
            sorting: { sortModel: [{ field: 'uploadedAt', sort: 'desc' }] },
          }}
          pageSizeOptions={[10, 25, 50]}
          sx={{ border: 'none' }}
        />
      </Paper>
      </Container>
    </DashboardLayout>
  );
}
