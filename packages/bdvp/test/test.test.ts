import { expect } from 'chai'
import { test } from 'uvu'
import { document, example, runDocs, effect, condition } from '../src/index'
import { passingCondition, docReport, FakeReporter, invalidObservation, exampleReport, validObservation } from './helpers/FakeReporter'

test("it runs a single passing claim", async () => {
  const reporter = new FakeReporter()

  await runDocs([
    document("a single test", [
      example("my first test")
        .observe([
          effect("does something cool", (something) => {
            // nothing
          })
        ])
    ])
  ], { reporter })

  reporter.expectTestReportWith([
    docReport("a single test", [
      exampleReport("my first test", [], [
        validObservation("does something cool")
      ])
    ])
  ], "it prints the expected output for an example with a single valid observation")
})

test("it runs more than one passing claim", async () => {
  const reporter = new FakeReporter()

  await runDocs([
    document("a single test", [
      example("several observations")
        .observe([
          effect("does something cool", () => {
            // nothing
          }),
          effect("does something else cool", () => {
            // nothing
          })
        ])
    ])
  ], { reporter })

  reporter.expectTestReportWith([
    docReport("a single test", [
      exampleReport("several observations", [], [
        validObservation("does something cool"),
        validObservation("does something else cool")
      ])
    ])
  ], "it prints the expected output for an example with multiple valid observations")
})

test("it runs a failing test", async () => {
  const reporter = new FakeReporter()

  await runDocs([
    document("a single test", [
      example("failing observation")
        .observe([
          effect("does something that fails", () => {
            const testFailure: any = new Error()
            testFailure.expected = "something"
            testFailure.actual = "nothing"
            testFailure.operator = "equals"
            testFailure.stack = "fake stack"
            throw testFailure
          }),
          effect("passes", () => { })
        ])
    ])
  ], { reporter })

  reporter.expectTestReportWith([
    docReport("a single test", [
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
  const reporter = new FakeReporter()

  await runDocs([
    document("a single test", [
      example("multiple conditions", { subject: () => ({ val: 7 }) })
        .require([
          condition("the value is incremented", (context) => { context.val++ }),
          condition("the value is incremented", (context) => { context.val++ }),
          condition("the value is incremented", (context) => { context.val++ })
        ])
        .observe([
          effect("it compares the correct number", (context) => {
            expect(context.val).to.equal(10)
          })
        ])
    ])
  ], { reporter })

  reporter.expectTestReportWith([
    docReport("a single test", [
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