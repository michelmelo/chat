/**
 * Hides the given element by setting `display: none`.
 * @param {HTMLElement} element The element to hide
 */
function hideElement(element) {
    element.style.display = "none";
}
/**
 * Shows the given element by resetting the display CSS property.
 * @param {HTMLElement} element The element to show
 */
function showElement(element) {
    element.style.display = "";
}

let webrtc;


let TokenApi;

const callButton = document.getElementById("call-button");
const ringButton = document.getElementById("ring-button");
const videoContainer = document.getElementById("video-container");
const hangupButton = document.querySelector('button#hangupButton');
hangupButton.onclick = hangup;

const queryString = window.location.search.substring(1);
const urlParams = new URLSearchParams(queryString);

const token_id = urlParams.get('token_id');
const call_type = urlParams.get('call_type');

/** @type {string} */
let get_chat_id = urlParams.get('chat_id');
let ChatId = get_chat_id;


const constraints = window.constraints = {
    audio: {
        autoGainControl: false,
        channelCount: 2,
        echoCancellation: false,
        noiseSuppression: false,
    },
    video: {
        width: {
            min: 720,
            max: 1280
        },
        height: {
            min: 720,
            max: 720
        },
        frameRate: {
            min: 7,
            max: 27
        }
    }
};
let localStream;

const socketUrl = `wss://api.whizapp.co/chatserver`;
// const socketUrl = `wss://api.whizapp.co/serverchat`;

let offerOptions = {
    offerToRecieveAudio: 1,
    offerToRecieveVideo: 1
};

const socket = new WebSocket(socketUrl);
const remoteVideo = document.getElementById("remote-video");
const localVideo = document.getElementById("local-video");
remoteVideo.muted = false;
localVideo.muted = true;

// log in directly after the socket was opened
socket.addEventListener("open", () => {
    console.log("websocket connected");
    if (call_type == 1) {
        showVideoCall();
    } else {
        hideVideoCall();
    }
    TokenApi = token_id;
    if (!TokenApi) {
        hideVideoCall();
        alert("Token Invalid");

    }
    sendMessageToSignallingServer({
        "type": "auth",
        "content": {
            "token": TokenApi
        }
    });

});
socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data.toString());
    console.log("message");
    console.log(message);
    handleMessage(message);
});
// urls: 'stun:stun.l.google.com:19302',
webrtc = new RTCPeerConnection({
    "iceServers": [{

        urls: "stun:stun.l.google.com:19302",
        urls: "stun:stun1.l.google.com:19302",
        urls: "stun:stun2.l.google.com:19302",
        urls: "stun:stun3.l.google.com:19302",
        urls: "stun:stun4.l.google.com:19302",

    }, ]
});
let sendWidth = 320;
let maxBitrate = 60000;
webrtc.addEventListener("track", (event) => {
    /** @type {HTMLVideoElement} */
    //const remoteVideo = document.getElementById("remote-video");
    remoteVideo.srcObject = event.streams[0];
});
navigator.mediaDevices.getUserMedia(constraints).then((localStream) => {
    /** @type {HTMLVideoElement} */
    const videoTracks = localStream.getVideoTracks();
    console.log("videoTracks");
    console.log('Got stream with constraints:', constraints);
    console.log(videoTracks);
    console.log(`Using video device: ${videoTracks[0].label}`);
    const localVideo = document.getElementById("local-video");
    console.log(localVideo);
    localVideo.srcObject = localStream;
    console.log(localVideo);
    for (const track of localStream.getTracks()) {
        webrtc.addTrack(track, localStream);
    }
    let sourceWidth = videoTracks[0].getSettings();
    console.log(sourceWidth);
    // return webrtc.setParameters({encodings: [{maxBitrate, scaleResolutionDownBy: sourceWidth / sendWidth}]})
});
webrtc.addEventListener("icecandidate", (event) => {
    console.log('icecandidate');
    if (!event.candidate) {
        return;
    }
    console.log('icecandidate send ');
    sendMessageToSignallingServer({
        "type": "chat.call.signalling",
        "content": {
            "chatid": ChatId,
            "msg": event.candidate
        },
    });
});



/**
 * Sends the message over the socket.
 * @param {WebSocketMessage} message The message to send
 */
function sendMessageToSignallingServer(message) {
    const json = JSON.stringify(message);
    socket.send(json);
}

function hangup() {
    console.log('Ending call');
    location.reload(true);
}
/**
 * Hides both local and remote video, but shows the "call" button.
 */
function hideVideoCall() {


    hideElement(videoContainer);
    hideElement(callButton);
    hideElement(hangupButton);
    showElement(ringButton);
    if (call_type != 1) {
        hideElement(videoContainer);
        hideElement(callButton);
        hideElement(hangupButton);
        // showElement(ringButton);
        hideElement(refusedButton);
    }
}
/**
 * Shows both local and remote video, and hides the "call" button.
 */
