import { expect } from 'chai'
import { test } from 'uvu'
import { document, scenario, it, runDocs, context } from '../src/index'
import { actionReport, docReport, FakeReporter, invalidObservation, scenarioReport, validObservation } from './helpers/FakeReporter'

test("it runs a single passing test", async () => {
  const reporter = new FakeReporter()

  await runDocs([
    document("a single test", [
      scenario("my first test")
        .observeThat([
          it("does something cool", (something) => {
            // nothing
          })
        ])
    ])
  ], { reporter })

  reporter.expectTestReportWith([
    docReport("a single test", [
      scenarioReport("my first test", [], [
        validObservation("does something cool")
      ])
    ])
  ], "it prints the expected output for a scenario with a single valid observation")
})

test("it runs more than one passing test", async () => {
  const reporter = new FakeReporter()

  await runDocs([
    document("a single test", [
      scenario("several observations")
        .observeThat([
          it("does something cool", () => {
            // nothing
          }),
          it("does something else cool", () => {
            // nothing
          })
        ])
    ])
  ], { reporter })

  reporter.expectTestReportWith([
    docReport("a single test", [
      scenarioReport("several observations", [], [
        validObservation("does something cool"),
        validObservation("does something else cool")
      ])
    ])
  ], "it prints the expected output for a scenarion with multiple valid observations")
})

test("it runs a failing test", async () => {
  const reporter = new FakeReporter()

  await runDocs([
    document("a single test", [
      scenario("failing observation")
        .observeThat([
          it("does something that fails", () => {
            const testFailure: any = new Error()
            testFailure.expected = "something"
            testFailure.actual = "nothing"
            testFailure.operator = "equals"
            testFailure.stack = "fake stack"
            throw testFailure
          }),
          it("passes", () => { })
        ])
    ])
  ], { reporter })

  reporter.expectTestReportWith([
    docReport("a single test", [
      scenarioReport("failing observation", [], [
        invalidObservation("does something that fails", {
          operator: "equals", expected: "something", actual: "nothing", stack: "fake stack"
        }),
        validObservation("passes")
      ])
    ])
  ], "it prints the expected output for a scenario with an observation that throws an AssertionError")
})

test("it runs when blocks", async () => {
  const reporter = new FakeReporter()

  await runDocs([
    document("a single test", [
      scenario("multiple when blocks", context(() => ({ val: 7 })))
        .when("the value is incremented", (context) => { context.val++ })
        .when("the value is incremented", (context) => { context.val++ })
        .when("the value is incremented", (context) => { context.val++ })
        .observeThat([
          it("compares the correct number", (context) => {
            expect(context.val).to.equal(10)
          })
        ])
    ])
  ], { reporter })

  reporter.expectTestReportWith([
    docReport("a single test", [
      scenarioReport("multiple when blocks", [
        actionReport("the value is incremented"),
        actionReport("the value is incremented"),
        actionReport("the value is incremented")
      ], [
        validObservation("compares the correct number")
      ])
    ])
  ], "it prints the expected output for a scenario with multiple when blocks")
})

test.run()