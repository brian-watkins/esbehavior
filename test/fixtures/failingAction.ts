import { behavior, effect, example, step } from "../../src/index.js"

interface SomthingToChangeTheLineNumbersWhenTranspiled {
  name: string
}

export default behavior("failing", [
  example()
    .description("failing action")
    .script({
      perform: [
        step("something throws an error", () => {
          throw {
            expected: "something",
            actual: "nothing",
            operator: "equals"
          }
        }),
        step("there is another action", () => { })
      ],
      observe: [
        effect("does something that will get skipped", () => { })
      ]
    })
])