import { createTraccarService } from '../services/traccar.service'
import {
  calculateBounds,
  calculateCenter,
  calculateZoom,
  filterStandstillPeriods,
  cleanStandstillPeriods,
  translateCountry
} from '../services/route-analyzer'
import type { PlotMapsResponse, MapMarker } from '~/types/traccar'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { deviceId, from, to } = body

    if (!deviceId || !from || !to) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing required parameters: deviceId, from, to'
      })
    }

    const traccarService = createTraccarService()

    // Get route data
    const route = await traccarService.getRouteData(deviceId, from, to)

    if (route.length === 0) {
      return {
        bounds: { minLat: 0, maxLat: 0, minLng: 0, maxLng: 0 },
        center: { lat: 0, lng: 0 },
        zoom: 10,
        distance: 0,
        polygone: [],
        locations: []
      }
    }

    // Calculate bounds, center, and zoom
    const bounds = calculateBounds(route)
    const center = calculateCenter(bounds)
    const zoom = calculateZoom(bounds)

    // Get total distance (from last position)
    const distance = route[route.length - 1].totalDistance

    // Create polyline (array of lat/lng)
    const polygone = route.map(p => ({
      lat: p.latitude,
      lng: p.longitude
    }))

    // Get standstill periods
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

    const response: PlotMapsResponse = {
      bounds,
      center,
      zoom,
      distance,
      polygone,
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
