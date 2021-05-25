import { expect } from 'chai'
import { test } from 'uvu'
import * as assert from 'uvu/assert'
import { document, validate, example, effect, condition } from '../src/index'
import { FakeReporter } from './helpers/FakeReporter'

test("it tears down the context", async () => {
  const reporter = new FakeReporter()

  const testContext = {
    touched: 0
  }

  await validate([
    document("context with teardown", [
      example({
        subject: () => {
          testContext.touched++
          return testContext
        },
        teardown: (context) => {
          context.touched++
        }
      })
        .description("teardown context")
        .script({
          assume: [
            condition("it touches the context", (context) => { context.touched++ })
          ],
          observe: [
            effect("it works", (context) => {
              expect(context.touched).to.equal(2)
            })
          ]
        })
    ])
  ], { reporter })

  assert.equal(testContext.touched, 3, "it runs the teardown function on the context value")
})
