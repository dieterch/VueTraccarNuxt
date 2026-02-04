import VueGoogleMaps from 'vue3-google-map'

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig()

  nuxtApp.vueApp.use(VueGoogleMaps, {
    load: {
      key: config.public.googleMapsApiKey,
      libraries: 'places,geometry',
    },
  })
})
