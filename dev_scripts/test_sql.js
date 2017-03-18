'use strict';

const apiai = require('apiai');
const uuid = require('node-uuid');
const botbuilder = require('botbuilder');
const helper = require('./../helpers');
const SQLBuilder = require('./../helpers/sql_builder');
const RedshiftProvider = require('./../helpers/redshift_provider');
var scenario = require('./../dialogs');
const mongoFactory = require('./../helpers/mongo_provider.js');
var SkypeBot = require('./../skypebot');

const SQLFactory = require('./../helpers/sql_provides/sql_factory');


    var apiaiOptions = {
            language: "en",
            requestSource: "skype"
        };

        this._apiaiService = apiai( "72b855a9fb1143d096cb3bf8fd2f7622", apiaiOptions);
// var messageText = "what are the workflows that have a total running time greater than 100 and total error is less than 1 for the last 3 week";
// var messageText = "by session where total running time is greater than 100 for the last 3 weeks";
// var messageText = "by workflow where total running time is greater than 100 and total error is less than 1 and total source rows is less than 5 for the last 9 week";
// var messageText = "show me the total target rows where workflow equals run-stats for yesterday";
//var messageText = "what were the total source rows between may and june of last year where total running time is greater than 100";
//var messageText = "what were the total number of target rows processed for the last nine weeks by day by workflow";
//var messageText = "by session where total running time is greater than 100 for the last 9 weeks";
var messageText = "by workflow where total running time is greater than 100 and total error is less than 1 for the last 9 week";
//var messageText = "show me the top 10 sessions that had the longest running time yesterday";

 let apiaiRequest = this._apiaiService.textRequest(messageText,
                {
                     sessionId: "grgrehery54y54y54",
                    originalRequest: {
                    //    data: session.message,
                        source: "skype"
                    }
                });
let session = {};
session.userData = {};
            apiaiRequest.on('response', (response) => {
                console.log(response.result)

                if (SkypeBot.isDefined(response.result) && response.result.action != "input.unknown") {
                    let responseText = response.result.fulfillment.speech;

                    helper.generateParams(session, response)  // store data for this query in userData
                    let params = session.userData;
                    console.log(params);
                    if (params.date.length > 0 || params.datePeriod.length > 0) {
                        session.isParsedApiAiResponse = true;
                    }

         

                    mongoFactory.getFieldMetadataAll()
                        .then(function (metadata) {
                            helper.fillMetada(session, metadata);
                            var newSqlBuilder = new SQLFactory("MYDATE", metadata);
                            var result = newSqlBuilder.createSQL("mytropical.public.coxrunstats", params.datePeriod,
                                                    params.date,
                                                    params.WhereCalcMeasures,
                                                    params.SelectCalcMeasures,
                                                    params.FilterStatements,
                                                    params.Filter,
                                                    params.Columns,
                                                    params.Select); 

                            var sql = result.toString();    

                            console.log(sql);

                            
                            new RedshiftProvider("redshift://dstiefe:DavidAlex2@steeful.cdjttjnusyyn.us-east-1.redshift.amazonaws.com:5439/mytropical").count(sql, function (count) {              
                                console.log(`Total records = ${count}`);                               
                                return;
                            });                

                          
                        })
                        .catch(function (err) {
                            console.log(err);
                        });

                } else {
                    console.log(sender, 'Received empty result');
                }
            });

            apiaiRequest.on('error', (error) => {
                console.log('Error while call to api.ai', error);
            });

            apiaiRequest.end();