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

export function startReport(reporter: Reporter) {
  reporter.writeLine("TAP version 13")
}

export interface DocumentResult {
  valid: number
  invalid: number
  skipped: number
}

export function writeResults(reporter: Reporter, results: DocumentResult) {
  reporter.writeLine(`1..${results.valid + results.invalid + results.skipped}`)
  writeComment(reporter, `valid observations: ${results.valid}`)
  writeComment(reporter, `invalid observations: ${results.invalid}`)
  writeComment(reporter, `skipped: ${results.skipped}`)
}