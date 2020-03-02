//import 'materialize-css/dist/css/materialize.min.css';
//import 'materialize-css/dist/js/materialize.min.js';

const embedHost = 'https://embd.eu/api/embed/';
const EuropeanaMediaPlayer = require("europeanamediaplayer").default;

//var options = {embedid: "6FFlHN"};
//var options = {embedid: "WZpDVT"};
//var options = {embedid: "qBUhte"};
//var options = {embedid: "6BGMFG"};
var options = {embedid: "Y1pbs4"};
var manifest;
var manifests = [];
var embedWidth;
var embedHeight;
var player;
var manifestJsonld = {};
var manifestMetadata = {};
var subtitles = {};
let currentMediaItem = 1;
export { currentMediaItem };

let timeUpdate;
export { timeUpdate };

var start = 0;
var duration = -1;
var playing = false;

window.addEventListener('load', () => {
  if (window.location.pathname.length > 1) {
    options.embedid = window.location.pathname.substring(1);
  }

  getEmbedInfo();

  if (getAllUrlParams(window.location.href).t != undefined) {
    options.temporal = decodeURIComponent(getAllUrlParams(window.location.href).t);
    //construct start and duration of the temporal fragment
    if (options.temporal.indexOf(",") > -1) {
      let parts = options.temporal.split(",");
      start = parts[0];
      duration = parts[1] - parts[0];
    }
  }
});

function getEmbedInfo() {
  let link = `${embedHost}${options.embedid}`;
  fetch(
      link, {
          method: 'GET',
          mode: 'cors',
          headers: { "Content-Type": "application/json; charset=utf-8" }
      })
  .then(res => res.json())
  .then(response => {
      if (Array.isArray(response.videoid)) {
        manifests = response.videoid;
        manifest = manifests[0].vid;
      } else {
        manifest = response.videoid;
      }
      embedWidth = response.width;
      embedHeight = response.height;

      loadVideo();

  })
  .catch(err => {
      console.error("Could not retrieve embed info");
      console.log(err);
  });
}

function loadVideo() {
  $(".player-wrapper").css({"max-width": embedWidth + 'px', "max-height": embedHeight + 'px' });
  $(".aspect-ratio").width(embedWidth);

  if (options.temporal) {
    manifest = `${embedHost}${options.embedid}/t/${options.temporal}`;
  }

  let vObj = {manifest: manifest};
  let opt = {mode: "player"};
  opt.manifest = manifest;

  setTimeout(function() {
    let p = new EuropeanaMediaPlayer($('.player-wrapper'), vObj, opt);
    player = p.player;

    player.avcomponent.on('mediaerror', function() {
      initializeEmbed();
    });

    player.avcomponent.on('mediaready', function() {
      initializeEmbed();
    });

    player.avcomponent.on('play', function() {
      playing = true;
      $('.player-wrapper').addClass('playing');
    });

    player.avcomponent.on('pause', function() {
      playing = false;
      $('.player-wrapper').removeClass('playing');
    });

  }, 50);
}

export const initializeEmbed = () => {
  $('.player-wrapper').removeClass('loading');

  timeUpdate = setInterval(() => mediaHasEnded(player.hasEnded()), 50);

  getSubtitles();

  manifestJsonld = player.manifest.__jsonld;
  manifestMetadata = manifestJsonld.metaData;

  //let langCode = manifestMetadata.find(obj => obj.label.en[0] == "language").value[Object.keys(manifestMetadata.find(obj => obj.label.en[0] == "language").value)[0]][0];
  if (manifestJsonld.label) {
    $(".video-title").text(manifestJsonld.label[Object.keys(manifestJsonld.label)[0]]);
  }
  //if (manifestJsonld.description) {
  //  $(".video-description").text(manifestJsonld.description[Object.keys(manifestJsonld.description)[0]]);
  //}

  if (duration == -1 && manifestJsonld.items[0].duration) {
     duration = manifestJsonld.items[0].duration;
  }
}

