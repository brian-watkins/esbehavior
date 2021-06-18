import { expect } from 'chai'
import { test } from 'uvu'
import { validate, skip, effect, example, condition, behavior } from '../src/index.js'
import { behaviorReport, FakeReportWriter, exampleReport, skippedCondition, skippedObservation, validObservation } from './helpers/FakeReportWriter.js'

test("it skips an example", async () => {
  const writer = new FakeReportWriter()

  await validate([
    behavior("something", [
      skip.example({
        init: () => {
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
      example({ init: () => "blah" })
        .description("important")
        .script({
          observe: [
            effect("will run this", () => {
              expect(7).to.equal(7)
            })
          ]
        })
    ])
  ], { writer })

  writer.expectTestReportWith([
    behaviorReport("something", [
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