function showVideoCall() {
    console.log("showVideoCall");
    hideElement(callButton);
    showElement(videoContainer);
    showElement(hangupButton);
    hideElement(ringButton);
}



/**
 * Processes the incoming message.
 * @param {WebSocketMessage} message The incoming message
 */
async function handleMessage(message) {
    console.log("handleMessage");
    console.log(message.type);
    switch (message.type) {
        case "user.status":
            console.log("Status: " + message.content.status);
            console.log("UserId: " + message.content.userid);
            break;
        case "auth":
            console.log("switch: auth");
            console.log("switch: auth" + message);
            if (message.status != 200) {
                alert(message.error);
                return false;
                break;
            }
            if (call_type == 1) {
                console.log("chat.call.calling");
                sendMessageToSignallingServer({
                    "type": "chat.call.calling",
                    "content": {
                        "chatid": ChatId,
                        "msg": "chat.call.calling"
                    },
                });
            }
            break;
        case "chat.call.answered":
            console.log("chat.call.answered");
            showVideoCall();
            // const offer = await webrtc.createOffer(offerOptions);
            // await webrtc.setLocalDescription(offer);
            // sendMessageToSignallingServer({
            //     type: "chat.call.signalling",
            //     "content": {
            //         "chatid": ChatId,
            //         "msg": {
            //             "type_new": "",
            //             "offer": offer
            //         }
            //     },
            // });
            break;
        case "chat.call.refused":
            console.log("chat.call.refused");
            showElement(ringButton);
            hangup();
            break;

        case "chat.call.calling":
            console.log("chat.call.calling");
            showElement(callButton);
            showElement(refusedButton);
            hideElement(ringButton);
            break;
        case "chat.call.signalling":
            console.log("switch: chat.call.signalling");
            console.log(message);
            console.log("message.content.msg.offer.type");
            if (message.content.msg.offer) {
                console.log("message.content.msg.offer");
                console.log(message.content.msg.offer.type);
                console.log(message.content.msg.offer);
            }
            if (message.content.msg.offer && message.content.msg.type_new == "answer") {
                console.log("switch: webrtc_answer");
                console.log("received webrtc answer");
                console.log(message.content.msg.offer);
                await webrtc.setRemoteDescription(message.content.msg.offer);
            }
            if (message.content.msg.offer && message.content.msg.offer.type == "offer") {
                console.log("switch: offer");
                console.log("received webrtc offer");
                console.log(message.content.msg.offer);
                await webrtc.setRemoteDescription(message.content.msg.offer);
                const answer = await webrtc.createAnswer();
                await webrtc.setLocalDescription(answer);
                sendMessageToSignallingServer({
                    type: "chat.call.signalling",
                    "content": {
                        "chatid": ChatId,
                        "msg": {
                            "type_new": "answer",
                            "offer": answer
                        }
                    },
                });
            }
            if (message.content.msg.candidate) {
                console.log("switch: webrtc_ice_candidate");
                console.log("received ice candidate");
                console.log(message.content.msg);
                await webrtc.addIceCandidate(message.content.msg).catch(error => {
                    console.log("error addIceCandidate");
                    console.log(error)
                });
            }
            break;
        default:
            console.log("unknown message", message);
            break;
    }
}

ringButton.addEventListener("click", async () => {

    console.log("click ringButton");
    sendMessageToSignallingServer({
        "type": "chat.call.calling",
        "content": {
            "chatid": ChatId,
            "msg": "chat.call.calling"
        },
    });


});

refusedButton.addEventListener("click", async () => {

    console.log("click refusedButton");
    hideElement(refusedButton);
    hideElement(callButton);
    showElement(ringButton);
    sendMessageToSignallingServer({
        "type": "chat.call.refused",
        "content": {
            "chatid": ChatId,
            "msg": "chat.call.refused"
        },
    });

});


callButton.addEventListener("click", async () => {

    // ChatId = prompt("Enter your chat id", "");
    // ChatId = prompt("Who you gonna call?", "chat.8ea390ee-14b2-47b4-a4ca-f2c129fb4485");
    showVideoCall();
    console.log("webrtc");
    console.log(webrtc);

    sendMessageToSignallingServer({
        "type": "chat.call.answered",
        "content": {
            "chatid": ChatId,
            "msg": {
                "offer": ''
            }
        },
    });
    const offer = await webrtc.createOffer(offerOptions);
    await webrtc.setLocalDescription(offer);
    sendMessageToSignallingServer({
        type: "chat.call.signalling",
        "content": {
            "chatid": ChatId,
            "msg": {
                "type_new": "",
                "offer": offer
            }
        },
    });
});