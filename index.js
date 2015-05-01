var Model = function () {};

Model.extend = function(keys) {
	'use strict';
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
	return func;
};

exports.Model = Model;