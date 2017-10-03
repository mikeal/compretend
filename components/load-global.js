const r2 = require('r2')

const Compretend = {
  api: 'http://138.68.3.9'
}
Compretend.put = (url, opts) => {
  return r2.post(Compretend.api + url, opts)
}

window.Compretend = Compretend
