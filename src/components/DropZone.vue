<script setup lang="ts">
import { ref } from 'vue'
import { UploadCloud } from 'lucide-vue-next'
import { useEditorStore } from '@/stores/editor'

const editorStore = useEditorStore()
const isDragging = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

function triggerFileInput() {
  fileInput.value?.click()
}

function onDrop(e: DragEvent) {
  isDragging.value = false
  const file = e.dataTransfer?.files[0]
  if (file && (file.type.startsWith('image/') || /\.(gif|jpe?g|png|webp|svg)$/i.test(file.name))) {
    editorStore.setFile(file)
  }
}

function onFileSelect(e: Event) {
  const input = e.target as HTMLInputElement
  if (input.files!.length > 0) {
    editorStore.setFile(input.files![0]!)
  }
}
</script>

<template>
  <div
    class="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-300"
    :class="[
      isDragging
        ? 'border-blue-500 bg-blue-500/10'
        : 'border-gray-600 hover:border-gray-500 bg-gray-800/50 hover:bg-gray-800',
    ]"
    @dragover.prevent="isDragging = true"
    @dragleave.prevent="isDragging = false"
    @drop.prevent="onDrop"
    @click="triggerFileInput"
  >
    <input ref="fileInput" type="file" class="hidden" accept="image/*" @change="onFileSelect" />

    <UploadCloud class="w-12 h-12 mb-4 text-gray-400" />
    <p class="mb-2 text-sm text-gray-400">
      <span class="font-semibold">Click to upload</span> or drag and drop
    </p>
    <p class="text-xs text-gray-500">SVG, PNG, JPG or GIF</p>
  </div>
</template>
