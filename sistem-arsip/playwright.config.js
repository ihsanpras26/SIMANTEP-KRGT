import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 30000,
  outputDir: process.env.PLAYWRIGHT_OUTPUT_DIR || 'work/browser-results',
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    headless: true,
    viewport: { width: 1440, height: 1000 },
    launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH },
  },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 4173 --strictPort',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: false,
    env: {
      VITE_SUPABASE_URL: 'https://fixture.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'fixture-anon-key',
      VITE_SUPABASE_PUBLISHABLE_KEY: 'fixture-publishable-key',
      VITE_ADMIN_EMAIL:
        process.env.PLAYWRIGHT_AUTH_ENABLED === 'false'
          ? ''
          : 'admin@example.test',
      VITE_AUTH_ENABLED: process.env.PLAYWRIGHT_AUTH_ENABLED || 'true',
    },
  },
});
