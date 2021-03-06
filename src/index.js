import './index.scss';

const embedHost = 'https://embd.eu/api/embed/';
const EuropeanaMediaPlayer = require("europeanamediaplayer").default;

//localhost:9001?manifest=https%3A%2F%2Fiiif.europeana.eu%2F%2Fpresentation%2F%2F08609%2F%2Ffe9c5449_9522_4a70_951b_ef0b27893ae9%2F%2Fmanifest%3Fformat%3D3%26wskey%3Dapi2demo
//const options = {embedid: "6FFlHN"};
//const options = {embedid: "WZpDVT"};
//const options = {embedid: "qBUhte"};
//const options = {embedid: "6BGMFG"};
//const options = {embedid: "Y1pbs4"};

// VIDEO
//http://localhost:9001/?width=960&height=720&manifest=https%3A%2F%2Fiiif.europeana.eu%2F%2Fpresentation%2F%2F08609%2F%2Ffe9c5449_9522_4a70_951b_ef0b27893ae9%2F%2Fmanifest%3Fformat%3D3%26wskey%3Dapi2demo
// IMAGE
//http://localhost:9001/?width=260&height=520&manifest=https%3A%2F%2Fiiif.europeana.eu%2Fpresentation%2F2021672%2Fresource_document_mauritshuis_670%2Fmanifest%3Fformat%3D3%26wskey%3Dapi2demo
// AUDIO
//http://localhost:9001/?width=260&height=520&manifest=https%3A%2F%2Fiiif.europeana.eu%2Fpresentation%2F22%2F_72315%2Fmanifest%3Fformat%3D3%26wskey%3Dapi2demo

var manifest;

let player;
export { player };

var duration = -1;
var playing = false;

window.addEventListener('load', () => {

  const urlParams = getAllUrlParams(window.location.href);

  if(urlParams.manifest){

    loadJSON(urlParams.manifest, (manifestData) => {

      let mediaMode = manifestData.items[0].items[0].items[0].body.type.toLowerCase();
      $('.player-wrapper').addClass(mediaMode);

      manifest = urlParams.manifest;

      if(urlParams.width && urlParams.height){
        setEmbedDimensions(urlParams.width, urlParams.height, mediaMode === 'image');
      }

      if(['audio', 'video'].indexOf(mediaMode) > -1){
        initialisePlayer($('.player-wrapper'), manifest, mediaMode);
      }
      else if(mediaMode === 'image'){
        const rootItem = manifestData.items[0];
        const imgUrl = rootItem.items[0].items[0].body.id;
        const xywhParam = urlParams.xywh;
        if(!(xywhParam && handleMediaFragment(imgUrl, rootItem.width, rootItem.height, urlParams))){
          $('.player-wrapper').append(`<img src="${manifestData.items[0].items[0].items[0].body.id}">`);
        }
        $('.player-wrapper').removeClass('loading');
        initialiseAttribution(manifestData.items[0], mediaMode);
      }
    });
  }
  else{
    console.log('no manifest supplied');
  }

  if (urlParams.t !== undefined) {
    //options.temporal = urlParams.t;
    //construct start and duration of the temporal fragment
    let parts = urlParams.t.split(',');
    if(split.length > 1){
      duration = parts[1] - parts[0];
    }
  }
});

export const handleMediaFragment = (imgUrl, imgW, imgH, urlParams) => {

  const noramlisedParam = urlParams.xywh.replace(/percent:/, '');
  const isPercent = noramlisedParam !== urlParams.xywh;
  const xywh = noramlisedParam.split(',').map((i) => parseInt(i));

  if(!isValidXYWH(isPercent, imgW, imgH, ...xywh)){
    console.log('Invalid xywh parameters');
    return false;
  }

  let dimensions;

  if(isPercent){
    dimensions = getFragmentPercent(imgW, imgH, ...xywh);
  }
  else{
    dimensions = getFragmentPixel(imgW, imgH, ...xywh, urlParams.height);
  }

  $('.player-wrapper').append('<div class="xywh-img-wrapper"><div class="xywh-img"'
   + ' style="'
   + 'background-image: url(' + imgUrl + '); '
   + 'background-size: ' + dimensions.size  + '%; '
   + 'background-position: ' + dimensions.position.x + '% ' + dimensions.position.y +  '%; '
   + 'padding-top: ' + dimensions.top + '%;'
   + '"></div></div>');
  return true;
};

