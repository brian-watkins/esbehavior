import { Reporter } from "../../src/Reporter";
import * as assert from 'uvu/assert'
import { ScenarioKind } from "../../src/Scenario";

export class FakeReporter implements Reporter {
  public logLines: Array<string> = []

  writeLine(message: string): void {
    this.logLines.push(message)
  }

  expectTestReportWith(docs: Array<TestDoc>, message: string) {
    const results = docs.reduce(sumResults, emptyResults)

    const expected = [
      "TAP version 13"
    ]
      .concat(docs.reduce((lines: Array<string>, doc) => lines.concat(doc.lines()), []))
      .concat([
        `1..${results.valid + results.invalid + results.skipped}`,
        `# valid observations: ${results.valid}`,
        `# invalid observations: ${results.invalid}`,
        `# skipped: ${results.skipped}`
      ])

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

export interface TestScenario extends Observable {
  lines(): Array<string>
}

enum ObservationType {
  Valid, Invalid, Skipped
}

export interface TestObservation {
  type: ObservationType
  lines(): Array<string>
}

export function docReport(description: string, scenarios: Array<TestScenario>): TestDoc {
  return {
    lines: () => {
      return [`# ${description}`]
        .concat(scenarios.reduce((lines: Array<string>, scenario) => lines.concat(scenario.lines()), []))
    },
    results: () => {
      return scenarios.reduce(sumResults, emptyResults)
    }
  }
}

const emptyResults = { valid: 0, invalid: 0, skipped: 0 }

function sumResults(total: ObservationResults, scenario: TestScenario) {
  const results = scenario.results()
  return {
    valid: total.valid + results.valid,
    invalid: total.invalid + results.invalid,
    skipped: total.skipped + results.skipped
  }
}

export interface TestAction {
  lines(): Array<string>
}

export function actionReport(description: string): TestAction {
  return {
    lines: () => {
      return [`# when ${description}`]
    }
  }
}

export function scenarioReport(description: string, actions: Array<TestAction>, observations: Array<TestObservation>): TestScenario {
  return {
    lines: () => {
      return [`# ${description}`]
        .concat(actions.reduce((lines: Array<string>, action) => lines.concat(action.lines()), []))
        .concat(observations.reduce((lines: Array<string>, observation) => lines.concat(observation.lines()), []))
    },
    results: () => ({
      valid: observations.filter(obs => obs.type === ObservationType.Valid).length,
      invalid: observations.filter(obs => obs.type === ObservationType.Invalid).length,
      skipped: observations.filter(obs => obs.type === ObservationType.Skipped).length
    })
  }
}

export function validObservation(description: string): TestObservation {
  return {
    type: ObservationType.Valid,
    lines: () => [
      `ok it ${description}`,
    ]
  }
}

export interface InvalidObservation {
  expected: string,
  actual: string,
  operator: string,
  stack: string
}

export function invalidObservation(description: string, details: InvalidObservation): TestObservation {
  return {
    type: ObservationType.Invalid,
    lines: () => [
      `not ok it ${description}`,
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
      `ok it ${description} # SKIP`
    ]
  }
}