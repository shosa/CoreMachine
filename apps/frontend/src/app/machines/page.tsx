'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Paper,
  Button,
  Card,
  TextField,
  MenuItem,
  Grid,
  Chip,
  IconButton,
  Stack,
  InputAdornment,
} from '@mui/material';
import {
  DataGrid,
  GridColDef,
  GridRenderCellParams,
} from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import QrCodeIcon from '@mui/icons-material/QrCode';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import FilterListIcon from '@mui/icons-material/FilterList';
import { PageHeader } from '@/components/PageHeader';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/axios';
import { enqueueSnackbar } from 'notistack';

interface Machine {
  id: string;
  model: string;
  manufacturer: string;
  serialNumber: string;
  installationDate: string;
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

interface Category {
  id: string;
  name: string;
}

interface Type {
  id: string;
  name: string;
  categoryId: string;
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

export default function MachinesPage() {
  const router = useRouter();
  const { hasRole } = useAuthStore();
  const [machines, setMachines] = useState<Machine[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [types, setTypes] = useState<Type[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [machinesRes, categoriesRes, typesRes] = await Promise.all([
        api.get('/machines'),
        api.get('/categories'),
        api.get('/types'),
      ]);
      setMachines(machinesRes.data);
      setCategories(categoriesRes.data);
      setTypes(typesRes.data);
    } catch (error) {
      enqueueSnackbar('Errore nel caricamento dei dati', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleViewQRCode = async (id: string) => {
    try {
      const response = await api.get(`/machines/${id}/qrcode`);
      const qrCode = response.data.qrCode;

      // Open QR code in new window
      const win = window.open('', '_blank');
      if (win) {
        win.document.write(`
          <html>
            <head><title>QR Code - Macchina</title></head>
            <body style="display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f5f5f5;">
              <div style="text-align: center; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <h2 style="margin: 0 0 20px 0; color: #333;">QR Code Macchina</h2>
                <img src="${qrCode}" alt="QR Code" style="max-width: 300px;" />
                <p style="margin: 20px 0 0 0; color: #666;">Scansiona per accedere alla manutenzione</p>
              </div>
            </body>
          </html>
        `);
      }
    } catch (error) {
      enqueueSnackbar('Errore nel caricamento del QR Code', { variant: 'error' });
    }
  };

  const filteredMachines = machines.filter(machine => {
    const matchesSearch =
      machine.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      machine.manufacturer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      machine.serialNumber.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = !selectedCategory || machine.type.category.id === selectedCategory;
    const matchesType = !selectedType || machine.type.id === selectedType;
    const matchesStatus = !selectedStatus || machine.status === selectedStatus;

    return matchesSearch && matchesCategory && matchesType && matchesStatus;
  });

  const filteredTypes = selectedCategory
    ? types.filter(type => type.categoryId === selectedCategory)
    : types;

  const columns: GridColDef[] = [
    
    {
      field: 'manufacturer',
      headerName: 'Produttore',
      flex: 1,
      minWidth: 120,
    },
    {
      field: 'model',
      headerName: 'Modello',
      flex: 1,
      minWidth: 120,
    },
    {
      field: 'serialNumber',
      headerName: 'Numero Seriale',
      flex: 1,
      minWidth: 130,
    },
    {
      field: 'category',
      headerName: 'Categoria',
      flex: 1,
      minWidth: 120,
      valueGetter: (params) => params.row.type.category.name,
    },
    {
      field: 'type',
      headerName: 'Tipo',
      flex: 1,
      minWidth: 120,
      valueGetter: (params) => params.row.type.name,
    },
    {
      field: 'status',
      headerName: 'Stato',
      width: 140,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={statusLabels[params.value as keyof typeof statusLabels]}
          color={statusColors[params.value as keyof typeof statusColors]}
          size="small"
          sx={{ fontWeight: 600 }}
        />
      ),
    },
    {
      field: 'location',
      headerName: 'Ubicazione',
      flex: 1,
      minWidth: 120,
    },
    {
      field: 'actions',
      headerName: 'Azioni',
      width: 150,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Stack direction="row" spacing={0.5}>
          <IconButton
            size="small"
            onClick={() => router.push(`/machines/${params.row.id}`)}
            sx={{ color: 'primary.main' }}
          >
            <VisibilityIcon fontSize="small" />
          </IconButton>
          {hasRole(['admin', 'tecnico']) && (
            <IconButton
              size="small"
              onClick={() => router.push(`/machines/${params.row.id}/edit`)}
              sx={{ color: 'secondary.main' }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          )}
          <IconButton
            size="small"
            onClick={() => handleViewQRCode(params.row.id)}
            sx={{ color: 'success.main' }}
          >
            <QrCodeIcon fontSize="small" />
          </IconButton>
        </Stack>
      ),
    },
  ];

  return (
    <DashboardLayout>
      <Container maxWidth="lg">
        <PageHeader
        title="Macchinari"
        breadcrumbs={['Inventory', 'Macchinari']}
        renderRight={
          hasRole(['admin', 'tecnico']) ? (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => router.push('/machines/new')}
              sx={{ borderRadius: 1 }}
            >
              Nuova Macchina
            </Button>
          ) : undefined
        }
      />

      {/* Filters Card */}
      <Card elevation={2} sx={{ mb: 3, p: 3, borderRadius: 1 }}>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
          <FilterListIcon sx={{ color: 'primary.main' }} />
        </Stack>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              placeholder="Cerca macchinari..."
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
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              select
              label="Categoria"
              value={selectedCategory}
              onChange={e => {
                setSelectedCategory(e.target.value);
                setSelectedType('');
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1,
                },
              }}
            >
              <MenuItem value="">Tutte le categorie</MenuItem>
              {categories.map(category => (
                <MenuItem key={category.id} value={category.id}>
                  {category.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              select
              label="Tipo"
              value={selectedType}
              onChange={e => setSelectedType(e.target.value)}
              disabled={!selectedCategory}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1,
                },
              }}
            >
              <MenuItem value="">Tutti i tipi</MenuItem>
              {filteredTypes.map(type => (
                <MenuItem key={type.id} value={type.id}>
                  {type.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              select
              label="Stato"
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1,
                },
              }}
            >
              <MenuItem value="">Tutti gli stati</MenuItem>
              <MenuItem value="operativa">Operativa</MenuItem>
              <MenuItem value="manutenzione">Manutenzione</MenuItem>
              <MenuItem value="fuori_servizio">Fuori Servizio</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </Card>

      {/* DataGrid */}
      <Paper sx={{ borderRadius: 1, overflow: 'hidden' }}>
        <DataGrid
          rows={filteredMachines}
          columns={columns}
          loading={loading}
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
      </Container>
    </DashboardLayout>
  );
}
