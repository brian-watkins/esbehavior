import { behavior, effect, example } from 'bdvp'
import { testableApp } from './testableApp.jsx'

export default
  behavior("other stuff", [
    example(testableApp)
      .description("the app loaded")
      .script({
        observe: [
          effect("the title shows", (app) => {
            app.expectTextOnPage("Hello!")
          })
        ]
      })
  ])