# CoreMachine

Sistema di gestione centralizzata del parco macchine aziendale.

## Prerequisiti

Prima di avviare CoreMachine, assicurati che **CoreServices** sia attivo:
```bash
cd ../CoreServices
start.bat
```

## Comandi Rapidi

```bash
# Avvia l'applicazione
start.bat

# Ferma l'applicazione
stop.bat

# Visualizza i log
logs.bat

# Rebuild (dopo modifiche al codice)
build.bat
build.bat --no-cache  # Rebuild completo
```

## Comandi Manuali

```bash
# Start
docker-compose -p coremachine up -d

# Stop
docker-compose -p coremachine down

# Build
docker-compose -p coremachine build

# Logs
docker-compose -p coremachine logs -f [backend|frontend|nginx]
```

## Accesso

- **Frontend**: http://localhost
- **Backend API**: http://localhost/api
- **Backend diretto**: http://localhost:3001/api (solo per debug)

## Struttura

```
CoreMachine/
├── apps/
│   ├── backend/     # NestJS API
│   └── frontend/    # Next.js UI
├── nginx/           # Reverse proxy config
├── docker-compose.yml
├── .env
└── package.json
```

## Database

CoreMachine usa il database `coremachine` su MySQL condiviso (CoreServices).

### Creare il database (prima esecuzione)

```bash
docker exec core-mysql mysql -uroot -prootpassword -e "
CREATE DATABASE IF NOT EXISTS coremachine;
CREATE USER IF NOT EXISTS 'coremachine'@'%' IDENTIFIED BY 'password';
GRANT ALL PRIVILEGES ON coremachine.* TO 'coremachine'@'%';
FLUSH PRIVILEGES;
"
```

## Sviluppo

### Modifiche al Backend

```bash
# 1. Modifica il codice in apps/backend
# 2. Rebuild
build.bat backend
# 3. Restart
stop.bat && start.bat
```

### Modifiche al Frontend

```bash
# 1. Modifica il codice in apps/frontend
# 2. Rebuild
build.bat frontend
# 3. Restart
stop.bat && start.bat
```

### Modifiche al Database (Prisma)

```bash
# 1. Modifica apps/backend/prisma/schema.prisma
# 2. Crea migration
docker exec coremachine-backend npx prisma migrate dev --name nome_migration
# 3. Rebuild backend
build.bat backend
```

## Network

CoreMachine si connette alla network `core-network` (creata da CoreServices) per accedere a MySQL, MinIO e Meilisearch.
