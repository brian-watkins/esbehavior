# ESBehavior - Development

### Running Tests

```
$ npm run test
```

You can use `only` to run a particular test, but uvu (our test framework) will still
run tests in other files. So, to really run one test you need to use `only` and run
only a single file. To run a single test file:

```
$ npm run test:one <test file name>
```