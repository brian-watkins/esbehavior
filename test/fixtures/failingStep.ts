import { behavior, effect, example, step } from "../../src/index.js"

export default behavior("behavior", [
  example()
    .description("failing step")
    .script({
      perform: [
        step("something throws an error", () => {
          throw {
            expected: "a",
            actual: "b",
            operator: "equals"
          }
        }),
        step("there is another step", () => { })
      ],
      observe: [
        effect("does something that will get skipped", () => { })
      ]
    })
])