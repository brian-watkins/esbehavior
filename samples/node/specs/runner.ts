import { Behavior, validate } from 'esbehavior'
import globby from 'globby'

const loadDoc = async (path: string): Promise<Behavior> => {
  return (await import(path)).default
}

globby("./**/*.doc.ts", { cwd: "./specs" }).then((files) => {
  const docs = files.map(file => `./${file.replace(".doc.ts", ".doc.js")}`)
  Promise.all(docs.map(loadDoc)).then(validate).then(summary => {
    if (summary.invalid > 0 || summary.skipped > 0) {
      process.exit(1)
    }
  })
});
