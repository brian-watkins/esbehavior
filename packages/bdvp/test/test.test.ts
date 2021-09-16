import { expect } from 'chai'
import { test } from 'uvu'
import { example, validate, effect, condition, behavior, step } from '../src/index.js'
import { passingCondition, behaviorReport, FakeReportWriter, invalidObservation, exampleReport, validObservation, passingStep } from './helpers/FakeReportWriter.js'

test("it runs a single passing claim", async () => {
  const writer = new FakeReportWriter()

  await validate([
    behavior("a single test", [
      example()
        .description("my first test")
        .script({
          observe: [
            effect("does something cool", () => {
              // nothing
            })
          ]
        })
    ])
  ], { writer })

  writer.expectTestReportWith([
    behaviorReport("a single test", [
      exampleReport("my first test", [], [
        validObservation("does something cool")
      ])
    ])
  ], "it prints the expected output for an example with a single valid observation")
})

test("it runs more than one passing claim", async () => {
  const writer = new FakeReportWriter()

  await validate([
    behavior("a single test", [
      example()
        .description("several observations")
        .script({
          observe: [
            effect("does something cool", () => {
              // nothing
            }),
            effect("does something else cool", () => {
              // nothing
            })
          ]
        })
    ])
  ], { writer })

  writer.expectTestReportWith([
    behaviorReport("a single test", [
      exampleReport("several observations", [], [
        validObservation("does something cool"),
        validObservation("does something else cool")
      ])
    ])
  ], "it prints the expected output for an example with multiple valid observations")
})

test("it runs a failing test", async () => {
  const writer = new FakeReportWriter()

  await validate([
    behavior("a single test", [
      example()
        .description("failing observation")
        .script({
          observe: [
            effect("does something that fails", () => {
              const testFailure: any = new Error()
              testFailure.expected = "something"
              testFailure.actual = "nothing"
              testFailure.operator = "equals"
              testFailure.stack = "fake stack"
              throw testFailure
            }),
            effect("passes", () => { })
          ]
        })
    ])
  ], { writer })

  writer.expectTestReportWith([
    behaviorReport("a single test", [
      exampleReport("failing observation", [], [
        invalidObservation("does something that fails", {
          operator: "equals", expected: "\"something\"", actual: "\"nothing\"", stack: "fake stack"
        }),
        validObservation("passes")
      ])
    ])
  ], "it prints the expected output for an example with an observation that throws an AssertionError")
})

test("it runs assumptions", async () => {
  const writer = new FakeReportWriter()

  await validate([
    behavior("a single test", [
      example({ init: () => ({ val: 0 }) })
        .description("multiple assumptions")
        .script({
          prepare: [
            condition("the value is set", (context) => { context.val = 8 })
          ],
          perform: [
            step("the value is incremented", (context) => { context.val++ }),
            step("the value is incremented", (context) => { context.val++ })
          ],
          observe: [
            effect("it compares the correct number", (context) => {
              expect(context.val).to.equal(10)
            })
          ]
        })
    ])
  ], { writer })

  writer.expectTestReportWith([
    behaviorReport("a single test", [
      exampleReport("multiple assumptions", [
        passingCondition("the value is set"),
        passingStep("the value is incremented"),
        passingStep("the value is incremented")
      ], [
        validObservation("it compares the correct number")
      ])
    ])
  ], "it prints the expected output for an example with multiple assumptions")
})

test("it runs example with no description", async () => {
  const writer = new FakeReportWriter()

  await validate([
    behavior("a single test", [
      example({ init: () => ({ val: 0 }) })
        .script({
          prepare: [
            condition("the value is set", (context) => { context.val = 8 })
          ],
          perform: [
            step("the value is incremented", (context) => { context.val++ }),
            step("the value is incremented", (context) => { context.val++ })
          ],
          observe: [
            effect("it compares the correct number", (context) => {
              expect(context.val).to.equal(10)
            })
          ]
        })
    ])
  ], { writer })

  writer.expectTestReportWith([
    behaviorReport("a single test", [
      exampleReport(null, [
        passingCondition("the value is set"),
        passingStep("the value is incremented"),
        passingStep("the value is incremented")
      ], [
        validObservation("it compares the correct number")
      ])
    ])
  ], "it prints the expected output for an example with no description")
})

test.run()