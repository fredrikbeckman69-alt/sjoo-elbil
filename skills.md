# Skills & Projektregler (skills.md)

Projektöversikt och riktlinjer för utveckling av applikationen för mätning och uppföljning av **elbilsförbrukning**.

---

## 1. Versionshantering, Driftsättning & Notifiering (Git & GitHub)

- **Alltid driftsätta till Git (Continuous Deployment):**
  - Lokal kod ska alltid speglas kontinuerligt mot GitHub.
  - Varje ändring ska byggas (`npm run build`), committas med beskrivande meddelande (Conventional Commits, t.ex. `feat:`, `fix:`) och omedelbart pushas till remote `main`.
  - Push till `main` triggar GitHub Actions deployment (`.github/workflows/deploy.yml`) till GitHub Pages på: `https://fredrikbeckman69-alt.github.io/sjoo-elbil/`.
- **Bekräfta och meddela när det är live:**
  - Agenten ska alltid invänta eller kontrollera att GitHub Actions-driftsättningen slutförts med framgång.
  - Agenten ska alltid i sitt svar uttryckligen meddela användaren att koden är driftsatt och live på GitHub Pages.
  - Vid frontend-ändringar ska användaren påminnas om webbläsarcache och vid behov instrueras att göra en hård uppdatering (Shift+Reload eller stänga och öppna appfliken).
- **Autentisering & Åtkomst:**
  - Använd samma inloggning och behörighetsprofil till Git/GitHub som till AG (Auto-GPT / Agent / Admin / API Gateway).
  - Se till att SSH-nycklar eller Personal Access Tokens (PAT) är konfigurerade och verifierade för enhetlig autentisering mellan verktygen.

---

## 2. Frontend, Responsivitet & Webbläsarkompatibilitet

- **Mobilanpassning & iOS-fokus:**
  - Gränssnittet ska vara strikt *mobile-first* och optimerat för iOS (iPhone/iPad i Safari och WebView).
  - Ta hänsyn till iOS-specifika gränssnittsdetaljer:
    - Stöd för *Safe Area Insets* (`env(safe-area-inset-top)`, `env(safe-area-inset-bottom)`).
    - Undvik oönskad auto-zoom vid input-fokus genom korrekt fontstorlek ($\ge 16\text{px}$) eller meta-taggar (`viewport-fit=cover`).
    - Smidig touch-interaktion och rätt input-typer för tangentbord (t.ex. `inputmode="decimal"` för kWh och mil).
- **Webbläsarkompatibilitet:**
  - Appen ska fungera felfritt i samtliga moderna webbläsare:
    - Safari (iOS / macOS)
    - Google Chrome (Android / Desktop)
    - Mozilla Firefox
    - Microsoft Edge
  - Undvik icke-standardiserade CSS/JS-API:er utan polyfill eller fallback.

---

## 3. Domänspecifik Logik: Elbilsförbrukning

- **Data och mätvärden:**
  - Enhetlig hantering av energidata:
    - Förbrukning: $\text{kWh/100 km}$ och/eller $\text{kWh/mil}$ (svensk standard).
    - Laddad energi: $\text{kWh}$.
    - Sträcka: $\text{km}$ och mil ($1\text{ mil} = 10\text{ km}$).
    - Kostnad: kr/kWh samt totalkostnad per laddsession och per mil.
- **Funktionella krav:**
  - Loggning av laddsessioner (hemma, snabbladdning/DC, publik AC).
  - Beräkning av snittförbrukning över tid och per körning.
  - Tydliga grafer och sammanställningar som är lätta att läsa av på en mobilskärm.

---

## 4. Utvecklingsstandarder & Kodkvalitet

- **Kodstil:** Ren, modulär och väl dokumenterad kod.
- **Linting & Formatering:** Kör linter och formaterare innan push till remote.
- **Prestanda:** Minimera tunga bundles och optimera laddtider, särskilt för mobila nätverk.

---

## 5. Automatiserad Prisuppdatering & Cron-jobb (En gång i timmen)

- **Frekvens & Schema:**
  - Ett schemalagt cron-jobb ska köras **en gång i timmen** (`0 * * * *` / varje heltimme) för att kontinuerligt kontrollera, hämta och uppdatera marknadspriser.
- **Krav & Omfattning:**
  1. **Laddoperatörernas priser (kr/kWh):**
     - Automatisk avstämning av aktuella snabbladdnings- (DC) och normalladdningstaxor (AC) hos samtliga svenska laddoperatörer:
       - Tesla Supercharger (drop-in, medlemskap samt lågtrafikpriser)
       - IONITY (drop-in samt Passport-avtal)
       - Circle K (drop-in och EXTRA-rabatter)
       - OKQ8 & Skellefteå Kraft
       - Vattenfall InCharge
       - Recharge (f.d. Fortum Charge & Drive)
       - Mer Sweden (Statkraft)
       - Virta, Uno-X, Eviny, E.ON Drive, Allego, Fastned, Elli och St1 / Shell Recharge
     - Uppdaterade priser sparas till appens centrala datakälla (`public/data/operator_prices.json`) och cachas i applikationen.
  2. **Bensinpriser (kr/liter):**
     - Kontinuerlig avstämning av det svenska rikssnittet för Bensin 95 (E10) mot ledande drivmedelsbolags priser (Circle K, OKQ8, Preem, Ingo, St1).
     - Uppdaterat bensinpris sparas till `public/data/fuel_prices.json` för att säkerställa att kalkylatorns jämförelse och besparingsberäkning mot bensinbil alltid är dagsfärsk.
- **Arkitektur & Genomförande:**
  - **Server/CI (GitHub Actions Workflow):**
    - Konfigurerad i `.github/workflows/update-prices.yml` med schema `cron: '0 * * * *'` (en gång i timmen) och `workflow_dispatch` för manuell körning.
    - Exekverar automatiserat prishämtningsskript (`scripts/fetch-prices.mjs`) som hämtar och validerar färska priser, uppdaterar JSON-filerna i `public/data/` och committar/deployar ändringarna automatiskt.
  - **Klient/Applikation:**
    - Appen läser in de senaste priserna vid uppstart (`fetchCurrentPetrolPrice()` och `fetchCurrentOperatorPrices()`).
    - En aktiv bakgrundskontroll med en timmes intervall (`setInterval(..., 3600000)`) samt kontroll vid återkomst till fliken (`visibilitychange`) säkerställer att öppna sessioner automatiskt uppdateras med de senaste priserna.