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
import { User } from '@/types';

export default function UsersPage() {
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/users');
      setUsers(response.data.data || response.data);
    } catch (error: any) {
      enqueueSnackbar('Errore nel caricamento degli utenti', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Sei sicuro di voler eliminare questo utente?')) return;
    try {
      await axiosInstance.delete(`/users/${id}`);
      enqueueSnackbar('Utente eliminato', { variant: 'success' });
      fetchUsers();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Errore durante l\'eliminazione';

      if (error.response?.status === 400 || errorMessage.includes('vincoli') || errorMessage.includes('foreign key')) {
        enqueueSnackbar('Impossibile eliminare: l\'utente ha operazioni o documenti associati', {
          variant: 'error',
          autoHideDuration: 5000,
        });
      } else {
        enqueueSnackbar(errorMessage, { variant: 'error' });
      }
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'fullName',
      headerName: 'Nome Completo',
      flex: 1,
      valueGetter: (value, row) => `${row.firstName} ${row.lastName}`,
    },
    { field: 'email', headerName: 'Email', flex: 1 },
    {
      field: 'role',
      headerName: 'Ruolo',
      width: 150,
      renderCell: (params) => {
        const roleColors: Record<string, 'primary' | 'success' | 'default'> = {
          admin: 'primary',
          tecnico: 'success',
          utente: 'default',
        };
        return <Chip label={params.value} color={roleColors[params.value]} size="small" />;
      },
    },
    {
      field: 'isActive',
      headerName: 'Stato',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value ? 'Attivo' : 'Inattivo'}
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
            onClick={() => router.push(`/users/${params.row.id}/edit`)}
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
        title="Utenti"
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Utenti' }]}
        renderRight={
          <Button variant="contained" startIcon={<Add />} onClick={() => router.push('/users/new')}>
            Aggiungi Utente
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
            rows={users}
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
