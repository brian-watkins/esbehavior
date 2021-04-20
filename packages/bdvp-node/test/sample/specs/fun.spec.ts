import { document, effect, example } from 'bdvp'
import assert from 'proclaim'

export default
  document("Something fun", [
    example("it shows that things are equal")
      .observe([
        effect("things are equal", () => {
          assert.equal(4, 4)
        })
      ])
  ])
