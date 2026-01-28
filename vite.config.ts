import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icon.svg', 'icon-maskable.svg'],
      manifest: {
        name: 'Weston Pharmacy',
        short_name: 'WP',
        description: 'Offline medicine inventory and billing for small pharmacies',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#3B82F6', // Medical blue
        orientation: 'any',
        icons: [
          {
            src: '/icon.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any'
          },
          {
            src: '/icon.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any'
          },
          {
            src: '/icon-maskable.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      },
      devOptions: {
        enabled: true // Enable PWA in dev for testing
      }
    })
  ] as any,
})
