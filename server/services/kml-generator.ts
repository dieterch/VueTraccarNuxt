import type { RoutePosition } from '~/types/traccar'

const KML_COLORS = [
  'ff0000ff', // Red (AABBGGRR format)
  'ffadd8e6', // Light Blue
  'ffc1b6ff', // Light Pink
  'ff90ee90', // Light Green
  'ff00ffff', // Yellow
  'ff00a5ff', // Orange
  'ffff00ff'  // Magenta
]

interface KMLOptions {
  name: string
  maxPoints?: number
}

/**
 * Generate KML file content from route positions
 */
export function generateKML(positions: RoutePosition[], options: KMLOptions): string {
  const { name, maxPoints = 500 } = options

  // Pick random color
  const color = KML_COLORS[Math.floor(Math.random() * KML_COLORS.length)]

  // Convert positions to coordinates
  const coords = positions.map(p => ({
    latitude: p.latitude,
    longitude: p.longitude,
    altitude: p.altitude
  }))

  // Build KML XML
  const lines: string[] = []
  lines.push('<?xml version="1.0" encoding="UTF-8"?>')
  lines.push('<kml xmlns="http://www.opengis.net/kml/2.2">')
  lines.push(`  <Document>`)
  lines.push(`    <name>${escapeXml(name)}</name>`)
  lines.push(`    <open>1</open>`)

  // Shared style
  lines.push(`    <Style id="routeStyle">`)
  lines.push(`      <LineStyle>`)
  lines.push(`        <color>${color}</color>`)
  lines.push(`        <width>4</width>`)
  lines.push(`      </LineStyle>`)
  lines.push(`      <LabelStyle>`)
  lines.push(`        <color>${color}</color>`)
  lines.push(`        <scale>1</scale>`)
  lines.push(`      </LabelStyle>`)
  lines.push(`      <IconStyle>`)
  lines.push(`        <color>${color}</color>`)
  lines.push(`        <scale>1</scale>`)
  lines.push(`        <Icon>`)
  lines.push(`          <href>http://maps.google.com/mapfiles/kml/paddle/pink-stars.png</href>`)
  lines.push(`        </Icon>`)
  lines.push(`      </IconStyle>`)
  lines.push(`    </Style>`)

  // Folder for line strings
  lines.push(`    <Folder>`)
  lines.push(`      <name>LineStrings</name>`)

  // Split into chunks
  const totalPoints = coords.length
  const numChunks = Math.ceil(totalPoints / maxPoints)

  for (let chunkIndex = 0; chunkIndex < numChunks; chunkIndex++) {
    const startIndex = chunkIndex * maxPoints
    const endIndex = Math.min(startIndex + maxPoints, totalPoints)
    const chunkCoords = coords.slice(startIndex, endIndex)

    lines.push(`      <Placemark>`)
    lines.push(`        <name>Route_${chunkIndex}</name>`)
    lines.push(`        <styleUrl>#routeStyle</styleUrl>`)
    lines.push(`        <LineString>`)
    lines.push(`          <altitudeMode>clampToGround</altitudeMode>`)
    lines.push(`          <tessellate>1</tessellate>`)
    lines.push(`          <coordinates>`)

    // Add coordinates (longitude,latitude,altitude)
    for (const coord of chunkCoords) {
      lines.push(`            ${coord.longitude},${coord.latitude},${coord.altitude}`)
    }

    lines.push(`          </coordinates>`)
    lines.push(`        </LineString>`)
    lines.push(`      </Placemark>`)
  }

  lines.push(`    </Folder>`)
  lines.push(`  </Document>`)
  lines.push(`</kml>`)

  return lines.join('\n')
}

/**
 * Escape XML special characters
 */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export function createKMLGenerator() {
  return {
    generate: generateKML
  }
}
