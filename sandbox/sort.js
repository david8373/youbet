function Obj(name, val, time) {
    this.name = name;
    this.val = val;
    this.time = time;
};

var o1 = new Obj("aaa", 2, new Date("2014-01-01T08:00:00.000Z"));
var o2 = new Obj("bbb", 2, new Date("2014-01-01T09:00:00.000Z"));
var o3 = new Obj("bbb", 1, new Date("2014-01-01T12:00:00.001Z"));
function ascending(o1, o2) {
    if (o1.val == o2.val)
	return o1.time - o2.time;
    return o1.val - o2.val;
}

var o = [o1, o2, o3];
o.sort(ascending);
console.log(o);


