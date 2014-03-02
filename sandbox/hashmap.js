var map = require('hashmap');

var m = new map.HashMap();
m.set(1, 'abc');
m.set(2, 'abc');
console.log(m);
if (m.get(1)) {
    console.log("aaa");
}
if (m.get(3)) {
    console.log("aaa");
}

