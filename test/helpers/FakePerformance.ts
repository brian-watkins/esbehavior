export class FakePerformance {
  private entries = new Map<String, DOMHighResTimeStamp>()

  mark(name: string) {
    this.entries.set(name, window.performance.now())
  }

  measure(name: string, start: string, end: string) {
    const startMark = this.entries.get(start) ?? 0
    const endMark = this.entries.get(end) ?? 0
    return { duration: endMark - startMark }
  }

  reset() {
    this.entries.clear()
  }
}
