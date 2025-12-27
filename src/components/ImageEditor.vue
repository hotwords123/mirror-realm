<script setup lang="ts">
import { ref, computed } from 'vue'
import { useEditorStore } from '@/stores/editor'
import type { SymmetryMode } from '@/types'

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

  // Define centers for all 8 modes (normalized coordinates 0-1)
  // We calculate distance to the center of the "Source Area" for each mode
  const targets: { mode: SymmetryMode; x: number; y: number }[] = [
    { mode: 'left-to-right', x: 0.25, y: 0.5 }, // Left Half Center
    { mode: 'right-to-left', x: 0.75, y: 0.5 }, // Right Half Center
    { mode: 'top-to-bottom', x: 0.5, y: 0.25 }, // Top Half Center
    { mode: 'bottom-to-top', x: 0.5, y: 0.75 }, // Bottom Half Center
    { mode: 'tl-to-all', x: 0.25, y: 0.25 }, // TL Quadrant Center
    { mode: 'tr-to-all', x: 0.75, y: 0.25 }, // TR Quadrant Center
    { mode: 'bl-to-all', x: 0.25, y: 0.75 }, // BL Quadrant Center
    { mode: 'br-to-all', x: 0.75, y: 0.75 }, // BR Quadrant Center
  ]

  let minDist = Infinity
  let bestMode: SymmetryMode | null = null

  for (const t of targets) {
    const dx = t.x - nx
    const dy = t.y - ny
    const dist = dx * dx + dy * dy // Squared distance
    if (dist < minDist) {
      minDist = dist
      bestMode = t.mode
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
const overlayStyle = computed(() => {
  if (!effectiveMode.value) return {}

  const isPreview = previewMode.value !== null && previewMode.value !== store.activeMode

  const style: Record<string, string> = {
    position: 'absolute',
    backgroundColor: isPreview ? 'rgba(168, 85, 247, 0.4)' : 'rgba(59, 130, 246, 0.3)', // Purple for preview, Blue for active
    pointerEvents: 'none',
    transition: 'all 0.2s ease',
    border: isPreview ? '2px solid rgba(168, 85, 247, 0.8)' : 'none',
  }

  switch (effectiveMode.value) {
    case 'left-to-right':
      return { ...style, left: '0', top: '0', width: '50%', height: '100%' }
    case 'right-to-left':
      return { ...style, left: '50%', top: '0', width: '50%', height: '100%' }
    case 'top-to-bottom':
      return { ...style, left: '0', top: '0', width: '100%', height: '50%' }
    case 'bottom-to-top':
      return { ...style, left: '0', top: '50%', width: '100%', height: '50%' }
    case 'tl-to-all':
      return { ...style, left: '0', top: '0', width: '50%', height: '50%' }
    case 'tr-to-all':
      return { ...style, left: '50%', top: '0', width: '50%', height: '50%' }
    case 'bl-to-all':
      return { ...style, left: '0', top: '50%', width: '50%', height: '50%' }
    case 'br-to-all':
      return { ...style, left: '50%', top: '50%', width: '50%', height: '50%' }
    default:
      throw new Error('Invalid symmetry mode for overlay')
  }
})

// Main Image Style (Clipping)
const mainImageStyle = computed(() => {
  if (!effectiveMode.value) return {}

  let clipPath = ''
  switch (effectiveMode.value) {
    case 'left-to-right':
      clipPath = 'polygon(0 0, 50% 0, 50% 100%, 0 100%)'
      break
    case 'right-to-left':
      clipPath = 'polygon(50% 0, 100% 0, 100% 100%, 50% 100%)'
      break
    case 'top-to-bottom':
      clipPath = 'polygon(0 0, 100% 0, 100% 50%, 0 50%)'
      break
    case 'bottom-to-top':
      clipPath = 'polygon(0 50%, 100% 50%, 100% 100%, 0 100%)'
      break
    case 'tl-to-all':
      clipPath = 'polygon(0 0, 50% 0, 50% 50%, 0 50%)'
      break
    case 'tr-to-all':
      clipPath = 'polygon(50% 0, 100% 0, 100% 50%, 50% 50%)'
      break
    case 'bl-to-all':
      clipPath = 'polygon(0 50%, 50% 50%, 50% 100%, 0 100%)'
      break
    case 'br-to-all':
      clipPath = 'polygon(50% 50%, 100% 50%, 100% 100%, 50% 100%)'
      break
  }

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

  // Ghost Preview Implementation Strategy:
  // 1. Create a container `div` representing the "Target Area" (where the reflection appears).
  // 2. Use `overflow: hidden` on this container to crop the content.
  // 3. Place the source image inside this container.
  // 4. Scale and position the inner image to match the root image's dimensions and coordinate system.
  //    - Width/Height: Inverse of container size (e.g., if container is 50% width, image is 200% width).
  //    - Left/Top: Negative offset to compensate for container position.
  // 5. Apply CSS transform (scale -1) to mirror the image.

  const createGhost = (
    cx: number,
    cy: number,
    cw: number,
    ch: number, // Container percentages (0-100)
    sx: number,
    sy: number, // Scale factors
  ): GhostLayer => {
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
        left: `${-(cx / cw) * 100}%`,
        top: `${-(cy / ch) * 100}%`,
        maxWidth: 'none',
        maxHeight: 'none',
        transform: `scale(${sx}, ${sy})`,
        transformOrigin: 'center center',
      },
    }
  }

  switch (effectiveMode.value) {
    case 'left-to-right': // Mirror Left to Right. Target: Right Half.
      return [createGhost(50, 0, 50, 100, -1, 1)]

    case 'right-to-left': // Mirror Right to Left. Target: Left Half.
      return [createGhost(0, 0, 50, 100, -1, 1)]

    case 'top-to-bottom': // Mirror Top to Bottom. Target: Bottom Half.
      return [createGhost(0, 50, 100, 50, 1, -1)]

    case 'bottom-to-top': // Mirror Bottom to Top. Target: Top Half.
      return [createGhost(0, 0, 100, 50, 1, -1)]

    case 'tl-to-all': // TL to TR, BL, BR
      return [
        createGhost(50, 0, 50, 50, -1, 1), // TR
        createGhost(0, 50, 50, 50, 1, -1), // BL
        createGhost(50, 50, 50, 50, -1, -1), // BR
      ]

    case 'tr-to-all': // TR to TL, BL, BR
      return [
        createGhost(0, 0, 50, 50, -1, 1), // TL
        createGhost(0, 50, 50, 50, -1, -1), // BL
        createGhost(50, 50, 50, 50, 1, -1), // BR
      ]

    case 'bl-to-all': // BL to TL, TR, BR
      return [
        createGhost(0, 0, 50, 50, 1, -1), // TL
        createGhost(50, 0, 50, 50, -1, -1), // TR
        createGhost(50, 50, 50, 50, -1, 1), // BR
      ]

    case 'br-to-all': // BR to TL, TR, BL
      return [
        createGhost(0, 0, 50, 50, -1, -1), // TL
        createGhost(50, 0, 50, 50, 1, -1), // TR
        createGhost(0, 50, 50, 50, -1, 1), // BL
      ]

    default:
      throw new Error('Invalid symmetry mode for ghost preview')
  }
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

      <!-- Grid Overlay (Visual Guide) -->
      <div class="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-20">
        <div class="border-r border-b border-white/30"></div>
        <div class="border-r border-b border-white/30"></div>
        <div class="border-b border-white/30"></div>
        <div class="border-r border-b border-white/30"></div>
        <div class="border-r border-b border-white/30"></div>
        <div class="border-b border-white/30"></div>
        <div class="border-r border-white/30"></div>
        <div class="border-r border-white/30"></div>
        <div></div>
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
