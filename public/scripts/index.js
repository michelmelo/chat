let isAlreadyCalling = false;
let getCalled = false;

const existingCalls = [];

const {
  RTCPeerConnection,
  RTCSessionDescription
} = window;

const peerConnection = new RTCPeerConnection();

function unselectUsersFromList() {
  const alreadySelectedUser = document.querySelectorAll(
    ".active-user.active-user--selected"
  );

  alreadySelectedUser.forEach(el => {
    el.setAttribute("class", "active-user");
  });
}

function createUserItemContainer(socketId) {
  const userContainerEl = document.createElement("div");

  const usernameEl = document.createElement("p");

  userContainerEl.setAttribute("class", "active-user");
  userContainerEl.setAttribute("id", socketId);
  usernameEl.setAttribute("class", "username");
  usernameEl.innerHTML = `Socket: ${socketId}`;

  userContainerEl.appendChild(usernameEl);

  userContainerEl.addEventListener("click", () => {
    unselectUsersFromList();
    userContainerEl.setAttribute("class", "active-user active-user--selected");
    const talkingWithInfo = document.getElementById("talking-with-info");
    talkingWithInfo.innerHTML = `Talking with: "Socket: ${socketId}"`;
    callUser(socketId);
  });

  return userContainerEl;
}

async function callUser(socketId) {
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(new RTCSessionDescription(offer));

  socket.emit("call-user", {
    offer,
    to: socketId
  });
}

function updateUserList(socketIds) {
  const activeUserContainer = document.getElementById("active-user-container");

  socketIds.forEach(socketId => {
    const alreadyExistingUser = document.getElementById(socketId);
    if (!alreadyExistingUser) {
      const userContainerEl = createUserItemContainer(socketId);

      activeUserContainer.appendChild(userContainerEl);
    }
  });
}

const socket = new WebSocket('wss://api.whizapp.co/chatserver');


socket.onopen = function(e) {
  console.log("[open] Connection established");
  console.log("Sending to server");
  socket.send(JSON.stringify({
    "type": "auth",
    "content": {
      "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJBUEkiLCJpYXQiOjE1ODc1NTk5NzAsImV4cCI6MTU4NzczMjc3MCwidHlwZSI6ImFjY2VzcyIsInN1YiI6InVzZXIuOTNhYjRhMzItMWMwOC00Yjc2LWE5YWEtZmNjN2NlYzc1Y2NlIiwiZGV2aWNlaWQiOiJ1c2VyZGV2aWNlLmRhMWEzMGRjLWYwNDAtNDUxOS1hYmY2LTA4YThhNTBkOGJkNiJ9.hwrJ8nG6gxoYJbC4hP-6gvhxtNzj3q6ZCMYif9g101Y"
    }
  }));
  console.log("[message] Data received from server:" + JSON.stringify(e));
};

socket.onmessage = function(event) {
  socket.send(JSON.stringify({
    "type": "chat.message.typing",
    "content": {
      "chatid": "chat.4e9db159-796c-445d-9733-4bd68fa49b62"
    }
  }));
  console.log("[message] Data received from server: " + event.data);
  console.log("[message] Data received from server:" + JSON.stringify(event));
};

socket.onclose = function(event) {
  if (event.wasClean) {
    console.log(`[close] Connection closed cleanly, code=${event.code} reason=${event.reason}`);
  } else {
    console.log('[close] Connection died');
  }
};

socket.onerror = function(error) {
  console.log(`[error] ${error.message}`);
};


// socket.on("update-user-list", ({
//   users
// }) => {
//   updateUserList(users);
// });

// socket.on("remove-user", ({
//   socketId
// }) => {
//   const elToRemove = document.getElementById(socketId);

//   if (elToRemove) {
//     elToRemove.remove();
//   }
// });

// socket.on("call-made", async data => {
//   if (getCalled) {
//     const confirmed = confirm(
//       `User "Socket: ${data.socket}" wants to call you. Do accept this call?`
//     );

//     if (!confirmed) {
//       socket.emit("reject-call", {
//         from: data.socket
//       });

//       return;
//     }
//   }

//   await peerConnection.setRemoteDescription(
//     new RTCSessionDescription(data.offer)
//   );
//   const answer = await peerConnection.createAnswer();
//   await peerConnection.setLocalDescription(new RTCSessionDescription(answer));

//   socket.emit("make-answer", {
//     answer,
//     to: data.socket
//   });
//   getCalled = true;
// });

// socket.on("answer-made", async data => {
//   await peerConnection.setRemoteDescription(
//     new RTCSessionDescription(data.answer)
//   );

//   if (!isAlreadyCalling) {
//     callUser(data.socket);
//     isAlreadyCalling = true;
//   }
// });

// socket.on("call-rejected", data => {
//   alert(`User: "Socket: ${data.socket}" rejected your call.`);
//   unselectUsersFromList();
// });

peerConnection.ontrack = function({
  streams: [stream]
}) {
  const remoteVideo = document.getElementById("remote-video");
  if (remoteVideo) {
    remoteVideo.srcObject = stream;
  }
};

navigator.getUserMedia({
    video: true,
    audio: true
  },
  stream => {
    const localVideo = document.getElementById("local-video");
    if (localVideo) {
      localVideo.srcObject = stream;
    }

    stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));
  },
  error => {
    console.warn(error.message);
  }
);