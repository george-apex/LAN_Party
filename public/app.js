const canvas = document.getElementById('gameCanvas');
const game = new Game(canvas);

let ws;
let audioManager;
let userId;
let currentRoomId = null;
let selectedColor = '#4ECDC4';
let pingStartTime = 0;

const joinModal = document.getElementById('joinModal');
const usernameInput = document.getElementById('usernameInput');
const joinButton = document.getElementById('joinButton');
const colorOptions = document.querySelectorAll('.color-option');
const connectionStatus = document.getElementById('connectionStatus');
const currentRoomDisplay = document.getElementById('currentRoom');
const pingDisplay = document.getElementById('pingDisplay');
const userList = document.getElementById('userList');
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const sendButton = document.getElementById('sendButton');
const muteButton = document.getElementById('muteButton');
const deafenButton = document.getElementById('deafenButton');
const enableAudioButton = document.getElementById('enableAudioButton');

colorOptions.forEach(option => {
  option.addEventListener('click', () => {
    colorOptions.forEach(o => o.classList.remove('selected'));
    option.classList.add('selected');
    selectedColor = option.dataset.color;
  });
});

colorOptions[1].classList.add('selected');

function renderCharacterPreviews() {
  colorOptions.forEach(option => {
    const color = option.dataset.color;
    const ctx = option.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, 64, 64);

    const sprite = game.createCharacterSprite(color, 'down', 0);
    ctx.drawImage(sprite, 8, 8, 48, 48);
  });
}

renderCharacterPreviews();

joinButton.addEventListener('click', joinGame);
usernameInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') joinGame();
});

function joinGame() {
  const username = usernameInput.value.trim();
  if (!username) {
    alert('Please enter a username');
    return;
  }

  joinModal.classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');

  connect(username);
}

async function connect(username) {
  const protocol = 'wss:';
  ws = new WebSocket(`${protocol}//${window.location.host}`);
  window.ws = ws;

  ws.onopen = async () => {
    connectionStatus.textContent = 'Connected';
    connectionStatus.className = 'connected';

    ws.send(JSON.stringify({
      type: 'join',
      username: username,
      color: selectedColor
    }));

    audioManager = new AudioManager(ws);
    await audioManager.initialize();

    if (!audioManager.audioAvailable) {
      addSystemMessage('Audio features disabled - click "Enable Audio" to request microphone access');
      enableAudioButton.classList.remove('hidden');
    }

    startPing();
  };

  ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    handleMessage(message);
  };

  ws.onclose = () => {
    connectionStatus.textContent = 'Disconnected';
    connectionStatus.className = 'disconnected';
    
    if (audioManager) {
      audioManager.closeAll();
    }
  };

  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
  };
}

function handleMessage(message) {
  switch (message.type) {
    case 'joined':
      userId = message.userId;
      game.setMap(message.map);
      game.setRooms(message.rooms);
      game.setLocalPlayer({
        id: userId,
        x: message.position.x,
        y: message.position.y,
        color: selectedColor,
        username: usernameInput.value,
        room: 'hub'
      });
      gameLoop();
      break;

    case 'playerConnected':
      game.updatePlayer(message.userId, {
        x: message.position.x,
        y: message.position.y,
        color: message.color,
        username: message.username,
        room: 'hub'
      });
      addSystemMessage(`${message.username} joined the server`);
      break;

    case 'playerMoved':
      game.updatePlayer(message.userId, {
        x: message.x,
        y: message.y,
        room: message.room,
        username: message.username,
        color: message.color,
        sitting: message.sitting || false
      });
      break;

    case 'playerDisconnected':
      game.removePlayer(message.userId);
      removeUserFromList(message.userId);
      addSystemMessage('A user left the server');
      break;

    case 'roomChanged':
      currentRoomId = message.roomId;
      currentRoomDisplay.textContent = message.roomName;
      game.setCurrentRoom(message.roomId);
      game.initializePlayers(message.users);
      updateUserList(message.users);
      loadChatHistory(message.chatHistory);
      break;

    case 'userJoined':
      addUserToList(message);
      break;

    case 'userLeft':
      removeUserFromList(message.userId);
      break;

    case 'chatMessage':
      addChatMessage(message);
      break;

    case 'audioData':
      if (audioManager) {
        audioManager.handleAudioData(message.from, message.data);
      }
      break;

    case 'audioRoomJoin':
      break;

    case 'audioRoomLeave':
      if (audioManager) {
        audioManager.closeRemoteAudio(message.userId);
      }
      break;

    case 'userSpeaking':
      updateSpeakingIndicator(message.userId, message.isSpeaking);
      break;

    case 'pong':
      const ping = Date.now() - pingStartTime;
      pingDisplay.textContent = `Ping: ${ping}ms`;
      break;

    case 'peanutSound':
      console.log('Received peanutSound message from:', message.from);
      game.playPeanutSoundForPlayer(message.from);
      break;

    case 'peanutAnimation':
      console.log('Received peanutAnimation message from:', message.userId, 'animation:', message.animation);
      game.handlePeanutAnimation(message.userId, message.animation);
      break;

    case 'videoState':
      game.updateVideoState(message.playing, message.currentTime, message.sourceId);
      break;

    case 'videoFrame':
      console.log('[VIDEO] app.js: Received videoFrame message, data length:', message.data ? message.data.length : 0);
      game.receiveVideoFrame(message.data);
      break;

    case 'videoReset':
      game.handleVideoReset();
      break;

    case 'seatState':
      game.handleRemoteSeatState(message.userId, message.seatIndex);
      break;

    case 'userLeft':
      game.handleRemoteSeatState(message.userId, null);
      break;
  }
}

