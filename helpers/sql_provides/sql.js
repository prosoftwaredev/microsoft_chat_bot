var _ = require('lodash');
const helper = require("./../")
const SQLColumn = require("./sql_column")
const SQLNormColumn = require("./sql_norm_column")

module.exports = class SQL {

    constructor(from, prefix = null){
        this.distinct = false;; 
        this.select = []; 
        this.from = from;
        this.where = [];
        this.groupby = [];
        this.having = [];
        this.sort = [];
        this.limit = null;
        this.prefix = prefix;

    }     

    clone(){
        return SQL.create(JSON.parse(JSON.stringify(this)), true);
    }

    static create(obj, force = false){
        if(!force && obj instanceof SQL) {   
            return obj;
        }
        var field = new SQL();
        for (var prop in obj) {
            if (field.hasOwnProperty(prop)) {
                if( Object.prototype.toString.call( obj[prop] ) === '[object Array]' ) { 

    
                        field[prop] = _.map(obj[prop], function(item){
                            if (helper.isDefined(item.column_norm)){
                                return SQLNormColumn.create(item)
                            }else{
                                return SQLColumn.create(item)
                            }
                            
                        })      



                }else{      
                    if (prop == 'from')  {
                        if (typeof obj[prop] !== 'string'){
                            field[prop] = SQL.create(obj[prop]);
                            continue;
                        }
                    }
                    field[prop] = obj[prop];
                         
                }          
            }
        }
        return field;
    } 

    addColumnToSelect(column1)   {    

       this.removeColumnFromSelect(column1);
       var column = column1.clone();

       column.operator = null;
       column.val = null;
       column.sort = null;
       this.select.push(column);  
    }

    addColumnToWhere(column1)   {   
       var column = column1.clone();
       column.sort = null;  
       column.nameAS = null;
       this.where.push(column);  
    }

    addColumnToGroupBy(column1)   {      

       this.removeColumnFromGroupBy(column1);
       var column = column1.clone();
        column.func = null;
       column.operator = null;
       column.val = null;
       column.sort = null;
       column.nameAS = null;
       this.groupby.push(column);  
    }

    addColumnToHaving(column1)   {  
       var column = column1.clone();
       column.sort = null;
       column.nameAS = null;
       this.having.push(column);  
    }

    addColumnToSort(column1)   {      
       this.removeColumnFromSort(column1);
       var column = column1.clone();
       column.operator = null;
       column.value = null;
       column.nameAS = null;
       this.sort.push(column);  
    }

    removeColumnFromSelect(column)   {      
       this._removeColumnIfExist(column, this.select);
    }

    removeColumnFromWhere(column)   {      
       this._removeColumnIfExist(column, this.where);
    }

    removeColumnFromGroupBy(column)   {      
       this._removeColumnIfExist(column, this.groupby);
    }

    removeColumnFromHaving(column)   {      
       this._removeColumnIfExist(column, this.having);
    }

    removeColumnFromSort(column)   {      
       this._removeColumnIfExist(column, this.sort);
    }

    removeColumn(column){
        this._removeColumnIfExist(column, this.select);  
        this._removeColumnIfExist(column, this.where);  
        this._removeColumnIfExist(column, this.having);  
        this._removeColumnIfExist(column, this.groupby);  
        this._removeColumnIfExist(column, this.sort);  
    }

    getAllColumn(){
        return _.concat(this.select, this.where, this.having, this.groupby, this.sort);
    }

    getAllFactsColumns(){
        var columns = this.getAllColumn();
        var facts = _.filter(columns, function(column) { return column.isFact()});
        return this._distinctArray(facts);
    }

    getAllAggregationColumns(){
        var columns = this.getAllColumn();
        var facts = _.filter(columns, function(column) { return column.isAggregation()});
        return this._distinctArray(facts);
    }

    getPrimaryFact(){
        return _.first(this.getAllFactsColumns());
    }

    getPrimaryDimensionColumn(){
        return _.first(this.getAllDimensionsColumns());
    }

    getColumnsByName(name){
        var columns = this.getAllColumn();
        return _.filter(columns, function(column) { return column.name == name});
    }

    isExistColumnByName(name){
        var columns = this.getColumnsByName(name);
        return columns.length > 0;
    }

    getAllDimensionsColumns(level = null){
        var columns = this.getAllColumn();
        var dimensions = level == null ? _.filter(columns, function(column) { return column.isDimension()}):
        _.filter(columns, function(column) { return column.isDimension() && column.dimenstion_level == level});
        return this._distinctArray(dimensions);
    }

    SetFunctionForAllFacts(name, func){
        var columns = this.getAllColumn();
        var facts = _.filter(columns, function(column) { return column.isFact()});
        _.each(facts, function(column){ column.fact = func; });
    }

    isExistColumnRangeByName(name){

        var columns = _.filter(this.where, function(column) { return column.name == name});
        if (columns.length > 0){
            if (columns.length == 1){
                return columns[0].operator != "=";
            }
            return true;
        }
        return false;
    }

    toString(){

        var prefixDot = "";

        if (helper.isDefined(this.prefix)){
            prefixDot = this.prefix + ".";
        }


        var columnString = prefixDot+"*";
        if (this.select.length > 0){
            var filteredSelect = _.sortBy(this.select, [function(c) { return c.isAggregation() ? 1: 0; }]);
            columnString = _.map(filteredSelect, function(c){return c.toStringWithPrefix(prefixDot);}.bind(this)).join(',');

        }

        var whereString = "";
        if (this.where.length > 0){
            whereString = _.map(this.where, function(c){return c.toStringWithPrefix(prefixDot);}.bind(this)).join(' AND ');
        }

        var groupbyString = "";
        if (this.groupby.length > 0){
            groupbyString = _.map(this.groupby, function(c){return c.toStringWithPrefix(prefixDot);}.bind(this)).join(',');
        }

        var havingString = "";
        if (this.having.length > 0){
            havingString = _.map(this.having, function(c){return c.toStringWithPrefix(prefixDot);}.bind(this)).join(' AND ');
        }

        var orderbyString = "";
        if (this.sort.length > 0){
            orderbyString = _.map(this.sort, function(c){return c.toStringWithPrefix(prefixDot);}.bind(this)).join(',');
        }

        var distinctStr= "";
        if (this.distinct){
            distinctStr = "DISTINCT"
        }

       var distinctStr= "";
        if (this.distinct){
            distinctStr = "DISTINCT"
        }

        var fromStr = this.from;
        if (typeof this.from !== 'string'){

            // var symbols = "abcdefghijklmnopqrstuvwxyz";
            // var newPrefixName = "";
            // for( var i=0; i < 3; i++ ){
            //     newPrefixName += symbols.charAt(Math.floor(Math.random() * symbols.length));  
            // }               

            // var f = this.from.toString();

           fromStr = `(${this.from})`;
        }

        if (helper.isDefined(this.prefix) && this.prefix != ""){
            fromStr = `${fromStr} AS ${this.prefix}`;
        }

        var sql = `SELECT ${distinctStr} ${columnString} FROM ${fromStr}`;
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

        if (helper.isDefined(this.limit)){
           sql+=` LIMIT ${this.limit}`;
        }

        return sql;
    }
    _distinctArray(array){
        return _.unionWith(array, function(column1, column2) { return column1.equal(column2)});
    }

    _removeColumnIfExist(column, array){
       var existColumn = _.find(array, function(o) { return o.equal(column) }); //find coulmn
       if (helper.isDefined(existColumn)) {
            array = _.pull(array, existColumn); //remove
       }   
    }
}