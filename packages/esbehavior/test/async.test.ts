import { test } from 'uvu'
import * as assert from 'uvu/assert'
import { validate, example, effect, condition, behavior } from '../src/index.js'
import { expect } from 'chai'
import { FakeReporter, withBehavior, withExample, withInvalidClaim, withValidClaim } from './helpers/FakeReporter.js'

test("it runs an example with an async given", async () => {
  const reporter = new FakeReporter()

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
  ], { reporter })

  reporter.expectReport([
    withBehavior("a single test", [
      withExample("async given", [
        withValidClaim("compares the right numbers")
      ])
    ])
  ])

  reporter.expectSummary({
    valid: 1,
    invalid: 0,
    skipped: 0
  })
})

test("it runs an example with an async context generator and async observation", async () => {
  const reporter = new FakeReporter()

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
              } catch (err: any) {
                throw {
                  expected: err.expected,
                  actual: err.actual,
                  operator: err.operator,
                  stack: "fake stack"
                }
              }
            }),
            effect("does something sync", (actual) => {
              assert.equal(actual, 7)
            })
          ]
        })
    ])
  ], { reporter })

  assert.equal(teardownValue, 9, "it executes the async teardown function on the context")

  reporter.expectReport([
    withBehavior("a single test", [
      withExample("async context and observation", [
        withInvalidClaim("async compares the right numbers", {
          operator: "strictEqual",
          expected: 15,
          actual: 12,
          stack: "fake stack"
        }),
        withValidClaim("does something sync")
      ])
    ])
  ])

  reporter.expectSummary({
    valid: 1,
    invalid: 1,
    skipped: 0
  })
})

test("it runs async conditions", async () => {
  const reporter = new FakeReporter()

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
  ], { reporter })

  reporter.expectReport([
    withBehavior("a single test", [
      withExample("multiple conditions", [
        withValidClaim("the value is incremented"),
        withValidClaim("the value is incremented asynchronously"),
        withValidClaim("the value is incremented"),
        withValidClaim("compares the correct number"),
      ])
    ])
  ])

  reporter.expectSummary({
    valid: 4,
    invalid: 0,
    skipped: 0
  })
})

test.run()