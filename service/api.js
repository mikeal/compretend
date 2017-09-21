const cv = require('opencv')
const path = require('path')
const url = require('url')
const qs = require('querystring')
const promisify = require('util').promisify

const readImage = promisify(cv.readImage)

const haarPath = path.join(__dirname, 'models')

// const fs = require('fs')
// const haarFiles = fs.readdirSync(haarPath)
// const haars = haarFiles.map(f => path.join(haarPath, f))

// const detect = async (img, xml) => {
//   let im = await readImage(img)
//   let cascade = path.join(haarPath, xml)
//   return promisify(cb => im.detectObject(cascade, {}, cb))()
// }

const multidetect = async (img, xmls) => {
  let im = await readImage(img)
  let promises = xmls.map(xml => {
    let cascade = path.join(haarPath, xml)
    return promisify(cb => im.detectObject(cascade, {}, cb))()
  })
  let results = await Promise.all(promises)
  let ret = {}
  xmls.forEach(xml => { ret[xml] = results.shift() })
  return ret
}

const {buffer} = require('micro')

const detectPeople = async image => {
  let body = await image.buffer
  let models = [
    'haarcascade_upperbody.xml',
    'haarcascade_lowerbody.xml',
    'haarcascade_fullbody.xml'
  ]
  let results = await multidetect(body, models)
  return {
    image: await image.hash,
    upperBody: results['haarcascade_upperbody.xml'],
    lowerBody: results['haarcascade_lowerbody.xml'],
    fullBody: results['haarcascade_fullbody.xml']
  }
}

const detectFaces = async image => {
  let body = await image.buffer
  let models = [
    'haarcascade_frontalface_default.xml',
    'haarcascade_profileface.xml'
  ]
  let results = await multidetect(body, models)
  return {
    image: await image.hash,
    front: results['haarcascade_frontalface_default.xml'],
    profile: results['haarcascade_profileface.xml']
  }
}

const pushImage = async image => {
  let hash = await image.save()
  let scaled = await image.scaled('640w')
  return {hash, scaled}
}

const generateImage = (image, req) => {
  delete req.query.body
  return image.generate(req.query)
}

const routes = {
  images: {
    detect: {
      faces: detectFaces,
      people: detectPeople
    },
    push: pushImage,
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
