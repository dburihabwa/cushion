var nano = require('nano');
var q = require('q');

module.exports = function (connectionURL) {
	'use strict';
	var db = nano(connectionURL);

	var Model = function () {};

	Model.extend = function(keys) {
		if (!(Array.isArray(keys))) {
			throw new Error('keys argument must be an array!');
		}
		var func = function (params) {
			for (var i = 0; i < keys.length; i++) {
				var key = keys[i];
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
		return func;
	};

	return {
		'Model': Model
	};
};