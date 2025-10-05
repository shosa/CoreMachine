# CoreMachine: Scopo e Funzionalità Principali

## 1. Scopo dell'Applicazione

**CoreMachine** è un'applicazione web progettata per la gestione centralizzata e digitalizzata del parco macchine aziendale. L'obiettivo è fornire uno strumento unico per inventariare i macchinari, tracciare la documentazione associata, registrare lo storico degli interventi di manutenzione e programmare le attività future, migliorando l'efficienza, la tracciabilità e la sicurezza operativa.

---

## 2. Aree Funzionali Chiave

L'applicazione si articola nelle seguenti aree funzionali principali:

### A. Anagrafica Macchinari e Classificazione

È il modulo centrale dell'applicazione, che consiste in un inventario dettagliato di ogni macchina e impianto.

-   **Gestione Gerarchica**: L'organizzazione è strutturata su tre livelli per garantire ordine e coerenza:
    1.  **Categorie**: Raggruppamenti di primo livello (es. "CUCITRICI", "PRESSE").
    2.  **Tipologie**: Sotto-raggruppamenti appartenenti a una categoria (es. "LINEARE", "A COLONNA").
    3.  **Macchinario**: La scheda anagrafica del singolo asset.
-   **Dati Macchinario**: Ogni macchina è identificata da dati chiave come `Matricola`, `Descrizione`, `Costruttore`, `Modello`, `Anno di costruzione`, `Data di acquisto`, `Rivenditore` e `Riferimento fattura`.

### B. Gestione Documentale

Questo modulo permette di dematerializzare e centralizzare tutta la documentazione relativa ai macchinari.

-   **Allegati per Macchina**: È possibile associare a ogni macchinario un numero illimitato di file.
-   **Categorizzazione Documenti**: I file possono essere classificati per tipologia (es. "Manuale d'uso", "Certificazione CE", "Scheda Tecnica", "Fattura d'acquisto") per una facile consultazione.

### C. Gestione delle Manutenzioni

Il sistema traccia e gestisce l'intero ciclo di vita della manutenzione.

-   **Registro Interventi (Storico)**: Permette di registrare ogni intervento di manutenzione (ordinario, straordinario, guasto, riparazione) specificando l'operatore, la data, la descrizione del problema, i lavori eseguiti, i ricambi utilizzati e i costi.
-   **Manutenzioni Programmate**: Consente di pianificare interventi di manutenzione ricorrenti basati su una frequenza predefinita (giornaliera, settimanale, mensile, annuale, ecc.), con un sistema di notifiche per le scadenze imminenti.

### D. Accesso Rapido On-Site (QR Code)

Questa funzionalità è progettata per l'operatività sul campo e l'interazione diretta con la macchina.

-   **Generazione QR Code**: Il sistema crea un QR Code univoco per ogni macchinario, da applicare fisicamente su di esso.
-   **Scansione e Accesso**: Scansionando il codice con un dispositivo mobile (smartphone/tablet), un tecnico o un operatore autorizzato accede istantaneamente a una pagina dedicata alla macchina.
-   **Operatività sul Campo**: Da questa pagina è possibile consultare i dati tecnici, lo storico degli interventi e, soprattutto, **registrare un nuovo intervento di manutenzione direttamente dal luogo in cui si trova la macchina**.

### E. Gestione Utenti e Ruoli

Il modulo gestisce l'accesso all'applicazione in modo sicuro e profilato.

-   **Autenticazione**: Accesso al sistema tramite credenziali personali.
-   **Controllo degli Accessi Basato sui Ruoli (RBAC)**: Sono previsti diversi livelli di permesso:
    -   `admin`: Accesso completo a tutte le funzionalità.
    -   `tecnico`: Autorizzato a eseguire e registrare interventi di manutenzione.
    -   `utente`: Accesso in sola lettura alle informazioni.
