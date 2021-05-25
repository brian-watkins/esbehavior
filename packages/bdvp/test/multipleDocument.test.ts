import { test } from 'uvu'
import { document, validate, example, effect } from '../src/index'
import { docReport, FakeReporter, exampleReport, validObservation } from './helpers/FakeReporter'
import { expect } from 'chai'

test("it runs multiple documents", async () => {
  const reporter = new FakeReporter()

  await validate([
    document("a single claim", [
      example({ subject: () => 7 })
        .description("just a claim")
        .script({
          observe: [
            effect("compares the correct number", (actual) => {
              expect(actual).to.equal(7)
            })
          ]
        })
    ]),
    document("another claim", [
      example({ subject: () => 18 })
        .description("just another claim")
        .script({
          observe: [
            effect("compares another correct number", (actual) => {
              expect(actual).to.equal(18)
            })
          ]
        })
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