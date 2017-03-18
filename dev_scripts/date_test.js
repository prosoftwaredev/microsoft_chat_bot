const Moment = require('moment');
const MomentRange = require('moment-range');
const moment = MomentRange.extendMoment(Moment);


// const SQLColumn = require('./../helpers/sql_provides/column');
// var column = new SQLColumn("test", "avg");
// console.log(column);
// column.func = "asc"
// console.log(column.func);

const start = moment("2011-02-05");
const end   = new Date(2011, 5, 5);
const dr    = moment.range(start, end);

console.log(dr.diff('months')); // 3
console.log(dr.diff('days'));   // 92
console.log(dr.diff('weeks'));   // 92
console.log(dr.diff('years'));   // 92
console.log(dr.diff());         // 7945200000
