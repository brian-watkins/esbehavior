import { behavior, condition, effect, example } from "../../src/index.js"

export default behavior("behavior", [
  example()
    .description("failing condition")
    .script({
      prepare: [
        condition("something throws an error", () => {
          throw {
            expected: "something",
            actual: "nothing",
            operator: "equals"
          }
        }),
        condition("there is another condition", () => { })
      ],
      observe: [
        effect("does something that will get skipped", () => { })
      ]
    })
])