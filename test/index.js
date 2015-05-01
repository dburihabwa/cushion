var assert = require('assert');
require('blanket')();
var path = require('path');

var index = require(path.join(__dirname, '../index.js'))('http://127.0.0.1:5984/test');
var Model = index.Model;

describe('Model.extends(options)', function () {
    'use strict';
	it('should add the expected properties to the model', function () {
        var options = {
            'type': 'user',
            'properties' : ['name', 'email']
        };
		var User = Model.extend(options);
		var sam = new User({});
        options.properties.forEach(function (property) {
            assert.ok(sam.hasOwnProperty(property));
        });
	});

    it('should produce a constructor that accepts properties named according to the options that created it', function () {
        var options = {
            'type': 'user',
            'properties' : ['name', 'email']
        };
        var User = Model.extend(options);
        var sam = new User({'uninvited': true});
        assert.strictEqual(typeof sam.uninvited, 'undefined');
    });

    it('should produce a constructor that does not allow non waranted properties to appear in the objects it creates', function () {
        var options = {
            'type': 'user',
            'properties' : ['name', 'email']
        };
        var userProperties = {'name': 'sam', 'email': 'sam@email.example'};
        var User = Model.extend(options);
        var sam = new User(userProperties);
        for (var property in userProperties) {
            assert.strictEqual(sam[property], userProperties[property]);
        }
    });

    it('should throw an error if the options argument is not an object', function () {
        assert.throws(function () {
            Model.extend(undefined);
        }, Error);
        assert.throws(function () {
            Model.extend(null);
        }, Error);

        assert.throws(function () {
            Model.extend([]);
        }, Error);
        assert.throws(function () {
            Model.extend(false);
        }, Error);

        assert.throws(function () {
            Model.extend(Math.PI);
        }, Error);
    });

    it('should throw an error if the type is missing from the options argument', function () {
        var options = {
            'properties' : ['name', 'email']
        };
        assert.throws(function () {
            Model.extend(options);
        }, Error);
    });

    it('should throw an error if the properties are missing from the options argument', function () {
        var options = {
            'type': 'user'
        };
        assert.throws(function () {
            Model.extend(options);
        }, Error);
    });


});

describe('extendedModel.save()', function () {
    'use strict';
    it('should resolve to an object equal to extendModel', function (done) {
        var options = {
            'type': 'user',
            'properties' : ['name', 'email']
        };
        var User = Model.extend(options);
        var user = new User({'name': 'sam', 'email': 'sam@email.example'});
        user.save().then(function (modifiedUser) {
            assert.deepEqual(user, modifiedUser);
            done();
        }).catch(done);
    });


    it('should resolve to an object with defined _id and _rev fields for a first time save', function (done) {
        var options = {
            'type': 'user',
            'properties' : ['name', 'email']
        };
        var User = Model.extend(options);
        var user = new User({'name': 'sam', 'email': 'sam@email.example'});
        var initialRev = user._rev;
        assert.strictEqual(typeof initialRev, 'undefined');
        user.save().then(function () {
            assert.ok(user.hasOwnProperty('_rev'));
            assert.ok(user.hasOwnProperty('_id'));
            done();
        }).catch(done);
    });

    it('should resolve to an object with a modified _rev field for an extendedModel saved earlier', function (done) {
        var options = {
            'type': 'user',
            'properties' : ['name', 'email']
        };
        var User = Model.extend(options);
        var user = new User({'name': 'sam', 'email': 'sam@email.example'});
        var initialRev = user._rev;
        assert.strictEqual(typeof initialRev, 'undefined');
        user.save().then(function () {
            assert.notStrictEqual(initialRev, user._rev);
            var firstRev = user._rev;
            user.save().then(function () {
                assert.notStrictEqual(firstRev, user._rev);
                done();
            });
        }).catch(done);
    });

    it('should reject an error if extendedModel._rev does not match extendedModel in the database', function (done) {
        var options = {
            'type': 'user',
            'properties' : ['name', 'email']
        };
        var User = Model.extend(options);
        var user = new User({'name': 'sam', 'email': 'sam@email.example'});
        assert.strictEqual(typeof initialRev, 'undefined');
        user.save().then(function () {
            user._rev = '42-5e3573660103a4b3819cd829d2f05a96';
            user.save().then(function () {
                assert.fail('An error should have been rejected!');
                done();
            }, function (error) {
                assert.ok(error instanceof Error);
                done();
            });
        }).catch(done);
    });
});
