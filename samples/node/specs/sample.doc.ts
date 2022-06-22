import assert from 'proclaim'
import { behavior, condition, effect, example, outcome, procedure, skip, step } from 'esbehavior'
import { Thing } from '../src/Thing.js'

export default
  behavior("a sample spec", [
    example({ init: () => new Thing() })
      .script({
        prepare: [
          condition("something happens", () => { }),
          condition("something else happens", () => { })
        ],
        perform: [
          step("first step", () => {}),
          procedure("some procedure", [
            step("procedure step 1", () => {}),
            step("procedure step 2", () => {}),
          ]),
          step("second step", () => {})
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
    skip.example({ init: () => new Thing() })
      .description("some boring example")
      .script({
        observe: [
          effect("never runs this", () => {
            assert.equal(7, 5)
          }),
          outcome("a skipped outcome", [
            effect("this is skipped", () => {}),
            effect("this is skipped also", () => {}),
          ])
        ]
      })
  ])