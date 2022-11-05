import { test } from 'uvu'
import * as assert from 'uvu/assert'
import { validate, example, effect, fact, behavior, defaultOrder } from '../src/index.js'
import { FakeReporter } from './helpers/FakeReporter.js'

test("it tears down the context", async () => {
  const reporter = new FakeReporter()

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
          suppose: [
            fact("it touches the context", (context) => { context.touched++ })
          ],
          observe: [
            effect("it works", (context) => {
              assert.equal(context.touched, 2)
            })
          ]
        })
    ])
  ], { reporter, order: defaultOrder() })

  assert.equal(testContext.touched, 3, "it runs the teardown function on the context value")
})

test.run()