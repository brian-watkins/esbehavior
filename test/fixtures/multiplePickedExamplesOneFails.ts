import { behavior, effect, example } from "../../src/index.js"

export default behavior("multiple picked examples, one fails", [
  (m) => m.pick() && example()
    .description("failing observation")
    .script({
      observe: [
        effect("passes first", () => { }),
        effect("does something that fails", () => {
          throw {
            operator: "equals",
            expected: "something",
            actual: "nothing"
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
    }),
  (m) => m.pick() && example()
    .description("passing observation")
    .script({
      observe: [
        effect("does something that passes", () => {}),
        effect("passes", () => { })
      ]
    }),
  (m) => m.pick() && example()
    .description("passing observation")
    .script({
      observe: [
        effect("does something that passes", () => {}),
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