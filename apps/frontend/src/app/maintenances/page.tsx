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
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import FilterListIcon from '@mui/icons-material/FilterList';
import { PageHeader } from '@/components/PageHeader';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/axios';
import { enqueueSnackbar } from 'notistack';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

interface Maintenance {
  id: string;
  date: string;
  type: 'ordinaria' | 'straordinaria' | 'guasto' | 'riparazione';
  problemDescription?: string;
  workPerformed: string;
  spareParts?: string;
  cost?: number;
  machine: {
    id: string;
    model: string;
    manufacturer: string;
    serialNumber: string;
  };
  operator: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

const typeColors = {
  ordinaria: 'info',
  straordinaria: 'warning',
  guasto: 'error',
  riparazione: 'secondary',
} as const;

const typeLabels = {
  ordinaria: 'Ordinaria',
  straordinaria: 'Straordinaria',
  guasto: 'Guasto',
  riparazione: 'Riparazione',
};

export default function MaintenancesPage() {
  const router = useRouter();
  const { hasRole } = useAuthStore();
  const [maintenances, setMaintenances] = useState<Maintenance[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');

  useEffect(() => {
    fetchMaintenances();
  }, []);

  const fetchMaintenances = async () => {
    try {
      const response = await api.get('/maintenances');
      setMaintenances(response.data);
    } catch (error) {
      enqueueSnackbar('Errore nel caricamento delle manutenzioni', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const filteredMaintenances = maintenances.filter(maintenance => {
    const matchesSearch =
      maintenance.machine.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      maintenance.machine.manufacturer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      maintenance.machine.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      maintenance.workPerformed.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = !selectedType || maintenance.type === selectedType;

    return matchesSearch && matchesType;
  });

  const columns: GridColDef[] = [
    {
      field: 'date',
      headerName: 'Data',
      width: 130,
      valueFormatter: (params) => format(new Date(params.value), 'dd/MM/yyyy', { locale: it }),
    },
    {
      field: 'machine',
      headerName: 'Macchina',
      flex: 1,
      minWidth: 200,
      valueGetter: (params) => `${params.row.machine.manufacturer} ${params.row.machine.model}`,
    },
    {
      field: 'serialNumber',
      headerName: 'Matricola',
      width: 140,
      valueGetter: (params) => params.row.machine.serialNumber,
    },
    {
      field: 'type',
      headerName: 'Tipo',
      width: 140,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={typeLabels[params.value as keyof typeof typeLabels]}
          color={typeColors[params.value as keyof typeof typeColors]}
          size="small"
          sx={{ fontWeight: 600 }}
        />
      ),
    },
    {
      field: 'workPerformed',
      headerName: 'Lavoro Eseguito',
      flex: 1,
      minWidth: 200,
    },
    {
      field: 'operator',
      headerName: 'Operatore',
      width: 160,
      valueGetter: (params) => `${params.row.operator.firstName} ${params.row.operator.lastName}`,
    },
    {
      field: 'cost',
      headerName: 'Costo',
      width: 110,
      valueFormatter: (params) => params.value ? `€ ${Number(params.value).toFixed(2)}` : '-',
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
            onClick={() => router.push(`/maintenances/${params.row.id}`)}
            sx={{ color: 'primary.main' }}
          >
            <VisibilityIcon fontSize="small" />
          </IconButton>
          {hasRole(['admin', 'tecnico']) && (
            <IconButton
              size="small"
              onClick={() => router.push(`/maintenances/${params.row.id}/edit`)}
              sx={{ color: 'secondary.main' }}
            >
              <EditIcon fontSize="small" />
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
        title="Manutenzioni"
        breadcrumbs={['Maintenances', 'Manutenzioni']}
        renderRight={
          hasRole(['admin', 'tecnico']) ? (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => router.push('/maintenances/new')}
              sx={{ borderRadius: 1 }}
            >
              Nuova Manutenzione
            </Button>
          ) : undefined
        }
      />

      {/* Filters */}
      <Card elevation={2} sx={{ mb: 3, p: 3, borderRadius: 1 }}>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
          <FilterListIcon sx={{ color: 'primary.main' }} />
        </Stack>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                placeholder="Cerca manutenzioni..."
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
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                select
                label="Tipo Manutenzione"
                value={selectedType}
                onChange={e => setSelectedType(e.target.value)}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1,
                  },
                }}
              >
                <MenuItem value="">Tutti i tipi</MenuItem>
                <MenuItem value="ordinaria">Ordinaria</MenuItem>
                <MenuItem value="straordinaria">Straordinaria</MenuItem>
                <MenuItem value="guasto">Guasto</MenuItem>
                <MenuItem value="riparazione">Riparazione</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </Card>

      {/* DataGrid */}
      <Paper sx={{ borderRadius: 1, overflow: 'hidden' }}>
        <DataGrid
          rows={filteredMaintenances}
          columns={columns}
          loading={loading}
          autoHeight
          disableRowSelectionOnClick
          initialState={{
            pagination: {
              paginationModel: { pageSize: 10 },
            },
            sorting: {
              sortModel: [{ field: 'date', sort: 'desc' }],
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
