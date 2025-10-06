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
import { Maintenance } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

export default function MaintenancesPage() {
  const router = useRouter();
  const { hasRole } = useAuthStore();
  const { enqueueSnackbar } = useSnackbar();
  const [maintenances, setMaintenances] = useState<Maintenance[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchMaintenances();
  }, []);

  const fetchMaintenances = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/maintenances');
      setMaintenances(response.data.data || response.data);
    } catch (error: any) {
      enqueueSnackbar('Errore nel caricamento delle manutenzioni', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Sei sicuro di voler eliminare questa manutenzione?')) return;

    try {
      await axiosInstance.delete(`/maintenances/${id}`);
      enqueueSnackbar('Manutenzione eliminata con successo', { variant: 'success' });
      fetchMaintenances();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Errore durante l\'eliminazione';
      enqueueSnackbar(errorMessage, { variant: 'error' });
    }
  };

  const filteredMaintenances = maintenances.filter((maintenance) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      maintenance.machine?.serialNumber?.toLowerCase().includes(searchLower) ||
      maintenance.workPerformed?.toLowerCase().includes(searchLower) ||
      maintenance.type?.toLowerCase().includes(searchLower)
    );
  });

  const columns: GridColDef[] = [
    {
      field: 'date',
      headerName: 'Data',
      width: 120,
      valueFormatter: (value) => format(new Date(value), 'dd/MM/yyyy', { locale: it }),
    },
    {
      field: 'machine',
      headerName: 'Macchinario',
      flex: 1,
      minWidth: 150,
      valueGetter: (value, row) => row.machine?.serialNumber || '-',
    },
    {
      field: 'type',
      headerName: 'Tipo',
      width: 150,
      valueFormatter: (value) => {
        const types: Record<string, string> = {
          ordinaria: 'Ordinaria',
          straordinaria: 'Straordinaria',
          guasto: 'Guasto',
          riparazione: 'Riparazione',
        };
        return types[value] || value;
      },
    },
    {
      field: 'operator',
      headerName: 'Operatore',
      flex: 1,
      minWidth: 150,
      valueGetter: (value, row) =>
        row.operator ? `${row.operator.firstName} ${row.operator.lastName}` : '-',
    },
    {
      field: 'workPerformed',
      headerName: 'Lavoro Eseguito',
      flex: 1,
      minWidth: 200,
    },
    {
      field: 'cost',
      headerName: 'Costo',
      width: 120,
      valueFormatter: (value) => (value ? `€${Number(value).toFixed(2)}` : '-'),
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
            onClick={() => router.push(`/maintenances/${params.row.id}`)}
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
              onClick={() => router.push(`/maintenances/${params.row.id}/edit`)}
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
        title="Manutenzioni"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Manutenzioni' },
        ]}
        renderRight={
          hasRole(['admin', 'tecnico']) && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => router.push('/maintenances/new')}
            >
              Aggiungi Manutenzione
            </Button>
          )
        }
      />

      <Widget>
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            placeholder="Cerca per macchinario, tipo o descrizione..."
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
            rows={filteredMaintenances}
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
