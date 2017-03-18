var mongoose = require('mongoose');

mongoose.Promise = global.Promise;

var FieldMetadata = require('../models/field_metadata');
var User = require('../models/user');

const config = require('../app.json');

var connectionString = process.env.MONGODB_CONNECTION_STRING || config.env.MONGODB_CONNECTION_STRING.value; 

mongoose.connect(connectionString);

// CONNECTION EVENTS
 // When successfully connected
mongoose.connection.on('connected', function () {  
            console.log('Mongoose default connection open to ' + connectionString);
}); 

// If the connection throws an error
mongoose.connection.on('error',function (err) {  
            console.log('Mongoose default connection error: ' + err);
}); 

// When the connection is disconnected
mongoose.connection.on('disconnected', function () {  
console.log('Mongoose default connection disconnected'); 
});

// If the Node process ends, close the Mongoose connection 
process.on('SIGINT', function() {  
                mongoose.connection.close(function () { 
                    console.log('Mongoose default connection disconnected through app termination'); 
                    process.exit(0); 
                }); 
}); 


module.exports = {

    saveAllFieldMetadata: function(items, callback){
           FieldMetadata.insertMany(items)
                .then(function(docs) {           
                    callback();
                })
                .catch(function(err) {
                    console.log(err);
                });
    },

    getFieldMetadataAll: function(){
        return FieldMetadata.find({});
    },

    getFatcs: function(){
        return FieldMetadata.find({db_terms: 'Fact'});
    },

    getFieldByName: function(name){
        return FieldMetadata.find({field_name: name});
    },

    FindUser: function(username, password) {
        return User.findOne({ username: username, password: password })
    },

    GetAllUsers: function () {
        return User.find({})
    },

    CreateUser: function(username, password) {
        var user = new User({ username: username, password: password});
        user.save()
    }
}