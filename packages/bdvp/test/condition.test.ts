import { test } from 'uvu'
import { document, scenario, runDocs } from '../src/index'
import { docReport, failingCondition, FakeReporter, scenarioReport } from './helpers/FakeReporter'

test("it runs multiple describes", async () => {
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
        .observeThat([])
    ])
  ], { reporter })

  reporter.expectTestReportWith([
    docReport("document", [
      scenarioReport("failing condition", [
        failingCondition("something throws an error", {
          operator: "equals", expected: "something", actual: "nothing", stack: "funny stack"
        }),
      ], [])
    ])
  ], "it prints a failure for the action")
})

test.run()