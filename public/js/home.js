




	var db = firebase.firestore();
     
	


		//get access and refresh tokens from URL (after linking spotify)
     function getHashParams() {
          var hashParams = {};
          var e, r = /([^&;=]+)=?([^&;]*)/g,
              q = window.location.hash.substring(1);
          while ( e = r.exec(q)) {
             hashParams[e[1]] = decodeURIComponent(e[2]);
          }
          return hashParams;
        }

        

        var params = getHashParams();

        var access_token = params.access_token,
            refresh_token = params.refresh_token,
            error = params.error;

            
     firebase.auth().onAuthStateChanged(function(user) {
            if(user){ //if user is logged in

             		
            		document.getElementById('body').style.visibility = "visible";
             		var user = firebase.auth().currentUser;
					document.getElementById('name').innerHTML = user.displayName;
					document.getElementById('greeting').innerHTML += user.displayName+",";

					var docRef = db.collection("users").doc(user.uid);

					//get reference to user in database
					docRef.get().then(function(doc) {
					    if (doc.exists) {
					       // don't do anything if they are already in database

					    } else {
					        // if the user is not in database, add them
					        docRef.set({
							    displayName: user.displayName,
							    email: user.email,
							    accessrefresh: "",
							    groups: [],
							    invites: [],
							    recPlaylist: [],
							    recPlaylistId: "",
							    groupPlaylistIds:[],
								accountType: "",
								lastUpdated:""
							})
							.then(function() {
							    console.log("Document successfully written!");
							    
							    document.getElementById('login').style.visibility = "visible"; //show and prompt for spotify connection
							})
							.catch(function(error) {
							    console.error("Error writing document: ", error);
							});
					    }
					}).catch(function(error) {
					    console.log("Error getting document:", error);
					});

					docRef.get().then(function(doc) {
						//if user is in db but doesnt have refreshtoken in db
					    if (doc.exists && doc.data().accessrefresh=="") {
					    	console.log("hi");
					    	
					    	//if accesstoken exists, update logs (it will go here after connecting spotify, oauth returns it in url)
					        if(access_token != null){
					        	
					        	docRef.update({
							    accessrefresh: refresh_token
							})
								.then(function() {
								    console.log("Document successfully written!");
								    
								     window.location.replace("/home");
								})
								.catch(function(error) {
								    console.error("Error writing document: ", error);
								});
						        }
						    else{ //if accesstoken does not exist; it means they havent connected to spotify
						    	
						    	document.getElementById('login').style.visibility = "visible";
						    }

					    } 
					    else if(!doc.exists){
					    	//async problems, sometimes goes here before actually writing to db on first login
					    }

					    else {
					    	//they have connected spotify
					    	
					    	document.getElementById('login').style.visibility = "hidden";
						document.getElementById('afterlogin').style.visibility = "visible";
							//getAccess();
							recWrapper();
					        
					    }
					}).catch(function(error) {
					    console.log("Error getting document:", error);
					});

					// var gNames = [];
					// var allGroups = [];
					
					// (async () => {
					// 	var results = await getNamesandIDs();
						
					// 	gNames = results[0];
					// 	allGroups = results[1];
					
					// 	for(var j = 0; j < gNames.length; j++){
							
					// 		// document.getElementById("groups").innerHTML += "<a class='btn btn-success btn-default' href='/groups/"+allGroups[j]+"' id="+gNames[j]+">View "+gNames[j]+"</a><br>"
					// 		document.getElementById("groups").innerHTML += "<tr class='groupClick' id="+allGroups[j]+"><td class='column1' >"+gNames[j]+"</td></tr>";
					// 	}
					// 	makeClickableGroupRow();
					//  })();
					
					var counterXD = 0;
					
					docRef.onSnapshot(function(doc) {
						
						(async () => {
							deleteChild();
							await updateInvites();
							await updateGroups();
						})();
					});
					
					
					docRef.get().then(function(doc){
						 if (doc.exists && doc.data().accessrefresh!="" && doc.data().accountType == ""){
						 	(async () => {
								var accesstoken = await $.ajax({
						              url: '/refresh_token',
						              data: {
						                'refresh_token': doc.data().accessrefresh
						              }
						            });
								var data = await $.ajax({
						              url: 'https://api.spotify.com/v1/me',
						              type: "GET",
						              headers: {"Authorization": "Bearer "+accesstoken.access_token}
						            });
								docRef.update({
								    accountType: data.product
								})
						 	  })();
						 }

						 if(doc.data().accountType == "premium"){
							 document.getElementById("lyrLink").innerHTML = "<a class='nav-link' href='/lyrics'>Lyric Mode</a>"
						 }
					})

					
					

            }   
            else{ //if user is not logged in, redirect to start screen
                 window.location.replace("/");
            }
        })



