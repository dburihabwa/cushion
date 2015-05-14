var assert = require('assert');
require('blanket')();
var path = require('path');
var q = require('q');

var config = require(path.join(__dirname, '../config.json'));
var url = config.test.protocol + '://' + config.test.host + ':' + config.test.port + '/';

console.log('url: ' + url);

var index = require(path.join(__dirname, '../index.js'))(url + config.test.database);
var Collection = index.Collection;
var Model = index.Model;
var nano;

function databaseExists(database) {
    'use strict';
    return new q.Promise(function (resolve, reject) {
        nano.db.get(database, function (error, body) {
           if (error) {
               return reject(error);
           }
           return resolve(body);
        });
    });
}

function createDatabase(database) {
    'use strict';
    return new q.Promise(function (resolve, reject) {
        nano.db.create(database, function (error, body) {
            if (error) {
                return reject(error);
            }
            return resolve(body);
        });
    });
}

function destroyDatabase(database) {
    'use strict';
    return new q.Promise(function (resolve, reject) {
        nano.db.destroy(database, function (error, body) {
            if (error) {
                return reject(error);
            }
            return resolve(body);
        });
    });
}

before(function (done) {
    'use strict';
    var authorizedUrl = config.test.protocol + '://' + config.test.username + ':' + config.test.password + '@' + config.test.host + ':' + config.test.port + '/';
    nano = require('nano')(authorizedUrl);
    databaseExists(config.test.database).then(function() {
        done();
    }, function () {
        createDatabase(config.test.database).then(function () {
            done();
        }).catch(done);
    }).catch(done);
});

after(function (done) {
    'use strict';
    destroyDatabase(config.test.database).then(function () {
        done();
    }).catch(done);
});

