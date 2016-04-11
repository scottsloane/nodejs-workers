# nodejs-workers
This is a simple test of nodejs clustering with a Redis backed worker queue

## Installation
Copy both js files to a dir.
Create a subdirectory named "./temp/"
use npm to install rsmq

## Usage
Run the worker first "node worker.js"
In seperate terminal run app "node app.js"
I like to demonstrate this code with "top -u username -d 0.5" (1)

## Desctiption
### App.js
Runs a loop to create 1000 jobs to create files

### Worker.js
Master:
Spawns new forks of workers if there is work to be done
Restarts workers if there is still work to be done

Slave:
Accepts jobs and creates a file