export const isValidXYWH = (pct, imgW, imgH, x, y, w, h) => {
  let result = true;
  if(pct && (x < 0 || y < 0 || w < 1 || h < 1 || (x + w) > 100 || (y + h) > 100 || x > 100 || y > 100)){
    result = false;
  }
  else if((x < 0 || y < 0 || w < 1 || h < 1 || (x + w) > imgW || (y + h) > imgH)){
    result = false;
  }
  return result;
};

export const getOffsetPixels = (imgD, d, pos) => {
  if(pos === 0){
    return 0;
  }
  let remainFraction = (imgD / d) -1;
  let remainPosition = pos / d;
  return (remainPosition / remainFraction) * 100;
};

export const getOffsetPercent = (pos, d) => {
  let bgScale = 100 / d;
  let numerator = bgScale * pos;
  let denominator = bgScale - 1;
  return [numerator, denominator].indexOf(0) > -1 ? 0 : numerator / denominator;
};

export const dimensionData = (size, x, y, top) => {
  return {
    size: size,
    position: {
      x: x,
      y: y
    },
    top: top
  };
};

export const getFragmentPercent = (imgW, imgH, x, y, w, h) => {
  const wRatio = 100 / w;
  let realPct = 100 / (imgW / imgH);
  let cropRatio = (realPct / 100) * h;
  let paddingTop = cropRatio * wRatio;
  return dimensionData(wRatio * 100, getOffsetPercent(x, w), getOffsetPercent(y, h), paddingTop);
};

export const getFragmentPixel = (imgW, imgH, x, y, w, h, cmpHeight) => {
   return dimensionData(((imgW / w) * 100), getOffsetPixels(imgW, w, x), getOffsetPixels(imgH, h, y), (h/w) * 100);
}

export const loadJSON = (jsonUrl, cb) => {
  fetch(jsonUrl, {
    mode: 'cors',
    method: 'GET',
    headers: { "Content-Type": "application/json; charset=utf-8" }
  })
  .then(res => res.json())
  .then(response => {
    cb(response);
  })
  .catch((err) => {
    console.error(`Could not load ${jsonUrl}`);
    console.log(err);
  });
};

export const setEmbedDimensions = (w, h, noRatio) => {
  const dimensionCss = {'max-width': w + 'px', 'max-height': h + 'px' };
  $('.europeana-media-embed').css(dimensionCss);
  if(!noRatio){
    const pct = (h / w) * 100;
    $('.player-wrapper').css('padding-top', `${pct}%`);
  }
};

/*
export const loadVideo = () => {
  if (options.temporal) {
    manifest = `${embedHost}${options.embedid}/t/${options.temporal}`;
  }
  initialisePlayer($('.player-wrapper'));
};
*/

