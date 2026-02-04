import { ref } from 'vue'
import type { MapCenter, MapMarker } from '~/types/traccar'
import { useTraccar } from './useTraccar'

export const useMapData = () => {
  const { traccarPayload } = useTraccar()

  // Map state
  const polygone = useState<Array<{ lat: number; lng: number }>>('polygone', () => [])
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

  // Loading state
  const isLoading = useState<boolean>('mapLoading', () => false)

  // Render map
  const renderMap = async () => {
    try {
      isLoading.value = true

      const payload = traccarPayload()
      const data = await $fetch('/api/plotmaps', {
        method: 'POST',
        body: payload
      })

      polygone.value = data.polygone
      zoom.value = data.zoom
      center.value = data.center
      distance.value = data.distance
      locations.value = data.locations

      console.log('Map rendered:', {
        polygone: polygone.value.length,
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

    // Loading
    isLoading,

    // Methods
    renderMap
  }
}
