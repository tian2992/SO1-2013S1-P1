//TODO: ordenar y optimizar codigo
//TODO: descargar mongolian de github porque el codigo de npm no esta actualizado
var express = require('express')
	,mongolian = require("mongolian")
	,http = require('http')
	,app = express()
	,server = http.createServer(app)
	,io = require('socket.io').listen(server)
	//,votos = require('./data.json')
	;

var mongolianServer = new mongolian("localhost");
var db = mongolianServer.db("proyecto");
var collection = db.collection("votos");

app.set("view options", {layout: false});
app.use(express.static(__dirname + '/static'));
app.set('views', __dirname + '/views');
app.engine('html', require('ejs').renderFile);

//To parse json
app.use(express.bodyParser());

app.get('/',function(req,res){
	res.render('main.html');
});

app.post('/vote', function(req,res){
    console.log(req.body);
    collection.insert(req.body);
    res.send(req.body);
});

//Estructura de los votos y departamentos
var votos = [{	"key" : "Total",
		"values" : []
	    }];
var deptos = [];

//carga los departamentos
collection.group({ns:"votos",
	  key:{Location:1},
	  initial:{},
	  $reduce:function(curr,result){}},
	  function(error,post){
		for(var i=0;i<post.retval.length;i++){
			votos.push({"key":post.retval[i].Location, "values":[]});
			deptos.push(post.retval[i].Location);
		}
	  }
);

//carga los partidos y su cuenta de votos total
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

//carga los partidos y su cuenta de votos por departamento
collection.group({ns:"votos",
	key:{"candidato.partido":1,"Location":1},
	initial:{total:0},
	$reduce:function(curr,result){result.total+=1;}},
	function(error,post){
		for(var i=0;i<post.retval.length;i++){
			for(var j=0;j<votos.length;j++){
				if(votos[j].key == post.retval[i].Location){
					votos[j].values.push({"label":post.retval[i]['candidato.partido'],"value":post.retval[i].total});
					break;
				}
			}
		}
	  }
);


//Actualiza variables con datos de la base de datos, cada segundo
var interval = setInterval(function(){
	//actualiza los partidos y su cuenta de votos total
	collection.group({ns:"votos",
		key:{"candidato.partido":1},
		initial:{total:0},
		$reduce:function(curr,result){result.total+=1;}},
		function(error,post){
			for(var i=0;i<post.retval.length;i++){
				var partidoEncontrado = false;
				for(var j=0;j<votos[0].values.length;j++){
					if(votos[0].values[j].label == post.retval[i]['candidato.partido']){
						votos[0].values[j].value = post.retval[i].total;
						partidoEncontrado = true;
						break;
					}
				}
				if(!partidoEncontrado){
					votos[0].values.push({"label":post.retval[i]['candidato.partido'],"value":post.retval[i].total});
				}
			}
		  }
	);

	//actualiza los partidos y su cuenta de votos por departamento
	collection.group({ns:"votos",
		key:{"candidato.partido":1,"Location":1},
		initial:{total:0},
		$reduce:function(curr,result){result.total+=1;}},
		function(error,post){
			for(var i=0;i<post.retval.length;i++){
				var deptoEncontrado = false;
				for(var j=0;j<votos.length;j++){
					if(votos[j].key == post.retval[i].Location){
						var partidoEncontrado = false;
						for(var k=0;k<votos[j].values.length;k++){
							if(votos[j].values[k].label == post.retval[i]['candidato.partido']){
								votos[j].values[k].value = post.retval[i].total;
								partidoEncontrado = true;
								break;
							}
						}
						if(!partidoEncontrado){
							votos[j].values.push({"label":post.retval[i]['candidato.partido'],"value":post.retval[i].total});
						}
						deptoEncontrado = true;
						break;
					}
				}
				if(!deptoEncontrado){
					deptos.push(post.retval[i].Location);
					votos.push({"key":post.retval[i].Location,"values":[{"label":post.retval[i]['candidato.partido'],"value":post.retval[i].total}]});
				}
			}
		  }
	);
}, 1000);

io.sockets.on('connection', function(socket){
	var depto;
	//A los nuevos usuarios les envia todos los datos previamente cargados
	socket.emit('connect',[votos[0]],deptos);

	//Cada cierto tiempo envia todos los datos, si el usuario se encuentra viendo un departamento envia datos solo del departamento.
	//var interval = setInterval(function(){
	socket.on('query', function () {
		if(!depto){
			socket.volatile.emit('connect',[votos[0]],deptos);
		}else{
			for(var i=0; i<votos.length; i++){
				if(depto == votos[i].key){
					socket.volatile.emit('connect',[votos[i]],deptos);
				}
			}
		}
	//}, 1000);
	});

	socket.on('disconnect', function () {
		clearInterval(interval);
	});

	//recibe del usuario el departamento
	socket.on('departamento', function(data){
		depto = data.depto;
	});

});

server.listen(8000);
