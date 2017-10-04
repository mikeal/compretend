/* globals CustomEvent */
let loadjs = require('distjs').loadjs

const build = name => {
  // Fast Load for Chrome (avoids skip before render)
  const getChromeVersion = (force) => {
    if (force) return true
    var raw = navigator.userAgent.match(/Chrom(e|ium)\/([0-9]+)\./)
    return raw ? parseInt(raw[2], 10) > 59 : false
  }
  if (getChromeVersion()) require('./components')

  window.addEventListener('WebComponentsReady', () => {
    let event = new CustomEvent(`${name}-ready`, require('./components'))
    window.dispatchEvent(event)
  })
  const polyfill = 'https://cdnjs.cloudflare.com/ajax/libs/webcomponentsjs/1.0.12/webcomponents-loader.js'
  loadjs([{async: true, url: polyfill}])
}

build(require('./package.json').name)
