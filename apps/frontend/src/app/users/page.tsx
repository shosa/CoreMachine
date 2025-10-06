'use client';

import { useEffect, useState } from 'react';
import {
  Container,
  Paper,
  Button,
  Card,
  Chip,
  IconButton,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
} from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { PageHeader } from '@/components/PageHeader';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import api from '@/lib/axios';
import { enqueueSnackbar } from 'notistack';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'tecnico' | 'utente';
  isActive: boolean;
}

const roleColors = {
  admin: 'error',
  tecnico: 'warning',
  utente: 'info',
} as const;

const roleLabels = {
  admin: 'Amministratore',
  tecnico: 'Tecnico',
  utente: 'Utente',
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    password: '',
    role: 'utente' as 'admin' | 'tecnico' | 'utente',
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data);
    } catch (error) {
      enqueueSnackbar('Errore nel caricamento degli utenti', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        password: '',
        role: user.role,
      });
    } else {
      setEditingUser(null);
      setFormData({
        email: '',
        firstName: '',
        lastName: '',
        password: '',
        role: 'utente',
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingUser(null);
  };

  const handleSubmit = async () => {
    try {
      const payload = editingUser
        ? formData.password
          ? formData
          : { ...formData, password: undefined }
        : formData;

      if (editingUser) {
        await api.patch(`/users/${editingUser.id}`, payload);
        enqueueSnackbar('Utente aggiornato con successo', { variant: 'success' });
      } else {
        await api.post('/users', payload);
        enqueueSnackbar('Utente creato con successo', { variant: 'success' });
      }
      handleClose();
      fetchUsers();
    } catch (error) {
      enqueueSnackbar('Errore nel salvataggio dell\'utente', { variant: 'error' });
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      await api.patch(`/users/${id}`, { isActive: !isActive });
      enqueueSnackbar(`Utente ${!isActive ? 'attivato' : 'disattivato'} con successo`, { variant: 'success' });
      fetchUsers();
    } catch (error) {
      enqueueSnackbar('Errore nell\'aggiornamento dell\'utente', { variant: 'error' });
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'firstName',
      headerName: 'Nome',
      flex: 1,
      minWidth: 130,
    },
    {
      field: 'lastName',
      headerName: 'Cognome',
      flex: 1,
      minWidth: 130,
    },
    {
      field: 'email',
      headerName: 'Email',
      flex: 1,
      minWidth: 200,
    },
    {
      field: 'role',
      headerName: 'Ruolo',
      width: 150,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={roleLabels[params.value as keyof typeof roleLabels]}
          color={roleColors[params.value as keyof typeof roleColors]}
          size="small"
          sx={{ fontWeight: 600 }}
        />
      ),
    },
    {
      field: 'isActive',
      headerName: 'Stato',
      width: 110,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={params.value ? 'Attivo' : 'Disabilitato'}
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
      renderCell: (params: GridRenderCellParams) => (
        <Stack direction="row" spacing={0.5}>
          <IconButton
            size="small"
            onClick={() => handleOpen(params.row)}
            sx={{ color: 'secondary.main' }}
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => handleToggleActive(params.row.id, params.row.isActive)}
            sx={{ color: params.row.isActive ? 'error.main' : 'success.main' }}
          >
            {params.row.isActive ? <BlockIcon fontSize="small" /> : <CheckCircleIcon fontSize="small" />}
          </IconButton>
        </Stack>
      ),
    },
  ];

  return (
    <DashboardLayout>
      <Container maxWidth="lg">
        <PageHeader
        title="Utenti"
        breadcrumbs={['Utenti']}
        renderRight={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpen()}
            sx={{ borderRadius: 1 }}
          >
            Nuovo Utente
          </Button>
        }
      />

      {/* DataGrid */}
      <Paper sx={{ borderRadius: 1, overflow: 'hidden' }}>
        <DataGrid
          rows={users}
          columns={columns}
          loading={loading}
          autoHeight
          disableRowSelectionOnClick
          initialState={{
            pagination: { paginationModel: { pageSize: 10 } },
          }}
          pageSizeOptions={[10, 25, 50]}
          sx={{ border: 'none' }}
        />
      </Paper>

        {/* Dialog */}
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
          <DialogTitle>
            {editingUser ? 'Modifica Utente' : 'Nuovo Utente'}
          </DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 2 }}>
              <TextField
                fullWidth
                label="Nome"
                value={formData.firstName}
                onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                required
              />
              <TextField
                fullWidth
                label="Cognome"
                value={formData.lastName}
                onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                required
              />
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                required
              />
              <TextField
                fullWidth
                label={editingUser ? 'Nuova Password (lascia vuoto per non modificare)' : 'Password'}
                type="password"
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
                required={!editingUser}
              />
              <TextField
                fullWidth
                select
                label="Ruolo"
                value={formData.role}
                onChange={e => setFormData({ ...formData, role: e.target.value as any })}
              >
                <MenuItem value="utente">Utente</MenuItem>
                <MenuItem value="tecnico">Tecnico</MenuItem>
                <MenuItem value="admin">Amministratore</MenuItem>
              </TextField>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Annulla</Button>
            <Button onClick={handleSubmit} variant="contained">
              Salva
            </Button>
          </DialogActions>
      </Dialog>
      </Container>
    </DashboardLayout>
  );
}
