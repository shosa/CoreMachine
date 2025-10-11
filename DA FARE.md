# DA FARE - Deploy Automatico CoreSuite

## 🚀 Come Automatizzare il Deploy con GitHub Actions

Quando fai push su `main`, il server Ubuntu fa automaticamente il rebuild dei container.

---

## 📋 Setup Completo (5 Step)

### **Step 1: Genera chiave SSH sul server**

Esegui sul server Ubuntu:

```bash
# Genera coppia chiavi SSH
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github_actions
# IMPORTANTE: Non mettere passphrase (premi solo invio quando chiede)

# Visualizza chiave PUBBLICA (da aggiungere al server)
cat ~/.ssh/github_actions.pub

# Visualizza chiave PRIVATA (da mettere su GitHub)
cat ~/.ssh/github_actions
```

---

### **Step 2: Aggiungi chiave pubblica al server**

Sempre sul server Ubuntu:

```bash
# Aggiungi la chiave pubblica alle authorized_keys
cat ~/.ssh/github_actions.pub >> ~/.ssh/authorized_keys

# Imposta permessi corretti
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh
```

---

### **Step 3: Configura Secrets su GitHub**

1. Vai su **GitHub** → Tuo Repository → **Settings**
2. Nel menu a sinistra: **Secrets and variables** → **Actions**
3. Clicca **"New repository secret"**
4. Aggiungi questi 4 secrets uno per uno:

| Nome Secret | Valore | Dove trovarlo |
|------------|--------|---------------|
| `SSH_PRIVATE_KEY` | Contenuto completo di `~/.ssh/github_actions` dal server | `cat ~/.ssh/github_actions` |
| `SSH_HOST` | IP del server Ubuntu | Es: `192.168.1.100` |
| `SSH_USER` | Username SSH del server | Es: `stefano` o `root` |
| `SSH_PORT` | Porta SSH (di solito 22) | `22` |

**Screenshot secrets su GitHub:**
```
SSH_PRIVATE_KEY = -----BEGIN OPENSSH PRIVATE KEY----- ... -----END OPENSSH PRIVATE KEY-----
SSH_HOST = 192.168.1.100
SSH_USER = stefano
SSH_PORT = 22
```

---

### **Step 4: Crea Workflow GitHub Actions**

#### **Per CoreMachine**

Crea il file: **`.github/workflows/deploy-coremachine.yml`**

```yaml
name: Deploy CoreMachine to Production

on:
  push:
    branches:
      - main
    paths:
      - 'CoreMachine/**'
      - '.github/workflows/deploy-coremachine.yml'

jobs:
  deploy:
    name: Deploy to Ubuntu Server
    runs-on: ubuntu-latest

    steps:
      - name: 🚀 Deploy CoreMachine via SSH
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.SSH_HOST }}
          username: ${{ secrets.SSH_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          port: ${{ secrets.SSH_PORT }}
          script: |
            echo "================================================"
            echo "🔄 Starting CoreMachine deployment..."
            echo "================================================"

            # IMPORTANTE: Modifica questo path con il tuo path reale sul server!
            cd /home/stefano/CoreSuite/CoreMachine

            echo "📥 Pulling latest changes from Git..."
            git pull origin main

            echo "🛑 Stopping containers..."
            docker compose -p coremachine down

            echo "🔨 Building images (no cache)..."
            docker compose -p coremachine build --no-cache

            echo "▶️  Starting containers..."
            docker compose -p coremachine up -d

            echo "⏳ Waiting for services to be ready..."
            sleep 10

            echo "✅ CoreMachine deployment completed!"
            echo "================================================"
            docker compose -p coremachine ps
            echo "================================================"

      - name: ✅ Notify Success
        if: success()
        run: echo "CoreMachine deployed successfully to production!"

      - name: ❌ Notify Failure
        if: failure()
        run: |
          echo "CoreMachine deployment failed!"
          exit 1
```

**⚠️ IMPORTANTE:** Modifica questa riga nel workflow:
```yaml
cd /home/stefano/CoreSuite/CoreMachine
```
Con il **path reale** dove hai CoreSuite sul server!

---

