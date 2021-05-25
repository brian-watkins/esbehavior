import assert from 'proclaim'
import { document, effect, example } from 'bdvp'

export default document("a sample browser spec", [
  example({ subject: () => document })
    .description("using the document")
    .script({
      observe: [
        effect("the document is available", (subject: any) => {
          assert.notEqual(typeof subject, "undefined")
        }),
        effect("something fails", () => {
          assert.equal(7, 5)
        })
      ]
    })
])