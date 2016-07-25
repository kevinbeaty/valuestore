let {EventEmitter} = require('events')
let {Node, mutate} = require('./node')

class Store {
  constructor(value){
    this.root = new Node({value})
    this.emitter = new EventEmitter()
  }

  get state(){
    return this.root.state
  }

  mutate(f){
    this.previous = this.root
    let {node, updates} = mutate(this.previous, f)
    this.root = node

    let {emitter, previous} = this
    for(let path of emitter.eventNames()){
      let rootVal = node.get(path)
      let prevVal = previous.get(path)
      if(rootVal !== prevVal){
        emitter.emit(path, rootVal, prevVal)
      }
    }

    return {node, previous, updates}
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
