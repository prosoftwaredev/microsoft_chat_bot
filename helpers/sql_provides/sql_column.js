const helper = require("./../../helpers")

module.exports = class SQLColumn {   

    constructor(name, 
                database_term, 
                func = null, 
                operator = null, 
                value = null, 
                sort = null,
                
                alias = null, 
                dimenstion_name = null, 
                dimenstion_level = null, 
                data_type = null, 
                is_hierarchy = false,
                can_normalize = false,
                funcs_possibles = []){

        this.name = name; 
        this.database_term = database_term; 
        this.func = func;
        this.operator = operator;
        this.value = value;
        this.sort = sort;

        this.alias = alias || this.name;         
        this.dimenstion_name = dimenstion_name; 
        this.dimenstion_level = dimenstion_level; 
        this.data_type = data_type; 
        this.is_hierarchy = is_hierarchy; 
        this.can_normalize = can_normalize; 
        this.funcs_possibles = funcs_possibles;
        this.nameAS = null;


    }

    clone(){
        return SQLColumn.create(JSON.parse(JSON.stringify(this)), true);
    }

    static create(obj, force = false){        
         if(!force && obj instanceof SQLColumn) {   
            return obj;
        }
        var field = new SQLColumn();
        for (var prop in obj) {
            if (field.hasOwnProperty(prop)) {
                    field[prop] = obj[prop];
            }
        }
        return field;
    } 

    toString(){
        return this.toStringWithPrefix();
    }

    toStringWithPrefix(tablePrefix = ""){

        var column = (this.isAggregation()) ? `${this.func}(${tablePrefix}${this.name})` : tablePrefix + this.name;

        if (this.isCanWhere() || this.isCanHaving()){           
           return (isNaN(this.value))? `${column} ${this.operator} '${this.value}'`: `${column} ${this.operator} ${this.value}`;
        }

        else if (this.isCanSort()){
            return `${column} ${this.sort}`;
        } 

        if (helper.isDefined(this.nameAS) && this.nameAS!=""){
            return `${column} AS ${this.nameAS}`;
        }


        return column;
    }

    equal(column){
        if (!helper.isDefined(column)){
            return false;
        }        
        return (this.name == column.name);          
    }



    isFact(){
        return this.database_term == "Fact";
    }

    isDimension(){
        return this.database_term == "Dimension";
    }

    isAggregation(){
        return helper.isDefined(this.func);
    }

    isCanSelect(){
        return !this.isWhere() && !this.isHaving() && !this.isSort();
    }

    isCanWhere(){
        return this.isCanHaving() && !this.isAggregation() ;
    }


    isCanGroupBy(){
        return this.isCanSelect() ;
    }

    isCanHaving(){
        return helper.isDefined(this.operator) && helper.isDefined(this.value) ;
    }

    isCanSort(){
        return helper.isDefined(this.sort) ;
    }

}