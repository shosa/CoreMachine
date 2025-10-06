'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Button, IconButton, TextField, CircularProgress } from '@mui/material';
import { Add, Visibility, Edit, Delete, Search } from '@mui/icons-material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import PageHeader from '@/components/PageHeader';
import Widget from '@/components/Widget';
import axiosInstance from '@/lib/axios';
import { useSnackbar } from 'notistack';
import { Machine } from '@/types';
import { useAuthStore } from '@/store/authStore';

export default function MachinesPage() {
  const router = useRouter();
  const { hasRole } = useAuthStore();
  const { enqueueSnackbar } = useSnackbar();
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchMachines();
  }, []);

  const fetchMachines = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/machines');
      setMachines(response.data.data || response.data);
    } catch (error: any) {
      enqueueSnackbar('Errore nel caricamento dei macchinari', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Sei sicuro di voler eliminare questo macchinario?')) return;

    try {
      await axiosInstance.delete(`/machines/${id}`);
      enqueueSnackbar('Macchinario eliminato con successo', { variant: 'success' });
      fetchMachines();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Errore durante l\'eliminazione';

      if (error.response?.status === 400 || errorMessage.includes('vincoli') || errorMessage.includes('foreign key')) {
        enqueueSnackbar('Impossibile eliminare: il macchinario ha documenti o manutenzioni associate', {
          variant: 'error',
          autoHideDuration: 5000,
        });
      } else {
        enqueueSnackbar(errorMessage, { variant: 'error' });
      }
    }
  };

  const filteredMachines = machines.filter((machine) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      machine.serialNumber?.toLowerCase().includes(searchLower) ||
      machine.manufacturer?.toLowerCase().includes(searchLower) ||
      machine.model?.toLowerCase().includes(searchLower) ||
      machine.type?.name?.toLowerCase().includes(searchLower)
    );
  });

  const columns: GridColDef[] = [
    {
      field: 'serialNumber',
      headerName: 'Numero Seriale',
      flex: 1,
      minWidth: 150,
    },
    {
      field: 'type',
      headerName: 'Tipo',
      flex: 1,
      minWidth: 150,
      valueGetter: (value, row) => row.type?.name || '-',
    },
    {
      field: 'manufacturer',
      headerName: 'Produttore',
      flex: 1,
      minWidth: 150,
    },
    {
      field: 'model',
      headerName: 'Modello',
      flex: 1,
      minWidth: 150,
    },
    {
      field: 'yearBuilt',
      headerName: 'Anno',
      width: 100,
    },
    {
      field: 'actions',
      headerName: 'Azioni',
      width: 150,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', height: '100%' }}>
          <IconButton
            size="small"
            onClick={() => router.push(`/machines/${params.row.id}`)}
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
          {hasRole(['admin', 'tecnico']) && (
            <IconButton
              size="small"
              onClick={() => router.push(`/machines/${params.row.id}/edit`)}
              title="Modifica"
              sx={{
                bgcolor: 'black',
                color: 'white',
                borderRadius: '6px',
                '&:hover': { bgcolor: 'grey.800' },
              }}
            >
              <Edit fontSize="small" />
            </IconButton>
          )}
          {hasRole('admin') && (
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
          )}
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Macchinari"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Macchinari' },
        ]}
        renderRight={
          hasRole('admin') && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => router.push('/machines/new')}
            >
              Aggiungi Macchinario
            </Button>
          )
        }
      />

      <Widget>
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            placeholder="Cerca per numero seriale, produttore, modello o tipo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
            }}
          />
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <DataGrid
            rows={filteredMachines}
            columns={columns}
            autoHeight
            pageSizeOptions={[10, 25, 50]}
            initialState={{
              pagination: { paginationModel: { pageSize: 10 } },
            }}
            disableRowSelectionOnClick
            sx={{
              border: 0,
              '& .MuiDataGrid-cell': {
                borderBottom: '1px solid',
                borderColor: 'divider',
              },
            }}
          />
        )}
      </Widget>
    </Box>
  );
}
