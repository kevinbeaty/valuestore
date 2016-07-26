let pointer = require('json-pointer')
let {create, getPath, isPrimitive} = require('./node')

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
  let updated = mutable.updated
  let updates = updated ? mutable.children : null

  let state = {}
  Object.keys(node).forEach(name => {
    let isLeaf = isPrimitive(node[name])
    let update = updates[name]

    if(isLeaf){
      state[name] = update.dirty ? update.value : node[name]
    } else {
      if(update.dirty){
        state[name] = create(update.value)
      } else if(update.updated){
        state[name] = _mutateFrom(node[name], update)
      } else {
        state[name] = node[name]
      }
    }
  })

  return Object.freeze(state)
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

    let props = {}
    Object.keys(node).forEach(name => {
      let child = children[name] = new MutableNode({
        parent,
        node: node[name],
        path: parent.path.concat([name])})

      let get = () => child.dirty ? child.value : !isPrimitive(child.node) ? child.state : node[name]
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
