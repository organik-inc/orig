const Fastify = require("fastify");
const fastify = Fastify();

const { exec } = require('child_process');

fastify.register(require('fastify-cors'), { 
    // I don't even think this works
    origin: true
})  

function isJson(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}

fastify.register(require('fastify-formbody'));
fastify.post('/', async function(req, reply){
    reply.send({
        type: "POST",
        data: req.body,
        userAgent: req.headers["user-agent"]
    })
})
fastify.get('/', async function(req, reply){
    
    const ls = exec('npm run profile:get-profiles', function (error, stdout, stderr) {
        if (error) {
          console.log(error.stack);
          console.log('Error code: ' + error.code);
          console.log('Signal received: ' + error.signal);
        }
        console.log('Child Process STDOUT: ' + stdout);
        console.log('Child Process STDERR: ' + stderr);

        var lines = stdout.split("\n")
        var aux = []
        var flag = false
        lines.map((line)=>{
            console.log(line)
            if(line !== ''){
                if(+!!flag){
                    // aux.push( (isJson(line)) ? JSON.parse(line) : line )
                    aux = (isJson(line)) ? JSON.parse(line) : line ;
                    if(isJson(line)){
                        aux.results = true
                    }
                }
                if(line == '0xRig:result'){
                    flag = true;
                }
            }
        })
        if(aux.length <= 0){
            aux = {results:false}
        }
        if(req.query.callback !== undefined && req.query.callback !== 'undefined'){
            reply.send(`${req.query.callback}(${JSON.stringify({
                type: "GET",
                callback: req.query.callback,
                data: aux,
                userAgent: req.headers["user-agent"]
            })})`);
        }else{
            reply.send({
                type: "GET",
                data: aux,
                userAgent: req.headers["user-agent"]
            });
        }
      });
      
      ls.on('exit', function (code) {
        console.log('Child process exited with exit code ' + code);
      });
    
})
fastify.listen(3000, (err) => {
    if(err) throw err;
    console.log(`server listening on ${fastify.server.address().port}`)
})