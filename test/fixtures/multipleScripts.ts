import { expect } from "chai"
import { behavior, fact, effect, example } from "../../src/index.js"

export default behavior("multiple scripts", [
  example({ init: () => ({ touched: 0 }) })
    .description("multiple scripts")
    .script({
      suppose: [
        fact("it touches the context", (context) => { context.touched++ })
      ],
      observe: [
        effect("the first script works", (context) => {
          expect(context.touched).to.equal(1)
        })
      ]
    })
    .andThen({
      suppose: [
        fact("it touches the context again", (context) => { context.touched++ }),
        fact("it touches the context and again", (context) => { context.touched++ })
      ],
      observe: [
        effect("part of the second script works", (context) => {
          expect(context.touched).to.equal(3)
        }),
        effect("the second script fails", (context) => {
          throw {
            expected: "a thing",
            actual: "nothing",
            operator: "equals",
            stack: "cool stack"
          }
        })
      ]
    })
])
