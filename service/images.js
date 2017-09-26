const httpGet = require('./get')
const detect = require('./detect')
const hasher = require('multihasher')('sha256')
const Canvas = require('canvas')
const Image = Canvas.Image

const numberKeys = [
  'width',
  'height',
  'min-width',
  'min-height',
  'max-width',
  'max-height',
  'margin',
  'padding'
]

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

const flatten = arr => Array.prototype.concat(...arr)

class ImageAPI {
  constructor (store, images) {
    this.store = store
    this.images = images
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
  _cleanSettings (settings) {
    numberKeys.forEach(key => {
      if (!settings[key]) return
      settings[key] = parseInt(settings[key])
    })

    if (settings.scaled === 'true' || settings.scaled === 'false') {
      settings.scaled = JSON.parse(settings.scaled)
    } else if (typeof settings.scaled === 'string') {
      settings.scaled = parseInt(settings.scaled)
    }
    return settings
  }
  async generate (settings) {
    settings = this._cleanSettings(settings)

    let buffer = await this.buffer
    if (settings.crop) {
      // TODO: caching
      let img = new Image()
      img.src = buffer

      let { bounds } = await this.bounds(settings)
      let crop = bounds
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
      if (typeof settings.scaled === 'number') {
        numberKeys.forEach(key => {
          if (settings[key]) settings[key] = settings[key] * settings.scaled
        })
      }
      let size = {width: settings.width, height: settings.height}
      buffer = await this.scaled(size, buffer)
    }
    return buffer
  }
  async detections (api) {
    let detected = await this.detect(api)
    return flatten(Object.values(detected).filter(r => Array.isArray(r)))
  }
  async bounds (settings) {
    settings = this._cleanSettings(settings)

    let buffer = await this.buffer
    let img = new Image()
    img.src = buffer
    let detected
    let crop
    if (settings.crop) {
      // TODO: caching
      detected = await this.detections(settings.crop)
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
    }

    let scalar
    if (settings.margin) {
      if (settings.scaled) {
        if (settings.width) {
          scalar = crop.width / settings.width
        } else if (settings.height) {
          scalar = crop.height / settings.height
        }
      }
      let margin = scalar * settings.margin
      crop.x = crop.x - margin
      if (crop.x < 0) crop.x = 0
      crop.y = crop.y - margin
      if (crop.y < 0) crop.y = 0
      crop.right = crop.right + margin
      if (crop.right > img.width) crop.right = img.width
      crop.bottom = crop.bottom + margin
      if (crop.bottom > img.height) crop.bottom = img.height
      crop.width = crop.width + (margin * 2)
      if (crop.width > img.width) crop.width = img.width
      crop.height = crop.height + (margin * 2)
      if (crop.height > img.height) crop.height = img.height
    }

    return {
      scalar,
      bounds: crop,
      width: img.width,
      height: img.height,
      image: await this.hash
    }
  }
  async scaled (size, buffer) {
    // TODO: cache lookup
    let img = new Image()
    img.src = buffer

    if (size.width && !size.height) {
      size.height = (size.width / img.width) * img.height
    }
    if (size.height && !size.width) {
      size.width = (size.height / img.height) * img.width
    }

    // TODO: when scaling an image larger use ML to generate higher res
    let canvas = new Canvas()
    canvas.width = size.width
    canvas.height = size.height
    let ctx = canvas.getContext('2d')
    ctx.drawImage(img, 0, 0, size.width, size.height)
    buffer = canvas.toBuffer()
    img = new Image()
    img.src = buffer
    return buffer
  }
  async detect (key) {
    let source = new Image()
    let sourceBuffer = await this.buffer
    source.src = sourceBuffer

    // Create scaled image
    let buffer = await this.scaled({width: 320}, sourceBuffer)
    let _img = await this.images.fromBuffer(buffer)
    let detected = await detect[key](_img)
    let scaled = new Image()
    scaled.src = buffer

    // Get scalars
    let widthScalar = source.width / scaled.width
    let heightScalar = source.height / scaled.height

    // Scale detections
    flatten(
      Object.values(detected)
      .filter(r => Array.isArray(r))
    ).forEach(obj => {
      obj.x = obj.x * widthScalar
      obj.y = obj.y * heightScalar
      obj.width = obj.width * widthScalar
      obj.height = obj.height * heightScalar
    })
    detected.image = await this.hash
    return detected
  }
}

class Images {
  constructor (store) {
    this.store = store
  }
  async fromBuffer (buff) {
    let img = new ImageAPI(this.store, this)
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
    let img = new ImageAPI(this.store, this)
    img.hash = hash
    return img
  }
}

module.exports = (...args) => new Images(...args)
