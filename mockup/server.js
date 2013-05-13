var express = require('express')
//	,mongolian = require("mongolian")
	,http = require('http')
	,app = express()
	,server = http.createServer(app)
	,io = require('socket.io').listen(server)
	// Deberia ser reemplazado con datos reales jalados de la DB.
	,votos = require('./data.json');

//var mongolianServer = new mongolian;

app.set("view options", {layout: false});
app.use(express.static(__dirname + '/static'));
app.set('views', __dirname + '/views');
app.engine('html', require('ejs').renderFile);

app.get('/',function(req,res){
	res.render('main.html');
});

io.sockets.on('connection', function(socket){
	//A los nuevos usuarios les envia todos los datos previamente cargados,
	//los datos se leen desde la base de datos
	socket.emit('connect',votos);

	var i = 0;
	setInterval(function(){
		//TODO: Enviar unicamente cuando encuentre cambios en la base de datos
		//Actualizar data.json si existen cambios
		//Se envia el nombre del partido y el numero de votos
		socket.emit('update', 'PP' , ++i);
	}, 1000);
});

server.listen(8080);
