# Stack Tecnologico per CoreMachine

Questo documento riepiloga lo stack tecnologico e le pratiche architetturali scelte per lo sviluppo e il deploy dell'applicazione CoreMachine.

L'architettura è basata su un approccio a microservizi containerizzati, pensata per essere robusta, scalabile e manutenibile.

---

### 1. Architettura Generale

-   **Monorepo con `npm workspaces`**: Backend, frontend e librerie condivise sono gestite all'interno di un'unica repository per semplificare lo sviluppo e la gestione delle dipendenze.
-   **Containerizzazione con `Docker`**: Ogni servizio dell'applicazione (backend, frontend, database, ecc.) viene eseguito come un container Docker indipendente.
-   **Orchestrazione con `Docker Compose`**: L'intero stack di servizi viene definito, configurato e gestito tramite un singolo file `docker-compose.yml`, semplificando l'avvio e la gestione dell'ambiente di sviluppo e produzione.

---

### 2. Linguaggio di Sviluppo

-   **TypeScript**: Utilizzato come linguaggio primario sia per il backend che per il frontend. Garantisce coerenza, manutenibilità del codice e sicurezza dei tipi (type-safety) tra client e server.

---

### 3. Backend

-   **Framework**: **NestJS** (basato su Node.js). Scelto per la sua architettura strutturata e modulare, che promuove best practice e si integra nativamente con TypeScript.
-   **Database Primario**: **MySQL**. Il database relazionale per la persistenza dei dati principali dell'applicazione (anagrafiche, manutenzioni, utenti).
-   **ORM**: **Prisma**. Utilizzato per interagire con il database MySQL in modo moderno e completamente type-safe, semplificando le query e la modellazione dei dati.

---

### 4. Frontend

-   **Framework**: **Next.js** (basato su React). Selezionato per le sue elevate performance, le funzionalità di rendering ibrido (Server-Side e Client-Side) e l'eccellente esperienza di sviluppo.
-   **Libreria UI**: **Material-UI (MUI)**. Fornisce una vasta collezione di componenti UI pronti all'uso, di alta qualità e personalizzabili, per accelerare lo sviluppo di interfacce dati complesse.

---

### 5. Servizi di Supporto (Containerizzati)

-   **Reverse Proxy**: **Nginx**. Agisce come unico punto di ingresso per tutto il traffico. Gestisce il routing delle richieste (`/api/*` al backend, il resto al frontend), la terminazione SSL (HTTPS) e il serving di file statici.
-   **Motore di Ricerca**: **Meilisearch**. Un servizio dedicato alla ricerca testuale ultra-veloce. Viene utilizzato per fornire una funzionalità di ricerca "istantanea" e tollerante agli errori, disaccoppiata dal database principale.
-   **File Storage**: **MinIO**. Un object storage self-hosted compatibile con l'API di Amazon S3. Gestisce l'archiviazione di tutti gli allegati (manuali, fatture, documenti) su un volume fisico del server, garantendo che i dati rimangano on-premise ma con i vantaggi di un'architettura moderna.

---

### 6. Pratiche Operative e di Produzione

-   **Sicurezza**:
    -   **HTTPS**: Traffico forzato su HTTPS, con certificati SSL gestiti tramite **Let's Encrypt**.
    -   **Gestione dei Secret**: Password, chiavi API e altre credenziali sono gestite tramite file `.env` e non vengono salvate nel codice sorgente.
-   **Backup e Recovery**:
    -   **Database**: Backup periodici tramite `mysqldump` eseguiti da un cron job.
    -   **Allegati**: Backup periodici del volume Docker utilizzato da MinIO.
    -   I backup vengono archiviati in una posizione esterna al server primario.
-   **Monitoring e Logging**: Per l'osservabilità dell'applicazione, si raccomanda l'implementazione di stack dedicati come **Prometheus + Grafana** per il monitoring delle metriche e **Loki + Grafana** per il logging centralizzato.
-   **Invio Email**: Le funzionalità di notifica (es. manutenzioni, reset password) sono gestite dal backend tramite connessione a un server **SMTP** (aziendale o di terze parti).
