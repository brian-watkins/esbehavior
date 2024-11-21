import { Writer } from "./index.js"

export class ConsoleWriter implements Writer {
  writeLine(message: string) {
    console.log(message)
  }
}
