import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  define: {
    // Polyfill global for amazon-cognito-identity-js
    global: 'globalThis',
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.ico',
        'favicons/apple-touch-icon.png',
        'assets/logos/embark-wordmark-black.webp',
        'assets/logos/embark-icon-light.webp',
      ],
      manifest: {
        name: 'Embark Quoting System',
        short_name: 'Embark',
        description: 'Offline-first quoting system for Embark Earthworks',
        theme_color: '#FFB400', // CAT Gold (Design System v2.0)
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: 'favicons/favicon-64x64.png',
            sizes: '64x64',
            type: 'image/png',
          },
          {
            src: 'favicons/favicon-128x128.png',
            sizes: '128x128',
            type: 'image/png',
          },
          {
            src: 'favicons/favicon-256x256.png',
            sizes: '256x256',
            type: 'image/png',
          },
          {
            src: 'favicons/favicon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'favicons/favicon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: 'favicons/apple-touch-icon.png',
            sizes: '180x180',
            type: 'image/png',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/cognito-idp\.ap-southeast-2\.amazonaws\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'cognito-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 1 week
              },
              networkTimeoutSeconds: 10,
            },
          },
        ],
      },
    }),
  ],
  server: {
    port: 3000,
    host: true,
  },
})
