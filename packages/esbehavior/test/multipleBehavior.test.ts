import { test } from 'uvu'
import { validate, example, effect, behavior } from '../src/index.js'
import { behaviorReport, FakeReportWriter, exampleReport, validObservation } from './helpers/FakeReportWriter.js'
import { expect } from 'chai'

test("it runs multiple behaviors", async () => {
  const writer = new FakeReportWriter()

  await validate([
    behavior("a single claim", [
      example({ init: () => 7 })
        .description("just a claim")
        .script({
          observe: [
            effect("compares the correct number", (actual) => {
              expect(actual).to.equal(7)
            })
          ]
        })
    ]),
    behavior("another claim", [
      example({ init: () => 18 })
        .description("just another claim")
        .script({
          observe: [
            effect("compares another correct number", (actual) => {
              expect(actual).to.equal(18)
            })
          ]
        })
    ])
  ], { writer })

  writer.expectTestReportWith([
    behaviorReport("a single claim", [
      exampleReport("just a claim", [], [
        validObservation("compares the correct number")
      ])
    ]),
    behaviorReport("another claim", [
      exampleReport("just another claim", [], [
        validObservation("compares another correct number")
      ])
    ])
  ], "it prints the expected output for multiple behaviors")
})

test.run()