# SOFA
A light promise based couchdb ORM built on top of nano and q.

## Creating your type
```javascript
var sofa = require('sofa')('https://host:port/database');
var Message = sofa.Model.extend(['author', 'content']);

var warning = new Message({
	'author': 'sam',
	'content': 'Beware of useless novelty'
});

warning.save().then(function () {
	console.log('warning message was saved under id: ' + warning._id + ', rev: ' + warning._rev);
});
```
