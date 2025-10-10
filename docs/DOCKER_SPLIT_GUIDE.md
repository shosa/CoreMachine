# Guida: Architettura Separata CoreServices + CoreMachine

## Panoramica

L'architettura è stata suddivisa in due stack Docker separati:

### 1. **CoreServices** (Servizi condivisi)
Servizi infrastrutturali condivisi tra tutti i progetti della suite Core*:
- MySQL
- MinIO (Object Storage)
- Meilisearch (Full-text Search)
- PHPMyAdmin

### 2. **CoreMachine** (Applicazione)
Componenti specifici dell'applicazione CoreMachine:
- Backend (NestJS)
- Frontend (Next.js)
- Nginx (Reverse Proxy)

---

## Setup Iniziale

### 1. Avviare i Servizi Condivisi (Una volta sola)

```bash
# Avvia i servizi infrastrutturali
docker-compose -p coreservices -f docker-compose.services.yml --env-file .env.services up -d

# Verifica che siano tutti healthy
docker-compose -p coreservices -f docker-compose.services.yml ps
```

**Nota**: Il flag `-p coreservices` crea un progetto separato in Docker Desktop chiamato "coreservices"

I servizi saranno accessibili su:
- **MySQL**: localhost:3306
- **PHPMyAdmin**: http://localhost:8080
- **MinIO API**: localhost:9000
- **MinIO Console**: http://localhost:9001
- **Meilisearch**: http://localhost:7700

### 2. Creare il Database per CoreMachine

```bash
# Accedi a MySQL
docker exec -it core-mysql mysql -uroot -p

# Crea database e utente per CoreMachine
CREATE DATABASE coremachine;
CREATE USER 'coremachine'@'%' IDENTIFIED BY 'password';
GRANT ALL PRIVILEGES ON coremachine.* TO 'coremachine'@'%';
FLUSH PRIVILEGES;
EXIT;
```

### 3. Avviare CoreMachine

```bash
# Avvia l'applicazione CoreMachine
docker-compose -p coremachine -f docker-compose.app.yml up -d

# Verifica lo stato
docker-compose -p coremachine -f docker-compose.app.yml ps

# Visualizza i log
docker-compose -p coremachine -f docker-compose.app.yml logs -f
```

L'applicazione sarà disponibile su:
- **Frontend**: http://localhost
- **Backend API**: http://localhost/api

---

## Comandi Utili

### Gestione CoreServices

```bash
# Start
docker-compose -p coreservices -f docker-compose.services.yml --env-file .env.services up -d

# Stop (senza rimuovere i volumi)
docker-compose -p coreservices -f docker-compose.services.yml stop

# Stop e rimuovi container (volumi rimangono)
docker-compose -p coreservices -f docker-compose.services.yml down

# Stop, rimuovi container E volumi (ATTENZIONE: perdi i dati!)
docker-compose -p coreservices -f docker-compose.services.yml down -v

# Logs
docker-compose -p coreservices -f docker-compose.services.yml logs -f [service-name]

# Verifica stato
docker-compose -p coreservices -f docker-compose.services.yml ps
```

### Gestione CoreMachine

```bash
# Start
docker-compose -p coremachine -f docker-compose.app.yml up -d

# Stop
docker-compose -p coremachine -f docker-compose.app.yml down

# Rebuild dopo modifiche al codice
docker-compose -p coremachine -f docker-compose.app.yml build
docker-compose -p coremachine -f docker-compose.app.yml up -d

# Rebuild senza cache
docker-compose -p coremachine -f docker-compose.app.yml build --no-cache

# Logs
docker-compose -p coremachine -f docker-compose.app.yml logs -f [backend|frontend|nginx]
```

### Verifica Network

```bash
# Visualizza la network condivisa
docker network inspect core-network

# Controlla quali container sono connessi
docker network inspect core-network --format='{{range .Containers}}{{.Name}} {{end}}'
```

---

## Vantaggi di questa Architettura

### ✅ Riutilizzo delle Risorse
- MySQL, MinIO e Meilisearch sono condivisi tra tutti i progetti Core*
- Risparmio di memoria e risorse
- Un unico punto di gestione per i backup

