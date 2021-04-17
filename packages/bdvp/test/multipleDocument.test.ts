import { test } from 'uvu'
import { document, runDocs, example, effect } from '../src/index'
import { docReport, FakeReporter, exampleReport, validObservation } from './helpers/FakeReporter'
import { expect } from 'chai'

test("it runs multiple documents", async () => {
  const reporter = new FakeReporter()

  await runDocs([
    document("a single claim", [
      example("just a claim", { subject: () => 7 })
        .observe([
          effect("compares the correct number", (actual) => {
            expect(actual).to.equal(7)
          })
        ])
    ]),
    document("another claim", [
      example("just another claim", { subject: () => 18 })
        .observe([
          effect("compares another correct number", (actual) => {
            expect(actual).to.equal(18)
          })
        ])
    ])
  ], { reporter })

  reporter.expectTestReportWith([
    docReport("a single claim", [
      exampleReport("just a claim", [], [
        validObservation("compares the correct number")
      ])
    ]),
    docReport("another claim", [
      exampleReport("just another claim", [], [
        validObservation("compares another correct number")
      ])
    ])
  ], "it prints the expected output for multiple documents")
})

test.run()