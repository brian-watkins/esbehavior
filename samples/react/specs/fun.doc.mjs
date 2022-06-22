import { behavior, effect, example, procedure, step } from 'esbehavior'
import { testableApp } from './testableApp.jsx'

export default
  behavior("other stuff", [
    example(testableApp)
      .description("the app loaded")
      .script({
        perform: [
          procedure("some complicated procedure", [
            step("step 1", () => {}),
            step("step 2", () => {}),
            step("step 3", () => {}),
          ])
        ],
        observe: [
          effect("the title shows what we expect", (app) => {
            app.expectTextOnPage("Hello!")
          })
        ]
      })
  ])
