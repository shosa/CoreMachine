# CoreMachine - Guida Rebuild su Server Ubuntu

Questa guida spiega come fare rebuild dell'applicazione CoreMachine sul server Ubuntu in produzione.

## 📋 Prerequisiti

1. Accesso SSH al server Ubuntu
2. File sorgenti aggiornati sul server
3. Docker e Docker Compose installati

---

## 🚀 Script di Rebuild Disponibili

### 1. **Rebuild Completo** (Backend + Frontend + Nginx)

Usa questo quando hai modifiche sia al backend che al frontend.

```bash
cd /percorso/CoreSuite/CoreMachine
chmod +x rebuild.sh
./rebuild.sh
```

**Cosa fa:**
- Ferma tutti i container di CoreMachine
- Rebuilda tutte le immagini senza cache
- Riavvia tutti i container
- Mostra lo stato finale

**Tempo:** ~5-10 minuti

---

### 2. **Rebuild Solo Backend**

Usa questo quando hai modifiche solo al backend (come il fix della data).

```bash
cd /percorso/CoreSuite/CoreMachine
chmod +x rebuild-backend.sh
./rebuild-backend.sh
```

**Cosa fa:**
- Ferma solo il container backend
- Rebuilda solo l'immagine backend senza cache
- Riavvia il backend
- Il frontend e nginx continuano a funzionare

**Tempo:** ~3-5 minuti

---

### 3. **Rebuild Solo Frontend**

Usa questo quando hai modifiche solo al frontend.

```bash
cd /percorso/CoreSuite/CoreMachine
chmod +x rebuild-frontend.sh
./rebuild-frontend.sh
```

**Cosa fa:**
- Ferma solo il container frontend
- Rebuilda solo l'immagine frontend senza cache
- Riavvia il frontend
- Il backend e nginx continuano a funzionare

**Tempo:** ~3-5 minuti

---

## 🔧 Comandi Manuali (senza script)

### Verifica versione Docker Compose

```bash
# Prova questo prima
docker compose version

# Se il comando sopra non funziona, prova questo
docker-compose version
```

### Rebuild Completo Manuale

**Con Docker Compose v2 (plugin):**
```bash
cd /percorso/CoreSuite/CoreMachine

# Stop
docker compose -p coremachine down

# Build
docker compose -p coremachine build --no-cache

# Start
docker compose -p coremachine up -d

# Verifica
docker compose -p coremachine ps
```

**Con Docker Compose v1 (standalone):**
```bash
# Sostituisci "docker compose" con "docker-compose" (con trattino)
docker-compose -p coremachine down
docker-compose -p coremachine build --no-cache
docker-compose -p coremachine up -d
docker-compose -p coremachine ps
```

### Rebuild Solo Backend Manuale

```bash
# Stop backend
docker compose -p coremachine stop backend
docker compose -p coremachine rm -f backend

# Build backend
docker compose -p coremachine build --no-cache backend

# Start backend
docker compose -p coremachine up -d backend

# Verifica
docker logs -f coremachine-backend
```

### Rebuild Solo Frontend Manuale

```bash
# Stop frontend
docker compose -p coremachine stop frontend
docker compose -p coremachine rm -f frontend

# Build frontend
docker compose -p coremachine build --no-cache frontend

# Start frontend
docker compose -p coremachine up -d frontend

# Verifica
docker logs -f coremachine-frontend
```

---

## 📊 Comandi Utili per Debugging

### Visualizza Log in Tempo Reale

```bash
# Tutti i container
docker compose -p coremachine logs -f

# Solo backend
docker logs -f coremachine-backend

# Solo frontend
docker logs -f coremachine-frontend

# Solo nginx
docker logs -f coremachine-nginx
```

### Verifica Stato Container

```bash
# Lista tutti i container
docker ps -a

# Solo container CoreMachine
docker ps -a | grep coremachine

# Stato tramite compose
docker compose -p coremachine ps
```

### Verifica Risorse

```bash
# Uso CPU e RAM
docker stats

# Spazio disco
docker system df

# Pulizia immagini vecchie (liberare spazio)
docker system prune -a
```

### Ispeziona Container

```bash
# Entra nel container backend
docker exec -it coremachine-backend sh

# Verifica variabili d'ambiente
docker exec coremachine-backend env

# Verifica file build
docker exec coremachine-backend ls -la /app/dist
```

---

## ⚠️ Risoluzione Problemi

### Build non parte / "non fa nulla"

**Problema:** Il comando build non mostra output

