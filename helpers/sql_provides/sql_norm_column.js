const helper = require("./../../helpers")
const SQLColumn = require("./sql_column")

module.exports = class SQLNormColumn {   

    constructor(name, 
                column_target, 
                column_norm){

        this.name = name; 
        this.column_target = column_target; 

        this.column_norm = column_norm; 
    }

    clone(){
        return SQLNormColumn.create(JSON.parse(JSON.stringify(this)), true);
    }

    isAggregation(){
        return true;
    }

    static create(obj, force = false){        
         if(!force && obj instanceof SQLNormColumn) {   
            return obj;
        }
        var field = new SQLNormColumn();
        for (var prop in obj) {
            if (field.hasOwnProperty(prop)) {
                         if (typeof obj[prop] !== 'string'){ 
                                    field[prop] = SQLColumn.create(obj[prop]);
                            }else{
                                field[prop] = obj[prop];
                            }                    
            }
        }
        return field;
    } 

    toString(){
        return this.toStringWithPrefix();
    }

    toStringWithPrefix(prefix = ""){

        this.column_target.nameAS = null;
        this.column_norm.nameAS = null;

        var column_target_str = this.column_target.toStringWithPrefix(prefix);
        var column_norm_str = this.column_norm.toStringWithPrefix(prefix);
        return `CASE
			WHEN ${column_norm_str} is null or ${column_norm_str} <> 0 THEN ${column_target_str} / ${column_norm_str}
			ELSE NULL
			END AS ${this.name}`;
    }

    equal(column){
        if (!helper.isDefined(column)){
            return false;
        }        
        return (this.name == column.name);          
    }
}