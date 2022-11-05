export interface Timer {
  start(): void
  stop(): void
  durationInMillis(): number
}

export class TimerFactory {
  private static timerIndex: number = 0

  static newTimer(): Timer {
    if (typeof window !== "undefined" && window.performance) {
      return new BrowserTimer(TimerFactory.timerIndex++)
    } else {
      return new NodeTimer()
    }
  }
}

export class BrowserTimer implements Timer {
  constructor (private index: number) {}

  start() {
    performance.mark(`start_validation_${this.index}`)
  }

  stop() {
    performance.mark(`end_validation_${this.index}`)
  }

  durationInMillis(): number {
    const measure = performance.measure(`validation_duration_${this.index}`, `start_validation_${this.index}`, `end_validation_${this.index}`)
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