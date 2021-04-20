const { program } = require("commander")
const globby = require("globby")
const { validate } = require("bdvp")
const resolveModule = require("resolve").sync

async function validator() {
  var resolveOptions  = { basedir: process.cwd(), extensions: Object.keys(require.extensions) };

  program.version("1.0.0")
    .name("bdvp-node")
    .usage("<documents> [options]")
    .arguments('<documents>')
    .description("bdvp-node", {
      documents: "glob referencing BDVP documents to validate"
    })
    .option("-r, --require [require...]", "module(s) to require")
    .action(async (documents, options) => {    
      for (const module of options.require) {
        require(resolveModule(module, resolveOptions))
      }
    
      const paths = await globby(documents, { absolute: true })
    
      let docs = []
      for (const documentPath of paths) {
        const document = require(documentPath).default
        docs.push(document)
      }
    
      await validate(docs)
    })

  await program.parseAsync()
}

module.exports = {
  validator
}