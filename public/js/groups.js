var db = firebase.firestore();
var loc = window.location.href.split("/");
var gID = loc[loc.length-1];
    firebase.auth().onAuthStateChanged(function(user){
      if(user){
          document.getElementById('name').innerHTML = user.displayName;
          var loc = window.location.href.split("/");
          var gID = loc[loc.length-1];
          var user = firebase.auth().currentUser;
          var gRef; 
          var docs;
            var userRef = db.collection("users").doc(user.uid);
               
          (async () => {
            
            
            var userGroups = await userRef.get();
            var numUsers;
            
            if(userGroups.data().groups.includes(gID)){
              gRef = db.collection("groups").doc(gID);
              docs = await gRef.get();
              numUsers = docs.data().users.length
              if(userGroups.data().accountType == "premium"){
                document.getElementById("lyrLink").innerHTML = "<a class='nav-link' href='/lyrics'>Lyric Mode</a>"
              }
              document.getElementById('body').style.visibility = "visible";
              
                document.getElementById("welcome").innerHTML += docs.data().name;
                document.getElementById("inviteBtn").innerHTML += docs.data().name;
                
                updateUsers(gID);
                gRef.onSnapshot(function(doc) {
                    if(doc.data().users.length != numUsers){
                      updateUsers(gID);
                    }
                    
                });
          
                
                
             
            }else{
              
              window.location.replace("/home");
            }
          })()
      }else{
         window.location.replace("/");
      }
    });




function invitePerson(){

  (async () => {
        const { value: email } = await Swal.fire({
          input: 'email',
          title: 'Invite friend via email:',
          inputPlaceholder: 'Type the email here...',
          inputAttributes: {
            'aria-label': 'Type the email here'
          },
          showCancelButton: true
        })
        
        if (email) {
         
           var userRef = db.collection("users");
           var user = firebase.auth().currentUser;
            // var test = userRef.where("invites","array-contains",user.uid+" "+gID);
            // console.log(test.exists);
           
            
           
           userRef.where("email", "==", String(email))
           .get()
            .then(function(querySnapshot) {
              if(!querySnapshot.empty){


                querySnapshot.forEach(function(doc) {
                  (async () => {
                   
                  var docs = await userRef.doc(doc.id).get();
                  if(!docs.data().groups.includes(gID)){
                    userRef.doc(doc.id).update({
                      invites: firebase.firestore.FieldValue.arrayUnion(user.uid+" "+gID)
                    })
                    Swal.fire(
                    'Success!',
                    'Invite sent successfully!.',
                    'success'
                    );
                  }else{
                      Swal.fire(
                        'Failure',
                        'Member already apart of group!',
                        'error'
                    );
                    }
                     })()
                });
              }
              else{
               Swal.fire(
                        'Failure',
                        'User has not signed up yet',
                        'error'
                    );
              }
                
            })
            .catch(function(error) {
                console.log("Error getting documents: ", error);
            });

        }
    })()
}


async function updateUsers(gID){
  document.getElementById("users").innerHTML = "";
  var db = firebase.firestore();
   var gRef = db.collection("groups").doc(gID);
  var docs = await gRef.get();
              if(docs.data().users.length > 1){
                document.getElementById("songBtn").style.display = "inline";
                //document.getElementById("recBtn").style.display = "inline";
              
              }
              for(var i = 0; i < docs.data().users.length;i++){

                  var userID = docs.data().users[i];
                  var uRef = db.collection('users').doc(userID);
                  var name = await uRef.get();
                  
                  document.getElementById("users").innerHTML += "<tr id="+userID+"><td class='column1'>"+name.data().displayName+"</td></tr>"
                }
}



async function seeOtherUserSongs(){
       var db = firebase.firestore();
       var userJson = {};
       var user = firebase.auth().currentUser;
       var gRef = db.collection("groups").doc(gID);
       var docs = await gRef.get();

       for(var i = 0; i < docs.data().users.length;i++){
            var userID = docs.data().users[i];
            var uRef = db.collection('users').doc(userID);
            var name = await uRef.get();
            if(userID != user.uid){
              userJson[userID] = name.data().displayName;
            }
       }
       userJson['recs'] = "Group Recommendations"

      const { value: curUser } = await Swal.fire({
      title: 'Select User/Recs',
      input: 'select',
      inputOptions: userJson,
      inputPlaceholder: 'Select a user/recs',
      showCancelButton: true,
      inputValidator: (value) => {
        return new Promise((resolve) => {
          // if (value === 'oranges') {
          //   resolve()
          // } else {
          //   resolve('You need to select oranges :)')
          // }
          resolve()
        })
      }
    })

    if (curUser) {
      //var text = document.getElementById("nameLabel").innerHTML.split("'s");
      if(curUser == 'recs'){
        recWrapper();
      }else{
        var accessTok = await getAccess(curUser);
        await getSongs(accessTok)
      }
      
    
      
      //getSongs(accessToken);
      
    }
}



