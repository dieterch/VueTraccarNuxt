# Troubleshooting Guide

## Common Issues and Solutions

### 1. Google Maps Plugin Error
**Error:** `createVueGoogleMaps is not a function`

**Solution:** Fixed in `plugins/vue3-google-map.client.ts`. Use default import:
```typescript
import VueGoogleMaps from 'vue3-google-map'
```

### 2. HTML Structure Warning
**Warning:** `<tr> cannot be child of <table>`

**Solution:** Fixed in `components/GMap.vue`. Wrap `<tr>` elements in `<tbody>`:
```html
<table>
  <tbody>
    <tr>...</tr>
  </tbody>
</table>
```

### 3. Missing API Key
**Error:** Google Maps fails to load

**Solution:** Verify `.env` file has valid API key:
```bash
NUXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-actual-key
```

### 4. SQLite Database Error
**Error:** Cannot open database file

**Solution:** Ensure `data/cache/` directory exists:
```bash
mkdir -p data/cache
```

### 5. Port Already in Use
**Error:** Port 3000 already in use

**Solution:** Use different port:
```bash
PORT=3001 npm run dev
```

### 6. Traccar Connection Failed
**Error:** Cannot connect to Traccar API

**Solution:** Verify credentials in `.env`:
```bash
TRACCAR_URL=https://your-traccar-server.com
TRACCAR_USER=your-email@example.com
TRACCAR_PASSWORD=your-password
```

### 7. WordPress Integration Issues
**Error:** WordPress posts not loading

**Solution:**
1. Check WordPress URL in `.env`
2. Verify Application Password is correct
3. Test connection: `curl http://localhost:3000/api/wordpress/test`

### 8. Build Warnings About Chunk Size
**Warning:** Some chunks are larger than 500 kB

**Solution:** This is expected for Vuetify components. Can be ignored or adjust in `nuxt.config.ts`:
```typescript
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        vuetify: ['vuetify']
      }
    }
  }
}
```

### 9. Module Not Found Errors
**Error:** Cannot find module '~/composables/...'

**Solution:** Restart dev server:
```bash
# Stop server (Ctrl+C)
rm -rf .nuxt
npm run dev
```

### 10. Authentication Loop
**Issue:** Login screen keeps showing

**Solution:** Check password hash in app.vue. For development, set:
```typescript
const authenticated = ref(true)  // Skip authentication
```

## Development Tips

### Clear Cache and Rebuild
```bash
rm -rf .nuxt .output node_modules/.cache
npm run dev
```

### Check Server Logs
```bash
# In development, server logs appear in terminal
# Look for errors in red
```

### Test API Endpoints Individually
```bash
# Test devices endpoint
curl http://localhost:3000/api/devices

# Test WordPress
curl http://localhost:3000/api/wordpress/test

# Test document loading
curl http://localhost:3000/api/document/marker123456789
```

### Verify Environment Variables
```bash
# Check if env vars are loaded
node -e "console.log(process.env.TRACCAR_URL)"
```

## Production Deployment

### Before Deploying
1. Test build: `npm run build`
2. Test preview: `npm run preview`
3. Verify all API endpoints work
4. Check SQLite database exists and has data

### Environment Setup
- Copy `.env` to production server
- Update URLs to production values
- Ensure database directory is writable

### Performance Checklist
- [ ] SQLite indexes created (automatic)
- [ ] WAL mode enabled (automatic)
- [ ] Cache directory exists
- [ ] All historical data prefetched

## Getting Help

If you encounter issues not covered here:

1. Check browser console for JavaScript errors
2. Check server terminal for API errors
3. Verify `.env` configuration
4. Test individual API endpoints with curl
5. Check Traccar server is accessible

## Debugging Mode

Enable debug mode in `components/DebugDialog.vue` to see:
- Current travel data
- Route positions
- Events
- Map state

Access via hamburger menu → "Debug"
