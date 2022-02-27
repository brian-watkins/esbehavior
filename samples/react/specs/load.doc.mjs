import { behavior, effect, example } from 'esbehavior'
import { testableApp } from './testableApp.jsx'

export default
  behavior("hello", [
    example(testableApp)
      .description("the app does not have the right text")
      .script({
        observe: [
          effect("the title shows hello", (app) => {
            app.expectTextOnPage("Hello?!")
          })
        ]
      })
  ])
