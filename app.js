
//Connect to the redis worker database
RedisSMQ = require("rsmq");
rsmq = new RedisSMQ( {host: "127.0.0.1", port: 6379, ns: "workers"} );

rsmq.createQueue({qname:"Work"}, function (err, resp) {
    //Lets Create Some Workers
    var Str = "This is file #";
    var obj;

    for(var i = 1; i<=1000; i++){
        obj = {
            body : Str+i
        }
        rsmq.sendMessage({qname:"Work", message:JSON.stringify(obj)}, function(err, resp){
            if(err){
                console.log("Error Creating Message: " + err);
            }
        });
    }
    console.log("Messages created");
});


