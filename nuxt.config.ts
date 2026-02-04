// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: true },

  devServer: {
    host: '0.0.0.0',
    port: 5999
  },

  css: [
    'vuetify/styles',
    '@mdi/font/css/materialdesignicons.css'
  ],

  build: {
    transpile: ['vuetify'],
  },

  runtimeConfig: {
    // Server-only (private)
    traccarUrl: process.env.TRACCAR_URL,
    traccarUser: process.env.TRACCAR_USER,
    traccarPassword: process.env.TRACCAR_PASSWORD,
    traccarDeviceId: process.env.TRACCAR_DEVICE_ID,
    wordpressUrl: process.env.WORDPRESS_URL,
    wordpressUser: process.env.WORDPRESS_USER,
    wordpressAppPassword: process.env.WORDPRESS_APP_PASSWORD,
    wordpressCacheDuration: process.env.WORDPRESS_CACHE_DURATION || '3600',
    vueTraccarPassword: process.env.VUE_TRACCAR_PASSWORD,
    homeMode: process.env.HOME_MODE === 'true',
    homeLatitude: process.env.HOME_LATITUDE,
    homeLongitude: process.env.HOME_LONGITUDE,
    eventMinGap: parseInt(process.env.EVENT_MIN_GAP || '60'),
    maxDays: parseInt(process.env.MAX_DAYS || '170'),
    minDays: parseInt(process.env.MIN_DAYS || '2'),
    standPeriod: parseInt(process.env.STAND_PERIOD || '12'),
    startDate: process.env.START_DATE || '2019-03-01T00:00:00Z',

    public: {
      // Client-accessible
      googleMapsApiKey: process.env.NUXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    },
  },
})