**Soluzione:**
```bash
# 1. Verifica che sei nella directory corretta
pwd
# Dovresti essere in /percorso/CoreSuite/CoreMachine

# 2. Verifica che il file docker-compose.yml esista
ls -la docker-compose.yml

# 3. Usa --verbose per vedere l'output
docker compose -p coremachine build --no-cache --verbose
```

### Build fallisce con errori di rete

**Problema:** Timeout durante npm install

**Soluzione:**
```bash
# Build con più tentativi e timeout aumentato
docker compose -p coremachine build --no-cache \
  --build-arg NPM_CONFIG_FETCH_RETRY_MINTIMEOUT=60000 \
  --build-arg NPM_CONFIG_FETCH_RETRY_MAXTIMEOUT=300000
```

### Container non si avvia dopo rebuild

**Problema:** Container in stato "Exited" o "Restarting"

**Soluzione:**
```bash
# 1. Controlla i log per errori
docker logs coremachine-backend

# 2. Verifica le variabili d'ambiente
cat .env

# 3. Riavvia i servizi dipendenti
cd ../CoreServices
docker compose -p coreservices restart

# 4. Riavvia CoreMachine
cd ../CoreMachine
docker compose -p coremachine restart
```

### Prisma non trova il database

**Problema:** "Can't reach database server"

**Soluzione:**
```bash
# 1. Verifica che MySQL sia in esecuzione
docker ps | grep core-mysql

# 2. Verifica la connessione di rete
docker network inspect core-network

# 3. Testa la connessione al DB
docker exec core-mysql mysql -uroot -prootpassword -e "SELECT 1"

# 4. Riavvia MySQL
cd ../CoreServices
docker compose -p coreservices restart mysql
```

---

## 🎯 Procedura per il Fix della Data (purchaseDate)

Per applicare il fix specifico dell'errore `purchaseDate`:

```bash
# 1. Connettiti al server
ssh user@YOUR_SERVER_IP

# 2. Vai nella directory CoreMachine
cd /percorso/CoreSuite/CoreMachine

# 3. Backup dei file (opzionale ma consigliato)
cp apps/backend/src/machines/machines.service.ts apps/backend/src/machines/machines.service.ts.backup
cp apps/frontend/src/app/\(dashboard\)/machines/[id]/edit/page.tsx apps/frontend/src/app/\(dashboard\)/machines/[id]/edit/page.tsx.backup

# 4. Carica i file aggiornati sul server
# (Usa SCP, SFTP, o Git pull)

# 5. Rebuild di entrambi (backend + frontend)
chmod +x rebuild.sh
./rebuild.sh

# 6. Verifica i log
docker logs -f coremachine-backend

# 7. Testa l'applicazione
# Apri http://YOUR_SERVER_IP e prova a modificare una macchina
```

---

## 📦 Trasferimento File da Windows a Ubuntu

### Usando SCP (da Git Bash su Windows)

```bash
# File singolo
scp C:/Users/Stefano/Desktop/CoreSuite/CoreMachine/apps/backend/src/machines/machines.service.ts \
  user@SERVER_IP:/percorso/CoreSuite/CoreMachine/apps/backend/src/machines/

# Intera directory
scp -r C:/Users/Stefano/Desktop/CoreSuite/CoreMachine/* \
  user@SERVER_IP:/percorso/CoreSuite/CoreMachine/
```

### Usando Git (consigliato)

```bash
# Sul PC Windows
cd C:/Users/Stefano/Desktop/CoreSuite
git add .
git commit -m "Fix purchaseDate ISO-8601 conversion"
git push

# Sul server Ubuntu
ssh user@SERVER_IP
cd /percorso/CoreSuite
git pull
```

---

## ✅ Checklist Deploy

- [ ] File sorgenti aggiornati sul server
- [ ] File `.env` configurato correttamente
- [ ] CoreServices (MySQL, MinIO, etc.) in esecuzione
- [ ] Backup del database fatto (se necessario)
- [ ] Script di rebuild eseguibile (`chmod +x`)
- [ ] Rebuild completato senza errori
- [ ] Container in stato "Up"
- [ ] Log controllati (nessun errore)
- [ ] Applicazione testata (modificare una macchina con purchaseDate)

---

## 📞 Supporto

Se hai problemi durante il rebuild, controlla:

1. **Log dei container** - Cerca errori specifici
2. **File .env** - Verifica che le password e URL siano corretti
3. **Spazio disco** - `df -h` (deve esserci almeno 5GB liberi)
4. **Memoria RAM** - `free -h` (almeno 2GB disponibili)
5. **CoreServices** - Devono essere attivi prima di CoreMachine

Per ulteriore assistenza, salva l'output di:
```bash
docker compose -p coremachine ps
docker logs coremachine-backend --tail 100
docker logs coremachine-frontend --tail 100
```
