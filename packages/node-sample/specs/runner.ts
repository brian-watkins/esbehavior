import { validate } from 'bdvp'
import { Document } from 'bdvp/dist/Document'
import globby from 'globby'

const loadDoc = async (path: string): Promise<Document> => {
  return (await import(path)).default
}

globby("./**/*.doc.ts", { cwd: "./specs" }).then((files) => {
  const docs = files.map(file => `./${file.replace(".doc.ts", ".doc.js")}`)
  Promise.all(docs.map(loadDoc)).then(validate)
});
