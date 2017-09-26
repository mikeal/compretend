const url = require('url')
const qs = require('querystring')
const { buffer } = require('micro')

const pushImage = async image => {
  let hash = await image.save()
  let scaled = await image.scaled('640w')
  return {hash, scaled}
}

const generateImage = (image, req) => {
  delete req.query.body
  return image.generate(req.query)
}

const generateBounds = (image, req) => {
  delete req.query.body
  return image.bounds(req.query)
}

const routes = {
  images: {
    detect: {
      faces: img => img.detect('faces'),
      people: img => img.detect('people')
    },
    push: pushImage,
    bounds: generateBounds,
    generate: generateImage
  }
}

const limit = '100mb'

const cors = res => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE')
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept, Authorization')
}

const makeHandler = store => {
  const images = require('./images')(store)

  return async (req, res) => {
    let parsed = url.parse(req.url)
    let _path = parsed.pathname.split('/').filter(t => t)
    req.query = qs.parse(parsed.query)
    let route = routes

    let image
    if (req.method === 'PUT' || req.method === 'POST') {
      image = await images.fromBuffer(await buffer(req, {limit}))
    } else if (req.method === 'GET' || req.method === 'HEAD') {
      let query = req.query
      if (!query.body) {
        throw new Error('Query is missing body parameter.')
      }
      if (query.body.startsWith('http')) {
        image = await images.fromURL(query.body)
      } else {
        image = await images.fromHash(query.body)
      }
    } else {
      throw new Error('Unsupported HTTP method.')
    }

    cors(res)

    while (route) {
      route = route[_path.shift()]
      if (route && _path.length === 0) {
        return route(image, req, res)
      }
    }
  }
}

const { MemoryStore } = require('./store')
module.exports = makeHandler(new MemoryStore())
module.exports.api = makeHandler
