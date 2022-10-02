import { behavior, effect, example } from "../../src/index.js"

export default behavior("multiple examples, one fails", [
  example()
    .description("failing observation")
    .script({
      observe: [
        effect("passes", () => { }),
        effect("does something that fails", () => {
          throw {
            operator: "equals",
            expected: "something",
            actual: "nothing"
          }
        }),
        effect("passes", () => { }),
        effect("would fail if it were run", () => {
          throw {
            operator: "equals",
            expected: "one thing",
            actual: "another thing"
          }
        }),
        effect("passes", () => { })
      ]
    }),
  example()
    .description("passing observation")
    .script({
      observe: [
        effect("does something that passes", () => {}),
        effect("passes", () => { })
      ]
    })
])