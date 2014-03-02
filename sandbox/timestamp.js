var d = new Date();
var dt = d.getDate();
d.setDate(dt+1);
console.log(d.toString());

var time1 = new Date();
var time2 = new Date('2014-03-02T13:30:00.000Z');
console.log(time2 - time1);
console.log(new Date().getTimezoneOffset());
