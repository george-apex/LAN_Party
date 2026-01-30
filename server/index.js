const express = require('express');
const http = require('http');
const https = require('https');
const WebSocket = require('ws');
const path = require('path');
const fs = require('fs');
const os = require('os');

const app = express();
const sslOptions = {
  key: fs.readFileSync(path.join(__dirname, '../ssl/key.pem')),
  cert: fs.readFileSync(path.join(__dirname, '../ssl/cert.pem'))
};
const server = https.createServer(sslOptions, app);
const wss = new WebSocket.Server({ server });

const config = JSON.parse(fs.readFileSync(path.join(__dirname, '../config.json'), 'utf8'));

const clients = new Map();
const rooms = new Map();
const chatHistory = new Map();
const audioRooms = new Map();
const videoSources = new Map();

config.rooms.forEach(room => {
  rooms.set(room.roomId, {
    ...room,
    users: new Set()
  });
  chatHistory.set(room.roomId, []);
});

function getRoomAtPosition(x, y) {
  return null;
}

function broadcastToRoom(roomId, message, excludeClient = null) {
  const room = rooms.get(roomId);
  if (!room) return;

  room.users.forEach(userId => {
    const client = clients.get(userId);
    if (client && client.ws !== excludeClient && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(message));
    }
  });
}

function broadcastToAll(message, excludeClient = null) {
  clients.forEach((client, userId) => {
    if (client.ws !== excludeClient && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(message));
    }
  });
}

function handleRoomChange(client, newRoomId) {
  const oldRoomId = client.currentRoom;



  if (oldRoomId === newRoomId) return;

  if (oldRoomId) {
    const oldRoom = rooms.get(oldRoomId);
    if (oldRoom) {
      oldRoom.users.delete(client.id);
      
      broadcastToRoom(oldRoomId, {
        type: 'userLeft',
        userId: client.id,
        username: client.username,
        roomId: oldRoomId
      });

      broadcastToRoom(oldRoomId, {
        type: 'chatMessage',
        roomId: oldRoomId,
        username: 'System',
        message: `${client.username} left the room`,
        timestamp: Date.now(),
        isSystem: true
      });

      broadcastToRoom(oldRoomId, {
        type: 'audioRoomLeave',
        userId: client.id
      });

      const audioRoom = audioRooms.get(oldRoomId);
      if (audioRoom) {
        audioRoom.delete(client.id);
        if (audioRoom.size === 0) {
          audioRooms.delete(oldRoomId);
        }
      }
    }
  }

  client.currentRoom = newRoomId;

  if (newRoomId) {
    const newRoom = rooms.get(newRoomId);
    if (newRoom) {
      newRoom.users.add(client.id);

      broadcastToRoom(newRoomId, {
        type: 'userJoined',
        userId: client.id,
        username: client.username,
        roomId: newRoomId,
        color: client.color
      });

      broadcastToRoom(newRoomId, {
        type: 'chatMessage',
        roomId: newRoomId,
        username: 'System',
        message: `${client.username} joined the room`,
        timestamp: Date.now(),
        isSystem: true
      });

      const roomUsers = Array.from(newRoom.users).map(userId => {
        const c = clients.get(userId);
        return c ? { id: c.id, username: c.username, color: c.color } : null;
      }).filter(Boolean);

      client.ws.send(JSON.stringify({
        type: 'roomChanged',
        roomId: newRoomId,
        roomName: newRoom.name,
        users: roomUsers,
        chatHistory: chatHistory.get(newRoomId) || []
      }));

      if (!audioRooms.has(newRoomId)) {
        audioRooms.set(newRoomId, new Map());
      }
      audioRooms.get(newRoomId).set(client.id, client);

      const roomUsersForAudio = Array.from(newRoom.users).map(userId => {
        const c = clients.get(userId);
        return c ? { id: c.id, username: c.username, color: c.color } : null;
      }).filter(Boolean);

      broadcastToRoom(newRoomId, {
        type: 'audioRoomJoin',
        userId: client.id,
        username: client.username,
        users: roomUsersForAudio
      });
    }
  }
}

