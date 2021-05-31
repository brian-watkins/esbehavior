import assert from 'proclaim'
import { condition, document, effect, example, skip } from 'bdvp'
import { Thing } from '../src/Thing.js'

export default
  document("a sample spec", [
    example({ subject: () => new Thing() })
      .description("comparing some numbers")
      .script({
        assume: [
          condition("something happens", () => { }),
          condition("something else happens", () => { })
        ],
        observe: [
          effect("looks at stuff", (thing) => {
            assert.equal(thing.stuff(), "Stuff!")
          }),
          effect("does something that fails", (thing) => {
            assert.equal(thing.stuff(), 8)
          })
        ]
      }),
    skip.example({ subject: () => new Thing() })
      .description("some boring example")
      .script({
        observe: [
          effect("never runs this", () => {
            assert.equal(7, 5)
          })
        ]
      })
  ])