#### **Per CoreDocument (opzionale)**

Crea il file: **`.github/workflows/deploy-coredocument.yml`**

```yaml
name: Deploy CoreDocument to Production

on:
  push:
    branches:
      - main
    paths:
      - 'CoreDocument/**'
      - '.github/workflows/deploy-coredocument.yml'

jobs:
  deploy:
    name: Deploy to Ubuntu Server
    runs-on: ubuntu-latest

    steps:
      - name: 🚀 Deploy CoreDocument via SSH
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.SSH_HOST }}
          username: ${{ secrets.SSH_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          port: ${{ secrets.SSH_PORT }}
          script: |
            echo "================================================"
            echo "🔄 Starting CoreDocument deployment..."
            echo "================================================"

            # IMPORTANTE: Modifica questo path con il tuo path reale!
            cd /home/stefano/CoreSuite/CoreDocument

            echo "📥 Pulling latest changes..."
            git pull origin main

            echo "🛑 Stopping containers..."
            docker compose -p coredocument down

            echo "🔨 Building images..."
            docker compose -p coredocument build --no-cache

            echo "▶️  Starting containers..."
            docker compose -p coredocument up -d

            echo "⏳ Waiting for services..."
            sleep 10

            echo "✅ CoreDocument deployment completed!"
            echo "================================================"
            docker compose -p coredocument ps

      - name: ✅ Notify Success
        if: success()
        run: echo "CoreDocument deployed successfully!"

      - name: ❌ Notify Failure
        if: failure()
        run: |
          echo "CoreDocument deployment failed!"
          exit 1
```

---

### **Step 5: Testa il Deploy Automatico**

```bash
# Sul tuo PC Windows, fai una modifica qualsiasi
cd C:\Users\Stefano\Desktop\CoreSuite

# Esempio: modifica un file
echo "// test deploy" >> CoreMachine/apps/backend/src/main.ts

# Commit e push
git add .
git commit -m "test: trigger automatic deployment"
git push origin main
```

Poi vai su:
- **GitHub** → Tuo Repository → Tab **"Actions"**
- Vedrai il workflow in esecuzione in tempo reale! 🎉

---

## 🎯 Workflow Avanzati (Opzionali)

### **Deploy Solo Backend (più veloce)**

**`.github/workflows/deploy-backend-only.yml`**

```yaml
name: Deploy Backend Only

on:
  push:
    branches:
      - main
    paths:
      - 'CoreMachine/apps/backend/**'

jobs:
  deploy:
    name: Deploy Backend to Production
    runs-on: ubuntu-latest

    steps:
      - name: 🚀 Deploy Backend via SSH
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.SSH_HOST }}
          username: ${{ secrets.SSH_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          port: ${{ secrets.SSH_PORT }}
          script: |
            cd /home/stefano/CoreSuite/CoreMachine

            echo "📥 Pulling changes..."
            git pull origin main

            echo "🔄 Rebuilding backend only..."
            docker compose -p coremachine stop backend
            docker compose -p coremachine rm -f backend
            docker compose -p coremachine build --no-cache backend
            docker compose -p coremachine up -d backend

            echo "✅ Backend deployed!"
            docker logs --tail 50 coremachine-backend
```

### **Deploy Solo Frontend (più veloce)**

**`.github/workflows/deploy-frontend-only.yml`**

```yaml
name: Deploy Frontend Only

on:
  push:
    branches:
      - main
    paths:
      - 'CoreMachine/apps/frontend/**'

jobs:
  deploy:
    name: Deploy Frontend to Production
    runs-on: ubuntu-latest

    steps:
      - name: 🚀 Deploy Frontend via SSH
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.SSH_HOST }}
          username: ${{ secrets.SSH_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          port: ${{ secrets.SSH_PORT }}
          script: |
            cd /home/stefano/CoreSuite/CoreMachine

            echo "📥 Pulling changes..."
            git pull origin main

            echo "🔄 Rebuilding frontend only..."
            docker compose -p coremachine stop frontend
            docker compose -p coremachine rm -f frontend
            docker compose -p coremachine build --no-cache frontend
            docker compose -p coremachine up -d frontend

            echo "✅ Frontend deployed!"
            docker logs --tail 50 coremachine-frontend
```