async function getNamesandIDs(){
	var user = firebase.auth().currentUser;
	var docRef = db.collection("users").doc(user.uid);
	var allGroups = [];
	var gNames = [];

	var docs = await docRef.get();
	if(docs.exists){
		allGroups = docs.data().groups;
		for(var i = 0;i < allGroups.length;i++){
			var names = db.collection("groups").doc(allGroups[i])
			var doc =  await names.get();
			
			gNames.push(doc.data().name)
			
		}
	}
	

	var returns = [gNames, allGroups];
	
	return [gNames, allGroups];
}
async function deleteChild() { 
	var e = document.getElementById("groups"); 
	
	//e.firstElementChild can be used. 
	var child = e.lastElementChild;  
	while (child) { 
		e.removeChild(child); 
		child = e.lastElementChild; 
	} 

	var j = document.getElementById("invites");
	var child = j.lastElementChild;  
	while (child) { 
		j.removeChild(child); 
		child = j.lastElementChild; 
	} 
} 

//get refreshtoken
async function getRefresh(){
    		var user = firebase.auth().currentUser;
    		var db = firebase.firestore();
    		var docRef = db.collection("users").doc(user.uid);
    		

    		let doc = await docRef.get()
    		let token = await doc.data().accessrefresh;
    // 		docRef.get().then(function(doc) {
    // 			console.log(doc.data().accessrefresh)
				// token =  doc.data().accessrefresh;

    // 	});
    		return token;
    	}




//get access token
async function getAccess(){
		var user = firebase.auth().currentUser;
    	var db = firebase.firestore();
    	var reftoken = await getRefresh();
    	console.log("oh my", reftoken);
            $.ajax({
              url: '/refresh_token',
              data: {
                'refresh_token': reftoken
              }
            }).done(function(data) {
              var accesstoken = data.access_token;
              console.log('i got here apparently')
              getSongs(accesstoken);
            });
          };


          


	
     
//get top songs list
     function getSongs(access_token){
     	$.ajax({
              url: '/top_tracks',
              data: {
                'access_token': access_token,
                'num_songs': 10,
              }
            }).done(function(data) {
            	//data.items.length
            	document.getElementById("songTable").style.visibility = "visible";
            	for(var i = 0; i < data.items.length; i++) {
				    var obj = data.items[i];
				    var artists = obj.artists
				    var albumIMGs = obj.album.images
				    var albumImgUrl = albumIMGs[albumIMGs.length-1].url
				    var songUrl = obj.uri
				    var artistString = ""
				    for(var j = 0; j < artists.length;j++){
				    	artistString += artists[j].name +", "
				    }
				    artistString = artistString.slice(0, artistString.length-2)
				    if(artistString.length > 40){
				      	artistString = artistString.slice(0, 37) + "..."
				      }
				    var songName = obj.name
				    if(songName.length > 30){
				      	songName = songName.slice(0, 25) + "..."
				      }
				    console.log(artistString);
				    document.getElementById("songs").innerHTML += 
				    "<tr class='songClick' href="+obj.uri+"><td style='text-align:center;padding: 25px 0'>\
				    <img class='songImg' \
				    src='"+albumImgUrl+"'>"+songName+"\
                     <br> <p style='font-size:15px;'>by "+artistString+"</p></td></tr>"
				}
              console.log(data);
              makeClickableSongRow();
            });
          
     }
    

