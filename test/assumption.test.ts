import { test } from 'uvu'
import { example, effect, condition, validate, behavior, step } from '../src/index.js'
import { FakeReporter, withBehavior, withExample, withInvalidClaim, withSkippedClaim } from './helpers/FakeReporter.js'

test("failing condition", async () => {
  const reporter = new FakeReporter()

  await validate([
    behavior("behavior", [
      example()
        .description("failing condition")
        .script({
          prepare: [
            condition("something throws an error", () => {
              throw {
                expected: "something",
                actual: "nothing",
                operator: "equals"
              }
            }),
            condition("there is another condition", () => { })
          ],
          observe: [
            effect("does something that will get skipped", () => { })
          ]
        })
    ])
  ], { reporter })

  reporter.expectReport([
    withBehavior("behavior", [
      withExample("failing condition", [
        withInvalidClaim("something throws an error", { 
          operator: "equals", expected: "something", actual: "nothing"
        }),
        withSkippedClaim("there is another condition"),
        withSkippedClaim("does something that will get skipped")
      ])
    ])
  ])

  reporter.expectSummary({
    valid: 0,
    invalid: 1,
    skipped: 2, 
  })
})

test("failing step", async () => {
  const reporter = new FakeReporter()

  await validate([
    behavior("behavior", [
      example()
        .description("failing step")
        .script({
          perform: [
            step("something throws an error", () => {
              throw {
                expected: "a",
                actual: "b",
                operator: "equals"
              }
            }),
            step("there is another step", () => { })
          ],
          observe: [
            effect("does something that will get skipped", () => { })
          ]
        })
    ])
  ], { reporter })

  reporter.expectReport([
    withBehavior("behavior", [
      withExample("failing step", [
        withInvalidClaim("something throws an error", {
          operator: "equals", expected: "a", actual: "b"
        }),
        withSkippedClaim("there is another step"),
        withSkippedClaim("does something that will get skipped")
      ])
    ])
  ])

  reporter.expectSummary({
    valid: 0,
    invalid: 1,
    skipped: 2
  })
})

test.run()