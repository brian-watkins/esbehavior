# React Sample

Simple react app (created with Neutrino). BDVP documents are in [specs](./specs).

Vite is used to process and serve the bdvp documents; they are validated in a browser
environment provided by playwright.

`npm run test` --> validate the docs once
`npm run test:watch` --> validate the docs on each file change
`npm run test:debug` --> open the browser and validate the docs on each file change