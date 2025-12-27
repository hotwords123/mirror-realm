/// <reference types="vite/client" />

declare const __APP_VERSION__: string

declare module 'gif.js' {
  export default class GIF {
    constructor(options?: any)
    addFrame(image: any, options?: any): void
    on(event: string, callback: (arg: any) => void): void
    render(): void
  }
}
