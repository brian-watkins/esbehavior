import { test } from 'uvu'
import { document, scenario, it, runDocs } from '../src/index'
import { docReport, failingCondition, FakeReporter, scenarioReport, skippedCondition, skippedObservation } from './helpers/FakeReporter'

test("failing condition", async () => {
  const reporter = new FakeReporter()

  await runDocs([
    document("document", [
      scenario("failing condition")
        .when("something throws an error", () => {
          const error: any = new Error()
          error.expected = "something"
          error.actual = "nothing"
          error.operator = "equals"
          error.stack = "funny stack"
          throw error
        })
        .when("there is another condition", () => {})
        .observeThat([
          it("does something that will get skipped", () => {})
        ])
    ])
  ], { reporter })

  reporter.expectTestReportWith([
    docReport("document", [
      scenarioReport("failing condition", [
        failingCondition("something throws an error", {
          operator: "equals", expected: "something", actual: "nothing", stack: "funny stack"
        }),
        skippedCondition("there is another condition")
      ], [
        skippedObservation("does something that will get skipped")
      ])
    ])
  ], "it prints a failure for the condition")
})

test.run()