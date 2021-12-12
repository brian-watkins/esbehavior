import { test } from 'uvu'
import { example, effect, condition, validate, behavior, step } from '../src/index.js'
import { behaviorReport, failingCondition, FakeReportWriter, exampleReport, skippedCondition, skippedObservation, failingStep, skippedStep } from './helpers/FakeReportWriter.js'

test("failing condition", async () => {
  const writer = new FakeReportWriter()

  await validate([
    behavior("behavior", [
      example()
        .description("failing condition")
        .script({
          prepare: [
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
  ], { writer })

  writer.expectTestReportWith([
    behaviorReport("behavior", [
      exampleReport("failing condition", [
        failingCondition("something throws an error", {
          operator: "equals", expected: "\"something\"", actual: "\"nothing\"", stack: "funny stack"
        }),
        skippedCondition("there is another condition")
      ], [
        skippedObservation("does something that will get skipped")
      ])
    ])
  ], "it prints a failure for the condition")
})

test("failing step", async () => {
  const writer = new FakeReportWriter()

  await validate([
    behavior("behavior", [
      example()
        .description("failing step")
        .script({
          perform: [
            step("something throws an error", () => {
              const error: any = new Error()
              error.expected = "something"
              error.actual = "nothing"
              error.operator = "equals"
              error.stack = "funny stack"
              throw error
            }),
            step("there is another step", () => { })
          ],
          observe: [
            effect("does something that will get skipped", () => { })
          ]
        })
    ])
  ], { writer })

  writer.expectTestReportWith([
    behaviorReport("behavior", [
      exampleReport("failing step", [
        failingStep("something throws an error", {
          operator: "equals", expected: "\"something\"", actual: "\"nothing\"", stack: "funny stack"
        }),
        skippedStep("there is another step")
      ], [
        skippedObservation("does something that will get skipped")
      ])
    ])
  ], "it prints a failure for the step")
})

test.run()