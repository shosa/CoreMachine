# 🚀 Guida Rapida CoreMachine

## Setup Iniziale (5 minuti)

### 1. Prerequisiti

Assicurati di avere installato:
- ✅ Docker Desktop (Windows/Mac) o Docker + Docker Compose (Linux)
- ✅ Git

### 2. Clone e Configurazione

```bash
# Clone del repository
git clone <repository-url>
cd CoreMachine

# Copia il file di configurazione
cp .env.example .env

# IMPORTANTE: Modifica il file .env con password sicure!
# Apri .env con un editor di testo e cambia almeno:
# - MYSQL_PASSWORD
# - JWT_SECRET
# - MINIO_ROOT_PASSWORD
# - MEILI_MASTER_KEY
```

### 3. Avvio Applicazione

```bash
# Avvia tutti i servizi
docker-compose up -d

# Attendi che tutti i container siano pronti (30-60 secondi)
docker-compose ps

# Verifica i log se ci sono problemi
docker-compose logs -f
```

### 4. Inizializza il Database

```bash
# Accedi al container backend
docker exec -it coremachine-backend sh

# Esegui le migration del database
npx prisma migrate deploy

# Popola il database con dati di esempio
npm run prisma:seed

# Esci dal container
exit
```

### 5. Accedi all'Applicazione

Apri il browser e vai su: **http://localhost**

Credenziali di accesso:
- **Admin**: `admin@coremachine.com` / `admin123`
- **Tecnico**: `tecnico@coremachine.com` / `tecnico123`

## 🎯 Primi Passi

### 1. Login
Accedi con le credenziali admin

### 2. Esplora i Dati di Esempio
- Dashboard: Panoramica generale
- Macchinari: Visualizza le 2 macchine di esempio
- Categorie: CUCITRICI e PRESSE

### 3. Crea il Tuo Primo Macchinario
1. Vai su **Macchinari**
2. Clicca **Aggiungi Macchinario**
3. Compila i campi e salva

### 4. Genera un QR Code
1. Vai sul dettaglio di un macchinario
2. Clicca **Genera QR Code**
3. Scarica e stampa il QR code
4. Scansionalo con il telefono per testare l'accesso mobile

### 5. Registra una Manutenzione
1. Scansiona il QR code (o visita direttamente `/m/:id`)
2. Compila il form di manutenzione
3. Salva

## 🛠️ Comandi Utili

### Gestione Container

```bash
# Avvia i servizi
docker-compose up -d

# Ferma i servizi
docker-compose down

# Riavvia un servizio specifico
docker-compose restart backend

# Visualizza i log
docker-compose logs -f backend
docker-compose logs -f frontend

# Verifica stato
docker-compose ps
```

### Database

```bash
# Accedi al database MySQL
docker exec -it coremachine-mysql mysql -u coremachine -p

# Prisma Studio (interfaccia grafica per il DB)
docker exec -it coremachine-backend npx prisma studio
# Poi apri http://localhost:5555

# Backup database
docker exec coremachine-mysql mysqldump -u root -p coremachine > backup.sql
```

### Sviluppo Locale

```bash
# Installa dipendenze
npm install

# Avvia solo i servizi infrastrutturali
docker-compose up -d mysql minio meilisearch

# Backend (in un terminale)
cd apps/backend
npm run dev

# Frontend (in un altro terminale)
cd apps/frontend
npm run dev
```

## 📊 Servizi e Porte

| Servizio | URL | Descrizione |
|----------|-----|-------------|
| Frontend | http://localhost | Interfaccia utente |
| Backend API | http://localhost/api | API REST |
| MySQL | localhost:3306 | Database |
| MinIO Console | http://localhost:9001 | Gestione file storage |
| Meilisearch | http://localhost:7700 | Motore di ricerca |

## 🔧 Risoluzione Problemi

### Il frontend non si carica
```bash
# Verifica che tutti i container siano running
docker-compose ps

# Riavvia il frontend
docker-compose restart frontend
```

### Errore di connessione al database
```bash
# Verifica che MySQL sia healthy
docker-compose logs mysql

# Ricrea il database
docker-compose down
docker-compose up -d
```

### Non riesco a fare login
```bash
# Verifica che il seed sia stato eseguito
docker exec -it coremachine-backend npm run prisma:seed
```

### Permessi MinIO
```bash
# Verifica le credenziali nel file .env
# MINIO_ROOT_USER e MINIO_ROOT_PASSWORD devono corrispondere
```

## 🎓 Prossimi Passi

1. **Personalizza le Categorie**: Crea le categorie specifiche per i tuoi macchinari
2. **Aggiungi Utenti**: Crea account per tecnici e operatori
3. **Configura Manutenzioni Programmate**: Imposta le scadenze ricorrenti
4. **Stampa QR Code**: Genera e applica i QR code sui macchinari
5. **Upload Documenti**: Carica manuali, certificati e fatture

## 📖 Documentazione Completa

Per la documentazione completa, consulta [README.md](./README.md)

## 🆘 Supporto

In caso di problemi:
1. Controlla i log: `docker-compose logs -f`
2. Verifica i file `.env`
3. Consulta la sezione Troubleshooting nel README
4. Contatta il team di sviluppo

---

**Buon lavoro con CoreMachine! 🚀**
