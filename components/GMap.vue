<script setup lang="ts">
import { ref, computed, nextTick } from "vue";
import {
  GoogleMap,
  MarkerCluster,
  Marker,
  Polyline,
  InfoWindow,
} from "vue3-google-map";
import { GoogleMapsLink } from "~/utils/maps";
import { useMapData } from "~/composables/useMapData";
import { useDocuments } from "~/composables/useDocuments";
import MDDialog from "./MDDialog.vue";

const config = useRuntimeConfig();
const maps_api_key = config.public.googleMapsApiKey;
const maps_map_id = config.public.googleMapsMapId;

// Debug logging
console.log('GMap component loaded');
console.log('API Key present:', !!maps_api_key);
console.log('API Key length:', maps_api_key?.length);
console.log('Map ID:', maps_map_id);

const { polygone, polylines, sideTripPolylines, center, zoom, locations, togglemarkers, togglepath, isLoading, loadingMessage, fetchSideTrips, clearSideTrips } = useMapData();
const { getDocument } = useDocuments();

// Side trip loading state
const loadingSideTrips = ref<Record<string, boolean>>({});

// Polyline visibility state
const polylineVisibility = ref<Record<string, boolean>>({});

// Computed: visible polylines
const visiblePolylines = computed(() => {
  return polylines.value.filter((polyline, index) =>
    isPolylineVisible(`main-${polyline.deviceId}`)
  )
})

// Computed: visible side trip polylines
const visibleSideTripPolylines = computed(() => {
  return sideTripPolylines.value.filter((polyline, index) =>
    isPolylineVisible(`side-${polyline.deviceId}-${index}`)
  )
})

// Toggle polyline visibility
function togglePolylineVisibility(key: string) {
  // Ensure reactivity by creating a new object
  const current = polylineVisibility.value[key] ?? true
  polylineVisibility.value = {
    ...polylineVisibility.value,
    [key]: !current
  }
  console.log(`Toggled ${key} visibility:`, polylineVisibility.value[key])
}

// Check if polyline is visible (default: true)
function isPolylineVisible(key: string): boolean {
  const visible = polylineVisibility.value[key]
  return visible === undefined ? true : visible
}

// Debug map state
console.log('Initial map state:', {
  center: center.value,
  zoom: zoom.value,
  polygoneLength: polygone.value?.length
});

const flightPath = ref({
  path: polygone.value,
  geodesic: true,
  strokeColor: "#FF0000",
  strokeOpacity: 1.0,
  strokeWeight: 2,
});

const mapRef = ref(null);

function closeInfoWindows() {
  console.log("closeInfoWindows()");
  locations.value.forEach((location) => {
    location.infowindow = false;
  });
}

const mddialog = ref(false);
const mode = ref("light");
const content = ref("");
const file = ref("");
const wordpressPosts = ref({});
const copiedKey = ref(null);

async function openmddialog(key) {
  console.log("openmddialog", key);
  content.value = await getDocument(key);
  file.value = key;
  mddialog.value = true;
}

async function loadWordPressPosts(locationKey) {
  console.log("🔍 Loading posts for:", locationKey);

  try {
    const posts = await $fetch(`/api/wordpress/posts/${locationKey}`);
    
    wordpressPosts.value = {
      ...wordpressPosts.value,
      [locationKey]: posts,
      [locationKey.toLowerCase()]: posts
    };
    
    console.log("✅ Loaded", posts.length, "posts");
    
  } catch (error) {
    console.error("❌ Error:", error);
    wordpressPosts.value = {
      ...wordpressPosts.value,
      [locationKey]: [],
      [locationKey.toLowerCase()]: []
    };
  }
}

