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

		if (!(Array.isArray(options.properties))) {
			throw new Error('options.type must be an array');
		}
		var func = function (params) {
			this.type = options.type;
			for (var i = 0; i < options.properties.length; i++) {
				var key = options.properties[i];
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

	return {
		'Model': Model
	};
};