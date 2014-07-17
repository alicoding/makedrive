var expect = require('chai').expect;
var util = require('../../lib/util.js');
var MakeDrive = require('../../../client/src');
var Filer = require('../../../lib/filer.js');

describe('MakeDrive Client - sync multiple files', function(){
  var provider;

  beforeEach(function() {
    provider = new Filer.FileSystem.providers.Memory(util.username());
  });
  afterEach(function() {
    provider = null;
  });

  /**
   * This test creates multiple files, syncs, and checks that they exist
   * on the server. It then removes them, and makes sure a downstream sync
   * brings them back.
   */
  it('should sync multiple files', function(done) {
    util.authenticatedConnection(function( err, result ) {
      expect(err).not.to.exist;

      var fs = MakeDrive.fs({provider: provider, manual: true});
      var sync = fs.sync;

      var layout = {
        '/file1': 'contents of file1',
        '/file2': 'contents of file2',
        '/file3': 'contents of file3'
      };

      sync.once('connected', function onConnected() {
console.log('before createFilesystemLayout');
        util.createFilesystemLayout(fs, layout, function(err) {
console.log('after createFilesystemLayout');
          expect(err).not.to.exist;

          sync.request('/');
        });
      });

      sync.once('completed', function onUpstreamCompleted() {
console.log('before disconnect');
        sync.disconnect();
console.log('after disconnect');
      });

      sync.once('disconnected', function onDisconnected() {
console.log('before deleteFilesystemLayout');
        util.deleteFilesystemLayout(fs, null, function(err) {
console.log('after deleteFilesystemLayout');
          expect(err).not.to.exist;

          // Re-sync with server and make sure we get our files back
          sync.once('connected', function onSecondDownstreamSync() {
console.log('before re-disconnect');
            sync.disconnect();
console.log('after re-disconnect');
console.log('before ensureFilesystem');
            util.ensureFilesystem(fs, layout, function(err) {
console.log('after ensureFilesystem');
              expect(err).not.to.exist;

              done();
            });
          });
console.log('before reconnect');
          sync.connect(util.socketURL, result.token);
console.log('after reconnect');
        });
      });

      sync.connect(util.socketURL, result.token);
    });
  });

});
