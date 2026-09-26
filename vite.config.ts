import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { execFile } from 'child_process';

function vehicleApiPlugin(): Plugin {
  return {
    name: 'vehicle-api-plugin',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url || !req.url.startsWith('/api/vehicle/')) {
          return next();
        }

        const rawPlate = req.url.replace('/api/vehicle/', '').split('?')[0];
        const regnr = decodeURIComponent(rawPlate).trim().toUpperCase().replace(/[^A-Z0-9]/g, '');

        if (!regnr || regnr.length < 2 || regnr.length > 8) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          return res.end(JSON.stringify({ error: 'Ogiltigt registreringsnummer.' }));
        }

        execFile(
          'curl.exe',
          [
            '-s',
            '-L',
            '-A',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            `https://biluppgifter.se/fordon/${regnr}`,
          ],
          { maxBuffer: 10 * 1024 * 1024 },
          (err, stdout) => {
            res.setHeader('Content-Type', 'application/json; charset=utf-8');

            if (err || !stdout || stdout.length < 500 || stdout.includes('404 Not Found') || stdout.includes('Kunde inte hitta')) {
              res.statusCode = 404;
              return res.end(JSON.stringify({ error: `Fordonet ${regnr} hittades inte i offentliga register.` }));
            }

            res.statusCode = 200;
            return res.end(JSON.stringify({ regnr, rawHtml: stdout }));
          }
        );
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    react(),
    tailwindcss(),
    vehicleApiPlugin(),
  ],
  server: {
    port: 3000,
    open: true
  }
});

