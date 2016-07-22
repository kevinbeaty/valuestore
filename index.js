let isObject = require('lodash/isObject')

class Store {
  constructor(obj){
    this._root = new Node(obj)
  }

  get state(){
    return this._root.state
  }

  mutate(f){
    this._root = mutate(this._root, f)
  }
}

function mutate(node, f){
  let path = []
  let updates = []

  f(node._mutableState(path, updates))

  let next = node.mutate(updates)
  return next
}

class Node {
  constructor(obj){
    this.keys = Object.keys(obj)
    this.leaves = {}
    this.children = {}

    let {keys, leaves, children} = this

    let props = {}
    keys.forEach(name => {
      props[name] = {
        configurable: false,
        enumerable: true,
        set: throwReadOnly
      }

      let val = obj[name]
      if(!isObject(val)){
        leaves[name] = val
        props[name].get = () => leaves[name]
      } else {
        children[name] = new Node(val)
        props[name].get = () => children[name].state
      }
    })
    this.state = Object.seal(Object.create(null, props))
  }

  mutate(updates = []){
    if(updates.length === 0){
      return this
    }

    let copy = new Node(this.state)

    let {leaves, children} = copy

    let childNames = Object.keys(children)
    let childUpdates = {}
    childNames.forEach(name => childUpdates[name] = [])
    
    updates.forEach(update => {
      let [[name, ...rest], val] = update
      if(!children[name]){
        if(rest.length > 0){
          throw new Error('Cannot update nested values in leaf node')
        } else {
          leaves[name] = val
        }
      } else {
        if(rest.length > 0){
          childUpdates[name].push([rest, val])
        } else {
          children[name] = new Node(val)
          childUpdates[name] = []
        }
      }
    })

    childNames.forEach(name => {
      children[name] = children[name].mutate(childUpdates[name])
    })

    return copy
  }

  _mutableState(path, updates){
    let {leaves, children} = this
    let leafNames = Object.keys(leaves)
    let childNames = Object.keys(children)

    let props = {}

    leafNames.forEach(name => {
      props[name] = {
        configurable: false,
        enumerable: true,
        get: () => {
          return leaves[name]
        },
        set: (val) => {
          let namePath = path.concat([name])
          updates.push([namePath, val])
        }
      }
    })

    childNames.forEach(name => {
      let namePath = path.concat([name])
      props[name] = {
        configurable: false,
        enumerable: true,
        get: () => children[name]._mutableState(namePath, updates),
        set: (val) => {
          updates.push([namePath, val])
        }
      }
    })
    return Object.seal(Object.create(null, props))
  }
}

function throwReadOnly(){
  throw new Error('Value object is readonly')
}

exports.Store = Store
