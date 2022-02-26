import { expect } from 'chai'
import { test } from 'uvu'
import { validate, example, effect, condition, behavior } from '../src/index.js'
import { FakeReporter, withBehavior, withExample, withFailure, withValidClaim } from './helpers/FakeReporter.js'

test("failing context generator function", async () => {
  const reporter = new FakeReporter()

  await validate([
    behavior("failing context generator", [
      example({
        init: () => {
          throw {
            stack: "funny stack"
          }
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
  ], { reporter })

  reporter.expectReport([
    withBehavior("failing context generator", [
      withExample("context generator throws exception", [])
    ]),
    withFailure({ stack: "funny stack" })
  ])
})

test("failing context teardown function", async () => {
  const reporter = new FakeReporter()

  await validate([
    behavior("failing context teardown", [
      example({
        init: () => 7,
        teardown: () => {
          throw {
            stack: "awesome stack"
          }
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
  ], { reporter })

  reporter.expectReport([
    withBehavior("failing context teardown", [
      withExample("context teardown throws exception", [
        withValidClaim("it does nothing"),
        withValidClaim("it works")
      ])
    ]),
    withFailure({ stack: "awesome stack" })
  ])
})

test.run()