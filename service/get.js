const Zombie = require('zombie')

module.exports = async url => {
  let browser = new Zombie()
  let res = await browser.fetch(url)
  // TODO: Handle redirects and fancy shit like CloudFlare.
  if (!res.headers.get('content-type').startsWith('image/')) {
    throw new Error(`Invalid Content-Type for ${url}`)
  }
  return res.arrayBuffer()
}
