import { behavior, effect, example, outcome } from "../../src/index.js"

export default behavior("a single test", [
  example()
    .description("failing outcome")
    .script({
      observe: [
        effect("does something that works", () => {
          //nothing
        }),
        outcome("an outcome that fails", [
          effect("failing claim", () => {
            throw {
              operator: "equals",
              expected: "something",
              actual: "nothing"
            }
          }),
          effect("part of the outcome that is valid", () => {})
        ])
      ]
    })
])