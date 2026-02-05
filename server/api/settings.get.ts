import { readFile } from 'fs/promises'
import { parse as parseYaml } from 'yaml'
import { join } from 'path'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()

  try {
    const yamlPath = join(process.cwd(), 'data', 'settings.yml')
    const content = await readFile(yamlPath, 'utf-8')
    const data = parseYaml(content) || {}

    return {
      success: true,
      settings: {
        // Traccar API
        traccarUrl: data.traccarUrl || config.traccarUrl,
        traccarUser: data.traccarUser || config.traccarUser,
        traccarPassword: data.traccarPassword || config.traccarPassword,
        traccarDeviceId: data.traccarDeviceId || config.traccarDeviceId,
        traccarDeviceName: data.traccarDeviceName || config.traccarDeviceName,

        // Google Maps
        googleMapsApiKey: data.googleMapsApiKey || config.public.googleMapsApiKey,

        // WordPress
        wordpressUrl: data.wordpressUrl || config.wordpressUrl,
        wordpressUser: data.wordpressUser || config.wordpressUser,
        wordpressAppPassword: data.wordpressAppPassword || config.wordpressAppPassword,
        wordpressCacheDuration: data.wordpressCacheDuration || config.wordpressCacheDuration,

        // Application
        vueTraccarPassword: data.vueTraccarPassword || config.vueTraccarPassword,
        settingsPassword: data.settingsPassword || config.settingsPassword,
        homeMode: data.homeMode !== undefined ? data.homeMode : config.homeMode,
        homeLatitude: data.homeLatitude || config.homeLatitude,
        homeLongitude: data.homeLongitude || config.homeLongitude,

        // Home Geofence
        homeGeofenceId: data.homeGeofenceId || config.homeGeofenceId,
        homeGeofenceName: data.homeGeofenceName || config.homeGeofenceName,

        // Route Analysis
        eventMinGap: data.eventMinGap || config.eventMinGap,
        maxDays: data.maxDays || config.maxDays,
        minDays: data.minDays || config.minDays,
        standPeriod: data.standPeriod || config.standPeriod,
        startDate: data.startDate || config.startDate,
      }
    }
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      // Settings file doesn't exist, return defaults from .env
      return {
        success: true,
        settings: {
          // Traccar API
          traccarUrl: config.traccarUrl,
          traccarUser: config.traccarUser,
          traccarPassword: config.traccarPassword,
          traccarDeviceId: config.traccarDeviceId,
          traccarDeviceName: config.traccarDeviceName,

          // Google Maps
          googleMapsApiKey: config.public.googleMapsApiKey,

          // WordPress
          wordpressUrl: config.wordpressUrl,
          wordpressUser: config.wordpressUser,
          wordpressAppPassword: config.wordpressAppPassword,
          wordpressCacheDuration: config.wordpressCacheDuration,

          // Application
          vueTraccarPassword: config.vueTraccarPassword,
          settingsPassword: config.settingsPassword,
          homeMode: config.homeMode,
          homeLatitude: config.homeLatitude,
          homeLongitude: config.homeLongitude,

          // Home Geofence
          homeGeofenceId: config.homeGeofenceId,
          homeGeofenceName: config.homeGeofenceName,

          // Route Analysis
          eventMinGap: config.eventMinGap,
          maxDays: config.maxDays,
          minDays: config.minDays,
          standPeriod: config.standPeriod,
          startDate: config.startDate,
        }
      }
    }

    console.error('Error loading settings:', error)
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to load settings'
    })
  }
})
