import { validate } from 'bdvp'

(async () => {
  validate([
    (await import("./sample.spec.js")).default
  ]).then(() => {
    console.log("# DONE")
  })  
})()