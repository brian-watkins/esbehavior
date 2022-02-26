import { Writer } from "../../src/Reporter";
import * as assert from 'uvu/assert'

export class FakeReportWriter implements Writer {
  public logLines: Array<string> = []

  writeLine(message: string): void {
    this.logLines.push(message)
  }

  expectLines(expected: Array<string>) {
    assert.equal(this.logLines, expected, "expected lines")
  }
}