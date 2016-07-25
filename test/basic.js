import {Store} from '../'
import test from 'ava'
let {get} = require('lodash')


test('basic', t => {
  let xI = {a: 0, b: 0, c: {d: 1, e: {f: 40, g: 50}}, h: {0: 'hi', 1: 'false'}}
  let store = new Store(xI)

  let mutateCount = 0
  let mutateCountListener = () => mutateCount++
  store.on('', mutateCountListener)

  let x = store.state
  t.deepEqual(x, xI)

  let yI = {a: 1, b: '23', c: {d: 5, e: {f: 40, g: 5000}}, h: {0: 'yay!', 1: true}}
  let updates = store.mutate(state => {
    t.is(state.a, 0)
    state.a = 1
    t.is(state.a, 1)

    state.b = '23'

    t.is(state.c.d, 1)
    t.deepEqual(state.c, {d:1, e: {f: 40, g:50}})
    state.c.d = 5
    t.is(state.c.d, 5)
    t.deepEqual(state.c, {d:5, e: {f: 40, g:50}})

    t.is(state.c.e.g, 50)
    state.c.e.g = 5000
    t.is(state.c.e.g, 5000)
    t.deepEqual(state.c, {d:5, e: {f: 40, g:5000}})

    t.deepEqual(state, {
      a: 1, b: '23', c: {d: 5, e: {f: 40, g: 5000}}, h: {0: 'hi', 1: 'false'}})

    state.h[1] = true
    t.deepEqual(state, {
      a: 1, b: '23', c: {d: 5, e: {f: 40, g: 5000}}, h: {0: 'hi', 1: true}})

    setYay(state.h, 0)

    t.deepEqual(state, {
      a: 1, b: '23', c: {d: 5, e: {f: 40, g: 5000}}, h: {0: 'yay!', 1: true}})
  })
  t.is(mutateCount, 1)


  let y = store.state
  t.deepEqual(x, xI)
  t.deepEqual(y, yI)

  t.deepEqual(updatesToStrings(updates), [
    'a = 0 to 1',
    'b = 0 to "23"',
    'c.d = 1 to 5',
    'c.e.g = 50 to 5000',
    'h.1 = "false" to true',
    'h.0 = "hi" to "yay!"'
  ])

  let zI = {a: 213, b: '23', c: {d: true, e: {f: 'yay!', g: 5000}}, h: {0: 'yay!', 1: true}}
  updates = store.mutate(state => {
    state.a = 213
    let c = state.c
    c.d = true

    let e = c.e
    setYay(e, 'f')
  })
  t.is(mutateCount, 2)

  let z = store.state
  t.deepEqual(x, xI)
  t.deepEqual(y, yI)
  t.deepEqual(z, zI)

  t.deepEqual(updatesToStrings(updates), [
    'a = 1 to 213',
    'c.d = 5 to true',
    'c.e.f = 40 to "yay!"'
  ])

  let aI = {a: 213, b: '23', c: {d: 2330, e: {f: 4300, g: 5031}}, h: {0: 'yay!', 1: true}}
  updates = store.mutate(state => {
    state.c = {d: 2330, e: {f: 4300, g: 5031}}
  })
  t.is(mutateCount, 3)

  t.deepEqual(updatesToStrings(updates), [
    'c = {"d":true,"e":{"f":"yay!","g":5000}} to {"d":2330,"e":{"f":4300,"g":5031}}'
  ])

  let a = store.state
  t.deepEqual(x, xI)
  t.deepEqual(y, yI)
  t.deepEqual(a, aI)

  store.removeListener('', mutateCountListener)

  let bI = {a: 213, b: '23', c: {d: 3330, e: {f: 555, g: 5031}}, h: {0: 'yay!', 1: true}}
  updates = store.mutate(state => {
    state.c.d = 333
    state.c = {d: 3330, e: {f: 4311, g: 5031}}
    state.c.e.f = 555
  })
  t.is(mutateCount, 3)

  t.deepEqual(updatesToStrings(updates), [
    'c.d = 2330 to 3330',
    'c = {"d":2330,"e":{"f":4300,"g":5031}} to {"d":3330,"e":{"f":555,"g":5031}}'
  ])

  let b = store.state
  t.deepEqual(x, xI)
  t.deepEqual(y, yI)
  t.deepEqual(a, aI)
  t.deepEqual(b, bI)
})

function setYay(o, p){
  o[p] = 'yay!'
}

function updatesToStrings(mutated){
  let {updates, node, previous} = mutated
  return updates.map(updateToString(node, previous))
}

function updateToString(node, previous){
  let str = stateToString
  return path => `${path.join('.')} = ${str(previous, path)} to ${str(node, path)}`
}

function stateToString(node, path){
  return JSON.stringify(get(node.state, path))
}
