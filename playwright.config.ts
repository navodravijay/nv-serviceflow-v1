import { defineConfig, devices } from '@playwright/test'
import { resolve } from 'node:path'

process.env.PLAYWRIGHT_BROWSERS_PATH ??= resolve('.cache/ms-playwright')

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  workers: 1,
  timeout: 45000,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    channel: 'chromium',
    reducedMotion: 'reduce',
    launchOptions: { args: ['--disable-gpu'] },
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop-chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-chromium', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: `"${process.execPath}" node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port 4173 --strictPort`,
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
  },
})
