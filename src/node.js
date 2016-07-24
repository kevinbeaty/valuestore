let {get: _get, isPlainObject: isObject} = require('lodash')

function mutate(node, f){
  let mutable = new MutableNode({node})
  f(mutable.state)
  return mutable.hasUpdates ? new Node({node, mutable}) : node
}

class Node {
  constructor({value, node, mutable}){
    this.leaves = {}
    this.children = {}
    this.keys = node ? node.keys : Object.keys(value)

    let {leaves, children, keys} = this
    let hasUpdates = mutable && mutable.hasUpdates
    let updates = hasUpdates ? mutable.children : null

    let props = {}
    keys.forEach(name => {
      let isLeaf = node ? !node.children[name] : !isObject(value[name])

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

      props[name] = {
        get: isLeaf ? () => leaves[name] : () => children[name].state,
        set: throwReadOnly,
        configurable: false,
        enumerable: true
      }
    })

    this.state = Object.seal(Object.create(null, props))
  }

  get(path){
    let {state} = this
    return path ? _get(state, path) : state
  }
}

class MutableNode {
  constructor({node, parent}){
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
    if(dirty && !this._dirty){
      this._dirty = true

      let {parent} = this
      if(parent){
        parent.dirtyChildren = true
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
    let {node, children} = this
    let {leaves, children: nodeChildren, keys} = node

    let props = {}
    keys.forEach(name => {
      let nodeChild = nodeChildren[name]
      let child = new MutableNode({parent, node: nodeChild})
      let childState = nodeChild ? child.state : leaves[name]
      let get = () => child.dirty ? child.value : childState

      children[name] = child
      props[name] = {
        get,
        set(val){
          if(val !== get()){
            child.dirty = true
            child.value = val
          }
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

module.exports = {Node, mutate}
