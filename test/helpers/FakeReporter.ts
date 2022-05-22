import { Effect } from "../../src/index.js";
import { Assumption } from "../../src/Assumption.js";
import { Claim, ClaimResult } from "../../src/Claim.js";
import { Failure, Reporter } from "../../src/Reporter.js";
import { Summary } from "../../src/Summary.js";
import * as assert from 'uvu/assert'
import { ScriptContext } from "../../src/Example.js";

export class FakeReporter implements Reporter {
  private reports: Array<TestBehavior | TestFailure | null> = []
  private currentBehavior: TestBehavior | null = null
  private currentExample: TestExample | null = null
  private summary: Summary | null = null
  private calledStart: boolean = false

  start(): void {
    this.calledStart = true
  }

  end(summary: Summary): void {
    this.summary = summary
  }

  terminate(error: Failure): void {
    this.currentBehavior?.examples.push(this.currentExample)
    this.reports.push(this.currentBehavior)
    this.reports.push(new TestFailure(error))
  }

  startBehavior(description: string): void {
    this.currentBehavior = new TestBehavior(description)
  }

  endBehavior(): void {
    this.reports.push(this.currentBehavior)
    this.currentBehavior = null  
  }

  startExample(description?: string): void {
    this.currentExample = new TestExample(description || null)
  }

  endExample(): void {
    this.currentBehavior?.examples.push(this.currentExample)
    this.currentExample = null
  }

  recordAssumption<T>(scriptContext: ScriptContext<T>, assumption: Assumption<T>, result: ClaimResult): void {
    this.recordClaim(scriptContext, assumption, result)
  }

  skipAssumption<T>(assumption: Assumption<T>): void {
    this.currentExample?.claims.push(new TestClaim("", assumption.description, "skipped", null))
  }

  recordObservation<T>(scriptContext: ScriptContext<T>, effect: Effect<T>, result: ClaimResult): void {
    this.recordClaim(scriptContext, effect, result)
  }

  skipObservation<T>(effect: Effect<T>): void {
    this.currentExample?.claims.push(new TestClaim("", effect.description, "skipped", null))
  }

  private recordClaim<T>(scriptContext: ScriptContext<T>, claim: Claim<T>, result: ClaimResult): void {
    const claimResult = result.when({
      valid: () => new TestClaim("", claim.description, "valid", null),
      invalid: (failure) => {
        const location = scriptContext.location.split("/").at(-1) ?? "<LOCATION NOT FOUND>"
        return new TestClaim(location, claim.description, "invalid", failure)
      }
    })
    this.currentExample?.claims.push(claimResult)
  }

  expectReport(expectedReports: Array<TestBehavior | TestFailure>) {
    assert.equal(this.calledStart, true, "expected start to be called")
    assert.equal(this.reports, expectedReports, "expected report")
  }

  expectSummary(expected: Summary) {
    assert.equal(this.summary, expected, "expected summary")
  }
}

class TestBehavior {
  public examples: Array<TestExample | null> = []

  constructor(public description: string) {}
}

export function withBehavior(description: string, examples: Array<TestExample>): TestBehavior {
  const report = new TestBehavior(description)
  report.examples = examples
  return report
}

class TestExample {
  public claims: Array<TestClaim> = []

  constructor(public description: string | null) {}
}

export function withExample(description: string | null, claims: Array<TestClaim>): TestExample {
  const example = new TestExample(description)
  example.claims = claims
  return example
}

class TestFailure {
  constructor(public failure: Failure) {}
}

export function withFailure(failure: Failure): TestFailure {
  return new TestFailure(failure)
}

class TestClaim {
  constructor(public scriptLocation: string, public description: string, public result: string, public failure: Failure | null) {}
}

export function withValidClaim(description: string): TestClaim {
  return new TestClaim("", description, "valid", null)
}

export function withInvalidClaim(scriptLocation: string, descripion: string, failure: Failure): TestClaim {
  return new TestClaim(scriptLocation, descripion, "invalid", failure)
}

export function withSkippedClaim(descripion: string): TestClaim {
  return new TestClaim("", descripion, "skipped", null)
}