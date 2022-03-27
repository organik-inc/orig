const Fastify = require("fastify");
const fastify = Fastify();
const { v4: uuidv4 } = require('uuid');
const { exec } = require('child_process');
const LitJsSdk = require('lit-js-sdk')

const fs = require("fs");
const os = require("os");
const path = require("path");

const envFilePath = path.resolve(__dirname, ".env");

const axios = require("axios");

const apiInstance = axios.create({
  baseURL: "https://livepeer.com/api",
  timeout: 10000,
});

const createStream = async (apiKey) => {
  return apiInstance.post(
    "/stream",
    {
      name: "0xrig_stream",
      profiles: [
        {
          name: "720p",
          bitrate: 2000000,
          fps: 30,
          width: 1280,
          height: 720,
        },
        {
          name: "480p",
          bitrate: 1000000,
          fps: 30,
          width: 854,
          height: 480,
        },
        {
          name: "360p",
          bitrate: 500000,
          fps: 30,
          width: 640,
          height: 360,
        },
      ],
    },
    {
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
    }
  );
};

const getStreams = async (
    apiKey,
    active
  ) => {
    return apiInstance.get(`/stream?streamsonly=1&filters=[{"id":"isActive","value":${(+!!active)?'true':'false'}}]`, {
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
    });
  };

const getStreamStatus = async (
  apiKey,
  streamId
) => {
    console.log(apiKey, streamId)
  return apiInstance.get(`/stream/${streamId}`, {
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
  });
};

// read .env file & convert to array
const readEnvVars = () => fs.readFileSync(envFilePath, "utf-8").split(os.EOL);

/**
 * Finds the key in .env files and returns the corresponding value
 *
 * @param {string} key Key to find
 * @returns {string|null} Value of the key
 */
const getEnvValue = (key) => {
  // find the line that contains the key (exact match)
  const matchedLine = readEnvVars().find((line) => line.split("=")[0] === key);
  // split the line (delimiter is '=') and return the item at index 2
  return matchedLine !== undefined ? matchedLine.split("=")[1] : null;
};

/**
 * Updates value for existing key or creates a new key=value line
 *
 * This function is a modified version of https://stackoverflow.com/a/65001580/3153583
 *
 * @param {string} key Key to update/insert
 * @param {string} value Value to update/insert
 */
const setEnvValue = (key, value) => {
  const envVars = readEnvVars();
  const targetLine = envVars.find((line) => line.split("=")[0] === key);
  if (targetLine !== undefined) {
    // update existing line
    const targetLineIndex = envVars.indexOf(targetLine);
    // replace the key/value with the new value
    envVars.splice(targetLineIndex, 1, `${key}=${value}`);
  } else {
    // create new key value
    envVars.push(`${key}=${value}`);
  }
  // write everything back to the file system
  fs.writeFileSync(envFilePath, envVars.join(os.EOL));
};

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

fastify.get('/verify', async function(req, reply){
    var jwt = req.query.jwt
    const { verified, header, payload } = LitJsSdk.verifyJwt({ jwt })
    if(req.query.callback !== undefined && req.query.callback !== 'undefined'){
        reply.send(`${req.query.callback}(${JSON.stringify({
            type: "GET",
            callback: req.query.callback,
            data: { verified, header, payload },
            userAgent: req.headers["user-agent"]
        })})`);
    }else{
        reply.send({
            type: "GET",
            data: { verified, header, payload },
            userAgent: req.headers["user-agent"]
        });
    }
})

