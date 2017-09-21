/* globals Image, Blob, Compretend */
require('./load-global')
const ZComponent = require('../roll-call/components/z-component')
const hasher = require('multihasher')
const qs = require('query-string')

const sorted = obj => Object.keys(obj).sort().map(k => obj[k])

class CompretendImage extends ZComponent {
  constructor () {
    super()
    this._settings = {}
  }

  async settings () {
    let _settings = this._settings
    let hash = await hasher(sorted(_settings))
    return {image: _settings, hash}
  }

  set width (value) {
    this._imageSetting('width', parseInt(value))
  }
  set height (value) {
    this._imageSetting('height', parseInt(value))
  }
  set crop (value) {
    this._imageSetting('crop', value)
  }
  set src (value) {
    this._imageSetting('body', value)
  }
  set data (value) {
    if (value instanceof ArrayBuffer) {
      // TODO: push to server and then set to hash
      // this.src = hash
    } else if (value instanceof Blob) {
      // TODO: push to server and then set to hash
      // this.src = hash
    }
  }

  async _settingsHash () {
    return hasher(sorted(this._settings))
  }
  async _imageSetting (key, value) {
    let hash = await this._settingsHash()
    this._settings[key] = value
    if (hash !== await this._settingsHash()) {
      return this._update()
    }
  }
  async _update () {
    if (!this._settings.body) return
    if (this.timeout) clearTimeout(this.timeout)
    this.timeout = setTimeout(async () => {
      let hash = await this._settingsHash()
      let img = await this.toImage()
      if (hash === await this._settingsHash()) {
        this.innerHTML = ''
        this.appendChild(img)
      }
    }, 0)
  }
  toImage () {
    let settings = Object.assign({}, this._settings)
    let src = this._makeURL()
    return new Promise((resolve, reject) => {
      let img = new Image()
      img.onload = () => resolve(img)
      img.src = src
      if (settings.width) img.width = settings.width
      if (settings.height) img.height = settings.height
    })
  }
  _makeURL () {
    let query = qs.stringify(sorted(this._settings))
    return `${Compretend.api}/images/generate?${query}`
  }
  get shadow () {
    return `
    <style>
    :host {
      margin: 0 0 0 0;
      padding: 0 0 0 0;
    }
    </style>
    <slot></slot>
    `
  }
}

Compretend.image = (...args) => new CompretendImage(...args)

module.exports = CompretendImage

window.customElements.define('compretend-image', CompretendImage)
