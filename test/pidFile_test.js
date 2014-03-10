'use strict';

var grunt = require('grunt');

/*
  ======== A Handy Little Nodeunit Reference ========
  https://github.com/caolan/nodeunit

  Test methods:
    test.expect(numAssertions)
    test.done()
  Test assertions:
    test.ok(value, [message])
    test.equal(actual, expected, [message])
    test.notEqual(actual, expected, [message])
    test.deepEqual(actual, expected, [message])
    test.notDeepEqual(actual, expected, [message])
    test.strictEqual(actual, expected, [message])
    test.notStrictEqual(actual, expected, [message])
    test.throws(block, [error], [message])
    test.doesNotThrow(block, [error], [message])
    test.ifError(value)
*/

function sleep(milliSeconds){
  var startTime = new Date().getTime();                    // get the current time
  while (new Date().getTime() < startTime + milliSeconds){} // hog cpu until time's up
}

function isAlive(pid) {
  var result = false;
  try {
    result = process.kill(pid,0)
    return result
  }
  catch (e) {
    return e.code === 'EPERM';
  }
}

exports.pidFile = {
  setUp: function(done) {
    // setup here if necessary
    done();
  },
  
  default_options_file: function(test) {
    test.expect(1);
    
    var actual = grunt.file.read('.tmp/pid-file.pid');
    var expected = process.pid;
    test.equal(actual, expected, 'pid file should be ' + expected);

    test.done();
  },
  
  custom_options_file: function(test) {
    test.expect(1);

    // tests custom pid filename
    var actual = grunt.file.read('.tmp/custom_options.pid');
    var expected = process.pid;
    test.equal(actual, expected, 'pid file should be ' + expected);

    test.done();
  },
  default_options_kill_false: function(test) {
    test.expect(0);

    // test kill if running false
    // pid has already been created, so it should just recreate it without exception
    grunt.task.loadTasks("./tasks/pidFile.js");
    grunt.task.run(['pidFile:default_options']);
    
    test.done();
  },
  custom_options_kill_true: function(test) {
    test.expect(2);
    console.log('\n');
    grunt.log.write('loading ./tasks/pidFile.js');
    
    // test kill if running true
    // but if it kills this task... then the test will be killed!
    // yup.. confirmed.
    // So this is how to do this.
    //   delete ./tmp/custom_options.pid
    //   spawn a new process (grunt pidFile:custom_options + a long running task)
    //   spawn a new process (grunt pidFile:custom_options, which should kill the first process)
    // verify that process1 was killed.
    var util = require('util');  
    var doneFn = function(error, result, code){
      console.log('error is: ' + util.inspect(error));
      console.log('result is: ' + util.inspect(result));
      console.log('code is: ' + util.inspect(code));
    };
    
    var readPidFile = function() {
      var contents = '';
      try {
        contents = grunt.file.read('.tmp/custom_options.pid');
      } catch (err) {
        // nothing
      }
      return contents;
    };
    var prevPid = readPidFile();
    console.log('Deleting previous PID: ' + prevPid);
    grunt.file.delete('.tmp/custom_options.pid');
    grunt.file.delete('.tmp/pid-file.pid');
    sleep(1);
    
    console.log('Creating Spawn 1 pidFile');    
    //grunt.task.loadTasks("./tasks/pidFile.js");
    var spawn1 = grunt.util.spawn({
      args: ['pidFile:custom_options', 'asyncfoo', '--no-color'],
      grunt: true,
      }, doneFn);
    // sleep for 100ms
    sleep(1000);
    
    console.log('Spawn 1 pid: ' + spawn1.pid);
    console.log('Spawn 1 alive?: ' + isAlive(spawn1.pid));
    console.log('After spawn 1, pid file is: ' + readPidFile());
    
    test.equals(readPidFile().trim(), spawn1.pid.toString());
    
    // now spawn procces 2
    var spawn2 = grunt.util.spawn({
      args: ['pidFile:custom_options', '--no-color'],
      grunt: true,
      }, doneFn);
    
    // sleep for 100ms
    sleep(1000);
    var spawn1Alive = isAlive(spawn1.pid);
    var spawn2Alive = isAlive(spawn2.pid);
    console.log('And spawn 2.pid: ' + spawn2.pid);
    console.log('Spawn 1 alive?: ' + spawn1Alive);
    console.log('Spawn 2 alive?: ' + spawn2Alive);
    
    test.equals(spawn1Alive, false, "Spawn 1 should have been killed");
    // Okay, test is failing because the spawn 1 does not say it was killed.
    // I know, becasue i have looked at the task manager, that it was in fact killed.
    //
    //console.log(require('util').inspect(spawn1));
    
    var counter = 0;
    var intvl = setInterval(function(){
      counter ++;
      sleep(1);
      if(counter > 3) {
        clearInterval(intvl);
      }
    }, 1000);
    
    test.done();
  },
};