//TODO: limpiar codigo
//TODO: descargar mongolian de git porque el codigo de npm no esta actualizado
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
app.use(express.static(__dirname + '/static'));
app.set('views', __dirname + '/views');
app.engine('html', require('ejs').renderFile);

app.get('/',function(req,res){
	res.render('main.html');
});


//Estructura de los votos y departamentos
var votos = [{	"key" : "Cuenta de Votos",
		"values" : []
	    }];

var deptos = [];

//carga los departamentos
collection.group({ns:"votos",
		  key:{Location:1},
		  initial:{},
		  $reduce:function(curr,result){}}, 
		  function(error,post){
			deptos = post.retval;
		  }
);

//carga los partidos y su cuenta de votos
collection.group({ns:"votos",
		key:{"candidato.partido":1},
		initial:{total:0},
		$reduce:function(curr,result){result.total+=1;}}, 
		function(error,post){
			for(var i=0;i<post.retval.length;i++){
				votos[0].values.push({"label":post.retval[i]['candidato.partido'],"value":post.retval[i].total});
			}
		  }
);


io.sockets.on('connection', function(socket){
	var depto;
	
	//A los nuevos usuarios les envia todos los datos previamente cargados
	socket.emit('connect',votos,deptos);
	
	var interval = setInterval(function(){
		//Enviar unicamente cuando encuentre cambios en la base de datos, revisa cada segundo
		//Se envia el nombre del partido y el numero de votos
		//TODO: no actualiza todos los partidos, cambia variable global para todos los clientes.
		if(depto){
			collection.group({ns:"votos",
				key:{"candidato.partido":1},
				initial:{total:0},
				cond:{"Location":depto},
				$reduce:function(curr,result){result.total+=1;}}, 
				function(error,post){
					for(var i = 0;i<post.retval.length;i++){
						for(var j=0;j<votos[0].values.length;j++){
							if(votos[0].values[j].label == post.retval[i]['candidato.partido']){
								if(votos[0].values[j].value != post.retval[i].total){
									votos[0].values[j].value = post.retval[i].total;
									socket.volatile.emit('update',post.retval[i]['candidato.partido'],post.retval[i].total);	
								}
								break;
							}
						}
					}
				}
			);
		}else{
			collection.group({ns:"votos",
				key:{"candidato.partido":1},
				initial:{total:0},
				$reduce:function(curr,result){result.total+=1;}}, 
				function(error,post){
					for(var i = 0;i<post.retval.length;i++){
						for(var j=0;j<votos[0].values.length;j++){
							if(votos[0].values[j].label == post.retval[i]['candidato.partido']){
								if(votos[0].values[j].value != post.retval[i].total){
									votos[0].values[j].value = post.retval[i].total;
									socket.volatile.emit('update',post.retval[i]['candidato.partido'],post.retval[i].total);	
								}
								break;
							}
						}
					}
				}
			);
		}

	}, 1000);

	socket.on('disconnect', function () {
		clearInterval(interval);
	});

	//recibe del usuario el departamento
	socket.on('departamento', function(data){
		depto = data.depto;
	});

});

server.listen(8080);
