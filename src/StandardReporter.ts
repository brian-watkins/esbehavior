import { ClaimResult } from "./Claim.js";
import { ConsoleWriter } from "./ConsoleWriter.js";
import { Failure, Reporter, Writer } from "./Reporter.js";
import { Summary } from "./Summary.js";
import { Timer, TimerFactory } from "./Timer.js";
import { prettyPrint } from "@base2/pretty-print-object";

export interface StandardReporterOptions {
  writer?: Writer
  formatter?: Formatter
  timer?: Timer
  slowClaimInMillis?: number
}

export interface Formatter {
  underline(message: string): string
  bold(message: string): string
  dim(message: string): string
  red(message: string): string
  yellow(message: string): string
  green(message: string): string
  cyan(message: string): string
}

enum SuccessIndicator {
  Presupposition = "+",
  Action = "•",
  Observation = "✔",
  Nested = "➜"
}

export class StandardReporter implements Reporter {
  private writer: Writer
  private format: Formatter
  private timer: Timer
  private slowClaimInMillis: number
  private currentScriptLocation = "UNKNOWN"
  private orderDescription: string | undefined = undefined

  constructor(options: StandardReporterOptions = {}) {
    this.writer = options.writer ?? new ConsoleWriter()
    this.format = options.formatter ?? new ANSIFormatter()
    this.timer = options.timer ?? TimerFactory.newTimer()
    this.slowClaimInMillis = options.slowClaimInMillis ?? 100
  }

  start(orderDescription: string): void {
    this.orderDescription = orderDescription
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
    if (this.orderDescription) {
      this.space()
      this.writer.writeLine(this.format.dim(this.orderDescription))
    }
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
    if (this.orderDescription) {
      this.writer.writeLine(this.format.dim(this.orderDescription))
      this.space()
    }
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

  startScript(location: string): void {
    this.currentScriptLocation = location
  }

  endScript(): void {
    this.currentScriptLocation = "UNKNOWN"
  }

  recordPresupposition(result: ClaimResult): void {
    this.recordClaimResult(SuccessIndicator.Presupposition, result)
  }

  recordAction(result: ClaimResult): void {
    this.recordClaimResult(SuccessIndicator.Action, result)
  }

  recordObservation(result: ClaimResult): void {
    this.recordClaimResult(SuccessIndicator.Observation, result)
  }

  recordClaimResult(successIndicator: SuccessIndicator, result: ClaimResult): void {
    switch (result.type) {
      case "valid-claim":
        this.writeValidClaimResult(successIndicator, result)
        break
      case "invalid-claim":
        this.writeInvalidClaimResult(result, result.error)
        break
      case "skipped-claim":
        this.writeSkippedClaimResult(result)
        break
    }
  }

  formatClaimDuration(duration: number): string {
    return this.format.cyan(` (${formatTime(duration)})`)
  }

  shouldDisplayDuration(result: ClaimResult): result is ClaimResult & { durationInMillis: number } {
    return result.durationInMillis !== undefined && result.durationInMillis >= this.slowClaimInMillis
  }

  writeValidClaimResult(successIndicator: SuccessIndicator, result: ClaimResult, indentLevel: number = 1) {
    let description = this.format.green(`${successIndicator} ${result.description}`)

    if (this.shouldDisplayDuration(result)) {
      description += this.formatClaimDuration(result.durationInMillis)
    }

    const descriptionLine = indent(indentLevel, description)

    if (indentLevel == 1) {
      this.writer.writeLine(descriptionLine)
    } else {
      this.writer.writeLine(this.format.dim(descriptionLine))
    }

    for (const subResult of result.subsumedResults) {
      this.writeValidClaimResult(SuccessIndicator.Nested, subResult, indentLevel + 1)
    }
  }

  writeInvalidClaimResult(result: ClaimResult, error: Failure, indentLevel: number = 1) {
    let description = this.format.red(this.format.bold(`${fail()} ${result.description}`))

    if (this.shouldDisplayDuration(result)) {
      description += this.formatClaimDuration(result.durationInMillis)
    }

    this.writer.writeLine(indent(indentLevel, description))
    if (result.subsumedResults.length > 0) {
      for (const subResult of result.subsumedResults) {
        switch (subResult.type) {
          case "valid-claim":
            this.writeValidClaimResult(SuccessIndicator.Nested, subResult, indentLevel + 1)
            break
          case "invalid-claim":
            this.writeInvalidClaimResult(subResult, subResult.error, indentLevel + 1)
            break
          case "skipped-claim":
            this.writeSkippedClaimResult(subResult, indentLevel + 1)
            break
        }
      }
    } else {
      this.space()
      if (error.message !== undefined) {
        const messageLines = error.message.split(/\r?\n/);
        for (const line of messageLines) {
          this.writer.writeLine(indent(indentLevel + 1, this.format.red(line)))
        }
      }
      this.space()
      if (error.expected != undefined && error.actual != undefined) {
        this.writeDetail("Actual", error.actual, indentLevel + 1)
        this.writeDetail("Expected", error.expected, indentLevel + 1)
      }
      this.writeDetail("Script Failed", this.currentScriptLocation, indentLevel + 1)
      if (error.stack !== undefined) {
        this.writeStack(error.stack, { indentLevel: indentLevel + 1 })
      }
      this.space()
    }
  }

  writeDetail(description: string, detail: any, indentLevel: number = 2) {
    this.writer.writeLine(indent(indentLevel, this.format.dim(this.format.underline(description))))
    this.space()
    this.writeDetailMessage(detail, indentLevel + 1)
    this.space()
  }

  writeDetailMessage(detail: any, indentLevel: number = 2) {
    if (typeof detail === "string") {
      const detailLines = detail.split(/\r?\n/);
      for (const line of detailLines) {
        this.writer.writeLine(indent(indentLevel, line))
      }
    } else {
      this.writeDetailMessage(stringify(detail), indentLevel)
    }
  }

  writeStack(stack: string, { indentLevel }: { indentLevel: number } = { indentLevel: 2 }) {
    stack
      .split("\n")
      .map(line => line.trim())
      .filter((line) => line.startsWith("at"))
      .forEach(line => {
        if (line.includes("Fact.execute") || line.includes("Step.execute") || line.includes("Effect.execute")) {
          this.writer.writeLine(indent(indentLevel, this.format.cyan(line)))
        } else {
          this.writer.writeLine(indent(indentLevel, this.format.dim(line)))
        }
      })
  }

  writeSkippedClaimResult(result: ClaimResult, indentLevel: number = 1) {
    if (indentLevel === 1) {
      this.writer.writeLine(indent(indentLevel, this.format.yellow(`${ignore()} ${result.description}`)))
    } else {
      this.writer.writeLine(indent(indentLevel, this.format.dim(this.format.yellow(`${SuccessIndicator.Nested} ${result.description}`))))
    }

    for (const subResult of result.subsumedResults) {
      this.writeSkippedClaimResult(subResult, indentLevel + 1)
    }
  }

  space() {
    this.writer.writeLine("")
  }
}

function stringify(value: any): string {
  return prettyPrint(value, {
    indent: '  ',
    singleQuotes: false
  })
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