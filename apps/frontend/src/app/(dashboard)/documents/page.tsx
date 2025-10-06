'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Button, IconButton, CircularProgress } from '@mui/material';
import { Add, Delete, Download } from '@mui/icons-material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import PageHeader from '@/components/PageHeader';
import Widget from '@/components/Widget';
import axiosInstance from '@/lib/axios';
import { useSnackbar } from 'notistack';
import { Document } from '@/types';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

export default function DocumentsPage() {
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/documents');
      setDocuments(response.data.data || response.data);
    } catch (error: any) {
      enqueueSnackbar('Errore nel caricamento dei documenti', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Sei sicuro di voler eliminare questo documento?')) return;
    try {
      await axiosInstance.delete(`/documents/${id}`);
      enqueueSnackbar('Documento eliminato', { variant: 'success' });
      fetchDocuments();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Errore durante l\'eliminazione';
      enqueueSnackbar(errorMessage, { variant: 'error' });
    }
  };

  const columns: GridColDef[] = [
    { field: 'fileName', headerName: 'Nome File', flex: 1 },
    {
      field: 'machine',
      headerName: 'Macchinario',
      flex: 1,
      valueGetter: (value, row) => row.machine?.serialNumber || '-',
    },
    {
      field: 'documentCategory',
      headerName: 'Categoria',
      width: 180,
      valueFormatter: (value) => {
        const categories: Record<string, string> = {
          manuale_uso: 'Manuale d\'uso',
          certificazione_ce: 'Certificazione CE',
          scheda_tecnica: 'Scheda Tecnica',
          fattura_acquisto: 'Fattura Acquisto',
          altro: 'Altro',
        };
        return categories[value] || value;
      },
    },
    {
      field: 'fileSize',
      headerName: 'Dimensione',
      width: 120,
      valueFormatter: (value) => {
        const kb = value / 1024;
        return kb > 1024 ? `${(kb / 1024).toFixed(2)} MB` : `${kb.toFixed(2)} KB`;
      },
    },
    {
      field: 'uploadedAt',
      headerName: 'Caricato il',
      width: 150,
      valueFormatter: (value) => format(new Date(value), 'dd/MM/yyyy', { locale: it }),
    },
    {
      field: 'actions',
      headerName: 'Azioni',
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', height: '100%' }}>
          <IconButton
            size="small"
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
            onClick={() => handleDelete(params.row.id)}
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

  return (
    <Box>
      <PageHeader
        title="Documenti"
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Documenti' }]}
        renderRight={
          <Button variant="contained" startIcon={<Add />} onClick={() => router.push('/documents/new')}>
            Carica Documento
          </Button>
        }
      />

      <Widget>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <DataGrid
            rows={documents}
            columns={columns}
            autoHeight
            pageSizeOptions={[10, 25, 50]}
            initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
            disableRowSelectionOnClick
            sx={{ border: 0 }}
          />
        )}
      </Widget>
    </Box>
  );
}
