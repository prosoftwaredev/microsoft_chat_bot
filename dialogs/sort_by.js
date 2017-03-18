const botbuilder = require('botbuilder');
const helper = require("./../helpers")
var _ = require('lodash');

const sort_by = [
                function (session, facts, next) {

                    var existSortFact = _.find(helper.sql(session).sort, function(c){return c.isFact()});

                    if (!helper.isDefined(existSortFact)){
                        var args ={};
                        _.forEach(facts, function(item) {args[item.alias]= {column: item.name};})
                        args["don't sort"] = {column: ''}
                        session.userData.sort_by_args = args;                         

                        var options = {
                                    listStyle: botbuilder.ListStyle.button
                        };
                        botbuilder.Prompts.choice(session, `Would you like me to sort the data based on `, args, options);        
                    }else{
                        next();
                    }


   
                },
                function (session, results,next) {
                    if (results.response) {
                        var item = session.userData.sort_by_args[results.response.entity];
                        if (item.column != ''){
                            session.userData.sortBy  = item.column;
                        }else{
                              session.userData.sortBy  = null;
                        }
                    }   
                    session.userData.sort_by_args = null;  
                    next();              
                },

            // 5) (2.1.c.) get sort direction for sorting in query
            // ask about sorting direction by facts from UI, if don't have a sorting direction
            (session, results, next) => {
                if (helper.isDefined(session.userData.sortBy)) {
                    var options = {
                        listStyle: botbuilder.ListStyle.button
                    };
                        botbuilder.Prompts.choice(session, `Do you want me to sort from  `, "largest to smallest|smallest to largest", options);
                } else {
                    next();
                }
            },

            function (session, results) {
                    if (results.response) {

                        session.userData.sortDirection  = results.response;
                        var fact = helper.sql(session).getColumnsByName(session.userData.sortBy);
                        var order = fact[0].clone();
                        order.sort = results.response == "largest to smallest "? "ASC": "DESC";
                        order.operator = null;
                        order.value = null;
                        helper.sql(session).addColumnToSort(order);                     
                    }    
                    session.endDialog();             
                }

            ]
module.exports = sort_by
