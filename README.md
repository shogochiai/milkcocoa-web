# milkcocoa-web
Alternative easy BaaS interface using Firebase and PubNub.

## purpose
This BaaS client enable you to use Firebase(Storing/Auth) and PubNub(Sync) with simpler API.

## interfase

### document
Completely based on [milkcocoa's API](https://mlkcca.com/document/api-js.html)

### introduction

MilkCocoa Object
- new MilkCocoa()
- dataStore()
- addAccount()
- login()
- logout()
- getCurrentUser()

DataStore Object
- push()
- set()
- remove()
- send()
- on()
- off()
- get()
- query()
- child()
- parent()
- root()

Query Object
- done()
- limit()
- skip()
- sort()

## usage

Write this into HTML

```:html

<script src="https://cdn.firebase.com/js/client/2.2.3/firebase.js"></script>
<script src="https://cdn.pubnub.com/pubnub-dev.js"></script>
<script src="milkcocoa.js"></script>

```
--

And start with creating JS Object.

```:js

var milkcocoa = new MilkCocoa('firebase_id', 'pubnub-pubkey', 'pubnub-subkey');

```

Visit to [firebase](firebase.com)&[pubnub](pubnub.com) to get three keys.
Firebase dashboard enables you to check your stored data.

## License
Milkpubfire is released under the [MIT License](http://opensource.org/licenses/MIT).