export const initialiseAttribution = (manifestJsonld, mediaMode) => {
  if(!manifestJsonld.requiredStatement && !manifestJsonld.requiredStatement.en[0]){
    console.log('(no attribution found)');
    return;
  }

  let svgData = '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24"><path d="M0 0h24v24H0z" fill="none"/><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>';
  let htmlAttribution = manifestJsonld.requiredStatement.en[0];

  let btnInfoEl = $('<span class="btn btn-info">' + svgData + '</span>');
  let btnInfo = mediaMode === 'image' ? btnInfoEl.appendTo($('.info')) : btnInfoEl.insertAfter($('.time-display'));

  // TODO: temp code until API supplies this markup
  /*
  if(typeof htmlAttribution !== 'string'){
    const generateRightsList = () => {
      let rightItems = ['cc', 'by', 'sa'].map((key) => `<li class="icon-${key}"></li>`).join('');
      return `<ul class="rights-list">${rightItems}</ul>`;
    };

    let testLicense = 'https://creativecommons.org/licenses/by-sa/2.0/';
    let about      = 'https://www.europeana.eu/portal/record/2022362/_Royal_Museums_Greenwich__http___collections_rmg_co_uk_collections_objects_573492';
    htmlAttribution = ['Title', 'Creator', 'Date', 'Institution', 'Country', 'Rights'].map((name) => {
      return `
        <span class="field">
          <span class="fname">${name}</span>
          <span class="fvalue"
            ${name === 'Rights' ? 'property="cc:License"' : '' }
          >${name === 'Title' ? '<a data-name="title"></a>' :
            name === 'Institution' ? '<a href="http://europeana.eu" target="_blank" rel="noopener">' + name + ' goes here</a>' :
            name === 'Rights' ? generateRightsList() + `<a href="${testLicense}" target="_blank" rel="noopener">Copyright</a>` :
              name + ' goes here'}</span></span>`;
    }).join('');
    htmlAttribution = `<div class="attribution" about="${about}">${htmlAttribution}</div>`;
  }
  */
  // end temp code

  let attribution = $(htmlAttribution).addClass('attribution').appendTo($('.info'));

  attribution.append(`<style type="text/css">
    @import url('/icons/style.css');
    .field:not(:last-child)::after{
      content: ', ';
    }
    .fname{
      display: none;
    }
    .rights-list{
      display: inline;
      list-style: none;
      margin: 0;
      padding: 0;
    }
    .rights-list li{
      display: inline;
      margin-right: 4px;
    }
    .rights-list li a{
      text-transform: uppercase;
    }
    </style>`);

  const rightsList = $('<ul class="rights-list"></ul>').appendTo(attribution);

  attribution.find('[rel="xhv:license http://www.europeana.eu/schemas/edm/rights"]').each((i, el) => {
    $(el).appendTo(rightsList);
    $(el).wrap('<li>');
  });

  setLinkElementData($('[data-name=title]'), manifestJsonld);

  attribution.on('click', (e) => {
    if((e.target.nodeName.toUpperCase() === 'A')){
      e.stopPropagation();
      return;
    }
    attribution.removeClass('showing');
  });

  btnInfo.on('click', () => {
    attribution.toggleClass('showing');
  });
};

export const setLinkElementData = ($el, manifest) => {
  if(manifest.label) {
    const text = manifest.label[Object.keys(manifest.label)[0]];
    $el.text(text);
  }
  if(manifest.seeAlso && manifest.seeAlso.length > 0 && manifest.seeAlso[0].id){
    let url = manifest.seeAlso[0].id;
    url = url.replace('api/v2', 'portal').replace('json-ld', 'html');
    $el.attr('href', url);
    $el.attr('target', '_blank');
    $el.attr('rel', 'noopener');
  }
};

export const initialiseEmbed = (mediaMode) => {

  $('.player-wrapper').removeClass('loading');
  // getSubtitles();

  let manifestJsonld = player.manifest.__jsonld;

  initialiseAttribution(manifestJsonld, mediaMode);

  setLinkElementData($('.title-link'), manifestJsonld);
  $('.logo-link').removeAttr('style');

  if (duration == -1 && manifestJsonld.items[0].duration) {
    duration = manifestJsonld.items[0].duration;
  }
}

/*
function getSubtitles() {
  let subtitles = {};
  let link = `${embedHost}${options.embedid}/subtitles`
  if (options.temporal) {
    link += `/t/${options.temporal}`;
  }

  loadJSON(link, (response) => {
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
  });
}
*/

export const initialisePlayer = (playerWrapper, mediaUrl, mediaMode) => {
  let p = new EuropeanaMediaPlayer(playerWrapper, {manifest: mediaUrl}, {mode: "player", manifest: mediaUrl});
  player = p.player;

  player.avcomponent.on('mediaerror', function() {
    console.log('mediaerror (reinit)')
    initialiseEmbed(mediaMode);
  });
  player.avcomponent.on('mediaready', function() {
    console.log('mediaready (reinit)')
    if(mediaMode === 'audio'){
      $('.eups-player').removeAttr('style');
    }
    initialiseEmbed(mediaMode);
  });
  player.avcomponent.on('play', () => {
    playing = true;
    playerWrapper.addClass('playing');
  });
  player.avcomponent.on('pause', () => {
    playing = false;
    playerWrapper.removeClass('playing');
  });
}

export const getAllUrlParams = (url) => {
  // get query string from url (optional) or window
  let queryString = url ? url.split('?')[1] : window.location.search.slice(1);
  let obj = {};
  if (queryString) {

    // remove hash param
    queryString = queryString.split('#')[0];

    var arr = queryString.split('&');

    for (var i = 0; i < arr.length; i++) {
      // separate the keys and the values
      var a = arr[i].split('=');

      // set parameter name and value (use 'true' if empty)
      var paramName = a[0];
      var paramValue = typeof (a[1]) === 'undefined' ? true : decodeURIComponent(a[1]);

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
