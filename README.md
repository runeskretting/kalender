# Familiekalender

En privat familiekalender for foreldre og barn. Foreldre kan opprette, redigere og slette alle hendelser. Barn kan opprette egne hendelser og kun slette de de selv har laget.

Applikasjonen kjøres på en VPS via Docker Compose, og bruker Google-innlogging med e-postliste for tilgangskontroll. Fungerer som PWA og kan legges til på hjemskjermen på mobil.

---

## Forutsetninger

- En VPS med **Docker** og **Git** installert
- Et domenenavn pekt mot VPS-ens IP-adresse (A-record)
- En Google-konto for å opprette OAuth-legitimasjon
- Det delte [Caddy-prosjektet](../Caddy/) er satt opp og kjører (håndterer HTTPS for alle applikasjoner på VPS-en)

---

## 1. Google OAuth-oppsett

1. Gå til [Google Cloud Console](https://console.cloud.google.com) og opprett et nytt prosjekt
2. Naviger til **APIs & Services → OAuth consent screen**
   - Velg **External**, fyll inn appnavn og din e-post
   - Under **Test users**: legg til alle e-postadresser som skal ha tilgang
3. Naviger til **APIs & Services → Credentials → Create Credentials → OAuth client ID**
   - Application type: **Web application**
   - Authorized redirect URIs: `https://dittdomene.no/api/auth/callback/google`
4. Kopier **Client ID** og **Client Secret** – du trenger disse i neste steg

---

## 2. Klon repositoriet

```bash
git clone <repo-url> kalender
cd kalender
```

---

## 3. Generer app-ikoner

```bash
bash scripts/generate-icons.sh
```

Krever Docker. Lager placeholder-ikoner i `public/icons/`. Du kan erstatte dem med egne ikoner etterpå.

---

## 4. Konfigurer miljøvariabler

```bash
cp .env.example .env
```

Rediger `.env` og fyll inn alle verdier. Sett deretter riktige filrettigheter så kun din bruker kan lese filen:

```bash
chmod 600 .env
```

> **Merk:** `.env`-filen må **ikke** slettes etter oppstart — Docker Compose leser den ved hver omstart og oppgradering. Den er allerede ekskludert fra Git og Docker-imaget.

```dotenv
# Domenenavn (uten https://)
DOMAIN=kalender.eksempel.no

# Database
POSTGRES_DB=kalender
POSTGRES_USER=kalender_bruker
POSTGRES_PASSWORD=bytt_meg_til_et_sterkt_passord

# Auth.js-hemmelighet – se steg 5
AUTH_SECRET=

# Google OAuth fra steg 1
AUTH_GOOGLE_ID=din_client_id.apps.googleusercontent.com
AUTH_GOOGLE_SECRET=din_client_secret

# Alle e-poster som får lov til å logge inn (kommaseparert)
ALLOWED_EMAILS=forelder1@gmail.com,forelder2@gmail.com,barn1@gmail.com,barn2@gmail.com

# Kun disse e-postene får forelderrettigheter (kan redigere alle hendelser)
PARENT_EMAILS=forelder1@gmail.com,forelder2@gmail.com
```

---

## 5. Generer AUTH_SECRET

Kjør følgende kommando og lim inn resultatet som `AUTH_SECRET` i `.env`:

```bash
docker run --rm node:20-alpine npx --yes auth secret
```

---

## 6. Konfigurer delt Caddy-oppsett

Denne applikasjonen har ingen egen Caddy — en felles Caddy-instans håndterer HTTPS for alle applikasjoner på VPS-en.

**6a. Opprett et delt Docker-nettverk** (kun én gang per VPS):

```bash
docker network create caddy_net
```

**6b. Konfigurer og start Caddy-prosjektet:**

```bash
cd ~/Development/Caddy
cp .env.example .env
# Rediger .env og fyll inn domenene
docker compose up -d
```

---

## 7. Start applikasjonen

```bash
docker compose up -d --build
```

Docker bygger applikasjonen og starter databasen. Caddy i det andre prosjektet håndterer HTTPS automatisk.

Vent til begge tjenester er sunne:

```bash
docker compose ps
```

Begge tjenester (`kalender_db`, `kalender_app`) skal vise `healthy` eller `running`.

---

## 7. Verifisering

Åpne `https://dittdomene.no` i nettleseren. Du skal bli sendt til innloggingssiden.

Logg inn med en av e-postadressene fra `ALLOWED_EMAILS`. Uautoriserte e-poster får en feilmelding og kommer ikke inn.

---

## Oppgradering

For å oppgradere til nyeste versjon med nullnedetid:

```bash
git pull
bash scripts/deploy.sh
```

Scriptet bygger ny Docker-image, starter ny container og venter på at den blir sunn før det er ferdig.

---

## Sikkerhetskopi

To ting må tas backup av for å kunne gjenopprette applikasjonen fullt ut:

### 1. Miljøvariabler (`.env`)

`.env`-filen inneholder hemmeligheter som `AUTH_SECRET`, `POSTGRES_PASSWORD` og `AUTH_GOOGLE_SECRET`. Disse kan ikke gjenskapes uten å ugyldiggjøre eksisterende sesjoner og miste databasetilgangen.

Kopier filen til et sikkert sted utenfor VPS-en (f.eks. en passordhvelv eller kryptert lagring):

```bash
cat .env
```

### 2. Database

```bash
docker exec kalender_db pg_dump -U kalender_bruker kalender > backup_$(date +%Y%m%d).sql
```

Backup-filen inneholder alle hendelser og brukere. Lagre den utenfor VPS-en.

---

## Gjenoppretting

Følg disse stegene for å gjenopprette applikasjonen på en ny eller rebuildet VPS:

**1. Klon repositoriet og gå inn i mappen:**

```bash
git clone <repo-url> kalender
cd kalender
```

**2. Gjenopprett `.env`-filen** fra backup (kopier inn innholdet):

```bash
cp .env.example .env
# Rediger .env og fyll inn alle verdier fra backup
```

**3. Start applikasjonen:**

```bash
docker compose up -d --build
```

**4. Vent til alle containere er sunne:**

```bash
docker compose ps
```

**5. Last inn databasebackup** (erstatt filnavnet med ditt backup):

```bash
docker exec -i kalender_db psql -U kalender_bruker kalender < backup_20240101.sql
```

**6. Verifiser** at data er på plass ved å åpne applikasjonen i nettleseren.

---

## Avinstallasjon

Stopp og slett alle containere, nettverk og data:

```bash
docker compose down -v
```

Slett koden:

```bash
cd ..
rm -rf kalender
```

> **Merk:** `-v` sletter også databasevolumet. Utelat det hvis du vil beholde dataene.

---

## Feilsøking

Se logger for en tjeneste:

```bash
docker compose logs app       # Next.js-applikasjonen
docker compose logs postgres  # Database
```

Logger for Caddy (kjøres fra Caddy-prosjektets mappe):

```bash
docker compose logs caddy
```

Følg logger i sanntid:

```bash
docker compose logs -f app
```

Sjekk helsestatus:

```bash
curl https://dittdomene.no/api/health
```
