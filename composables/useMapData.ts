import { ref } from 'vue'
import type { MapCenter, MapMarker, DevicePolyline } from '~/types/traccar'
import { useTraccar } from './useTraccar'

export const useMapData = () => {
  const { traccarPayload } = useTraccar()

  // Map state
  const polygone = useState<Array<{ lat: number; lng: number }>>('polygone', () => [])
  const polylines = useState<DevicePolyline[]>('polylines', () => [])
  const center = useState<MapCenter>('center', () => ({ lat: 0, lng: 0 }))
  const zoom = useState<number>('zoom', () => 10)
  const distance = useState<number>('distance', () => 0)
  const locations = useState<MapMarker[]>('locations', () => [])

  // UI toggles
  const togglemap = useState<boolean>('togglemap', () => true)
  const togglemarkers = useState<boolean>('togglemarkers', () => true)
  const togglepath = useState<boolean>('togglepath', () => true)
  const toggletravels = useState<boolean>('toggletravels', () => false)
  const toggleroute = useState<boolean>('toggleroute', () => false)
  const toggleEvents = useState<boolean>('toggleEvents', () => false)

  // Settings dialog
  const settingsdialog = useState<boolean>('settingsdialog', () => false)

  // Config dialog
  const configdialog = useState<boolean>('configdialog', () => false)

  // About dialog
  const aboutdialog = useState<boolean>('aboutdialog', () => false)

  // Loading state
  const isLoading = useState<boolean>('mapLoading', () => false)

  // Render map
  const renderMap = async () => {
    try {
      isLoading.value = true

      const payload = traccarPayload()

      // Load side trip configuration from settings
      let sideTripConfig = null
      try {
        const settingsResponse = await $fetch('/api/settings')
        if (settingsResponse.success && settingsResponse.settings.sideTripEnabled) {
          sideTripConfig = {
            enabled: settingsResponse.settings.sideTripEnabled,
            devices: settingsResponse.settings.sideTripDevices || []
          }
          console.log('Side trip config loaded:', sideTripConfig)
        }
      } catch (error) {
        console.error('Error loading side trip settings:', error)
        // Continue without side trips
      }

      // Add sideTripConfig to payload
      const apiPayload = {
        ...payload,
        sideTripConfig
      }

      const data = await $fetch('/api/plotmaps', {
        method: 'POST',
        body: apiPayload
      })

      polygone.value = data.polygone
      polylines.value = data.polylines || []
      zoom.value = data.zoom
      center.value = data.center
      distance.value = data.distance
      locations.value = data.locations

      console.log('Map rendered:', {
        polygone: polygone.value.length,
        polylines: polylines.value.length,
        zoom: zoom.value,
        center: center.value,
        distance: distance.value,
        markers: locations.value.length
      })

      return data
    } catch (error) {
      console.error('Error rendering map:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  return {
    // State
    polygone,
    polylines,
    center,
    zoom,
    distance,
    locations,

    // UI Toggles
    togglemap,
    togglemarkers,
    togglepath,
    toggletravels,
    toggleroute,
    toggleEvents,
    settingsdialog,
    configdialog,
    aboutdialog,

    // Loading
    isLoading,

    // Methods
    renderMap
  }
}
