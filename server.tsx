const Fastify = require("fastify");
const fastify = Fastify();

const { exec } = require('child_process');

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
        lines.map((line)=>{
            console.log(line)
            if(line !== ''){
                aux.push( (isJson(line)) ? JSON.parse(line) : line )
            }
            
        })

        reply.send({
            type: "GET",
            data: aux,
            userAgent: req.headers["user-agent"]
        })

      });
      
      ls.on('exit', function (code) {
        console.log('Child process exited with exit code ' + code);
      });
    
})
fastify.listen(3000, (err) => {
    if(err) throw err;
    console.log(`server listening on ${fastify.server.address().port}`)
})