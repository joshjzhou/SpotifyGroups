/**
 * This is an example of a basic node.js script that performs
 * the Authorization Code oAuth2 flow to authenticate against
 * the Spotify Accounts.
 *
 * For more information, read
 * https://developer.spotify.com/web-api/authorization-guide/#authorization_code_flow
 */

var express = require('express'); // Express web server framework
var request = require('request'); // "Request" library
var cors = require('cors');
var querystring = require('querystring');
var cookieParser = require('cookie-parser');
const axios = require('axios');
const cheerio = require('cheerio');


var client_id = '3477422c8e7946beb3703525f0b4a3b9'; // Your client id
var client_secret = '12ef25184f034646a6ac3e271cc7d5e7'; // Your secret
var redirect_uri = ' https://spotify-groups.herokuapp.com/home/callback'; // Your redirect uri

/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */
var generateRandomString = function(length) {
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

var stateKey = 'spotify_auth_state';

var app = express();

// app.use(express.static(__dirname + '/public'))
//    .use(cors())
//    .use(cookieParser());
app.use(express.static('public'))
app.use(cors()).use(cookieParser());

app.get('/signIn', function(request, response){
    response.sendFile(__dirname + '/public/test.html');
});

app.get('/', function(request, response){
    response.sendFile(__dirname + '/public/index.html');
});


app.get('/home', function(request, response){
  response.sendFile(__dirname + '/public/home.html');
});

app.get('/login', function(req, res) {

  var state = generateRandomString(16);
  res.cookie(stateKey, state);

  // your application requests authorization
  var scope = 'user-read-private user-read-email user-top-read user-library-modify user-library-read playlist-read-private playlist-modify-public playlist-modify-private user-read-recently-played streaming user-modify-playback-state';
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri,
      state: state
    }));
});

app.get('/home/callback', function(req, res) {

  // your application requests refresh and access tokens
  // after checking the state parameter

  var code = req.query.code || null;
  var state = req.query.state || null;
  var storedState = req.cookies ? req.cookies[stateKey] : null;

  if (state === null || state !== storedState) {
    res.redirect('/#' +
      querystring.stringify({
        error: 'state_mismatch'
      }));
  } else {
    res.clearCookie(stateKey);
    var authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      form: {
        code: code,
        redirect_uri: redirect_uri,
        grant_type: 'authorization_code'
      },
      headers: {
        'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
      },
      json: true
    };

    request.post(authOptions, function(error, response, body) {
      if (!error && response.statusCode === 200) {

        var access_token = body.access_token,
            refresh_token = body.refresh_token;

        var options = {
          url: 'https://api.spotify.com/v1/me',
          headers: { 'Authorization': 'Bearer ' + access_token },
          json: true
        };

        // use the access token to access the Spotify Web API
        request.get(options, function(error, response, body) {
          console.log(body);
        });

        // we can also pass the token to the browser to make requests from there
        res.redirect('/home#' +
          querystring.stringify({
            access_token: access_token,
            refresh_token: refresh_token
          }));
      } else {
        res.redirect('/home#' +
          querystring.stringify({
            error: 'invalid_token'
          }));
      }
    });
  }
});

app.get('/refresh_token', function(req, res) {

  // requesting access token from refresh token
  var refresh_token = req.query.refresh_token;
  var authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: { 'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64')) },
    form: {
      grant_type: 'refresh_token',
      refresh_token: refresh_token
    },
    json: true
  };

  request.post(authOptions, function(error, response, body) {
    if (!error && response.statusCode === 200) {
      var access_token = body.access_token;
      console.log(body)
      res.send({
        'access_token': access_token
      });
    }
  });
});



app.get('/top_tracks', function(req, res){
    var options = {
          url: 'https://api.spotify.com/v1/me/top/tracks?time_range=short_term&limit='+req.query.num_songs,
          headers: { 'Authorization': 'Bearer ' + req.query.access_token },
          json: true
        };

        // use the access token to access the Spotify Web API
        request.get(options, function(error, response, body) {
          console.log(body)
          res.send(body)
        });
});


app.get('/genius_songs', function(req, res){
  console.log(req.query.artist_song);
    var options = {
          url: 'https://api.genius.com/search?q='+req.query.artist_song,
          headers: { 'Authorization': 'Bearer kHf5RckcfERlOGr98eKoh2AtPqDcTlpWIlYuXLSo6cjhZ4hKr1gefUixamoaG4KX' },
          json: true
        };

        request.get(options, function(error, response, body) {
          console.log(body)
          res.send(body)
        });
});


app.get('/scrape', function(req, res){
    const url = 'https://genius.com'+req.query.api_path;
    axios.get(url)
    .then(response => {
      let $ = cheerio.load(response.data);
      res.send($('.lyrics').text());
    })
    
});



app.get('/groups/:groupId', function(req, res){

    res.sendFile(__dirname + '/public/groups.html');
});

app.get('/lyrics', function(req, res){

    res.sendFile(__dirname + '/public/lyrics.html');
});

app.get('/stats', function(req, res){
    res.sendFile(__dirname + '/public/stats.html');
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 8888;
}
app.listen(port);

//exports.api = functions.https.onRequest(app);

