
module.exports = class SQLBuilder {

    constructor(tableName, dateColumnName ){
        this.tableName = tableName; 
        this.dateColumnName = dateColumnName;
    }

    // generate SQL
    generateSQL(datePeriodArray, dateArray, WhereCalcMeasures, SelectCalcMeasures, FilterStatements, Filter, ColumnsArray, Select, Sort = null, Limit = null){
             
        // ***
        // SELECT COLUMNS PART
        // ***
        // prapare columns in select
        var columns = Select.filter(function(item) { return typeof item === 'object' })
                            .map(function(item) {
                                if (this.isDefined(item.Columns) ){
                                        return item.Columns.trim();
                                }
                                if (this.isDefined(item.CalculatedMeasures) ){
                                        return this.prepareCalcMeasure(item); // some fields has function (3. Is there a calculated measure in the ‘ Select’ Object a. If yes, then it should appear in the select section)
                                }
                                return null;
                             },this);


        // sort columns by function()
        // "4. If a ‘ Select’ Object has a column and calculated measure then order the ‘ SQL Select’ section with columns first and then calculated measures"
        columns.sort(function (a, b) {
                var isNotAFunc = (a.indexOf('(') !== -1);
                var isNotBFunc = (b.indexOf('(') !== -1);
                if (isNotAFunc && !isNotBFunc) {
                    return 1;
                }
                if (!isNotAFunc && isNotBFunc) {
                    return -1;
                }           
                return 0;
        });


        // ***
        // WHERE PART
        // ***
        var where = []; 

        // prapare dates (1. Is there a date.period or datetime key:value a. If yes, then it goes in the ‘ Where section within the “SQL Statement”b. If no, then we need to ask)
        var date =  (dateArray.length > 0) ? date = dateArray[0].trim() : null;
        if (date){
            // add date to where clause
            where.push(`${this.dateColumnName} = '${date}'`);
        }

        var dateRange = [];
        if (datePeriodArray.length > 0) {
            dateRange = datePeriodArray[0].split('/');

            var dateString = "";

            if (dateRange.length > 0){
                dateString = `${this.dateColumnName} >= '${dateRange[0]}'`;
            }

            if (dateRange.length > 1){
                dateString += ` and ${this.dateColumnName} <= '${dateRange[1]}'`;
            }

            if (dateString!=""){
                where.push(`(${dateString})`);
            }            
        }    

        // add in where clause. Some fields we need to add in where
        FilterStatements.forEach(function(item, i, arr) {      
            var res =   this.prepareWhere(item);
            if (this.isDefined(res)){
                    where.push(res);   
            }                                   
        }, this);      


        // ***
        // HAVING PART (2. Is there a calculated measure in the ‘ Where’ Object a. If yes, then the calculated measure will have to be in the ‘ HAVING’ section b. We might want to verify that they do not want to see it...and just have it as a filter)
        // ***
        //prepare having
        var having = [];
        WhereCalcMeasures.forEach(function(item, i, arr) {
            var FilterStatementsItem = FilterStatements.filter(function(filtered) {
                
                    if (!this.isDefined(filtered.CalculatedMeasures)){
                            return false;
                    }
                    return filtered.CalculatedMeasures.Columns == item.Columns && filtered.CalculatedMeasures.Functions == item.Functions;
                    
                }, this);

                if (FilterStatementsItem.length > 0){
                    having.push(this.prepareHaving(FilterStatementsItem[0]));
                }                          
        }, this);     


        // ***
        // GROUP BY
        // ***
       // group by 
       var groupby =  Select.filter(function(item) { return typeof item === 'object' && this.isDefined(item.Columns) && !this.isDefined(item.Functions) },this)
                            .map(function(item) {
                                        return item.Columns.trim();
                             },this);

        //  if (this.isDefined(GroupBy)){
        //         groupby = groupby.concat(GroupBy);   
        //  }

        // ***
        // ORDER BY
        // ***
        // order by
        var orderby = FilterStatements.filter(function(item) { return typeof item === 'object' && this.isDefined(item.KeyWords) },this)
                            .map(function(item) {
                                        return item.Columns.trim() + " "+ item.KeyWords;
                             },this);

         if (this.isDefined(Sort)){
                orderby = orderby.concat(Sort);   
         }


        // ***
        // LIMIT
        // ***
        // limit
        var limit = Select.filter(function(item) { return typeof item === 'object' && this.isDefined(item.number) },this)
                            .map(function(item) {
                                        return item.number;
                             },this);
                             
        if (this.isDefined(limit)){
                limit = limit.concat(limit);   
         }

        // ***
        // BUILD SQL STRING
        // ***
        // concat arrays, create SQL string                      
        var sql = this.buildSQLString(this.tableName, columns, where, groupby, having, orderby, limit);
       return sql;
    }

    // Concat arrays and build SQL string
    buildSQLString(tableName, columns, where, groupby, having, orderby, limitArr){

        var columnString = "*";
        columns = Array.from(new Set(columns));
        if (columns.length > 0){
            columnString = columns.join(',');
        }

        var whereString = "";
        if (where.length > 0){
            whereString = where.join(' AND ');
        }

        var groupbyString = "";
        groupby = Array.from(new Set(groupby));
        if (groupby.length > 0){
            groupbyString = groupby.join(',');
        }

        var havingString = "";
        if (having.length > 0){
            havingString = having.join(' AND ');
        }

        var orderbyString = "";
        orderby = Array.from(new Set(orderby));
        if (orderby.length > 0){
            orderbyString = orderby.join(',');
        }

        var limit = null;
        if (limitArr.length > 0){
            //limit = limitArr[0];
            limit = Math.min.apply( Math, limitArr )
        }

        var sql = `SELECT ${columnString} FROM ${tableName}`;
        if (whereString!=""){
            sql+=` WHERE ${whereString}`;
        }


        if (groupbyString!=""){
            sql+=` GROUP BY ${groupbyString}`;
        }

        if (havingString!=""){
            sql+=` HAVING ${havingString}`;
        }


        if (orderbyString!=""){
           sql+=` ORDER BY ${orderbyString}`;
        }

        if (this.isDefined(limit)){
           sql+=` LIMIT ${limit}`;
        }

        return sql;
    }

    // Process where fields
    prepareWhere(filterStatementsItem){

        if ( this.isDefined(filterStatementsItem.Columns)){
                    var column = filterStatementsItem.Columns;                    
                    var operator = this.convertOperator(filterStatementsItem.Operators);
                    
                if ( !this.isDefined(filterStatementsItem.Functions)){

                    if (this.isDefined(operator)){
                        if (this.isDefined(filterStatementsItem.ColumnItems)) {
                            var val = filterStatementsItem.ColumnItems;
                            return `${column} ${operator} '${val}'`;
                        } else {
                            var val = filterStatementsItem.number;                
                            return `${column} ${operator} ${val}`;
                        }
                    }
                }



            }
            else if (this.isDefined(filterStatementsItem.Status) ){
                    return `"RUN_STATUS_CODE" = 3`;
            }

    }

    // Convert operator from string to symbols (>< >= <=)
    convertOperator(operatorStr){

        if (!this.isDefined(operatorStr)){
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

    // Process CalcMeasure fields, which has a function
    prepareCalcMeasure(filterStatementsItem){

        var column = filterStatementsItem.CalculatedMeasures.Columns;
        var func = filterStatementsItem.CalculatedMeasures.Functions;    
        return this.prepareCalcFunction(func, column);
    }

    // Create Calculated Measures Function
    prepareCalcFunction(func, column ){
            return `${func}(${column})`;
    }

    // Process having fields
    prepareHaving(filterStatementsItem){
        var funcWithColumn = this.prepareCalcMeasure(filterStatementsItem);
        var operator = this.convertOperator(filterStatementsItem.Operators);
        var val = filterStatementsItem.number;
        return `${funcWithColumn} ${operator} ${val}`;
    }

    // Get Calculated Measures
    getCalcMeasures(WhereCalcMeasures, SelectCalcMeasures){

         var calcMeasures = [];

        if (this.isDefined(WhereCalcMeasures)){
            calcMeasures = calcMeasures.concat(WhereCalcMeasures.map(function(item) {
                                        return this.prepareCalcFunction(item.Functions, item.Columns);  
                             }, this));  
        } 

        if (this.isDefined(SelectCalcMeasures)){
            calcMeasures = calcMeasures.concat(SelectCalcMeasures.map(function(item) {
                                        return this.prepareCalcFunction(item.Functions, item.Columns);  
                             }, this));  
        }   

        return calcMeasures;
    }

    // Add Limit, Order By to SQL
    addToSQLSortLimit(sql, limit){
        // var sortDirection = 'ASC';
        // if (sortDirectionString == 'bottom'){
        //     sortDirection = 'DESC';
        // }     

        var n = sql.indexOf("LIMIT");
        if (n >= 0){
            sql = sql.substring(0, n);
        }

        return `${sql} LIMIT ${limit}`;

        // else{
        //     return `${sql} ORDER BY ${sortBy} ${sortDirection} LIMIT ${limit}`;
        // }        
    }

    // check on null/underfined
   isDefined(obj) {
        if (typeof obj == 'undefined') {
            return false;
        }

        if (!obj) {
            return false;
        }

        return obj != null;
    }
}