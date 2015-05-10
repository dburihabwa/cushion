var nano = require('nano');
var q = require('q');

module.exports = function (connectionURL) {
	'use strict';
	var db = nano(connectionURL);

	var Model = function () {};

	Model.extend = function(options) {
		if (typeof options !== 'object' || Array.isArray(options) || options === null ) {
			throw new Error('options argument must be an object');
		}
		if (typeof options.type !== 'string' || options.type.length === 0) {
			throw new Error('options.type must be defined');
		}

		if (typeof options.properties !== 'object' || options.properties === null) {
			throw new Error('options.properties must be an array');
		}
		var func = function (params) {
			this.type = options.type;
			var properties = Object.keys(options.properties);

			for (var i = 0; i < properties.length; i++) {
				var key = properties[i];
				this[key] = undefined;
			}
			for (var p in params) {
				if (params.hasOwnProperty(p) && this.hasOwnProperty(p)) {
					this[p] = params[p];
				}
			}
			if (params._id) {
				this._id = params._id;
			}
			if (params._rev) {
				this._rev = params._rev;
			}
		};

		func.prototype.save = function () {
			var obj = this;
			return new q.Promise(function (resolve, reject) {
				db.insert(obj, function (error, headers) {
					if (error) {
						return reject(error);
					}
					obj._id = headers.id;
					obj._rev = headers.rev;
					return resolve(obj);
				});
			});
		};

		func.prototype.delete = function () {
			var obj = this;
			return new q.Promise(function (resolve, reject) {
				db.destroy(obj._id, obj._rev, function (error, headers) {
					if (error) {
						return reject(error);
					}
					obj._rev = headers.rev;
					return resolve(obj);
				});
			});		
		};
		return func;
	};

	var Collection = function () {};


	var buildViewQuery = function (type, key) {
		return function (params) {
			return new q.Promise(function (resolve, reject) {
				params = params || {};
				db.view(type, key, params, function (error, body) {
					if (error) {
						return reject(error);
					}
					var values = body.rows.map(function (row) {
						return row;
					});
					return resolve(values);
				});
			});
		};
	};

	Collection.extend = function (conf) {
		if (!conf || typeof conf !== 'object') {
			throw new Error('conf argument must be defined');
		}
		var func = function () {};
		var properties = Object.keys(conf.properties);
		for (var i = 0; i < properties.length; i++) {
			var property = properties[i];
			if (conf.properties[property].view === true) {
				var key = 'findBy' + property[0].toUpperCase() + property.substr(1);
				func[key] = buildViewQuery(conf.type, key);
			}
		}

		var ExtendedModel = Model.extend(conf);

		func.get = function (id) {
			return new q.Promise(function (resolve, reject) {
				if (id === undefined || id === null) {
					return reject(new Error('id argument must be defined'));
				}
				db.get(id, function (error, doc) {
					if (error) {
						return reject(error);
					}
					return resolve(new ExtendedModel(doc));
				});
			});
		};
		return func;
	};

	return {
		'Collection': Collection,
		'Model': Model
	};
};