(function(){
    var milkcocoa = new MilkCocoa("hogehoge", 'pub-c-3110c846-acee-4a93-b334-605c31524237', 'sub-c-8472c902-d950-11e4-895c-02ee2ddab7fe');
    var ds = milkcocoa.dataStore("hoge");
    console.log('==========');
    var pushInput = document.getElementById("push");
    var setInput = document.getElementById("set");
    var sendInput = document.getElementById("send");
    var removeInput = document.getElementById("remove");

    ds.on("push", function(err, data){
        //console.log(data);
    });
    ds.on("set", function(err, data){
        console.log(data);
    });
    ds.on("send", function(err, data){
        console.log(data);
    });
    ds.on("remove", function(err, data){
        console.log(data);
    });

    /*
    var cb = function(){};
    //ds.off("push", cb);
    ds.off("set", cb);
    ds.off("send", cb);
    ds.off("remove", cb);
    */

    pushInput.addEventListener("keypress", function(e){
        if(e.keyCode == 13) ds.push({data: pushInput.value});
    });
    setInput.addEventListener("keypress", function(e){
        if(e.keyCode == 13) ds.set(setInput.value,{data: "hoge"});
    });
    sendInput.addEventListener("keypress", function(e){
        if(e.keyCode == 13) ds.send({data: sendInput.value});
    });
    removeInput.addEventListener("keypress", function(e){
        if(e.keyCode == 13) ds.remove(removeInput.value);
    });

    ds.query().done(function(data){
        console.log(data);
    });
}());
