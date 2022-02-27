import { behavior, effect, example } from 'esbehavior'
import { testableApp } from './testableApp.jsx'

export default
  behavior("other stuff", [
    example(testableApp)
      .description("the app loaded")
      .script({
        observe: [
          effect("the title shows what we expect", (app) => {
            app.expectTextOnPage("Hello!")
          })
        ]
      })
  ])
