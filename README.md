# Core Suite

Suite completa di applicazioni e servizi per la gestione aziendale.

## Struttura

```
CoreSuite/
├── CoreServices/     # Servizi condivisi (MySQL, MinIO, Meilisearch, PHPMyAdmin)
├── CoreMachine/      # Gestione parco macchine
├── CoreDocument/     # Gestione documenti DDT arrivo merce
├── docs/             # Documentazione generale
├── scripts/          # Script di utilità
├── start-all.bat     # Avvia tutta la suite
└── stop-all.bat      # Ferma tutta la suite
```

## Avvio Rapido

### Avvia tutto
```bash
start-all.bat
```

### Ferma tutto
```bash
stop-all.bat
```

### Gestione individuale

#### CoreServices
```bash
cd CoreServices
start.bat    # Avvia servizi
stop.bat     # Ferma servizi
logs.bat     # Visualizza log
```

#### CoreMachine
```bash
cd CoreMachine
start.bat    # Avvia applicazione
stop.bat     # Ferma applicazione
build.bat    # Rebuild
logs.bat     # Visualizza log
```

#### CoreDocument
```bash
cd CoreDocument
start.bat    # Avvia applicazione
stop.bat     # Ferma applicazione
build.bat    # Rebuild
logs.bat     # Visualizza log
```

## Servizi Condivisi (CoreServices)

- **MySQL**: Database condiviso - `localhost:3306`
- **PHPMyAdmin**: Gestione database - `http://localhost:8080`
- **MinIO**: Object storage - `http://localhost:9000` (console: `http://localhost:9001`)
- **Meilisearch**: Search engine - `http://localhost:7700`

## Applicazioni

### CoreMachine
Sistema di gestione centralizzata del parco macchine aziendale.
- **Frontend**: `http://localhost`
- **Backend API**: `http://localhost/api`

Vedi `CoreMachine/README.md` per maggiori dettagli.

### CoreDocument
Sistema di gestione documentale per DDT arrivo merce.
- **Frontend**: `http://localhost:81`
- **Backend API**: `http://localhost:81/api`

Funzionalità:
- Upload documenti (PDF, immagini) su MinIO
- Ricerca avanzata con Meilisearch
- Organizzazione per fornitore, data, numero documento
- Gestione preferiti per utente

Vedi `CoreDocument/README.md` per maggiori dettagli.

## Requisiti

- Docker Desktop
- Windows (per gli script .bat)

## Prima Esecuzione

1. Avvia CoreServices:
```bash
cd CoreServices
start.bat
```

2. Crea i database:
```bash
# CoreMachine
docker exec core-mysql mysql -uroot -prootpassword -e "
CREATE DATABASE IF NOT EXISTS coremachine;
CREATE USER IF NOT EXISTS 'coremachine'@'%' IDENTIFIED BY 'password';
GRANT ALL PRIVILEGES ON coremachine.* TO 'coremachine'@'%';
FLUSH PRIVILEGES;
"

# CoreDocument
docker exec core-mysql mysql -uroot -prootpassword -e "
CREATE DATABASE IF NOT EXISTS coredocument;
CREATE USER IF NOT EXISTS 'coredocument'@'%' IDENTIFIED BY 'password';
GRANT ALL PRIVILEGES ON coredocument.* TO 'coredocument'@'%';
FLUSH PRIVILEGES;
"
```

3. Avvia le applicazioni:
```bash
# CoreMachine
cd CoreMachine
start.bat

# CoreDocument
cd CoreDocument
start.bat
```

## Aggiunta di nuove applicazioni

Per aggiungere una nuova applicazione Core* (es. CoreInventory):

1. Crea la cartella `CoreInventory/`
2. Configura il `docker-compose.yml` con `core-network` esterna
3. Crea gli script `start.bat`, `stop.bat`, `logs.bat`
4. Documenta nel README specifico

Tutte le applicazioni Core* condivideranno i servizi di CoreServices.
