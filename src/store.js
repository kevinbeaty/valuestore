let {Node, mutate} = require('./node')

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

module.exports = {Store}
