import { expect } from "chai"
import { procedure, effect, behavior, example, step } from "../../src/index.js"

export default behavior("a single test", [
  example({ init: () => { return { count: 1 } } })
    .description("my first test of some invalid nested procedure")
    .script({
      perform: [
        procedure("some invalid sequence", [
          step("step 1", (context) => { context.count += 2 }),
          procedure("a failing nested procedure", [
            step("nested step 1", () => {}),
            step("failing nested step", (context) => { throw { message: "Whoops!" } }),
            step("nested step 3", () => {})
          ]),
          step("step 3", (context) => { context.count += 3 }),
          procedure("another procedure", [
            step("another step 1", () => {}),
            step("another step 2", () => {})
          ])
        ])
      ],
      observe: [
        effect("something cool happens", (context) => {
          expect(6).to.equal(context.count)
        })
      ]
    })
])