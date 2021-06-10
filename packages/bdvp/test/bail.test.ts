import { expect } from 'chai'
import { test } from 'uvu'
import { document, validate, example, effect, condition } from '../src/index.js'
import { docReport, exampleReport, failureReport, FakeReporter, passingCondition, validObservation } from './helpers/FakeReporter.js'

test("failing context generator function", async () => {
  const reporter = new FakeReporter()

  await validate([
    document("failing context generator", [
      example({
        subject: () => {
          const error: any = new Error()
          error.stack = "funny stack"
          throw error
        }
      })
        .description("context generator throws exception")
        .script({
          assume: [
            condition("it does nothing", (context) => { })
          ],
          observe: [
            effect("it works", (context) => {
              expect(3).to.equal(2)
            })
          ]
        })
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

  await validate([
    document("failing context teardown", [
      example({
        subject: () => 7,
        teardown: () => {
          const error: any = new Error()
          error.stack = "awesome stack"
          throw error
        }
      })
        .description("context teardown throws exception")
        .script({
          assume: [
            condition("it does nothing", (context) => { })
          ],
          observe: [
            effect("it works", (context) => {
              expect(context).to.equal(7)
            })
          ]
        }),
      example({ subject: () => 7 })
        .description("another example")
        .script({
          observe: [
            effect("will never run", () => {
              expect(7).to.equal(5)
            })
          ]
        })
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
