import {Store} from '../'
import test from 'ava'


test('basic', t => {
  let xI = {a: 0, b: {c: 0, d: {e: 0, f: 0}}}
  let store = new Store(xI)
  t.deepEqual(store.state, xI)

  let ac = null
  let ap = null
  let an = 0
  store.on('/a', (c, p) => {ac = c; ap = p; an++})

  let bc = null
  let bp = null
  let bn = 0
  store.on('/b', (c, p) => {bc = c; bp = p; bn++})

  let cc = null
  let cp = null
  let cn = 0
  store.on('/b/c', (c, p) => {cc = c; cp = p; cn++})

  let dc = null
  let dp = null
  let dn = 0
  store.on('/b/d', (c, p) => {dc = c; dp = p; dn++})

  let ec = null
  let ep = null
  let en = 0
  store.on('/b/d/e', (c, p) => {ec = c; ep = p; en++})

  store.mutate(s => {
    s.a = 1
    t.is(ac, null)
    t.is(ap, null)
    t.is(store.state.a, 0)
  })

  t.is(ap, 0)
  t.is(ac, 1)
  t.is(an, 1)

  store.mutate(s => {
    s.a = 1
  })

  t.is(ap, 0)
  t.is(ac, 1)
  t.is(an, 1)
  let x1 = {a: 1, b: {c: 0, d: {e: 0, f: 0}}}
  t.deepEqual(store.state, x1)

  store.mutate(s => {
    s.a = 2
    t.is(ac, 1)
    t.is(ap, 0)
    t.is(store.state.a, 1)
  })

  t.is(ap, 1)
  t.is(ac, 2)
  t.is(an, 2)

  t.is(bc, null)
  t.is(bp, null)
  t.is(bn, 0)

  t.is(cc, null)
  t.is(cp, null)
  t.is(cn, 0)

  let x2 = {a: 2, b: {c: 0, d: {e: 0, f: 0}}}
  t.deepEqual(store.state, x2)

  store.mutate(s => {
    s.b.c = 1
    t.deepEqual(store.state.b, xI.b)
  })

  let x3 = {a: 2, b: {c: 1, d: {e: 0, f: 0}}}
  t.deepEqual(store.state, x3)

  t.is(bn, 1)
  t.deepEqual(bp, xI.b)
  t.deepEqual(bc, x3.b)

  t.is(cc, 1)
  t.is(cp, 0)
  t.is(cn, 1)

  t.is(dc, null)
  t.is(dp, null)
  t.is(dn, 0)

  t.is(ec, null)
  t.is(ep, null)
  t.is(en, 0)

  store.mutate(s => {
    s.b.d.e = 1
    t.deepEqual(store.state.b, x3.b)
  })

  let x4 = {a: 2, b: {c: 1, d: {e: 1, f: 0}}}
  t.deepEqual(store.state, x4)

  t.is(bn, 2)
  t.deepEqual(bp, x3.b)
  t.deepEqual(bc, x4.b)

  t.is(dn, 1)
  t.deepEqual(dp, xI.b.d) 
  t.deepEqual(dc, x4.b.d)

  t.is(ec, 1)
  t.is(ep, 0)
  t.is(en, 1)

  store.mutate(s => {
    s.b.d.e = 2
  })

  let x5 = {a: 2, b: {c: 1, d: {e: 2, f: 0}}}
  t.deepEqual(store.state, x5)

  t.is(bn, 3)
  t.deepEqual(bp, x4.b)
  t.deepEqual(bc, x5.b)

  t.is(dn, 2)
  t.deepEqual(dp, x4.b.d) 
  t.deepEqual(dc, x5.b.d)

  t.is(ec, 2)
  t.is(ep, 1)
  t.is(en, 2)

  store.mutate(s => {
    s.b.d.f = 3
  })

  let x6 = {a: 2, b: {c: 1, d: {e: 2, f: 3}}}
  t.deepEqual(store.state, x6)

  t.is(bn, 4)
  t.deepEqual(bp, x5.b)
  t.deepEqual(bc, x6.b)

  t.is(dn, 3)
  t.deepEqual(dp, x5.b.d) 
  t.deepEqual(dc, x6.b.d)

  t.is(ec, 2)
  t.is(ep, 1)
  t.is(en, 2)

  t.is(cc, 1)
  t.is(cp, 0)
  t.is(cn, 1)

  store.mutate(s => {
    s.b = {c: 8, d: {e: 2, f: 10}}
  })

  let x7 = {a: 2, b: {c: 8, d: {e: 2, f: 10}}}
  t.deepEqual(store.state, x7)

  t.is(bn, 5)
  t.deepEqual(bp, x6.b)
  t.deepEqual(bc, x7.b)

  t.is(dn, 4)
  t.deepEqual(dp, x6.b.d) 
  t.deepEqual(dc, x7.b.d)

  t.is(ec, 2)
  t.is(ep, 1)
  t.is(en, 2)

  t.is(cc, 8)
  t.is(cp, 1)
  t.is(cn, 2)

  store.mutate(s => {
    s.b.d = {e: 3, f: 11}
  })

  let x8 = {a: 2, b: {c: 8, d: {e: 3, f: 11}}}
  t.deepEqual(store.state, x8)

  t.is(bn, 6)
  t.deepEqual(bp, x7.b)
  t.deepEqual(bc, x8.b)

  t.is(dn, 5)
  t.deepEqual(dp, x7.b.d) 
  t.deepEqual(dc, x8.b.d)

  t.is(ec, 3)
  t.is(ep, 2)
  t.is(en, 3)

  t.is(cc, 8)
  t.is(cp, 1)
  t.is(cn, 2)

  t.is(ap, 1)
  t.is(ac, 2)
  t.is(an, 2)

})
