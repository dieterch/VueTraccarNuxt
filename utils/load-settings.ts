import { readFileSync, existsSync } from 'fs'
import { parse as parseYaml } from 'yaml'
import { join } from 'path'

/**
 * Load settings from settings.yml and merge with process.env
 * This allows settings.yml to override .env values
 */
export function loadSettings() {
  try {
    const settingsPath = join(process.cwd(), 'data', 'settings.yml')

    if (!existsSync(settingsPath)) {
      console.log('No settings.yml found, using .env defaults')
      return
    }

    const content = readFileSync(settingsPath, 'utf-8')
    const settings = parseYaml(content) || {}

    // Map settings.yml keys to environment variable names
    const envMapping: Record<string, string> = {
      traccarUrl: 'TRACCAR_URL',
      traccarUser: 'TRACCAR_USER',
      traccarPassword: 'TRACCAR_PASSWORD',
      traccarDeviceId: 'TRACCAR_DEVICE_ID',
      traccarDeviceName: 'TRACCAR_DEVICE_NAME',
      googleMapsApiKey: 'NUXT_PUBLIC_GOOGLE_MAPS_API_KEY',
      wordpressUrl: 'WORDPRESS_URL',
      wordpressUser: 'WORDPRESS_USER',
      wordpressAppPassword: 'WORDPRESS_APP_PASSWORD',
      wordpressCacheDuration: 'WORDPRESS_CACHE_DURATION',
      vueTraccarPassword: 'VUE_TRACCAR_PASSWORD',
      homeMode: 'HOME_MODE',
      homeLatitude: 'HOME_LATITUDE',
      homeLongitude: 'HOME_LONGITUDE',
      homeGeofenceId: 'HOME_GEOFENCE_ID',
      homeGeofenceName: 'HOME_GEOFENCE_NAME',
      eventMinGap: 'EVENT_MIN_GAP',
      maxDays: 'MAX_DAYS',
      minDays: 'MIN_DAYS',
      standPeriod: 'STAND_PERIOD',
      startDate: 'START_DATE'
    }

    // Override process.env with settings from settings.yml
    let overrideCount = 0
    for (const [settingKey, envKey] of Object.entries(envMapping)) {
      if (settings[settingKey] !== undefined && settings[settingKey] !== null) {
        const value = settings[settingKey]
        process.env[envKey] = typeof value === 'boolean' ? String(value) : String(value)
        overrideCount++
      }
    }

    console.log(`Loaded ${overrideCount} settings from settings.yml (overriding .env)`)
  } catch (error) {
    console.error('Error loading settings.yml:', error)
  }
}
