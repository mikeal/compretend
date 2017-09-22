/* globals CustomEvent */
const loadjs = require('load-js')

const polyfill = 'https://cdnjs.cloudflare.com/ajax/libs/webcomponentsjs/1.0.12/webcomponents-loader.js'

;(async () => {
  window.addEventListener('WebComponentsReady', () => {
    let event = new CustomEvent('compretend', require('./components'))
    window.dispatchEvent(event)
  })
  await loadjs([{async: true, url: polyfill}])
})()
