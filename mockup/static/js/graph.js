$.getScript("/socket.io/socket.io.js", function(){
	var socket = io.connect('http://localhost');
	
	var votos;

	//Servidor envia senal de conexion unicamente una vez, lee todos los datos y crea la grafica. 
	socket.on('connect', function(ioData){
		votos = ioData;			
		console.log(votos);
		nv.addGraph(function() {
		   var chart = nv.models.discreteBarChart()
		       .x(function(d) { return d.label })
		       .y(function(d) { return d.value })
		       .staggerLabels(true)
		       .tooltips(true)
		       .showValues(true);
		 
			d3.select('#chart svg')
			       .datum(votos)
				.transition().duration(500)
			       .call(chart);
			nv.utils.windowResize(chart.update);

		   return chart;
		});
	});

	//Cuando existe un cambio en la base de datos, el servidor envia senal de actualizacion, con el nombre del partido y el numero de votos. 
	//Busca en la variable 'votos' el partido, y actualiza la grafica.
	socket.on('update', function(ioPartido, ioVotos){
		console.log("updating graph");
		for(var i=0; i<votos[0].values.length; i++){
			if(votos[0].values[i].label == ioPartido){
				votos[0].values[i].value = ioVotos;				
				break;
			}
		}

		nv.addGraph(function() {
		   var chart = nv.models.discreteBarChart()
		       .x(function(d) { return d.label })
		       .y(function(d) { return d.value })
		       .staggerLabels(true)
		       .tooltips(true)
		       .showValues(true);
		 
			d3.select('#chart svg')
			       .datum(votos)
				.transition().duration(500)
			       .call(chart);
			nv.utils.windowResize(chart.update);

		   return chart;
		});
	});
});


