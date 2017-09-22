const httpGet = require('./get')
const detect = require('./detect')
const hasher = require('multihasher')('sha256')
const Canvas = require('canvas')
const Image = Canvas.Image

const bounds = detections => {
  let _bounds = {
    x: Infinity,
    y: Infinity,
    right: 0,
    bottom: 0
  }
  for (let coords of detections) {
    if (coords.x < _bounds.x) {
      _bounds.x = coords.x
    }
    if (coords.y < _bounds.y) {
      _bounds.y = coords.y
    }
    let right = coords.x + coords.width
    if (right > _bounds.right) {
      _bounds.right = right
    }
    let bottom = coords.y + coords.height
    if (bottom > _bounds.bottom) {
      _bounds.bottom = bottom
    }
  }
  _bounds.width = _bounds.right - _bounds.x
  _bounds.height = _bounds.bottom - _bounds.y
  return _bounds
}

class ImageAPI {
  constructor (store) {
    this.store = store
  }
  set buffer (buff) {
    this._buffer = buff
  }
  get buffer () {
    if (!this._buffer) {
      this._buffer = new Promise(async resolve => {
        resolve(await this.store.get(await this.hash))
      })
    }
    return this._buffer
  }
  set hash (hash) {
    this._hash = hash
  }
  get hash () {
    if (!this._hash) {
      this._hash = new Promise(async resolve => {
        let buffer = await this.buffer
        let hash = await hasher(buffer)
        await this.store.set(hash, buffer) // TODO: has() check.
        resolve(hash)
      })
    }
    return this._hash
  }

  async setMeta (key, value) {
    // TODO: internal caching
    if (typeof value !== 'string') throw new Error('Invalid meta type.')
    let metakey = `${await this.hash}-${key}`
    return this.store.set(metakey, value)
  }
  async getMeta (key) {
    let metakey = `${await this.hash}-${key}`
    return this.store.get(metakey)
  }
  async scale (constraint) {
    let cached = await this.getMeta(constraint)
    if (cached) {
      let img = new ImageAPI()
      img.hash = cached
      return img
    }
    // TODO: scale image and store it.
  }
  async generate (settings) {
    let buffer = await this.buffer
    let img
    let detected
    if (settings.crop) {
      // TODO: caching
      img = new Image()
      img.src = buffer
      detected = await this.detections(settings.crop)
      let crop
      if (!detected.length) {
        crop = {
          x: 0,
          y: 0,
          right: img.height,
          bottom: img.height,
          width: img.width,
          height: img.height
        }
      } else {
        crop = bounds(detected)
      }
      let canvas = new Canvas()
      canvas.width = crop.width
      canvas.height = crop.height
      let ctx = canvas.getContext('2d')
      ctx.drawImage(img,
        crop.x, crop.y, crop.width, crop.height, // image coords
        0, 0, crop.width, crop.height // canvas coords
      )
      buffer = canvas.toBuffer()
    }
    if (settings.scaled) {
      img = new Image()
      img.src = buffer
      // TODO: when scaling an image larger use ML to generate higher res
      if (settings.width) img.width = settings.width
      if (settings.height) img.height = settings.height
      let canvas = new Canvas()
      canvas.width = img.width
      canvas.height = img.height
      let ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, img.width, img.height)
      buffer = canvas.toBuffer()
    }
    return buffer
  }
  async detections (api) {
    let result = await this[api]()
    let ret = []
    Object.values(result).forEach(r => {
      if (Array.isArray(r)) ret = ret.concat(r)
    })
    return ret
  }

  faces () {
    return detect.faces(this)
  }
  people () {
    return detect.people(this)
  }
}

class Images {
  constructor (store) {
    this.store = store
  }
  async fromBuffer (buff) {
    let img = new ImageAPI(this.store)
    img.buffer = buff
    return img
  }
  async fromURL (url) {
    let urlHash = await hasher(url)
    let blockHash = await this.store.get(urlHash + '.url')
    if (blockHash) return this.fromHash(blockHash)
    else {
      let buffer = Buffer.from(await httpGet(url))
      blockHash = await hasher(buffer)
      await this.store.set(blockHash, buffer)
      await this.store.set(urlHash + '.url', blockHash)
      return this.fromBuffer(buffer)
    }
  }
  async fromHash (hash) {
    let img = new ImageAPI(this.store)
    img.hash = hash
    return img
  }
}

module.exports = (...args) => new Images(...args)
