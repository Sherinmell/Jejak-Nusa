import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: process.env.NODE_ENV !== 'production' },
  css: ['~/assets/css/main.css'],
  vite: {
    plugins: [tailwindcss()]
  },
  nitro: {
    compressPublicAssets: true
  },
  routeRules: {
    '/_nuxt/**': { headers: { 'cache-control': 'public, max-age=31536000, immutable' } },
    '/api/trips': { headers: { 'cache-control': 'public, max-age=30, stale-while-revalidate=120' } },
    '/api/hotels': { headers: { 'cache-control': 'public, max-age=30, stale-while-revalidate=120' } }
  },
  typescript: {
    strict: true,
    typeCheck: false
  },
  runtimeConfig: {
    tidbHost: process.env.TIDB_HOST || 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com',
    tidbPort: Number(process.env.TIDB_PORT || 4000),
    tidbUser: process.env.TIDB_USER || '',
    tidbPassword: process.env.TIDB_PASSWORD || '',
    tidbDatabase: process.env.TIDB_DATABASE || 'jejaknusa',
    tidbSsl: process.env.TIDB_SSL !== 'false'
  },
  app: {
    head: {
      title: 'JejakNusa — Marketplace Open Trip & Pemandu Lokal Terverifikasi',
      htmlAttrs: {
        lang: 'id'
      },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'theme-color', content: '#1f6f6d' },
        {
          name: 'description',
          content:
            'Temukan open trip petualangan Indonesia — trekking, canyoning, diving, dan caving bersama pemandu lokal terverifikasi dengan kalkulator split bill instan.'
        }
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'preconnect', href: 'https://images.unsplash.com' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap'
        }
      ]
    }
  }
})
