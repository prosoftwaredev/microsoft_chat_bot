'use strict';

const apiai = require('apiai');
const uuid = require('node-uuid');
const botbuilder = require('botbuilder');
const helper = require('./helpers');
const SQLBuilder = require('./helpers/sql_builder');
const RedshiftProvider = require('./helpers/redshift_provider');
var scenario = require('./dialogs');
const mongoFactory = require('./helpers/mongo_provider.js');
var _ = require('lodash');
const SQLFactory = require('./helpers/sql_provides/sql_factory');
var json2csv = require('json2csv');
var s3 = require('s3');
var table = require('text-table');

var fs = require('fs'); // csv file

var client = s3.createClient({
  maxAsyncS3: 20,     // this is the default 
  s3RetryCount: 3,    // this is the default 
  s3RetryDelay: 1000, // this is the default 
  multipartUploadThreshold: 20971520, // this is the default (20 MB) 
  multipartUploadSize: 15728640, // this is the default (15 MB) 
  s3Options: {
    accessKeyId: "AKIAJ7MBOXFDGUVAXIZQ",
    secretAccessKey: "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",
    // any other options are passed to new AWS.S3() 
    // See: http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Config.html#constructor-property 
  },
});


module.exports = class SkypeBot {

    get apiaiService() {
        return this._apiaiService;
    }

    set apiaiService(value) {
        this._apiaiService = value;
    }

    get botConfig() {
        return this._botConfig;
    }

    set botConfig(value) {
        this._botConfig = value;
    }

    get botService() {
        return this._botService;
    }

    set botService(value) {
        this._botService = value;
    }

    get sessionIds() {
        return this._sessionIds;
    }

    set sessionIds(value) {
        this._sessionIds = value;
    }

    constructor(botConfig) {
        this._botConfig = botConfig;
        var apiaiOptions = {
            language: botConfig.apiaiLang,
            requestSource: "skype"
        };

        this._apiaiService = apiai(botConfig.apiaiAccessToken, apiaiOptions);

        this._sessionIds = new Map();

        this.botService = new botbuilder.ChatConnector({
            appId: this.botConfig.skypeAppId,
            appPassword: this.botConfig.skypeAppSecret
        });

        this._bot = new botbuilder.UniversalBot(this.botService);

        this._redshiftProvider = new RedshiftProvider(botConfig.redShiftConnectionString);

        this._sqlBuilder = new SQLBuilder(botConfig.redShiftTableName, botConfig.redShiftDateColumnName);


        /*
            Create array of functions for IDialogWaterfallStep: []
            Steps()
            1 of 7 for getting SQL query, 1.1.b get date if missing
            2 of 7 (1.1.b) binds new date to old message, reruns proceessMessage
            3 of 7 (2.1.a.) get limit for query
            4 of 7 (2.1.b.) get field for sorting in query
            5 of 7 (2.1.c.) get sort direction for sorting in query
            6 of 7 display data
            7 of 7  (4.1.b) Ask to save query

            new dialog:

            this._botdialog('/newDialog', [
                (session) => {
                    session.send()
                }
            ])

            call dialog: 

            session.beginDialog('/newDialog')

        */


        this._bot.on('conversationUpdate', function (message) {
            let addresses = helper.getAdr();
            let found = addresses.filter(x => x.addr !== message.address)
            if (found.length === 0) {
                let newAdr = {
                    "name": message.user.name,
                    "addr": message.address
                }
                helper.saveUserAdr(newAdr)

                console.log(addresses)
                var name = message.user ? message.user.name : null;
                var reply = new botbuilder.Message()
                    .address(message.address)
                    .text("Hello %s. ", name || 'there');
                this.send(reply);
            }
        });


        this._bot.on('contactRelationUpdate', function (message) {
            if (message.action === 'add') {
                var name = message.user ? message.user.name : null;
                var reply = new builder.Message()
                    .address(message.address)
                    .text("Hello %s... Thanks for adding me. Say 'hello' to see more options.", name || 'there');
                this.send(reply);
            } else {
                // delete their data
            }
        });

        this._bot.dialog('/menu', [
            function (session) {
                session.send("How can I help you? Type 'help' to get started.");
                session.beginDialog('/apiai')
            }
        ]).reloadAction('reloadMenu', null, { matches: /^menu|show menu/i });

        this._bot.dialog('/', [
            function (session, results, next) {
                // session.userData.authenticated = null;
                (session.userData.authenticated) ?
                    session.replaceDialog('/menu', session.message.text) :
                    session.beginDialog('/auth')


                setInterval(() => {
                    if (session.userData.authenticated === true) {
                        session.send("You've been logged out for inactivity")
                        session.userData.authenticated = null;
                        session.endDialog();
                        session.replaceDialog('/');
                    }
                }, 1000000)
            }
        ])


        this._bot.dialog('/apiai', [

            // 1) for getting SQL query, 1.1.b get date if missing
            (session, args, next) => {
                if (session.message && session.message.text) {
                    if (session.userData.repeat) {
                        this.processMessage(session, next);
                    } else {
                        helper.clearSessionData(session); //  clear session data
                        this.processMessage(session, next);
                    }
                }
            },

            // 2)  1.1.b get date if missing
            (session, args, next) => {
                if (session.isParsedApiAiResponse) {
                    next();
                } else {

                    if (session.userData.date.length > 0 || session.userData.datePeriod.length > 0) {
                        session.beginDialog('/');
                    } else {
                        session.beginDialog('/date');
                        return;
                    }
                }
            },

            // 2) (1.1.b) binds new date to old message, reruns proceessMessage
            (session, results, next) => {
                if (!session.isParsedApiAiResponse) {
                    this.processMessage(session, next)
                } else {
                    next();
                }
            },

            // do you want to see any other Date information/Columns:
            (session, results, next) => {

                if (!helper.isDefined(session.userData.group_by_column_date)) {
                    session.beginDialog('/group_by_date');
                }
                else {
                    next();
                }
            },

            // If don't have a Fact column from API.AI, ask Fact column from UI
            //If don't have a aggregation function for Fact from API.AI, ask aggregation function for Fact from UI
            (session, results, next) => {

                if (helper.sql(session).isExistColumnByName("RUN_STATUS_CODE")){
                    next();
                    return;
                }

                session.beginDialog('/fact');                    
            },

            
            // do you want me to a) sort by running minutes b) don't sort
            // do you want me to sort from a) largest to smallest or b) smallest to largest
            (session, results, next) => {

                if (helper.sql(session).isExistColumnByName("RUN_STATUS_CODE")){
                    next();
                    return;
                }

                var calMeasures = helper.sql(session).getAllFactsColumns();
                session.beginDialog('/sort_by', calMeasures);


            },

            // execute sql qeury on redshift, get count of rows
            (session, results, next) => {
                this.callSQL(session, next);
            },

            // 3) (2.1.a.) get limit for query
            // ask about limit query (10 rows) from UI? If don't have a limit
            (session, results, next) => {
                if (session.userData.count > 10) {
                    session.beginDialog('/limit');
                } else {
                    session.userData.limit = session.userData.count;
                    next();
                }
            },

            // 6) display data
            (session, results, next) => {
                this.displyData(session, next)
            },

            // 6) export data
            (session, results, next) => {
                this.exportData(session, next)
            },

            (session, results, next) => {
                botbuilder.Prompts.confirm(session, "Does this data match what you were looking for, Yes or No?")
                // apiai
            },
            // 7) (4.1.b) Ask to save query
            (session, results, next) => {
                if (results.response === true) {
                    session.beginDialog('/save_query');
                } else {
                    session.send("Ok, let's start over.")
                    //form for creating session.message
                    //after form start over dialog, insert created session message text
                    session.userData.repeat = true;
                    session.replaceDialog('/apiai', session.userData.prevSess)
                }
            }

        ]);

        this._bot.dialog('/auth', scenario.auth);

        this._bot.dialog('/date', scenario.date);

        this._bot.dialog('/limit', scenario.limit);

        this._bot.dialog('/sort_by', scenario.sort_by);

        this._bot.dialog('/save_query', scenario.save_query);

        this._bot.dialog('/group_by_date', scenario.group_by_date);

        this._bot.dialog('/fact', scenario.fact);
        //(4.2.a) Global command: favorites
        this._bot.dialog('/list_favorites', scenario.list_favorites);
        this._bot.beginDialogAction("list_favorites", '/list_favorites', { matches: /^favorites/i });

        this._bot.dialog('/help', scenario.help);
        this._bot.beginDialogAction("help", '/help', { matches: /^help/i });


    }

    processMessage(session, next) {
        let messageText;
        if (session.userData.repeat) {
            messageText = session.userData.prevSess;
            session.userData.repeat = false;
            helper.clearSessionData(session)
        } else {
            messageText = session.message.text;
        }

        session.userData.prevSess = messageText;

        session.userData.count = null;
        session.userData.limit = null;
        session.userData.sql = null;
        session.userData.sqlString = null;
        session.userData.sortDirection = null;
        session.userData.sortBy = null;

        let sender = session.message.address.conversation.id;

        if (messageText && sender) {

            console.log(sender, messageText);

            if (!this._sessionIds.has(sender)) {
                this._sessionIds.set(sender, uuid.v1());
            }

            let apiaiRequest = this._apiaiService.textRequest(messageText,
                {
                    sessionId: this._sessionIds.get(sender),
                    originalRequest: {
                        data: session.message,
                        source: "skype"
                    }
                });

            apiaiRequest.on('response', (response) => {
                console.log(response.result)

                if (this._botConfig.devConfig) {
                    console.log(sender, "Received api.ai response");
                }

                if (SkypeBot.isDefined(response.result) && response.result.action != "input.unknown") {
                    let responseText = response.result.fulfillment.speech;

                    helper.generateParams(session, response)  // store data for this query in userData
                    let params = session.userData;
                    console.log(params);
                    if (params.date.length > 0 || params.datePeriod.length > 0) {
                        session.isParsedApiAiResponse = true;
                    }

                    var $this = this;

                    mongoFactory.getFieldMetadataAll()
                        .then(function (metadata) {
                            helper.fillMetada(session, metadata);

                            var sqlObj = new SQLFactory(metadata).createSQL($this._botConfig.redShiftTableName, params.datePeriod,
                                                    params.date,
                                                    params.WhereCalcMeasures,
                                                    params.SelectCalcMeasures,
                                                    params.FilterStatements,
                                                    params.Filter,
                                                    params.Columns,
                                                    params.Select);

                            session.userData.sql = sqlObj; 

                            next();
                        })
                        .catch(function (err) {
                            console.log(err);
                        });

                } else {
                    console.log(sender, 'Received empty result');
                }
            });

            apiaiRequest.on('error', (error) => {
                console.error(sender, 'Error while call to api.ai', error);
            });

            apiaiRequest.end();
        } else {
            console.log('Empty message');
        }
    }

    displyData(session, next) {
        if (session.userData.limit > 0) {
            var sql = session.userData.sqlString;
            var limit = session.userData.limit;
            var oldlimit = helper.sql(session).limit;

            helper.sql(session).limit = helper.isDefined(oldlimit) && limit > oldlimit ? oldlimit: limit;

            var rSql =  helper.sql(session).toString();

            helper.sql(session).limit = oldlimit;

  
            console.log(rSql);
            this._redshiftProvider.select(rSql, function (rows) {
                var tableArray = [];
                tableArray.push(Object.keys(rows[0]));
                _.each(rows, function(r){ tableArray.push(_.values(r)); });
                var t = table(tableArray, {hsep: " | "});
                //console.log(t);
                t = t.toString().replace(/\n/g, "\n\n");
                //console.log(t);
                
                session.userData.prevData = t;
                session.send(t);
                next();
                return;
            });
        } else {
            if (session.userData.count == 0) {
                session.send(`Total records = 0`);
            } else {
                session.send(`Total records = ${session.userData.count}`);
            }
            next();
        }
    }

    exportData(session, next){

            if (session.userData.count > 0) {
                var rSql =  helper.sql(session).toString();


            this._redshiftProvider.select(rSql, function (rows) {

                            var myData = rows;
                            var fields = Object.keys(rows[0]);

                            //console.log();

                            console.log('csv');
                            try {
                                var csv = json2csv({ data: myData, fields: fields });
                                //console.log(csv);

                                var file_name = Date.now() + '-file.csv';
                                var bucket = 'my_bot';
                                var bucketLocation = "";
                                /*
                                    "" (default) - US Standard
                                    "eu-west-1"
                                    "us-west-1"
                                    "us-west-2"
                                    "ap-southeast-1"
                                    "ap-southeast-2"
                                    "ap-northeast-1"
                                    "sa-east-1"
                                */

                                fs.writeFile(file_name, csv, function(err) {
                                if (err) throw err;
                                    console.log('file saved');

                                    //console.log(fs);
                                

                                    var params = {
                                        localFile: file_name,
                                        
                                        s3Params: {
                                            Bucket: bucket,
                                            Key: file_name,
                                            ACL: 'public-read'
                                            // other options supported by putObject, except Body and ContentLength. 
                                            // See: http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#putObject-property 
                                        },
                                    };

                                    var uploader = client.uploadFile(params);
                                    uploader.on('error', function(err) {
                                        console.error("unable to upload:", err.stack);
                                        fs.unlinkSync(file_name);
                                    });

                                    uploader.on('progress', function() {
                                        console.log("progress", uploader.progressMd5Amount, uploader.progressAmount, uploader.progressTotal);
                                    });
                                    
                                    uploader.on('end', function() {
                                        console.log("done uploading");

                                        var url = s3.getPublicUrl(bucket, file_name, bucketLocation);

                                        console.log(url);
                                        fs.unlinkSync(file_name);
                                        session.send(url);
                                        next();

                                        
                                    });

                                });
                            } catch (err) {
                            // Errors are thrown for bad options, or if the data is empty and no fields are provided. 
                            // Be sure to provide fields if it is possible that your data array will be empty. 
                            console.error(err);
                            }
                    
                    

                                return;
                    });




            }
    }

    callSQL(session, next) {

        let params = session.userData;

        this.prepareSQL(session); // mormalization

        var sql = helper.sql(session).toString(); // build sql statement

        console.log("SQL statement: " + sql);

        session.userData.sqlString = sql;

        session.send(sql);

        this._redshiftProvider.count(sql, function (count) {
            session.userData.count = count;
            session.send(`Total records = ${session.userData.count}`);
            next();
            return;
        });

    }

    prepareSQL(session){

        if (session.userData.calculation_type == "norm"){ // need to normalize SQL
            var sqlFactory = new SQLFactory(session.userData.allFieldsMetadata);
            session.userData.sql = sqlFactory.normSQL(helper.sql(session), session.userData);
        }
    }

    static isDefined(obj) {
        if (typeof obj == 'undefined') {
            return false;
        }

        if (!obj) {
            return false;
        }

        return obj != null;
    }
}