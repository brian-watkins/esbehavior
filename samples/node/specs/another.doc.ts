import { behavior, condition, effect, example, skip } from 'esbehavior'
import { Thing } from '../src/Thing.js'
import assert from 'proclaim'

export default
  behavior("another spec", [
    example({ init: () => new Thing() })
      .description("basic example")
      .script({
        observe: [
          effect("the thing works", (thing) => {
            assert.equal(thing.stuff(), "Stuff!")
          }),
        ]
      })
  ])
