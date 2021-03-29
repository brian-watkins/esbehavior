import { Reporter } from "../../src/Reporter";
import * as assert from 'uvu/assert'

export class FakeReporter implements Reporter {
  public logLines: Array<string> = []

  writeLine(message: string): void {
    this.logLines.push(message)
  }

  expectTestReportWith(docs: Array<TestDoc>, message: string) {
    const totalObservations = docs.reduce((count, doc) => count + doc.totalObservations(), 0)

    const expected = [
      "TAP version 13"
    ]
      .concat(docs.reduce((lines: Array<string>, doc) => lines.concat(doc.lines()), []))
      .concat([`1..${totalObservations}`])

    assert.equal(this.logLines, expected, message)
  }
}

export interface TestDoc {
  lines(): Array<string>
  totalObservations(): number
}

export interface TestScenario {
  lines(): Array<string>
  totalObservations(): number
}

export interface TestObservation {
  lines(): Array<string>
}

export function docReport(description: string, scenarios: Array<TestScenario>): TestDoc {
  return {
    lines: () => {
      return [`# ${description}`]
        .concat(scenarios.reduce((lines: Array<string>, scenario) => lines.concat(scenario.lines()), []))
    },
    totalObservations: () => {
      return scenarios.reduce((count, scenario) => count + scenario.totalObservations(), 0)
    }
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
    totalObservations: () => {
      return observations.length
    }
  }
}

export function validObservation(description: string): TestObservation {
  return {
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
    lines: () => [
      `ok it ${description} # SKIP`
    ]
  }
}