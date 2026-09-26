# Skills & Projektregler (skills.md)

Projektöversikt och riktlinjer för utveckling av applikationen för mätning och uppföljning av **elbilsförbrukning**.

---

## 1. Versionshantering & Synkronisering (Git & GitHub)

- **Lokal spegling mot GitHub:**
  - Lokal kod och branches ska alltid speglas kontinuerligt mot GitHub.
  - Skapa frekventa, atomiska commits med beskrivande meddelanden (Conventional Commits rekommenderas, t.ex. `feat:`, `fix:`, `refactor:`).
  - Pusha ändringar till remote repository regelbundet så att ingen kod riskerar att gå förlorad eller hamna i osynk.
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