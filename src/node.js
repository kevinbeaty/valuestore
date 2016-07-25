let pointer = require('json-pointer')

function freeze(node){
  Object.freeze(node.leaves)
  Object.freeze(node.children)
  Object.freeze(node.keys)
  Object.freeze(node.state)
  Object.freeze(node)
  return node
}

function create(value){
  let keys = Object.keys(value)
  let leaves = {}
  let children = {}
  let state = {}

  keys.forEach(name => {
    let isLeaf = isPrimitive(value[name])
    if(isLeaf){
      leaves[name] = value[name]
      state[name] = leaves[name]
    } else {
      children[name] = create(value[name])
      state[name] = children[name].state
    }
  })
  return freeze({leaves, children, keys, state})
}

function getPath(node, path){
  let {state} = node
  return pointer.get(state, path)
}

function isPrimitive(value){
  if(value === null){
    return true
  }
  switch(typeof value){
    case 'boolean': case 'number': case 'string':
      return true
    default:
        return false
  }
}

module.exports = {create, freeze, getPath}
