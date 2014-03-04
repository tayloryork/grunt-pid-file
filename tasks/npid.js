/*
 * grunt-npid
 * https://github.com/tyork/grunt-npid
 *
 * Copyright (c) 2014 tayloryork
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {

  grunt.registerMultiTask('npid', 'Grunt tasks for npid, a pid file manager for Node.js', function (target) {
    var file = this.options().file  || ".tmp/npid.pid";
    var killIfRunning = this.options().killIfRunning || false;
    var runningProcessPid = null;
    
    if(killIfRunning) {
      try {
        runningProcessPid = grunt.file.read(file);
      } catch (err){
        // Do nothing, it does not exist
      }
      try {
        if(runningProcessPid) {
          grunt.log.write('Killing process ' + runningProcessPid);
          process.kill(runningProcessPid);
        }
      } catch (err) {
        grunt.log.error(err);
        process.exit(1);
      }
    }
    
    try {
      var npid = require('npid');
      grunt.log.write("Writing PID to %s", file);
      npid.create(file, true);
    } catch (err) {
      grunt.log.error(err);
      process.exit(1);
    }
  });
  
  grunt.registerTask('test', [
    'clean:server',
    'concurrent:test',
    'autoprefixer',
    'connect:test',
    'karma'
  ]);
};
