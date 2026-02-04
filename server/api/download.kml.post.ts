import { createTraccarService } from '../services/traccar.service'
import { generateKML } from '../services/kml-generator'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { deviceId, from, to, name } = body

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
      throw createError({
        statusCode: 404,
        statusMessage: 'No route data found for specified period'
      })
    }

    // Generate KML
    const kmlName = name || `Route_${from}_${to}`
    const kmlContent = generateKML(route, {
      name: kmlName,
      maxPoints: 500
    })

    // Set headers for file download
    setResponseHeaders(event, {
      'Content-Type': 'application/vnd.google-earth.kml+xml',
      'Content-Disposition': `attachment; filename="${kmlName}.kml"`
    })

    return kmlContent
  } catch (error: any) {
    console.error('Error in /api/download.kml:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Failed to generate KML'
    })
  }
})
