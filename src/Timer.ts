export interface Timer {
  start(): void
  stop(): void
  durationInMillis(): number
}

export class TimerFactory {
  static newTimer(): Timer {
    if (typeof window !== "undefined" && window.performance) {
      return new BrowserTimer()
    } else {
      return new NodeTimer()
    }
  }
}

export class BrowserTimer implements Timer {
  start() {
    window.performance.mark("start_validation")
  }

  stop() {
    window.performance.mark("end_validation")
  }

  durationInMillis(): number {
    const measure = window.performance.measure("validation_duration", "start_validation", "end_validation")
    return Number(measure.duration.toFixed())
  }
}

export class NodeTimer implements Timer {
  private startTime: bigint = BigInt(0)
  private endTime: bigint = BigInt(0)

  start(): void {
    this.startTime = process.hrtime.bigint()
  }

  stop(): void {
    this.endTime = process.hrtime.bigint() 
  }

  durationInMillis(): number {
    const diff = this.endTime - this.startTime
    const millis = diff / BigInt(1000000)
    return Number(millis)
  }
}