describe('Model.extend(options)', function () {
    'use strict';

	it('should add the expected properties to the model', function () {
        var options = {
            'type': 'user',
            'properties' : {
                'name': {
                    'view': false,
                },
                'email': {
                    'view': false
                }
            }
        };
		var User = Model.extend(options);
		var sam = new User({});
        Object.keys(options.properties).forEach(function (property) {
            assert.ok(sam.hasOwnProperty(property));
        });
	});

    it('should produce a constructor that accepts properties named according to the options that created it', function () {
        var options = {
            'type': 'user',
            'properties' : {
                'name': {
                    'view': false,
                },
                'email': {
                    'view': false
                }
            }
        };
        var User = Model.extend(options);
        var sam = new User({'uninvited': true});
        assert.strictEqual(typeof sam.uninvited, 'undefined');
    });

    it('should produce a constructor that does not allow non waranted properties to appear in the objects it creates', function () {
        var options = {
            'type': 'user',
            'properties' : {
                'name': {
                    'view': false,
                },
                'email': {
                    'view': false
                }
            }
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
            'properties' : {
                'name': {
                    'view': false,
                },
                'email': {
                    'view': false
                }
            }
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
            'properties' : {
                'name': {
                    'view': false,
                },
                'email': {
                    'view': false
                }
            }
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
            'properties' : {
                'name': {
                    'view': false,
                },
                'email': {
                    'view': false
                }
            }
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
            'properties' : {
                'name': {
                    'view': false,
                },
                'email': {
                    'view': false
                }
            }
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
            'properties' : {
                'name': {
                    'view': false,
                },
                'email': {
                    'view': false
                }
            }
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

describe('model.delete()', function() {
    'use strict';

    it('should reject an error if the model does not exist in the database', function (done) {        
        var options = {
            'type': 'user',
            'properties' : {
                'name': {
                    'view': false,
                },
                'email': {
                    'view': false
                }
            }
        };
        var User = Model.extend(options);
        var user = new User({'name': 'sam', 'email': 'sam@email.example'});
        user.delete().then(function () {
            assert.fail('An error should have been rejected!');
            done();
        }, function (error) {
            assert.ok(error instanceof Error);
            done();
        }).catch(done);
    });


    it('should resolve to the model with modified headers if the model is successfully deleted from the database', function (done) {        
        var options = {
            'type': 'user',
            'properties' : {
                'name': {
                    'view': false,
                },
                'email': {
                    'view': false
                }
            }
        };
        var User = Model.extend(options);
        var user = new User({'name': 'sam', 'email': 'sam@email.example'});
        var firstRev;
        var db = nano.use(config.test.database);
        user.save().then(function () {
            firstRev = user._rev;
            return user;
        }).then(function (user) {
            user.delete().then(function (user) {
                assert.notStrictEqual(firstRev, user._rev);
                db.get(user._id, function (error) {
                    if (error) {
                        assert.ok(error instanceof Error);
                        assert.strictEqual(error.message, 'deleted');
                        return done();
                    }
                    done(new Error('The document should be deleted from the database!'));
                });
            }).catch(done);
        }).catch(done);        
    });
});

describe('Collection.extend(options)', function () {
    'use strict';

    it('should throw an error if the extendModel is undefined', function () {
        assert.throws(function () {
            Collection.extend(undefined);
        }, 'conf argument must be defined');
    });

    it('should throw an error if the extendModel is null', function () {
        assert.throws(function () {
            Collection.extend(null);
        }, 'conf argument must be defined');
    });

    it('should return an object with methods matching the model properties that have a view property set to true    ', function () {
        var conf = {
            'type': 'message',
            'properties': {
                'content': {
                    'view': true
                }, 
                'recipient': {
                    'view': true
                },
                'viewSetToFalse': {
                    'view': false
                }
            }
        };
        var Messages = Collection.extend(conf);
        assert.ok(typeof Messages === 'function');
        var properties = Object.keys(conf.properties);
        var queryableProperties = properties.filter(function (property) {
            return conf.properties[property].view === true;
        });
        queryableProperties.forEach(function (property) {
            var key = 'findBy' + property[0].toUpperCase() + property.substr(1);
            assert.ok(typeof Messages[key] === 'function');
        });
        var notQueryableProperties = properties.filter(function (property) {
            return conf.properties[property].view !== true;  
        });
        notQueryableProperties.forEach(function (property) {
            var key = 'findBy' + property[0].toUpperCase() + property.substr(1);
            assert.ok(typeof Messages[key] === 'undefined');
        });
    });

    it('should return an object with a get method to retrieve a document using its id', function (done) {
        var conf = {
            'type': 'book',
            'properties': {
                'author': {
                    'view': true
                },
                'title': {
                    'view': true
                },
                'year': {
                    'view': true
                }
            }
        };
        var Book = Model.extend(conf);
        var Books = Collection.extend(conf);

        var book = new Book({
            'author': 'Oscar Wilde',
            'title': 'The portrait of Dorian Gray',
            'year': 3210
        });

        book.save().then(function () {
            Books.get(book._id).then(function (bookFromDatabase) {
                assert.deepEqual(book, bookFromDatabase);
                done();
            });
        }).catch(done);
    });

    it('should return an object with a get method that rejects an error if the id is undefined', function (done) {
        var conf = {
            'type': 'book',
            'properties': {
                'author': {
                    'view': true
                },
                'title': {
                    'view': true
                },
                'year': {
                    'view': true
                }
            }
        };
        var Books = Collection.extend(conf);
        Books.get(undefined).then(function () {
            assert.fail('An error should have been rejected!');
        }, function (error) {
            assert.ok(error instanceof Error);
            assert.strictEqual(error.message, 'id argument must be defined');
        }).done(done);
    });

    it('should return an object with a get method that rejects an error if the id is null', function (done) {
        var conf = {
            'type': 'book',
            'properties': {
                'author': {
                    'view': true
                },
                'title': {
                    'view': true
                },
                'year': {
                    'view': true
                }
            }
        };
        var Books = Collection.extend(conf);
        Books.get(null).then(function () {
            assert.fail('An error should have been rejected!');
        }, function (error) {
            assert.ok(error instanceof Error);
            assert.strictEqual(error.message, 'id argument must be defined');
        }).done(done);
    });

    it('should return an object with a get method that rejects an error if the id does not match any document in the database', function (done) {
        var conf = {
            'type': 'book',
            'properties': {
                'author': {
                    'view': true
                },
                'title': {
                    'view': true
                },
                'year': {
                    'view': true
                }
            }
        };
        var Books = Collection.extend(conf);
        Books.get('bad_id_xxxx').then(function () {
            assert.fail('An error should have been rejected!');
        }, function (error) {
            assert.ok(error instanceof Error);
            assert.strictEqual(error.message, 'missing');
        }).done(done);
    });
});