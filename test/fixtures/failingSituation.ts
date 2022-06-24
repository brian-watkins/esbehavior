import { expect } from "chai"
import { situation, effect, behavior, example, fact } from "../../src/index.js"

export default behavior("a single test", [
  example({ init: () => { return { count: 1 } } })
    .description("my first test of some invalid situation")
    .script({
      suppose: [
        situation("some invalid situation", [
          fact("fact 1", (context) => { context.count += 2 }),
          fact("failing fact", () => { throw { message: "Whoops!" } }),
          fact("fact 3", (context) => { context.count += 3 })
        ])
      ],
      observe: [
        effect("something cool happens", (context) => {
          expect(6).to.equal(context.count)
        })
      ]
    })
])