fastify.get('/account', async function(req, reply){
    
    const ls = exec('npm run 0xrig:get-account', function (error, stdout, stderr) {
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

fastify.get('/newLENS', async function(req, reply){
    
    if(req.query.at !== undefined && req.query.at !== 'undefined'){
        setEnvValue('W', req.query.at)
    }else{
        setEnvValue('W', new Date().getTime().toString())
    }
    const ls = exec('npm run 0xrig:create-profile', function (error, stdout, stderr) {
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

fastify.get('/posts', async function(req, reply){
    
    const ls = exec('npm run publications:get-publications', function (error, stdout, stderr) {
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

fastify.get('/getPost', async function(req, reply){
    if(req.query.id !== undefined && req.query.id !== 'undefined'){
        setEnvValue('W', req.query.id)
    }else{
        setEnvValue('W', 'self')
    }
    const ls = exec('npm run 0xrig:get-post', function (error, stdout, stderr) {
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

fastify.get('/get0xRig', async function(req, reply){
    
    if(req.query.id !== undefined && req.query.id !== 'undefined'){
        setEnvValue('W', req.query.id)
    }else{
        setEnvValue('W', getEnvValue('PROFILE_ID'))
    }
    /** */
    const ls = exec('npm run 0xrig:get-publications', function (error, stdout, stderr) {
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
      // setEnvValue('W', JSON.stringify({empty:true}))
      ls.on('exit', function (code) {
        console.log('Child process exited with exit code ' + code);
      });
      /** */
    
})

fastify.get('/post0xRig', async function(req, reply){

    setEnvValue('W', JSON.stringify(
        {
            version: '1.0.0',
            metadata_id: uuidv4(),
            description: '0xRig Registration',
            content: 'My 0xRig is now active.',
            external_url: null,
            image: 'https://bafybeifjth5xqdi3a2ocj75732rsjfd3lred2yf3gqfxt3dc6mis7sxuu4.ipfs.dweb.link/0xRig-Logo.png',
            imageMimeType: 'image/png',
            name: '0xRig',
            attributes: [],
            media: [
                {
                item: 'https://bafybeifjth5xqdi3a2ocj75732rsjfd3lred2yf3gqfxt3dc6mis7sxuu4.ipfs.dweb.link/0xRig-Logo.png',
                type: 'image/png',
                },
            ],
            appId: '0xrig.com',
            }
    ))
    const ls = exec('npm run 0xrig:post-registration', function (error, stdout, stderr) {
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
        // setEnvValue('W', JSON.stringify({empty:true}))
        ls.on('exit', function (code) {
        console.log('Child process exited with exit code ' + code);
        });
    
})

fastify.get('/setProfile', async function(req, reply){
    
    if(req.query.id !== undefined && req.query.id !== 'undefined'){
        if(req.query.callback !== undefined && req.query.callback !== 'undefined'){
            reply.send(`${req.query.callback}(${JSON.stringify({
                type: "GET",
                callback: req.query.callback,
                data: {prev: getEnvValue('PROFILE_ID'), new: req.query.id, results: true},
                userAgent: req.headers["user-agent"]
            })})`);
        }else{
            reply.send({
                type: "GET",
                data: {prev: getEnvValue('PROFILE_ID'), new: req.query.id, results: true},
                userAgent: req.headers["user-agent"]
            });
        }
        console.log(getEnvValue('PROFILE_ID'));
        setEnvValue('PROFILE_ID', req.query.id)
    }else{
        // no ID set.
        if(req.query.callback !== undefined && req.query.callback !== 'undefined'){
            reply.send(`${req.query.callback}(${JSON.stringify({
                type: "GET",
                callback: req.query.callback,
                data: {error:true, code:"id is not set"},
                userAgent: req.headers["user-agent"]
            })})`);
        }else{
            reply.send({
                type: "GET",
                data: {error:true, code:"id is not set"},
                userAgent: req.headers["user-agent"]
            });
        }
    }
    
})

fastify.get('/getProfile', async function(req, reply){
    
    if(req.query.id !== undefined && req.query.id !== 'undefined'){
        if(req.query.method !== undefined && req.query.method !== 'undefined'){
            if(req.query.method !== 'handle'){
                if(req.query.method !== 'owner'){
                    setEnvValue('W', JSON.stringify({
                        profileIds: [req.query.id]
                    }))
                }else{
                    setEnvValue('W', JSON.stringify({
                        ownedBy: [req.query.id]
                    }))
                }
            }else{
                setEnvValue('W', JSON.stringify({
                    handles: [req.query.id]
                }))
            }
        }else{
            setEnvValue('W', 'self')
        }
    }else{
        setEnvValue('W', 'self')
    }
    /** */
    const ls = exec('npm run 0xrig:get-profile', function (error, stdout, stderr) {
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
      // setEnvValue('W', JSON.stringify({empty:true}))
      ls.on('exit', function (code) {
        console.log('Child process exited with exit code ' + code);
      });
      /** */
    
})

fastify.get('/follow', async function(req, reply){
    
    if(req.query.id !== undefined && req.query.id !== 'undefined'){
        setEnvValue('W', req.query.id)
        /** */
    const ls = exec('npm run 0xrig:follow-profile', function (error, stdout, stderr) {
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
      // setEnvValue('W', JSON.stringify({empty:true}))
      ls.on('exit', function (code) {
        console.log('Child process exited with exit code ' + code);
      });
      /** */
    }else{
        // Error Return.
        if(req.query.callback !== undefined && req.query.callback !== 'undefined'){
            reply.send(`${req.query.callback}(${JSON.stringify({
                type: "GET",
                callback: req.query.callback,
                data: false,
                error: 'Mising Profile ID',
                userAgent: req.headers["user-agent"]
            })})`);
        }else{
            reply.send({
                type: "GET",
                data: false,
                error: 'Mising Profile ID',
                userAgent: req.headers["user-agent"]
            });
        }
    }
    
})

fastify.get('/following', async function(req, reply){
    if(req.query.limit !== undefined && req.query.limit !== 'undefined' && req.query.limit >= 1){
        setEnvValue('W', req.query.limit)
    }else{
        setEnvValue('W', 10)
    }
    /** */
    const ls = exec('npm run 0xrig:following', function (error, stdout, stderr) {
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
    // setEnvValue('W', JSON.stringify({empty:true}))
    ls.on('exit', function (code) {
    console.log('Child process exited with exit code ' + code);
    });
    /** */
    
})

fastify.get('/followers', async function(req, reply){
    if(req.query.limit !== undefined && req.query.limit !== 'undefined' && req.query.limit >= 1){
        setEnvValue('W', req.query.limit)
    }else{
        setEnvValue('W', 10)
    }
    /** */
    const ls = exec('npm run 0xrig:followers', function (error, stdout, stderr) {
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
    // setEnvValue('W', JSON.stringify({empty:true}))
    ls.on('exit', function (code) {
    console.log('Child process exited with exit code ' + code);
    });
    /** */
    
})

fastify.get('/stream', async function(req, reply){
    if(req.query.id !== undefined && req.query.id !== 'undefined'){
        if(req.query.id !== 'new'){
            // Find Stream Info
            var liveAPI = getEnvValue('LIVE_PEER_API_KEY');
            var stream = await getStreamStatus(liveAPI, req.query.id)
            if(stream !== false){
                if(req.query.callback !== undefined && req.query.callback !== 'undefined'){
                    reply.send(`${req.query.callback}(${JSON.stringify({
                        type: "GET",
                        callback: req.query.callback,
                        data: stream.data,
                        results: true,
                        userAgent: req.headers["user-agent"]
                    })})`);
                }else{
                    reply.send({
                        type: "GET",
                        data: stream.data,
                        results: true,
                        userAgent: req.headers["user-agent"]
                    });
                }
            }else{
                if(req.query.callback !== undefined && req.query.callback !== 'undefined'){
                    reply.send(`${req.query.callback}(${JSON.stringify({
                        type: "GET",
                        callback: req.query.callback,
                        data: false,
                        results: false,
                        userAgent: req.headers["user-agent"]
                    })})`);
                }else{
                    reply.send({
                        type: "GET",
                        data: false,
                        results: false,
                        userAgent: req.headers["user-agent"]
                    });
                }
            }
        }else{
            // Create Stream.
            var liveAPI = getEnvValue('LIVE_PEER_API_KEY')
            var stream = await createStream(liveAPI)
            if(stream !== false){
                if(req.query.callback !== undefined && req.query.callback !== 'undefined'){
                    reply.send(`${req.query.callback}(${JSON.stringify({
                        type: "GET",
                        callback: req.query.callback,
                        data: stream.data,
                        results: true,
                        userAgent: req.headers["user-agent"]
                    })})`);
                }else{
                    reply.send({
                        type: "GET",
                        data: stream.data,
                        results: true,
                        userAgent: req.headers["user-agent"]
                    });
                }
            }else{
                if(req.query.callback !== undefined && req.query.callback !== 'undefined'){
                    reply.send(`${req.query.callback}(${JSON.stringify({
                        type: "GET",
                        callback: req.query.callback,
                        data: false,
                        results: false,
                        userAgent: req.headers["user-agent"]
                    })})`);
                }else{
                    reply.send({
                        type: "GET",
                        data: false,
                        results: false,
                        userAgent: req.headers["user-agent"]
                    });
                }
            }
        }
    }else{
        if(req.query.callback !== undefined && req.query.callback !== 'undefined'){
            reply.send(`${req.query.callback}(${JSON.stringify({
                type: "GET",
                callback: req.query.callback,
                data: false,
                results: false,
                userAgent: req.headers["user-agent"]
            })})`);
        }else{
            reply.send({
                type: "GET",
                data: false,
                results: false,
                userAgent: req.headers["user-agent"]
            });
        }
    }
    
})

fastify.get('/streams', async function(req, reply){
    if(req.query.status !== undefined && req.query.status !== 'undefined'){
        var liveAPI = getEnvValue('LIVE_PEER_API_KEY');
        var status = req.query.status == 'active' ? true : false;
        var stream = await getStreams(liveAPI, status)
        if(stream !== false){
            if(req.query.callback !== undefined && req.query.callback !== 'undefined'){
                reply.send(`${req.query.callback}(${JSON.stringify({
                    type: "GET",
                    callback: req.query.callback,
                    data: stream.data,
                    results: true,
                    userAgent: req.headers["user-agent"]
                })})`);
            }else{
                reply.send({
                    type: "GET",
                    data: stream.data,
                    results: true,
                    userAgent: req.headers["user-agent"]
                });
            }
        }else{
            if(req.query.callback !== undefined && req.query.callback !== 'undefined'){
                reply.send(`${req.query.callback}(${JSON.stringify({
                    type: "GET",
                    callback: req.query.callback,
                    data: false,
                    results: false,
                    userAgent: req.headers["user-agent"]
                })})`);
            }else{
                reply.send({
                    type: "GET",
                    data: false,
                    results: false,
                    userAgent: req.headers["user-agent"]
                });
            }
        }
    }else{
        if(req.query.callback !== undefined && req.query.callback !== 'undefined'){
            reply.send(`${req.query.callback}(${JSON.stringify({
                type: "GET",
                callback: req.query.callback,
                data: false,
                results: false,
                userAgent: req.headers["user-agent"]
            })})`);
        }else{
            reply.send({
                type: "GET",
                data: false,
                results: false,
                userAgent: req.headers["user-agent"]
            });
        }
    }
}
)

fastify.get('/livepeer', async function(req, reply){
    
    const lpApiKey = getEnvValue('LIVE_PEER_API_KEY');
    if(req.query.callback !== undefined && req.query.callback !== 'undefined'){
        reply.send(`${req.query.callback}(${JSON.stringify({
            type: "GET",
            callback: req.query.callback,
            data: {results: (lpApiKey !== 'LIVE_PEER') ? true : false },
            userAgent: req.headers["user-agent"]
        })})`);
    }else{
        reply.send({
            type: "GET",
            data: {results: (lpApiKey !== 'LIVE_PEER') ? true : false },
            userAgent: req.headers["user-agent"]
        });
    }
    
})

fastify.get('/livepeerSetup', async function(req, reply){
    
    if(req.query.id !== undefined && req.query.id !== 'undefined'){
        // const lpApiKey = getEnvValue('LIVE_PEER_API_KEY');
        if(req.query.callback !== undefined && req.query.callback !== 'undefined'){
            reply.send(`${req.query.callback}(${JSON.stringify({
                type: "GET",
                callback: req.query.callback,
                data: {results: true},
                userAgent: req.headers["user-agent"]
            })})`);
        }else{
            reply.send({
                type: "GET",
                data: {results: true},
                userAgent: req.headers["user-agent"]
            });
        }
        setEnvValue('LIVE_PEER_API_KEY', req.query.id)
    }else{
        // no ID set.
        if(req.query.callback !== undefined && req.query.callback !== 'undefined'){
            reply.send(`${req.query.callback}(${JSON.stringify({
                type: "GET",
                callback: req.query.callback,
                data: {results:false, error:true, code:"Livepeer API Key is not set"},
                userAgent: req.headers["user-agent"]
            })})`);
        }else{
            reply.send({
                type: "GET",
                data: {results:false, error:true, code:"Livepeer API Key is not set"},
                userAgent: req.headers["user-agent"]
            });
        }
    }
    
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