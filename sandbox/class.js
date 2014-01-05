function Clas(name) {
    this.name = name;
}

Clas.prototype.getName = function() {
    return this.name;
}

Clas.prototype.foo = function(str, bool, float, int) {
    console.log(str);
    console.log(bool);
    console.log(float);
    console.log(int);
}; 

module.exports = Clas;

var c = new Clas("hello");
console.log(c.name);
c.foo("aaa", true, 0.2, 5);
