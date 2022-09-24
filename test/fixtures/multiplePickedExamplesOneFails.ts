import { behavior, effect, example, pick } from "../../src/index.js"

export default behavior("multiple picked examples, one fails", [
  pick.example()
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
    }),
  example()
    .description("passing observation")
    .script({
      observe: [
        effect("does something that passes", () => {}),
        effect("passes", () => { })
      ]
    }),
  pick.example()
    .description("passing observation")
    .script({
      observe: [
        effect("does something that passes", () => {}),
        effect("passes", () => { })
      ]
    }),
  pick.example()
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