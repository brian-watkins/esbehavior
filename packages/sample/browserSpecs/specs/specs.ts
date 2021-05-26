import { validate } from 'bdvp'

(async () => {

  await validate([
    (await import("./sample.spec.js")).default
  ])

  console.log("# DONE")

})()