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

  startBehavior(description?: string): void {
    if (description) this.writeComment(description)
  }

  endBehavior(): void {
    // nothing?
  }

  startExample(description?: string): void {
    if (description) this.writeComment(description)
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
    this.writer.writeLine(`  operator: ${failure.operator}`)
    this.writer.writeLine(`  expected: ${failure.expected}`)
    this.writer.writeLine(`  actual:   ${failure.actual}`)
    this.writer.writeLine(`  stack: |-`)
    this.writer.writeLine(`    ${failure.stack}`)
    this.writer.writeLine('  ...')
  }
}

const ASSUMPTION_DESIGNATOR = "~"