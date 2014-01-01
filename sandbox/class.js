function Clas(name) {
    this.name = name;
}

Clas.prototype.getName = function() {
    return this.name;
}

module.exports = Clas;

var c = new Clas("hello");
console.log(c.name);
