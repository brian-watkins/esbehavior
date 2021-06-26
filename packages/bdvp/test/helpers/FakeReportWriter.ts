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

enum ConditionType {
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

export interface TestCondition {
  type: ConditionType
  lines(): Array<string>
}

const ASSUMPTION_DESIGNATOR = "Assume:"

export function passingCondition(description: string): TestCondition {
  return {
    type: ConditionType.Valid,
    lines: () => {
      return [`ok ${ASSUMPTION_DESIGNATOR} ${description}`]
    }
  }
}

export function failingCondition(description: string, details: FailureDetails): TestCondition {
  return {
    type: ConditionType.Invalid,
    lines: () => [
      `not ok ${ASSUMPTION_DESIGNATOR} ${description}`,
      "  ---",
      `  operator: ${details.operator}`,
      `  expected: ${details.expected}`,
      `  actual:   ${details.actual}`,
      "  stack: |-",
      `    ${details.stack}`,
      "  ...",
    ]
  }
}

export function skippedCondition(description: string): TestCondition {
  return {
    type: ConditionType.Skipped,
    lines: () => [
      `ok ${ASSUMPTION_DESIGNATOR} ${description} # SKIP`
    ]
  }
}

export function exampleReport(description: string | null, conditions: Array<TestCondition>, observations: Array<TestObservation>): TestExample {
  return exampleScript((description ? [`# Example: ${description}`] : [ "# Example" ]), conditions, observations)
}

export function anotherScript(conditions: Array<TestCondition>, observations: Array<TestObservation>): TestExample {
  return exampleScript([], conditions, observations)
}

function exampleScript(description: Array<string>, conditions: Array<TestCondition>, observations: Array<TestObservation>): TestExample {
  return {
    lines: () => {
      return description
        .concat(conditions.reduce((lines: Array<string>, action) => lines.concat(action.lines()), []))
        .concat(observations.reduce((lines: Array<string>, observation) => lines.concat(observation.lines()), []))
    },
    results: () => ({
      valid: conditionsMatching(conditions, ConditionType.Valid) + observationsMatching(observations, ObservationType.Valid),
      invalid: conditionsMatching(conditions, ConditionType.Invalid) + observationsMatching(observations, ObservationType.Invalid),
      skipped: conditionsMatching(conditions, ConditionType.Skipped) + observationsMatching(observations, ObservationType.Skipped)
    })
  }
}

export function failureReport(failureReason: string): TestExample {
  return {
    lines: () => [ `Bail out! ${failureReason}` ],
    results: () => emptyResults
  }
}

function conditionsMatching(conditions: Array<TestCondition>, expectedType: ConditionType): number {
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
  expected: string,
  actual: string,
  operator: string,
  stack: string
}

export function invalidObservation(description: string, details: FailureDetails): TestObservation {
  return {
    type: ObservationType.Invalid,
    lines: () => [
      `not ok ${description}`,
      "  ---",
      `  operator: ${details.operator}`,
      `  expected: ${details.expected}`,
      `  actual:   ${details.actual}`,
      "  stack: |-",
      `    ${details.stack}`,
      "  ...",
    ]
  }
}

export function skippedObservation(description: string): TestObservation {
  return {
    type: ObservationType.Skipped,
    lines: () => [
      `ok ${description} # SKIP`
    ]
  }
}