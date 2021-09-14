import { test } from 'uvu'
import * as assert from 'uvu/assert'
import { behaviorReport, FakeReportWriter, invalidObservation, passingCondition, exampleReport, validObservation } from './helpers/FakeReportWriter.js'
import { validate, example, effect, condition, behavior } from '../src/index.js'
import { expect } from 'chai'

test("it runs an example with an async given", async () => {
  const writer = new FakeReportWriter()

  await validate([
    behavior("a single test", [
      example({
        init: () => {
          return new Promise(resolve => {
            setTimeout(() => resolve(7), 30)
          })
        }
      })
        .description("async given")
        .script({
          observe: [
            effect("compares the right numbers", (actual) => {
              assert.equal(actual, 7, "it does the thing")
            })
          ]
        })
    ])
  ], { writer })

  writer.expectTestReportWith([
    behaviorReport("a single test", [
      exampleReport("async given", [], [
        validObservation("compares the right numbers")
      ])
    ])
  ], "it prints the expected output for an example with an async given")
})

test("it runs an example with an async context generator and async observation", async () => {
  const writer = new FakeReportWriter()

  let teardownValue = 0

  await validate([
    behavior("a single test", [
      example({
        init: () => {
          return new Promise<number>(resolve => {
            setTimeout(() => resolve(7), 30)
          })
        },
        teardown: async (context) => {
          await new Promise<void>(resolve => {
            setTimeout(() => {
              teardownValue = context + 2
              resolve()
            }, 30)
          })
        }
      })
        .description("async context and observation")
        .script({
          observe: [
            effect("async compares the right numbers", async (actual) => {
              const fetchedValue = await new Promise(resolve => {
                setTimeout(() => resolve(actual + 5), 30)
              })
              try {
                expect(fetchedValue).to.equal(15)
              } catch (err) {
                err.stack = "fake stack"
                throw err
              }
            }),
            effect("does something sync", (actual) => {
              assert.equal(actual, 7)
            })
          ]
        })
    ])
  ], { writer })

  assert.equal(teardownValue, 9, "it executes the async teardown function on the context")

  writer.expectTestReportWith([
    behaviorReport("a single test", [
      exampleReport("async context and observation", [], [
        invalidObservation("async compares the right numbers", {
          operator: "strictEqual",
          expected: "15",
          actual: "12",
          stack: "fake stack"
        }),
        validObservation("does something sync")
      ])
    ])
  ], "it prints the expected output for an example with an async context generator and teardown and async observation")
})

test("it runs async conditions", async () => {
  const writer = new FakeReportWriter()

  await validate([
    behavior("a single test", [
      example({
        init: () => ({ val: 7 })
      })
        .description("multiple conditions")
        .script({
          prepare: [
            condition("the value is incremented", (context) => { context.val++ }),
            condition("the value is incremented asynchronously", (context) => {
              return new Promise(resolve => {
                setTimeout(() => {
                  context.val++
                  resolve()
                }, 30)
              })
            }),
            condition("the value is incremented", (context) => { context.val++ })
          ],
          observe: [
            effect("compares the correct number", (context) => {
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
        passingCondition("the value is incremented asynchronously"),
        passingCondition("the value is incremented")
      ], [
        validObservation("compares the correct number")
      ])
    ])
  ], "it prints the expected output for an example with multiple conditions")
})

test.run()