var addresses = [];
const mongoFactory = require('./mongo_provider.js');


const helpers = {
    ScanObj: function (obj, query, bounds) {

        // I need to use array, because some properties has multiple values (like Columns,...)
        var result = [];

        for (var key in obj) {

            if (obj.hasOwnProperty(key)) {

                var res = null;
                var value = obj[key];

                if (typeof value === 'object') {
                    if (bounds) {
                        if (key === bounds) {
                            res = helpers.ScanObj(value, query, null);
                        }
                    } else {
                        res = helpers.ScanObj(value, query);
                    }
                }

                if (key === query && value) {
                    console.log('property= ' + key + ' value= ' + value);
                    res = value;
                }

                if (res) {
                    if (Object.prototype.toString.call(res) === '[object Array]') {
                        result = result.concat(res);
                    } else {
                        result.push(res);
                    }
                }

            }
        }
        return result;
    },

    generateParams: function (session, response) {
        let params = response.result.parameters;
        session.userData.intentName = response.result.metadata.intentName;
        session.userData.datePeriod = helpers.ScanObj(params, 'date-period');
        session.userData.date = helpers.ScanObj(params, 'date');
        session.userData.WhereCalcMeasures = helpers.ScanObj(params, 'CalculatedMeasures', 'Where');
        session.userData.SelectCalcMeasures = helpers.ScanObj(params, 'CalculatedMeasures', 'Select');
        session.userData.FilterStatements = helpers.ScanObj(params, 'FilterStatements');
        session.userData.Filter = helpers.ScanObj(params, 'Filter');
        session.userData.Columns = helpers.ScanObj(params, 'Columns');
        session.userData.Select = helpers.ScanObj(params, 'Select');
        session.userData.Functions = helpers.ScanObj(params, 'Functions');
    },

    clearSessionData: function (session) {
        session.userData.group_by_column_date = null;
        session.userData.count = null;
        session.userData.limit = null;
        session.userData.sql = null;
        session.userData.sortDirection = null;
        session.userData.sortBy = null;
        session.isParsedApiAiResponse = null;
        session.userData.intersectFactColumns = null;
        session.userData.fact_func = null;
        session.userData.fact = null;
        session.userData.fact_show = null;
        session.userData.group_by_each_entire = null;
        session.userData.group_by_entire_period = null;
        session.userData.sql = null;
        session.userData.sqlString= null;
        session.userData.calculation_type = null;
    },

    saveUserAdr: function (addr) {
        addresses.push(addr)
    },

    getAdr: function () {
        return addresses;
    },

    // test functional sql, possibly overcomplex for our task
    query: function () {
        var self = {};

        var tables = [];
        var selector = null;

        var whereClauses = [];
        var havingClauses = [];

        var order = [];
        var group = [];

        var selectorAll = function (row) {
            return row;
        };

        self.select = function (e) {
            if (selector != null) throw new Error('Duplicate SELECT');
            selector = e || false;
            return self;
        };

        self.from = function () {
            if (tables.length > 0) throw new Error('Duplicate FROM');
            tables = Array.from(arguments);
            return self;
        };

        self.where = function () {
            whereClauses.push(Array.from(arguments));
            return self;
        };

        self.having = function () {
            havingClauses.push(Array.from(arguments));
            return self;
        };

        self.orderBy = function () {
            if (order.length > 0) throw new Error('Duplicate ORDERBY');
            order = Array.from(arguments);
            return self;
        };

        self.groupBy = function () {
            if (group.length > 0) throw new Error('Duplicate GROUPBY');
            group = Array.from(arguments);
            return self;
        };

        self.execute = function () {
            var tmpdata = [];
            var gdata = [];

            var data = [];
            var t = 0;

            // JOIN

            if (tables.length > 1) {

                tables.forEach(function () {
                    data.push([]);
                });

                tables[0].forEach(function (row, i) {
                    for (t = 0; t < tables.length; t++) {
                        data[t].push(tables[t][i]);
                    }
                });

                tmpdata = [];
                (function traverseTable(D, t) {
                    if (D.length === 0) {
                        tmpdata.push(t.slice(0));
                    } else {
                        for (var i = 0; i < D[0].length; i++) {
                            t.push(D[0][i]);
                            traverseTable(D.slice(1), t);
                            t.splice(-1, 1);
                        }
                    }
                })(data, []);

                data = [];
                tmpdata.forEach(function (row, i) {
                    if (whereClauses.every(function (orWhereClauses) {
                        return orWhereClauses.some(function (whereClause) {
                            return whereClause(row);
                        });
                    })) {
                        data.push(row);
                    }
                });

            } else if (tables.length === 1) {

                tables[0].forEach(function (row, i) {
                    if (whereClauses.every(function (orWhereClauses) {
                        return orWhereClauses.some(function (whereClause) {
                            return whereClause(row);
                        });
                    })) {
                        data.push(row);
                    }
                });

            } else {
                data = [];
            }

            // Group

            if (group.length > 0) {

                var T = {};

                data.forEach(function (row) {
                    var t = T;
                    group.forEach(function (groupCallback) {
                        var k = groupCallback(row);
                        t[k] = t[k] || {}; t = t[k];
                    });
                    t._data = t._data || []; t._data.push(row);
                });

                (function traverse(node, R) {
                    if (node._data != null) {
                        node._data.forEach(function (e) { R.push(e); });
                    } else {
                        for (var k in node) {
                            k = /\d+/.test(k) ? Number(k) : k;
                            var row = [k, []];
                            traverse(node[k], row[1]);
                            R.push(row);
                        }
                    }
                })(T, gdata);

                gdata.forEach(function (grow) {
                    if (havingClauses.every(function (orHavingClauses) {
                        return orHavingClauses.some(function (havingClause) {
                            return havingClause(grow);
                        });
                    })) {
                        tmpdata.push(grow);
                    }
                });
                data = tmpdata;

            }

            order.forEach(function (orderCallback) {
                data = data.sort(orderCallback);
            });

            return data.map(selector || selectorAll);
        };

        return self;
    },

    fillMetada: function (session, meatadatas) {
        var columns  = session.userData.Columns;
        session.userData.ColumnsMetadata = [];

        var meatadataObjs = meatadatas.map(function(item) {return item.toObject();});

        session.userData.allFieldsMetadata = meatadataObjs;

        columns.forEach(function(column, i, arr) {

            var metadata = meatadataObjs.filter(function(item) { return item.field_name == column.trim() });
            if (metadata.length > 0){
                session.userData.ColumnsMetadata[column] = metadata[0];
            }
                             
        });

    },

    sql: function (session){
        var SQL = require('./sql_provides/sql');
        session.userData.sql = SQL.create(session.userData.sql);
        return session.userData.sql;
    },

    isDefined: function(obj) {
        if (typeof obj == 'undefined') {
            return false;
        }

        if (!obj) {
            return false;
        }

        return obj != null;
    }
}

module.exports = helpers;