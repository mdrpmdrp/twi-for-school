const functions = require('firebase-functions');
const line = require('@line/bot-sdk');
const express = require('express');

// const config = {
//    channelAccessToken: functions.config().line.channel_access_token,
//    channelSecret: functions.config().line.channel_secret
// }
const config = {
    channelAccessToken: 'o+nrWxYz7wJdpfbM42C+t9bLwoYiV538Xw3uKDEwzZhAfDze17MUH29avJsTnJLuno31xpu4QfdHAvQqh0ai3XlERjNNLQe+RSZ5HSuOULm90ZglxlPYdBaAIorotL3jvzxG3stzkMuwSUo00/jnQQdB04t89/1O/w1cDnyilFU=',
    channelSecret: '97f7b7f97a3a4dd7391327ec08edd976',
    port: '3000'
}

const app = express();

exports.twiAPI = functions
    .region('asia-northeast1')
    .https
    .onRequest(app);

const { postToDialogflow, createLineTextEvent, convertToDialogflow, replyToUser } = require('./dialogflow')
function handleEvent(req, event) {
    switch (event.type) {
        case 'message':
            switch (event.message.type) {
                case 'text':
                    return handleText(req, event);
                case 'location':
                    return handleLocation(req, event);
                case 'video':
                    return handleVideo(req, event);
                case 'audio':
                    return handleAudio(req, event);
            }
        case 'postback':
            return handlePostback(req, event);
        case 'follow':
            return handleFollow(req, event);
        default:
            throw new Error(`Unknown event: ${JSON.stringify(event)}`);
    }
}
function handleText(req, event) {

    return postToDialogflow(req, event);
}

function handleLocation(req, event) {
    const message = event.message;
    const newEvent = createLineTextEvent(req, event, `LAT : ${message.latitude}, LNG : ${message.longitude}`);
    return convertToDialogflow(req, newEvent);
}
function handleVideo(req, event) {
    const message = event.message;
    const newEvent = createLineTextEvent(req, event, '#video');
    return convertToDialogflow(req, newEvent);
}
function handleAudio(req, event) {
    const message = event.message;
    const newEvent = createLineTextEvent(req, event, '#audio');
    return convertToDialogflow(req, newEvent);
}

function handlePostback(req, event) {

    let newEvent
    if (event.postback.params && event.postback.params.date) {
        const date = event.postback.params.date;
        newEvent = createLineTextEvent(req, event, `DATE: ${date}`);

    } else {
        let data = event.postback.data
        newEvent = createLineTextEvent(req, event, data);
    }
    return convertToDialogflow(req, newEvent);

}

function handleFollow(req, event) {

    let newEvent
    let uid = event.source.userId
    let data = '#follow-key ' + uid
    newEvent = createLineTextEvent(req, event, data);
    return convertToDialogflow(req, newEvent);

}
app.post('/webhook', line.middleware(config), (req, res) => {
    // req.body.events should be an array of events
    if (!Array.isArray(req.body.events)) {
        return res.status(500).end();
    }
    // handle events separately
    Promise.all(req.body.events.map(event => {
        console.log('event', event);
        // check verify webhook event
        if (event.replyToken === '00000000000000000000000000000000' ||
            event.replyToken === 'ffffffffffffffffffffffffffffffff') {
            return;
        }

        //ข้อความที่ต้องการให้แสดงใน Chat Tool 
        const returnMessage = handleEvent(req, event);
        console.log("🚀 ~ returnMessage", returnMessage)
        return returnMessage;
    }))
        .then((returnMessage) => {
            //ให้ส่งไปในรูปแบบนี้
            res.status(200).send(returnMessage);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).end();
        });
});