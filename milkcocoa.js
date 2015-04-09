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
        this.client = {};
        this.client.firebase = new Firebase("https://"+firebase_id+".firebaseio.com/");
        this.client.pubnub = PUBNUB.init({
            publish_key: pubnub_pubkey,
            subscribe_key: pubnub_subkey
        });
    }

    MilkCocoa.prototype.addAccount = function(email, password, options, cb) {
        if(options) options = {};
        firebase.createUser({
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
        firebase.authWithPassword({
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

    MilkCocoa.prototype.logout = function() {
        firebase.unauth();
    }

    MilkCocoa.prototype.getCurrentUser = function(cb) {
        var authData = firebase.getAuth();
        if(authData){
            cb(null, authData);
        } else {
            cb(1, null);
        }
    }

    MilkCocoa.prototype.unleash = function(name){
        if(name.toLowerCase() == "pubnub") return this.client.pubnub;
        else if(name.toLowerCase() == "firebase") return this.client.firebase;
        else throw "invalid unleash keyword";
    }

    MilkCocoa.prototype.dataStore = function(path) {
        return new DataStore(this, path);
    }

    /*
     * DataStore
     */
    function DataStore(milkcocoa, path) {
        if(path.length < 1) throw "invalid path";
        this.milkcocoa = milkcocoa;
        this.firebase = this.milkcocoa.client.firebase;
        this.pubnub = this.milkcocoa.client.pubnub;
        this.path = path;
        this.onCallbacks = {};
        this.onCallbacks[this.path] = {};
    }

    DataStore.prototype.push = function(params, cb) {
        if(this.path == "/") throw "Can't execute I/O to root.";
        if(params.hasOwnProperty("id")) throw "push value cannot have id";
        params._type = "push";
        var self = this;
        var pushedDS = this.firebase.child(self.path).push();
        params.id = pushedDS.toString();

        pushedDS.set(params);
        if(cb) cb(params);
    }

    DataStore.prototype.set = function(id, params, cb) {
        if(this.path == "/") throw "Can't execute I/O to root.";
        if(params == null || params.hasOwnProperty("id")) throw "invalid argument";
        params._type = "set";
        params.id = id;

        var self = this;
        this.firebase.child(self.path+"/"+id).set(params);
        if(cb) cb(params);
    }

    DataStore.prototype.send = function(params, cb) {
        if(this.path == "/") throw "Can't execute I/O to root.";
        params._type = "send";
        params._date = Date.now();

        var self = this;
        this.pubnub.publish({channel : self.path, message : params});
        if(cb) cb(params);
    }

    DataStore.prototype.remove = function(id, cb) {
        if(this.path == "/") throw "Can't execute I/O to root.";

        var self = this;
        if(cb) this.firebase.child(self.path+"/"+id).remove(cb);
        else this.firebase.child(self.path+"/"+id).remove();
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
            this.pubnub.subscribe({
                channel : self.path,
                message : function(data){ cb(data); },
                error : function(error){ cb(null); }
            });
        } else if (event == "push") {
            self.onCallbacks[self.path][event] = this.firebase.child(self.path).on("child_added", function(childSnapshot){
                var obj = {};
                obj.id = childSnapshot.key();
                obj.value = childSnapshot.val();

                if(obj.value._type == event){
                    cb(null, obj);
                } else if (obj.value.hasOwnProperty("_type")){
                    console.log("query");
                }
            });
        } else if (event == "set") {
            self.onCallbacks[self.path][event] = {};
            self.onCallbacks[self.path][event]["added"] = this.firebase.child(self.path).on("child_added", function(childSnapshot, prevChildName){
                var obj = {};
                obj.id = childSnapshot.key();
                obj.value = childSnapshot.val();

                if(obj.value._type == event){
                    cb(null, obj);
                } else if (obj.value.hasOwnProperty("_type")){
                    console.log("query");
                }
            });
            self.onCallbacks[self.path][event]["changed"] = this.firebase.child(self.path).on("child_changed", function(childSnapshot, prevChildName){
                var obj = {};
                obj.id = childSnapshot.key();
                obj.value = childSnapshot.val();

                if(obj.value._type == event){
                    cb(null, obj);
                } else if (obj.value.hasOwnProperty("_type")){
                    console.log("query");
                }
            });
        } else if (event == "remove") {
            self.onCallbacks[self.path][event] = this.firebase.child(self.path).on("child_removed", function(oldChildSnapshot){
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
            this.pubnub.unsubscribe({ channel : self.path });
        } else if (event == "push") {
            this.firebase.child(self.path).off("child_added", self.onCallbacks[self.path][event]);
        } else if (event == "set") {
            this.firebase.child(self.path).off("child_added", self.onCallbacks[self.path][event]["added"]);
            this.firebase.child(self.path).off("child_changed", self.onCallbacks[self.path][event]["changed"]);
        } else if (event == "remove") {
            this.firebase.child(self.path).off("child_removed", self.onCallbacks[self.path][event]);
        }
        if(cb) cb();
        else return true;
    }

    DataStore.prototype.query = function(obj) {
        if(this.path == "/") throw "Can't execute I/O to root.";
        return new Query(this.firebase, this.path, obj);
    }

    function Query(firebase, path, obj) {
        var self = this;
        if(obj) {
            self.firebase = firebase;
            self.path = path;
            self.query = self.firebase.child(self.path);
        } else {
            throw "no query object";
        }
    }

    Query.prototype.limit = function(i){
        this.query = this.query.limitToFirst(i);
        return this;
    }

    Query.prototype.skip = function(i){
        this.query = this.query.startAt(i, "priority");
        return this;
    }

    Query.prototype.done = function(cb){
        this.query.once("value", function(snap){
            cb(snap.val());
        });
    }

    global.MilkCocoa = MilkCocoa;
    global.myconsole = myconsole;

}(window));
