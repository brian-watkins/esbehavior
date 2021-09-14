import { expect } from 'chai'
import { test } from 'uvu'
import * as assert from 'uvu/assert'
import { validate, example, effect, condition, behavior } from '../src/index.js'
import { FakeReportWriter } from './helpers/FakeReportWriter.js'

test("it tears down the context", async () => {
  const writer = new FakeReportWriter()

  const testContext = {
    touched: 0
  }

  await validate([
    behavior("context with teardown", [
      example({
        init: () => {
          testContext.touched++
          return testContext
        },
        teardown: (context) => {
          context.touched++
        }
      })
        .description("teardown context")
        .script({
          prepare: [
            condition("it touches the context", (context) => { context.touched++ })
          ],
          observe: [
            effect("it works", (context) => {
              expect(context.touched).to.equal(2)
            })
          ]
        })
    ])
  ], { writer })

  assert.equal(testContext.touched, 3, "it runs the teardown function on the context value")
})

// NOTE: DO I NEED THIS HERE???
test.run()