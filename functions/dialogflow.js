const functions = require("firebase-functions");
const request = require('request');
const crypto = require('crypto');

const config = {
    agentId: '3c3369a9-12b6-4158-9ee7-bc0800559eeb',
    channelSecret: '97f7b7f97a3a4dd7391327ec08edd976',
    channelAccessToken: 'o+nrWxYz7wJdpfbM42C+t9bLwoYiV538Xw3uKDEwzZhAfDze17MUH29avJsTnJLuno31xpu4QfdHAvQqh0ai3XlERjNNLQe+RSZ5HSuOULm90ZglxlPYdBaAIorotL3jvzxG3stzkMuwSUo00/jnQQdB04t89/1O/w1cDnyilFU=',
}
// const config = {
//     agentId: functions.config().dialogflow.agent_id,
//     channelSecret: functions.config().line.channel_secret,
//     channelAccessToken: functions.config().line.channel_access_token,
// }

const LINE_MESSAGING_API = 'https://api.line.me/v2/bot/message';
const LINE_HEADER = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${config.channelAccessToken}`
};

function postToDialogflow(req, event) {
    req.headers.host = "dialogflow.cloud.google.com";
    request.post({
        uri: `https://dialogflow.cloud.google.com/v1/integrations/line/webhook/${config.agentId}`,
        headers: req.headers,
        body: JSON.stringify(req.body)
    });
    let message = event.message.text
    switch (true) {
        case message == 'นัดหมายวัน-เวลารียน':
            message = 'กรุณาเลือกวิชาเรียนที่ต้องการนัดหมายเวลาเรียนค่ะ'
            break;
        case message == 'วิชาร้องเพลง':
            message = 'เลือกวันที่ต้องการนัดหมายเรียน'
            break;
        case message == 'วิชาดนตรี':
            message = 'เลือกวันที่ต้องการนัดหมายเรียน'
            break;
        case message.indexOf('DATE') == 0:
            message = 'เลือกเวลาเรียน'
            break;
        case message.indexOf('Time') == 0:
            message = 'ตรวจสอบข้อมูล'
            break;
        case message == 'ยืนยันการจอง':
            message = 'ขอทราบชื่อ และเบอร์โทรด้วยค่ะ'
            break;
        case message == 'เปลี่ยนวันที่':
            message = 'เลือกวันที่ต้องการนัดหมายเรียน'
            break;
        case message == 'เปลี่ยนเวลา':
            message = 'เลือกเวลาเรียน'
            break;
        case message == '#video':
            message = 'ได้รับวิดีโอแล้ว'
            break;
        case message == '#audio':
            message = 'ได้รับไฟล์เสียงแล้ว'
            break;
        case message == 'ยกเลิก':
            message = 'ยกเลิกขั้นตอนการจองเรียบร้อยแล้วค่ะ (ไม่ใช่การยกเลิกการจองที่ทำรายการไปแล้ว)'
            break;
    }
    console.log(message);
    const messages = [{
        type: 'flex', altText: 'Bot message', contents: {
            "type": "bubble",
            "hero": {
                "type": "image",
                "url": "https://www.img.in.th/images/b817c5e0df884723c6ca7763cda35f46.png",
                "size": "full",
                "aspectRatio": "20:13",
                "aspectMode": "fit",
                "action": {
                    "type": "uri",
                    "uri": "https://www.img.in.th/images/b817c5e0df884723c6ca7763cda35f46.png",
                    "label": "img"
                }
            },
            "body": {
                "type": "box",
                "layout": "vertical",
                "contents": [
                    {
                        "type": "text",
                        "text": message,
                        "wrap": true,
                        "weight": "bold",
                        "size": "xl"
                    }
                ]
            }
        }
    }];
    return { messages };

};

function replyToUser(req, body) {
    console.log(body);
    return request.post({
        uri: `${LINE_MESSAGING_API}/reply`,
        headers: LINE_HEADER,
        body: JSON.stringify({
            replyToken: body.replyToken,
            messages: [
                {
                    type: "text",
                    text: JSON.stringify(body)
                }
            ]
        })
    });
};


function convertToDialogflow(req, body) {
    console.log("🚀 ~ body", body)
    const jsonBody = JSON.stringify(body);
    req.headers.host = "dialogflow.cloud.google.com";
    req.headers["x-line-signature"] = calculateLineSignature(jsonBody);
    req.headers["content-length"] = jsonBody.length;
    request.post({
        uri: `https://dialogflow.cloud.google.com/v1/integrations/line/webhook/${config.agentId}`,
        headers: req.headers,
        body: jsonBody
    });
    let message = body.events[0].message.text
    if (message.indexOf('DATE') == 0) message = ' เลือกเวลาเรียน'
    const messages = [{ type: 'text', text: message }];
    return { messages };

};

function calculateLineSignature(body) {
    const signature = crypto
        .createHmac('SHA256', config.channelSecret)
        .update(body).digest('base64');
    return signature;
}

function createLineTextEvent(originalRequest, originalEvent, text) {
    return {
        events:
            [{
                type: 'message',
                replyToken: originalEvent.replyToken,
                source: originalEvent.source,
                timestamp: originalEvent.timestamp,
                mode: originalEvent.mode,
                message: {
                    type: 'text',
                    text,
                },
            }],
        destination: originalRequest.body.destination,
    };
}

module.exports = {
    postToDialogflow,
    convertToDialogflow,
    createLineTextEvent,
    replyToUser
}