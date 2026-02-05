import { createTraccarService } from '../services/traccar.service'
import {
  calculateBounds,
  calculateCenter,
  calculateZoom,
  filterStandstillPeriods,
  cleanStandstillPeriods,
  translateCountry
} from '../services/route-analyzer'
import type { PlotMapsResponse, MapMarker, DevicePolyline, SideTripDevice, RoutePosition, StandstillPeriod } from '~/types/traccar'

/**
 * Filter positions to only include those within standstill time periods
 */
function filterPositionsByStandstills(
  positions: RoutePosition[],
  standstills: StandstillPeriod[]
): RoutePosition[] {
  if (standstills.length === 0) return []

  const filtered: RoutePosition[] = []

  for (const position of positions) {
    const posTime = new Date(position.fixTime).getTime()

    // Check if position falls within any standstill period
    for (const standstill of standstills) {
      const standstillStart = new Date(standstill.von).getTime()
      const standstillEnd = new Date(standstill.bis).getTime()

      if (posTime >= standstillStart && posTime <= standstillEnd) {
        filtered.push(position)
        break // Position matched, move to next position
      }
    }
  }

  return filtered
}

/**
 * Fetch side trip polylines for secondary devices
 */
async function fetchSideTripPolylines(
  sideTripDevices: SideTripDevice[],
  mainDeviceStandstills: StandstillPeriod[],
  from: string,
  to: string
): Promise<DevicePolyline[]> {
  const traccarService = createTraccarService()
  const polylines: DevicePolyline[] = []

  // Fetch all secondary devices in parallel
  const fetchPromises = sideTripDevices
    .filter(device => device.enabled)
    .map(async (device) => {
      try {
        console.log(`Fetching side trip data for device ${device.deviceId} (${device.deviceName})`)

        // Fetch route data for this device
        const positions = await traccarService.getRouteData(device.deviceId, from, to)

        if (positions.length === 0) {
          console.log(`No positions found for device ${device.deviceId}`)
          return null
        }

        // Filter positions to only include those during standstill periods
        const filteredPositions = filterPositionsByStandstills(positions, mainDeviceStandstills)

        if (filteredPositions.length === 0) {
          console.log(`No positions during standstills for device ${device.deviceId}`)
          return null
        }

        console.log(`Device ${device.deviceId}: ${filteredPositions.length} positions during standstills`)

        // Create polyline path
        const path = filteredPositions.map(p => ({
          lat: p.latitude,
          lng: p.longitude
        }))

        return {
          deviceId: device.deviceId,
          deviceName: device.deviceName,
          color: device.color,
          lineWeight: device.lineWeight,
          path,
          isMainDevice: false
        } as DevicePolyline
      } catch (error) {
        console.error(`Error fetching side trip for device ${device.deviceId}:`, error)
        return null
      }
    })

  const results = await Promise.all(fetchPromises)

  // Filter out null results (failed fetches or empty data)
  for (const result of results) {
    if (result !== null) {
      polylines.push(result)
    }
  }

  return polylines
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { deviceId, from, to, sideTripConfig } = body

    if (!deviceId || !from || !to) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing required parameters: deviceId, from, to'
      })
    }

    const traccarService = createTraccarService()

    // Get main device route data
    const route = await traccarService.getRouteData(deviceId, from, to)

    if (route.length === 0) {
      return {
        bounds: { minLat: 0, maxLat: 0, minLng: 0, maxLng: 0 },
        center: { lat: 0, lng: 0 },
        zoom: 10,
        distance: 0,
        polygone: [],
        polylines: [],
        locations: []
      }
    }

    // Calculate bounds, center, and zoom
    const bounds = calculateBounds(route)
    const center = calculateCenter(bounds)
    const zoom = calculateZoom(bounds)

    // Calculate trip distance (end - start)
    const distance = route[route.length - 1].totalDistance - route[0].totalDistance

    // Create main polyline (array of lat/lng)
    const polygone = route.map(p => ({
      lat: p.latitude,
      lng: p.longitude
    }))

    // Get standstill periods for main device
    let standstills = await traccarService.getStandstillPeriods(deviceId)

    // Filter by time range
    standstills = filterStandstillPeriods(standstills, from, to)

    // Clean/merge nearby standstills
    standstills = cleanStandstillPeriods(standstills)

    // Convert to markers
    const locations: MapMarker[] = standstills.map(s => ({
      key: s.key,
      lat: s.latitude,
      lng: s.longitude,
      title: translateCountry(s.country),
      von: s.von,
      bis: s.bis,
      period: s.period,
      country: translateCountry(s.country),
      address: s.address
    }))

    // Initialize polylines array with main device route
    const polylines: DevicePolyline[] = []

    // Get main device name
    let mainDeviceName = 'Main Device'
    try {
      const devices = await traccarService.getDevices()
      const mainDevice = devices.find(d => d.id === deviceId)
      if (mainDevice) {
        mainDeviceName = mainDevice.name
      }
    } catch (error) {
      console.error('Error fetching device name:', error)
    }

    // Add main device polyline
    polylines.push({
      deviceId,
      deviceName: mainDeviceName,
      color: '#FF0000', // Red for main device
      lineWeight: 2,
      path: polygone,
      isMainDevice: true
    })

    // Fetch side trip polylines if configured
    if (sideTripConfig?.enabled && sideTripConfig?.devices?.length > 0) {
      console.log(`Fetching side trips for ${sideTripConfig.devices.length} secondary devices`)

      // Filter out main device from secondary devices
      const secondaryDevices = sideTripConfig.devices.filter(
        (d: SideTripDevice) => d.deviceId !== deviceId
      )

      if (secondaryDevices.length > 0) {
        const sideTripPolylines = await fetchSideTripPolylines(
          secondaryDevices,
          standstills,
          from,
          to
        )

        polylines.push(...sideTripPolylines)
        console.log(`Added ${sideTripPolylines.length} side trip polylines`)
      }
    }

    const response: PlotMapsResponse = {
      bounds,
      center,
      zoom,
      distance,
      polygone, // Keep for backward compatibility
      polylines,
      locations
    }

    return response
  } catch (error: any) {
    console.error('Error in /api/plotmaps:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Failed to generate plot data'
    })
  }
})
