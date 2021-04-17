import assert from 'proclaim'
import { condition, document, effect, example, runDocs, skip } from 'bdvp'

const spec = document("a sample spec", [
  example("comparing some numbers", { subject: () => 7 })
    .require([
      condition("something happens", () => {}),
      condition("something else happens", () => {})
    ])
    .observe([
      effect("compares two numbers", (context) => {
        assert.equal(context, 7)
      }),
      effect("does something that fails", (context) => {
        assert.equal(context, 8)
      })
    ]),
  skip.example("some boring example")
    .observe([
      effect("never runs this", () => {
        assert.equal(7, 5)
      })
    ])
])

runDocs([spec])