//get refreshtoken
async function getRefresh(uid){
       
        var db = firebase.firestore();
        var docRef = db.collection("users").doc(uid);
        

        let doc = await docRef.get()
        let token = await doc.data().accessrefresh;
    //    docRef.get().then(function(doc) {
    //      console.log(doc.data().accessrefresh)
        // token =  doc.data().accessrefresh;

    //  });
        return token;
      }


async function getAccess(uid){
    var user = firebase.auth().currentUser;
      var db = firebase.firestore();
      var reftoken = await getRefresh(uid);
      var userRef = db.collection("users").doc(uid);
      var docs = await userRef.get();
      var name = docs.data().displayName;
     // console.log("oh my", reftoken);

    
        var data =  await $.ajax({
              url: '/refresh_token',
              data: {
                'refresh_token': reftoken
              }
            })
      var accesstoken = data.access_token;
      
      document.getElementById("recTable").style.visibility = "visible";
      //document.getElementById("nameLabel").innerHTML = name + "'s Recent Top Songs";
      document.getElementById("recs").innerHTML = ""
      document.getElementById("recHeader").innerHTML = "<th colspan='4' style='text-align:center'>"+name+"'s Recent Top Songs<br></th>"

      
      return accesstoken;
            
          };


//add only get 5 songs instead of 10
 function getSongs(access_token){
      $.ajax({
              url: '/top_tracks',
              data: {
                'access_token': access_token,
                'num_songs': 50
              }
            }).done(function(data) {
              //data.items.length
              
              // document.getElementById("songs").innerHTML = "";
              // document.getElementById("songTable").style.visibility = "visible";
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
                  
                  
                  var songName = obj.name

                  
                  // document.getElementById("songs").innerHTML += 
                  // "<tr class='songClick' href="+songUrl+"><td style='text-align:center;padding: 25px 0'>\
                  // <img class='songImg' \
                  // src='"+albumImgUrl+"'>"+songName+"\
                  //          <br> <p style='font-size:15px;'>by "+artistString+"</p></td></tr>"
                  document.getElementById("recs").innerHTML += "<tr><td style='padding-top:25px;padding-left:50px'>"+(i+1)+"</td><td><a href="+obj.external_urls.spotify+" target='_blank'><img  src="+albumImgUrl+" class='rounded mr-2' style='width:50px;height:50px;'></a></td><td style='text-align:left;padding-top:25px;'>"+songName+"</td><td style='padding-top:25px'>"+artistString+"</td></tr>"

        }
              //makeClickableSongRow();
            });
          
     }
    
async function getAllUserSongs(access_token, numSongs){
  if(numSongs > 5){
    numSongs = 5;
  }
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


//danceability, energy, instrumentalness, liveness, speechiness, tempo, valence
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
   var groupRef = db.collection("groups").doc(gID);
   var docs = await groupRef.get();
   for(var i = 0; i < docs.data().users.length;i++){
    
    var curUser = docs.data().users[i];
    var userRef = db.collection("users").doc(curUser);
    var uDocs = await userRef.get();
    var reftoken = uDocs.data().accessrefresh;
    var data =  await $.ajax({
              url: '/refresh_token',
              data: {
                'refresh_token': reftoken
              }
            })
    var accesstoken = data.access_token;
    var songPerPerson = Math.floor(50/docs.data().users.length);
    var songs = await getAllUserSongs(accesstoken, Math.floor(1/3 * songPerPerson));
    songIds += songs+",";
    var audFeats = await getAudioFeatures(songs, accesstoken);
    var songDat = await getRecommendedSongs(audFeats, songs, accesstoken, Math.floor(2/3 * songPerPerson));
    for(var j = 0;j < songDat.tracks.length;j++){
      var curId = songDat.tracks[j].id;
      if(!songIds.includes(curId)){
        songIds += curId + ","
        
      }
    }
   }
   if(songIds[songIds.length-1] == ","){
      songIds = songIds.slice(0, songIds.length-1);
    }
   return songIds;
}

