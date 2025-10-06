'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Paper,
  Button,
  Card,
  TextField,
  IconButton,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { PageHeader } from '@/components/PageHeader';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import api from '@/lib/axios';
import { enqueueSnackbar } from 'notistack';

interface Category {
  id: string;
  name: string;
  description?: string;
  _count?: {
    types: number;
  };
}

export default function CategoriesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data);
    } catch (error) {
      enqueueSnackbar('Errore nel caricamento delle categorie', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setFormData({ name: category.name, description: category.description || '' });
    } else {
      setEditingCategory(null);
      setFormData({ name: '', description: '' });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingCategory(null);
    setFormData({ name: '', description: '' });
  };

  const handleSubmit = async () => {
    try {
      if (editingCategory) {
        await api.patch(`/categories/${editingCategory.id}`, formData);
        enqueueSnackbar('Categoria aggiornata con successo', { variant: 'success' });
      } else {
        await api.post('/categories', formData);
        enqueueSnackbar('Categoria creata con successo', { variant: 'success' });
      }
      handleClose();
      fetchCategories();
    } catch (error) {
      enqueueSnackbar('Errore nel salvataggio della categoria', { variant: 'error' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Sei sicuro di voler eliminare questa categoria?')) return;

    try {
      await api.delete(`/categories/${id}`);
      enqueueSnackbar('Categoria eliminata con successo', { variant: 'success' });
      fetchCategories();
    } catch (error) {
      enqueueSnackbar('Errore nell\'eliminazione della categoria', { variant: 'error' });
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'name',
      headerName: 'Nome',
      flex: 1,
      minWidth: 200,
    },
    {
      field: 'description',
      headerName: 'Descrizione',
      flex: 2,
      minWidth: 300,
    },
    {
      field: '_count',
      headerName: 'N. Tipologie',
      width: 130,
      valueGetter: (params) => params.row._count?.types || 0,
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
            onClick={() => handleDelete(params.row.id)}
            sx={{ color: 'error.main' }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Stack>
      ),
    },
  ];

  return (
    <DashboardLayout>
      <Container maxWidth="lg">
        <PageHeader
        title="Categorie"
        breadcrumbs={['Categorie']}
        renderRight={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpen()}
            sx={{ borderRadius: 1 }}
          >
            Nuova Categoria
          </Button>
        }
      />

      {/* DataGrid */}
      <Paper sx={{ borderRadius: 1, overflow: 'hidden' }}>
        <DataGrid
          rows={categories}
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
            {editingCategory ? 'Modifica Categoria' : 'Nuova Categoria'}
          </DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 2 }}>
              <TextField
                fullWidth
                label="Nome"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                required
              />
              <TextField
                fullWidth
                label="Descrizione"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                multiline
                rows={3}
              />
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
