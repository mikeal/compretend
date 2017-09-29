
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
