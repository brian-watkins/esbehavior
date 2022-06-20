import { throws } from "assert";
import { Assumption, Condition } from "./Assumption.js";
import { ClaimResult } from "./Claim.js";
import { ConsoleWriter } from "./ConsoleWriter.js";
import { Observable } from "./Effect.js";
import { Failure, Reporter, Writer } from "./Reporter.js";
import { ScriptContext } from "./Script.js";
import { Summary } from "./Summary.js";
import { Timer, TimerFactory } from "./Timer.js";

export interface StandardReporterOptions {
  writer?: Writer
  formatter?: Formatter
  timer?: Timer
}

export interface Formatter {
  underline(message: string): string
  bold(message: string): string
  dim(message: string): string
  red(message: string): string
  yellow(message: string): string
  green(message: string): string
  cyan(message: string): string
  line(length: number): string
}

export class StandardReporter implements Reporter {
  private writer: Writer
  private format: Formatter
  private timer: Timer

  constructor(options: StandardReporterOptions = {}) {
    this.writer = options.writer ?? new ConsoleWriter()
    this.format = options.formatter ?? new ANSIFormatter()
    this.timer = options.timer ?? TimerFactory.newTimer()
  }

  start(): void {
    this.timer.start()
  }

  end(summary: Summary): void {
    this.timer.stop()
    const total = summary.valid + summary.invalid + summary.skipped
    this.writer.writeLine(this.format.bold(this.format.underline("Summary")))
    this.space()

    const behaviors = pluralize(summary.behaviors, 'behavior')
    const examples = pluralize(summary.examples, 'example')
    const claims = pluralize(total, 'claim')
    const duration = '(' + formatTime(this.timer.durationInMillis()) + ')'
    this.writer.writeLine(this.format.bold(`${behaviors}, ${examples}, ${claims} ${this.format.dim(duration)}`))
    this.space()

    if (summary.skipped == 0 && summary.invalid == 0) {
      this.writer.writeLine(this.format.bold(this.format.green(check() + " All claims are valid!")))
    }

    if (summary.invalid > 0) {
      this.writer.writeLine(this.format.bold(this.format.red(fail() + " " + pluralize(summary.invalid, 'invalid claim'))))
    }

    if (summary.skipped > 0) {
      this.writer.writeLine(this.format.bold(this.format.yellow(ignore() + " " + pluralize(summary.skipped, 'skipped claim'))))
    }

    this.space()
  }

  terminate(error: Failure): void {
    this.writer.writeLine(this.format.bold(this.format.red("Failed to validate behaviors!")))
    this.space()
    if (error.message) {
      this.writer.writeLine(indent(1, this.format.red(error.message)))
      this.space()
    }
    if (error.stack) {
      this.writeStack(error.stack, { indentLevel: 1 })
      this.space()
    }
  }

  startBehavior(description: string): void {
    this.writer.writeLine(this.format.bold(this.format.underline(description)))
    this.space()
  }

  endBehavior(): void {
    this.space()
  }

  startExample(description?: string): void {
    if (description) {
      this.writer.writeLine(indent(1, this.format.bold(description)))
      this.space()
    }
  }

  endExample(): void {
    this.space()
  }

  recordAssumption<T>(scriptContext: ScriptContext<T>, assumption: Assumption<T>, result: ClaimResult): void {
    result.when({
      valid: () => {
        this.writeValidAssumption(assumption)
      },
      invalid: (error) => {
        this.writeInvalidClaim(scriptContext.location, assumption.description, error)
      }
    })
  }

  skipAssumption<T>(assumption: Assumption<T>): void {
    this.writeSkippedClaim(assumption.description)
  }

  recordObservation(result: ClaimResult): void {
    result.when({
      valid: () => this.writeValidClaimResult(result),
      invalid: (error) => this.writeInvalidClaimResult(result, error)
    })
  }

  skipObservation<T>(observable: Observable<T>): void {
    this.writeSkippedClaim(observable.description)
  }

  writeValidAssumption<T>(assumption: Assumption<T>) {
    if (assumption instanceof Condition) {
      this.writer.writeLine(indent(1, this.format.green(`+ ${assumption.description}`)))
    } else {
      this.writer.writeLine(indent(1, this.format.green(`• ${assumption.description}`)))
    }
  }

  writeValidClaimResult(result: ClaimResult, indentLevel: number = 1) {
    const descriptionLine = indent(indentLevel, this.format.green(`${check()} ${result.description}`))

    if (indentLevel == 1) {
      this.writer.writeLine(descriptionLine)
    } else {
      this.writer.writeLine(this.format.dim(descriptionLine))
    }
    
    if (result.hasSubsumedResults) {
      this.writer.writeLine(indent(indentLevel + 1, this.validSeparator()))
      for (const subResult of result.subsumedResults) {
        this.writeValidClaimResult(subResult, indentLevel + 1)
      }
      this.writer.writeLine(indent(indentLevel + 1, this.validSeparator()))
    }
  }

