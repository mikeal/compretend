const r2 = require('../../r2')
const test = require('tap').test
const micro = require('micro')
const fs = require('fs')
const path = require('path')
const qs = require('querystring')
const { promisify } = require('util')
const handler = require('../service/api.js')

const server = micro(handler)
const readFile = f => promisify(fs.readFile)(path.join(__dirname, f))

const u = p => `http://localhost:3000${p}`

// test('basic faces, PUT & GET', async t => {
//   t.plan(6)
//   await server.listen(3000)
//   let body = await readFile('bowie-burroughs.png')
//   let res = await r2.put(u('/images/detect/faces'), {body}).json
//   t.ok(res.image)
//   t.ok(res.front)
//   t.ok(res.profile)

//   let url = u(`/images/detect/faces?body=${res.image}`)
//   let res2 = await r2.get(url).json
//   t.same(res.image, res2.image)
//   t.same(res.front, res2.front)
//   t.same(res.profile, res2.profile)
//   await server.close()
// })

test('basic people, PUT & GET', async t => {
  t.plan(6)
  await server.listen(3000)
  let body = await readFile('bowie-burroughs.png')
  let res = await r2.put(u('/images/detect/people'), {body}).json
  t.ok(res.image)
  t.ok(res.upperBody)
  t.ok(res.fullBody)

  let url = u(`/images/detect/people?body=${res.image}`)
  let res2 = await r2.get(url).json
  t.same(res.image, res2.image)
  t.same(res.upperBody, res2.upperBody)
  t.same(res.fullBody, res2.fullBody)
  await server.close()
})

test('remote img, faces', async t => {
  await server.listen(3000)
  t.plan(3)
  let imgurl = `https://peopledotcom.files.wordpress.com` +
               `/2017/01/prince-charles-2.jpg?w=2000&h=1430`
  let url = u(`/images/detect/people?${qs.stringify({body: imgurl})}`)
  let res = await r2.get(url).json
  t.ok(res.image)
  t.ok(res.upperBody)
  t.ok(res.fullBody)
  await server.close()
})
