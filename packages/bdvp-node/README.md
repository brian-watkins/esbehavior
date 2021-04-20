# bdvp-node

Validate BDVP documents in node.

```
$ bdvp-node <documents> [options]

where documents is a glob referencing BDVP documents to validate.

Options:
-r specify a module to require
```

Each file referenced by the provided glob should export a BDVP Document as its default export.

Use the `-r` option to require a module before any documents are validated. For example, 
if you need to validate documents written in Typescript:

```
$ bdvp-node ./docs/**/*.doc.ts -r ts-node/register
```
