'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Button, IconButton, Chip, CircularProgress } from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import PageHeader from '@/components/PageHeader';
import Widget from '@/components/Widget';
import axiosInstance from '@/lib/axios';
import { useSnackbar } from 'notistack';
import { ScheduledMaintenance } from '@/types';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

export default function ScheduledMaintenancesPage() {
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const [maintenances, setMaintenances] = useState<ScheduledMaintenance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMaintenances();
  }, []);

  const fetchMaintenances = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/scheduled-maintenances');
      setMaintenances(response.data.data || response.data);
    } catch (error: any) {
      enqueueSnackbar('Errore nel caricamento', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Sei sicuro di voler eliminare questa manutenzione programmata?')) return;
    try {
      await axiosInstance.delete(`/scheduled-maintenances/${id}`);
      enqueueSnackbar('Eliminata con successo', { variant: 'success' });
      fetchMaintenances();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Errore durante l\'eliminazione';
      enqueueSnackbar(errorMessage, { variant: 'error' });
    }
  };

  const columns: GridColDef[] = [
    { field: 'title', headerName: 'Titolo', flex: 1 },
    {
      field: 'machine',
      headerName: 'Macchinario',
      flex: 1,
      valueGetter: (value, row) => row.machine?.serialNumber || '-',
    },
    {
      field: 'frequency',
      headerName: 'Frequenza',
      width: 150,
      valueFormatter: (value) => {
        const freq: Record<string, string> = {
          daily: 'Giornaliera',
          weekly: 'Settimanale',
          monthly: 'Mensile',
          quarterly: 'Trimestrale',
          biannual: 'Semestrale',
          annual: 'Annuale',
        };
        return freq[value] || value;
      },
    },
    {
      field: 'nextDueDate',
      headerName: 'Prossima Scadenza',
      width: 150,
      valueFormatter: (value) => format(new Date(value), 'dd/MM/yyyy', { locale: it }),
    },
    {
      field: 'isActive',
      headerName: 'Stato',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value ? 'Attiva' : 'Inattiva'}
          color={params.value ? 'success' : 'default'}
          size="small"
        />
      ),
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
            onClick={() => router.push(`/scheduled-maintenances/${params.row.id}/edit`)}
            sx={{
              bgcolor: 'black',
              color: 'white',
              borderRadius: '6px',
              '&:hover': { bgcolor: 'grey.800' },
            }}
          >
            <Edit fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => handleDelete(params.row.id)}
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
        title="Manutenzioni Programmate"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Manutenzioni Programmate' },
        ]}
        renderRight={
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => router.push('/scheduled-maintenances/new')}
          >
            Aggiungi
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
            rows={maintenances}
            columns={columns}
            autoHeight
            pageSizeOptions={[10, 25]}
            initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
            disableRowSelectionOnClick
            sx={{ border: 0 }}
          />
        )}
      </Widget>
    </Box>
  );
}