function gameLoop() {
  const positionUpdate = game.update();
  
  if (positionUpdate && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'positionUpdate',
      ...positionUpdate
    }));
  }

  game.interpolate();
  game.render();

  requestAnimationFrame(gameLoop);
}

function startPing() {
  setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      pingStartTime = Date.now();
      ws.send(JSON.stringify({ type: 'ping' }));
      ws.send(JSON.stringify({ type: 'heartbeat' }));
    }
  }, 5000);
}

function addUserToList(user) {
  const existingItem = document.querySelector(`[data-user-id="${user.id}"]`);
  if (existingItem) return;

  const li = document.createElement('li');
  li.dataset.userId = user.id;
  li.innerHTML = `
    <div class="user-color" style="background: ${user.color}"></div>
    <span>${user.username}</span>
    <div class="speaking-indicator"></div>
  `;
  userList.appendChild(li);
}

function removeUserFromList(userId) {
  const item = document.querySelector(`[data-user-id="${userId}"]`);
  if (item) {
    item.remove();
  }
}

function updateUserList(users) {
  userList.innerHTML = '';
  users.forEach(user => {
    addUserToList(user);
  });
}

function updateSpeakingIndicator(userId, isSpeaking) {
  const item = document.querySelector(`[data-user-id="${userId}"]`);
  if (item) {
    const indicator = item.querySelector('.speaking-indicator');
    if (indicator) {
      indicator.classList.toggle('active', isSpeaking);
    }
  }
}

function addChatMessage(message) {
  const div = document.createElement('div');
  div.className = 'chat-message' + (message.isSystem ? ' system' : '');
  
  const time = new Date(message.timestamp).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  if (message.isSystem) {
    div.textContent = message.message;
  } else {
    div.innerHTML = `
      <span class="username">${message.username}</span>
      <span>${escapeHtml(message.message)}</span>
      <span class="timestamp">${time}</span>
    `;
  }

  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function addSystemMessage(text) {
  addChatMessage({
    username: 'System',
    message: text,
    timestamp: Date.now(),
    isSystem: true
  });
}

function loadChatHistory(history) {
  chatMessages.innerHTML = '';
  history.forEach(msg => {
    addChatMessage(msg);
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

sendButton.addEventListener('click', sendMessage);
chatInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') sendMessage();
});

function sendMessage() {
  const message = chatInput.value.trim();
  if (!message || !ws || ws.readyState !== WebSocket.OPEN) return;

  ws.send(JSON.stringify({
    type: 'chatMessage',
    message: message
  }));

  chatInput.value = '';
}

muteButton.addEventListener('click', () => {
  if (audioManager && audioManager.audioAvailable) {
    const isMuted = audioManager.toggleMute();
    muteButton.textContent = isMuted ? '🎤 Unmute' : '🎤 Mute';
    muteButton.classList.toggle('active', isMuted);
  }
});

deafenButton.addEventListener('click', () => {
  if (audioManager && audioManager.audioAvailable) {
    const isDeafened = audioManager.toggleDeafen();
    deafenButton.textContent = isDeafened ? '🔊 Undeafen' : '🔊 Deafen';
    deafenButton.classList.toggle('active', isDeafened);
  }
});

const pixelEditorButton = document.getElementById('pixelEditorButton');
pixelEditorButton.addEventListener('click', () => {
  window.open('pixel_editor.html', '_blank', 'width=800,height=600');
});

enableAudioButton.addEventListener('click', async () => {
  if (audioManager) {
    await audioManager.initialize();
    if (audioManager.audioAvailable) {
      enableAudioButton.classList.add('hidden');
      addSystemMessage('Audio features enabled!');
    } else {
      addSystemMessage('Microphone access still unavailable. Please check browser permissions.');
    }
  }
});

document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const filter = btn.dataset.filter;
    if (audioManager) {
      audioManager.setFilter(filter);
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      addSystemMessage(`Voice filter: ${filter}`);
    }
  });
});

document.addEventListener('keydown', (e) => {
  if (e.key >= '1' && e.key <= '7') {
    const filters = ['none', 'reverb', 'super-reverb', 'echo', 'overdrive', 'alien', 'low'];
    const filterIndex = parseInt(e.key) - 1;
    const filter = filters[filterIndex];
    if (audioManager) {
      audioManager.setFilter(filter);
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      document.querySelector(`[data-filter="${filter}"]`).classList.add('active');
      addSystemMessage(`Voice filter: ${filter}`);
    }
  }

  if (e.key === 'u' && document.activeElement !== chatInput) {
    game.triggerPeanutNod();
  }

  if (e.key === 'o' && document.activeElement !== chatInput) {
    game.triggerPeanutShock();
  }

  if (e.key === 'e' && document.activeElement !== chatInput) {
    console.log('e key pressed, local player color:', game.localPlayer ? game.localPlayer.color : 'N/A');
    if (game.triggerPeanutSound()) {
      console.log('Sound triggered, sending peanutSound message');
      ws.send(JSON.stringify({
        type: 'peanutSound'
      }));
    } else {
      console.log('Sound not triggered - either not peanut or already playing');
    }
  }
});
