window.onSpotifyWebPlaybackSDKReady = () => {};

var deviceID = "";
var access_token = "";
var sdk = "";
async function waitForSpotifyWebPlaybackSDKToLoad () {
  return new Promise(resolve => {
    if (window.Spotify) {
      resolve(window.Spotify);
    } else {
      window.onSpotifyWebPlaybackSDKReady = () => {
        resolve(window.Spotify);
      };
    }
  });
};

firebase.auth().onAuthStateChanged(function(user) {
  if(user){
    var user = firebase.auth().currentUser;
    (async () => {
      const { Player } = await waitForSpotifyWebPlaybackSDKToLoad();
      access_token = await getAToken(user.uid);
      sdk = new Spotify.Player({
        name: "Web Playback SDK",
        getOAuthToken: callback => { callback(access_token); }
      });
      sdk.addListener('initialization_error', ({ message }) => { console.error(message); });
      sdk.addListener('authentication_error', ({ message }) => { console.error(message); });
      sdk.addListener('account_error', ({ message }) => { console.error(message); });
      sdk.addListener('playback_error', ({ message }) => { console.error(message); });

      // Playback status updates
      sdk.addListener('player_state_changed', state => { 
        if(state.paused){
          document.getElementById("pause").innerHTML = "<i class='fas fa-play'></i>"
          if(String($("#pause").attr("data-isPause")) == "false"){
            window.clearInterval(window.myVar);
            console.log("cleared timer which means it came from False"); 
             document.getElementById("pause").setAttribute("data-isPause","true")
          }
         
          
        }else{
          document.getElementById("pause").innerHTML = "<i class='fas fa-pause'></i>"
          if(String($("#pause").attr("data-isPause")) == "true"){
            window.myVar = setInterval(incTime, 1000);
            console.log("started timer which means came from True"); 
             document.getElementById("pause").setAttribute("data-isPause","false")
          }
         
          
           
        }
        console.log(String($("#pause").attr("data-isPause"))); 
      });
      sdk.addListener('ready', ({ device_id }) => {
        deviceID = device_id;
        console.log('Ready with Device ID', device_id);
      });
      
      sdk.connect();
    })();
  }else{

  }
});

async function getAToken(uid){
  var db = firebase.firestore();
  var userRef = db.collection("users").doc(uid);
  var docs = await userRef.get();
  var reftoken = docs.data().accessrefresh;

   var data =  await $.ajax({
              url: '/refresh_token',
              data: {
                'refresh_token': reftoken
              }
            });

   return data.access_token
}

function incTime(){
  rangeSlider.noUiSlider.set(time);
   time += 1;
  // console.log(time)
}
