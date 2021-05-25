import assert from 'proclaim'
import { condition, document, effect, example, validate, skip } from 'bdvp'

const spec = document("a sample spec", [
  example({ subject: () => 7 })
    .description("comparing some numbers")
    .script({
      assume: [
        condition("something happens", () => {}),
        condition("something else happens", () => {})
      ],
      observe: [
        effect("compares two numbers", (context) => {
          assert.equal(context, 7)
        }),
        effect("does something that fails", (context) => {
          assert.equal(context, 8)
        })
      ] 
    }),
  skip.example({ subject: () => 4 })
    .description("some boring example")
    .script({
      observe: [
        effect("never runs this", () => {
          assert.equal(7, 5)
        })
      ]
    })
])

validate([spec])