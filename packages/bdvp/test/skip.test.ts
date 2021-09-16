import { expect } from 'chai'
import { test } from 'uvu'
import { validate, skip, effect, example, condition, behavior, step } from '../src/index.js'
import { behaviorReport, FakeReportWriter, exampleReport, skippedCondition, skippedObservation, validObservation, skippedStep } from './helpers/FakeReportWriter.js'

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
          prepare: [
            condition("it does something bad", () => {
              throw new Error("BAD WHEN!!")
            })
          ],
          perform: [
            step("it never does this", () => {})
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
        skippedCondition("it does something bad"),
        skippedStep("it never does this")
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