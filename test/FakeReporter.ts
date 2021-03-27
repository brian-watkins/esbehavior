import { Reporter } from "../src";

export class FakeReporter implements Reporter {
  public logLines: Array<string> = []

  writeLine(message: string): void {
    this.logLines.push(message)  
  }
}