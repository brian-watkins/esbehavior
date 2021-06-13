import { validate } from 'bdvp'
import globby from 'globby'
import { Behavior } from '../../bdvp/dist/Behavior';

const loadDoc = async (path: string): Promise<Behavior> => {
  return (await import(path)).default
}

globby("./**/*.doc.ts", { cwd: "./specs" }).then((files) => {
  const docs = files.map(file => `./${file.replace(".doc.ts", ".doc.js")}`)
  Promise.all(docs.map(loadDoc)).then(validate)
});
