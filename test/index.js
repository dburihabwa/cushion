var assert = require('assert');
var path = require('path');

var index = require(path.join(__dirname, '../index.js'));
var Model = index.Model;

describe('Model.extends', function () {
	it('should add the expected properties to the model', function () {
        var properties = ['name', 'email'];
		var User = Model.extend(properties);
		var sam = new User({});
        properties.forEach(function (property) {
            assert.ok(sam.hasOwnProperty(property));
        });
	});

    it('should produce a constructor that accepts properties named according to the keys that created it', function () {
        var properties = ['name', 'email'];
        var User = Model.extend(properties);
        var sam = new User({'uninvited': true});
        assert.strictEqual(typeof sam.uninvited, 'undefined');
    });

    it('should produce a constructor that does not allow non waranted properties to appear in the objects it creates', function () {
        var properties = ['name', 'email'];
        var userProperties = {'name': 'sam', 'email': 'sam@email.example'};
        var User = Model.extend(properties);
        var sam = new User(userProperties);
        for (var property in userProperties) {
            assert.strictEqual(sam[property], userProperties[property]);
        }
    });

    it('should throw an error if the keys argument is not an array', function () {
        assert.throws(function () {
            Model.extend(undefined);
        }, Error);
        assert.throws(function () {
            Model.extend(null);
        }, Error);

        assert.throws(function () {
            Model.extend({});
        }, Error);
        assert.throws(function () {
            Model.extend(false);
        }, Error);

        assert.throws(function () {
            Model.extend(Math.PI);
        }, Error);
    });
});