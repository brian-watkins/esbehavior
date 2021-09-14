import { expect } from 'chai'
import { test } from 'uvu'
import { validate, pick, example, effect, condition, behavior } from '../src/index.js'
import { behaviorReport, FakeReportWriter, exampleReport, skippedCondition, skippedObservation, validObservation } from './helpers/FakeReportWriter.js'

test("it only runs the picked example", async () => {
  const writer = new FakeReportWriter()

  await validate([
    behavior("something", [
      example()
        .description("not important")
        .script({
          prepare: [
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
      pick.example()
        .description("important")
        .script({
          observe: [
            effect("will run this", () => {
              expect(7).to.equal(7)
            })
          ]
        })
    ]),
    behavior("another", [
      example({
        init: () => {
          throw new Error("BAD SO BAD")
        }
      })
        .description("should be skipped")
        .script({
          prepare: [
            condition("it does something that it shouldn't", () => {
              throw new Error("BAD!")
            })
          ],
          observe: [
            effect("just won't", () => {
              expect(7).to.equal(4)
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
    ]),
    behaviorReport("another", [
      exampleReport("should be skipped", [
        skippedCondition("it does something that it shouldn't")
      ], [
        skippedObservation("just won't")
      ])
    ])
  ], "it only runs the picked example")
})

test.run()