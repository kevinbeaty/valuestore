let {EventEmitter} = require('events')
let {create, getPath} = require('./node')
let {mutate} = require('./mutable')

class Store {
  constructor(value){
    this.root = create(value)
    this.emitter = new EventEmitter()
  }

  get state(){
    return this.root
  }

  mutate(f){
    this.previous = this.root
    let {node, patch} = mutate(this.previous, f)
    this.root = node

    let {emitter, previous} = this
    for(let path of emitter.eventNames()){
      let rootVal = getPath(node, path)
      let prevVal = getPath(previous, path)
      if(rootVal !== prevVal){
        emitter.emit(path, rootVal, prevVal)
      }
    }

    return {node, previous, patch}
  }

  on(path, listener){
    this.emitter.on(path, listener)
  }

  once(path, listener){
    this.emitter.once(path, listener)
  }

  addListener(path, listener){
    this.emitter.addListener(path, listener)
  }

  removeListener(path, listener){
    this.emitter.removeListener(path, listener)
  }
}

module.exports = {Store}
