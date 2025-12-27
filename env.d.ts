/// <reference types="vite/client" />

declare const __APP_VERSION__: string

declare module 'gif.js' {
  export interface GIFOptions {
    repeat?: number // repeat count, -1 = no repeat, 0 = forever
    quality?: number // pixel sample interval, lower is better
    workers?: number // number of web workers to spawn
    workerScript?: string // url to load worker script from
    background?: string // background color where source image is transparent
    width?: number | null // output image width
    height?: number | null // output image height
    transparent?: number | null // transparent hex color, 0x00FF00 = green
    dither?: boolean | string // dithering method, e.g. FloydSteinberg-serpentine
    debug?: boolean // whether to print debug information to console
  }

  export interface AddFrameOptions {
    delay?: number // frame delay
    copy?: boolean // copy the pixel data
    dispose?: number // frame disposal code
  }

  export default class GIF {
    constructor(options?: GIFOptions)
    addFrame(
      image:
        | HTMLImageElement
        | HTMLCanvasElement
        | CanvasRenderingContext2D
        | WebGLRenderingContext
        | ImageData,
      options?: AddFrameOptions,
    ): void
    on(event: 'finished', callback: (blob: Blob) => void): void
    on(event: 'progress', callback: (percent: number) => void): void
    on(event: 'start', callback: () => void): void
    on(event: 'abort', callback: () => void): void
    on(event: string, callback: (...args: unknown[]) => void): void
    render(): void
    setOptions(options: GIFOptions): void
  }
}
