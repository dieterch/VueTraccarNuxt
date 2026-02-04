import { createTraccarService } from '../services/traccar.service'

export default defineEventHandler(async (event) => {
  try {
    const traccarService = createTraccarService()
    const devices = await traccarService.getDevices()

    return devices
  } catch (error) {
    console.error('Error in /api/devices:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch devices'
    })
  }
})
