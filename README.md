# SOFA
A little couchdb helper with no other intention than avoiding rewriting everythin all the time.

## Creating your type

```javascript
var sofa = require('sofa')('https://host:port/database');
var Message = sofa.Model.extend({
	'properties': {
        'author': {
            'view': false
        }, 
        'content': {
            'view': false
        }
    },
	'type': 'message'
);

var warning = new Message({
	'author': 'sam',
	'content': 'Beware of useless novelty'
});

warning.save().then(function () {
	console.log('warning message was saved under id: ' + warning._id + ', rev: ' + warning._rev);
});
```