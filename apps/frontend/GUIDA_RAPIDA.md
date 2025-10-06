# Guida Rapida - CoreMachine Frontend

## Setup Iniziale

```bash
cd apps/frontend
npm install
npm run dev
```

Il frontend sarà disponibile su: **http://localhost:3000**

## Credenziali di Test

Dopo aver creato utenti tramite backend, usa:
- **Email**: admin@coremachine.it
- **Password**: (quella impostata nel database)

## Struttura Progetto

```
apps/frontend/
├── src/
│   ├── app/                    # Next.js 14 App Router
│   │   ├── login/             # Login page (pubblica)
│   │   ├── m/[id]/            # Quick maintenance via QR (pubblica)
│   │   └── (dashboard)/       # Route protette con auth
│   │       ├── dashboard/     # Homepage con statistiche
│   │       ├── machines/      # CRUD Macchinari
│   │       ├── maintenances/  # CRUD Manutenzioni
│   │       ├── documents/     # CRUD Documenti
│   │       ├── categories/    # CRUD Categorie (admin)
│   │       ├── types/         # CRUD Tipi (admin)
│   │       ├── users/         # CRUD Utenti (admin)
│   │       └── scheduled-maintenances/ # Manutenzioni programmate
│   ├── components/            # Componenti riutilizzabili
│   │   ├── Layout/
│   │   │   └── DashboardLayout.tsx  # Sidebar + Header
│   │   ├── PageHeader.tsx     # Header con breadcrumbs
│   │   ├── Widget.tsx         # Card component
│   │   ├── Logo.tsx
│   │   └── UserAvatar.tsx
│   ├── lib/
│   │   └── axios.ts          # Client HTTP con auth
│   ├── store/
│   │   └── authStore.ts      # State management (Zustand)
│   ├── theme/
│   │   └── index.ts          # Material-UI theme
│   └── types/
│       └── index.ts          # TypeScript interfaces
```

## Ruoli e Permessi

### Admin
- Accesso completo a tutte le sezioni
- Può creare/modificare/eliminare: utenti, categorie, tipi, macchinari, documenti
- Può eliminare manutenzioni

### Tecnico
- Può creare/modificare manutenzioni
- Può modificare macchinari
- Può visualizzare tutto tranne gestione utenti/categorie/tipi

### Utente
- Può solo visualizzare macchinari, manutenzioni e documenti
- Nessuna azione di modifica

## Funzionalità Implementate

### Dashboard
- ✅ Statistiche: Totale macchine, manutenzioni, documenti, utenti
- ✅ Tabella manutenzioni recenti
- ✅ Widget grafici

### Macchinari
- ✅ Lista con ricerca e filtri
- ✅ Creazione (admin)
- ✅ Modifica (admin/tecnico)
- ✅ Eliminazione (admin)
- ✅ Dettaglio con tabs (Info, Storico Manutenzioni, Documenti)
- ✅ Generazione QR Code per accesso rapido

### Manutenzioni
- ✅ Lista con filtri per tipo e macchina
- ✅ Creazione (admin/tecnico)
- ✅ Dettaglio completo
- ✅ Quick maintenance via QR code (pubblica)

### Documenti
- ✅ Upload file
- ✅ Download
- ✅ Categorizzazione (manuale uso, certificazione CE, scheda tecnica, etc.)
- ✅ Associazione a macchinari

### Categorie & Tipi
- ✅ CRUD inline con dialog
- ✅ Gerarchia Category → Type → Machine
- ✅ Solo admin

### Utenti
- ✅ Lista con stato attivo/inattivo
- ✅ Creazione con selezione ruolo
- ✅ Gestione password
- ✅ Solo admin

### Manutenzioni Programmate
- ✅ Lista con frequenza e prossima data
- ✅ Notifiche pre-scadenza
- ✅ Attivazione/disattivazione

## Configurazione

### Variabili d'Ambiente

Crea un file `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Backend API

Assicurati che il backend NestJS sia in esecuzione su `http://localhost:3001` (o la porta configurata).

## Stile e Design

- **Framework UI**: Material-UI v6
- **Border Radius**: 4px consistente
- **Design**: Clean, minimal, con borders invece di shadows pesanti
- **Colori**: Palette grigia con accent colors
- **Responsive**: Mobile-first con breakpoints MUI

## Componenti Chiave

### DashboardLayout
- Sidebar persistente (280px) su desktop
- Mobile drawer con toggle
- Navigation filtrata per ruolo
- User menu con logout
- Notifications badge
- Logo CoreMachine

### PageHeader
- Titolo pagina
- Breadcrumbs per navigazione
- Azioni (es. "Aggiungi nuovo")

### DataGrid
- Sorting, filtering, pagination
- Actions column con icone
- Selection per bulk actions
- Responsive

## Debug e Troubleshooting

### Errore 401 Unauthorized
- Verifica che il token sia salvato correttamente
- Controlla che il backend accetti il token
- Guarda Network tab in DevTools

### CORS Errors
- Assicurati che il backend abbia CORS abilitato
- Verifica l'URL dell'API in .env.local

### Hydration Errors
- Usa 'use client' per componenti con state
- Evita differenze tra server e client render

## Scripts Disponibili

```bash
npm run dev       # Development server (http://localhost:3000)
npm run build     # Production build
npm run start     # Production server
npm run lint      # ESLint
npm run type-check # TypeScript check
```

## Prossimi Passi

1. Installa le dipendenze: `npm install`
2. Configura `.env.local` con l'URL del backend
3. Avvia il backend NestJS
4. Avvia il frontend: `npm run dev`
5. Vai su http://localhost:3000
6. Fai login con le credenziali create nel backend

## Note Tecniche

- **Next.js 14**: App Router, Server Components dove possibile
- **TypeScript**: Strict mode abilitato
- **State Management**: Zustand per auth, local state per form
- **Forms**: react-hook-form + yup validation
- **HTTP Client**: Axios con interceptors
- **Notifications**: notistack per snackbars
- **Icons**: @mui/icons-material
- **Charts**: Recharts (per dashboard)
- **QR Codes**: qrcode library

## Supporto

Per problemi o domande, controlla:
1. Console del browser per errori JavaScript
2. Network tab per errori API
3. Backend logs per errori server-side
4. README.md principale del progetto
