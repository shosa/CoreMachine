# Deploy su Server Ubuntu

Guida completa per il deploy di CoreSuite su server Ubuntu con Docker.

## Prerequisiti Server

### 1. Installa Docker
```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
```
Logout e login per applicare i permessi.

### 2. Verifica installazione
```bash
docker --version
docker compose version
```

## Deploy Manuale

### Step 1: Trasferisci i file

Dalla tua macchina Windows, copia l'intera cartella sul server:

```bash
# Usando SCP (da Windows con Git Bash o WSL)
scp -r C:\Users\Stefano\Desktop\CoreMachine user@YOUR_SERVER_IP:/home/user/CoreSuite

# Oppure usando SFTP client come WinSCP o FileZilla
```

### Step 2: Connettiti al server
```bash
ssh user@YOUR_SERVER_IP
cd /home/user/CoreSuite
```

### Step 3: Configura le variabili d'ambiente

#### CoreServices
```bash
cd CoreServices
cp .env.production .env
nano .env
```

Modifica:
- `MYSQL_ROOT_PASSWORD` - Password root MySQL (usa una password forte!)
- `MYSQL_PASSWORD` - Password utente coremachine
- `MINIO_ROOT_PASSWORD` - Password MinIO
- `MEILI_MASTER_KEY` - Master key Meilisearch

#### CoreMachine
```bash
cd ../CoreMachine
cp .env.production .env
nano .env
```

Modifica:
- Stesse password di CoreServices (devono combaciare!)
- `JWT_SECRET` - Chiave segreta JWT (genera una stringa lunga e casuale)
- `APP_URL` - Sostituisci `YOUR_SERVER_IP` con l'IP del server (es: `http://192.168.1.100`)
- `NEXT_PUBLIC_API_URL` - Stesso IP + `/api` (es: `http://192.168.1.100/api`)

### Step 4: Rendi eseguibile lo script deploy
```bash
cd ..
chmod +x deploy.sh
```

### Step 5: Esegui il deploy
```bash
./deploy.sh
```

Lo script farà automaticamente:
1. ✅ Verifica Docker
2. ✅ Avvia CoreServices (MySQL, MinIO, Meilisearch, PHPMyAdmin)
3. ✅ Crea database CoreMachine
4. ✅ Avvia CoreMachine (Backend, Frontend, Nginx)
5. ✅ Mostra gli URL di accesso

## Accesso all'applicazione

Dopo il deploy, accedi da qualsiasi computer nella rete:

- **Frontend**: `http://YOUR_SERVER_IP`
- **Backend API**: `http://YOUR_SERVER_IP/api`
- **PHPMyAdmin**: `http://YOUR_SERVER_IP:8080`
- **MinIO Console**: `http://YOUR_SERVER_IP:9001`
- **Meilisearch**: `http://YOUR_SERVER_IP:7700`

### Credenziali di accesso

**PHPMyAdmin**:
- Username: `root`
- Password: quella impostata in `MYSQL_ROOT_PASSWORD`

**MinIO Console**:
- Username: `minioadmin`
- Password: quella impostata in `MINIO_ROOT_PASSWORD`

**CoreMachine**:
- Email: `stefano.solidoro@mgmshoes.it`
- Password: la tua password esistente

## Gestione Post-Deploy

### Vedere i log
```bash
# Tutti i log
cd CoreServices && docker compose -p coreservices logs -f
cd CoreMachine && docker compose -p coremachine logs -f

# Solo un servizio
docker logs -f core-mysql
docker logs -f coremachine-backend
```

### Fermare tutto
```bash
cd CoreMachine && docker compose -p coremachine down
cd CoreServices && docker compose -p coreservices down
```

### Riavviare tutto
```bash
cd CoreServices && docker compose -p coreservices up -d
cd CoreMachine && docker compose -p coremachine up -d
```

### Aggiornare il codice
```bash
# 1. Trasferisci i nuovi file dal tuo PC
# 2. Rebuild e restart
cd CoreMachine
docker compose -p coremachine build --no-cache
docker compose -p coremachine up -d
```

## Firewall (se necessario)

Se il server ha un firewall attivo, apri le porte necessarie:

```bash
# UFW (Ubuntu)
sudo ufw allow 80/tcp      # HTTP
sudo ufw allow 443/tcp     # HTTPS
sudo ufw allow 3306/tcp    # MySQL (solo se serve accesso esterno)
sudo ufw allow 8080/tcp    # PHPMyAdmin
sudo ufw allow 9000/tcp    # MinIO API
sudo ufw allow 9001/tcp    # MinIO Console
sudo ufw allow 7700/tcp    # Meilisearch
```

## Backup

### Backup database
```bash
docker exec core-mysql mysqldump -uroot -p${MYSQL_ROOT_PASSWORD} coremachine > backup_$(date +%Y%m%d).sql
```

### Backup volumi Docker
```bash
docker run --rm \
  -v core-mysql-data:/data \
  -v $(pwd):/backup \
  ubuntu tar czf /backup/mysql-data-backup.tar.gz /data
```

## Troubleshooting

### Container non si avvia
```bash
# Verifica i log
docker logs CONTAINER_NAME

# Verifica lo stato
docker ps -a
```

### Backend non si connette a MySQL
```bash
# Verifica che MySQL sia pronto
docker exec core-mysql mysql -uroot -p${MYSQL_ROOT_PASSWORD} -e "SELECT 1"

# Verifica le credenziali nel .env
```

### Frontend non chiama l'API corretta
```bash
# Rebuild del frontend con le nuove variabili d'ambiente
cd CoreMachine
docker compose -p coremachine build --no-cache frontend
docker compose -p coremachine up -d frontend
```

## Produzione con HTTPS e Dominio

Per usare un dominio (es: `coremachine.tuodominio.com`) con HTTPS:

1. **Punta il dominio all'IP del server** (via DNS)

2. **Installa Certbot per SSL**:
```bash
sudo apt install certbot
sudo certbot certonly --standalone -d coremachine.tuodominio.com
```

3. **Aggiorna nginx.conf** per usare i certificati SSL

4. **Aggiorna .env**:
```bash
APP_URL=https://coremachine.tuodominio.com
NEXT_PUBLIC_API_URL=https://coremachine.tuodominio.com/api
```

5. **Rebuild e restart**:
```bash
cd CoreMachine
docker compose -p coremachine build --no-cache
docker compose -p coremachine up -d
```

## Note di Sicurezza

⚠️ **IMPORTANTE per produzione**:

1. ✅ Cambia TUTTE le password di default
2. ✅ Usa password complesse (min 20 caratteri)
3. ✅ Non esporre porte database (3306) su internet
4. ✅ Usa HTTPS con certificati SSL
5. ✅ Configura backup automatici
6. ✅ Limita accesso SSH solo a IP fidati
7. ✅ Aggiorna regolarmente Docker e le immagini

```bash
# Aggiorna immagini Docker
docker compose -p coreservices pull
docker compose -p coremachine pull
docker compose -p coreservices up -d
docker compose -p coremachine up -d
```
