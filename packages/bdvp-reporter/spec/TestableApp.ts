import { Readable, Writable } from "stream"
import { BDVPReporter } from "../src/BDVPReporter"

export class TestableApp {
  private bdvpReporter = new BDVPReporter()
  private consumer = new OutputConsumer()

  async executeDoc(document: string): Promise<void> {
    const lines: Array<string> = document.match(/^.*(\n|$)/gm) ?? []
    const readableDoc = Readable.from(lines)
    readableDoc.pipe(this.bdvpReporter).pipe(this.consumer)
    return new Promise(resolve => {
      readableDoc.on("close", () => {
        resolve()
      })
    })
  }

  get output(): string {
    return this.consumer.output
  }
}

class OutputConsumer extends Writable {
  public output: string = ""

  _write(chunk: any, encoding: string, next: (error?: Error) => void) {
    this.output += chunk.toString() + "\n"
    next()
  }
}
