import assert from 'proclaim'
import { context, document, example, fact, runDocs, skip } from 'bdvp'

const spec = document("a sample spec", [
  example("comparing some numbers", context(() => 7))
    .conditions([
      fact("something happens", () => {}),
      fact("something else happens", () => {})
    ])
    .observations([
      fact("compares two numbers", (context) => {
        assert.equal(context, 7)
      }),
      fact("does something that fails", (context) => {
        assert.equal(context, 8)
      })
    ]),
  skip.example("some boring example")
    .observations([
      fact("never runs this", () => {
        assert.equal(7, 5)
      })
    ])
])

runDocs([spec])