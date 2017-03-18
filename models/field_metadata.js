var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var FieldMetadataSchema = new Schema({
  field_name: { type: String, unique: true},
  db_terms: { type: String },
  data_type: { type: String },
  example: { type: String },
  calculation_type: { type: String },
  can_normalize: { type: Boolean  },
  is_hierarchy: { type: Boolean },
  i_created: { type: Boolean },
  dimension_name: { type: String, default: null},
  hierarchy_level: { type: Number, default: null },
  description: { type: String}
});


var FieldMetadata = mongoose.model('FieldMetadata', FieldMetadataSchema);;
module.exports = FieldMetadata;
