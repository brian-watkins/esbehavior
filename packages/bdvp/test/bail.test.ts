import { expect } from 'chai'
import { test } from 'uvu'
import { validate, example, effect, condition, behavior } from '../src/index.js'
import { behaviorReport, exampleReport, failureReport, FakeReportWriter, passingCondition, validObservation } from './helpers/FakeReportWriter.js'

test("failing context generator function", async () => {
  const writer = new FakeReportWriter()

  await validate([
    behavior("failing context generator", [
      example({
        init: () => {
          const error: any = new Error()
          error.stack = "funny stack"
          throw error
        }
      })
        .description("context generator throws exception")
        .script({
          prepare: [
            condition("it does nothing", (context) => { })
          ],
          observe: [
            effect("it works", (context) => {
              expect(3).to.equal(2)
            })
          ]
        })
    ])
  ], { writer })

  writer.expectTestReportThatBails([
    behaviorReport("failing context generator", [
      exampleReport("context generator throws exception", [], []),
      failureReport("funny stack")
    ])
  ], "it bails out when the context generator throws an error")
})

test("failing context teardown function", async () => {
  const writer = new FakeReportWriter()

  await validate([
    behavior("failing context teardown", [
      example({
        init: () => 7,
        teardown: () => {
          const error: any = new Error()
          error.stack = "awesome stack"
          throw error
        }
      })
        .description("context teardown throws exception")
        .script({
          prepare: [
            condition("it does nothing", (context) => { })
          ],
          observe: [
            effect("it works", (context) => {
              expect(context).to.equal(7)
            })
          ]
        }),
      example({ init: () => 7 })
        .description("another example")
        .script({
          observe: [
            effect("will never run", () => {
              expect(7).to.equal(5)
            })
          ]
        })
    ])
  ], { writer })

  writer.expectTestReportThatBails([
    behaviorReport("failing context teardown", [
      exampleReport("context teardown throws exception", [
        passingCondition("it does nothing")
      ], [
        validObservation("it works")
      ]),
      failureReport("awesome stack")
    ])
  ], "it bails out when the context generator throws an error")
})
