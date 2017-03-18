const botbuilder = require('botbuilder');
var _ = require('lodash');
const helper = require("./../helpers")
const SQLFactory = require('./../helpers/sql_provides/sql_factory');


get = function(session){

    var dimension = helper.sql(session).getPrimaryDimensionColumn();
    var params = session.userData;
    return  (dimension.dimenstion_level > 1);
}

isMustAggregate = function(session){

    var dimension = helper.sql(session).getPrimaryDimensionColumn();
    var params = session.userData;
    return  (dimension.dimenstion_level > 1);
}

const fact = [

                // check if facts exist and create if need
                function (session, results, next) {
                    var params = session.userData;
                    var facts = helper.sql(session).getAllFactsColumns();

                    if (facts.length == 0 && !helper.isDefined(params.fact)) {

                            var facts = params.allFieldsMetadata.filter(function(item) { return item.db_terms =='Fact'});
                            var args ={};
                            _.forEach(facts, function(item) {args[item.description]= {column: item.field_name};})
                            params.fact_args = args;    
                            var options = {
                                listStyle: botbuilder.ListStyle.button
                            };
                            botbuilder.Prompts.choice(session, `I didn't find any facts. Please select a fact from the list `, args, options);
                    } else{   
                        if (facts.length > 0){
                            session.userData.fact = helper.sql(session).getPrimaryFact().name;    
                        }    
                        next();
                    }               
                },
                function (session, results, next) {
                    if (results.response) {
                        var item = session.userData.fact_args[results.response.entity];                          
                        session.userData.fact  = item.column;

                        var column = new SQLFactory(session.userData.allFieldsMetadata).createEmptyColumn(session.userData.fact);
                        helper.sql(session).addColumnToSelect(column);     
                    }   
                    session.userData.fact_args = null;        
                    next(); 
                },
                
                // ask about type of calculation
                function (session, results, next) {
                    var params = session.userData;
                    var facts = helper.sql(session).getAllFactsColumns();

                    if (session.userData.group_by_column_date == "MYDATE" && helper.sql(session).isExistColumnRangeByName("MYDATE")){
                          next({ response: {entity : "normalize"} });
                          return;
                    }

                    if (facts.length > 0 &&  !helper.isDefined(params.calculation_type)) {
                            var args = [];
                            
                            args.push("aggregate");
                             
                            args.push("normalize");

                            if (!isMustAggregate(session)) //dont normalize
                            {                                
                                args.push("don't aggregate");
                            }

                            var options = {
                                listStyle: botbuilder.ListStyle.button
                            };

                            var factAlias = _.map(facts, function(item) {return item.alias;});
                            var factAliasStr = factAlias.join(', '); 


                            botbuilder.Prompts.choice(session, `When calculating the "${factAliasStr}" do you want me to `, args, options);
                    }else{
                        next();
                    }               
                },
                function (session, results, next) {

                    if (results.response){   

                        session.userData.calculation_type = null;

                        if (results.response.entity == "normalize"){
                             session.userData.calculation_type = "norm";
                        }
                        if (results.response.entity == "aggregate"){
                             session.userData.calculation_type = "agg";
                        }
                        
                    }       
                    next();            
                },

                // check if facts function exist and create if need
                function (session, results, next) {
                        var params = session.userData;

                        if (!helper.isDefined(params.calculation_type)){
                             next();
                             return;
                        } else if (params.calculation_type == "norm"){
                             next({ response: {entity : "SUM"} });
                             return;
                        }

                        if (helper.isDefined(params.group_by_each_entire) && !params.group_by_each_entire){
                             next();
                             return;
                        }
                        
                        var facts = helper.sql(session).getAllFactsColumns();
                        var factsAggregations = _.filter(facts, function (column){ return column.isAggregation()});

                        if (factsAggregations.length == 0 && !helper.isDefined(params.fact_func)) {

                                var fact = helper.sql(session).getColumnsByName(params.fact)[0];
                                var factsFunctions = fact.funcs_possibles;
                                var argsString = factsFunctions.join(', ');
                                var options = {
                                    listStyle: botbuilder.ListStyle.button
                                };         

                                botbuilder.Prompts.choice(session, `I didn't find a function for ${fact.description}. Please select a function from the list (${argsString})?`, factsFunctions, options);
                        } else {
                            next();
                        }            
                },
                function (session, results) {
                    var params = session.userData;
                    if (results.response) {

                           //aggregation
                            params.fact_func  = results.response.entity;   
                            var columns = helper.sql(session).getColumnsByName(params.fact);
                            _.each(columns, function(item){

                                if (item.isCanWhere() && !item.isCanHaving() ) {

                                    item.func = params.fact_func;    
                                    helper.sql(session).addColumnToHaving(item);  
                                    helper.sql(session).removeColumnFromWhere(item);

                                }else{
                                    item.func = params.fact_func;  
                                }

                            });  

                            var column = new SQLFactory(session.userData.allFieldsMetadata).createEmptyColumn("MYDATE"); // add mydate to group
                            helper.sql(session).addColumnToGroupBy(column);




                            //session.userData.fact = null;
                    }   

                    if (!helper.isDefined(params.calculation_type)){ //no aggregation
                            //todo: dimension level = 1
                            var columns = helper.sql(session).getColumnsByName(params.fact);
                            _.each(columns, function(item){

                                if (item.isCanHaving() ) {
                                    item.func = null;    
                                    helper.sql(session).addColumnToWhere(item);  
                                    helper.sql(session).removeColumnFromHaving(item);
                                }else{
                                    item.func = null;  
                                }                                                      
                            });  
                            helper.sql(session).groupby = [];

                    }



                    session.endDialog();                  
                },  

            ]

module.exports = fact