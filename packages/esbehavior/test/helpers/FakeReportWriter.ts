import { Writer } from "../../src/Reporter";
import * as assert from 'uvu/assert'

export class FakeReportWriter implements Writer {
  public logLines: Array<string> = []

  writeLine(message: string): void {
    this.logLines.push(message)
  }

  expectTestReportWith(docs: Array<TestDoc>, message: string) {
    const results = docs.reduce(sumResults, emptyResults)

    const total = results.valid + results.invalid + results.skipped;

    const expected = [
      "TAP version 13"
    ]
      .concat(docs.reduce((lines: Array<string>, doc) => lines.concat(doc.lines()), []))
      .concat([
        `1..${total}`,
        `# tests ${total}`,
        `# pass ${results.valid}`,
        `# fail ${results.invalid}`,
        `# skip ${results.skipped}`
      ])

    assert.equal(this.logLines, expected, message)
  }

  expectTestReportThatBails(docs: Array<TestDoc>, message: string) {
    const expected = [
      "TAP version 13"
    ]
      .concat(docs.reduce((lines: Array<string>, doc) => lines.concat(doc.lines()), []))

    assert.equal(this.logLines, expected, message)
  }
}

interface Observable {
  results(): ObservationResults
}

export interface TestDoc extends Observable {
  lines(): Array<string>
}

interface ObservationResults {
  valid: number
  invalid: number
  skipped: number
}

export interface TestExample extends Observable {
  lines(): Array<string>
}

enum ObservationType {
  Valid, Invalid, Skipped
}

enum AssumptionType {
  Valid, Invalid, Skipped
}

export interface TestObservation {
  type: ObservationType
  lines(): Array<string>
}

export function behaviorReport(description: string, scenarios: Array<TestExample>): TestDoc {
  return {
    lines: () => {
      return [`# Behavior: ${description}`]
        .concat(scenarios.reduce((lines: Array<string>, scenario) => lines.concat(scenario.lines()), []))
    },
    results: () => {
      return scenarios.reduce(sumResults, emptyResults)
    }
  }
}

const emptyResults = { valid: 0, invalid: 0, skipped: 0 }

function sumResults(total: ObservationResults, scenario: TestExample) {
  const results = scenario.results()
  return {
    valid: total.valid + results.valid,
    invalid: total.invalid + results.invalid,
    skipped: total.skipped + results.skipped
  }
}

export interface TestAssumption {
  type: AssumptionType
  lines(): Array<string>
}

const CONDITION_DESIGNATOR = "Prepare:"
const STEP_DESIGNATOR = "Perform:"

function passingAssumption(description: string): TestAssumption {
  return {
    type: AssumptionType.Valid,
    lines: () => {
      return [`ok ${description}`]
    }
  }
}

function failingAssumption(description: string, details: FailureDetails): TestAssumption {
  return {
    type: AssumptionType.Invalid,
    lines: () => errorLines(description, details)
  }
}

function skippedAssumption(description: string): TestAssumption {
  return {
    type: AssumptionType.Skipped,
    lines: () => [
      `ok ${description} # SKIP`
    ]
  }
}

export function passingCondition(description: string): TestAssumption {
  return passingAssumption(`${CONDITION_DESIGNATOR} ${description}`)
}

export function failingCondition(description: string, details: FailureDetails): TestAssumption {
  return failingAssumption(`${CONDITION_DESIGNATOR} ${description}`, details)
}

export function skippedCondition(description: string): TestAssumption {
  return skippedAssumption(`${CONDITION_DESIGNATOR} ${description}`)
}

export function passingStep(description: string): TestAssumption {
  return passingAssumption(`${STEP_DESIGNATOR} ${description}`)
}

export function skippedStep(description: string): TestAssumption {
  return skippedAssumption(`${STEP_DESIGNATOR} ${description}`)
}

export function failingStep(description: string, details: FailureDetails): TestAssumption {
  return failingAssumption(`${STEP_DESIGNATOR} ${description}`, details)
}

export function exampleReport(description: string | null, conditions: Array<TestAssumption>, observations: Array<TestObservation>): TestExample {
  return exampleScript((description ? [`# Example: ${description}`] : ["# Example"]), conditions, observations)
}

export function anotherScript(conditions: Array<TestAssumption>, observations: Array<TestObservation>): TestExample {
  return exampleScript([], conditions, observations)
}

function exampleScript(description: Array<string>, conditions: Array<TestAssumption>, observations: Array<TestObservation>): TestExample {
  return {
    lines: () => {
      return description
        .concat(conditions.reduce((lines: Array<string>, action) => lines.concat(action.lines()), []))
        .concat(observations.reduce((lines: Array<string>, observation) => lines.concat(observation.lines()), []))
    },
    results: () => ({
      valid: conditionsMatching(conditions, AssumptionType.Valid) + observationsMatching(observations, ObservationType.Valid),
      invalid: conditionsMatching(conditions, AssumptionType.Invalid) + observationsMatching(observations, ObservationType.Invalid),
      skipped: conditionsMatching(conditions, AssumptionType.Skipped) + observationsMatching(observations, ObservationType.Skipped)
    })
  }
}

export function failureReport(failureReason: string): TestExample {
  return {
    lines: () => [`Bail out! ${failureReason}`],
    results: () => emptyResults
  }
}

function conditionsMatching(conditions: Array<TestAssumption>, expectedType: AssumptionType): number {
  return conditions.filter(condition => condition.type === expectedType).length
}

function observationsMatching(observations: Array<TestObservation>, expectedType: ObservationType): number {
  return observations.filter(observation => observation.type === expectedType).length
}

export function validObservation(description: string): TestObservation {
  return {
    type: ObservationType.Valid,
    lines: () => [
      `ok ${description}`,
    ]
  }
}

export interface FailureDetails {
  expected?: string,
  actual?: string,
  operator?: string,
  at?: string,
  stack?: string,
  error?: string
}

export function invalidObservation(description: string, details: FailureDetails): TestObservation {
  return {
    type: ObservationType.Invalid,
    lines: () => errorLines(description, details)
  }
}

function errorLines(description: string, details: FailureDetails): Array<string> {
  let output = [
    `not ok ${description}`,
    "  ---"
  ]
    .concat(details.operator ? [`  operator: ${details.operator}`] : [])
    .concat(details.expected ? [`  expected: ${details.expected}`] : [])
    .concat(details.actual ? [`  actual:   ${details.actual}`] : [])
    .concat(details.at ? [`  at: ${details.at}`] : [])
    .concat(details.error ? [`  error: ${details.error}`] : [])

  if (details.stack) {
    output = output.concat([
      "  stack: |-"
    ])
      .concat(details.stack.split("\n").map(l => `    ${l}`))
  }

  return output.concat([
    "  ..."
  ])
}

export function skippedObservation(description: string): TestObservation {
  return {
    type: ObservationType.Skipped,
    lines: () => [
      `ok ${description} # SKIP`
    ]
  }
}