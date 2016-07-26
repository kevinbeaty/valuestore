let pointer = require('json-pointer')

function create(value){
  let keys = Object.keys(value)
  let state = {}

  keys.forEach(name => {
    let isLeaf = isPrimitive(value[name])
    if(isLeaf){
      state[name] = value[name]
    } else {
      state[name] = create(value[name])
    }
  })
  return Object.freeze(state)
}

function getPath(node, path){
  return pointer.get(node, path)
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

module.exports = {create, getPath, isPrimitive}
