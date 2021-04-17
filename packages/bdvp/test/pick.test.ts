import { expect } from 'chai'
import { test } from 'uvu'
import { document, runDocs, pick, example, effect, condition } from '../src/index'
import { docReport, FakeReporter, exampleReport, skippedCondition, skippedObservation, validObservation } from './helpers/FakeReporter'

test("it only runs the picked example", async () => {
  const reporter = new FakeReporter()

  await runDocs([
    document("something", [
      example("not important", {
        subject: () => {
          throw new Error("BAD GIVEN!!")
        }
      })
        .require([
          condition("it does something bad", () => {
            throw new Error("BAD WHEN!!")
          })
        ])
        .observe([
          effect("will never run this", () => {
            expect(7).to.equal(5)
          }),
          effect("or this", () => {
            expect(9).to.equal(1)
          })
        ]),
      pick.example("important")
        .observe([
          effect("will run this", () => {
            expect(7).to.equal(7)
          })
        ])
    ]),
    document("another", [
      example("should be skipped", {
        subject: () => {
          throw new Error("BAD SO BAD")
        }
      })
        .require([
          condition("it does something that it shouldn't", () => {
            throw new Error("BAD!")
          })
        ])
        .observe([
          effect("just won't", () => {
            expect(7).to.equal(4)
          })
        ])
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
    ]),
    docReport("another", [
      exampleReport("should be skipped", [
        skippedCondition("it does something that it shouldn't")
      ], [
        skippedObservation("just won't")
      ])
    ])
  ], "it only runs the picked example")
})

test.run()