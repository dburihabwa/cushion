# cushion
A light opinionated document oriented abstraction layer for couchdb built on top of nano and q.

## Creating the  object
In order to create your own type of objects, you should get a constructor using ```Model.extend```.
```javascript
var cushion = require('cushion')('https://host:port/database');
var Message = cushion.Model.extend({
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

var warningMessage = new Message({
	'author': 'sam',
	'content': 'Someone is at the door!'
});
```
```Model.extend``` takes an object as parameter and returns a constructor. It uses the keys in the ```properties``` field as the list of fields that should be present by default in the objects created by the new constructor.

You can indicate whether a property of the objects to be created is indexed by a couchdb view by setting the ```view``` entry to true.
```javascript
{
    'properties': {
        'indexedProperty': {
            'view': true
        }
    }
}
```
This can be used by the ```Collection.extend``` to create a default function to query the couchdb view.

*WARNING* it is expected that the matching couchdb view is named findByProperty in a design document named by the type field.

## Saving the object
Once your type is created using ```Model.extend```, all objects created using the new constructor can be saved using their ```save``` method.

The method returns a promise that resolves with the modified object or rejects an error if the opertation failed.
```javascript
myMessage.save().then(function () {
    console.log('succesful save');
}, function (error) {
    console.log('error.message')
});
```

## Deleting the object
The method returns a promise that resolves with the modified object or rejects an error if the opertation failed.
```javascript
myMessage.delete().then(function () {
    console.log('succesful deletion');
}, function (error) {
    console.error(error.message);
});
```

As a result of a successful call of this function, querying the database for the document  will return a 404 response.
