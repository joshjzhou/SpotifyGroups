var time = 1;
firebase.auth().onAuthStateChanged(function(user) {
    if(user){
    	 var db = firebase.firestore();
    	document.getElementById('body').style.visibility = "visible";
    	document.getElementById('name').innerHTML = user.displayName;
    	var docRef = db.collection("users").doc(user.uid);
		docRef.get().then(function(doc) {
			//if user is in db but doesnt have refreshtoken in db
		    if (doc.exists && (doc.data().accessrefresh=="" || doc.data().accountType != "premium")) {
		    	window.location.replace("/home");
		    }
		});
    }
    else{
    	window.location.replace("/");
    }
});



$('.search_input').keypress(function(e){
        if(e.which == 13){//Enter key pressed
           var query = $('.search_input').val();
           getSearch(query)
        }
   });




var card = templater`
<tr class='searchSongs' src="${'profile_url'}" data-songTitle="${'songTitle'}" data-artist="${'artist'}" data-uri="${'uri'}" data-duration="${'duration_ms'}"><td style='padding-top:25px;padding-left:50px'>${'number'}</td><td><img  src="${'profile_url'}" class='rounded mr-2' style='width:50px;height:50px;'></td><td style='text-align:left;padding-top:25px;'>${'songTitle'}</td><td style='padding-top:25px'>${'artist'}</td></tr>
`

function templater(strings, ...keys) {
return function(data) {
    let temp = strings.slice();
    keys.forEach((key, i) => {
        temp[i] = temp[i] + data[key];
    });
    return temp.join('');
}
};


async function getSearch(query){
  
  var user = firebase.auth().currentUser;
  var db = firebase.firestore();
  var userRef = db.collection("users").doc(user.uid);
  var uDocs = await userRef.get();
  var reftoken = uDocs.data().accessrefresh;

	var data =  await $.ajax({
	          url: '/refresh_token',
	          data: {
	            'refresh_token': reftoken
	          }
	        })
	var accesstoken = data.access_token
	
	newQuery = encodeURIComponent(query);
	var songs = await $.ajax({
	              url: 'https://api.spotify.com/v1/search?q='+newQuery+'&type=track&limit=10',
	              type: 'GET',
	              headers: {"Authorization": "Bearer "+accesstoken}

	    });
	var songDict = {};
	document.getElementById("lyrics").innerHTML = "";
	document.getElementById("songTitle").innerHTML = "";
	document.getElementById("songAuthor").innerHTML = "";
	$("#search").addClass('triggered');
	$("#recs").empty()
	document.getElementById("recs").innerHTML ="";
	for(var i = 0;i < songs.tracks.items.length;i++){
		var songDict = {};
		var song = songs.tracks.items[i];
		songDict['profile_url']=song.album.images[0].url;
		songDict['songTitle']=song.name;
		var artistString = ""
		for(var j = 0; j < song.artists.length;j++){
			var artist = song.artists[j];
			artistString += artist.name+", "

		}
		artistString = artistString.slice(0, artistString.length-2)
		songDict['artist']=artistString
		songDict['uri']=song.uri
		songDict['duration_ms']=song.duration_ms
		songDict['number']=(i+1) //href="${'songTitle'}//${'artist'}//${'uri'}//${'duration_ms'}"
		//document.getElementById("recs").innerHTML += "<tr class='searchSongs' src="+song.album.images[0].url+" href="+song.name+'//'+artistString+'//'+song.uri+'//'+song.duration_ms+"><td style='padding-top:25px;padding-left:50px'>"+(i+1)+"</td><td><img  src="+song.album.images[0].url+" class='rounded mr-2' style='width:50px;height:50px;'></td><td style='text-align:left;padding-top:25px;'>"+song.name+"</td><td style='padding-top:25px'>"+artistString+"</td></tr>"

		$("#recs").append(card(songDict));
		
	}
	document.getElementById("cantFindSong").style.display = "none"
	document.getElementById("recTable").style.visibility = "Visible"
	document.getElementById("searchTitle").style.display = "block"
	$("#results").fadeIn(1000);
	makeClickableSongCard()
}



