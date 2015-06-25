var express = require('express'),
  router = express.Router(),
  mongoose = require('mongoose'),
  rimraf = require('rimraf'),
  File = mongoose.model('File'),
  Folder = mongoose.model('Folder'),
  User = mongoose.model('User'),
  fs = require('fs');

module.exports = function (app) {
  app.use('/', router);
};

function pad(n) { return ("0" + n).slice(-2); }

Date.prototype.getHoursTwoDigits = function()
{
    return pad(this.getHours());
}
Date.prototype.getMinutesTwoDigits = function()
{
    return pad(this.getMinutes());
}
Date.prototype.getSecondsTwoDigits = function()
{
    return pad(this.getSeconds());
}
Date.prototype.getMonthTwoDigits = function()
{
    return pad(this.getMonth());
}
Date.prototype.getDateTwoDigits = function()
{
    return pad(this.getDate());
}

// var folders = [];

router.get('/', function (req, res, next) {
  var nbfolders = 0;
  var nbfolders_archived = 0;
  var nbfiles = 0;
  var nbfiles_archived = 0;
  var downloads = 0;
  Folder.find({archived: false},function (err, folders) {
    if (err) return next(err);
    nbfolders = folders.length;
   
  });
  Folder.find({archived: true},function (err, folders) {
    if (err) return next(err);
    nbfolders_archived = folders.length;
   
  });
  File.find({archived: false},function (err, files) {
    if (err) return next(err);
    nbfiles = files.length;
    files.forEach(function(file){
      downloads += file.nb_downloads;
    });
  });
  File.find({archived: true},function (err, files) {
    if (err) return next(err);
    nbfiles_archived = files.length;
    files.forEach(function(file){
      downloads += file.nb_downloads;
    });
  });
  User.find(function (err, users) {
    if (err) return next(err);
    res.render('index.ejs', 
      {
        title: '',
        users: users,
        folders: nbfolders,
        folders_archived: nbfolders_archived,
        files: nbfiles,
        files_archived: nbfiles_archived,
        downloads: downloads
      }
    );
  });
  
});


router.get('/actives_directories', function (req, res, next) {
  Folder.find({archived: false},function (err, folders) {
    if (err) return next(err);
    var data = {
      title: 'Liste des répertoires actifs',
      articles: [],
      folders: folders,
      session: req.session
    };
   
    res.render('partials/list.ejs', data);
  }).populate('files');

});


router.get('/create_folder', function (req, res, next) {
  res.render('partials/create_folder.ejs', 
    {
      title: 'Création de répertoire'
    }
  );
  
});


router.post('/create_folder', function (req, res, next) {
  // console.log(req.body);
  var expire_time = new Date();
  expire_time = new Date(expire_time.valueOf()+req.body.expire_time*1000);
  var folder = new Folder({ name: req.body.name, creator: req.body.creator, expire_time: expire_time });
  folder.save(function(err) {
    console.log("folder saved", err);
    if (err) return next(err);

    fs.mkdir('public/uploads/'+req.body.name, function(err){
      if(err)
        console.log(err);
      else
        console.log('ok');
    });
    res.redirect('/actives_directories');
  });
});


router.get('/:folder', function (req, res, next) {
  var folder_param = req.params.folder;
  Folder
  .findOne({ name: folder_param })
  .populate('files')
  .exec(function (err, folder) {
    if (err) return handleError(err);
    var files = [];
    folder.files.forEach(function(file){
      var extension = /[^.]+$/.exec(file.name);
      switch(extension[0]) {
        case 'jpg': 
          file.icon = '<i class="fa fa-picture-o fa-2x"></i>';
          break;

        case 'png': 
          file.icon = '<i class="fa fa-picture-o fa-2x"></i>';
          break;

        case 'doc': 
          file.icon = '<i class="fa fa-file-word-o fa-2x"></i>';
          break;

        case 'docx': 
          file.icon = '<i class="fa fa-file-word-o fa-2x"></i>';
          break;

        case 'ppt': 
          file.icon = '<i class="fa fa-file-powerpoint-o fa-2x"></i>';
          break;

        case 'xls': 
          file.icon = '<i class="fa fa-file-excel-o fa-2x"></i>';
          break;

        case 'pdf': 
          file.icon = '<i class="fa fa-file-pdf-o fa-2x"></i>';
          break;

        case 'html': 
          file.icon = '<i class="fa fa-html5 fa-2x"></i>';
          break;

        case 'js': 
          file.icon = '<i class="fa fa-code fa-2x"></i>';
          break;

        default:
          file.icon = '<i class="fa fa-file-o fa-2x"></i>';
          break;
      }
      if(file.archived === false){
        console.log(file);
        files.push(file);
      }
    });
    res.render('partials/folder.ejs', 
      {
        title: 'Répertoire '+folder_param,
        folder: folder,
        files: files
      }
    );
  });
});


