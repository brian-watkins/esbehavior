import { expect } from 'chai'
import { test } from 'uvu'
import * as assert from 'uvu/assert'
import { document, runDocs, context, example, effect, condition } from '../src/index'
import { docReport, exampleReport, exampleThatBails, FakeReporter } from './helpers/FakeReporter'

test("failing context generator function", async () => {
  const reporter = new FakeReporter()

  const testContext = {
    touched: 0
  }

  await runDocs([
    document("failing context generator", [
      example("context generator throws exception", context(() => {
        const error: any = new Error()
        error.stack = "funny stack"
        throw error
      }))
        .require([
          condition("it touches the context", (context) => { })
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
      exampleThatBails("context generator throws exception", "funny stack")
    ])
  ], "it bails out when the context generator throws an error")
})
