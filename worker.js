

//Connect to the redis worker database
var cluster = require('cluster');
var maxThreads = 32;
var currentThreads = 0;

var checkForNewJobs;

RedisSMQ = require("rsmq");
rsmq = new RedisSMQ( {host: "127.0.0.1", port: 6379, ns: "workers"} );

var fs = require('fs');

Array.prototype.contains = function(element){
    return this.indexOf(element) > -1;
};

if(cluster.isMaster){
    //Spawn up initial threads
    for(var i = 0; i < maxThreads; i++){
        cluster.fork();
    }

    cluster.on('online', function(worker) {
        currentThreads++;
    });
    cluster.on('exit', function(worker, code, signal) {
        //exit code
        currentThreads--;

        _checkForNewJobs(function(err, result){
           if(result){

           }else{
               if (currentThreads === 0) checkForNewJobs = setInterval(function(){
                   _checkForNewJobs(function (err, result){
                       if(result){
                           console.log("New Jobs have been discovered");
                           clearTimeout(checkForNewJobs);
                           for(var i = 0; i < maxThreads; i++){
                               cluster.fork();
                           }
                       }
                   })
               }, 1500)
           }

        });

        rsmq.getQueueAttributes({qname:"Work"}, function(err, resp){
           if(resp.msgs > 0 && currentThreads < maxThreads){
               cluster.fork();
           }else{
               if(currentThreads === 0){
                   //The work queue is complete: Start a timer to check for changes
                   console.log('All Jobs Completed');
               }
           }
        });
    });

}else {

    rsmq.listQueues(function (err, resp) {

        if (resp.contains('Work')) {

            rsmq.receiveMessage({qname: "Work", vt: 1000}, function (err, resp) {

                    if (resp.id) {
                        //We have work to do

                        if (resp.rc > 5) {
                            //The message has been viewed 5 times but has yet to be deleted
                            rsmq.deleteMessage({qname: "Work", id: resp.id});
                        } else {
                            doWork(resp, function (err, job) {
                                if (!err) {
                                    //The message was processed
                                    rsmq.deleteMessage({qname: "Work", id: job.id});
                                    process.exit(0);
                                } else {
                                    //Processing of this message has failed
                                    process.exit(1);
                                }
                            });
                        }
                    } else {
                        //No work is available
                        process.exit(0);
                    }

                }
            );
        }
    });
}

function doWork(job, callback){

    var message = JSON.parse(job.message);
    var id = job.id;

    fs.writeFile("./temp/"+id+".txt", message.body, 'utf8', function(err) {
        if(err) {
            callback(err, null);
        }
    });

    callback(false, job);
}

function _checkForNewJobs(callback){

    rsmq.getQueueAttributes({qname:"Work"}, function(err, resp){
        if(resp.msgs > 0 && currentThreads < maxThreads){
            callback(false, true);
        }else{
            callback(false, false);
        }
    });
}