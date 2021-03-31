export interface Reporter {
  writeLine(message: string): void
}

export class ConsoleReporter implements Reporter {
  writeLine(message: string) {
    console.log(message)
  }
}

export function writeComment(reporter: Reporter, comment: string) {
  reporter.writeLine(`# ${comment}`)
}