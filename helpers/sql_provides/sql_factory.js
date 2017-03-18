const SQLColumn = require("./sql_column")
const SQLNormColumn = require("./sql_norm_column")
const SQL = require("./sql")
var _ = require('lodash');
const helper = require("./../../helpers")
const config = require('../../app.json');

const dateColumnName = process.env.REDSHIFT_DATE_COLUMN_NAME || config.env.REDSHIFT_DATE_COLUMN_NAME.value; 

module.exports = class SQLFactory {

    constructor(fieldsMetadata){
        this.dateColumnName = dateColumnName;
        this.fieldsMetadata = fieldsMetadata;
    }

    createSQL(table, 
        datePeriodArray, 
        dateArray, 
        WhereCalcMeasures, 
        SelectCalcMeasures, 
        FilterStatements, 
        Filter,
        ColumnsArray, 
        Select){

        var sql = new SQL(table);

 

        _.forEach(Select.filter(function(item0) { return typeof item0 === 'object' }), function(item) {
                var name = null;
                var func = null;
                if (helper.isDefined(item.Columns) ){
                    name = item.Columns.trim();
                }
                if (helper.isDefined(item.CalculatedMeasures) ){
                    name = item.CalculatedMeasures.Columns.trim();
                    func = item.CalculatedMeasures.Functions.trim();
                }                
                if (helper.isDefined(name) ){
                        var sqlColumn =  this.buildSQLColumn(name, func);
                        if (helper.isDefined(sqlColumn)){
                                sql.addColumnToSelect(sqlColumn);
                        }
                }
        }.bind(this));

        // prapare dates (1. Is there a date.period or datetime key:value a. If yes, then it goes in the ‘ Where section within the “SQL Statement”b. If no, then we need to ask)
        var date =  (dateArray.length > 0) ? date = dateArray[0].trim() : null;
        if (date){
                         
                var sqlColumn = this.buildSQLColumn(this.dateColumnName, null , "=", date, null);
                 if (helper.isDefined(sqlColumn)){
                        sql.addColumnToWhere(sqlColumn);
                        //sql.addColumnToSelect(sqlColumn);
                 }
        }

        var dateRange = [];

        if (datePeriodArray.length > 0) {

            dateRange = datePeriodArray[0].split('/');

            if (dateRange.length > 0){

                var sqlColumn = this.buildSQLColumn(this.dateColumnName, null , ">=", dateRange[0], null);
                 if (helper.isDefined(sqlColumn)){
                        sql.addColumnToWhere(sqlColumn);
                        //sql.addColumnToSelect(sqlColumn);
                 }
            }

            if (dateRange.length > 1){
                var sqlColumn = this.buildSQLColumn(this.dateColumnName, null , "<=", dateRange[1], null);
                 if (helper.isDefined(sqlColumn)){
                        sql.addColumnToWhere(sqlColumn);
                        //sql.addColumnToSelect(sqlColumn);
                 }
            }
          
        }    

         _.forEach(FilterStatements, function(filterStatementsItem) {    
            var name = null;
            var operator = null;
            var val = null;

            if ( helper.isDefined(filterStatementsItem.Columns)){
                  
                if ( !helper.isDefined(filterStatementsItem.Functions)){
                    if (helper.isDefined(filterStatementsItem.Operators)){        
                        name = filterStatementsItem.Columns;                    
                        operator = this.convertOperator(filterStatementsItem.Operators);            
                        val = filterStatementsItem.ColumnItems;
                    }
                }
            }
            else if (helper.isDefined(filterStatementsItem.Status) ){
                name= "RUN_STATUS_CODE";
                operator = "=";
                if (filterStatementsItem.Status.toLowerCase()  == "fail"){
                    val = 3;
                }
                if (filterStatementsItem.Status.toLowerCase()  == "succeeded"){
                    val = 1;
                }
            }  

            var sqlColumn = this.buildSQLColumn(name, null , operator, val, null);
            if (helper.isDefined(sqlColumn)){
                    sql.addColumnToWhere(sqlColumn);
            }

        }.bind(this));   

         _.forEach(WhereCalcMeasures, function(item) {    
                var FilterStatementsItems = FilterStatements.filter(function(filtered) {
                
                    if (!helper.isDefined(filtered.CalculatedMeasures)){
                            return false;
                    }
                    return filtered.CalculatedMeasures.Columns == item.Columns && filtered.CalculatedMeasures.Functions == item.Functions;
                    
                }, this);

                if (FilterStatementsItems.length > 0){
                    var filterStatementsItem = FilterStatementsItems[0];

                    var name = filterStatementsItem.CalculatedMeasures.Columns;
                    var func = filterStatementsItem.CalculatedMeasures.Functions;    
                    var operator = this.convertOperator(filterStatementsItem.Operators);
                    var val = filterStatementsItem.number;
                    var sqlColumn = this.buildSQLColumn(name, func , operator, val, null);
                    if (helper.isDefined(sqlColumn)){
                        sql.addColumnToHaving(sqlColumn);           
                        sql.addColumnToSelect(sqlColumn);
                    }
                }    
        }.bind(this)); 

         _.forEach(FilterStatements.filter(function(item) { return typeof item === 'object' && helper.isDefined(item.KeyWords) },this), function(item) {   
                    var name = null;
                    var func = null;
                    var sort = item.KeyWords.toUpperCase().trim();
                    if (sort != 'ASC' && sort != 'DESC'){
                        return;
                    }

                    if (helper.isDefined(item.Columns) ){
                        name = item.Columns.trim();
                    }
                    if (helper.isDefined(item.CalculatedMeasures) ){
                        name = item.CalculatedMeasures.Columns.trim();
                        func = item.CalculatedMeasures.Functions.trim();
                    }  

                    if (helper.isDefined(name) ){
                            var sqlColumn =  this.buildSQLColumn(name, func , null, null, sort);
                            if (helper.isDefined(sqlColumn)){
                                sql.addColumnToSort(sqlColumn);                                
                                sql.addColumnToSelect(sqlColumn);
                        }
                    }

               }.bind(this)); 

    // _.forEach(Select.filter(function(item) { return typeof item === 'object' && helper.isDefined(item.Columns) && !helper.isDefined(item.Functions) },this), function(item) {   
    //                 var name = null;
    //                 var func = null;
    //                 if (helper.isDefined(item.Columns) ){
    //                     name = item.Columns.trim();
    //                 }
    //                 if (helper.isDefined(item.CalculatedMeasures) ){
    //                     name = item.CalculatedMeasures.Columns.trim();
    //                     func = item.CalculatedMeasures.Functions.trim();
    //                 }  

    //                 if (helper.isDefined(name) ){
    //                         var sqlColumn =  this.buildSQLColumn(name, func , null, null, null);
    //                         if (helper.isDefined(sqlColumn)){
    //                             sql.addColumnToGroupBy(sqlColumn);
    //                     }
    //                 }

    //            }.bind(this)); 

        if (sql.having.length > 0 && sql.groupby.length == 0){
            var primary = sql.getPrimaryDimensionColumn();
            if (helper.isDefined(primary)){
                sql.addColumnToGroupBy(primary);
            }
        }

        var limit = Select.filter(function(item) { return typeof item === 'object' && helper.isDefined(item.number) },this)
                            .map(function(item) {
                                        return item.number;
                             },this);

        if (limit.length > 0){
                limit = limit[0];   
                sql.limit = limit;
         }

        if (sql.isExistColumnByName("RUN_STATUS_CODE")){ // run for status code
            var primary = sql.getPrimaryDimensionColumn();
            if (helper.isDefined(primary)){
                if (primary.dimenstion_level != 1){
                    sql.distinct = true;
                }           
            }
        }   

        return sql;
    }

    buildSQLColumn(name, func= null, operator= null, value= null, sort = null ){

        var column = this.createEmptyColumn(name); 

        if (helper.isDefined(column)){
            column.func = func;
            column.operator = operator;
            column.value = value;
            column.sort = sort;
         }

        return column;

    }

    createEmptyColumn(name){
        var metadata = _.find(this.fieldsMetadata, function(o) { return o.field_name == name }); //find coulmn

        if (helper.isDefined(metadata)){

                   return new SQLColumn(name, metadata.db_terms, null ,null, null, null, 
                                                    metadata.description, 
                                                    metadata.dimension_name, 
                                                    metadata.hierarchy_level, 
                                                    metadata.data_type, 
                                                    metadata.is_hierarchy == 'Yes' , 
                                                    metadata.can_normalize  == 'Yes', 
                                                    metadata.calculation_type.split(',') );
             }

        return null;
    }

  convertOperator(operatorStr){

        if (!helper.isDefined(operatorStr)){
            return null;
        }         

        var operator = null;

        operatorStr = operatorStr.trim();

         switch (operatorStr) {
            case "equal":
            case "equals":
            case "equal to":
                operator = "=";
                break;
            case "not equal to":
                operator = "<>";
                break;
            case "greater than":
            case "greater":
                operator = ">";
                break;
            case "greater than or equal to":
                operator = ">=";
                break;
            case "less":
            case "less than":
                operator = "<";
                break;
            case "less than or equal to":
                operator = "<=";
                break;
        }

        return operator;
    }


    normSQL(existSQL, params){

        var thirdTable = existSQL.clone();
        thirdTable.prefix = 'c';
        var fact1 = thirdTable.getPrimaryFact();
        fact1.nameAS =  fact1.name;   

        console.log(existSQL);

        var fact = thirdTable.getPrimaryFact().clone();  
        fact.nameAS =  fact.name;    

        var whereFacts = _.filter(_.concat(thirdTable.where, thirdTable.having), function(c){return c.isFact()});
        _.forEach(whereFacts, function(c){ 
             if (c.name == fact.name){
                 fact.operator = c.operator;
                 fact.value = c.value;
             }
            thirdTable.removeColumnFromWhere(c);
        })

        thirdTable.sort = [];
        thirdTable.having = [];

        var secondTable = thirdTable.clone();
        secondTable.prefix = 'b';

        var fact_name = `${fact.name}_per_day`;

        var date = new SQLColumn('MYDATE');
        date.func = "COUNT";
        var fact0 =  fact.clone();
        fact0.operator = null;
        fact0.value = null;

        var columnNorm = new SQLNormColumn(fact_name , fact0, date);        
        secondTable.addColumnToSelect(columnNorm);
        secondTable.from = thirdTable;
        secondTable.where = [];

        var firstTable = new SQL(secondTable, 'a');
        _.forEach(_.filter(existSQL.select, function(c){return !c.isFact()}), function(c){
            firstTable.addColumnToSelect(c);
        })

        console.log(params.group_by_column_date);
        if (params.group_by_column_date == 'MYDATE'){
            var newFact = fact.clone();
            newFact.name = fact_name;
            newFact.nameAS = null;
            newFact.func = null; 
            if (helper.isDefined(newFact.operator) && helper.isDefined(newFact.value)){
                firstTable.addColumnToWhere(newFact.clone());
            }
                

            var newFact2 = fact.clone();
            newFact2.func = null; 
            firstTable.addColumnToSelect(newFact2.clone());
            firstTable.addColumnToSort(newFact2.clone());

            

        }else{
            var newFact = fact.clone();
            newFact.name = fact_name;
            newFact.nameAS = null;
            newFact.func = null; 
            firstTable.addColumnToSelect(newFact.clone());
            firstTable.addColumnToSort(newFact.clone());

            if (helper.isDefined(newFact.operator) && helper.isDefined(newFact.value)){
                firstTable.addColumnToWhere(newFact.clone());
            }

            var newFact2 = fact.clone();
            newFact2.func = null; 
            firstTable.addColumnToSelect(newFact2.clone());

            firstTable.removeColumnFromSelect(new SQLColumn('MYDATE'));
        }




        return firstTable;



        // var newSQL = new SQL(existSQL, 'a');

        // return newSQL;
    }

}