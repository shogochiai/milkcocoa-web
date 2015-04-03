(function(global){
	var myconsole = {
		log : function(v1, v2) {
			if(window.console) console.log(v1, v2);
		},
		error : function(v1, v2) {
			if(window.console) console.error(v1, v2);
		}
	}

    /*
    * MilkCocoa
    */
	function MilkCocoa(firebase_id, pubnub_pubkey, pubnub_subkey) {
        this.firebase = new Firebase("https://"+firebase_id+".firebaseio.com/");
        this.pubnub = PUBNUB.init({
            publish_key: pubnub_pubkey,
            subscribe_key: pubnub_subkey
        });
	}

	MilkCocoa.prototype.dataStore = function(path) {
		return new DataStore(this, path);
	}

	MilkCocoa.prototype.addAccount = function(email, password, options, cb) {
        if(options) options = {};
        this.firebase.createUser({
            "email": email,
            "password": password
        }, function(error, userData) {
            if (error) {
                switch (error.code) {
                    case "EMAIL_TAKEN":
                        console.log("The new user account cannot be created because the email is already in use.");
                        cb(1, null);
                        break;
                    case "INVALID_EMAIL":
                        console.log("The specified email is not a valid email.");
                        cb(2, null);
                        break;
                    default:
                        cb(3, null);
                        console.log("Error creating user:", error);
                }
            } else {
                cb(null, userData);
                console.log("Successfully created user account with uid:", userData.uid);
            }
        });
    }

	MilkCocoa.prototype.login = function(email, password, cb) {
        this.firebase.authWithPassword({
            "email": email,
            "password": password
        }, function(error, authData) {
            if (error) {
                console.log("Login Failed!", error);
                cb(error, null);
            } else {
                console.log("Authenticated successfully with payload:", authData);
                cb(null, authData);
            }
        });
	}

	MilkCocoa.prototype.logout = function(cb) {
        this.firebase.unauth();
	}

	MilkCocoa.prototype.getCurrentUser = function(cb) {
        var authData = this.firebase.getAuth();
        if(authData){
            cb(null, authData);
        } else {
            cb(1, null);
        }
	}

    /*
    * DataStore
    */
	function DataStore(milkcocoa, path) {
        if(path.length < 1) throw "invalid path";
        this.milkcocoa = milkcocoa;
        this.firebase = this.milkcocoa.firebase;
        this.pubnub = this.milkcocoa.pubnub;
        this.path = path;
        this.onCallbacks = {};
        this.onCallbacks[this.path] = {};
	}

	DataStore.prototype.push = function(params, cb) {
        if(this.path == "/") throw "Can't execute I/O to root.";
        if(params.hasOwnProperty("id")) throw "push value cannot have id";

        var self = this;
        var pushedDS = self.firebase.child(self.path).push();
        pushedDS.set(params);
        params.id = pushedDS.toString();
        if(cb) cb(params);
	}

	DataStore.prototype.set = function(id, params, cb) {
        if(this.path == "/") throw "Can't execute I/O to root.";
        if(params == null || params.hasOwnProperty("id")) throw "invalid argument";

        var self = this;
        self.firebase.child(self.path+"/"+id).set(params);
        params.id = id;
        if(cb) cb(params);
	}

	DataStore.prototype.send = function(params, cb) {
        if(this.path == "/") throw "Can't execute I/O to root.";
        var self = this;
        self.pubnub.publish({channel : self.path, message : params});
        if(cb) cb(params);
	}

	DataStore.prototype.remove = function(id, cb) {
        if(this.path == "/") throw "Can't execute I/O to root.";
        var self = this;
        if(cb) self.firebase.child(self.path+"/"+id).remove(cb);
        else self.firebase.child(self.path+"/"+id).remove();
	}

	DataStore.prototype.get = function(id) {
        if(this.path == "/") throw "Can't execute I/O to root.";
	}

	DataStore.prototype.child = function(child_path) {
        var self = this;
        var new_path = self.path+"/"+child_path;
        return new DataStore(self.milkcocoa, new_path);
	}

	DataStore.prototype.parent = function() {
        if(this.path == "/") throw "Can't execute I/O to root.";
        var self = this;
        var array = self.path.split("/");
        array.pop();
        self.path = array.join("/");
        return self;
	}

	DataStore.prototype.root = function() {
        return this.milkcocoa.dataStore("/");
	}

	DataStore.prototype.on = function(event, cb) {
        var self = this;
        if(event == "send") {
            self.pubnub.subscribe({
                channel : self.path,
                message : function(data){ cb(null, data); },
                error : function(error){ cb(error, null); }
            });
        } else if (event == "push") {
            self.onCallbacks[self.path][event] = self.firebase.child(self.path).on("child_added", function(childSnapshot){
                var obj = {};
                obj.id = childSnapshot.key();
                obj.value = childSnapshot.val();
                cb(null, obj);
            });
        } else if (event == "set") {
            self.onCallbacks[self.path][event] = self.firebase.child(self.path).on("child_changed", function(childSnapshot, prevChildName){
                var obj = {};
                obj.id = childSnapshot.key();
                obj.value = childSnapshot.val();
                cb(null, obj);
            });
        } else if (event == "remove") {
            self.onCallbacks[self.path][event] = self.firebase.child(self.path).on("child_removed", function(oldChildSnapshot){
                var obj = {};
                obj.id = oldChildSnapshot.key();
                obj.value = oldChildSnapshot.val();
                cb(null, obj);
            });
        }
	}

	DataStore.prototype.off = function(event, cb) {
        var self = this;
        if(event == "send") {
            self.pubnub.unsubscribe({
                channel : self.path
            });
        } else if (event == "push") {
            // TODO
            self.firebase.child(self.path).off("child_added", self.onCallbacks[self.path][event]);
        } else if (event == "set") {
            self.firebase.child(self.path).off("child_changed", self.onCallbacks[self.path][event]);
        } else if (event == "remove") {
            self.firebase.child(self.path).off("child_removed", self.onCallbacks[self.path][event]);
        }
        if(cb) cb();
        else return true;
	}

	DataStore.prototype.query = function() {
        if(this.path == "/") throw "Can't execute I/O to root.";
        return this.firebase.child(this.path);
	}


    /*
    * Queryは完全にfirebase準拠. milkcocoaに寄せられず
    *
    * https://www.firebase.com/docs/web/api/query/
    *
    * on(eventType, callback, [cancelCallback], [context])
    * off([eventType], [callback], [context])
    * once(eventType, successCallback, [failureCallback], [context])
    * orderByChild(key)
    * orderByKey()
    * orderByValue()
    * orderByPriority()
    * startAt(value, [key])
    * endAt(value, [key])
    * equalTo(value, [key])
    * limitToFirst(limit)
    * limitToLast(limit)
    * limit(limit)
    * ref()
    */

	global.MilkCocoa = MilkCocoa;
	global.myconsole = myconsole;

}(window));
