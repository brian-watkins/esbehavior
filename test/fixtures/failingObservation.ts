import { behavior, effect, example } from "../../src/index.js"

export default behavior("a single test", [
  example()
    .description("failing observation")
    .script({
      observe: [
        effect("does something that fails", () => {
          throw {
            operator: "equals",
            expected: "something",
            actual: "nothing"
          }
        }),
        effect("passes", () => { })
      ]
    })
])