const httpGet = require('./get')
const hasher = require('multihasher')('sha256')

class Image {
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
    let metakey = `${await this.hash}-${key}`
    return this.store.set(metakey, value)
  }
  async getMeta (key, value) {
    if (typeof value !== 'string') throw new Error('Invalid meta type.')
    let metakey = `${await this.hash}-${key}`
    return this.store.get(metakey)
  }
  async scale (constraint) {
    let cached = await this.getMeta(constraint)
    if (cached) {
      let img = new Image()
      img.hash = cached
      return img
    }
    // TODO: scale image and store it.
  }
  async generate (settings) {

  }
}

class Images {
  constructor (store) {
    this.store = store
  }
  async fromBuffer (buff) {
    let img = new Image(this.store)
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
    let img = new Image(this.store)
    img.hash = hash
    return img
  }
}

module.exports = (...args) => new Images(...args)