async function handleMarkerClick(location) {
  closeInfoWindows();
  location.infowindow = true;

  // Posts parallel laden
  loadWordPressPosts(location.key);

  if (mapRef.value?.map) {
    const map = mapRef.value.map;

    // Schritt 1: Zentriere auf Marker
    map.panTo({
      lat: location.lat,
      lng: location.lng
    });

    // Schritt 2: Warte bis InfoWindow gerendert ist
    await new Promise(resolve => setTimeout(resolve, 350));

    // Schritt 3: Verschiebe Marker nach unten (InfoWindow bleibt sichtbar)
    map.panBy(0, -160);
  }
}

// Load side trips for a specific standstill
async function loadStandstillSideTrips(location) {
  try {
    loadingSideTrips.value[location.key] = true

    // Get enabled side trip devices from settings
    const settingsResponse = await $fetch('/api/settings')
    if (!settingsResponse.success || !settingsResponse.settings.sideTripEnabled) {
      alert('Side trip tracking is not enabled. Please enable it in settings first.')
      return
    }

    const deviceIds = settingsResponse.settings.sideTripDevices
      ?.filter(d => d.enabled)
      .map(d => d.deviceId) || []

    if (deviceIds.length === 0) {
      alert('No secondary devices configured. Please add devices in settings.')
      return
    }

    // Apply time buffer
    const bufferHours = settingsResponse.settings.sideTripBufferHours || 0
    const fromDate = new Date(location.von)
    const toDate = new Date(location.bis)

    fromDate.setHours(fromDate.getHours() - bufferHours)
    toDate.setHours(toDate.getHours() + bufferHours)

    const fromWithBuffer = fromDate.toISOString().slice(0, 16).replace('T', ' ')
    const toWithBuffer = toDate.toISOString().slice(0, 16).replace('T', ' ')

    console.log(`🚴 Loading side trips for ${location.key}`)
    console.log(`   Original period: ${location.von} to ${location.bis}`)
    console.log(`   With ${bufferHours}h buffer: ${fromWithBuffer} to ${toWithBuffer}`)
    console.log(`   Devices:`, deviceIds)

    await fetchSideTrips(fromWithBuffer, toWithBuffer, deviceIds)

    console.log(`✅ Side trips loaded for ${location.key}`)
    console.log(`   sideTripPolylines.value now has ${sideTripPolylines.value.length} polylines`)
    if (sideTripPolylines.value.length > 0) {
      console.log(`   First polyline:`, sideTripPolylines.value[0])
      console.log(`   Path length:`, sideTripPolylines.value[0].path.length)
    }
  } catch (error) {
    console.error('Error loading side trips:', error)
    alert('Failed to load side trips. Check console for details.')
  } finally {
    loadingSideTrips.value[location.key] = false
  }
}

function copyToClipboard(key) {
  console.log("📋 Attempting to copy:", key);

  try {
    // Method 1: Select from input field and copy
    const input = document.getElementById('key-' + key);
    if (input) {
      input.select();
      input.setSelectionRange(0, 99999); // For mobile devices

      const success = document.execCommand('copy');
      if (success) {
        console.log("✅ Copied with execCommand from input");
      } else {
        throw new Error('execCommand failed');
      }
    } else {
      // Method 2: Fallback to textarea
      const textarea = document.createElement('textarea');
      textarea.value = key;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      textarea.setSelectionRange(0, 99999);
      const success = document.execCommand('copy');
      document.body.removeChild(textarea);

      if (!success) {
        throw new Error('execCommand failed');
      }
      console.log("✅ Copied with execCommand fallback");
    }

    // Update UI state
    copiedKey.value = key;

    // Reset after 2 seconds
    setTimeout(() => {
      copiedKey.value = null;
      console.log("🔄 Reset copied state");
    }, 2000);

  } catch (error) {
    console.error("❌ Failed to copy:", error);
    alert(`Konnte Key nicht kopieren: ${key}\nBitte manuell kopieren oder im Textfeld markieren und Strg+C drücken.`);
  }
}
</script>

