import { validate, Writer, Behavior, Context } from "esbehavior"
import { Readable, Writable } from "stream"
import { BehaviorReporter } from "../src/BehaviorReporter"

export const appContext: Context<TestableApp> = { init: () => new TestableApp() }

export class TestableApp {
  private behaviorReporter = new BehaviorReporter()
  private consumer = new OutputConsumer()

  async validateBehavior(behavior: Behavior): Promise<void> {
    const reportWriter = new ReportWriter()
    await validate([ behavior ], { writer: reportWriter })
    const reportStream = reportWriter.stream()
    reportStream.pipe(this.behaviorReporter).pipe(this.consumer)
    return new Promise(resolve => {
      reportStream.on("close", () => {
        resolve()
      })
    })
  }

  get output(): string {
    return this.consumer.output
  }
}

class ReportWriter implements Writer {
  private lines: Array<string> = []

  writeLine(message: string): void {
    this.lines.push(`${message}\n`)
  }

  stream(): Readable {
    const readable = Readable.from(this.lines)
    return readable
  }

}

class OutputConsumer extends Writable {
  public output: string = ""

  _write(chunk: any, encoding: string, next: (error?: Error) => void) {
    this.output += chunk.toString()
    next()
  }
}
