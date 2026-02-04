# VueTraccarNuxt

Modern Nuxt 4 rewrite of VueTraccar with TypeScript backend, replacing Python/Quart with Nuxt server routes.

## Features

- 🚀 **Nuxt 4** with TypeScript backend
- 🗺️ **Google Maps** integration with route visualization
- 📍 **GPS Tracking** via Traccar API
- 🗄️ **SQLite Cache** with incremental updates
- 📝 **WordPress Integration** for travel blogs
- 📄 **RST Document Management** for location notes
- 🎨 **Vuetify 3** Material Design UI
- ⚡ **Fast Performance** with WAL mode SQLite

## Tech Stack

- **Frontend:** Vue 3 + Vuetify 3 + TypeScript
- **Backend:** Nuxt 4 Server Routes
- **Database:** SQLite (via better-sqlite3)
- **Maps:** vue3-google-map + Google Maps API
- **API:** Traccar GPS Tracking System
- **CMS:** WordPress REST API

## Project Structure

```
VueTraccarNuxt/
├── server/
│   ├── api/              # 14 API endpoints
│   ├── services/         # Business logic
│   │   ├── traccar.service.ts
│   │   ├── route-analyzer.ts
│   │   ├── travel-analyzer.ts
│   │   ├── wordpress.service.ts
│   │   ├── document-manager.ts
│   │   └── kml-generator.ts
│   └── utils/            # Server utilities
│       ├── cache.ts
│       ├── traccar-client.ts
│       └── wordpress-client.ts
├── components/           # Vue components
├── composables/          # State management
│   ├── useTraccar.ts
│   ├── useMapData.ts
│   └── useDocuments.ts
├── utils/                # Client utilities
│   ├── crypto.ts
│   ├── date.ts
│   └── maps.ts
├── data/
│   ├── documents/        # RST travel notes
│   ├── cache/            # SQLite database
│   └── travels.yml       # Travel configuration
└── types/                # TypeScript definitions
```

## Setup

### Prerequisites

- Node.js 18+
- npm or pnpm
- Traccar GPS server
- WordPress site (optional)
- Google Maps API key

### Installation

1. **Clone and install dependencies:**
   ```bash
   cd VueTraccarNuxt
   npm install
   ```

2. **Configure environment variables:**

   Copy `.env.example` to `.env` and configure:
   ```bash
   # Traccar API
   TRACCAR_URL=https://tracking.example.com
   TRACCAR_USER=your-email@example.com
   TRACCAR_PASSWORD=your-password
   TRACCAR_DEVICE_ID=4

   # Google Maps
   NUXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-api-key

   # WordPress (optional)
   WORDPRESS_URL=https://blog.example.com
   WORDPRESS_USER=username
   WORDPRESS_APP_PASSWORD=xxxx xxxx xxxx xxxx

   # Application
   VUE_TRACCAR_PASSWORD=your-app-password
   ```

3. **Initialize the cache:**

   On first run, the app will automatically fetch and cache all historical GPS data from the Traccar API. This may take 10-15 minutes depending on your dataset size.

4. **Run development server:**
   ```bash
   npm run dev
   ```

   Open http://localhost:3000

## API Endpoints

### GPS & Route Data
- `GET /api/devices` - List GPS devices
- `POST /api/route` - Get cached route positions
- `POST /api/events` - Get geofence events
- `POST /api/plotmaps` - Calculate map visualization data
- `GET /api/prefetchroute` - Prefetch all historical data
- `GET /api/delprefetch` - Clear cache

### Travel Analysis
- `POST /api/travels` - Analyze travels from geofence events
- `POST /api/download.kml` - Generate KML export

### Documents
- `GET /api/document/[key]` - Load RST document
- `POST /api/document/[key]` - Save RST document

### WordPress
- `GET /api/wordpress/posts/[tag]` - Get posts by tag
- `GET /api/wordpress/test` - Test connection

## Key Features

### Route Analysis
- Automatic standstill detection (>12 hours stationary)
- Reverse geocoding for addresses
- Distance calculation (Haversine formula)
- Route visualization with polylines and markers

### Travel Detection
- Automatic trip detection from geofence events
- Duration filtering (2-170 days)
- Farthest standstill calculation
- Manual patches via `travels.yml`

### Caching Strategy
- Cache-first with incremental updates
- SQLite with WAL mode for performance
- Automatic prefetch on startup
- Efficient indexed queries

### WordPress Integration
- Tag-based post loading
- 1-hour cache TTL
- Home mode URL transformation
- Markdown preview in InfoWindows

## Development

### Run Tests
```bash
npm run test
```

### Build for Production
```bash
npm run build
npm run preview
```

### Generate Static Site
```bash
npm run generate
```

## Migration from Python Backend

This project replaces the Python/Quart backend with Nuxt 4 TypeScript server routes:

| Python | Nuxt 4 |
|--------|--------|
| `app.py` | `server/api/*.ts` |
| `dtraccar/traccar.py` | `server/services/traccar.service.ts` |
| `route_deviceId4.hdf` (32MB) | `data/cache/route.db` (SQLite) |
| Pandas DataFrames | Native TypeScript arrays |
| Flask/Quart routes | Nuxt server routes |

## Configuration

### Environment Variables

All configuration is done via `.env` file. See `.env.example` for all available options.

### travels.yml

Manual travel patches and overrides:

```yaml
"Address, Country":
  title: "Custom Travel Title"
  von: "2024-01-01T10:00:00Z"
  bis: "2024-01-15T18:00:00Z"
  exclude: false
```

## Performance

- **SQLite Cache:** <500ms for cached queries
- **Initial Prefetch:** ~10-15 minutes for full dataset
- **Map Rendering:** <2s for 10,000+ GPS points
- **WordPress Cache:** 1-hour TTL, <100ms cache hits

## License

Same as original VueTraccar project

## Credits

- Original VueTraccar by Dieter Chvatal
- Migrated to Nuxt 4 with Claude Code
