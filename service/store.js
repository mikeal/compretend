const fs = require('fs')
const path = require('path')
const { promisify } = require('util')
const readFile = promisify(fs.readFile)
const writeFile = promisify(fs.writeFile)
const statFile = promisify(fs.stat)
const sanitize = require('sanitize-filename')

class FileSystemStore {
  constructor (dir) {
    this.dir = dir
  }
  async get (key) {
    let f = path.join(this.dir, sanitize(key))
    let ret = null
    try {
      ret = await readFile(f)
    } catch (e) {
      if (e.code !== 'ENOENT') throw e
    }
    return ret
  }
  async set (key, value) {
    let f = path.join(this.dir, sanitize(key))
    return writeFile(f, value)
  }
  async has (key) {
    let f = path.join(this.dir, sanitize(key))
    let ret = null
    try {
      ret = await statFile(f)
    } catch (e) {
      if (e.code !== 'ENOENT') throw e
    }
    return ret
  }
}

class MemoryStore {
  constructor () {
    this._store = {}
  }
  async get (key) {
    return this._store[key] || null
  }
  async set (key, value) {
    this._store[key] = value
    return true
  }
  async has (key) {
    return !!(this._store[key])
  }
}

module.exports.MemoryStore = MemoryStore
module.exports.FileSystemStore = FileSystemStore
