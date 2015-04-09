(function(global){

    function MilkCocoa() {
        this.pubnub = PUBNUB.init({
            publish_key: 'pub-c-3110c846-acee-4a93-b334-605c31524237',
            subscribe_key: 'sub-c-8472c902-d950-11e4-895c-02ee2ddab7fe'
        });
    }

    MilkCocoa.prototype.dataStore = function(path) {
        return new DataStore(this, path);
    }

    function DataStore(milkcocoa, path) {
        this.parent = milkcocoa;
        this.path = path;
    }

    DataStore.prototype.send = function(params) {
        var milkcocoa = this.parent;
        var self = this;
        milkcocoa.pubnub.publish({channel : self.path, message : params});
    }

    DataStore.prototype.on = function(event, cb) {
        var milkcocoa = this.parent;
        var self = this;
        if(event == "send") {
            milkcocoa.pubnub.subscribe({
                channel : self.path,
                message : function(data){ cb(data); },
                error : function(error){ cb(null); }
            });
        }
    }

    DataStore.prototype.logs = function(num, cb) {
        var milkcocoa = this.parent;
        var self = this;

        milkcocoa.pubnub.history({
            channel : self.path,
            count : num,
            callback : cb
        });
    }

    global.MilkCocoa = MilkCocoa;

}(window));
