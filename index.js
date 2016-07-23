let isObject = require('lodash/isObject')

class Store {
  constructor(value){
    this.root = new Node({value})
  }

  get state(){
    return this.root.state
  }

  mutate(f){
    this.root = mutate(this.root, f)
  }
}

function mutate(node, f){
  let mutable = new MutableNode(node)
  f(mutable.state)
  return mutable.hasUpdates ? new Node({node, mutable}) : node
}

class Node {
  constructor({value = null, node = null, mutable = null}){
    this.leaves = {}
    this.children = {}

    this.keys = node ? node.keys : Object.keys(value)

    let {leaves, children, keys} = this

    let hasUpdates = mutable && mutable.hasUpdates
    let updates = null
    if(hasUpdates){
      updates = mutable.children
    }

    let props = {}
    keys.forEach(name => {
      let isLeaf = node ? !node.children[name] : !isObject(value[name])

      props[name] = {
        get: isLeaf ? () => leaves[name] : () => children[name].state,
        set: throwReadOnly,
        configurable: false,
        enumerable: true
      }

      let update = hasUpdates ? updates[name] : null
      if(isLeaf){
        if(update && update.dirty){
          leaves[name] = update.value
        } else {
          leaves[name] = node ? node.state[name] : value[name]
        }
      } else {
        if(update && update.dirty){
          children[name] = new Node({value: update.value})
        } else if (update && update.dirtyChildren) {
          children[name] = new Node({
            node: node ? node.children[name] : null,
            value: node ? null : value[name],
            mutable: update})
        } else {
          children[name] = node ? node.children[name] : new Node({value: value[name]})
        }
      }
    })

    this.state = Object.seal(Object.create(null, props))
  }
}

class MutableNode {
  constructor(node, parent = null){
    this.node = node
    this.parent = parent
    this._dirty = false
    this._dirtyChildren = false
    if(node === null){
      this.isLeaf = true
    } else {
      this.isLeaf = false
      this.children = {}
    }
  }

  get hasUpdates(){
    return this._dirty || this._dirtyChildren
  }

  get dirty(){
    return this._dirty
  }

  get dirtyChildren(){
    return this._dirtyChildren
  }

  set dirty(dirty){
    if(dirty){
      this._dirty = true
      if(this.parent){
        this.parent.dirtyChildren = true
      }
    }
  }

  set dirtyChildren(dirty){
    if(dirty){
      this._dirtyChildren = true
      if(this.parent){
        this.parent.dirtyChildren = true
      }
    }
  }

  get state(){
    if(this._state){
      return this._state
    }

    let parent = this
    let {node, children: updates} = this
    let {leaves, children} = node
    let leafNames = Object.keys(leaves)
    let childNames = Object.keys(children)

    let props = {}
    leafNames.forEach(name => {
      let child = new MutableNode(null, parent)
      let get = () => child.dirty ? child.value : leaves[name]
      props[name] = {
        get,
        set(val){
          if(val !== get()){
            child.dirty = true
            child.value = val
            updates[name] = child
          }
        },
        configurable: false,
        enumerable: true
      }
    })

    childNames.forEach(name => {
      let child = new MutableNode(children[name], parent)
      props[name] = {
        get: () => {
          if(child.dirty){
            return child.value
          }
          updates[name] = child
          return child.state
        },
        set(val){
          child.dirty = true
          child.value = val
          updates[name] = child
        },
        configurable: false,
        enumerable: true
      }
    })

    this._state = Object.seal(Object.create(null, props))
    return  this._state
  }
}

function throwReadOnly(){
  throw new Error('Value object is readonly')
}

exports.Store = Store
