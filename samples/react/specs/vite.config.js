/**
 * @type {import('vite').UserConfig}
 */
const config = {
  root: "./specs",
  define: {
    global: 'window',
    '__REACT_DEVTOOLS_GLOBAL_HOOK__': '{ "isDisabled": true }'
  },
  clearScreen: false,
  logLevel: 'error'
}

export default config