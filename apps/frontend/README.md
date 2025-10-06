# CoreMachine Frontend

Frontend application for CoreMachine - Sistema di gestione macchinari e manutenzioni.

## Tech Stack

- **Next.js 14** - React framework with App Router
- **Material-UI v6** - Component library
- **TypeScript** - Type safety
- **Zustand** - State management
- **Axios** - HTTP client
- **React Hook Form + Yup** - Form validation
- **Notistack** - Notifications
- **date-fns** - Date utilities
- **Recharts** - Charts
- **QRCode** - QR code generation

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Backend API running on `http://localhost:3000/api` (or configure `NEXT_PUBLIC_API_URL`)

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

```bash
npm run build
npm start
```

## Features

### Authentication
- Login page with email/password
- JWT token authentication
- Role-based access control (admin, tecnico, utente)
- Persistent session with localStorage

### Dashboard
- Statistics cards (machines, maintenances, documents, users)
- Recent maintenances table
- Responsive layout

### Machines Management
- List all machines with search
- Create new machine (admin only)
- View machine details with tabs (info, maintenance history, documents)
- Edit machine (admin/tecnico)
- Delete machine (admin only)
- Generate QR code for quick access

### Maintenances Management
- List all maintenances with filters
- Create new maintenance (admin/tecnico)
- View maintenance details
- Edit maintenance (admin/tecnico)
- Delete maintenance (admin only)

### Documents Management
- List all documents
- Upload document with file picker
- Download document
- Delete document

### Categories & Types Management (Admin only)
- CRUD operations with inline dialog
- Categories list
- Types list with category association

### Users Management (Admin only)
- List all users
- Create new user
- Edit user
- Delete user
- Role and status management

### Scheduled Maintenances
- List scheduled maintenances
- Create new scheduled maintenance
- Edit scheduled maintenance
- Delete scheduled maintenance
- Frequency and notification settings

### Quick Maintenance (Public QR Access)
- Public page accessible via QR code
- No authentication required
- Quick maintenance registration form
- Mobile-optimized

## Project Structure

```
apps/frontend/
├── src/
│   ├── app/                      # Next.js App Router pages
│   │   ├── (dashboard)/         # Protected dashboard routes
│   │   │   ├── dashboard/       # Dashboard page
│   │   │   ├── machines/        # Machines CRUD
│   │   │   ├── maintenances/    # Maintenances CRUD
│   │   │   ├── documents/       # Documents management
│   │   │   ├── categories/      # Categories management
│   │   │   ├── types/           # Types management
│   │   │   ├── users/           # Users management
│   │   │   └── scheduled-maintenances/ # Scheduled maintenances
│   │   ├── login/               # Login page
│   │   ├── m/[id]/              # Public quick maintenance
│   │   ├── layout.tsx           # Root layout with providers
│   │   └── page.tsx             # Home page (redirects)
│   ├── components/              # Shared components
│   │   ├── Layout/
│   │   │   └── DashboardLayout.tsx  # Main layout with sidebar
│   │   ├── Logo.tsx
│   │   ├── UserAvatar.tsx
│   │   ├── PageHeader.tsx
│   │   └── Widget.tsx
│   ├── lib/
│   │   └── axios.ts             # Axios instance with interceptors
│   ├── store/
│   │   └── authStore.ts         # Zustand auth store
│   ├── theme/
│   │   └── index.ts             # MUI theme configuration
│   └── types/
│       └── index.ts             # TypeScript type definitions
├── package.json
├── tsconfig.json
└── next.config.ts
```

## Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

## Authentication Flow

1. User enters credentials on `/login`
2. API returns JWT token and user object
3. Token stored in localStorage via Zustand
4. Axios interceptor adds token to all requests
5. On 401 response, user redirected to login

## Role-Based Access

- **Admin**: Full access to all features
- **Tecnico**: Can create/edit machines and maintenances
- **Utente**: Read-only access

Navigation items are filtered based on user role.

## Design System

- **Border Radius**: 4px consistent across all components
- **Borders**: Clean borders instead of heavy shadows
- **Color Palette**: Material-UI default with grey scale
- **Typography**: System fonts with consistent weights
- **Spacing**: 8px base unit (MUI default)

## API Integration

All API calls use the axios instance from `src/lib/axios.ts`:

```typescript
import axiosInstance from '@/lib/axios';

const response = await axiosInstance.get('/machines');
```

## Form Validation

Forms use React Hook Form with Yup schemas:

```typescript
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

const schema = yup.object({
  name: yup.string().required('Required'),
});

const { control, handleSubmit } = useForm({
  resolver: yupResolver(schema),
});
```

## License

Private - CoreMachine Project
