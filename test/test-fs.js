const test = require('tap').test
const micro = require('micro')
const fs = require('fs')
const path = require('path')
const mkdirp = require('mkdirp')
const rimraf = require('rimraf')
const { FileSystemStore } = require('../service/store')
// const qs = require('querystring')
const { promisify } = require('util')
const request = require('request-promise')

const Canvas = require('canvas')
const Image = Canvas.Image


const readFile = f => promisify(fs.readFile)(path.join(__dirname, f))
const ls = promisify(fs.readdir)

const u = p => `http://localhost:3000${p}`

const tmpcache = path.join(__dirname, 'tmpcache')

test('image cropped to faces', async t => {
  rimraf.sync(tmpcache)
  mkdirp.sync(tmpcache)
  const store = new FileSystemStore(tmpcache)
  const handler = require('../service/api.js').api(store)
  const server = micro(handler)

  await server.listen(3000)
  t.plan(2)

  let body = await readFile('bowie-burroughs.png')
  let opts = {body, encoding: null}
  let buff1 = await request.post(u('/images/generate?crop=faces'), opts)

  let files = await ls(tmpcache)
  t.same(files.length, 3)

  let buff2 = await request.post(u('/images/generate?crop=faces'), opts)
  t.same(buff1, buff2)

  await server.close()
  rimraf.sync(tmpcache)
})
