import { Reporter } from "../../src/Reporter";

export class FakeReporter implements Reporter {
  public logLines: Array<string> = []

  writeLine(message: string): void {
    this.logLines.push(message)  
  }
}