function getSubtitles() {
  let link = `${embedHost}${options.embedid}/subtitles`

  if (options.temporal) {
    link += `/t/${options.temporal}`;
  }

  fetch(
      link, {
          method: 'GET',
          mode: 'cors',
          headers: { "Content-Type": "application/json; charset=utf-8" }
      })
  .then(res => res.json())
  .then(response => {
      let   subs = response;
      subs.forEach(function(subtitle) {
        let language = subtitle.language;
        //check if track already exists
        if (!subtitles.hasOwnProperty(language)) {
          subtitles[language] = [];
        }
        subtitles[language].push(subtitle);
      });

      for (var language of Object.keys(subtitles)) {
        let track = $("#embed-player video")[0].addTextTrack("subtitles", "user_subitles", language);

        subtitles[language].forEach(function(subtitle) {
          var cue = new VTTCue(subtitle.start/1000, subtitle.end/1000, subtitle.text);
          cue.id = subtitle.id;
          cue.line = -4;
          cue.size = 90;
          track.addCue(cue);
        });
      }
      player.initLanguages();
  })
  .catch(err => {
      console.error("Could not retrieve subtitles");
      console.log(err);
  });
}

export const mediaHasEnded = (ended) => {
  if ((ended || player.avcomponent.getCurrentTime() == duration) && currentMediaItem < manifests.length) {
    //load next playlist item
    manifest = manifests[currentMediaItem].vid;
    currentMediaItem ++;

    //clear
    $('.player-wrapper').empty();

    let vObj = {manifest: manifest};
    let opt = {mode: "player"};
    opt.manifest = manifest;

    let p = new EuropeanaMediaPlayer($('.player-wrapper'), vObj, opt);
    player = p.player;

    player.avcomponent.on('mediaerror', function() {
      initializeEmbed();
    });

    player.avcomponent.on('mediaready', function() {
      initializeEmbed();
    });
  }
};

export const getAllUrlParams = (url) => {
  // get query string from url (optional) or window
  var queryString = url ? url.split('?')[1] : window.location.search.slice(1);

  // we'll store the parameters here
  var obj = {};

  // if query string exists
  if (queryString) {

    // stuff after # is not part of query string, so get rid of it
    queryString = queryString.split('#')[0];

    // split our query string into its component parts
    var arr = queryString.split('&');

    for (var i = 0; i < arr.length; i++) {
      // separate the keys and the values
      var a = arr[i].split('=');

      // set parameter name and value (use 'true' if empty)
      var paramName = a[0];
      var paramValue = typeof (a[1]) === 'undefined' ? true : a[1];

      // (optional) keep case consistent
      paramName = paramName.toLowerCase();
      //if (typeof paramValue === 'string') paramValue = paramValue.toLowerCase();

      // if the paramName ends with square brackets, e.g. colors[] or colors[2]
      if (paramName.match(/\[(\d+)?\]$/)) {

        // create key if it doesn't exist
        var key = paramName.replace(/\[(\d+)?\]/, '');
        if (!obj[key]) obj[key] = [];

        // if it's an indexed array e.g. colors[2]
        if (paramName.match(/\[\d+\]$/)) {
          // get the index value and add the entry at the appropriate position
          var index = /\[(\d+)\]/.exec(paramName)[1];
          obj[key][index] = paramValue;
        } else {
          // otherwise add the value to the end of the array
          obj[key].push(paramValue);
        }
      } else {
        // we're dealing with a string
        if (!obj[paramName]) {
          // if it doesn't exist, create property
          obj[paramName] = paramValue;
        } else if (obj[paramName] && typeof obj[paramName] === 'string'){
          // if property does exist and it's a string, convert it to an array
          obj[paramName] = [obj[paramName]];
          obj[paramName].push(paramValue);
        } else {
          // otherwise add the property
          obj[paramName].push(paramValue);
        }
      }
    }
  }
  return obj;
};
