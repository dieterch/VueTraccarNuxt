# Map Debugging Guide

## Added Debug Features

I've added debug logging and visual indicators to help diagnose the map issue.

## What to Check

### 1. Browser Console (F12 → Console)

Look for these debug messages:
```
GMap component loaded
API Key present: true/false
API Key length: 39  (should be around 39 characters)
Initial map state: { center: {...}, zoom: 10, polygoneLength: ... }
```

### 2. Visual Indicators

**If you see a red box with "Google Maps API Key Missing!"**
- The API key is not being loaded from .env
- Solution: Check `.env` file has `NUXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-key`

**If you see blank white space**
- API key is loaded but map not rendering
- Check browser console for Google Maps API errors

### 3. Network Tab (F12 → Network)

Filter for "maps" and look for:
- ✅ `https://maps.googleapis.com/maps/api/js?...` should be 200 OK
- ❌ If 403 Forbidden: API key invalid or not authorized
- ❌ If 400 Bad Request: API key format wrong

### 4. Common Issues

**Issue: "Google Maps JavaScript API error: InvalidKeyMapError"**
- Solution: Your API key is invalid
- Verify key at: https://console.cloud.google.com/apis/credentials

**Issue: "Google Maps JavaScript API error: RefererNotAllowedMapError"**
- Solution: Add your domain to API key restrictions
- In Google Cloud Console → API Key → Application restrictions

**Issue: Map container has zero height**
- Check CSS in DevTools
- The container should be `height: calc(100vh - 48px)`

**Issue: Map shows but is gray/blank**
- Center or zoom might be invalid
- Check console for center/zoom values

## Quick Test Checklist

Run through these checks in order:

1. **Check .env file**
   ```bash
   cat .env | grep GOOGLE_MAPS
   ```
   Should show: `NUXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIza...`

2. **Restart dev server** (to pick up .env changes)
   ```bash
   npm run dev
   ```

3. **Open browser console** (F12)
   - Look for "GMap component loaded" message
   - Check API Key present: should be `true`

4. **Check Network tab**
   - Look for Google Maps API requests
   - Should see 200 OK status

5. **Inspect HTML**
   - Right-click on map area → Inspect
   - Should see `<div class="vue-google-map">` or similar

## Expected Working State

When working correctly, you should see:

**Console:**
```
GMap component loaded
API Key present: true
API Key length: 39
Initial map state: { center: { lat: 0, lng: 0 }, zoom: 10, polygoneLength: 0 }
Map rendered: { polygone: 1234, zoom: 12.5, center: {...}, distance: 567, markers: 89 }
```

**Network:**
- Multiple requests to `maps.googleapis.com` with 200 status

**Visual:**
- Map with satellite/street view tiles
- Route polyline (red line)
- Marker clusters with location pins

## Manual API Key Test

Test if your API key works directly:

1. Open this URL in browser (replace YOUR_KEY):
   ```
   https://maps.googleapis.com/maps/api/js?key=YOUR_KEY
   ```

2. Should get JavaScript code, not an error

3. If error, fix API key in Google Cloud Console

## Still Not Working?

If map still not visible after all checks:

1. **Share console output** - Copy all messages from browser console
2. **Share network errors** - Screenshot Network tab filtered for "maps"
3. **Check element** - Right-click map area → Inspect → Share HTML structure
4. **Verify .env** - Share (masked) API key length and format

## Temporary Workaround

If you need to test without fixing the map immediately, you can disable the map:

In `app.vue`, add:
```vue
<div v-if="false">
  <GMap v-if="togglemap" :key="polygone" />
</div>
```

This will hide the map and let you test other features.
