(function(){
    var milkcocoa = new MilkCocoa("hogehoge", 'pub-c-3110c846-acee-4a93-b334-605c31524237', 'sub-c-8472c902-d950-11e4-895c-02ee2ddab7fe');
    var ds = milkcocoa.dataStore("hoge");
    var pushInput = document.getElementById("push");
    var setInput = document.getElementById("set");
    var sendInput = document.getElementById("send");
    var removeInput = document.getElementById("remove");

    ds.on("push", function(err, data){
        console.log(data);
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
    var cb = function(dataSnapshot){ console.log(dataSnapshot) };
    var setcb = function(dataSnapshot, prevSnapshot){ console.log(dataSnapshot, prevSnapshot) };
    //ds.off("push", cb);
    //ds.off("set", setcb); // offsetだけおかしい
    //ds.off("send", cb);
    //ds.off("remove", cb);
    */

    pushInput.addEventListener("keypress", function(e){
        if(e.keyCode == 13) ds.push({data: pushInput.value});
    });
    setInput.addEventListener("keypress", function(e){
        if(e.keyCode == 13) ds.set(setInput.value,{data: setInput.value});
    });
    sendInput.addEventListener("keypress", function(e){
        if(e.keyCode == 13) ds.send({data: sendInput.value});
    });
    removeInput.addEventListener("keypress", function(e){
        if(e.keyCode == 13) ds.remove(removeInput.value);
    });

    ds.query({}).limit(6).done(function(data){
        data.forEach(function(item){
            var p = document.createElement("p");
            p.innerHTML = item.id;
            document.getElementsByTagName("body")[0].appendChild(p);
        });
    });
}());
