var path = require('path'),
    rootPath = path.normalize(__dirname + '/..'),
    env = process.env.NODE_ENV || 'development';

var config = {
  development: {
    root: rootPath,
    app: {
      name: 'work'
    },
    port: 3000,
    db: 'mongodb://localhost/nodejsproject-development'
  },

  test: {
    root: rootPath,
    app: {
      name: 'work'
    },
    port: 3000,
    db: 'mongodb://localhost/nodejsproject-test'
  },

  production: {
    root: rootPath,
    app: {
      name: 'work'
    },
    port: 3000,
    db: 'mongodb://localhost/nodejsproject-production'
  }
};

module.exports = config[env];
