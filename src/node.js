let {get: _get, isPlainObject: isObject} = require('lodash')

function mutate(node, f){
  let mutable = new MutableNode({node})
  f(mutable.state)
  let updated = mutable.updated ? new Node({node, mutable}) : node
  return {node: updated, updates: mutable.updates}
}

class Node {
  constructor({value, node, mutable}){
    let leaves = {}
    let children = {}
    let keys = node ? node.keys : Object.keys(value)

    let updated = mutable && mutable.updated
    let updates = updated ? mutable.children : null

    let props = {}
    keys.forEach(name => {
      let isLeaf = node ? !node.children[name] : !isObject(value[name])

      let update = updated ? updates[name] : null
      if(isLeaf){
        if(update && update.dirty){
          leaves[name] = update.value
        } else {
          leaves[name] = node ? node.state[name] : value[name]
        }
        props[name] = leaves[name]
      } else {
        if(update && update.dirty){
          children[name] = new Node({value: update.value})
        } else if (update && update.updated) {
          children[name] = new Node({
            node: node ? node.children[name] : null,
            value: node ? null : value[name],
            mutable: update})
        } else {
          children[name] = node ? node.children[name] : new Node({value: value[name]})
        }
        props[name] = children[name].state
      }
    })

    this.leaves = Object.freeze(leaves)
    this.children = Object.freeze(children)
    this.keys = Object.freeze(keys)
    this.state = Object.freeze(props)

    Object.freeze(this)
  }

  get(path){
    let {state} = this
    return path ? _get(state, path) : state
  }
}

class MutableNode {
  constructor({node, parent, path = []}){
    this.node = node
    this.parent = parent
    this.path = path
    this.dirty = false
    this.updated = false

    if(node){
      this.children = {}
    }

    if(!parent){
      this.updates = []
    }
  }

  notifyUpdate(path = this.path){
    let {parent} = this
    this.updated = true
    if(parent){
      parent.notifyUpdate(path)
    } else {
      this.updates.push(path)
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
      let child = children[name] = new MutableNode({
        parent,
        node: nodeChildren[name],
        path: parent.path.concat([name])})

      let get = () => child.dirty ? child.value : child.node ? child.state : leaves[name]
      props[name] = {
        get,
        set(val){
          if(val !== get()){
            child.dirty = true
            child.value = val
            child.notifyUpdate()
          }
        },
        configurable: false,
        enumerable: true
      }
    })

    return (this._state = Object.seal(Object.create(Object.prototype, props)))
  }
}

module.exports = {Node, mutate}
