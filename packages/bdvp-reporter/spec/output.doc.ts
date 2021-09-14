import { example, condition, effect, behavior } from 'bdvp'
import expect from 'proclaim'
import { appContext } from './TestableApp'

const simpleBehavior =
  behavior("A Sample Behavior", [
    example()
      .description("Comparing some numbers")
      .script({
        observe: [
          effect("it compares two numbers", () => {
            expect.equal(7, 7)
          })
        ]
      })
  ])


const standardScenario =
  example(appContext)
    .description("simple behavior with example")
    .script({
      prepare: [
        condition("a behavior is validated", async (testableApp) => {
          await testableApp.validateBehavior(simpleBehavior)
        })
      ],
      observe: [
        effect("the report includes the name of the behavior", (testableApp) => {
          expect.include(testableApp.output, "A Sample Behavior")
        }),
        effect("the report includes the name of the example", (testableApp) => {
          expect.include(testableApp.output, "Comparing some numbers")
        })
      ]
    })

export default behavior("printing a report", [
  standardScenario
])