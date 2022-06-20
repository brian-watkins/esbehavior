import { Writer } from "../../src/Reporter";
import * as assert from 'uvu/assert'

export class FakeReportWriter implements Writer {
  public logLines: Array<string> = []

  writeLine(message: string): void {
    if (message.trim().length > 0) {
      this.logLines.push(message)
    }
  }

  expectLines(expected: Array<string>) {
    assert.equal(this.logLines, expected, "expected lines to be equal")
  }
}