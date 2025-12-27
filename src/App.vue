<script setup lang="ts">
import { ref } from 'vue'
import { useEditorStore } from '@/stores/editor'
import DropZone from '@/components/DropZone.vue'
import ImageEditor from '@/components/ImageEditor.vue'
import { CanvasEngine } from '@/utils/canvas-engine'
import { Download, RefreshCw, Loader2 } from 'lucide-vue-next'

const store = useEditorStore()
const canvasEngine = new CanvasEngine()
const processedUrl = ref<string | null>(null)

async function handleProcess() {
  if (!store.currentFile || !store.activeMode) return

  store.isProcessing = true
  store.processingProgress = 0
  processedUrl.value = null

  try {
    const url = await canvasEngine.process(store.currentFile, store.activeMode, (progress) => {
      store.processingProgress = Math.round(progress * 100)
    })
    processedUrl.value = url
  } catch (error) {
    console.error('Processing failed:', error)
    alert('Failed to process image')
  } finally {
    store.isProcessing = false
  }
}

function download() {
  if (!processedUrl.value) return
  const a = document.createElement('a')
  a.href = processedUrl.value
  const ext = store.currentFile?.name.endsWith('.gif') ? 'gif' : 'png'
  a.download = `mirror-realm-${Date.now()}.${ext}`
  a.click()
}

function reset() {
  store.clearFile()
  processedUrl.value = null
}
</script>

<template>
  <div
    class="min-h-screen flex flex-col bg-gray-950 text-gray-100 font-sans selection:bg-blue-500/30"
  >
    <header class="border-b border-gray-800 bg-gray-900/50 backdrop-blur-md sticky top-0 z-50">
      <div class="container mx-auto px-4 h-16 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 bg-linear-to-br from-blue-500 to-purple-600 rounded-lg"></div>
          <h1
            class="text-xl font-bold bg-clip-text text-transparent bg-linear-to-r from-blue-400 to-purple-400"
          >
            MirrorRealm
          </h1>
        </div>
        <div class="text-sm text-gray-400">v0.1.0</div>
      </div>
    </header>

    <main class="container mx-auto px-4 py-8 flex-1 flex flex-col">
      <!-- Upload State -->
      <div v-if="!store.currentFile" class="max-w-2xl mx-auto mt-20">
        <div class="text-center mb-12">
          <h2 class="text-4xl font-bold mb-4">Symmetry Reimagined</h2>
          <p class="text-gray-400 text-lg">
            Transform your images and GIFs with 8-way symmetry processing.
            <br />Client-side processing, zero server uploads.
          </p>
        </div>
        <DropZone />
      </div>

      <!-- Editor State -->
      <div v-else class="flex-1 grid lg:grid-cols-3 gap-8">
        <!-- Left: Editor -->
        <div class="lg:col-span-2 flex flex-col gap-4">
          <div class="flex items-center justify-between">
            <h3 class="font-semibold text-gray-300 flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-blue-500"></span>
              Source Image
            </h3>
            <div class="flex gap-2">
              <button
                @click="reset"
                class="px-3 py-1.5 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-md transition-colors flex items-center gap-2 cursor-pointer"
              >
                <RefreshCw class="w-4 h-4" />
                Reset
              </button>
            </div>
          </div>

          <div class="flex-1 min-h-0 bg-gray-900/30 border border-gray-800 rounded-xl p-4">
            <ImageEditor />
          </div>

          <div
            class="flex items-center justify-between bg-gray-900/50 p-4 rounded-xl border border-gray-800"
          >
            <div class="flex flex-col">
              <span class="text-xs text-gray-500 uppercase tracking-wider">Active Mode</span>
              <span class="font-medium text-blue-400">{{ store.activeMode }}</span>
            </div>
            <button
              @click="handleProcess"
              :disabled="store.isProcessing"
              class="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-all flex items-center gap-2 shadow-lg shadow-blue-900/20"
            >
              <Loader2 v-if="store.isProcessing" class="w-4 h-4 animate-spin" />
              {{
                store.isProcessing ? `Processing ${store.processingProgress}%` : 'Generate Mirror'
              }}
            </button>
          </div>
        </div>

        <!-- Right: Preview/Result -->
        <div class="flex flex-col gap-4">
          <h3 class="font-semibold text-gray-300 flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-purple-500"></span>
            Result
          </h3>

          <div
            class="flex-1 bg-gray-900/30 border border-gray-800 rounded-xl p-4 flex items-center justify-center relative overflow-hidden"
          >
            <div v-if="!processedUrl && !store.isProcessing" class="text-center text-gray-500">
              <div
                class="w-16 h-16 border-2 border-gray-800 border-dashed rounded-xl mx-auto mb-4 flex items-center justify-center"
              >
                <span class="text-2xl opacity-20">✨</span>
              </div>
              <p>Select a mode and click Generate</p>
            </div>

            <div v-else-if="store.isProcessing" class="text-center">
              <Loader2 class="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
              <p class="text-blue-400 font-medium">Processing Frames...</p>
              <p class="text-sm text-gray-500 mt-2">{{ store.processingProgress }}%</p>
            </div>

            <img
              v-else
              :src="processedUrl!"
              class="max-w-full max-h-full object-contain shadow-2xl rounded-lg bg-checkerboard"
            />
          </div>

          <button
            v-if="processedUrl"
            @click="download"
            class="w-full py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2 shadow-lg shadow-green-900/20"
          >
            <Download class="w-4 h-4" />
            Download Result
          </button>
        </div>
      </div>
    </main>
  </div>
</template>
