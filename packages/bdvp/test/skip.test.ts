import { expect } from 'chai'
import { test } from 'uvu'
import { document, validate, skip, effect, example, condition } from '../src/index.js'
import { docReport, FakeReporter, exampleReport, skippedCondition, skippedObservation, validObservation } from './helpers/FakeReporter.js'

test("it skips an example", async () => {
  const reporter = new FakeReporter()

  await validate([
    document("something", [
      skip.example({
        subject: () => {
          expect(7).to.equal(5)
          return "blah"
        }
      })
        .description("not important")
        .script({
          assume: [
            condition("it does something bad", () => {
              throw new Error("BAD WHEN!!")
            })
          ],
          observe: [
            effect("will never run this", () => {
              expect(7).to.equal(5)
            }),
            effect("or this", () => {
              expect(9).to.equal(1)
            })
          ]
        }),
      example({ subject: () => "blah" })
        .description("important")
        .script({
          observe: [
            effect("will run this", () => {
              expect(7).to.equal(7)
            })
          ]
        })
    ])
  ], { reporter })

  reporter.expectTestReportWith([
    docReport("something", [
      exampleReport("not important", [
        skippedCondition("it does something bad")
      ], [
        skippedObservation("will never run this"),
        skippedObservation("or this")
      ]),
      exampleReport("important", [], [
        validObservation("will run this")
      ])
    ])
  ], "it skips all observations when an example is skipped")
})

test.run()