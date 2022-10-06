import { expect } from 'chai'
import { behavior, effect, example } from 'esbehavior'

export default
  behavior("simple behavior", [
    example()
      .description("some simple example")
      .script({
        observe: [
          effect("it compares numbers", () => {
            expect(7).to.equal(7)
          })
        ]
      })
  ])