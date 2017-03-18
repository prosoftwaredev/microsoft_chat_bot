const botbuilder = require('botbuilder');
const Moment = require('moment');
const MomentRange = require('moment-range');
const moment = MomentRange.extendMoment(Moment);
var _ = require('lodash');
const SQLColumn = require("./../helpers/sql_provides/sql_column")
const SQLFactory = require('./../helpers/sql_provides/sql_factory');
const helper = require("./../helpers")
const SQL = require('./../helpers/sql_provides/sql');

getStartDates = function(userData){
                    var start_dates = [];

                    if (userData.date.length > 0){
                        // is it date
                        //start_date.push("minute");
                        start_dates.push("add hour");
                    }else {
                        // is it date range

                        var rangeDate = userData.datePeriod[0].split('/');

                        var start = moment(rangeDate[0]);

                        var end = moment(rangeDate[1]);

                        const dr = moment.range(start, end);

                        if (dr.diff('days') > 0){
                            start_dates.push("add day");
                        }

                        if (dr.diff('weeks') > 0){
                            start_dates.push("add week");
                        }

                        if (dr.diff('months') > 0){
                            start_dates.push("add month");
                        }

                        if (dr.diff('years') > 0){
                            start_dates.push("add year");
                        }

                    }
                    return start_dates;
}

getColumnName = function(date){
    var column = "";                 
    switch(date){
                    case "add year": 
                        return  "YR";                            
                      break;
                    case "add month":
                        return "MNTH";    
                        break;
                    case "add day": 
                        return "MYDATE";   
                        break;
                    case "add hour": 
                        return "END_HR";   
                        break;
                    case "add week": 
                        //return" WEEK_OF_YEAR";  
                        return "MYWEEK";  
                       break;
    }     
    return  args;    
}

getColumnsDics = function(dates){
    var aggs = {};
     dates.forEach(function(date, i, arr) {
           aggs[date] = {column: getColumnName(date)};                             
        });
    return aggs; 
}

isNeedToGroupBy = function(session){
    return !(helper.sql(session).isExistColumnByName("RUN_STATUS_CODE") && helper.sql(session).getAllAggregationColumns().length == 0);
}

const group_by_date = [
                function (session) {                   
                    var args = getColumnsDics(getStartDates(session.userData));

                    args["no"] = {
                        column: ""
                    };  

                    // _.forEach(helper.sql(session).getAllDimensionsColumns(1), function(column) {
                    //      args["for each instance "+ column.alias] = {column: column.name, for_each: true, columnObj:column }
                    // });

                    var argsKeys = Object.keys(args);

                    var argsString = argsKeys.join(', ');    

                    session.userData.group_by_date_args = args;

                    var options = {
                            listStyle: botbuilder.ListStyle.button
                    };

                    botbuilder.Prompts.choice(session, `Do you want to see any other Date information/Columns?`, args, options);
                },
                function (session, results) {

                    session.userData.group_by_column_date = null;

                    if (results.response) {

                            var item = session.userData.group_by_date_args[results.response.entity];

                            session.userData.group_by_column_date = item.column;   

                            var isGroupBy = isNeedToGroupBy(session);  

                            if (item.for_each){
                                    session.userData.group_by_each_entire = true;
                                    // dont group
                                   
                            } else  {

                                    if (isGroupBy){
                                        var primaryDimColumn = helper.sql(session).getPrimaryDimensionColumn();
                                        if (helper.isDefined(primaryDimColumn)){
                                             helper.sql(session).addColumnToGroupBy(primaryDimColumn);
                                        }
                                    }


                                    if (item.column == ""){ // no
                                            session.userData.group_by_entire_period = true;
                                          
                                            //group by dimestion                                          
                                    } else {
                                        //group by dimestion, date                                       
                                        var column = new SQLFactory(session.userData.allFieldsMetadata).createEmptyColumn(item.column);
                                         if (isGroupBy){
                                             helper.sql(session).addColumnToGroupBy(column);
                                         }
                                        helper.sql(session).addColumnToSelect(column);
                                    }
                            }
                            
                            
                        session.userData.group_by_date_args = null;
                        session.message.text = session.userData.prevSess;
                        session.endDialog();
                    }
                }
            ]

module.exports = group_by_date
