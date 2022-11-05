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

### Publishing

1. `npm version <new version>`
- This will update package.json, package-lock.json, create a tag for the new version and make a commit.
2. `git tag -a <new version> -m <new version>`
3. `git push`
4. `npm publish`
- Make sure you are logged into npm; you'll need to provide an OTP token