wss.on('connection', (ws) => {
  const clientId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  clients.set(clientId, {
    id: clientId,
    ws,
    username: null,
    color: null,
    currentRoom: null,
    position: { x: 0, y: 0 },
    lastHeartbeat: Date.now()
  });

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);
      const client = clients.get(clientId);

      if (!client) return;

      switch (message.type) {
        case 'join':
          client.username = message.username;
          client.color = message.color;

          const hubRoom = rooms.get('hub');
          client.position = hubRoom ? { ...hubRoom.spawnPoint } : { x: 400, y: 300 };

          ws.send(JSON.stringify({
            type: 'joined',
            userId: clientId,
            position: client.position,
            rooms: Array.from(rooms.values()).map(r => ({
              roomId: r.roomId,
              name: r.name,
              spawnPoint: r.spawnPoint,
              doorways: r.doorways,
              color: r.color
            })),
            map: config.map
          }));

          broadcastToAll({
            type: 'playerConnected',
            userId: clientId,
            username: client.username || 'Player',
            color: client.color || '#4ECDC4',
            position: client.position
          }, ws);

          break;

        case 'positionUpdate':
          client.position = { x: message.x, y: message.y };

          const newRoomId = message.room || 'hub';
          handleRoomChange(client, newRoomId);

          broadcastToAll({
            type: 'playerMoved',
            userId: clientId,
            x: message.x,
            y: message.y,
            room: newRoomId,
            timestamp: message.timestamp,
            username: client.username,
            color: client.color,
            sitting: message.sitting || false
          }, ws);

          break;

        case 'videoState':
          if (client.currentRoom) {
            if (message.playing) {
              videoSources.set(client.currentRoom, clientId);
            } else {
              if (videoSources.get(client.currentRoom) === clientId) {
                videoSources.delete(client.currentRoom);
              }
            }
            broadcastToRoom(client.currentRoom, {
              type: 'videoState',
              playing: message.playing,
              currentTime: message.currentTime,
              sourceId: clientId
            });
          }
          break;

        case 'videoFrame':
          if (client.currentRoom) {
            const room = rooms.get(client.currentRoom);
            if (room) {
              broadcastToRoom(client.currentRoom, {
                type: 'videoFrame',
                data: message.data
              }, ws);
            }
          }
          break;

        case 'videoReset':
          if (client.currentRoom) {
            broadcastToRoom(client.currentRoom, {
              type: 'videoReset'
            }, ws);
          }
          break;

        case 'seatState':
          if (client.currentRoom) {
            broadcastToRoom(client.currentRoom, {
              type: 'seatState',
              userId: clientId,
              seatIndex: message.seatIndex
            }, ws);
          }
          break;

        case 'chatMessage':
          if (!client.currentRoom || !client.username) return;
          
          const chatMsg = {
            type: 'chatMessage',
            roomId: client.currentRoom,
            username: client.username,
            message: message.message.substring(0, 500),
            timestamp: Date.now()
          };

          const history = chatHistory.get(client.currentRoom);
          if (history) {
            history.push(chatMsg);
            if (history.length > 100) history.shift();
          }

          broadcastToRoom(client.currentRoom, chatMsg);
          break;

        case 'audioSignal':
          if (!client.currentRoom) return;
          
          broadcastToRoom(client.currentRoom, {
            type: 'audioSignal',
            from: clientId,
            to: message.to,
            signal: message.signal
          }, ws);
          break;

        case 'speaking':
          if (!client.currentRoom) return;
          
          broadcastToRoom(client.currentRoom, {
            type: 'userSpeaking',
            userId: clientId,
            isSpeaking: message.isSpeaking
          });
          break;

        case 'heartbeat':
          client.lastHeartbeat = Date.now();
          break;

        case 'ping':
          client.lastHeartbeat = Date.now();
          ws.send(JSON.stringify({ type: 'pong' }));
          break;

        case 'audioData':
          if (!client.currentRoom) return;
          
          const audioRoom = audioRooms.get(client.currentRoom);
          if (audioRoom) {
            audioRoom.forEach((roomClient, roomClientId) => {
              if (roomClientId !== clientId && roomClient.ws.readyState === WebSocket.OPEN) {
                roomClient.ws.send(JSON.stringify({
                  type: 'audioData',
                  from: clientId,
                  data: message.data
                }));
              }
            });
          } else {
            console.log('No audio room found for:', client.currentRoom);
          }
          break;

        case 'peanutSound':
          if (!client.currentRoom) return;
          
          broadcastToRoom(client.currentRoom, {
            type: 'peanutSound',
            from: clientId
          }, ws);
          break;

        case 'peanutAnimation':
          if (!client.currentRoom) return;
          
          broadcastToRoom(client.currentRoom, {
            type: 'peanutAnimation',
            from: clientId,
            animationType: message.animationType
          }, ws);
          break;
      }
    } catch (error) {
      console.error('Error handling message:', error);
    }
  });

  ws.on('close', () => {
    const client = clients.get(clientId);
    if (client) {
      if (client.currentRoom) {
        const room = rooms.get(client.currentRoom);
        if (room) {
          room.users.delete(clientId);

          if (videoSources.get(client.currentRoom) === clientId) {
            videoSources.delete(client.currentRoom);
            broadcastToRoom(client.currentRoom, {
              type: 'videoState',
              playing: false,
              currentTime: 0,
              sourceId: null
            });
          }

          broadcastToRoom(client.currentRoom, {
            type: 'userLeft',
            userId: clientId,
            username: client.username,
            roomId: client.currentRoom
          });

          broadcastToRoom(client.currentRoom, {
            type: 'seatState',
            userId: clientId,
            seatIndex: null
          });

      broadcastToRoom(client.currentRoom, {
        type: 'audioRoomLeave',
        userId: clientId
      });

      const audioRoom = audioRooms.get(client.currentRoom);
      if (audioRoom) {
        audioRoom.delete(clientId);
        if (audioRoom.size === 0) {
          audioRooms.delete(client.currentRoom);
        }
      }
        }
      }

      broadcastToAll({
        type: 'playerDisconnected',
        userId: clientId
      });

      clients.delete(clientId);
    }
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

setInterval(() => {
  const now = Date.now();
  clients.forEach((client, clientId) => {
    const timeSinceHeartbeat = now - client.lastHeartbeat;
    if (timeSinceHeartbeat > 30000) {
      client.ws.terminate();
      clients.delete(clientId);
    }
  });
}, 10000);

app.use(express.static(path.join(__dirname, '../public')));

const PORT = config.port;
server.listen(PORT, '0.0.0.0', () => {
  const networkInterfaces = os.networkInterfaces();
  const addresses = [];
  
  Object.values(networkInterfaces).forEach(iface => {
    iface.forEach(addr => {
      if (addr.family === 'IPv4' && !addr.internal) {
        addresses.push(addr.address);
      }
    });
  });

  console.log('=================================');
  console.log('LANParty Server Started!');
  console.log('=================================');
  console.log(`Local: http://localhost:${PORT}`);
  addresses.forEach(addr => {
    console.log(`LAN:   http://${addr}:${PORT}`);
  });
  console.log('=================================');
});
