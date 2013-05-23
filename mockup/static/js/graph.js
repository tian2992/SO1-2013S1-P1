$.getScript("js/bootstrap.js", function() {
$.getScript("/socket.io/socket.io.js", function(){
	var socket = io.connect('//');
	
	var votos;

	//lee de la url el departamento
	var departamento = getUrlParameter("depto");
	function getUrlParameter(sParam){
		var sPageURL = window.location.search.substring(1);
		var sURLVariables = sPageURL.split('&');
		for(var i = 0; i < sURLVariables.length; i++){
			var sParameterName = sURLVariables[i].split('=');
			if(sParameterName[0] == sParam){
				return sParameterName[1];
			}
		}
	}

	$('.dropdown-toggle').dropdown();	
		
	//envia al servidor el departamente elegido
	if(departamento){
		socket.emit('departamento',{depto:departamento});
	}

	//Servidor envia senal de conexion, lee todos los datos y crea la grafica. 
	socket.on('connect', function(ioData,deptos){
		votos = ioData;	
		//actualiza el menu con los departamentos desde la base de datos
		$("#departamentos").empty();
		for(var i=0;i<deptos.length;i++){
			$("#departamentos").append('<li id="'+deptos[i]+'"><a href="?depto='+deptos[i]+'">'+deptos[i]+'</a></li>');
		}		

		var cand1="", cand2="", votos1=0, votos2=0;
		for(var i=0; i<votos[0].values.length; i++){
			
			if(votos[0].values[i].value > votos1){
				cand2 = cand1;
				votos2 = votos1;
				votos1 = votos[0].values[i].value;
				cand1 = votos[0].values[i].label;
			}else if(votos[0].values[i].value >= votos2){
				votos2 = votos[0].values[i].value;
				cand2 = votos[0].values[i].label;
			}
		}
		$("#candidato1").text(cand1+":"+votos1);
		$("#candidato2").text(cand2+":"+votos2);
	
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
	//ya no se utiliza
	socket.on('update', function(ioPartido, ioVotos){
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
});

