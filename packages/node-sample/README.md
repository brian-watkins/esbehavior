# Sample Repo with BDVP Documents

To verify the sample documents:

```
$ npm test
```

Notice that the package.json for `node-sample` includes `type: module`. This seems to be
required at the moment to get BDVP to load and work since BDVP is compiled as an esmodule.
