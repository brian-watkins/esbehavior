# esbehavior development

### Getting Started

First `npm install` at the top level. Then:

```
$ npx lerna bootstrap
```


### Running the tests

Each package has its own tests that can be run with `npm run test`.


### Publishing to NPM

1. fast-forward merge develop into master and push
2. `npx lerna version --no-private`
  - Choose versions for each package
  - Lerna will update the package.json appropriately for each package and push changes and push new release tags
  - The `no-private` flag means the `tests` module will not be versioned
3. `npx lerna publish from-package`
  - Publishes the latest tagged releases of the packages to npm
4. Check out develop; rebase master; push.