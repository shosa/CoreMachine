# CoreMachine

Sistema di gestione centralizzata del parco macchine aziendale.

## Caratteristiche

- **Gestione Macchinari**: Inventario completo con classificazione gerarchica (Categoria → Tipologia → Macchinario)
- **Gestione Documentale**: Upload e archiviazione documenti con MinIO
- **Manutenzioni**: Storico interventi e manutenzioni programmate
- **QR Code**: Accesso rapido on-site per registrare manutenzioni direttamente dalla macchina
- **Ricerca Avanzata**: Ricerca full-text con Meilisearch
- **Multi-ruolo**: Sistema di autenticazione con ruoli (admin/tecnico/utente)

## Stack Tecnologico

### Backend
- NestJS + TypeScript
- MySQL + Prisma ORM
- JWT Authentication
- MinIO (S3-compatible storage)
- Meilisearch (full-text search)

### Frontend
- Next.js 14 (App Router) + TypeScript
- Material-UI (MUI)
- Zustand (state management)
- React Query

### Infrastructure
- Docker + Docker Compose
- Nginx (reverse proxy)
- MySQL, MinIO, Meilisearch (containerized)

## Prerequisiti

- Node.js 18+
- Docker & Docker Compose
- Git

## Installazione e Setup

### 1. Clone del Repository

```bash
git clone <repository-url>
cd CoreMachine
```

### 2. Configurazione Environment

Copia i file `.env.example` e personalizzali:

```bash
cp .env.example .env
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env
```

**IMPORTANTE**: Modifica le password e i secret nei file `.env` prima di andare in produzione!

### 3. Avvio con Docker Compose

```bash
# Avvia tutti i servizi
docker-compose up -d

# Verifica lo stato
docker-compose ps

# Visualizza i log
docker-compose logs -f
```

I servizi saranno disponibili su:
- **Frontend**: http://localhost
- **Backend API**: http://localhost/api
- **MinIO Console**: http://localhost:9001
- **Meilisearch**: http://localhost:7700

### 4. Setup Database (Prima Esecuzione)

Il database viene creato automaticamente, ma devi creare il primo utente admin:

```bash
# Accedi al container backend
docker exec -it coremachine-backend sh

# Apri Prisma Studio (opzionale, per visualizzare il DB)
npx prisma studio

# Oppure usa un client MySQL per inserire il primo admin
```

Inserisci il primo utente admin manualmente nel database (la password deve essere hash bcrypt):

```sql
INSERT INTO users (id, email, password, first_name, last_name, role, is_active)
VALUES (
  UUID(),
  'admin@coremachine.com',
  '$2b$10$XYZ...', -- Hash bcrypt di una password
  'Admin',
  'User',
  'admin',
  true
);
```

### 5. Sviluppo Locale (senza Docker)

Se vuoi sviluppare localmente senza Docker:

```bash
# Installa dipendenze
npm install

# Avvia solo i servizi infrastrutturali (MySQL, MinIO, Meilisearch)
docker-compose up -d mysql minio meilisearch

# In un terminale: Backend
npm run dev:backend

# In un altro terminale: Frontend
npm run dev:frontend
```

## Struttura del Progetto

```
CoreMachine/
├── apps/
│   ├── backend/           # NestJS API
│   │   ├── src/
│   │   │   ├── auth/      # Autenticazione JWT
│   │   │   ├── users/     # Gestione utenti
│   │   │   ├── categories/
│   │   │   ├── types/
│   │   │   ├── machines/  # Macchinari + QR code
│   │   │   ├── maintenances/
│   │   │   ├── scheduled-maintenances/
│   │   │   ├── documents/ # Upload file
│   │   │   ├── minio/     # Servizio MinIO
│   │   │   └── meilisearch/ # Servizio ricerca
│   │   └── prisma/
│   │       └── schema.prisma
│   └── frontend/          # Next.js UI
│       └── src/
│           ├── app/       # Pages (App Router)
│           ├── components/
│           ├── lib/       # Axios config
│           └── store/     # Zustand stores
├── nginx/
│   └── nginx.conf
├── docker-compose.yml
└── package.json           # Monorepo root
```

## API Endpoints Principali

### Auth
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Profilo utente corrente

### Machines
- `GET /api/machines` - Lista macchinari
- `POST /api/machines` - Crea macchinario (admin)
- `GET /api/machines/:id` - Dettaglio macchinario
- `GET /api/machines/:id/qrcode` - Genera QR code
- `GET /api/machines/search?q=query` - Ricerca

### Maintenances
- `GET /api/maintenances` - Lista manutenzioni
- `POST /api/maintenances` - Registra manutenzione (admin/tecnico)
- `GET /api/scheduled-maintenances/upcoming` - Manutenzioni in scadenza

### Documents
- `POST /api/documents` - Upload documento (multipart/form-data)
- `GET /api/documents/:id/download` - Download file

## Funzionalità QR Code

Ogni macchinario ha un QR code associato che punta a `/m/:id`.

1. Genera il QR code dal backend: `GET /api/machines/:id/qrcode`
2. Stampa e applica il QR sulla macchina
3. Scansionando il QR, l'operatore accede direttamente alla pagina della macchina
4. Dalla pagina può registrare immediatamente una manutenzione

## Backup

### Database (MySQL)

```bash
# Backup
docker exec coremachine-mysql mysqldump -u root -p coremachine > backup.sql

# Restore
docker exec -i coremachine-mysql mysql -u root -p coremachine < backup.sql
```

### File Storage (MinIO)

```bash
# Backup del volume Docker
docker run --rm -v coremachine_minio-data:/data -v $(pwd):/backup alpine tar czf /backup/minio-backup.tar.gz /data
```

## Sicurezza in Produzione

- [ ] Cambia tutti i secret e password nei file `.env`
- [ ] Configura certificati SSL con Let's Encrypt
- [ ] Abilita HTTPS in `nginx/nginx.conf`
- [ ] Configura firewall per esporre solo porta 80 e 443
- [ ] Setup backup automatici (cron)
- [ ] Configura monitoring (Prometheus + Grafana opzionale)

## Troubleshooting

### Il backend non si connette al database

Verifica che MySQL sia healthy:
```bash
docker-compose logs mysql
```

### Errori di permessi MinIO

Assicurati che le credenziali MinIO in `.env` corrispondano a quelle nel backend.

### Frontend non raggiunge il backend

Verifica la configurazione Nginx e che `NEXT_PUBLIC_API_URL` sia corretto.

## Licenza

Proprietario - Uso interno aziendale

## Supporto

Per problemi o domande, contatta il team di sviluppo.
