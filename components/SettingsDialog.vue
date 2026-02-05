<script setup>
import { ref, onMounted, watch } from 'vue'
import { useMapData } from '~/composables/useMapData'

const { configdialog } = useMapData()

const loading = ref(false)
const saving = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

// Password protection
const isAuthenticated = ref(false)
const password = ref('')
const passwordError = ref('')
const verifyingPassword = ref(false)

// Available options from API
const geofences = ref([])
const devices = ref([])

// Form data
const settings = ref({
  // Traccar API
  traccarUrl: '',
  traccarUser: '',
  traccarPassword: '',
  traccarDeviceId: null,
  traccarDeviceName: '',

  // Google Maps
  googleMapsApiKey: '',

  // WordPress
  wordpressUrl: '',
  wordpressUser: '',
  wordpressAppPassword: '',
  wordpressCacheDuration: 3600,

  // Application
  vueTraccarPassword: '',
  settingsPassword: '',
  homeMode: false,
  homeLatitude: '',
  homeLongitude: '',

  // Home Geofence
  homeGeofenceId: null,
  homeGeofenceName: '',

  // Route Analysis
  eventMinGap: 60,
  maxDays: 170,
  minDays: 2,
  standPeriod: 12,
  startDate: ''
})

// Password visibility toggles
const showPassword = ref({
  traccarPassword: false,
  googleMapsApiKey: false,
  wordpressAppPassword: false,
  vueTraccarPassword: false,
  settingsPassword: false,
  inputPassword: false
})

// Expansion panel state
const expandedPanels = ref([0])

// Verify password
async function verifyPassword() {
  if (!password.value) {
    passwordError.value = 'Password is required'
    return
  }

  verifyingPassword.value = true
  passwordError.value = ''

  try {
    const response = await $fetch('/api/settings/verify-password', {
      method: 'POST',
      body: { password: password.value }
    })

    if (response.valid) {
      isAuthenticated.value = true
      password.value = ''
      await loadSettings()
    } else {
      passwordError.value = 'Invalid password'
      password.value = ''
    }
  } catch (error) {
    console.error('Error verifying password:', error)
    passwordError.value = 'Failed to verify password'
  } finally {
    verifyingPassword.value = false
  }
}

// Load current settings and available options
async function loadSettings() {
  loading.value = true
  errorMessage.value = ''

  try {
    // Load current settings
    const settingsResponse = await $fetch('/api/settings')
    if (settingsResponse.success) {
      settings.value = { ...settingsResponse.settings }
    }

    // Load available devices
    const devicesResponse = await $fetch('/api/devices')
    if (devicesResponse.success) {
      devices.value = devicesResponse.devices
    }

    // Load available geofences
    const geofencesResponse = await $fetch('/api/geofences')
    if (geofencesResponse.success) {
      geofences.value = geofencesResponse.geofences
    }
  } catch (error) {
    console.error('Error loading settings:', error)
    errorMessage.value = 'Failed to load settings. Please try again.'
  } finally {
    loading.value = false
  }
}

// Save settings
async function saveSettings() {
  saving.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const response = await $fetch('/api/settings', {
      method: 'POST',
      body: settings.value
    })

    if (response.success) {
      successMessage.value = 'Settings saved successfully! Please restart the application for changes to take effect.'
    }
  } catch (error) {
    console.error('Error saving settings:', error)
    errorMessage.value = 'Failed to save settings. Please try again.'
  } finally {
    saving.value = false
  }
}

// Update device name when device is selected
function onDeviceSelected(id) {
  const device = devices.value.find(d => d.id === id)
  if (device) {
    settings.value.traccarDeviceName = device.name
  }
}

// Update geofence name when geofence is selected
function onGeofenceSelected(id) {
  const geofence = geofences.value.find(g => g.id === id)
  if (geofence) {
    settings.value.homeGeofenceName = geofence.name
  }
}

// Watch for dialog open
watch(() => configdialog.value, (isOpen) => {
  if (isOpen) {
    // Reset authentication state when opening dialog
    if (!isAuthenticated.value) {
      password.value = ''
      passwordError.value = ''
    }
    successMessage.value = ''
    errorMessage.value = ''
  } else {
    // Reset authentication when closing dialog
    isAuthenticated.value = false
    password.value = ''
    passwordError.value = ''
  }
})
</script>

