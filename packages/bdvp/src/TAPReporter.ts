import { ClaimResult } from "./Claim"
import { Condition } from "./Condition"
import { Effect } from "./Effect"
import { Failure, Reporter, Writer } from "./Reporter"
import { Summary } from "./Summary"

export class TAPReporter implements Reporter {
  constructor (private writer: Writer) {}
  
  start(): void {
    this.writer.writeLine("TAP version 13")
  }

  end(summary: Summary): void {
    const total = summary.valid + summary.invalid + summary.skipped
    this.writer.writeLine(`1..${total}`)
    this.writeComment(`tests ${total}`)
    this.writeComment(`pass ${summary.valid}`)
    this.writeComment(`fail ${summary.invalid}`)
    this.writeComment(`skip ${summary.skipped}`)
  }

  writeComment(comment: string) {
    this.writer.writeLine(`# ${comment}`)
  }

  terminate(error: Failure): void {
    this.writer.writeLine(`Bail out! ${error.stack}`)
  }

  startBehavior(description: string): void {
    this.writeComment(`Behavior: ${description}`)
  }

  endBehavior(): void {
    // nothing?
  }

  startExample(description?: string): void {
    if (description) {
      this.writeComment(`Example: ${description}`)
    } else {
      this.writeComment("Example")
    }
  }

  endExample(): void {
    // nothing?
  }

  recordAssumption<T>(condition: Condition<T>, result: ClaimResult): void {
    result.when({
      valid: () => this.recordValidClaim(`${ASSUMPTION_DESIGNATOR} ${condition.description}`),
      invalid: (error) => this.recordInvalidClaim(`${ASSUMPTION_DESIGNATOR} ${condition.description}`, error)
    })
  }

  skipAssumption<T>(condition: Condition<T>): void {
    this.writer.writeLine(`ok ${ASSUMPTION_DESIGNATOR} ${condition.description} # SKIP`)
  }

  recordObservation<T>(effect: Effect<T>, result: ClaimResult): void {
    result.when({
      valid: () => this.recordValidClaim(effect.description),
      invalid: (error) => this.recordInvalidClaim(effect.description, error)
    })
  }

  skipObservation<T>(effect: Effect<T>): void {
    this.writer.writeLine(`ok ${effect.description} # SKIP`)
  }

  recordValidClaim(description: string) {
    this.writer.writeLine(`ok ${description}`)
  }

  recordInvalidClaim(description: string, failure: Failure) {
    this.writer.writeLine(`not ok ${description}`)
    this.writer.writeLine('  ---')
    if (failure.operator) {
      this.writer.writeLine(`  operator: ${failure.operator}`)
    }
    if (failure.expected) {
      this.writer.writeLine(`  expected: ${this.stringify(failure.expected)}`)
    }
    if (failure.actual) {
      this.writer.writeLine(`  actual:   ${this.stringify(failure.actual)}`)
    }
    if (failure.stack) {
      this.writeClaimReference(failure.stack)
      this.writer.writeLine(`  stack: |-`)
      this.writeMultiline('    ', failure.stack)  
    } else {
      this.writer.writeLine(`  error: ${JSON.stringify(failure)}`)
    }

    this.writer.writeLine('  ...')
  }

  private writeClaimReference(stack: string) {
    const lines = stack.split("\n")
    const claim = lines.findIndex((line) => line.includes("Condition.execute") || line.includes("Effect.execute"))
    if (claim > -1) {
      const start = lines[claim].indexOf("at ")
      this.writer.writeLine(`  at: ${lines[claim].substring(start + 3)}`)
    }
  }

  private stringify(value: any): string {
    return JSON.stringify(value)
  }

  private writeMultiline(pad: string, multiline: string) {
    const lines = multiline.split("\n")
    for (const line of lines) {
      this.writer.writeLine(`${pad}${line}`)
    }
  }
}

const ASSUMPTION_DESIGNATOR = "Assume:"