//shuffle array
async function recWrapper(){
  document.getElementById("recs").innerHTML = "";
  document.getElementById("recHeader").innerHTML = "<th colspan='3' style='text-align:center'>Group Playlist<br><p style='font-size:15px;' id='lastUpd'>Last Updated: </p><a class='btn btn-primary' id='groupBtn' onclick='createGroupPlaylist()'>Add/Update Playlist</a></th>"
  var user = firebase.auth().currentUser;
  var db = firebase.firestore();
  var userRef = db.collection("users").doc(user.uid);
  var groupRef = db.collection("groups").doc(gID);
  var gDocs = await groupRef.get();
  if(gDocs.data().groupPlaylist.length == 0){
    var allSongs = await compileAllSongs();
    var songArray = allSongs.split(",");
    songArray = shuffle(songArray);
    await groupRef.update({
            groupPlaylist: songArray,
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
    });
    
  }else{
    var lastUpdate = gDocs.data() && gDocs.data().lastUpdated && gDocs.data().lastUpdated.toDate();
    var curDate = new Date();
    if(dateDiffInDays(lastUpdate, curDate) >= 7 || gDocs.data().userNum != gDocs.data().users.length){
      var allSongs = await compileAllSongs();
      var songArray = allSongs.split(",");
      songArray = shuffle(songArray);
      await groupRef.update({
              groupPlaylist: songArray,
              lastUpdated: firebase.firestore.FieldValue.serverTimestamp(),
              userNum: gDocs.data().users.length
      });

    }
    
  }

  var groupRef = db.collection("groups").doc(gID);
  var gDocs = await groupRef.get();
  if(gDocs.data().groupPlaylist.length != 0){
    //get tracks and display in table
    var tracks = gDocs.data().groupPlaylist;
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
    var lastUpd = gDocs.data() && gDocs.data().lastUpdated && gDocs.data().lastUpdated.toDate();
    
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
      
      var songName = obj.name

      
      // document.getElementById("recs").innerHTML += 
      // "<tr class='songClick' href="+songUrl+"><td style='text-align:center;padding: 25px 0'>\
      // <img class='songImg' \
      // src='"+albumImgUrl+"'>"+songName+"\
      //          <br> <p style='font-size:15px;'>by "+artistString+"</p></td></tr>"


      document.getElementById("recs").innerHTML += "<tr><td style='padding-left:50px;padding-right:0px'><a href="+obj.external_urls.spotify+" target='_blank'><img  src="+albumImgUrl+" class='rounded mr-2' style='width:50px;height:50px;'></a></td><td style='text-align:left;padding-top:25px;'>"+songName+"</td><td style='padding-top:25px'>"+artistString+"</td></tr>"
    }
  }






  // var docs = await userRef.get();
  // var reftoken = docs.data().accessrefresh;


  // var data =  await $.ajax({
  //             url: '/refresh_token',
  //             data: {
  //               'refresh_token': reftoken
  //             }
  //           })
  // var accesstoken = data.access_token;
  // var songs = await getAllUserSongs(accesstoken);
  // var audFeats = await getAudioFeatures(songs, accesstoken);
  // getRecommendedSongs(audFeats, songs, accesstoken);


}




// a and b are javascript Date objects
function dateDiffInDays(a, b) {
  const _MS_PER_DAY = 1000 * 60 * 60 * 24;
  // Discard the time and time-zone information.
  const utc1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const utc2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());

  return Math.floor((utc2 - utc1) / _MS_PER_DAY);
}

async function createGroupPlaylist(){
  var user = firebase.auth().currentUser;
  var db = firebase.firestore();
  var userRef = db.collection("users").doc(user.uid);
  var groupRef = db.collection("groups").doc(gID);
  var gDocs = await groupRef.get();
  var uDocs = await userRef.get();
  //creates playlist, stores playlistId, add tracks
  if(gDocs.data().groupPlaylistId == ""){

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
    var playdata = {"name": gDocs.data().name+"'s Group Playlist",
          "description": "A playlist generated by SpotifyGroups that combines the song preferences for each user from the group, "+gDocs.data().name,
          "public": false};
    var playlistData = await $.ajax({
                url: 'https://api.spotify.com/v1/users/'+userId+'/playlists',
                type: 'POST',
                data: JSON.stringify(playdata),
                headers: {"Authorization": "Bearer "+accesstoken}

      });
      var playlistId = playlistData.id
      await userRef.update({
        groupPlaylistIds: firebase.firestore.FieldValue.arrayUnion(playlistData.id)
      });
      await groupRef.update({
          groupPlaylistId: playlistData.id
      })
      var songs = gDocs.data().groupPlaylist;
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
    var lastUpdate = gDocs.data() && gDocs.data().lastUpdated && gDocs.data().lastUpdated.toDate();
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
      
        
        var gDocs = await groupRef.get();
        var uDocs = await userRef.get();
        var playlistId = gDocs.data().groupPlaylistId
        var songs = gDocs.data().groupPlaylist;
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




function makeClickableSongRow(){
  $(".songClick").click(function() {
        window.open(String($(this).attr("href")), "_blank");
    });
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


function logout(){
	firebase.auth().signOut().then(function() {
  // Sign-out successful.
	}).catch(function(error) {
	  // An error happened.
	});
}


// TODO:
// 1)implement music player
