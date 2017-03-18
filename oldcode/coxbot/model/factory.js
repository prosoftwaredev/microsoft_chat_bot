var mongoose = require('mongoose');
// mongoose.connect('mongodb://kodz8782:T3Cldb70190h80l@ec2-34-195-197-47.compute-1.amazonaws.com:27017')
mongoose.connect('mongodb://tylerroberts:fallen123@ds054619.mlab.com:54619/testbot')
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
    console.log("we're connected!")
})

var userSchema = new mongoose.Schema({
    username: String,
    password: String
});

var User = mongoose.model('User', userSchema);

// var tyler = new User({ username: "tyler", password: "p@ssw0rd" })
// var daniel = new User({ username: "daniel", password: "1234" })
// daniel.save()
// tyler.save()

var factory = {
    FindUser: function (username, password) {
        return User.findOne({ username: username, password: password })
    },
    GetAllUsers: function (){
        return User.find({})
    }
}

module.exports = factory

