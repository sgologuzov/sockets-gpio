const vm = require('vm');
const gpio = require('odroid-gpio');
const express = require('express');  //web server
const sleep = require('sleep');

app = express();
server = require('http').createServer(app);
io = require('socket.io').listen(server);	//web socket server

server.listen(8080); //start the webserver on port 8080
app.use(express.static('public')); //tell the server that ./public/ contains the static webpages

var brightness = 0; //static variable to hold the current brightness

function jsPrint(text) {
    console.log(text);
}

function setDiagramPin(channel, value) {
    gpio.write(channel, value, function(err) {
        if (err) throw err;
        console.log('Written to pin');
    });
}

function delayMs(value) {
    sleep.msleep(value);
}

const sandbox = {
    jsPrint: jsPrint,
    setDiagramPin: setDiagramPin,
    delayMs: delayMs
};

io.sockets.on('connection', function (socket) { //gets called whenever a client connects
    socket.emit('led', {value: brightness}); //send the new client the current brightness

    socket.on('led', function (data) { //makes the socket react to 'led' packets by calling this function
        brightness = data.value;  //updates brightness from the data object
        console.log("brightness= " + brightness);
        io.sockets.emit('led', {value: brightness}); //sends the updated brightness to all connected clients
    });

    socket.on("javascript_code", function(data) {
        console.log("javascript_code= " + data);
        var script = new vm.Script(data, { filename: 'javascript_code.vm' });
        script.runInNewContext(sandbox);
    });
});