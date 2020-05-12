firebase.auth().onAuthStateChanged(function(user) {
    if(user){
    	 var db = firebase.firestore();
    	document.getElementById('body').style.visibility = "visible";
    	document.getElementById('name').innerHTML = user.displayName;
    	var docRef = db.collection("users").doc(user.uid);
		docRef.get().then(function(doc) {
            if (doc.exists && doc.data().accountType == "premium"){
                document.getElementById("lyrLink").innerHTML = "<a class='nav-link' href='/lyrics'>Lyric Mode</a>"
            }
			//if user is in db but doesnt have refreshtoken in db
		    if (doc.exists && doc.data().accessrefresh=="") {
		    	window.location.replace("/home");
        }
            loadSongs("short");
            loadArtists("short");
    });

    $('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
      
      var term = e.target.getAttribute("aria-controls")
      if(document.getElementById(term+"Table").innerHTML == "" && term.indexOf("Art") == -1){
        loadSongs(term)
      }
      else if(document.getElementById(term+"Table").innerHTML == "" && term.indexOf("Art") != -1){
        loadArtists(term.slice(0,term.length-3))
      }
    })


    }
    else{
    	window.location.replace("/");
    }
});



async function loadSongs(range){
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
    
    var songData = await $.ajax({
        url: 'https://api.spotify.com/v1/me/top/tracks?time_range='+range+'_term&limit=50',
        type: 'GET',
        headers: {"Authorization": "Bearer "+accesstoken}
      });
    document.getElementById(range+"LoadingTrack").style.display = "None"
    for(var i = 0; i < songData.items.length; i++){
        var song = songData.items[i];
        var artists = ""
        for(var j = 0; j < song.artists.length; j++){
            artists += song.artists[j].name + ", "
        }
        if(artists[artists.length-2] == ","){
            artists = artists.slice(0, artists.length-2);
        }
        
        document.getElementById(range+"Table").innerHTML += "<tr><td style='padding-top:25px;padding-left:50px'>"+(i+1)+"</td><td><a href="+song.external_urls.spotify+" target='_blank'><img  src="+song.album.images[0].url+" class='rounded mr-2' style='width:50px;height:50px;'></a></td><td style='text-align:left;padding-top:25px;'>"+song.name+"</td><td style='padding-top:25px'>"+artists+"</td></tr>"
        
      }
}



async function loadArtists(range){
  console.log(range)
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
  
  var artistData = await $.ajax({
      url: 'https://api.spotify.com/v1/me/top/artists?time_range='+range+'_term&limit=50',
      type: 'GET',
      headers: {"Authorization": "Bearer "+accesstoken}
    });
    document.getElementById(range+"LoadingArtist").style.display = "None"
  for(var j = 0;j < artistData.items.length;j+=3){
    document.getElementById(range+"ArtTable").innerHTML += "<div class='row' id='"+j/3+range+"row' style='text-align:center;padding-top:20px'>";
  }
  for(var i = 0; i < artistData.items.length; i++){
      var artObj = artistData.items[i];
     
      
      document.getElementById(String(Math.floor(i/3))+range+"row").innerHTML += "<div class='col-sm-4'><a href="+artObj.external_urls.spotify+" target='_blank'><img src="+artObj.images[0].url+" class='rounded mr-2' style='height:20vw' ></a><br><h3 style='color:black'>"+(i+1)+". "+artObj.name+"</h3></div>"
      
    }
}