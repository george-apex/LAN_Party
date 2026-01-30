# LANParty — LAN-Hosted Browser Chatroom with Room-Based Channels

A self-hosted web app providing a retro pixel-art "lobby map" where users control pixel characters with WASD. Walking into rooms automatically joins text and audio channels.

## Features

- **LAN Hosting**: Runs on local network without internet dependency
- **Browser-Based**: Works in modern browsers without installation
- **Pixel Character Movement**: WASD controls with smooth movement and collision detection
- **Room-Based Channels**: Auto-join text and audio when entering rooms
- **Text Chat**: Room-scoped messages with timestamps
- **Audio Chat**: WebRTC mesh network with push-to-talk (V key)
- **Real-time Presence**: See other users moving in real-time

## Installation

```bash
npm install
```

## Usage

Start the server:

```bash
npm start
```

The server will display available LAN URLs. Share one with other users on your network.

## Controls

- **WASD**: Move your character
- **V**: Push-to-talk (hold to speak)
- **Chat**: Type messages in the chat panel

## Configuration

Edit `config.json` to customize:

- Port number
- Room definitions (name, bounds, capacity)
- Map dimensions
- Admin password

## Audio Controls

- **Mute**: Disable your microphone
- **Deafen**: Mute all incoming audio
- **Push-to-Talk**: Hold V to speak

## Technical Details

- **Server**: Node.js with Express and WebSocket
- **Client**: Vanilla JavaScript with Canvas API
- **Audio**: WebRTC peer-to-peer mesh network
- **Real-time**: WebSocket for position updates and chat
