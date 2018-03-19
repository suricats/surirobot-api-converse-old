'use strict';

const Requests = require('./Requests');
const ErrorsCheck = require('./ErrorsCheck');
var async = require('async');

exports.getbotspeaking = function(args, res, next) {
  /**
   * get the bot speech answer for the user input speech
   *
   * audio File user audio
   * language String Language of speech (optional)
   * returns OutputMessages
   **/
    var toReturn = {};
        toReturn['application/json'] = {
        "answerText" : "",
        "answerAudioLink" : ""
    };
    res.setHeader('Content-Type', 'application/json');

	if (!ErrorsCheck.checkRequest(args, res, toReturn)) return;
  
    ///GET SPEECH TEXT WITH STT API
    Requests.speechToText(args.audio.value.buffer, args.language.value, 
        (r_err, r_res) => {
        if (r_err) {
            console.log(r_err);
            res.statusMessage = 'Error in Speech To Text API: Received code ' + r_err.status;
			console.log(res.statusMessage);
            res.statusCode = 503;
            res.end(JSON.stringify(toReturn[Object.keys(toReturn)[0]] || {}, null, 2));
        }
        else {
            toReturn[Object.keys(toReturn)[0]].answerText = "";
			if (!ErrorsCheck.checkSTTanswer(r_res, res, toReturn)) return;
            for (var i=0; i<r_res.body.data.text.length; i++) {
                toReturn[Object.keys(toReturn)[0]].answerText += r_res.body.data.text[i] + '. ';
            }
            console.log('Input text: ' + toReturn[Object.keys(toReturn)[0]].answerText);
			if (!ErrorsCheck.checkSTTresult(toReturn[Object.keys(toReturn)[0]].answerText, res, toReturn)) return;
            ///GET INTENT WITH NLP API
            Requests.nlpGetIntent(toReturn[Object.keys(toReturn)[0]].answerText, args.language.value, 
                (err_nlp, res_nlp) => {
		if (err_nlp) {
                    res.statusMessage = 'Error in NLP API /getintent: Received code '+ err_nlp.response.res.statusCode + ' and status message: ' + err_nlp.response.res.statusMessage;
					console.log(res.statusMessage); 
                    res.statusCode = 503;
                    res.end(JSON.stringify(toReturn[Object.keys(toReturn)[0]] || {}, null, 2));
		} else {
                    //console.log(res_nlp.body);
                    var understood=false;
                    var preparingResponse = true;
                    ///Preparing textual response depending on NLP response
                    if (res_nlp.body && res_nlp.body.results && res_nlp.body.results.intents && res_nlp.body.results.intents.length>0 && res_nlp.body.results.intents[0].slug) {
                        understood=true;
                        var intent = res_nlp.body.results.intents[0].slug;
                        console.log('Intent found: '+intent);
                        ///IF INTENT IS METEO
                        if (intent==='get-weather') {
                            var forecastLatitude = null;
                            var forecastLongitude = null;
                            var startTime = null;
                            if (res_nlp.body.results.entities && res_nlp.body.results.entities.location) {
                                forecastLongitude = res_nlp.body.results.entities.location[0].lng;
                                forecastLatitude = res_nlp.body.results.entities.location[0].lat;
                            }
                            ///Add sentence to the message, to express the date of the forecast
                            var dateSentence = "";
                            if (res_nlp.body.results.entities && res_nlp.body.results.entities.datetime) {
                                startTime = res_nlp.body.results.entities.datetime[0].iso.split('+')[0] + 'Z';
								var separator = 'à';
		                        if (args.language.value !== 'fr') separator = 'at';
		                        dateSentence = 'le ' + res_nlp.body.results.entities.datetime[0].formatted.split(separator)[0];
                            }
							else startTime = Requests.getDateTime();
                            ///GET WHEATHER WITH WHEATHER API
                            Requests.getWeatherByCoords(forecastLatitude, forecastLongitude, startTime,
                                (err_wh, res_wh) => {
                                if (err_wh) {
                                    res.statusMessage = "Error in Wheather API /getWeatherByCoords: Received code " + err_wh.response.res.statusCode + ' and status message: ' + err_wh.response.res.statusMessage;
                                    console.log(res.statusMessage);
                                    res.statusCode = 503;
                                    res.end(JSON.stringify(toReturn[Object.keys(toReturn)[0]] || {}, null, 2));
                                } else {
									if (!ErrorsCheck.checkWeatherResult(res_wh, res, toReturn)) return;
                                    toReturn[Object.keys(toReturn)[0]].answerText = res_wh.body.messages[0] + ' ';
                                    toReturn[Object.keys(toReturn)[0]].answerText += dateSentence.trim() + '. ';
                                    toReturn[Object.keys(toReturn)[0]].answerText += res_wh.body.messages[1] + ' ';
                                    console.log('Response: ' + toReturn[Object.keys(toReturn)[0]].answerText);
									if (!ErrorsCheck.checkTTSinput(toReturn[Object.keys(toReturn)[0]].answerText, res, toReturn)) return;
                                    ///Get the speech for this textual answer
                                    Requests.textToSpeech(toReturn[Object.keys(toReturn)[0]].answerText, args.language.value,
                                        (s_err, s_res) => {
                                        if (s_err) {
                                            res.statusMessage = 'Error in Text To Speech API: Received code ' + s_err.response.res.statusCode + ' and status message: ' + s_err.response.res.statusMessage;
											console.log(res.statusMessage);
                                            res.statusCode = 503;
                                            res.end(JSON.stringify(toReturn[Object.keys(toReturn)[0]] || {}, null, 2));
                                        }
                                        else {
											if (!ErrorsCheck.checkTTSresult(s_res, res, toReturn)) return;
                                            toReturn[Object.keys(toReturn)[0]].answerAudioLink = Requests.ttsGetFullDownloadLink(s_res.body.downloadLink);
                                            res.end(JSON.stringify(toReturn[Object.keys(toReturn)[0]] || {}, null, 2));
                                        }
                                    });    
                                }
                            });
                        }
                        else if (intent && intent !=="") {
                            ///Intent with no specific behaviour: simply return the answer generated by the bot
                            Requests.nlpGetAnswer(toReturn[Object.keys(toReturn)[0]].answerText,
                                (err_nlp2, res_nlp2) => {
                                if (err_nlp2) {
                                    res.statusMessage = 'Error in NLP API /getanswer: Received code '+ err_nlp.response.res.statusCode + ' and status message: ' + err_nlp.response.res.statusMessage;
									console.log(res.statusMessage); 
									res.statusCode = 503;
                                    res.end(JSON.stringify(toReturn[Object.keys(toReturn)[0]] || {}, null, 2));
                                } else {
									if (!ErrorsCheck.checkNLPGetAnswerresult(res_nlp2, res, toReturn)) return;
                                    toReturn[Object.keys(toReturn)[0]].answerText = "";
                                    for (var i=0; i<res_nlp2.body.results.messages.length; i++) {
                                        toReturn[Object.keys(toReturn)[0]].answerText += res_nlp2.body.results.messages[i].content + ' ';
                                    }
                                    console.log('Response: ' + toReturn[Object.keys(toReturn)[0]].answerText);
									if (!ErrorsCheck.checkTTSinput(toReturn[Object.keys(toReturn)[0]].answerText, res, toReturn)) return;
                                    ///Get the speech for this textual answer
                                    Requests.textToSpeech(toReturn[Object.keys(toReturn)[0]].answerText, args.language.value,
                                        (s_err, s_res) => {
                                        if (s_err) {
                                            res.statusMessage = 'Error in Text To Speech API: Received code ' + s_err.response.res.statusCode + ' and status message: ' + s_err.response.res.statusMessage;
											console.log(res.statusMessage);
                                            res.statusCode = 503;
                                            res.end(JSON.stringify(toReturn[Object.keys(toReturn)[0]] || {}, null, 2));
                                        }
                                        else {
											if (!ErrorsCheck.checkTTSresult(s_res, res, toReturn)) return;
                                            toReturn[Object.keys(toReturn)[0]].answerAudioLink = Requests.ttsGetFullDownloadLink(s_res.body.downloadLink);
                                            console.log('Speech download link: ' + toReturn[Object.keys(toReturn)[0]].answerAudioLink);
                                            res.end(JSON.stringify(toReturn[Object.keys(toReturn)[0]] || {}, null, 2));
                                        }
                                    });    
                                }
                            });
                        }
                        else {
                            understood = false;
                        }
                    }
                    if (!understood) {
                        toReturn[Object.keys(toReturn)[0]].answerText = "Pardonnez-moi, je n'ai pas compris. Pouvez-vous reformuler?";
                        if (args.language.value !== 'fr') toReturn[Object.keys(toReturn)[0]].answerText = "Excuse-me, I didn't get what you said. Can you rephrase?";
                        ///Get the speech for this textual answer
                        Requests.textToSpeech(toReturn[Object.keys(toReturn)[0]].answerText, args.language.value,
                            (s_err, s_res) => {
                            if (s_err) {
                                res.statusMessage = 'Error in Text To Speech API: Received code ' + s_err.response.res.statusCode + ' and status message: ' + s_err.response.res.statusMessage;
								console.log(res.statusMessage);
                                res.statusCode = 503;
                                res.end(JSON.stringify(toReturn[Object.keys(toReturn)[0]] || {}, null, 2));
                            }
                            else {
								if (!ErrorsCheck.checkTTSresult(s_res, res, toReturn)) return;
                                toReturn[Object.keys(toReturn)[0]].answerAudioLink = Requests.ttsGetFullDownloadLink(s_res.body.downloadLink);
                                res.end(JSON.stringify(toReturn[Object.keys(toReturn)[0]] || {}, null, 2));
                            }
                        });    
                    }   
		}
            });
        }
    });
};