<template>
  <div style="width: 100%; height: calc(100vh - 48px); position: relative;">
    <!-- Loading Overlay -->
    <div
      v-if="isLoading"
      style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(255,255,255,0.9); display: flex; flex-direction: column; align-items: center; justify-content: center; z-index: 2000; backdrop-filter: blur(2px);"
    >
      <v-progress-circular
        indeterminate
        color="primary"
        size="64"
        width="6"
      ></v-progress-circular>
      <div style="margin-top: 20px; font-size: 1.1em; font-weight: 500; color: #1976d2;">
        {{ loadingMessage }}
      </div>
      <div style="margin-top: 8px; font-size: 0.85em; color: #666; max-width: 400px; text-align: center;">
        This may take a moment for side trips during long travel periods
      </div>
    </div>

    <!-- Debug info -->
    <div v-if="!maps_api_key" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; padding: 20px; border: 2px solid red; z-index: 1000;">
      <h2>Google Maps API Key Missing!</h2>
      <p>Please check your .env file and ensure NUXT_PUBLIC_GOOGLE_MAPS_API_KEY is set.</p>
    </div>

    <GoogleMap
      v-if="maps_api_key"
      ref="mapRef"
      :api-key="maps_api_key"
      :map-id="maps_map_id"
      style="width: 100%; height: 100%"
      :center="center"
      :zoom="zoom"
      @click="closeInfoWindows"
    >
    <!-- Render main device polylines -->
    <template v-if="togglepath && visiblePolylines.length > 0">
      <Polyline
        v-for="(polyline, index) in visiblePolylines"
        :key="`polyline-${polyline.deviceId}-${index}`"
        :options="{
          path: polyline.path,
          geodesic: true,
          strokeColor: polyline.color,
          strokeOpacity: 1.0,
          strokeWeight: polyline.lineWeight,
          zIndex: polyline.isMainDevice ? 100 : 50
        }"
      />
    </template>

    <!-- Render side trip polylines -->
    <template v-if="togglepath && visibleSideTripPolylines.length > 0">
      <Polyline
        v-for="(polyline, index) in visibleSideTripPolylines"
        :key="`sidetrip-${polyline.deviceId}-${index}`"
        :options="{
          path: polyline.path,
          geodesic: true,
          strokeColor: polyline.color,
          strokeOpacity: 0.8,
          strokeWeight: polyline.lineWeight,
          zIndex: 75
        }"
      />
    </template>

    <!-- Fallback to single polyline (backward compatibility) -->
    <Polyline v-else-if="togglepath && polygone.length > 0" :options="flightPath" />

    <!-- Legend for multiple routes -->
    <div
      v-if="togglepath && (polylines.length > 1 || sideTripPolylines.length > 0)"
      style="position: absolute; top: 10px; right: 10px; background: white; padding: 12px; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.3); z-index: 1000; max-width: 250px;"
    >
      <div style="font-weight: 600; font-size: 0.9em; margin-bottom: 4px; color: #333;">
        Routes
        <v-btn
          v-if="sideTripPolylines.length > 0"
          icon="mdi-close"
          size="x-small"
          variant="text"
          @click="clearSideTrips"
          style="float: right;"
          title="Clear side trips"
        ></v-btn>
      </div>
      <div style="font-size: 0.7em; color: #999; margin-bottom: 8px; font-style: italic;">
        Click to show/hide routes
      </div>

      <!-- Main routes -->
      <div
        v-for="polyline in polylines"
        :key="`legend-${polyline.deviceId}`"
        @click="togglePolylineVisibility(`main-${polyline.deviceId}`)"
        :style="{
          display: 'flex',
          alignItems: 'center',
          marginBottom: '6px',
          fontSize: '0.85em',
          cursor: 'pointer',
          padding: '4px 6px',
          borderRadius: '4px',
          backgroundColor: 'transparent',
          opacity: isPolylineVisible(`main-${polyline.deviceId}`) ? 1 : 0.4,
          transition: 'all 0.2s'
        }"
        :title="isPolylineVisible(`main-${polyline.deviceId}`) ? 'Click to hide' : 'Click to show'"
      >
        <div
          :style="{
            width: '20px',
            height: polyline.lineWeight + 'px',
            backgroundColor: polyline.color,
            marginRight: '8px',
            borderRadius: '2px'
          }"
        ></div>
        <span style="color: #666;">
          {{ polyline.deviceName }}
          <span v-if="polyline.isMainDevice" style="color: #999; font-size: 0.9em;">(main)</span>
        </span>
        <v-icon
          :icon="isPolylineVisible(`main-${polyline.deviceId}`) ? 'mdi-eye' : 'mdi-eye-off'"
          size="x-small"
          style="margin-left: auto; opacity: 0.5;"
        ></v-icon>
      </div>

      <!-- Side trip routes -->
      <div
        v-for="(polyline, index) in sideTripPolylines"
        :key="`legend-side-${polyline.deviceId}-${index}`"
        @click="togglePolylineVisibility(`side-${polyline.deviceId}-${index}`)"
        :style="{
          display: 'flex',
          alignItems: 'center',
          marginBottom: '6px',
          fontSize: '0.85em',
          cursor: 'pointer',
          padding: '4px 6px',
          borderRadius: '4px',
          backgroundColor: 'transparent',
          opacity: isPolylineVisible(`side-${polyline.deviceId}-${index}`) ? 0.8 : 0.3,
          transition: 'all 0.2s'
        }"
        :title="isPolylineVisible(`side-${polyline.deviceId}-${index}`) ? 'Click to hide' : 'Click to show'"
      >
        <div
          :style="{
            width: '20px',
            height: polyline.lineWeight + 'px',
            backgroundColor: polyline.color,
            marginRight: '8px',
            borderRadius: '2px'
          }"
        ></div>
        <span style="color: #666;">
          {{ polyline.deviceName }}
          <span style="color: #999; font-size: 0.9em;">(side trip)</span>
        </span>
        <v-icon
          :icon="isPolylineVisible(`side-${polyline.deviceId}-${index}`) ? 'mdi-eye' : 'mdi-eye-off'"
          size="x-small"
          style="margin-left: auto; opacity: 0.5;"
        ></v-icon>
      </div>
    </div>

    <MarkerCluster v-if="togglemarkers">
      <Marker
        v-for="(location, i) in locations"
        :key="i"
        :options="{ position: location }"
        @click="handleMarkerClick(location)"
      >
        <InfoWindow 
          :options="{ 
            position: location, 
            minWidth: 350,
            maxWidth: 400
          }" 
          v-model="location.infowindow"
        >
          <div id="content">
            <div id="siteNotice"></div>
            <h2>{{ location.address.split(",")[0] }}</h2>
            <div id="bodyContent">
              <h4 v-for="(line, i) in location.address.split(',').slice(1)" :key="i">{{ line }}</h4>
              
              <p><a target="_blank" :href="GoogleMapsLink(location.lat, location.lng)">Link zu Google Maps</a></p>

              <table style="width: 100%; text-align: left; margin-top: 5px">
                <tbody>
                  <tr>
                    <th>Lat, Lng</th>
                    <td>{{ location.lat.toFixed(2) }}, {{ location.lng.toFixed(2) }}</td>
                  </tr>
                  <tr>
                    <th>von</th>
                    <td>{{ location.von }}</td>
                  </tr>
                  <tr>
                    <th>bis</th>
                    <td>{{ location.bis }}</td>
                  </tr>
                  <tr>
                    <th>Dauer</th>
                    <td>{{ location.period }}h</td>
                  </tr>
                </tbody>
              </table>

              <div style="margin-top: 15px; border-top: 2px solid #1976d2; padding-top: 15px">
                <h3 style="margin: 0 0 12px 0; font-size: 1.1em; color: #1976d2">📝 Reiseberichte</h3>

                <div v-if="wordpressPosts[location.key] && wordpressPosts[location.key].length > 0">
                  <div v-for="post in wordpressPosts[location.key].slice(0, 3)" :key="post.id" style="margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #e0e0e0">
                    <h4 style="margin: 0 0 5px 0; font-size: 1em">
                      <a :href="post.link" target="_blank" style="color: #1976d2; text-decoration: none; font-weight: 500">{{ post.title.rendered }}</a>
                    </h4>
                    <div style="font-size: 0.85em; color: #666; margin-bottom: 5px">{{ new Date(post.date).toLocaleDateString("de-DE") }}</div>
                    <div style="font-size: 0.9em; line-height: 1.4; color: #333">{{ post.excerpt.rendered.replace(/<[^>]*>/g, '').substring(0, 150) }}...</div>
                  </div>

                  <div v-if="wordpressPosts[location.key].length > 3">
                    <a :href="wordpressPosts[location.key][0].link" target="_blank" style="font-size: 0.9em; color: #1976d2; text-decoration: none">→ Alle {{ wordpressPosts[location.key].length }} Beiträge ansehen</a>
                  </div>
                </div>

                <div v-else-if="wordpressPosts[location.key] && wordpressPosts[location.key].length === 0" style="font-style: italic; color: #999; font-size: 0.9em">Noch keine Reiseberichte für diesen Ort</div>

                <div v-else style="font-style: italic; color: #999; font-size: 0.9em">Lade Reiseberichte...</div>
              </div>

              <div style="margin-top: 15px; border-top: 2px solid #ddd; padding-top: 15px; display: flex; flex-direction: column; gap: 8px;">
                <v-btn color="primary" size="small" @click="openmddialog(location.key)" block>
                  <v-icon icon="mdi-notebook-edit" class="mr-2"></v-icon>
                  zum Tagebuch
                </v-btn>

                <v-btn
                  color="success"
                  variant="elevated"
                  size="small"
                  @click.stop="loadStandstillSideTrips(location)"
                  :loading="loadingSideTrips[location.key]"
                  :disabled="loadingSideTrips[location.key]"
                  block
                >
                  <v-icon icon="mdi-bicycle" class="mr-2"></v-icon>
                  Load Side Trips
                </v-btn>

                <v-btn
                  color="grey-darken-2"
                  variant="outlined"
                  size="small"
                  @click.stop="copyToClipboard(location.key)"
                  block
                >
                  <v-icon icon="mdi-content-copy" class="mr-2"></v-icon>
                  {{ copiedKey === location.key ? '✓ Tag Copied!' : 'Copy WordPress Tag' }}
                </v-btn>
              </div>
            </div>
          </div>
        </InfoWindow>
      </Marker>
    </MarkerCluster>
    </GoogleMap>

    <MDDialog :content="content" :file="file" :mode="mode" :key="mddialog" :dialog="mddialog" @dialog="(e) => { mddialog = e; }" />
  </div>
</template>

<style>
/* InfoWindow Styling - Größe begrenzen */
:deep(.gm-style-iw) {
  max-width: 400px !important;
  max-height: 60vh !important;
}

:deep(.gm-style-iw-c) {
  max-width: 400px !important;
  max-height: 60vh !important;
  padding: 12px !important;
}

:deep(.gm-style-iw-d) {
  max-height: calc(60vh - 60px) !important;
  overflow-y: auto !important;
}

/* Scrollbar */
:deep(.gm-style-iw-d::-webkit-scrollbar) {
  width: 6px;
}

:deep(.gm-style-iw-d::-webkit-scrollbar-track) {
  background: #f1f1f1;
  border-radius: 3px;
}

:deep(.gm-style-iw-d::-webkit-scrollbar-thumb) {
  background: #1976d2;
  border-radius: 3px;
}

:deep(.gm-style-iw-d::-webkit-scrollbar-thumb:hover) {
  background: #1565c0;
}
</style>