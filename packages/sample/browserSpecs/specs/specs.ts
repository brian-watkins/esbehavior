import sample from "./sample.spec"
import { validate } from 'bdvp'

validate([
  sample
]).then(() => {
  console.log("# DONE")
})

