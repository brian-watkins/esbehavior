import { ClaimResult } from "../../src/Claim.js";
import { Failure, Reporter } from "../../src/Reporter.js";
import { Summary } from "../../src/Summary.js";
import * as assert from 'uvu/assert'

export class FakeReporter implements Reporter {
  private reports: Array<TestBehavior | TestFailure | null> = []
  private currentBehavior: TestBehavior | null = null
  private currentExample: TestExample | null = null
  private currentScript: TestScript = new TestScript("UNKNOWN")
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

  startScript(location: string): void {
    this.currentScript = new TestScript(location)
  }

  endScript(): void {
    this.currentScript = new TestScript("UNKNOWN")
  }

  startExample(description?: string): void {
    this.currentExample = new TestExample(description || null)
  }

  endExample(): void {
    this.currentBehavior?.examples.push(this.currentExample)
    this.currentExample = null
  }

  recordPresupposition(result: ClaimResult): void {
    this.recordClaim(result)
  }
  
  recordAction(result: ClaimResult): void {
    this.recordClaim(result)
  }

  recordObservation<T>(result: ClaimResult): void {
    this.recordClaim(result)
  }

  private recordClaim<T>(result: ClaimResult): void {
    this.currentExample?.claims.push(toTestClaim(this.currentScript, result))
  }

  expectReport(expectedReports: Array<TestBehavior | TestFailure>) {
    assert.equal(this.calledStart, true, "expected start to be called")
    assert.equal(this.reports, expectedReports, "expected report")
  }

  expectSummary(expected: Summary) {
    assert.equal(this.summary, expected, "expected summary")
  }
}

function toTestClaim(script: TestScript, result: ClaimResult): TestClaim | TestClaims {
  const toTestClaimForScript = (subResult: ClaimResult) => toTestClaim(script, subResult)

  return result.when({
    valid: () => {
      if (result.hasSubsumedResults) {
        return new TestClaims(result.description, result.subsumedResults.map(toTestClaimForScript), "valid")
      } else {
        return new ValidClaim(result.description)
      }
    },
    invalid: (failure) => {
      if (result.hasSubsumedResults) {
        return new TestClaims(result.description, result.subsumedResults.map(toTestClaimForScript), "invalid")
      } else {
        const location = script.location.split("/").at(-1) ?? "<LOCATION NOT FOUND>"
        return new InvalidClaim(location, result.description, failure)
      }
    },
    skipped: () => {
      if (result.hasSubsumedResults) {
        return new TestClaims(result.description, result.subsumedResults.map(toTestClaimForScript), "skipped")
      } else {
        return new SkippedClaim(result.description)
      }
    }
  })
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
  public claims: Array<TestClaim | TestClaims> = []

  constructor(public description: string | null) {}
}

export function withExample(description: string | null, claims: Array<TestClaim | TestClaims>): TestExample {
  const example = new TestExample(description)
  example.claims = claims
  return example
}

class TestScript {
  constructor (public location: string) {}
}

class TestFailure {
  constructor(public failure: Failure) {}
}

export function withFailure(failure: Failure): TestFailure {
  return new TestFailure(failure)
}

type TestClaim = ValidClaim | InvalidClaim | SkippedClaim

class ValidClaim {
  public result = "valid"
  constructor(public description: string) {}
}

class InvalidClaim {
  public result = "invalid"
  constructor(public scriptLocation: string, public description: string, public failure: Failure) {}
}

class SkippedClaim {
  public result = "skipped"
  constructor(public description: string) {}
}

class TestClaims {
  constructor(public description: string, public claims: Array<TestClaim>, public result: string) {}
}

export function withValidClaims(description: string, claims: Array<TestClaim>): TestClaims {
  return new TestClaims(description, claims, "valid")
}

export function withValidClaim(description: string): TestClaim {
  return new ValidClaim(description)
}

export function withInvalidClaims(description: string, claims: Array<TestClaim>): TestClaims {
  return new TestClaims(description, claims, "invalid")
}

export function withInvalidClaim(scriptLocation: string, descripion: string, failure: Failure): TestClaim {
  return new InvalidClaim(scriptLocation, descripion, failure)
}

export function withSkippedClaims(description: string, claims: Array<TestClaim>): TestClaims {
  return new TestClaims(description, claims, "skipped")
}

export function withSkippedClaim(descripion: string): TestClaim {
  return new SkippedClaim(descripion)
}