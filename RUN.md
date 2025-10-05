# 🚀 Come Avviare CoreMachine

Questa guida ti accompagna passo-passo nell'avvio dell'applicazione CoreMachine.

---

## 📋 Prerequisiti

Prima di iniziare, assicurati di avere installato:

- ✅ **Docker Desktop** (Windows/Mac) o **Docker + Docker Compose** (Linux)
  - [Download Docker Desktop](https://www.docker.com/products/docker-desktop/)
- ✅ **Git** (per clonare il repository)
  - [Download Git](https://git-scm.com/downloads)

---

## 🔧 Installazione e Primo Avvio

### Passo 1: Clone del Repository

```bash
cd Desktop
git clone <repository-url> CoreMachine
cd CoreMachine
```

Se il repository è già presente, salta questo passo.

---

### Passo 2: Configurazione Environment

Crea il file di configurazione `.env` copiando il template:

```bash
# Su Windows (PowerShell)
copy .env.example .env

# Su Mac/Linux
cp .env.example .env
```

**📝 IMPORTANTE:** Apri il file `.env` con un editor di testo e modifica le seguenti password:

```env
# Cambia queste password con valori sicuri
MYSQL_ROOT_PASSWORD=tuaPasswordRoot123!
MYSQL_PASSWORD=tuaPasswordDB456!
JWT_SECRET=unaSegreteChiaveMoltoLunga789!
MINIO_ROOT_PASSWORD=tuaPasswordMinio012!
MEILI_MASTER_KEY=tuaChiaveMeilisearch345!
```

> ⚠️ **Non usare mai le password di default in produzione!**

---

### Passo 3: Avvio dei Servizi con Docker

```bash
# Avvia tutti i container
docker-compose up -d
```

Questo comando:
- Scarica le immagini Docker necessarie (prima volta: ~2-5 minuti)
- Crea i container per: MySQL, MinIO, Meilisearch, Backend, Frontend, Nginx
- Avvia i servizi in background

**Verifica che tutti i container siano running:**

```bash
docker-compose ps
```

Dovresti vedere 6 container con stato `Up`:
- `coremachine-mysql`
- `coremachine-minio`
- `coremachine-meilisearch`
- `coremachine-backend`
- `coremachine-frontend`
- `coremachine-nginx`

---

### Passo 4: Inizializzazione Database

**Esegui le migration del database:**

```bash
# Accedi al container backend
docker exec -it coremachine-backend sh

# Esegui le migration
npx prisma migrate deploy

# Genera il client Prisma (se necessario)
npx prisma generate

# Esci dal container
exit
```

**Popola il database con dati di esempio:**

```bash
docker exec -it coremachine-backend sh
npm run prisma:seed
exit
```

Questo creerà:
- 2 utenti (admin e tecnico)
- 2 categorie (CUCITRICI, PRESSE)
- 2 tipologie (LINEARE, A COLONNA)
- 2 macchinari di esempio
- 1 manutenzione di esempio
- 1 manutenzione programmata

---

### Passo 5: Accesso all'Applicazione

Apri il browser e vai su:

👉 **http://localhost**

**Credenziali di accesso:**

| Ruolo | Email | Password |
|-------|-------|----------|
| **Admin** | admin@coremachine.com | admin123 |
| **Tecnico** | tecnico@coremachine.com | tecnico123 |

---

## 🎯 Verifica Funzionamento

### 1. Login
- Accedi con le credenziali admin
- Dovresti vedere la dashboard con le statistiche

### 2. Esplora le Sezioni
- **Dashboard**: Panoramica con 4 card statistiche
- **Macchinari**: Lista dei 2 macchinari di esempio
- **Categorie**: CUCITRICI e PRESSE
- **Manutenzioni**: Storico interventi

### 3. Testa il QR Code
- Vai su **Macchinari**
- Clicca su un macchinario
- Clicca **Genera QR Code**
- Scansiona con il telefono o visita manualmente `http://localhost/m/<id-macchina>`

---

## 🛑 Fermare l'Applicazione

```bash
# Ferma tutti i container (senza cancellare i dati)
docker-compose stop

# Oppure ferma e rimuovi i container (i dati nei volumi restano)
docker-compose down
```

---

## 🔄 Riavviare l'Applicazione

Dopo il primo avvio, per riavviare l'applicazione:

```bash
cd CoreMachine
docker-compose up -d
```

**Non serve rifare le migration o il seed!** I dati sono persistiti nei volumi Docker.

---

## 📊 Accesso ai Servizi

### Interfacce Web

| Servizio | URL | Credenziali |
|----------|-----|-------------|
| **CoreMachine App** | http://localhost | admin@coremachine.com / admin123 |
| **MinIO Console** | http://localhost:9001 | minioadmin / minioadmin (o quelle in .env) |
| **Meilisearch** | http://localhost:7700 | API Key dal .env |

### Database MySQL

```bash
# Connettiti via riga di comando
docker exec -it coremachine-mysql mysql -u coremachine -p
# Password: quella in .env (MYSQL_PASSWORD)

# Oppure usa un client grafico come MySQL Workbench
Host: localhost
Port: 3306
User: coremachine
Password: <MYSQL_PASSWORD dal .env>
Database: coremachine
```

### Prisma Studio (GUI per Database)

```bash
docker exec -it coremachine-backend npx prisma studio
```

Poi apri: http://localhost:5555

---

## 🔍 Visualizzare i Log

### Tutti i servizi
```bash
docker-compose logs -f
```

### Servizio specifico
```bash
# Backend
docker-compose logs -f backend

# Frontend
docker-compose logs -f frontend

# MySQL
docker-compose logs -f mysql
```

Premi `Ctrl+C` per uscire dai log.

---

## ⚙️ Comandi Utili

### Riavviare un singolo servizio
```bash
docker-compose restart backend
docker-compose restart frontend
```

### Ricostruire le immagini (dopo modifiche al codice)
```bash
docker-compose build
docker-compose up -d
```

### Vedere lo stato dei container
```bash
docker-compose ps
```

### Pulire tutto (ATTENZIONE: cancella anche i dati!)
```bash
docker-compose down -v
```

---

## 🐛 Risoluzione Problemi

### ❌ "Cannot connect to Docker daemon"

**Soluzione:** Avvia Docker Desktop e assicurati che sia in esecuzione.

---

### ❌ Frontend mostra errore di connessione

**Causa:** Il backend non è pronto.

**Soluzione:**
```bash
# Verifica i log del backend
docker-compose logs backend

# Riavvia il backend
docker-compose restart backend
```

---

### ❌ "Access denied for user" (MySQL)

**Causa:** Password errata o database non inizializzato.

**Soluzione:**
```bash
# Ricrea il database
docker-compose down
docker-compose up -d mysql
# Attendi 30 secondi
docker-compose up -d
```

---

### ❌ Porta già in uso

**Errore:** `Bind for 0.0.0.0:80 failed: port is already allocated`

**Soluzione:** Un altro servizio sta usando la porta 80.

**Opzione A - Ferma l'altro servizio:**
```bash
# Windows: ferma IIS o Apache
# Mac: ferma Apache con: sudo apachectl stop
```

**Opzione B - Cambia porta in docker-compose.yml:**
```yaml
nginx:
  ports:
    - "8080:80"  # Usa porta 8080 invece di 80
```

Poi accedi su http://localhost:8080

---

### ❌ Container si riavvia continuamente

```bash
# Vedi il log per capire l'errore
docker-compose logs <nome-container>

# Esempio
docker-compose logs backend
```

Cerca errori come:
- `Cannot connect to database` → Verifica MySQL
- `ECONNREFUSED` → Verifica che i servizi dipendenti siano up
- `Permission denied` → Problema di permessi (Linux)

---

## 🎓 Prossimi Passi

Ora che l'applicazione è avviata:

1. ✅ **Cambia le password di default** (file .env)
2. ✅ **Crea i tuoi primi utenti** (sezione Utenti → Admin)
3. ✅ **Aggiungi categorie reali** per i tuoi macchinari
4. ✅ **Inserisci i macchinari** del tuo parco macchine
5. ✅ **Stampa i QR code** e applicali sulle macchine
6. ✅ **Carica i documenti** (manuali, certificati, etc.)

---

## 📖 Altre Guide

- **QUICKSTART.md** - Guida rapida 5 minuti
- **README.md** - Documentazione completa
- **Tecnologies.md** - Stack tecnologico
- **core.md** - Funzionalità dell'applicazione

---

## 🆘 Serve Aiuto?

1. Controlla i log: `docker-compose logs -f`
2. Verifica i file `.env`
3. Consulta la sezione Troubleshooting
4. Contatta il team di sviluppo

---

**Buon lavoro con CoreMachine! 🎉**
