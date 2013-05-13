var express = require('express')
	,mongolian = require("mongolian")
	,http = require('http')
	,app = express()
	,server = http.createServer(app)
	,io = require('socket.io').listen(server)
	//,votos = require('./data.json')
	;


var mongolianServer = new mongolian;
var db = mongolianServer.db("proyecto");
var collection = db.collection("votos");


app.set("view options", {layout: false});
app.use(express.static(__dirname + '/'));

app.get('/',function(req,res){
	res.render('main.html');
});

//carga los datos de la base de datos a memoria
var 	urng = 0
	,pp = 0
	,lider = 0
	,viva = 0;
var votos = [{	"key" : "Cuenta de Votos",
		"values" : [
		{ "label" : "PP" ,
  		  "value" : pp		} ,
		{ "label" : "URNG" ,
  		  "value" : urng	} ,
		{ "label" : "VIVA" ,
  		  "value" : viva	} ,
		{ "label" : "Lider" ,
  		  "value" : lider	}
		]
	    }];

collection.count({"candidato.partido":"URNG"},function(err,post){ urng = post;
collection.count({"candidato.partido":"PP"},function(err,post){ pp = post; 
collection.count({"candidato.partido":"Lider"},function(err,post){ lider = post; 
collection.count({"candidato.partido":"VIVA"},function(err,post){ viva = post; 

votos[0].values[1].value = urng;
votos[0].values[0].value = pp;
votos[0].values[3].value = lider;
votos[0].values[2].value = viva;
}); }); }); });

io.sockets.on('connection', function(socket){
	//A los nuevos usuarios les envia todos los datos previamente cargados
	socket.emit('connect',votos);

	var i = 0;
	var interval = setInterval(function(){
		//TODO: Enviar unicamente cuando encuentre cambios en la base de datos, revisa cada segundo
		//Se envia el nombre del partido y el numero de votos
		collection.count({"candidato.partido":"URNG"},function(err,post){ 
			var $urng = post;
			if(urng != $urng){			
				urng = $urng;
				console.log(urng,$urng);
				votos[0].values[1].value = urng;
				socket.volatile.emit('update', 'URNG' , urng);
			} 
		});
		collection.count({"candidato.partido":"PP"},function(err,post){ 
			var $pp = post;
			if(pp != $pp){			
				pp = $pp;
				votos[0].values[0].value = pp;
				socket.volatile.emit('update', 'PP' , pp);
			} 
		});
		collection.count({"candidato.partido":"Lider"},function(err,post){ 
			var $lider = post;
			if(lider != $lider){			
				lider = $lider;
				votos[0].values[3].value = lider;
				socket.volatile.emit('update', 'Lider' , lider);
			} 
		});
		collection.count({"candidato.partido":"VIVA"},function(err,post){ 
			var $viva = post;
			if(viva != $viva){			
				viva = $viva;
				votos[0].values[2].value = viva;
				socket.volatile.emit('update', 'VIVA' , viva);
			} 
		});
		
	}, 1000);

	socket.on('disconnect', function () {
		clearInterval(interval);
	});

});


server.listen(80);
