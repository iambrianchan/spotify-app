// Gruntfile.js
module.exports = function(grunt) {

  grunt.initConfig({

    // configure nodemon
    nodemon: {
      dev: {
        script: 'server.js'
      }
    }

  });

  // load nodemon
  grunt.loadNpmTasks('grunt-nodemon');

  // register the nodemon task
  grunt.registerTask('default', ['nodemon']); 

};