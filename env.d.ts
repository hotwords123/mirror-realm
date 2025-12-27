/// <reference types="vite/client" />

declare module 'gif.js' {
  export default class GIF {
    constructor(options?: any)
    addFrame(image: any, options?: any): void
    on(event: string, callback: (arg: any) => void): void
    render(): void
  }
}

declare module 'omggif' {
  export class GifReader {
    constructor(buffer: Uint8Array)
    width: number
    height: number
    numFrames(): number
    frameInfo(frameNumber: number): { delay: number }
    decodeAndBlitFrameRGBA(frameNumber: number, pixels: Uint8Array | Uint8ClampedArray): void
  }
}
