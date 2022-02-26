# Sample Repo with esbehavior Documents

To verify the sample documents:

```
$ npm test
```

Notice that the package.json for `node-sample` includes `type: module`. This seems to be
required at the moment to get esbehavior to load and work since esbehavior is compiled as an esmodule.

Note that if we you `esbuild-node-loader` this is much easier and it doesn't matter if the
main package.json is set to type module or not (since esmodules CAN import commonjs, just
not the other way around). Only downside is that you aren't getting type checking when you
build your tests ...