router.get('/:folder/upload_file', function (req, res, next) {
  var folder = req.params.folder;
  res.render('partials/upload_file.ejs', 
    {
      title: 'Ajouter un fichier au dossier '+folder,
      folder: folder
    }
  );
  
});


router.get('/:folder/:file', function (req, res, next) {
  var folder_param = req.params.folder;
  var file_param = req.params.file;
  var path = 'public/uploads/'+folder_param+"/"+file_param;

  Folder
  .findOne({ name: folder_param })
  .exec(function (err, folder) {
    File
    .findOne({ name: file_param, _folder: folder.id })
    .exec(function (err, file) {
      if (err) return handleError(err);
      file.nb_downloads += 1;
      file.save(function(){});
    });
  });


  res.download(path);
  
});


router.get('/:folder/:file_id/delete', function (req, res, next) {
  var folder_param = req.params.folder;
  var file_id = req.params.file_id;
  var path = 'public/uploads/'+folder_param+"/";

  Folder
  .findOne({ name: folder_param })
  .exec(function (err, folder) {
    if (err) return handleError(err);
    File.findOne({ _id: file_id, _folder: folder.id }, function (err, f) {
      if (err) return handleError(err);

      File.update({ _id: file_id, _folder: folder.id }, {'$set': {archived: true}}, function (err) {
        if (err) return handleError(err);
        fs.unlink(path+f.name,function(err){
          // console.log(err);
        });
      });
      folder.files.pull({_id: f.id});
      folder.save(function(){});
      
    });
  });

  res.redirect('/'+folder_param);
  
});


router.get('/delete/:folder', function (req, res, next) {
  var folder_param = req.params.folder;
  var path = 'public/uploads/'+folder_param;

  Folder
  .findOne({ name: folder_param })
  .exec(function (err, folder) {
    if (err) return handleError(err);

    Folder.update({ name: folder.name }, {'$set': {archived: true}}, function (err) {
      if (err) return handleError(err);
      rimraf(path,function(err){
        console.log(err);
      })
    });
    

    File.update({ _folder: folder.id }, {'$set': {archived: true} }, function (err) {
      if (err) return handleError(err);
      
    });
  });

  res.redirect('/actives_directories/');
  
});


router.post('/:folder/upload_file', function (req, res, next) {
  var folder = req.params.folder;
  if (!req.files.file.name || !req.body.creator)
    next('error');
  // console.log(req.files);
  Folder
  .findOne({ name: folder })
  .exec(function (err, folder) {
    if (err) return next(err);
    var file = new File({ name: req.files.file.name, creator: req.body.creator, _folder: folder.id });
    file.save(function (err) {
      if (err) return next(err);
      //
    });
    folder.files.push(file);
    folder.save(function(err){});
  });
  fs.rename('public/uploads/'+req.files.file.name, 'public/uploads/'+folder+'/'+req.files.file.name, function(err){});
  res.redirect('/'+folder);
  
});



setInterval(function(){

  Folder.find({
    expire_time: {'$lt': new Date() },
    archived: false
  })
  .exec(function(err, folders){
    folders.forEach(function(folder){
      var path = 'public/uploads/'+folder.name;
      Folder.update({ name: folder.name },{'$set': {archived: true}}, function (err) {
        if (err) return handleError(err);
        rimraf(path,function(err){
          console.log(err);
        });
      });
      File.update({  _folder: folder.id }, {'$set': {archived: true}}, function (err) {
        if (err) return handleError(err);
        fs.unlink(path,function(err){
          console.log(err);
        });
      });
    });
  });
},5000);