### ✅ Sviluppo Indipendente
- Puoi aggiornare CoreMachine senza toccare i servizi
- Puoi sviluppare CoreXXX riutilizzando gli stessi servizi
- Ogni applicazione può avere il proprio database nello stesso MySQL

### ✅ Gestione Separata
- I servizi infrastrutturali rimangono sempre attivi
- Le applicazioni possono essere fermate/riavviate senza impatto sui dati
- Facile aggiungere nuovi progetti alla suite

### ✅ Backup Centralizzato
- Un unico punto per fare backup di MySQL, MinIO e Meilisearch
- I dati di tutte le applicazioni sono nello stesso posto

---

## Aggiungere un Nuovo Progetto (es. CoreInventory)

1. Crea `CoreInventory/docker-compose.yml`:

```yaml
services:
  backend:
    build: ./backend
    environment:
      DATABASE_URL: mysql://coreinventory:password@mysql:3306/coreinventory
      MINIO_ENDPOINT: minio
      MEILISEARCH_HOST: http://meilisearch:7700
    networks:
      - core-network

  frontend:
    build: ./frontend
    networks:
      - core-network

networks:
  core-network:
    external: true
    name: core-network
```

2. Crea il database in MySQL:
```sql
CREATE DATABASE coreinventory;
CREATE USER 'coreinventory'@'%' IDENTIFIED BY 'password';
GRANT ALL PRIVILEGES ON coreinventory.* TO 'coreinventory'@'%';
```

3. Avvia:
```bash
cd CoreInventory
docker-compose up -d
```

Fatto! Il nuovo progetto usa automaticamente gli stessi servizi condivisi.

---

## Migrazione da Setup Monolitico

Se stai migrando dal vecchio `docker-compose.yml`:

### 1. Ferma tutto
```bash
docker-compose down
```

### 2. Crea la network
```bash
docker network create core-network
```

### 3. Avvia i servizi condivisi
```bash
docker-compose -f docker-compose.services.yml --env-file .env.services up -d
```

### 4. Avvia CoreMachine
```bash
docker-compose -f docker-compose.app.yml up -d
```

### 5. (Opzionale) Rimuovi il vecchio docker-compose.yml
```bash
mv docker-compose.yml docker-compose.yml.backup
```

---

## Troubleshooting

### I container non comunicano tra loro

Verifica che tutti usino la stessa network:
```bash
docker network inspect core-network
```

### Database connection failed

Assicurati che CoreServices sia avviato e healthy:
```bash
docker-compose -f docker-compose.services.yml ps
```

### Port already in use

Se hai già servizi in esecuzione sulle stesse porte (3306, 9000, 7700), puoi:
1. Fermarli
2. Modificare le porte in `docker-compose.services.yml`

---

## File di Configurazione

- **`.env.services`**: Configurazione per CoreServices (credenziali condivise)
- **`.env`**: Configurazione per CoreMachine (specifico dell'app)
- **`docker-compose.services.yml`**: Definizione servizi condivisi
- **`docker-compose.app.yml`**: Definizione CoreMachine
- **`docker-compose.yml`**: (legacy) Setup monolitico originale - può essere rimosso

---

## Backup e Restore

### Backup Servizi Condivisi

```bash
# Backup MySQL (tutti i database)
docker exec core-mysql mysqldump -uroot -p --all-databases > backup-all.sql

# Backup specifico database CoreMachine
docker exec core-mysql mysqldump -ucoremachine -p coremachine > backup-coremachine.sql

# Backup MinIO (tutti i file)
docker run --rm -v core-minio-data:/data -v $(pwd):/backup alpine tar czf /backup/minio-backup.tar.gz /data

# Backup Meilisearch
docker run --rm -v core-meilisearch-data:/data -v $(pwd):/backup alpine tar czf /backup/meilisearch-backup.tar.gz /data
```

### Restore

```bash
# Restore MySQL
docker exec -i core-mysql mysql -uroot -p < backup-all.sql

# Restore MinIO
docker run --rm -v core-minio-data:/data -v $(pwd):/backup alpine tar xzf /backup/minio-backup.tar.gz -C /

# Restore Meilisearch
docker run --rm -v core-meilisearch-data:/data -v $(pwd):/backup alpine tar xzf /backup/meilisearch-backup.tar.gz -C /
```
