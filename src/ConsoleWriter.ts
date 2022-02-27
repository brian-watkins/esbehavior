import { Writer } from "./Reporter.js"

export class ConsoleWriter implements Writer {
  writeLine(message: string) {
    console.log(message)
  }
}
