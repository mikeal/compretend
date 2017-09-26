/* globals Image, Blob, Compretend, fetch */
require('./load-global')
const ZComponent = require('../../zcomponent')
const hasher = require('multihasher')('sha256')
const qs = require('query-string')

const sorted = obj => {
  let o = {}
  Object.keys(obj).sort().forEach(k => { o[k] = obj[k] })
  return o
}

class CompretendImage extends ZComponent {
  constructor () {
    super()
    this._settings = {}
  }

  async settings () {
    let _settings = this._settings
    let hash = await this._settingsHash()
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
  set margin (value) {
    this._imageSetting('margin', parseInt(value))
  }
  set padding (value) {
    this._imageSetting('padding', parseInt(value))
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
  set scaled (value) {
    if (value !== 'false' && value) {
      this._imageSetting('scaled', value)
    }
  }

  async _settingsHash () {
    return hasher(JSON.stringify(this._getURLSettings()))
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
    return new Promise(resolve => {
      let img = new Image()
      img.onload = () => resolve(img)
      img.src = src
      if (img.complete) resolve(img)
      if (settings.width) img.width = settings.width
      if (settings.height) img.height = settings.height
    })
  }
  _getURLSettings () {
    let _settings = sorted(this._settings)
    if (!_settings.scaled) {
      delete _settings.width
      delete _settings.height
    }
    return _settings
  }
  _makeURL () {
    let query = qs.stringify(this._getURLSettings())
    return `${Compretend.api}/images/generate?${query}`
  }
  _makeBoundsURL () {
    let query = qs.stringify(this._getURLSettings())
    return `${Compretend.api}/images/bounds?${query}`
  }
  overlay (selector) {
    /* Mostly useful for demo purposes */
    setTimeout(async () => {
      let boundsURL = this._makeBoundsURL()
      let _req = fetch(boundsURL).then(res => res.json())
      let _img = this.toImage()
      let [bounds, img] = await Promise.all([_req, _img])
      let under = document.querySelector(selector)

      let widthScalar = under.width / bounds.width
      let heightScalar = under.height / bounds.height

      img.width = img.width * widthScalar * (bounds.bounds.width / img.width)
      img.height = img.height * heightScalar * (bounds.bounds.height / img.height)
      img.style.position = 'absolute'
      img.style.top = parseInt((bounds.bounds.y * heightScalar) - 5) + 'px'
      img.style.left = parseInt((bounds.bounds.x * widthScalar) - 5) + 'px'
      img.style.border = '5px solid #37FDFC'
      img.style['z-index'] = 10
      under.parentNode.style.position = 'relative'
      under.parentNode.appendChild(img)
    }, 1)
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

/* We need another class because you can only register one class per
   element name.
*/
class CompretendImg extends CompretendImage { }
window.customElements.define('compretend-img', CompretendImg)
