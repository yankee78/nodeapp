

var express = require('express'),
  config = require('./config/config'),
  glob = require('glob'),
  mongoose = require('mongoose'),
  multer  = require('multer'),
  done = false;

mongoose.connect(config.db);
var db = mongoose.connection;
db.on('error', function () {
  throw new Error('unable to connect to database at ' + config.db);
});

var models = glob.sync(config.root + '/app/models/*.js');
models.forEach(function (model) {
  require(model);
});
var app = express();
app.use(multer({ dest: 'public/uploads/',
	rename: function (fieldname, filename) {
	  return filename;
	},
	onFileUploadStart: function (file) {
	console.log(file.originalname)
	},
	onFileUploadComplete: function (file) {
	console.log(file.fieldname + ' uploaded to  ' + file.path)
	done=true;
	}
}));


require('./config/express')(app, config);



app.listen(config.port);

