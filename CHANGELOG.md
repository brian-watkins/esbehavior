# Changelog

### 4/24/2025

esbehavior 8.0.0

### Removed
- contextMap#set

### Added
- contextMap#thenSet


### 4/10/2025

esbehavior 7.0.0

### Removed
- useWithContext

### Added
- contextMap and use functions for better managing contexts


### 2/3/2025

esbehavior 6.0.0

### Changed
- Better API for managing context dependencies
- Removed old API for behavior contexts

### Added
- behaviorContext function generates contexts for a behavior


### 1/23/2025

esbehavior 5.2.1

### Added
- Support for Behavior contexts

### Fixed
- ANSIFormatter works in browser environments
- Missing extension in file import


### 1/22/2025

esbehavior 5.1.0

### Added
- Set the NO_COLOR environment variable to a non-empty value to
disable ANSI codes in the output of the standard reporter

### Changed
- Timer is no longer a configurable option of StandardReporter
(non-breaking since Timer was not exposed as part of the API)


### 11/21/2024

esbehavior 5.0.0

### Changed
- Removed (undocumented) DocumentationRunner api and replaced with
(undocumented) runBehavior function for more flexibility in running
behaviors programmatically within best-behavior


### 11/11/2024

esbehavior 4.2.4

### Fixed
- Export Claim types


### 12/20/2023

esbehavior 4.2.3

### Fixed
- Format termination errors with multiline messages
- Properly serialize errors with falsey properties


### 11/6/2023

esbehavior 4.2.2

### Fixed
- Better highlighting of relevant lines in stack traces
- Invalid claim error objects are serializable by the reporter


### 10/31/2023

esbehavior 4.2.1

### Changed
- All dependencies now have esmodule versions


### 10/29/2023

esbehavior 4.2.0

### Added
- Expose validation logic via DocumentRunner so that it's easier to build
alternative runners
- Expose some previously unexposed types that alternative runners would
typically need
- Add exports field to specify esbehavior entrypoint


### 10/14/2023

esbehavior 4.1.0

### Added
- Pick or skip behaviors

### Fixed
- Handle exceptions thrown during a claim that are not
subclasses of the Error object


### 3/25/2023

esbehavior 4.0.1

### Fixed
- All imports have extensions so types will be imported
correctly when node16 or nodenext module resolution is used
in typescript projects
- Updated simplified example example in README so that types
will be inferred correctly

### 3/12/2023

esbehavior 4.0.0

#### Changed
- Simplified Example type; Removed ExampleBuilder
- Reporter consumes JSON serializable values only
- Improved documentation

#### Fixed
- Stack traces for errors thrown in facts have proper highlighting


### 12/5/2022

esbehavior 3.1.1

#### Added
- Better formatting of multi-line expected and actual values
- Pretty-print non-string expected and actual values


### 10/2/2022

esbehavior 2.1.0

#### Added
- Option to stop the test suite run on the first invalid claim
- Print time for claims that take longer than 100ms
- Option to configure the time for a 'slow claim'
- Run behaviors, examples, and observations in random order by default
- Option to specify the default order or a seed to reproduce a random ordering
- ExampleBuilder interface has access to validation options

#### Fixed
- Removed private api function on behavior object

### 6/25/2022

esbehavior 2.0.0, 2.0.1

#### Added
- Support for grouped claims
- Prepare is now Suppose when writing scripts


### 3/2/2022

esbehavior 1.2.0

#### Added
- Standard reporter distinguishes conditions and steps


### 3/1/2022

esbehavior 1.1.0

#### Added
- Standard reporter
- validate returns summary


### 12/12/2021

esbehavior 1.0.3

#### Initial release