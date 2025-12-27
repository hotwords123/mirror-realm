import GIF from 'gif.js'
import workerScriptUrl from 'gif.js/dist/gif.worker.js?url'
import { GifReader } from 'omggif'
import type { SymmetryMode } from '@/types'

export class CanvasEngine {
  private ctx: CanvasRenderingContext2D
  private canvas: HTMLCanvasElement

  constructor() {
    this.canvas = document.createElement('canvas')
    const ctx = this.canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) throw new Error('Could not get 2D context')
    this.ctx = ctx
  }

  async process(
    file: File,
    mode: SymmetryMode,
    onProgress?: (progress: number) => void,
  ): Promise<string> {
    if (await this.isGif(file)) {
      return this.processGif(file, mode, onProgress)
    } else {
      return this.processStatic(file, mode)
    }
  }

  private async isGif(file: File): Promise<boolean> {
    try {
      const buffer = await file.slice(0, 4).arrayBuffer()
      const bytes = new Uint8Array(buffer)
      const header = String.fromCharCode(...bytes)
      return header === 'GIF8'
    } catch {
      return false
    }
  }

  private async processStatic(file: File, mode: SymmetryMode): Promise<string> {
    const img = await createImageBitmap(file)
    this.canvas.width = img.width
    this.canvas.height = img.height

    this.ctx.drawImage(img, 0, 0)
    this.applySymmetry(this.canvas, mode)

    return new Promise((resolve) => {
      this.canvas.toBlob((blob) => {
        if (blob) resolve(URL.createObjectURL(blob))
      }, file.type)
    })
  }

  private async processGif(
    file: File,
    mode: SymmetryMode,
    onProgress?: (progress: number) => void,
  ): Promise<string> {
    const buffer = await file.arrayBuffer()
    const reader = new GifReader(new Uint8Array(buffer))

    const width = reader.width
    const height = reader.height

    const gif = new GIF({
      workers: 2,
      quality: 10,
      width,
      height,
      workerScript: workerScriptUrl,
      transparent: 0xff00ff, // Magenta as chroma key
    })

    const frameCanvas = document.createElement('canvas')
    frameCanvas.width = width
    frameCanvas.height = height
    const frameCtx = frameCanvas.getContext('2d', { willReadFrequently: true })!

    // Composition canvas for handling transparency
    const compCanvas = document.createElement('canvas')
    compCanvas.width = width
    compCanvas.height = height
    const compCtx = compCanvas.getContext('2d', { willReadFrequently: true })!

    const frameData = new Uint8ClampedArray(width * height * 4)
    let backupFrameData: Uint8ClampedArray | null = null

    for (let i = 0; i < reader.numFrames(); i++) {
      const info = reader.frameInfo(i)

      // 1. Handle Disposal of Previous Frame
      if (i > 0) {
        const prevInfo = reader.frameInfo(i - 1)
        if (prevInfo.disposal === 2) {
          // Restore to background (Clear rect to transparent)
          this.clearFrameDataRect(
            frameData,
            width,
            prevInfo.x,
            prevInfo.y,
            prevInfo.width,
            prevInfo.height,
          )
        } else if (prevInfo.disposal === 3 && backupFrameData) {
          // Restore to previous
          frameData.set(backupFrameData)
        }
      }

      // 2. Save state if current frame needs to be restored later
      if (info.disposal === 3) {
        backupFrameData = new Uint8ClampedArray(frameData)
      }

      // 3. Decode current frame
      reader.decodeAndBlitFrameRGBA(i, frameData)

      const imageData = new ImageData(frameData, width, height)
      frameCtx.putImageData(imageData, 0, 0)

      this.applySymmetry(frameCanvas, mode)

      // 4. Handle Transparency for Output
      // Fill with Chroma Key
      compCtx.fillStyle = '#FF00FF'
      compCtx.fillRect(0, 0, width, height)
      // Draw the symmetrical frame
      compCtx.drawImage(frameCanvas, 0, 0)

      const delay = info.delay * 10
      gif.addFrame(compCtx, { delay, copy: true })

      onProgress?.((i / reader.numFrames()) * 0.5)
    }

    return new Promise((resolve) => {
      gif.on('progress', (p) => {
        onProgress?.(0.5 + p * 0.5)
      })

      gif.on('finished', (blob) => {
        resolve(URL.createObjectURL(blob))
      })

      gif.render()
    })
  }

  private clearFrameDataRect(
    data: Uint8ClampedArray,
    width: number,
    x: number,
    y: number,
    w: number,
    h: number,
  ) {
    for (let dy = 0; dy < h; dy++) {
      for (let dx = 0; dx < w; dx++) {
        const index = ((y + dy) * width + (x + dx)) * 4
        data[index] = 0
        data[index + 1] = 0
        data[index + 2] = 0
        data[index + 3] = 0
      }
    }
  }

  private applySymmetry(canvas: HTMLCanvasElement, mode: SymmetryMode) {
    const ctx = canvas.getContext('2d')!
    const w = canvas.width
    const h = canvas.height

    const sourceCanvas = document.createElement('canvas')
    sourceCanvas.width = w
    sourceCanvas.height = h
    sourceCanvas.getContext('2d')!.drawImage(canvas, 0, 0)

    // Clear the canvas to avoid transparency stacking issues
    ctx.clearRect(0, 0, w, h)

    const drawSource = (sx: number, sy: number, sw: number, sh: number) => {
      ctx.drawImage(sourceCanvas, sx, sy, sw, sh, sx, sy, sw, sh)
    }

    const drawReflected = (
      sx: number,
      sy: number,
      sw: number,
      sh: number,
      dx: number,
      dy: number,
      dw: number,
      dh: number,
      scaleX: number,
      scaleY: number,
    ) => {
      ctx.save()
      ctx.translate(dx + (scaleX < 0 ? dw : 0), dy + (scaleY < 0 ? dh : 0))
      ctx.scale(scaleX, scaleY)
      ctx.drawImage(sourceCanvas, sx, sy, sw, sh, 0, 0, dw, dh)
      ctx.restore()
    }

    const halfW = w / 2
    const halfH = h / 2

    switch (mode) {
      case 'left-to-right':
        drawSource(0, 0, halfW, h)
        drawReflected(0, 0, halfW, h, halfW, 0, halfW, h, -1, 1)
        break
      case 'right-to-left':
        drawSource(halfW, 0, halfW, h)
        drawReflected(halfW, 0, halfW, h, 0, 0, halfW, h, -1, 1)
        break
      case 'top-to-bottom':
        drawSource(0, 0, w, halfH)
        drawReflected(0, 0, w, halfH, 0, halfH, w, halfH, 1, -1)
        break
      case 'bottom-to-top':
        drawSource(0, halfH, w, halfH)
        drawReflected(0, halfH, w, halfH, 0, 0, w, halfH, 1, -1)
        break
      case 'tl-to-all':
        drawSource(0, 0, halfW, halfH)
        drawReflected(0, 0, halfW, halfH, halfW, 0, halfW, halfH, -1, 1)
        drawReflected(0, 0, halfW, halfH, 0, halfH, halfW, halfH, 1, -1)
        drawReflected(0, 0, halfW, halfH, halfW, halfH, halfW, halfH, -1, -1)
        break
      case 'tr-to-all':
        drawSource(halfW, 0, halfW, halfH)
        drawReflected(halfW, 0, halfW, halfH, 0, 0, halfW, halfH, -1, 1)
        drawReflected(halfW, 0, halfW, halfH, halfW, halfH, halfW, halfH, 1, -1)
        drawReflected(halfW, 0, halfW, halfH, 0, halfH, halfW, halfH, -1, -1)
        break
      case 'bl-to-all':
        drawSource(0, halfH, halfW, halfH)
        drawReflected(0, halfH, halfW, halfH, halfW, halfH, halfW, halfH, -1, 1)
        drawReflected(0, halfH, halfW, halfH, 0, 0, halfW, halfH, 1, -1)
        drawReflected(0, halfH, halfW, halfH, halfW, 0, halfW, halfH, -1, -1)
        break
      case 'br-to-all':
        drawSource(halfW, halfH, halfW, halfH)
        drawReflected(halfW, halfH, halfW, halfH, 0, halfH, halfW, halfH, -1, 1)
        drawReflected(halfW, halfH, halfW, halfH, halfW, 0, halfW, halfH, 1, -1)
        drawReflected(halfW, halfH, halfW, halfH, 0, 0, halfW, halfH, -1, -1)
        break
    }
  }
}
