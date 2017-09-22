const test = require('tap').test
const micro = require('micro')
const fs = require('fs')
const path = require('path')
// const qs = require('querystring')
const { promisify } = require('util')
const handler = require('../service/api.js')
const request = require('request-promise')

const Canvas = require('canvas')
const Image = Canvas.Image

const server = micro(handler)
const readFile = f => promisify(fs.readFile)(path.join(__dirname, f))

const u = p => `http://localhost:3000${p}`

test('generate image cropped to faces', async t => {
  await server.listen(3000)
  t.plan(2)
  let body = await readFile('bowie-burroughs.png')
  let img = new Image()
  img.src = body
  let opts = {body, encoding: null}
  let buff = await request.post(u('/images/generate?crop=faces'), opts)

  let cropped = new Image()
  cropped.src = buff

  t.ok(img.width > cropped.width)
  t.ok(img.height > cropped.height)

  await server.close()
})
