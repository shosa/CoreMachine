# 🐳 Guida Build Docker per CoreMachine

## 📋 Prerequisiti

- Docker Desktop installato e in esecuzione
- Docker Compose v2+
- Almeno 4GB di RAM disponibile
- 10GB di spazio disco libero

## 🚀 Build e Avvio

### 1. Build delle immagini

```bash
# Build di tutti i servizi
docker-compose build

# Build solo backend
docker-compose build backend

# Build solo frontend
docker-compose build frontend

# Build senza cache (se hai problemi)
docker-compose build --no-cache
```

### 2. Avvio dei servizi

```bash
# Avvia tutti i servizi
docker-compose up -d

# Avvia con logs visibili
docker-compose up

# Avvia solo alcuni servizi
docker-compose up -d mysql minio meilisearch backend
```

### 3. Verifica stato

```bash
# Controlla lo stato dei container
docker-compose ps

# Visualizza i logs
docker-compose logs -f

# Logs di un servizio specifico
docker-compose logs -f backend
docker-compose logs -f frontend
```

## 🔧 Comandi Utili

### Gestione Container

```bash
# Stop di tutti i servizi
docker-compose stop

# Riavvio di un servizio specifico
docker-compose restart backend

# Rimozione container (mantiene i volumi)
docker-compose down

# Rimozione container E volumi (attenzione: cancella i dati!)
docker-compose down -v
```

### Debugging

```bash
# Entra in un container
docker exec -it coremachine-backend sh
docker exec -it coremachine-frontend sh

# Controlla i logs in tempo reale
docker-compose logs -f --tail=100 backend

# Ispeziona un container
docker inspect coremachine-backend
```

### Database

```bash
# Esegui le migrations
docker exec coremachine-backend npx prisma migrate deploy

# Accedi al database MySQL
docker exec -it coremachine-mysql mysql -u coremachine -p

# Backup del database
docker exec coremachine-mysql mysqldump -u coremachine -p coremachine > backup.sql

# Restore del database
docker exec -i coremachine-mysql mysql -u coremachine -p coremachine < backup.sql
```

## 🐛 Risoluzione Problemi

### Backend non si avvia

1. Controlla i logs: `docker-compose logs backend`
2. Verifica che MySQL sia healthy: `docker-compose ps mysql`
3. Verifica la connessione al database:
   ```bash
   docker exec coremachine-backend sh -c "npx prisma migrate status"
   ```

### Frontend non si connette al backend

1. Verifica che il backend risponda:
   ```bash
   curl http://localhost:3001/api
   ```
2. Controlla le variabili d'ambiente nel frontend:
   ```bash
   docker exec coremachine-frontend env | grep NEXT_PUBLIC
   ```

### Build fallisce

1. Pulisci tutto e ricostruisci:
   ```bash
   docker-compose down -v
   docker system prune -a
   docker-compose build --no-cache
   docker-compose up -d
   ```

### Problemi di permessi (Linux/Mac)

```bash
# Se hai problemi con i permessi dei volumi
sudo chown -R $USER:$USER ./
```

### Monorepo workspace non riconosciuto

Il problema più comune! Assicurati che:
1. Il file `package.json` root abbia `"workspaces": ["apps/*"]`
2. I Dockerfile copiano il `package.json` root PRIMA di copiare i package.json delle app
3. Il context del build sia la root del progetto (`.`) non `apps/backend` o `apps/frontend`

## 📊 Monitoraggio

### Utilizzo risorse

```bash
# Visualizza utilizzo CPU/RAM
docker stats

# Visualizza solo backend e frontend
docker stats coremachine-backend coremachine-frontend
```

### Health checks

```bash
# Controlla lo stato health dei container
docker inspect --format='{{.State.Health.Status}}' coremachine-mysql
docker inspect --format='{{.State.Health.Status}}' coremachine-backend
```

## 🔐 Accessi Servizi

Una volta avviato tutto, puoi accedere a:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001/api
- **PHPMyAdmin**: http://localhost:8080
- **MinIO Console**: http://localhost:9001
- **Meilisearch**: http://localhost:7700

## 📝 Note Importanti

1. **Password di default**: Cambia le password in `.env` prima di andare in produzione!
2. **Volumi persistenti**: I dati sono salvati in volumi Docker, non verranno persi al restart
3. **Hot reload**: Non funziona in Docker, devi rifare il build per vedere le modifiche
4. **Port conflicts**: Se hai già servizi su 3000/3001/3306 etc, cambiali nel docker-compose.yml

## 🔄 Update del Codice

Quando modifichi il codice:

```bash
# 1. Rebuilda l'immagine
docker-compose build backend  # o frontend

# 2. Ricrea il container
docker-compose up -d --force-recreate backend

# O in un solo comando
docker-compose up -d --build backend
```

## 🎯 Best Practices

1. **Development**: Usa `npm run dev` in locale, NON Docker (è più veloce)
2. **Testing**: Usa Docker per testare la build di produzione
3. **Production**: Usa Docker Compose o Kubernetes per il deploy
4. **Logs**: Monitora sempre i logs: `docker-compose logs -f`
5. **Backup**: Fai backup regolari dei volumi Docker

## 🆘 In caso di emergenza

```bash
# RESET TOTALE (cancella TUTTO)
docker-compose down -v
docker system prune -a -f
docker volume prune -f
rm -rf node_modules apps/*/node_modules
npm install
docker-compose build --no-cache
docker-compose up -d
```

## 📞 Supporto

Se hai ancora problemi:
1. Controlla i logs: `docker-compose logs -f`
2. Verifica le variabili d'ambiente nel `docker-compose.yml`
3. Controlla che tutte le porte siano libere
4. Verifica la struttura del workspace nel `package.json` root
