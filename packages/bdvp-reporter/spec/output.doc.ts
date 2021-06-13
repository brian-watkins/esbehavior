import { example, condition, effect, behavior } from 'bdvp'
import expect from 'proclaim'
import { TestableApp } from './TestableApp'

const standardDocument = `
TAP version 13
# a sample spec
# comparing some numbers
# when something happens
ok it compares two numbers
1..1
# valid observations: 1
# invalid observations: 0
# skipped: 0
`

const testableAppSubject = { init: () => new TestableApp() }

const standardScenario =
  example(testableAppSubject)
    .description("standard document with scenario and observations")
    .script({
      assume: [
        condition("a document is executed", async (testableApp) => {
          await testableApp.executeDoc(standardDocument)
        })
      ],
      observe: [
        effect("the report includes the name of the document", (testableApp) => {
          expect.include(testableApp.output, "a sample spec")
        }),
        effect("the report includes the name of the example", (testableApp) => {
          expect.include(testableApp.output, "comparing some numbers")
        })
      ]
    })

export default behavior("printing a report", [
  standardScenario
])