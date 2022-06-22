import { expect } from "chai"
import { procedure, effect, behavior, example, step } from "../../src/index.js"

export default behavior("a single test", [
  example({ init: () => { return { count: 1 } } })
    .description("my first test of some invalid procedure")
    .script({
      perform: [
        procedure("some invalid sequence", [
          step("step 1", (context) => { context.count += 2 }),
          step("failing step", (context) => { throw { message: "Whoops!" } }),
          step("step 3", (context) => { context.count += 3 })
        ])
      ],
      observe: [
        effect("something cool happens", (context) => {
          expect(6).to.equal(context.count)
        })
      ]
    })
])