async function makeClickableSongCard(){
	
	$(".searchSongs").click(function() {
        //window.open(String($(this).attr("href")), "_blank");
        (async () => {
			
			var uri = String($(this).attr("href"))
			uri = uri.split("//");
			
	        var songTitle = String($(this).attr("data-songTitle"));
	        var songAuthor = String($(this).attr("data-artist"));
	        var sUri = String($(this).attr("data-uri"));
	        var durMs = String($(this).attr("data-duration"));
	        var profUri = String($(this).attr("src"))
			var ind = songTitle.indexOf("(");
			var qPart1 = songTitle;
	        if( ind > 0){
	        	qPart1 = qPart1.slice(0, ind-1)
	        }
	        var editedTitle = qPart1;
	        var qPart2 = songAuthor.replace("88rising,","")
	        var ind2 = qPart2.indexOf(",");
	        if(ind2 > 0){
	        	qPart2 = qPart2.slice(0, ind2)
	        }
	        uri = qPart1+" "+qPart2;
			newQuery = encodeURIComponent(uri);
			
	        var data =  await $.ajax({
	              url: '/genius_songs',
	              data: {
	              	artist_song: newQuery
	              }
	            });
	        
	       	var bestInd = 0;
	       	for(var k = 0; k < data.response.hits.length; k++){
	       		if(data.response.hits[k].result.full_title.includes(editedTitle)){
	       			bestInd = k;
	       			k = data.response.hits.length;
	       		}
	       		
	       	}
			if(data.response.hits.length == 0){
				document.getElementById("cantFindSong").style.display = "block"
				document.getElementById("searchTitle").style.display = "None"
			document.getElementById("loadingSearch").style.display = "None"
			document.getElementById("recs").innerHTML ="";
			}else{
				document.getElementById("recs").innerHTML ="";
			document.getElementById("searchTitle").style.display = "None"
			document.getElementById("loadingSearch").style.display = "block"
			
			   var lyrics = await $.ajax({
	        	url: '/scrape',
	        	data:{
	        		api_path: data.response.hits[bestInd].result.api_path
	        	}
			});
			
	        //$("#results").empty();

	        document.getElementById("songTitle").innerHTML = songTitle;
	        document.getElementById("songAuthor").innerHTML = "By: "+songAuthor;
	        
	        document.getElementById("lyrics").innerHTML = lyrics.replace(/(\r\n|\n|\r)/gm, "<br>").slice(30);

	        document.getElementById("totTime").innerHTML = Math.floor(durMs/(1000*60))+":"+("0" + Math.floor(durMs/(1000))%60).slice(-2)
	        if(songTitle.length >= 20){
	        	songTitle = songTitle.slice(0, 15)+"..."
	        }
	        document.getElementById("songInf").innerHTML = songTitle+"<br><p style=font-size:10px>By: "+songAuthor+"</p>"
	        document.getElementById("toastImg").setAttribute("src",profUri)
	        document.getElementById("pause").setAttribute("data-isPause","true")
	        // var access_token = await getAccessToken();
	        var data = await $.ajax({
              url: 'https://api.spotify.com/v1/me/player/play?device_id='+deviceID,
              type: "PUT",
              data: JSON.stringify({"uris":[sUri]}),
              headers: {"Authorization": "Bearer "+access_token}
            });
			document.getElementById("loadingSearch").style.display = "none"
        	$('.toast').toast("show");
			initSlider(Math.floor(durMs/1000), access_token)
			}
        })()
    });
}

async function initSlider(totSec, access_token){
	//var access_token = await getAccessToken();
	var rangeSlider = document.getElementById('slider-range');
if(window.myVar != undefined && window.myVar != 'undefined'){
    window.clearInterval(window.myVar);
}
rangeSlider.noUiSlider.destroy()
// rangeSlider.noUiSlider.updateOptions({
//     start: [0],
    
    
//     range: {
//         'min': [0],
//         'max': [totSec]
//     }
// });
noUiSlider.create(rangeSlider, {
    start: [0],
    connect: [false, true],
    behaviour: 'drag',
    tooltips: false,
    range: {
        'min': [0],
        'max': [totSec]
    }
});

time = 1;




var rangeSliderValueElement = document.getElementById('initTime');
rangeSlider.noUiSlider.on('start', function (values, handle) {
    window.clearInterval(window.myVar);
    //console.log("start: cleared timer")
   
   
});
rangeSlider.noUiSlider.on('end', function (values, handle) {
	
	if(String($("#pause").attr("data-isPause")) == "false"){
		//console.log("end: started timer")
	    window.myVar = setInterval(incTime, 1000);
	}
     var data = $.ajax({
      url: 'https://api.spotify.com/v1/me/player/seek?device_id='+deviceID+'&position_ms='+time*1000,
      type: "PUT",
      headers: {"Authorization": "Bearer "+access_token}
    });
    
   
   
});
rangeSlider.noUiSlider.on('slide', function (values, handle) {

	time = parseInt(values[handle]);
	
 
});
rangeSlider.noUiSlider.on('update', function (values, handle) {

		var val = parseInt(values[handle]).toFixed(2)
    rangeSliderValueElement.innerHTML = Math.floor(val/60)+":"+("0" + val%60).slice(-2);
   
	
});
}


async function getAccessToken(){
	var user = firebase.auth().currentUser;
	var db = firebase.firestore();

	var docRef = db.collection("users").doc(user.uid);
	var docs = await docRef.get();
	var reftoken = docs.data().accessrefresh;

	var data =  await $.ajax({
              url: '/refresh_token',
              data: {
                'refresh_token': reftoken
              }
            })
    return data.access_token;
}	


$("#pause").click(function(){
	 (async () => {
	 	// var access_token = await getAccessToken();
	 	if(String($("#pause").attr("data-isPause")) == "false"){
	 		
			var data = $.ajax({
	              url: 'https://api.spotify.com/v1/me/player/pause?device_id='+deviceID,
	              type: "PUT",
	              headers: {"Authorization": "Bearer "+access_token}
	            });
	 	}else{
	 		var data = $.ajax({
	              url: 'https://api.spotify.com/v1/me/player/play?device_id='+deviceID,
	              type: "PUT",
	              headers: {"Authorization": "Bearer "+access_token}
	            });
	 	}
		
	})()
});



function logout(){
	firebase.auth().signOut().then(function() {
  // Sign-out successful.
	}).catch(function(error) {
	  // An error happened.
	});
}