async function updateGroups(){
	var db = firebase.firestore();
	var user = firebase.auth().currentUser;
	var uDocs = await db.collection("users").doc(user.uid).get();
	document.getElementById("groups").innerHTML = "";
	$("#groups").empty()
	for(var i = 0; i < uDocs.data().groups.length; i++){
		var groupID = uDocs.data().groups[i]
		var gDocs = await db.collection("groups").doc(groupID).get()
		var gName = gDocs.data().name

		document.getElementById("groups").innerHTML += "<tr class='groupClick' id="+groupID+"><td class='column1' >"+gName+"</td></tr>";
		makeClickableGroupRow();
	}
	if(uDocs.data().groups.length == 0){
		document.getElementById("groups").innerHTML += "<tr><td class='column1' >You have no groups</td></tr>";

	}
}


  
    function createGroup(){
    	var groupID = Math.random().toString(36).substr(2, 12);
    var user = firebase.auth().currentUser;
    	var db = firebase.firestore();
    (async () => {
        const { value: text } = await Swal.fire({
          input: 'text',
          title: 'Enter group name:',
          inputPlaceholder: 'Type your group name here...',
          inputAttributes: {
            'aria-label': 'Type your group name here'
          },
          showCancelButton: true
        })
        
        if (text) {
           
            var groupRef = db.collection("groups").doc(groupID);
            var userRef = db.collection("users").doc(user.uid);

	        	userRef.update({
				    groups: firebase.firestore.FieldValue.arrayUnion(groupID)
				});
				groupRef.set({
				    name: text,
				    users: [user.uid],
				    groupPlaylist: [],
					userNum: 1,
					groupPlaylistId:''
				})
				.then(function() {
				    Swal.fire({
                      icon: 'success',
                      title: 'Success!',
                      text: 'Group created successfully!',
                    })
					// document.getElementById("groups").innerHTML += "<a class='btn btn-success btn-default' href='/groups/"+groupID+"' id="+text+">View "+text+"</a><br>"
					// document.getElementById("groups").innerHTML += "<a class='btn btn-success btn-default' href='/groups/"+allGroups[j]+"' id="+gNames[j]+">View "+gNames[j]+"</a><br>"
					//document.getElementById("groups").innerHTML += "<tr class='groupClick' id="+groupID+"><td class='column1' >"+text+"</td></tr>";
					//makeClickableGroupRow();
				});
				

        }
    })()
}



function invDec(uID, gID){
	console.log(uID, gID);
	var user = firebase.auth().currentUser;
    	var db = firebase.firestore();
	(async () => {
	       const swalWithBootstrapButtons = Swal.mixin({
			  customClass: {
			    confirmButton: 'btn btn-success',
			    cancelButton: 'btn btn-danger'
			  }
			 
			})

			swalWithBootstrapButtons.fire({
			  title: 'Would you like to accept the invitation?',
			  showCancelButton: true,
			  confirmButtonText: 'Accept!',
			  cancelButtonText: 'Decline!',
			  
			}).then((result) => {
			  if (result.value) {
			  	var userRef = db.collection("users").doc(user.uid);
			  	var gRef = db.collection("groups").doc(gID);
			  	userRef.update({
					groups: firebase.firestore.FieldValue.arrayUnion(gID),
					invites: firebase.firestore.FieldValue.arrayRemove(uID+" "+gID)
				});
				
				gRef.update({
					users: firebase.firestore.FieldValue.arrayUnion(user.uid)
				});
				gRef.get().then(function(doc){
					// document.getElementById("groups").innerHTML += "<a class='btn btn-success btn-default' href='/groups/"+gID+"'>View "+doc.data().name+"</a><br>"
					// document.getElementById("groups").innerHTML += "<a class='btn btn-success btn-default' href='/groups/"+allGroups[j]+"' id="+gNames[j]+">View "+gNames[j]+"</a><br>"
					//document.getElementById("groups").innerHTML += "<tr class='groupClick' id="+gID+"><td class='column1' >"+doc.data().name+"</td></tr>";
					//makeClickableGroupRow();
					//updateInvites();
					swalWithBootstrapButtons.fire(
				      'Success!',
				      'You have joined the group.',
				      'success'
				    )
				})
					
			    
			  } else if (
			    /* Read more about handling dismissals below */
		
			    result.dismiss === Swal.DismissReason.cancel
			  ) {
			  	var userRef = db.collection("users").doc(user.uid);
			  	 userRef.update({
				    invites: firebase.firestore.FieldValue.arrayRemove(uID+" "+gID)
				});
				updateInvites();
			    swalWithBootstrapButtons.fire(
			      'Success!',
			      'You have declined the invite',
			      'error'
			    )
			  }
			})
    })()
}


