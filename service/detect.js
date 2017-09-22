const cv = require('opencv')
const path = require('path')
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

exports.faces = detectFaces
exports.people = detectPeople
