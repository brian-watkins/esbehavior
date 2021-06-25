import { test } from 'uvu'
import { example, effect, condition, validate, behavior } from '../src/index.js'
import { behaviorReport, failingCondition, FakeReportWriter, exampleReport, skippedCondition, skippedObservation } from './helpers/FakeReportWriter.js'

test("multiline actual and expected in error with bad TAP-like characters", async () => {
  const writer = new FakeReportWriter()

  await validate([
    behavior("behavior", [
      example()
        .description("failing condition with multiline TAP-like output in actual")
        .script({
          assume: [
            condition("something throws an error", () => {
              const error: any = new Error()
              error.expected = "# Behavior: A Sample Behavior\n# Example: Comparing some numbers\n# tests 1\n# pass 1\n# fail 0\n# skip 0"
              error.actual = "# Behavior: A Sample Behaviorsssss\n# Example: Comparing some numbers\n# tests 1\n# pass 1\n# fail 0\n# skip 0"
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
  ], { writer })

  writer.expectTestReportWith([
    behaviorReport("behavior", [
      exampleReport("failing condition with multiline TAP-like output in actual", [
        failingCondition("something throws an error", {
          operator: "equals",
          expected: "\"# Behavior: A Sample Behavior\\n# Example: Comparing some numbers\\n# tests 1\\n# pass 1\\n# fail 0\\n# skip 0\"",
          actual: '\"# Behavior: A Sample Behaviorsssss\\n# Example: Comparing some numbers\\n# tests 1\\n# pass 1\\n# fail 0\\n# skip 0\"',
          stack: "funny stack"
        }),
        skippedCondition("there is another condition")
      ], [
        skippedObservation("does something that will get skipped")
      ])
    ])
  ], "it escapes line breaks in the actual output")
})

test("non-string actual and expected", async () => {
  const writer = new FakeReportWriter()

  await validate([
    behavior("behavior", [
      example()
        .description("failing condition with non-string actual and expected")
        .script({
          assume: [
            condition("something throws an error", () => {
              const error: any = new Error()
              error.expected = 7
              error.actual = [ 9, 10, 11 ]
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
  ], { writer })

  writer.expectTestReportWith([
    behaviorReport("behavior", [
      exampleReport("failing condition with non-string actual and expected", [
        failingCondition("something throws an error", {
          operator: "equals",
          expected: "7",
          actual: "[9,10,11]",
          stack: "funny stack"
        }),
        skippedCondition("there is another condition")
      ], [
        skippedObservation("does something that will get skipped")
      ])
    ])
  ], "it escapes line breaks in the actual output")
})

test.run()