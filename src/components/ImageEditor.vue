<script setup lang="ts">
import { ref, computed } from 'vue'
import { useEditorStore } from '@/stores/editor'
import type { SymmetryMode } from '@/utils/symmetry'
import { SYMMETRY_CONFIG } from '@/utils/symmetry'
import type { CSSProperties } from 'vue'

const store = useEditorStore()
const containerRef = ref<HTMLDivElement | null>(null)
const imageRef = ref<HTMLImageElement | null>(null)

// Grid interaction state
const previewMode = ref<SymmetryMode | null>(null)
const effectiveMode = computed(() => previewMode.value || store.activeMode)

// Calculate grid zones based on mouse position
function handleMouseMove(e: MouseEvent) {
  if (!containerRef.value || !imageRef.value) return

  const rect = imageRef.value.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  const w = rect.width
  const h = rect.height

  // Check if outside image
  if (x < 0 || x > w || y < 0 || y > h) {
    previewMode.value = null
    return
  }

  // Calculate normalized mouse position
  const nx = x / w
  const ny = y / h

  let minDist = Infinity
  let bestMode: SymmetryMode | null = null

  for (const [mode, config] of Object.entries(SYMMETRY_CONFIG)) {
    const dx = (config.center.x - nx) / config.source.w
    const dy = (config.center.y - ny) / config.source.h
    const dist = dx * dx + dy * dy // Squared distance
    if (dist < minDist) {
      minDist = dist
      bestMode = mode as SymmetryMode
    }
  }

  previewMode.value = bestMode
}

function handleClick() {
  if (previewMode.value) {
    store.activeMode = previewMode.value
  }
}

// Visual feedback styles
const overlayStyle = computed<CSSProperties>(() => {
  if (!effectiveMode.value) return {}

  const isPreview = previewMode.value !== null && previewMode.value !== store.activeMode
  const config = SYMMETRY_CONFIG[effectiveMode.value]

  return {
    position: 'absolute',
    backgroundColor: isPreview ? 'rgba(168, 85, 247, 0.4)' : 'rgba(59, 130, 246, 0.3)', // Purple for preview, Blue for active
    pointerEvents: 'none',
    transition: 'all 0.2s ease',
    border: isPreview ? '2px solid rgba(168, 85, 247, 0.8)' : 'none',
    left: `${config.source.x * 100}%`,
    top: `${config.source.y * 100}%`,
    width: `${config.source.w * 100}%`,
    height: `${config.source.h * 100}%`,
  }
})

// Main Image Style (Clipping)
const mainImageStyle = computed(() => {
  if (!effectiveMode.value) return {}

  const config = SYMMETRY_CONFIG[effectiveMode.value]
  const { x, y, w, h } = config.source

  // Convert normalized coordinates to percentages for polygon
  const x1 = x * 100
  const y1 = y * 100
  const x2 = (x + w) * 100
  const y2 = (y + h) * 100

  const clipPath = `polygon(${x1}% ${y1}%, ${x2}% ${y1}%, ${x2}% ${y2}%, ${x1}% ${y2}%)`

  return {
    clipPath,
  }
})

// Ghost Preview Logic
interface GhostLayer {
  container: Record<string, string>
  image: Record<string, string>
}

const ghosts = computed<GhostLayer[]>(() => {
  if (!effectiveMode.value) return []

  const config = SYMMETRY_CONFIG[effectiveMode.value]
  const { w: sw, h: sh } = config.source

  return config.mirrors.map((mirror) => {
    // Container position and size (Target Area)
    // mirror.x/y is the top-left of the target area
    // sw/sh is the size of the target area (same as source)
    const cx = mirror.x * 100
    const cy = mirror.y * 100
    const cw = sw * 100
    const ch = sh * 100

    return {
      container: {
        position: 'absolute',
        left: `${cx}%`,
        top: `${cy}%`,
        width: `${cw}%`,
        height: `${ch}%`,
        overflow: 'hidden',
        pointerEvents: 'none',
      },
      image: {
        position: 'absolute',
        width: `${100 * (100 / cw)}%`,
        height: `${100 * (100 / ch)}%`,
        // Offset the image to align with the container.
        // Since the container is positioned at `mirror.x` (relative to root),
        // we need to shift the inner image back by the same amount to align the coordinate systems.
        // The shift is relative to the container's width (`sw`), so the formula is:
        // - (mirror.x / source.w) * 100%
        left: `${-(mirror.x / sw) * 100}%`,
        top: `${-(mirror.y / sh) * 100}%`,
        maxWidth: 'none',
        maxHeight: 'none',
        transform: `scale(${mirror.scaleX}, ${mirror.scaleY})`,
        transformOrigin: 'center center',
      },
    }
  })
})
</script>

<template>
  <div
    class="relative flex justify-center items-center w-full h-full bg-gray-900/50 rounded-lg overflow-hidden p-4"
  >
    <div
      ref="containerRef"
      class="relative inline-block shadow-2xl cursor-pointer bg-checkerboard"
      @mousemove="handleMouseMove"
      @mouseleave="previewMode = null"
      @click="handleClick"
    >
      <!-- Main Image -->
      <img
        ref="imageRef"
        :src="store.fileUrl || ''"
        class="max-h-[70vh] max-w-full object-contain block"
        :style="mainImageStyle"
        alt="Source"
      />

      <!-- Ghost Preview Layers -->
      <div v-for="(ghost, i) in ghosts" :key="i" :style="ghost.container">
        <img :src="store.fileUrl || ''" :style="ghost.image" alt="" />
      </div>

      <!-- Active Source Highlight -->
      <div :style="overlayStyle">
        <div class="absolute inset-0 flex items-center justify-center">
          <span
            class="bg-black/50 text-white text-xs px-2 py-1 rounded backdrop-blur-sm text-center"
          >
            {{ previewMode && previewMode !== store.activeMode ? 'Click to Select' : 'Source' }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
