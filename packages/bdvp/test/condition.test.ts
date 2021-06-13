import { test } from 'uvu'
import { example, effect, condition, validate, behavior } from '../src/index.js'
import { behaviorReport, failingCondition, FakeReporter, exampleReport, skippedCondition, skippedObservation } from './helpers/FakeReporter.js'

test("failing condition", async () => {
  const reporter = new FakeReporter()

  await validate([
    behavior("behavior", [
      example()
        .description("failing condition")
        .script({
          assume: [
            condition("something throws an error", () => {
              const error: any = new Error()
              error.expected = "something"
              error.actual = "nothing"
              error.operator = "equals"
              error.stack = "funny stack"
              throw error
            }),
            condition("there is another condition", () => { })
          ],
          observe: [
            effect("does something that will get skipped", () => { })
          ]
        })
    ])
  ], { reporter })

  reporter.expectTestReportWith([
    behaviorReport("behavior", [
      exampleReport("failing condition", [
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