import { createVueGoogleMaps } from 'vue3-google-map'

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig()

  const vueGoogleMaps = createVueGoogleMaps({
    load: {
      key: config.public.googleMapsApiKey,
      libraries: ['places', 'geometry'],
    },
  })

  nuxtApp.vueApp.use(vueGoogleMaps)
})
