'use strict';

const superagent = require('superagent');

exports.getDateTime = function() {
    var date = new Date();

    var hour = date.getHours();
    hour = (hour < 10 ? "0" : "") + hour;

    var min  = date.getMinutes();
    min = (min < 10 ? "0" : "") + min;

    var sec  = date.getSeconds();
    sec = (sec < 10 ? "0" : "") + sec;

    var year = date.getFullYear();

    var month = date.getMonth() + 1;
    month = (month < 10 ? "0" : "") + month;

    var day  = date.getDate();
    day = (day < 10 ? "0" : "") + day;

    return year + "-" + month + "-" + day + "T" + hour + ":" + min + ":" + sec + 'Z';
};

exports.returnInternalError = function(res, jsonToReturn, statusMessage) {
	res.statusMessage = statusMessage;
	console.log(res.statusMessage);
    res.statusCode = 503;
    res.end(JSON.stringify(jsonToReturn[Object.keys(jsonToReturn)[0]] || {}, null, 2));
}

exports.speechToText = function(audioBuffer, language, callback) {
    if (language === 'en') language = 'en-EN';
    else language = 'fr-FR';
    superagent.post('https://speech-to-text.api.surirobot.net/recognize')
    .attach('audio', audioBuffer, 'audio.wav')
    .field('language', language)
    .end(callback);
};

exports.nlpGetIntent = function(text, lang, callback) {
	if (lang !== 'en' && lang !== 'fr') lang='fr';
    superagent.post('https://nlp.api.surirobot.net/getintent')
    .set('Content-Type', 'application/json')
    .send({text: text,	language: lang})
    .end(callback);
};

exports.nlpGetAnswer = function(text, conversation_id, callback) {
    superagent.post('https://nlp.api.surirobot.net/getanswer')
    .set('Content-Type', 'application/json')
    .send({text: text,	conversation_id: conversation_id})
    .end(callback);
};

exports.nlpUpdateMemory = function(field, value, userId, callback) {
	if (!value) value="";
    superagent.post('https://nlp.api.surirobot.net/updateMemory')
    .set('Content-Type', 'application/json')
    .send({field: field, value: value, userId: userId})
    .end(callback);
};

exports.getWeatherByCoords = function(latitude, longitude, time, callback) {
    if (!latitude || !longitude) {
        latitude = 48.856614;
        longitude = 2.3522219;
    }
    if (!time) {
        time = getDateTime();
    }
	console.log(time);
    superagent.get('https://weather.api.surirobot.net/forecast/findByCoordinates')
    .query({latitude: latitude})
    .query({longitude: longitude})
    .query({start_time: time})
    .end(callback);
};

exports.textToSpeech = function(text, lang, callback) {
    superagent.post('https://text-to-speech.api.surirobot.net/speak')
    .send({text: '{"text": "' + text + '"}'})
    .end(callback);
};

exports.ttsGetFullDownloadLink = function(localServerLink) {
    return 'https://text-to-speech.api.surirobot.net' + localServerLink.substr(1); //remove 1st dot
};
