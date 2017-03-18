var pg = require('pg');

module.exports = class RedshiftProvider {

 constructor(connectionString ){
        this.connectionString = connectionString; 
    }

    // Execute COUNT query, fetch count rows from DB
    count(sql, callback){
        var client = new pg.Client(this.connectionString);
        client.connect();
        client.query(`SELECT COUNT(*) FROM (${sql})`)
            .then(res => 
                callback(res.rows[0].count)
            )
            .then(() => client.end());
    }

    // Execute SELECT query, fetch rows from DB
    select(sql, callback){

        var client = new pg.Client(this.connectionString);
        client.connect();
        client.query(sql)
            .then(
                res => callback(res.rows)
                )
            .then(() => client.end());
    }

}