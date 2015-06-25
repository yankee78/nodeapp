var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var FileSchema = new Schema({
  name: String,
  creator: { type : String , required : true },
  nb_downloads: { type: Number, default: 0 },
  archived: { type: Boolean, default: false },
  _folder: { type: String, ref: 'Folder' },
  created_at    : { type: Date },
  updated_at    : { type: Date }
});

FileSchema.pre('save', function(next){
  now = new Date();
  this.updated_at = now;
  if ( !this.created_at ) {
    this.created_at = now;
  }
  next();
});


FileSchema.virtual('date')
  .get(function(){
    return this._id.getTimestamp();
  });

mongoose.model('File', FileSchema);

