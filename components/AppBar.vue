<script setup>
import { ref, onMounted, mergeProps } from 'vue';
import { useTraccar } from '~/composables/useTraccar';
import { useMapData } from '~/composables/useMapData';
import { setCookie, deleteCookie } from '~/utils/crypto';

const { startdate, stopdate, travel, travels, getTravels, downloadKml, rebuildCache, checkCacheStatus, prefetchRoute } = useTraccar();
const { distance, renderMap, settingsdialog, configdialog, aboutdialog } = useMapData();

const prefetching = ref(false);

function openSettingsDialog() {
    settingsdialog.value = true;
}

function setStartDate(params) {
    startdate.value = params;
}
function setStopDate(params) {
    stopdate.value = params;
}

async function update_travel(item) {
    var index = travels.value.map(function(e) { return e.title; }).indexOf(item);
    console.log('🗺️  Travel selected:', item, 'index:', index);
    console.log('   Travel data:', travels.value[index]);
    travel.value = travels.value[index]
    setCookie('travelindex', String(index), 30)
    startdate.value = new Date(travels.value[index].von);
    stopdate.value = new Date(travels.value[index].bis);
    console.log('   Set startdate to:', startdate.value);
    console.log('   Set stopdate to:', stopdate.value);
    console.log('   Calling renderMap()...');
    renderMap()
}

const menuitems = ref(['Settings', 'About', 'Debug', 'Export als KML', 'Log Out', 'Prefetch again']) //, 'Export als GPX', 'Export als CSV', 'Export als PDF'])
async function domenu(item) {
    switch (item) {
        case 'Settings':
            configdialog.value = true
            break;
        case 'About':
            aboutdialog.value = true
            break;
        case 'Debug':
            openSettingsDialog()
            break;
        case 'Export als KML':
            downloadKml()
            break;
        case 'Log Out':
            deleteCookie('authenticated')
            break;
        case 'Prefetch again':
            await handlePrefetchAgain()
            break;
        case 'Export als GPX':
            //downloadgpx()
            break;
        case 'Export als CSV':
            //downloadcsv()
            break;
        case 'Export als PDF':
            //downloadpdf()
            break;
    }
}

// Handle prefetch again
async function handlePrefetchAgain() {
    prefetching.value = true
    try {
        await rebuildCache()
        await getTravels()
    } catch (error) {
        console.error('Error rebuilding cache:', error)
    } finally {
        prefetching.value = false
    }
}

// Load travels on component mount
onMounted(async () => {
    try {
        // Check if cache exists
        const cacheStatus = await checkCacheStatus()

        if (!cacheStatus.hasCache) {
            // No cache - prefetch first
            console.log('No cache found, prefetching route data...')
            prefetching.value = true
            await prefetchRoute()
            prefetching.value = false
        }

        // Load travels
        await getTravels()
    } catch (error) {
        console.error('Error during initialization:', error)
        prefetching.value = false
    }
})
</script>

<template>
    <!-- Prefetch Loading Overlay -->
    <v-overlay
        v-model="prefetching"
        class="align-center justify-center"
        persistent
        :scrim="true"
    >
        <v-card
            class="pa-8 text-center"
            min-width="400"
        >
            <v-card-text>
                <v-progress-circular
                    indeterminate
                    color="primary"
                    size="64"
                    width="6"
                    class="mb-4"
                ></v-progress-circular>
                <div class="text-h6 mb-2">Rebuilding Route Cache</div>
                <div class="text-body-2 text-grey">
                    Fetching route data from Traccar API...
                </div>
                <div class="text-caption text-grey mt-2">
                    This may take a few moments
                </div>
            </v-card-text>
        </v-card>
    </v-overlay>

    <v-app-bar
        name="menu-bar"
        density="compact"
        color="grey-darken-3"
        :elevation="5"
        >
        <template v-slot:prepend>
            <v-menu location="bottom">
                <template v-slot:activator="{ props: menu }">
                    <v-tooltip open-delay="500">
                        <template v-slot:activator="{ props: tooltip }">
                            <v-app-bar-nav-icon
                            v-bind="mergeProps(menu, tooltip)"
                            nosize="small"
                            >
                            </v-app-bar-nav-icon>
                        </template>
                        <span>Tooltip</span>
                    </v-tooltip>
                </template>
                <v-list density="compact">
                    <v-list-item
                        v-for="(item, index) in menuitems"
                        :key="index"
                        :value="item"
                    >
                        <v-list-item-title @click="domenu(item)">{{ item }}</v-list-item-title>
                    </v-list-item>
                </v-list>
            </v-menu>
            <!--v-app-bar-title class="ml-2">Traccar Viewer</v-app-bar-title-->
        </template>

        <template v-slot:default>
            <v-select
                :label="`${travels.length} Reisen`"
                flat
                density="compact"
                prepend-icon="mdi-dots-vertical"
                v-model="travel"
                :items="travels"
                @update:model-value="update_travel"
                class="mt-5 ml-6 mb-0 pb-0"
            ></v-select>
            <v-chip
                variant="flat"
                color="transparent"
                class="ml-2">
                {{ Math.round(distance) }} km
            </v-chip>
            <DateDialog :key="`start-${startdate}`" :datum="startdate" @getDate="setStartDate"/>
            <DateDialog :key="`stop-${stopdate}`" :datum="stopdate" @getDate="setStopDate"/>
        </template>
        <template v-slot:append>
            <v-btn
                icon="mdi-reload"
                class="ml-2"
                nosize="small"
                @click="renderMap"
            ></v-btn>
            <!--v-btn
                icon="mdi-set-all"
                class="ml-0"
                nosize="small"
                @click="renderMap"
            ></v-btn -->
            <v-btn icon= "mdi-rv-truck" href="https://tagebuch.smallfamilybusiness.net/" size="small"></v-btn>
            <!-- v-menu
                location="bottom"
                >
                <template v-slot:activator="{ props }">
                    <v-btn
                        icon="mdi-palette-swatch"
                        @click="toggleTheme"
                        v-bind="props"
                        size="small"
                    ></v-btn>
                </template>
                <v-list
                    density="compact"
                >
                        <v-list-item
                            v-for="[key, value] of Object.entries(theme.themes.value).filter(filterTheme)"
                            v-bind="props"
                            :key="key"
                            :value="key"
                            :color="isHovering ? 'primary' : 'transparent'"
                            >
                            <v-list-item-title
                                @click="setTheme(key)"
                            >{{ key }}</v-list-item-title>
                        </v-list-item>
                </v-list>
            </v-menu-->
        </template>
    </v-app-bar>
</template>
