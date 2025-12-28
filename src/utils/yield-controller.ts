export default class YieldController {
  private lastYieldTime: number

  constructor(private threshold: number = 16) {
    this.lastYieldTime = performance.now()
  }

  async yieldIfNeeded(): Promise<void> {
    const now = performance.now()
    if (now - this.lastYieldTime >= this.threshold) {
      this.lastYieldTime = now
      await this.yield()
    }
  }

  private yield(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, 0))
  }
}