async function updateInvites(){
	var user = firebase.auth().currentUser;
	var db = firebase.firestore();

	var docRef = db.collection("users").doc(user.uid);

	document.getElementById("invites").innerHTML = "";
	var doc = await docRef.get();
	if(doc.exists){
		var invites = doc.data().invites;
		document.getElementById("invites").innerHTML = "";
		if(invites.length == 0){
			document.getElementById("invites").innerHTML += "<tr ><td>You currently have no invites</td></tr>"
		}
		
		for(var i = 0;i < invites.length; i++){
			var vals = invites[i].split(" ");
			var uID = vals[0];
			var gID = vals[1];
			
			var invRef = db.collection("users").doc(uID);
			var gRef = db.collection("groups").doc(gID);
			var userRef = db.collection("users").doc(user.uid);
			var userDoc = await userRef.get();
			var invDoc = await invRef.get();
			var gDoc = await gRef.get();
			//check if user is alrdy in group
			if(!userDoc.data().groups.includes(gID) && gDoc.exists){
				var ins = "invDec("+"'"+uID +"'"+ "," +"'"+ gID + "'"+")";
				console.log(ins)
				// document.getElementById("invites").innerHTML += "<a class='btn btn-success btn-default' onclick=\" "+ins+ " \" >"+invDoc.data().displayName+" invited you to join "+gDoc.data().name+"</a><br>"
				document.getElementById("invites").innerHTML += "<tr class='inviteClick' onclick=\" "+ins+ " \"><td>"+invDoc.data().displayName+" invited you to join "+gDoc.data().name+"</td></tr>"

			}else{
				
				userRef.update({
					invites: firebase.firestore.FieldValue.arrayRemove(uID+" "+gID)
				});
				
			}
			
		}
	}
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

async function getAllUserSongs(access_token, numSongs){
	
    var data = await $.ajax({
              url: '/top_tracks',
              data: {
                'access_token': access_token,
                'num_songs': numSongs
              }
            })
    var idStrings = "";
    for (var i = 0; i < data.items.length; i++){
      idStrings += data.items[i].id+",";
    }
    idStrings = idStrings.slice(0, idStrings.length-1);
    return idStrings;
}


async function getAudioFeatures(songs, access_token){
   var data = await $.ajax({
              url: 'https://api.spotify.com/v1/audio-features?ids='+songs,
              type: 'GET',
              headers: {"Authorization": "Bearer "+access_token}
            });
   var dance = 0; var energy = 0; var instrument = 0; var liveness = 0; var speech = 0; var tempo = 0; var valence = 0; var accoust = 0;
   for (var i = 0;i < data.audio_features.length;i++){
      var obj = data.audio_features[i];
      dance += obj.danceability;
      energy += obj.energy;
      instrument += obj.instrumentalness;
      liveness += obj.liveness;
      speech += obj.speechiness;
      tempo += obj.tempo;
      valence += obj.valence;
      accoust += obj.accousticness;
   }
   var values = [dance, energy, instrument, liveness, speech, tempo, valence, accoust];
   for(var j = 0;j < values.length; j++){
    values[j] /= values.length;
   }
   return values;

}


async function getRecommendedSongs(audFeats, songs, access_token, numSongs){
  var data = await $.ajax({
    url: 'https://api.spotify.com/v1/recommendations?limit='+numSongs+'&seed_tracks='+songs+'&target_danceability='+audFeats[0]+ 
    '&target_energy='+audFeats[1]+'&target_instrumentalness='+audFeats[2]+'&target_liveness='+audFeats[3]+ 
    '&target_speechiness='+audFeats[4]+'&target_tempo='+audFeats[5]+'&target_valence='+audFeats[6]+ 
    '&target_acousticness='+audFeats[7],
    type: 'GET',
    headers: {"Authorization": "Bearer "+access_token}
  });
  // document.getElementById("recs").innerHTML = "";
  // document.getElementById("recTable").style.visibility = "visible";
  // for(var i = 0; i < data.tracks.length; i++){
  //   var obj = data.tracks[i];
  //   var artists = obj.artists
  //   var albumIMGs = obj.album.images
  //   var albumImgUrl = albumIMGs[albumIMGs.length-1].url
  //   var songUrl = obj.uri
  //   var artistString = ""
  //   for(var j = 0; j < artists.length;j++){
  //     artistString += artists[j].name +", "
  //   }
  //   artistString = artistString.slice(0, artistString.length-2)
    
    
  //   document.getElementById("recs").innerHTML += 
  //   "<tr class='songClick' href="+songUrl+"><td style='text-align:center;padding: 25px 0'>\
  //   <img class='songImg' \
  //   src='"+albumImgUrl+"'>"+obj.name+"\
  //            <br> <p style='font-size:15px;'>by "+artistString+"</p></td></tr>"

  // }
  
  return data;
}

async function compileAllSongs(){
  var songIds = "";
   var db = firebase.firestore();
   var user = firebase.auth().currentUser;
    
    var userRef = db.collection("users").doc(user.uid);
    var uDocs = await userRef.get();
    var reftoken = uDocs.data().accessrefresh;
    var data =  await $.ajax({
              url: '/refresh_token',
              data: {
                'refresh_token': reftoken
              }
            })
    var accesstoken = data.access_token;
    
    var songs = await getAllUserSongs(accesstoken, 15);
    
    var audFeats = await getAudioFeatures(songs, accesstoken);
    var lessSongs = await getAllUserSongs(accesstoken, 5);
    var songDat = await getRecommendedSongs(audFeats, lessSongs, accesstoken, 50);
    for(var j = 0;j < songDat.tracks.length;j++){
      var curId = songDat.tracks[j].id;
      if(!songIds.includes(curId)){
        songIds += curId + ","
        
      }
    }
   
   if(songIds[songIds.length-1] == ","){
      songIds = songIds.slice(0, songIds.length-1);
    }
   return songIds;
}

async function recWrapper(){
  var user = firebase.auth().currentUser;
  var db = firebase.firestore();
  var userRef = db.collection("users").doc(user.uid);
  var uDocs = await userRef.get();
  if(uDocs.data().recPlaylist.length == 0){
    var allSongs = await compileAllSongs();
    var songArray = allSongs.split(",");
    songArray = shuffle(songArray);
    await userRef.update({
            recPlaylist: songArray,
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    console.log(songArray);
  }else{
    var lastUpdate = uDocs.data() && uDocs.data().lastUpdated && uDocs.data().lastUpdated.toDate();
    var curDate = new Date();
    if(dateDiffInDays(lastUpdate, curDate) >= 7){
      console.log("kill myself xdd");
      var allSongs = await compileAllSongs();
      var songArray = allSongs.split(",");
      songArray = shuffle(songArray);
      await userRef.update({
              recPlaylist: songArray,
              lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
      });

    }
    
  }

  var userRef = db.collection("users").doc(user.uid);
  var uDocs = await userRef.get();
  if(uDocs.data().recPlaylist.length != 0){
    //get tracks and display in table
    var tracks = uDocs.data().recPlaylist;
    var trackIds = "";
    for(var i = 0;i < tracks.length; i++){
      trackIds += tracks[i]+",";
    }
    trackIds = trackIds.slice(0, trackIds.length-1);
    var reftoken = await getRefresh(user.uid);
    var data =  await $.ajax({
              url: '/refresh_token',
              data: {
                'refresh_token': reftoken
              }
            })
    var accesstoken = data.access_token;

    var songData = await $.ajax({
              url: 'https://api.spotify.com/v1/tracks?ids='+trackIds,
              type: 'GET',
              headers: {"Authorization": "Bearer "+accesstoken}

    });
    var lastUpd = uDocs.data() && uDocs.data().lastUpdated && uDocs.data().lastUpdated.toDate();
    
    document.getElementById("recs").innerHTML = "";
    document.getElementById("recTable").style.visibility = "visible";
    document.getElementById("lastUpd").innerHTML += (lastUpd.getMonth()+1) + "/" + lastUpd.getDate()+ "/" + lastUpd.getFullYear()
    
    for(var i = 0; i < songData.tracks.length; i++){
      var obj = songData.tracks[i];
      var artists = obj.artists
      var albumIMGs = obj.album.images
      var albumImgUrl = albumIMGs[albumIMGs.length-1].url
      var songUrl = obj.uri
      var artistString = ""
      for(var j = 0; j < artists.length;j++){
        artistString += artists[j].name +", "
      }
      artistString = artistString.slice(0, artistString.length-2)
    //   if(artistString.length > 40){
    //   	artistString = artistString.slice(0, 37) + "..."
    //   }
      var songName = obj.name
    //   console.log(songName, songName.length)
    // if(songName.length > 30){
    //   	songName = songName.slice(0, 25) + "..."
	//   }
	  
	  document.getElementById("recs").innerHTML += "<tr><td style='padding-left:50px;padding-right:0px'><a href="+obj.external_urls.spotify+" target='_blank'><img  src="+albumImgUrl+" class='rounded mr-2' style='width:50px;height:50px;'></a></td><td style='text-align:left;padding-top:25px;'>"+songName+"</td><td style='padding-top:25px'>"+artistString+"</td></tr>"
    //   document.getElementById("recs").innerHTML += 
    //   "<tr class='songClick' href="+obj.uri+"><td style='text-align:center;padding: 25px 0'>\
    //   <img class='songImg' \
    //   src='"+albumImgUrl+"'>"+songName+"\
    //            <br> <p style='font-size:15px;'>by "+artistString+"</p></td></tr>"

    }
	makeClickableSongRow()
	document.getElementById('loading').innerHTML = "";
  }


}


function dateDiffInDays(a, b) {
  const _MS_PER_DAY = 1000 * 60 * 60 * 24;
  // Discard the time and time-zone information.
  const utc1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const utc2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());

  return Math.floor((utc2 - utc1) / _MS_PER_DAY);
}


function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

async function createRecPlaylist(){
  var user = firebase.auth().currentUser;
  var db = firebase.firestore();
  var userRef = db.collection("users").doc(user.uid);
  var uDocs = await userRef.get();
  //creates playlist, stores playlistId, add tracks
  if(uDocs.data().recPlaylistId == ""){

	  var reftoken = uDocs.data().accessrefresh;

		var data =  await $.ajax({
		          url: '/refresh_token',
		          data: {
		            'refresh_token': reftoken
		          }
		        })
		var accesstoken = data.access_token
		 var userData = await $.ajax({
	              url: 'https://api.spotify.com/v1/me',
	              type: 'GET',
	              headers: {"Authorization": "Bearer "+accesstoken}

	    });
		var userId = userData.id
		var playdata = {"name": uDocs.data().displayName+"'s Recommended Playlist",
					"description": "A recommended songs playlist generated by SpotifyGroups",
					"public": false};
		var playlistData = await $.ajax({
	              url: 'https://api.spotify.com/v1/users/'+userId+'/playlists',
	              type: 'POST',
	              data: JSON.stringify(playdata),
	              headers: {"Authorization": "Bearer "+accesstoken}

	    });
	    var playlistId = playlistData.id
	    await userRef.update({
	            recPlaylistId: playlistData.id
	    });
	    var songs = uDocs.data().recPlaylist;
	    var songIdArray = [];
	    for(var i = 0; i < songs.length; i++){
	    	songIdArray.push("spotify:track:"+songs[i])
	    }
	    await $.ajax({
	              url: 'https://api.spotify.com/v1/playlists/'+playlistId+'/tracks',
	              type: 'POST',
	              data: JSON.stringify({"uris":songIdArray}),
	              headers: {"Authorization": "Bearer "+accesstoken}

	    });
		Swal.fire({
			title: 'Playlist Updated Successfully!',
			icon: 'success',
			showCloseButton: true,
			focusConfirm: false,
			confirmButtonAriaLabel: 'Great!',
		  
		  })
	}else{
		var lastUpdate = uDocs.data() && uDocs.data().lastUpdated && uDocs.data().lastUpdated.toDate();
    	var curDate = new Date();
		if(dateDiffInDays(lastUpdate, curDate) == 0){
			var reftoken = uDocs.data().accessrefresh;

			var data =  await $.ajax({
			          url: '/refresh_token',
			          data: {
			            'refresh_token': reftoken
			          }
			        })
			var accesstoken = data.access_token
			
		    var playlistId = uDocs.data().recPlaylistId
		    
		    var uDocs = await userRef.get();
		    var songs = uDocs.data().recPlaylist;
		    var songIdArray = [];
		    for(var i = 0; i < songs.length; i++){
		    	songIdArray.push("spotify:track:"+songs[i])
		    }
		    await $.ajax({
		              url: 'https://api.spotify.com/v1/playlists/'+playlistId+'/tracks',
		              type: 'PUT',
		              data: JSON.stringify({"uris":songIdArray}),
		              headers: {"Authorization": "Bearer "+accesstoken}

			});
			Swal.fire({
				title: 'Playlist Updated Successfully!',
				icon: 'success',
				showCloseButton: true,
				focusConfirm: false,
				confirmButtonAriaLabel: 'Great!',
			  
			  })
		}else{
			Swal.fire({
				title: 'Playlist already updated.',
				icon: 'error',
				html:'Playlists can be updated after a week has past since the most recent update',
				showCloseButton: true,
				focusConfirm: false,
				confirmButtonAriaLabel: 'Great!',
			  
			  })
		}
	}
}







function makeClickableGroupRow(){
	$(".groupClick").click(function() {
        window.location = ("/groups/"+String($(this).attr("id")));
    });
}


async function makeClickableSongRow(){
	var access_token = await getAccessToken();
	var user = firebase.auth().currentUser;
	var db = firebase.firestore();
	var userRef = db.collection("users").doc(user.uid);
	var uDocs = await userRef.get();
	$(".songClick").click(function() {
		//window.open(String($(this).attr("href")), "_blank");
		window.open("spotify:track:"+String($(this).attr("href")), "_blank");
		// if(uDocs.data().accountType == "premium"){
		// 	console.log(access_token);
		// 	var uri = String($(this).attr("href"))
		// 	console.log(uri);
		// 	var data = $.ajax({
		// 		url: 'https://api.spotify.com/v1/me/player/play?device_id='+deviceID,
		// 		type: "PUT",
		// 		data: JSON.stringify({"uris":[uri]}),
		// 		headers: {"Authorization": "Bearer "+access_token}
		// 		});
		// 	console.log(data);
		// }else{
		// 	window.open("spotify:track:"+String($(this).attr("href")), "_blank");
		// }
        
    });
}




async function deleteGroup(){
		var db = firebase.firestore();
       var groupJson = {};
	   var user = firebase.auth().currentUser;
	   var uRef = db.collection("users").doc(user.uid)
       //var gRef = db.collection("groups").doc(gID);
       var docs = await uRef.get();
		for(var i = 0; i < docs.data().groups.length;i++ ){
			var groupID = docs.data().groups[i]
			var gRef = db.collection("groups").doc(groupID)
			var gDocs = await gRef.get();
			groupJson[groupID] = gDocs.data().name;
		}
	   
		
		const { value: curGroup } = await Swal.fire({
			title: 'Select a group to delete.',
			html: 'NOTE: ONCE YOU DELETE A GROUP, YOU CANNOT RECOVER IT',
			input: 'select',
			inputOptions: groupJson,
			inputPlaceholder: 'Select a group to delete',
			showCancelButton: true,
			inputValidator: (value) => {
			  return new Promise((resolve) => {
				resolve()
			  })
			}
		  })

		if(curGroup){
			var gDocs = await db.collection("groups").doc(curGroup).get();
			for(var j = 0;j < gDocs.data().users.length; j++){
				var userID = gDocs.data().users[j]
				var gPlayID = gDocs.data().groupPlaylistId
				await db.collection("users").doc(userID).update({
					groups: firebase.firestore.FieldValue.arrayRemove(curGroup)
				})
				await db.collection("users").doc(userID).update({
					groupPlaylistIds: firebase.firestore.FieldValue.arrayRemove(gPlayID)
				})


			}

			db.collection("groups").doc(curGroup).delete().then(function() {
				Swal.fire({
					title: 'Group Deleted Successfully!',
					icon: 'success',
					showCloseButton: true,
					focusConfirm: false,
					confirmButtonAriaLabel: 'Great!',
				  
				  })
			}).catch(function(error) {
				Swal.fire({
					title: 'Failed to delete group.',
					icon: 'error',
					html:'Refresh the page and try again',
					showCloseButton: true,
					focusConfirm: false,
					confirmButtonAriaLabel: 'OK',
				  
				  })
			});
			

		}
}




function logout(){
	firebase.auth().signOut().then(function() {
  // Sign-out successful.
	}).catch(function(error) {
	  // An error happened.
	});
}