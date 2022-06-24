import { behavior, fact, effect, example } from "../../src/index.js"

export default behavior("behavior", [
  example()
    .description("failing condition")
    .script({
      suppose: [
        fact("something throws an error", () => {
          throw {
            expected: "something",
            actual: "nothing",
            operator: "equals"
          }
        }),
        fact("there is another condition", () => { })
      ],
      observe: [
        effect("does something that will get skipped", () => { })
      ]
    })
])