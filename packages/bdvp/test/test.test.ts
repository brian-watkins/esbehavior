import { expect } from 'chai'
import { test } from 'uvu'
import { example, validate, effect, condition, behavior } from '../src/index.js'
import { passingCondition, behaviorReport, FakeReportWriter, invalidObservation, exampleReport, validObservation } from './helpers/FakeReportWriter.js'

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

test("it runs an example with no description", async () => {
  const writer = new FakeReportWriter()

  await validate([
    behavior("a single example; no description", [
      example()
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
    behaviorReport("a single example; no description", [
      exampleReport(null, [], [
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
          operator: "equals", expected: "something", actual: "nothing", stack: "fake stack"
        }),
        validObservation("passes")
      ])
    ])
  ], "it prints the expected output for an example with an observation that throws an AssertionError")
})

test("it runs conditions", async () => {
  const writer = new FakeReportWriter()

  await validate([
    behavior("a single test", [
      example({ init: () => ({ val: 7 }) })
        .description("multiple conditions")
        .script({
          assume: [
            condition("the value is incremented", (context) => { context.val++ }),
            condition("the value is incremented", (context) => { context.val++ }),
            condition("the value is incremented", (context) => { context.val++ })
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
      exampleReport("multiple conditions", [
        passingCondition("the value is incremented"),
        passingCondition("the value is incremented"),
        passingCondition("the value is incremented")
      ], [
        validObservation("it compares the correct number")
      ])
    ])
  ], "it prints the expected output for an example with multiple conditions")
})

test.run()