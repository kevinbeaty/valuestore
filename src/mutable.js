let pointer = require('json-pointer')
let {create, freeze, getPath} = require('./node')

function mutate(node, f){
  let mutable = new MutableNode({node})
  f(mutable.state)
  if(!mutable.updated){
    return {node, patch: []}
  }

  let next = _mutateFrom(node, mutable)

  let patch = mutable.updates.map(path => {
    let ptr = pointer.compile(path)
    return {op: "replace", path: ptr, value: getPath(next, ptr)}
  })

  return {node: next, patch: patch}
}

function _mutateFrom(node, mutable){
  let leaves = {}
  let children = {}
  let {keys} = node

  let updated = mutable.updated
  let updates = updated ? mutable.children : null

  let state = {}
  keys.forEach(name => {
    let isLeaf = !node.children[name]
    let update = updates[name]

    if(isLeaf){
      leaves[name] = update.dirty ? update.value : node.state[name]
      state[name] = leaves[name]
    } else {
      if(update.dirty){
        children[name] = create(update.value)
      } else if(update.updated){
        children[name] = _mutateFrom(node.children[name], update)
      } else {
        children[name] = node.children[name]
      }
      state[name] = children[name].state
    }
  })

  return freeze({leaves, children, keys, state})
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

module.exports = {mutate}