---

## 📧 Notifiche (Opzionali)

### **Notifiche Discord**

Aggiungi questo step ai workflow:

```yaml
- name: 📢 Send Discord Notification
  uses: sarisia/actions-status-discord@v1
  if: always()
  with:
    webhook: ${{ secrets.DISCORD_WEBHOOK }}
    title: "CoreMachine Deploy"
    description: "Build #${{ github.run_number }}"
    color: 0x00ff00
    username: GitHub Actions
```

**Setup Discord:**
1. Server Discord → Impostazioni Server → Integrazioni → Webhook
2. Crea webhook, copia URL
3. GitHub Secrets → Aggiungi `DISCORD_WEBHOOK` con l'URL

### **Notifiche Email**

```yaml
- name: 📧 Send Email on Failure
  if: failure()
  uses: dawidd6/action-send-mail@v3
  with:
    server_address: smtp.gmail.com
    server_port: 465
    username: ${{ secrets.EMAIL_USERNAME }}
    password: ${{ secrets.EMAIL_PASSWORD }}
    subject: "❌ Deploy Failed: CoreMachine"
    to: stefano@example.com
    from: GitHub Actions
    body: "Il deploy di CoreMachine è fallito. Controlla i log su GitHub Actions."
```

---

## 🔍 Debugging

### **Visualizza log deploy**

- GitHub → Actions → Clicca sul workflow → Espandi gli step

### **Se il deploy fallisce**

Controlla:

```bash
# Sul server, verifica path Git
cd /home/stefano/CoreSuite
pwd
ls -la

# Verifica permessi SSH
ls -la ~/.ssh/

# Testa git pull manuale
cd CoreMachine
git pull origin main

# Verifica Docker
docker compose -p coremachine ps
docker compose version
```

### **Comandi utili sul server**

```bash
# Vedere log deploy in tempo reale
tail -f /var/log/syslog | grep deploy

# Vedere log container
docker logs -f coremachine-backend
docker logs -f coremachine-frontend

# Stato container
docker compose -p coremachine ps

# Restart manuale se serve
docker compose -p coremachine restart
```

---

## ⚠️ Note di Sicurezza

1. ✅ **Mai committare secrets** nel codice
2. ✅ **Usa chiavi SSH dedicate** (non la tua chiave personale)
3. ✅ **Limita accesso SSH** solo all'IP GitHub (opzionale)
4. ✅ **Usa branch protection** su `main`
5. ✅ **Review prima del merge** per deploy critici

### **Limita accesso SSH solo a GitHub (opzionale)**

```bash
# Sul server Ubuntu
sudo nano /etc/ssh/sshd_config

# Aggiungi alla fine:
Match User stefano
  AllowUsers stefano
  AuthorizedKeysFile .ssh/authorized_keys
  PermitRootLogin no

# Restart SSH
sudo systemctl restart sshd
```

---

## 🎉 Risultato Finale

Dopo il setup:

1. **Modifichi codice** sul tuo PC Windows
2. **Fai commit** e push su `main`
3. **GitHub Actions** parte automaticamente
4. **Server Ubuntu** riceve SSH da GitHub
5. **Git pull** delle modifiche
6. **Docker rebuild** automatico
7. **Container riavviati** con nuovo codice
8. **Notifica** di successo/fallimento

**Tempo totale:** ~3-5 minuti per deploy completo! 🚀

---

## 📚 Risorse Utili

- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [SSH Action](https://github.com/appleboy/ssh-action)
- [Docker Compose Docs](https://docs.docker.com/compose/)

---

## 🆘 Supporto

Se qualcosa non funziona:

1. Controlla i log su GitHub Actions
2. Verifica secrets su GitHub (devono essere esatti)
3. Testa SSH manualmente: `ssh -i ~/.ssh/github_actions user@server_ip`
4. Controlla path nel workflow (deve essere corretto)
5. Verifica che Docker Compose funzioni manualmente sul server

---

**Ultimo aggiornamento:** 11 Ottobre 2025
