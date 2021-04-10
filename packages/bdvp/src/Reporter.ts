import { Summary } from "./Summary"

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

export interface Failure {
  operator: string
  expected: string
  actual: string
  stack: string
}

export function writeTestFailure(reporter: Reporter, description: string, failure: Failure) {
  reporter.writeLine(`not ok ${description}`)
  reporter.writeLine('  ---')
  reporter.writeLine(`  operator: ${failure.operator}`)
  reporter.writeLine(`  expected: ${failure.expected}`)
  reporter.writeLine(`  actual:   ${failure.actual}`)
  reporter.writeLine(`  stack: |-`)
  reporter.writeLine(`    ${failure.stack}`)
  reporter.writeLine('  ...')
}

export function writeTestPass(reporter: Reporter, description: string) {
  reporter.writeLine(`ok ${description}`)
}

export function writeTestSkip(reporter: Reporter, description: string) {
  reporter.writeLine(`ok ${description} # SKIP`)
}

export function writeSummary(reporter: Reporter, summary: Summary) {
  reporter.writeLine(`1..${summary.valid + summary.invalid + summary.skipped}`)
  writeComment(reporter, `valid observations: ${summary.valid}`)
  writeComment(reporter, `invalid observations: ${summary.invalid}`)
  writeComment(reporter, `skipped: ${summary.skipped}`)
}