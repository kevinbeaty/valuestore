import {Store} from './index'
import test from 'ava'


test('basic', t => {
  let xI = {a: 0, b: 0, c: {d: 1, e: {f: 40, g: 50}}, h: {0: 'hi', 1: 'false'}}
  let store = new Store(xI)
  let x = store.state

  t.deepEqual(x, xI)

  let yI = {a: 1, b: '23', c: {d: 5, e: {f: 40, g: 5000}}, h: {0: 'yay!', 1: true}}
  store.mutate(state => {
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

  let y = store.state
  t.deepEqual(x, xI)
  t.deepEqual(y, yI)
  

  let zI = {a: 213, b: '23', c: {d: true, e: {f: 'yay!', g: 5000}}, h: {0: 'yay!', 1: true}}
  store.mutate(state => {
    state.a = 213
    let c = state.c
    c.d = true

    let e = c.e
    setYay(e, 'f')
  })
  let z = store.state
  t.deepEqual(x, xI)
  t.deepEqual(y, yI)
  t.deepEqual(z, zI)

  let aI = {a: 213, b: '23', c: {d: 2330, e: {f: 4300, g: 5031}}, h: {0: 'yay!', 1: true}}
  store.mutate(state => {
    state.c = {d: 2330, e: {f: 4300, g: 5031}}
  })

  let a = store.state
  t.deepEqual(x, xI)
  t.deepEqual(y, yI)
  t.deepEqual(a, aI)

  let bI = {a: 213, b: '23', c: {d: 3330, e: {f: 555, g: 5031}}, h: {0: 'yay!', 1: true}}
  store.mutate(state => {
    state.c.d = 333
    state.c = {d: 3330, e: {f: 4311, g: 5031}}
    state.c.e.f = 555
  })

  let b = store.state
  t.deepEqual(x, xI)
  t.deepEqual(y, yI)
  t.deepEqual(a, aI)
  t.deepEqual(b, bI)
})

function setYay(o, p){
  o[p] = 'yay!'
}
