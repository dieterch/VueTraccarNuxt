import { writeFile } from 'fs/promises'
import { stringify as stringifyYaml } from 'yaml'
import { join } from 'path'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)

    // Build settings object with all provided values
    const settings: any = {}

    // Traccar API
    if (body.traccarUrl) settings.traccarUrl = body.traccarUrl
    if (body.traccarUser) settings.traccarUser = body.traccarUser
    if (body.traccarPassword) settings.traccarPassword = body.traccarPassword
    if (body.traccarDeviceId) settings.traccarDeviceId = parseInt(body.traccarDeviceId)
    if (body.traccarDeviceName) settings.traccarDeviceName = body.traccarDeviceName

    // Google Maps
    if (body.googleMapsApiKey) settings.googleMapsApiKey = body.googleMapsApiKey
    if (body.googleMapsMapId) settings.googleMapsMapId = body.googleMapsMapId

    // WordPress
    if (body.wordpressUrl) settings.wordpressUrl = body.wordpressUrl
    if (body.wordpressUser) settings.wordpressUser = body.wordpressUser
    if (body.wordpressAppPassword) settings.wordpressAppPassword = body.wordpressAppPassword
    if (body.wordpressCacheDuration) settings.wordpressCacheDuration = parseInt(body.wordpressCacheDuration)

    // Application
    if (body.vueTraccarPassword) settings.vueTraccarPassword = body.vueTraccarPassword
    if (body.settingsPassword) settings.settingsPassword = body.settingsPassword
    if (body.homeMode !== undefined) settings.homeMode = body.homeMode
    if (body.homeLatitude) settings.homeLatitude = body.homeLatitude
    if (body.homeLongitude) settings.homeLongitude = body.homeLongitude

    // Home Geofence
    if (body.homeGeofenceId) settings.homeGeofenceId = parseInt(body.homeGeofenceId)
    if (body.homeGeofenceName) settings.homeGeofenceName = body.homeGeofenceName

    // Route Analysis
    if (body.eventMinGap) settings.eventMinGap = parseInt(body.eventMinGap)
    if (body.maxDays) settings.maxDays = parseInt(body.maxDays)
    if (body.minDays) settings.minDays = parseInt(body.minDays)
    if (body.standPeriod) settings.standPeriod = parseInt(body.standPeriod)
    if (body.startDate) settings.startDate = body.startDate

    // Side Trip Tracking
    if (body.sideTripEnabled !== undefined) settings.sideTripEnabled = body.sideTripEnabled
    if (body.sideTripDevices !== undefined) settings.sideTripDevices = body.sideTripDevices

    const yamlPath = join(process.cwd(), 'data', 'settings.yml')
    const yamlContent = stringifyYaml(settings)

    await writeFile(yamlPath, yamlContent, 'utf-8')

    console.log('Settings saved:', settings)

    return {
      success: true,
      message: 'Settings saved successfully',
      settings
    }
  } catch (error: any) {
    console.error('Error saving settings:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to save settings'
    })
  }
})
