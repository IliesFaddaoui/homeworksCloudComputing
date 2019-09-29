const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');
const SCOPES = ['https://www.googleapis.com/auth/drive'];
const TOKEN_PATH = 'token.json';
var express = require("express");
var app = express();
var bodyParser     =        require("body-parser");
var today = new Date();
var date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate()+'-'+today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();;
//Here we are configuring express to use body-parser as middle-ware.
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.listen(3000,() => {
  console.log("server running on port 3000");
});
/**
*POST to upload text file in google drive @localhost:3000/postTextFile
**/
app.post('/postTextFile',function(req,res){
  var text =req.body.text;
  fs.writeFile('FichierText-'+date+'.txt', text, (err) => {
    if (err) throw err;
    console.log("fichier texte a bien ete cree");
  })
  fs.readFile('credentials.json', (err, content) => {
    if (err) return console.log('Error loading client secret file:', err);
    // Authorize a client with credentials, then call the Google Drive API.
    authorize(JSON.parse(content), postTextFile);
  });
  console.log("file created and send with success ");
  res.end("file created and send with success ");
});

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to c   all with the authorized client.
 */
function authorize(credentials, callback) {
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getAccessToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getAccessToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error retrieving access token', err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}


/**
 * Lists the names and IDs of up to 10 files.
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function listFiles(auth) {
  const drive = google.drive({version: 'v3', auth});
  drive.files.list({
    pageSize: 10,
    fields: 'nextPageToken, files(id, name)',
  }, (err, res) => {
    if (err) return console.log('The API returned an error: ' + err);
    const files = res.data.files;
    if (files.length) {
      console.log('Files:');
      files.map((file) => {
        console.log(`${file.name} (${file.id})`);
      });
    } else {
      console.log('No files found.');
    }
    return files;
  });
}


/**
*Post a text file to the drive
* @param {google.auth.OAuth2} auth An authorized OAuth2 client.
**/
function postTextFile(auth){
const drive = google.drive({version: 'v3', auth});
  var fileMetadata = {
  'name': 'FichierText-'+date+'.txt'
};
var media = {
  mimeType: 'text/plain',
  body: fs.createReadStream('FichierText-'+date+'.txt')
};
drive.files.create({
  resource: fileMetadata,
  media: media,
  fields: 'id'
}, function (err, file) {
  if (err) {
    // Handle error
    console.error(err);
  } else {
    console.log('File Id: ', file.id);
  }
});
}
