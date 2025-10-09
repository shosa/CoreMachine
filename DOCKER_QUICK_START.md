# 🚀 Quick Start Docker - CoreMachine

## Setup in 5 minuti

### 1. Copia il file .env

```bash
cp .env.example .env
```

### 2. (Opzionale) Modifica le password nel .env

Apri `.env` e cambia almeno:
- `MYSQL_PASSWORD`
- `JWT_SECRET`
- `MEILI_MASTER_KEY`

### 3. Build e avvio

```bash
docker-compose up -d --build
```

### 4. Attendi che tutto sia pronto

```bash
# Controlla lo stato
docker-compose ps

# Controlla i logs
docker-compose logs -f
```

Aspetta che vedi:
- ✅ `coremachine-mysql` - healthy
- ✅ `coremachine-backend` - running
- ✅ `coremachine-frontend` - running

### 5. Accedi all'applicazione

Apri il browser: **http://localhost:3000**

## 🎯 Comandi Rapidi

```bash
# Vedere i logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Riavviare un servizio
docker-compose restart backend

# Fermare tutto
docker-compose stop

# Riavviare tutto
docker-compose start

# Cancellare tutto (ATTENZIONE: perdi i dati!)
docker-compose down -v
```

## ⚠️ Problemi Comuni

### "Port already in use"
Qualche altro servizio sta usando le porte 3000, 3001, o 3306.

**Soluzione**: Cambia le porte nel `docker-compose.yml`:
```yaml
ports:
  - "3002:3001"  # Cambia 3001 con 3002
```

### "Cannot connect to database"
Il backend parte prima che MySQL sia pronto.

**Soluzione**: Aspetta 30 secondi e riavvia il backend:
```bash
docker-compose restart backend
```

### Build fallisce
Problemi con la cache o dipendenze.

**Soluzione**:
```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

## 📱 Accessi di Default

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001/api
- **PHPMyAdmin**: http://localhost:8080
  - User: `coremachine`
  - Password: `securepassword123` (vedi .env)
- **MinIO**: http://localhost:9001
  - User: `minioadmin`
  - Password: `minioadmin123` (vedi .env)

## 🔐 Primo Accesso

Le credenziali di default dell'app vengono create dal seed:
- Email: `admin@coremachine.com`
- Password: `admin123`

**IMPORTANTE**: Cambia subito la password dopo il primo login!

## 📚 Documentazione Completa

Per informazioni dettagliate, vedi [DOCKER_BUILD_GUIDE.md](./DOCKER_BUILD_GUIDE.md)
