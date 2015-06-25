var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var FolderSchema = new Schema({
  name: { type : String , unique : true, required : true },
  creator: { type : String , required : true },
  archived: { type: Boolean, default: false },
  expire_time: { type: Date, required: true },
  files: [{ type: Schema.Types.ObjectId, ref: 'File' }],
  created_at    : { type: Date },
  updated_at    : { type: Date }
});

FolderSchema.pre('save', function(next){
  now = new Date();
  this.updated_at = now;
  if ( !this.created_at ) {
    this.created_at = now;
  }
  next();
});


FolderSchema.virtual('date')
  .get(function(){
    return this._id.getTimestamp();
  });

mongoose.model('Folder', FolderSchema);

