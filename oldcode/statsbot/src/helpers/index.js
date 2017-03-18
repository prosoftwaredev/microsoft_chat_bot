const helpers = {
    checkEntities: function (obj) {
        let res = [];
        for (var Name in obj) {
            if (obj[Name] != null) {
                res.push(obj[Name])
            }
        }
        return res[0];
    },
    Measures: function (obj) {
        let res = [];
        for (var Name in obj) {
            if (obj[Name] != null) {
                res.push(obj[Name])
            }
        }
        return res;
    }
}

module.exports = helpers;