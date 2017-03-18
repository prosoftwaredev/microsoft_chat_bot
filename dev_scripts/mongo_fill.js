var exceltojson = require("xlsx-to-json-lc");



// var mongoProvider = new MongoProvider();
// mongoProvider.getFieldMetadataByName("REPOSIT_NAMEs", function(item){
//                          console.log(item);
//                         });

exceltojson({
    input: "C:\\Users\\Van\\Dropbox\\daniel\\stage 9\\RUN_STATS_SESSION.xlsx",
    output: null,
    sheet: "Sheet2",  
    lowerCaseHeaders: true 
  }, function(err, result) {
    if(err) {
      console.error(err);
    } else {

          var array = [];
          result.forEach(function(item, i, arr) {  
                var fieldMetadata = {
                    field_name: item['field name'],        
                    db_terms: item['db terms'],
                    data_type: item['data type'],
                    example:item['example'],
                    calculation_type: item['calculation type'],
                    can_normalize: Boolean(item['can normalize'] == 'Yes'),
                    is_hierarchy: Boolean(item['ishierarchy'] == 'Yes'),
                    i_created: Boolean(item['icreated'] == 'Yes'),     
                    description: item['field name']  
                };
                 if (item['description']){
                    fieldMetadata.description = item['description'];
                }
                if (item['dimension name'] != 'NULL'&& item['hierarchy level'] != 'NaN'&& item['hierarchy level'] != ''){
                    fieldMetadata.dimension_name = item['dimension name'];
                }

                if (item['hierarchy level'] != 'NULL' && item['hierarchy level'] != 'NaN'&& item['hierarchy level'] != ''){
                    fieldMetadata.hierarchy_level = parseInt(item['hierarchy level']);
                }                       
                array.push(fieldMetadata);                                           
            });

            console.log(array);

            var mongoFactory = require('./../helpers/mongo_provider');
            mongoFactory.saveAllFieldMetadata(array, function(){
                         console.log('FieldMetadata saved successfully!');
                    process.exit();
                        }
            );
    }
  });
