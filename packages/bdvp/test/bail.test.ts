import { expect } from 'chai'
import { test } from 'uvu'
import { document, runDocs, context, example, effect, condition } from '../src/index'
import { docReport, exampleReport, failureReport, FakeReporter, passingCondition, validObservation } from './helpers/FakeReporter'

test("failing context generator function", async () => {
  const reporter = new FakeReporter()

  await runDocs([
    document("failing context generator", [
      example("context generator throws exception", context(() => {
        const error: any = new Error()
        error.stack = "funny stack"
        throw error
      }))
        .require([
          condition("it does nothing", (context) => { })
        ])
        .observe([
          effect("it works", (context) => {
            expect(3).to.equal(2)
          })
        ])
    ])
  ], { reporter })

  reporter.expectTestReportThatBails([
    docReport("failing context generator", [
      exampleReport("context generator throws exception", [], []),
      failureReport("funny stack")
    ])
  ], "it bails out when the context generator throws an error")
})

test("failing context teardown function", async () => {
  const reporter = new FakeReporter()

  await runDocs([
    document("failing context teardown", [
      example("context teardown throws exception", context(() => 7, () => {
        const error: any = new Error()
        error.stack = "awesome stack"
        throw error
      }))
        .require([
          condition("it does nothing", (context) => { })
        ])
        .observe([
          effect("it works", (context) => {
            expect(context).to.equal(7)
          })
        ]),
      example("another example")
        .observe([
          effect("will never run", () => {
            expect(7).to.equal(5)
          })
        ])
    ])
  ], { reporter })

  reporter.expectTestReportThatBails([
    docReport("failing context teardown", [
      exampleReport("context teardown throws exception", [
        passingCondition("it does nothing")
      ], [
        validObservation("it works")
      ]),
      failureReport("awesome stack")
    ])
  ], "it bails out when the context generator throws an error")
})
