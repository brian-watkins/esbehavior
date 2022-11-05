import * as assert from "uvu/assert"
import { situation, effect, behavior, example, fact } from "../../src/index.js"

export default behavior("a single test", [
  example({ init: () => { return { count: 1 } } })
    .description("my first test of some invalid nested situation")
    .script({
      suppose: [
        situation("some invalid situation", [
          fact("fact 1", (context) => { context.count += 2 }),
          situation("a failing nested situation", [
            fact("nested fact 1", () => {}),
            fact("failing nested fact", (context) => { throw { message: "Whoops!" } }),
            fact("nested fact 3", () => {})
          ]),
          fact("fact 3", (context) => { context.count += 3 }),
          situation("another situation", [
            fact("another fact 1", () => {}),
            fact("another fact 2", () => {})
          ])
        ])
      ],
      observe: [
        effect("something cool happens", (context) => {
          assert.equal(context.count, 6)
        })
      ]
    })
])