  validSeparator(): string {
    return this.format.dim(this.format.green(this.format.line(25)))
  }

  invalidSeparator(): string {
    return this.format.dim(this.format.red(this.format.line(25)))
  }

  // Note that this function can be removed when we fix Assumptions to
  // just use data in the claim result when reporting
  writeInvalidClaim(location: string, description: string, error: any) {
    this.writer.writeLine(indent(1, this.format.red(this.format.bold(`${fail()} ${description}`))))
    this.space()
    const messageLines = error.message.split(/\r?\n/);
    for (const line of messageLines) {
      this.writer.writeLine(indent(2, this.format.red(line)))
    }
    this.space()
    if (error.expected != undefined && error.actual != undefined) {
      this.writeDetail("Actual", error.actual)
      this.writeDetail("Expected", error.expected)
    }
    this.writeDetail("Script Failed", location)
    this.writeStack(error.stack)
    this.space()
  }

  writeInvalidClaimResult(result: ClaimResult, error: any, indentLevel: number = 1) {
    this.writer.writeLine(indent(indentLevel, this.format.red(this.format.bold(`${fail()} ${result.description}`))))
    if (result.hasSubsumedResults) {
      this.writer.writeLine(indent(indentLevel + 1, this.invalidSeparator()))
      for (const subResult of result.subsumedResults) {
        subResult.when({
          valid: () => {
            this.writeValidClaimResult(subResult, indentLevel + 1)
          },
          invalid: (subError) => {
            this.writeInvalidClaimResult(subResult, subError, indentLevel + 1)
          }
        })
      }
      this.writer.writeLine(indent(indentLevel + 1, this.invalidSeparator()))
    } else {
      this.space()
      const messageLines = error.message.split(/\r?\n/);
      for (const line of messageLines) {
        this.writer.writeLine(indent(indentLevel + 1, this.format.red(line)))
      }
      this.space()
      if (error.expected != undefined && error.actual != undefined) {
        this.writeDetail("Actual", error.actual, indentLevel + 1)
        this.writeDetail("Expected", error.expected, indentLevel + 1)
      }
      this.writeDetail("Script Failed", result.location, indentLevel + 1)
      this.writeStack(error.stack, { indentLevel: indentLevel + 1 })
      this.space()  
    }
  }

  writeDetail(description: string, value: string, indentLevel: number = 2) {
    this.writer.writeLine(indent(indentLevel, this.format.dim(this.format.underline(description))))
    this.space()
    this.writer.writeLine(indent(indentLevel + 1, value))
    this.space()
  }

  writeStack(stack: string, { indentLevel }: { indentLevel: number } = { indentLevel: 2 }) {
    stack
      .split("\n")
      .map(line => line.trim())
      .filter((line) => line.startsWith("at"))
      .forEach(line => {
        if (line.includes("Effect.execute") || line.includes("Condition.execute") || line.includes("Step.execute")) {
          this.writer.writeLine(indent(indentLevel, this.format.cyan(line)))
        } else {
          this.writer.writeLine(indent(indentLevel, this.format.dim(line)))
        }
      })
  }

  writeSkippedClaim(description: string) {
    this.writer.writeLine(indent(1, this.format.yellow(`${ignore()} ${description}`)))
  }

  space() {
    this.writer.writeLine("")
  }
}

class ANSIFormatter implements Formatter {
  private wrap(start: string, end: string, message: string): string {
    return start + message + end
  }
  private wrapColor(code: string, message: string): string {
    return this.wrap("\x1b[" + code + "m", "\x1b[39m", message)
  }
  underline(message: string): string {
    return this.wrap("\x1b[4m", "\x1b[24m", message)
  }
  bold(message: string): string {
    return this.wrap("\x1b[1m", "\x1b[22m", message)
  }
  dim(message: string): string {
    return this.wrap("\x1b[2m", "\x1b[22m", message)
  }
  red(message: string): string {
    return this.wrapColor("31", message)
  }
  yellow(message: string): string {
    return this.wrapColor("33", message)
  }
  green(message: string): string {
    return this.wrapColor("32", message)
  }
  cyan(message: string): string {
    return this.wrapColor("36", message)
  }
  line(length: number): string {
    let line = ""
    for (let i = 0; i < length; i++) {
      line += "\x1b(0\x71"
    }
    line += "\x1b(B"
    return line
  }
}

function indent(times: number, text: string): string {
  const padding = " ".repeat(times * 2)
  return padding + text
}

function check(): string {
  return "✔";
}

function fail(): string {
  return "✖"
}

function ignore(): string {
  return "-"
}

function pluralize(total: number, name: string): string {
  if (total > 1) {
    return `${total} ${name}s`
  } else {
    return `${total} ${name}`
  }
}

function formatTime(millis: number): string {
  if (millis < 500) {
    return `${millis}ms`
  } else {
    return `${(millis / 1000).toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    })}s`
  }
}