<template>
  <v-dialog
    v-model="configdialog"
    max-width="800"
    scrollable
  >
    <v-card
      class="bg-surface"
      style="opacity: 0.95;"
    >
      <v-card-title class="text-h5 pa-4 bg-grey-darken-3 sticky-top">
        <v-icon icon="mdi-cog" class="mr-2"></v-icon>
        Application Settings
      </v-card-title>

      <v-card-text class="pa-4" style="max-height: 70vh;">
        <v-container fluid>
          <!-- Password Prompt -->
          <div v-if="!isAuthenticated">
            <v-row>
              <v-col cols="12" class="text-center mb-4">
                <v-icon icon="mdi-lock" size="64" color="primary"></v-icon>
                <div class="text-h6 mt-4">Settings Password Required</div>
                <div class="text-body-2 text-grey mt-2">
                  Enter the settings password to access configuration
                </div>
              </v-col>
            </v-row>

            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="password"
                  label="Settings Password"
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="mdi-lock"
                  :type="showPassword.inputPassword ? 'text' : 'password'"
                  :append-inner-icon="showPassword.inputPassword ? 'mdi-eye-off' : 'mdi-eye'"
                  @click:append-inner="showPassword.inputPassword = !showPassword.inputPassword"
                  @keyup.enter="verifyPassword"
                  :error-messages="passwordError"
                  :disabled="verifyingPassword"
                  autofocus
                ></v-text-field>
              </v-col>
            </v-row>

            <v-row>
              <v-col cols="12" class="text-center">
                <v-btn
                  color="primary"
                  variant="elevated"
                  @click="verifyPassword"
                  :loading="verifyingPassword"
                  :disabled="!password"
                  size="large"
                  class="px-8"
                >
                  <v-icon icon="mdi-login" class="mr-2"></v-icon>
                  Unlock Settings
                </v-btn>
              </v-col>
            </v-row>
          </div>

          <!-- Loading State -->
          <v-row v-else-if="loading">
            <v-col cols="12" class="text-center">
              <v-progress-circular
                indeterminate
                color="primary"
              ></v-progress-circular>
              <div class="mt-2">Loading settings...</div>
            </v-col>
          </v-row>

          <!-- Settings Form -->
          <div v-else>
            <!-- Error Message -->
            <v-row v-if="errorMessage">
              <v-col cols="12">
                <v-alert
                  type="error"
                  variant="tonal"
                  density="compact"
                  closable
                  @click:close="errorMessage = ''"
                >
                  {{ errorMessage }}
                </v-alert>
              </v-col>
            </v-row>

            <!-- Success Message -->
            <v-row v-if="successMessage">
              <v-col cols="12">
                <v-alert
                  type="success"
                  variant="tonal"
                  density="compact"
                  closable
                  @click:close="successMessage = ''"
                >
                  {{ successMessage }}
                </v-alert>
              </v-col>
            </v-row>

            <!-- Settings Sections -->
            <v-expansion-panels v-model="expandedPanels" multiple>
              <!-- 1. Traccar API Settings -->
              <v-expansion-panel value="0">
                <v-expansion-panel-title>
                  <v-icon icon="mdi-api" class="mr-2"></v-icon>
                  Traccar API Configuration
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <v-text-field
                    v-model="settings.traccarUrl"
                    label="Traccar URL"
                    variant="outlined"
                    density="comfortable"
                    prepend-inner-icon="mdi-web"
                    hint="Base URL of your Traccar server"
                    persistent-hint
                    class="mb-3"
                  ></v-text-field>

                  <v-text-field
                    v-model="settings.traccarUser"
                    label="Traccar User"
                    variant="outlined"
                    density="comfortable"
                    prepend-inner-icon="mdi-account"
                    hint="Username or email for Traccar login"
                    persistent-hint
                    class="mb-3"
                  ></v-text-field>

                  <v-text-field
                    v-model="settings.traccarPassword"
                    label="Traccar Password"
                    variant="outlined"
                    density="comfortable"
                    prepend-inner-icon="mdi-lock"
                    :type="showPassword.traccarPassword ? 'text' : 'password'"
                    :append-inner-icon="showPassword.traccarPassword ? 'mdi-eye-off' : 'mdi-eye'"
                    @click:append-inner="showPassword.traccarPassword = !showPassword.traccarPassword"
                    hint="Password for Traccar login"
                    persistent-hint
                    class="mb-3"
                  ></v-text-field>

                  <v-select
                    v-model="settings.traccarDeviceId"
                    :items="devices"
                    item-title="name"
                    item-value="id"
                    label="Traccar Device"
                    variant="outlined"
                    density="comfortable"
                    prepend-inner-icon="mdi-cellphone-link"
                    @update:model-value="onDeviceSelected"
                    hint="Select the device to track"
                    persistent-hint
                  >
                    <template v-slot:item="{ props, item }">
                      <v-list-item v-bind="props">
                        <template v-slot:prepend>
                          <v-icon icon="mdi-cellphone-link" class="mr-2"></v-icon>
                        </template>
                        <v-list-item-title>{{ item.raw.name }}</v-list-item-title>
                        <v-list-item-subtitle>ID: {{ item.raw.id }} | Status: {{ item.raw.status }}</v-list-item-subtitle>
                      </v-list-item>
                    </template>
                  </v-select>
                </v-expansion-panel-text>
              </v-expansion-panel>

              <!-- 2. Google Maps Settings -->
              <v-expansion-panel value="1">
                <v-expansion-panel-title>
                  <v-icon icon="mdi-google-maps" class="mr-2"></v-icon>
                  Google Maps Configuration
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <v-text-field
                    v-model="settings.googleMapsApiKey"
                    label="Google Maps API Key"
                    variant="outlined"
                    density="comfortable"
                    prepend-inner-icon="mdi-key"
                    :type="showPassword.googleMapsApiKey ? 'text' : 'password'"
                    :append-inner-icon="showPassword.googleMapsApiKey ? 'mdi-eye-off' : 'mdi-eye'"
                    @click:append-inner="showPassword.googleMapsApiKey = !showPassword.googleMapsApiKey"
                    hint="API key for Google Maps integration"
                    persistent-hint
                  ></v-text-field>
                </v-expansion-panel-text>
              </v-expansion-panel>

              <!-- 3. WordPress Settings -->
              <v-expansion-panel value="2">
                <v-expansion-panel-title>
                  <v-icon icon="mdi-wordpress" class="mr-2"></v-icon>
                  WordPress Integration
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <v-text-field
                    v-model="settings.wordpressUrl"
                    label="WordPress URL"
                    variant="outlined"
                    density="comfortable"
                    prepend-inner-icon="mdi-web"
                    hint="Base URL of your WordPress site"
                    persistent-hint
                    class="mb-3"
                  ></v-text-field>

                  <v-text-field
                    v-model="settings.wordpressUser"
                    label="WordPress User"
                    variant="outlined"
                    density="comfortable"
                    prepend-inner-icon="mdi-account"
                    hint="WordPress username"
                    persistent-hint
                    class="mb-3"
                  ></v-text-field>

                  <v-text-field
                    v-model="settings.wordpressAppPassword"
                    label="WordPress Application Password"
                    variant="outlined"
                    density="comfortable"
                    prepend-inner-icon="mdi-lock"
                    :type="showPassword.wordpressAppPassword ? 'text' : 'password'"
                    :append-inner-icon="showPassword.wordpressAppPassword ? 'mdi-eye-off' : 'mdi-eye'"
                    @click:append-inner="showPassword.wordpressAppPassword = !showPassword.wordpressAppPassword"
                    hint="WordPress application password (not regular password)"
                    persistent-hint
                    class="mb-3"
                  ></v-text-field>

                  <v-text-field
                    v-model.number="settings.wordpressCacheDuration"
                    label="Cache Duration (seconds)"
                    variant="outlined"
                    density="comfortable"
                    type="number"
                    prepend-inner-icon="mdi-timer-sand"
                    hint="How long to cache WordPress data"
                    persistent-hint
                  ></v-text-field>
                </v-expansion-panel-text>
              </v-expansion-panel>

              <!-- 4. Application Settings -->
              <v-expansion-panel value="3">
                <v-expansion-panel-title>
                  <v-icon icon="mdi-application-cog" class="mr-2"></v-icon>
                  Application Settings
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <v-text-field
                    v-model="settings.vueTraccarPassword"
                    label="App Access Password"
                    variant="outlined"
                    density="comfortable"
                    prepend-inner-icon="mdi-lock"
                    :type="showPassword.vueTraccarPassword ? 'text' : 'password'"
                    :append-inner-icon="showPassword.vueTraccarPassword ? 'mdi-eye-off' : 'mdi-eye'"
                    @click:append-inner="showPassword.vueTraccarPassword = !showPassword.vueTraccarPassword"
                    hint="Password to access this application"
                    persistent-hint
                    class="mb-3"
                  ></v-text-field>

                  <v-text-field
                    v-model="settings.settingsPassword"
                    label="Settings Password"
                    variant="outlined"
                    density="comfortable"
                    prepend-inner-icon="mdi-lock-alert"
                    :type="showPassword.settingsPassword ? 'text' : 'password'"
                    :append-inner-icon="showPassword.settingsPassword ? 'mdi-eye-off' : 'mdi-eye'"
                    @click:append-inner="showPassword.settingsPassword = !showPassword.settingsPassword"
                    hint="Password to access settings dialog"
                    persistent-hint
                    class="mb-3"
                  ></v-text-field>

                  <v-switch
                    v-model="settings.homeMode"
                    label="Home Mode"
                    color="primary"
                    hint="Enable home mode features"
                    persistent-hint
                    class="mb-3"
                  ></v-switch>

                  <v-text-field
                    v-model="settings.homeLatitude"
                    label="Home Latitude"
                    variant="outlined"
                    density="comfortable"
                    prepend-inner-icon="mdi-latitude"
                    hint="Latitude of home location"
                    persistent-hint
                    class="mb-3"
                  ></v-text-field>

                  <v-text-field
                    v-model="settings.homeLongitude"
                    label="Home Longitude"
                    variant="outlined"
                    density="comfortable"
                    prepend-inner-icon="mdi-longitude"
                    hint="Longitude of home location"
                    persistent-hint
                  ></v-text-field>
                </v-expansion-panel-text>
              </v-expansion-panel>

              <!-- 5. Home Geofence Settings -->
              <v-expansion-panel value="4">
                <v-expansion-panel-title>
                  <v-icon icon="mdi-map-marker-radius" class="mr-2"></v-icon>
                  Home Geofence
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <div class="text-body-2 text-grey mb-4">
                    Select the geofence that represents your home base. This is used to determine when travels start and end.
                  </div>

                  <v-select
                    v-model="settings.homeGeofenceId"
                    :items="geofences"
                    item-title="name"
                    item-value="id"
                    label="Home Geofence"
                    variant="outlined"
                    density="comfortable"
                    prepend-inner-icon="mdi-map-marker"
                    @update:model-value="onGeofenceSelected"
                    hint="Geofence marking your home location"
                    persistent-hint
                  >
                    <template v-slot:item="{ props, item }">
                      <v-list-item v-bind="props">
                        <template v-slot:prepend>
                          <v-icon icon="mdi-map-marker" class="mr-2"></v-icon>
                        </template>
                        <v-list-item-title>{{ item.raw.name }}</v-list-item-title>
                        <v-list-item-subtitle>ID: {{ item.raw.id }}</v-list-item-subtitle>
                      </v-list-item>
                    </template>
                  </v-select>

                  <v-alert
                    v-if="settings.homeGeofenceId"
                    type="info"
                    variant="tonal"
                    density="compact"
                    class="mt-3"
                  >
                    <div class="text-body-2">
                      <strong>Selected:</strong> {{ settings.homeGeofenceName }} (ID: {{ settings.homeGeofenceId }})
                    </div>
                  </v-alert>
                </v-expansion-panel-text>
              </v-expansion-panel>

              <!-- 6. Route Analysis Settings -->
              <v-expansion-panel value="5">
                <v-expansion-panel-title>
                  <v-icon icon="mdi-map-search" class="mr-2"></v-icon>
                  Route Analysis Parameters
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <v-text-field
                    v-model.number="settings.eventMinGap"
                    label="Event Min Gap (seconds)"
                    variant="outlined"
                    density="comfortable"
                    type="number"
                    prepend-inner-icon="mdi-timer"
                    hint="Minimum time gap between events"
                    persistent-hint
                    class="mb-3"
                  ></v-text-field>

                  <v-text-field
                    v-model.number="settings.minDays"
                    label="Min Travel Days"
                    variant="outlined"
                    density="comfortable"
                    type="number"
                    prepend-inner-icon="mdi-calendar-range"
                    hint="Minimum days for a trip to be considered"
                    persistent-hint
                    class="mb-3"
                  ></v-text-field>

                  <v-text-field
                    v-model.number="settings.maxDays"
                    label="Max Travel Days"
                    variant="outlined"
                    density="comfortable"
                    type="number"
                    prepend-inner-icon="mdi-calendar-range"
                    hint="Maximum days for a trip to be considered"
                    persistent-hint
                    class="mb-3"
                  ></v-text-field>

                  <v-text-field
                    v-model.number="settings.standPeriod"
                    label="Standstill Period (hours)"
                    variant="outlined"
                    density="comfortable"
                    type="number"
                    prepend-inner-icon="mdi-clock"
                    hint="Minimum hours to detect a standstill"
                    persistent-hint
                    class="mb-3"
                  ></v-text-field>

                  <v-text-field
                    v-model="settings.startDate"
                    label="Analysis Start Date"
                    variant="outlined"
                    density="comfortable"
                    type="datetime-local"
                    prepend-inner-icon="mdi-calendar-start"
                    hint="Starting date for route analysis (ISO format)"
                    persistent-hint
                  ></v-text-field>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>
          </div>
        </v-container>
      </v-card-text>

      <v-card-actions class="pa-4 bg-grey-darken-4">
        <v-spacer></v-spacer>
        <v-btn
          variant="text"
          @click="configdialog = false"
          :disabled="saving || verifyingPassword"
        >
          {{ isAuthenticated ? 'Cancel' : 'Close' }}
        </v-btn>
        <v-btn
          v-if="isAuthenticated"
          color="primary"
          variant="elevated"
          @click="saveSettings"
          :loading="saving"
          :disabled="loading"
        >
          <v-icon icon="mdi-content-save" class="mr-2"></v-icon>
          Save All Settings
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.sticky-top {
  position: sticky;
  top: 0;
  z-index: 1;
}
</style>
