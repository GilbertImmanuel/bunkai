import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig, type Plugin } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self' https://tatoeba.org https://*.tatoeba.org https://openrouter.ai https://api.openai.com https://api.anthropic.com http://127.0.0.1:* http://localhost:*",
  'media-src https://tatoeba.org https://*.tatoeba.org',
  "worker-src 'self'",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'self'",
].join('; ')

function cspPlugin(): Plugin {
  return {
    name: 'inject-content-security-policy',
    apply: 'build',
    transformIndexHtml(html) {
      return {
        html,
        tags: [
          {
            tag: 'meta',
            attrs: {
              'http-equiv': 'Content-Security-Policy',
              content: CONTENT_SECURITY_POLICY,
            },
            injectTo: 'head-prepend',
          },
        ],
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    svelte(),
    cspPlugin(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: null,
      manifest: {
        name: 'Bunkai — Japanese sentence breakdown',
        short_name: 'Bunkai',
        description: 'A desktop-first, local-first Japanese sentence breakdown app.',
        theme_color: '#e7dcc9',
        background_color: '#e7dcc9',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        id: '/',
        lang: 'en',
        dir: 'ltr',
        categories: ['education', 'productivity'],
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,woff2}', 'apple-touch-icon-180x180.png'],
        navigateFallback: '/index.html',
        cleanupOutdatedCaches: true,
        clientsClaim: false,
        skipWaiting: false,
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
})
