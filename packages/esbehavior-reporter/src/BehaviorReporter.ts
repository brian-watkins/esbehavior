
import Parser from 'tap-parser'
import { Duplex } from "stream";

export class BehaviorReporter extends Duplex {
  private tapParser

  constructor() {
    super()
    this.tapParser = new Parser()

    this.tapParser.on("comment", (comment: string) => {
      this.push(comment)
    })
  }

  _write(chunk: any, encoding: BufferEncoding, next: (error?: Error | null) => void) {
    this.tapParser.write(chunk, encoding, next)
  }

  _final(next: (error?: Error | null) => void) {
    this.tapParser.end()
    next()
  }

  _read(size: number) {}
}