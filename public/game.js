class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.players = new Map();
    this.localPlayer = null;
    this.rooms = [];
    this.map = null;
    this.keys = {};
    this.lastPositionUpdate = 0;
    this.positionUpdateInterval = 50;
    this.currentRoom = null;
    this.transitioning = false;
    this.animationFrame = 0;
    this.animationSpeed = 8;

    this.peanutNodding = false;
    this.peanutNodFrame = 0;
    this.peanutNodMaxFrames = 50;
    this.peanutShockMouth = false;
    this.peanutShockEndTime = 0;
    this.peanutSoundPlaying = false;
    this.peanutSound = new Audio('/sounds/excellent-raid.mp3');
    this.peanutMouthOpen = false;
    this.peanutMouthToggleTime = 0;
    this.peanutMouthOpenEndTime = 0;

    this.textures = {};
    this.createTextures();

    this.videoElement = document.createElement('video');
    this.videoElement.src = '/videos/video.mp4';
    this.videoElement.loop = true;
    this.videoElement.muted = true;
    this.videoElement.style.display = 'none';
    this.videoElement.crossOrigin = 'anonymous';
    this.videoElement.preload = 'auto';
    document.body.appendChild(this.videoElement);

    this.videoAudio = new Audio('/videos/video.mp4');
    this.videoAudio.loop = true;
    this.videoAudio.preload = 'auto';

    this.videoCanvas = document.createElement('canvas');
    this.videoCanvas.width = 760;
    this.videoCanvas.height = 428;
    this.videoCanvas.style.display = 'none';
    this.videoCtx = this.videoCanvas.getContext('2d');
    document.body.appendChild(this.videoCanvas);

    this.videoStreamingInterval = null;
    this.isVideoSource = false;
    this.hasReceivedVideoFrame = false;

    this.videoScreen = {
      x: 400,
      y: 100,
      width: 760,
      height: 428,
      playing: false,
      currentTime: 0
    };
    this.videoButton = {
      x: 350,
      y: 550,
      width: 60,
      height: 30
    };
    this.videoResetButton = {
      x: 450,
      y: 550,
      width: 60,
      height: 30
    };

    this.cinemaSeats = [
      { x: 60, y: 520, occupied: false, userId: null },
      { x: 130, y: 520, occupied: false, userId: null },
      { x: 200, y: 520, occupied: false, userId: null },
      { x: 270, y: 520, occupied: false, userId: null },
      { x: 530, y: 520, occupied: false, userId: null },
      { x: 600, y: 520, occupied: false, userId: null },
      { x: 670, y: 520, occupied: false, userId: null },
      { x: 740, y: 520, occupied: false, userId: null }
    ];

    this.sittingOnSeat = null;

    this.setupCanvas();
    this.setupControls();
  }

  createTextures() {
    this.textures.woodFloor = this.createWoodTexture();
    this.textures.tileFloor = this.createTileTexture();
    this.textures.carpet = this.createCarpetTexture();
    this.textures.brickWall = this.createBrickTexture();
    this.textures.woodWall = this.createWoodWallTexture();
    this.textures.floorboard = this.createFloorboardTexture();
    this.textures.devFloor = this.createDevFloorTexture();
    this.textures.musicCarpet = this.createMusicCarpetTexture();
  }

  createCharacterSprite(color, direction, frame, isLocalPlayer = false, player = null) {
    if (color === 'peanut') {
      return this.createPeanutSprite(direction, frame, isLocalPlayer, player);
    }
    if (color === '#FFDBAC') {
      return this.createCowboySprite(direction, frame, isLocalPlayer, player);
    }

    const size = 48;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    ctx.imageSmoothingEnabled = false;

    const legOffset = (frame === 1 ? 2 : (frame === 2 ? -2 : 0));
    const armOffset = (frame === 1 ? -2 : (frame === 2 ? 2 : 0));
    const verticalOffset = (frame === 1 ? -1 : (frame === 2 ? 1 : 0));
    const armVerticalOffset = (frame === 1 ? -1 : (frame === 2 ? 1 : 0));

    const rgb = this.hexToRgb(color);
    const playerId = player ? player.id : '';

    const skinToneColors = ['#FFDBAC', '#E0AC69', '#C68642', '#8D5524'];
    const skinColors = ['#FFE4C4', '#FFDAB9', '#F5DEB3', '#DEB887', '#D2B48C', '#C4A484', '#8D5524', '#6B4423'];
    const pantsColors = ['#4169E1', '#228B22', '#DC143C', '#FF8C00', '#9932CC', '#20B2AA', '#4682B4', '#8B0000'];
    const shoeColors = ['#8B4513', '#2F4F4F', '#000000', '#4A4A4A', '#696969', '#8B0000', '#556B2F', '#483D8B'];

    const hash = this.hashCode(playerId);
    const isSkinTone = skinToneColors.includes(color);
    const skinColor = isSkinTone ? color : skinColors[Math.abs(hash) % skinColors.length];
    const pantsColor = pantsColors[Math.abs(hash >> 8) % pantsColors.length];
    const shoeColor = shoeColors[Math.abs(hash >> 16) % shoeColors.length];

    const headColor = isSkinTone ? '#4ECDC4' : `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
    const shirtColor = isSkinTone ? '#3DB8B0' : `rgb(${Math.max(0, rgb.r - 30)}, ${Math.max(0, rgb.g - 30)}, ${Math.max(0, rgb.b - 30)})`;
    const darkerShirtColor = isSkinTone ? '#2D9A93' : `rgb(${Math.max(0, rgb.r - 60)}, ${Math.max(0, rgb.g - 60)}, ${Math.max(0, rgb.b - 60)})`;
    const fedoraColor = isSkinTone ? '#2D9A93' : `rgb(${Math.max(0, rgb.r - 40)}, ${Math.max(0, rgb.g - 40)}, ${Math.max(0, rgb.b - 40)})`;
    const fedoraBandColor = isSkinTone ? '#4ECDC4' : `rgb(${Math.max(0, rgb.r - 20)}, ${Math.max(0, rgb.g - 20)}, ${Math.max(0, rgb.b - 20)})`;

    if (direction === 'down') {
      ctx.fillStyle = shoeColor;
      ctx.fillRect(15 + legOffset, 39 + verticalOffset, 8, 9);
      ctx.fillRect(26 - legOffset, 39 + verticalOffset, 8, 9);

      ctx.fillStyle = '#0a0a15';
      ctx.fillRect(15 + legOffset, 37 + verticalOffset, 8, 2);
      ctx.fillRect(26 - legOffset, 37 + verticalOffset, 8, 2);

      ctx.fillStyle = pantsColor;
      ctx.fillRect(15 + legOffset, 30 + verticalOffset, 8, 7);
      ctx.fillRect(26 - legOffset, 30 + verticalOffset, 8, 7);

      ctx.fillStyle = darkerShirtColor;
      ctx.fillRect(15 + legOffset, 30 + verticalOffset, 8, 3);
      ctx.fillRect(26 - legOffset, 30 + verticalOffset, 8, 3);

      ctx.fillStyle = shirtColor;
      ctx.fillRect(12, 18 + verticalOffset, 24, 15);

      ctx.fillStyle = darkerShirtColor;
      ctx.fillRect(18, 18 + verticalOffset, 12, 15);

      ctx.fillStyle = shirtColor;
      ctx.fillRect(21, 18 + verticalOffset, 6, 8);

      ctx.fillStyle = darkerShirtColor;
      ctx.fillRect(9, 18 + verticalOffset + armVerticalOffset, 5, 10);
      ctx.fillRect(34, 18 + verticalOffset - armVerticalOffset, 5, 10);

      ctx.fillStyle = shirtColor;
      ctx.fillRect(9, 21 + verticalOffset + armVerticalOffset, 5, 3);
      ctx.fillRect(34, 21 + verticalOffset - armVerticalOffset, 5, 3);

      ctx.fillStyle = '#c0c0c0';
      ctx.fillRect(9, 23 + verticalOffset + armVerticalOffset, 5, 2);
      ctx.fillRect(34, 23 + verticalOffset - armVerticalOffset, 5, 2);

      ctx.fillStyle = skinColor;
      ctx.fillRect(9, 25 + verticalOffset + armVerticalOffset, 5, 3);
      ctx.fillRect(34, 25 + verticalOffset - armVerticalOffset, 5, 3);

      ctx.fillStyle = fedoraColor;
      ctx.fillRect(10, verticalOffset + 3, 28, 3);
      ctx.fillRect(12, verticalOffset + 6, 24, 2);
      ctx.fillRect(14, verticalOffset + 8, 20, 2);

      ctx.fillStyle = fedoraBandColor;
      ctx.fillRect(13, verticalOffset + 6, 22, 2);

      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(15, verticalOffset + 8, 18, 1);

      ctx.fillStyle = '#0f0f1a';
      ctx.fillRect(16, verticalOffset + 10, 16, 8);

      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(17, verticalOffset + 11, 14, 6);

      ctx.fillStyle = '#16213e';
      ctx.fillRect(19, verticalOffset + 13, 10, 3);

    } else if (direction === 'left') {
      ctx.fillStyle = shoeColor;
      ctx.fillRect(15 + legOffset, 39, 8, 9);
      ctx.fillRect(26 - legOffset, 39, 8, 9);

      ctx.fillStyle = '#0a0a15';
      ctx.fillRect(15 + legOffset, 37, 8, 2);
      ctx.fillRect(26 - legOffset, 37, 8, 2);

      ctx.fillStyle = pantsColor;
      ctx.fillRect(15 + legOffset, 30, 8, 7);
      ctx.fillRect(26 - legOffset, 30, 8, 7);

      ctx.fillStyle = darkerShirtColor;
      ctx.fillRect(15 + legOffset, 30, 8, 3);
      ctx.fillRect(26 - legOffset, 30, 8, 3);

      ctx.fillStyle = darkerShirtColor;
      ctx.fillRect(33 - armOffset, 18 + armVerticalOffset, 6, 12);

      ctx.fillStyle = shirtColor;
      ctx.fillRect(33 - armOffset, 22 + armVerticalOffset, 6, 3);

      ctx.fillStyle = '#c0c0c0';
      ctx.fillRect(33 - armOffset, 25 + armVerticalOffset, 6, 2);

      ctx.fillStyle = skinColor;
      ctx.fillRect(33 - armOffset, 27 + armVerticalOffset, 6, 3);

      ctx.fillStyle = shirtColor;
      ctx.fillRect(12, 18, 24, 15);

      ctx.fillStyle = darkerShirtColor;
      ctx.fillRect(18, 18, 12, 15);

      ctx.fillStyle = shirtColor;
      ctx.fillRect(21, 18, 6, 8);

      ctx.fillStyle = darkerShirtColor;
      ctx.fillRect(11 + armOffset, 18 + armVerticalOffset, 6, 12);

      ctx.fillStyle = shirtColor;
      ctx.fillRect(11 + armOffset, 22 + armVerticalOffset, 6, 3);

      ctx.fillStyle = '#c0c0c0';
      ctx.fillRect(11 + armOffset, 25 + armVerticalOffset, 6, 2);

      ctx.fillStyle = skinColor;
      ctx.fillRect(11 + armOffset, 27 + armVerticalOffset, 6, 3);

      ctx.fillStyle = shirtColor;
      ctx.fillRect(12, 18, 24, 15);

      ctx.fillStyle = darkerShirtColor;
      ctx.fillRect(18, 18, 12, 15);

      ctx.fillStyle = shirtColor;
      ctx.fillRect(21, 18, 6, 8);

      ctx.fillStyle = darkerShirtColor;
      ctx.fillRect(31 - armOffset, 18 + armVerticalOffset, 6, 12);

      ctx.fillStyle = shirtColor;
      ctx.fillRect(31 - armOffset, 22 + armVerticalOffset, 6, 3);

      ctx.fillStyle = '#c0c0c0';
      ctx.fillRect(31 - armOffset, 25 + armVerticalOffset, 6, 2);

      ctx.fillStyle = skinColor;
      ctx.fillRect(31 - armOffset, 27 + armVerticalOffset, 6, 3);

      ctx.fillStyle = fedoraColor;
      ctx.fillRect(10, verticalOffset + 3, 28, 3);
      ctx.fillRect(12, verticalOffset + 6, 24, 2);
      ctx.fillRect(14, verticalOffset + 8, 20, 2);

      ctx.fillStyle = fedoraBandColor;
      ctx.fillRect(13, verticalOffset + 6, 22, 2);

      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(15, verticalOffset + 8, 18, 1);

      ctx.fillStyle = skinColor;
      ctx.fillRect(16, verticalOffset + 10, 16, 8);

      ctx.fillStyle = '#e8d4b8';
      ctx.fillRect(17, verticalOffset + 11, 14, 6);

      ctx.fillStyle = '#4169E1';
      ctx.fillRect(19, verticalOffset + 12, 3, 3);
      ctx.fillRect(26, verticalOffset + 12, 3, 3);

      ctx.fillStyle = '#FFF';
      ctx.fillRect(20, verticalOffset + 13, 1, 1);
      ctx.fillRect(27, verticalOffset + 13, 1, 1);

      ctx.fillStyle = '#2F1810';
      ctx.fillRect(20, verticalOffset + 15, 1, 2);
      ctx.fillRect(21, verticalOffset + 16, 1, 2);
      ctx.fillRect(22, verticalOffset + 16, 1, 1);
      ctx.fillRect(23, verticalOffset + 15, 1, 1);
      ctx.fillRect(24, verticalOffset + 15, 1, 1);
      ctx.fillRect(25, verticalOffset + 16, 1, 1);
      ctx.fillRect(26, verticalOffset + 16, 1, 2);
      ctx.fillRect(27, verticalOffset + 15, 1, 2);

    } else if (direction === 'right') {
      ctx.fillStyle = shoeColor;
      ctx.fillRect(15 + legOffset, 39, 8, 9);
      ctx.fillRect(26 - legOffset, 39, 8, 9);

      ctx.fillStyle = '#0a0a15';
      ctx.fillRect(15 + legOffset, 37, 8, 2);
      ctx.fillRect(26 - legOffset, 37, 8, 2);

      ctx.fillStyle = pantsColor;
      ctx.fillRect(15 + legOffset, 30, 8, 7);
      ctx.fillRect(26 - legOffset, 30, 8, 7);

      ctx.fillStyle = darkerShirtColor;
      ctx.fillRect(15 + legOffset, 30, 8, 3);
      ctx.fillRect(26 - legOffset, 30, 8, 3);

      ctx.fillStyle = darkerShirtColor;
      ctx.fillRect(33 - armOffset, 18 + armVerticalOffset, 6, 12);

      ctx.fillStyle = shirtColor;
      ctx.fillRect(33 - armOffset, 22 + armVerticalOffset, 6, 3);

      ctx.fillStyle = '#c0c0c0';
      ctx.fillRect(33 - armOffset, 25 + armVerticalOffset, 6, 2);

      ctx.fillStyle = skinColor;
      ctx.fillRect(33 - armOffset, 27 + armVerticalOffset, 6, 3);

      ctx.fillStyle = shirtColor;
      ctx.fillRect(12, 18, 24, 15);

      ctx.fillStyle = darkerShirtColor;
      ctx.fillRect(18, 18, 12, 15);

      ctx.fillStyle = shirtColor;
      ctx.fillRect(21, 18, 6, 8);

      ctx.fillStyle = darkerShirtColor;
      ctx.fillRect(11 + armOffset, 18 + armVerticalOffset, 6, 12);

      ctx.fillStyle = shirtColor;
      ctx.fillRect(11 + armOffset, 22 + armVerticalOffset, 6, 3);

      ctx.fillStyle = '#c0c0c0';
      ctx.fillRect(11 + armOffset, 25 + armVerticalOffset, 6, 2);

      ctx.fillStyle = skinColor;
      ctx.fillRect(11 + armOffset, 27 + armVerticalOffset, 6, 3);

      ctx.fillStyle = fedoraColor;
      ctx.fillRect(10, verticalOffset + 3, 28, 3);
      ctx.fillRect(12, verticalOffset + 6, 24, 2);
      ctx.fillRect(14, verticalOffset + 8, 20, 2);

      ctx.fillStyle = fedoraBandColor;
      ctx.fillRect(13, verticalOffset + 6, 22, 2);

      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(15, verticalOffset + 8, 18, 1);

      ctx.fillStyle = skinColor;
      ctx.fillRect(16, verticalOffset + 10, 16, 8);

      ctx.fillStyle = '#e8d4b8';
      ctx.fillRect(17, verticalOffset + 11, 14, 6);

      ctx.fillStyle = '#4169E1';
      ctx.fillRect(19, verticalOffset + 12, 3, 3);
      ctx.fillRect(26, verticalOffset + 12, 3, 3);

      ctx.fillStyle = '#FFF';
      ctx.fillRect(20, verticalOffset + 13, 1, 1);
      ctx.fillRect(27, verticalOffset + 13, 1, 1);

      ctx.fillStyle = '#2F1810';
      ctx.fillRect(20, verticalOffset + 15, 1, 2);
      ctx.fillRect(21, verticalOffset + 16, 1, 2);
      ctx.fillRect(22, verticalOffset + 16, 1, 1);
      ctx.fillRect(23, verticalOffset + 15, 1, 1);
      ctx.fillRect(24, verticalOffset + 15, 1, 1);
      ctx.fillRect(25, verticalOffset + 16, 1, 1);
      ctx.fillRect(26, verticalOffset + 16, 1, 2);
      ctx.fillRect(27, verticalOffset + 15, 1, 2);
    }

    return canvas;
  }

  createPeanutSprite(direction, frame, isLocalPlayer = false, player = null) {
    const size = 48;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    ctx.imageSmoothingEnabled = false;

    const bounceOffset = frame === 1 ? -1 : (frame === 2 ? 1 : 0);

    const bgColors = ['#191929', '#161e36'];
    const faceColors = ['#000000', '#ffffff', '#ff6060', '#af7b0e'];
    const shellColor = '#ce9b69';

    const spriteData = peanutSpriteData[direction] || peanutSpriteData.down;
    const srcWidth = spriteData.width;
    const srcHeight = spriteData.height;
    const pixels = spriteData.pixels;

    const scale = (size / Math.max(srcWidth, srcHeight)) * 1.65;
    const offsetX = Math.floor((size - srcWidth * scale) / 2);
    const offsetY = Math.floor((size - srcHeight * scale) / 2) + bounceOffset;

    const isNodding = isLocalPlayer ? this.peanutNodding : (player ? player.peanutNodding : false);
    const isShockMouth = isLocalPlayer ? this.peanutShockMouth : (player ? player.peanutShockMouth : false);
    const isMouthOpen = isLocalPlayer ? this.peanutMouthOpen : (player ? player.peanutMouthOpen : false);

    const eyeColor = '#ffffff';
    const eyePupilColor = '#000000';
    const mouthClosedColor = '#e85a5a';
    const mouthOpenColor = '#c44040';
    const mouthShockColor = '#a03030';

    let nodOffsetY = 0;
    let nodOffsetX = 0;
    let nodRotation = 0;

    if (isNodding) {
      const nodFrame = isLocalPlayer ? this.peanutNodFrame : (player ? player.peanutNodFrame : 0);
      const nodProgress = nodFrame / this.peanutNodMaxFrames;

      if (nodProgress < 0.25) {
        const t = nodProgress / 0.25;
        const intensity = Math.sin(t * Math.PI);
        nodOffsetY = intensity * 3;
        nodOffsetX = intensity * 2;
        nodRotation = intensity * 0.15;
      } else if (nodProgress < 0.5) {
        nodOffsetY = 0;
        nodOffsetX = 0;
        nodRotation = 0;
      } else if (nodProgress < 0.75) {
        const t = (nodProgress - 0.5) / 0.25;
        const intensity = Math.sin(t * Math.PI);
        nodOffsetY = intensity * 3;
        nodOffsetX = intensity * 2;
        nodRotation = intensity * 0.15;
      } else {
        nodOffsetY = 0;
        nodOffsetX = 0;
        nodRotation = 0;
      }
    }

    const headRegionY = Math.floor(srcHeight * 0.60);

    const mouthPixels = [];
    if (isMouthOpen || isShockMouth) {
      for (let y = 0; y < srcHeight; y++) {
        for (let x = 0; x < srcWidth; x++) {
          if (pixels[y][x] === '#ff6060') {
            mouthPixels.push({x, y});
          }
        }
      }
    }

    for (let y = 0; y < srcHeight; y++) {
      for (let x = 0; x < srcWidth; x++) {
        const color = pixels[y][x];
        if (!bgColors.includes(color)) {
          let drawColor = color;
          let pixelShift = 0;

          if (direction === 'up' && faceColors.includes(color)) {
            drawColor = shellColor;
          } else if (direction === 'right') {
            if (color === '#000000' || color === '#ffffff') {
              if (x < 29) {
                pixelShift = 3;
              } else {
                pixelShift = 1;
              }
            } else if (color === '#ff6060' || color === '#af7b0e') {
              pixelShift = 2;
            }
          } else if (direction === 'left') {
            if (color === '#000000' || color === '#ffffff') {
              if (x < 29) {
                pixelShift = -1;
              } else {
                pixelShift = -3;
              }
            } else if (color === '#ff6060' || color === '#af7b0e') {
              pixelShift = -2;
            }
          }

          if (isMouthOpen && color === '#ff6060') {
            drawColor = mouthOpenColor;
          } else if (isShockMouth && color === '#ff6060') {
            drawColor = mouthShockColor;
          }

          let finalOffsetX = 0;
          let finalOffsetY = 0;
          let rotationShift = 0;

          if (isNodding && y < headRegionY) {
            finalOffsetX = nodOffsetX;
            finalOffsetY = nodOffsetY;
            rotationShift = Math.floor((y - headRegionY / 2) * nodRotation);
          }

          const drawX = Math.floor(offsetX + x * scale + pixelShift * scale + finalOffsetX * scale + rotationShift * scale);
          const drawY = Math.floor(offsetY + y * scale + finalOffsetY * scale);
          const drawSize = Math.ceil(scale);

          ctx.fillStyle = drawColor;
          ctx.fillRect(drawX, drawY, drawSize, drawSize);
        }
      }
    }

    if (isMouthOpen || isShockMouth) {
      const outlineColor = '#ff6060';
      const expansion = 1;
      
      if (mouthPixels.length > 0) {
        const minX = Math.min(...mouthPixels.map(p => p.x));
        const maxX = Math.max(...mouthPixels.map(p => p.x));
        const minY = Math.min(...mouthPixels.map(p => p.y));
        const maxY = Math.max(...mouthPixels.map(p => p.y));
        
        const mouthSet = new Set(mouthPixels.map(p => `${p.x},${p.y}`));
        const drawnPixels = new Set();
        
        for (let y = minY - expansion; y <= maxY + expansion; y++) {
          for (let x = minX - expansion; x <= maxX + expansion; x++) {
            const key = `${x},${y}`;
            
            if (x >= 0 && x < srcWidth && y >= 0 && y < srcHeight && !drawnPixels.has(key)) {
              const isOnOutline = (x === minX - expansion || x === maxX + expansion || y === minY - expansion || y === maxY + expansion);
              const isInside = (x > minX - expansion && x < maxX + expansion && y > minY - expansion && y < maxY + expansion);
              
              if ((isOnOutline || isInside) && !bgColors.includes(pixels[y][x])) {
                drawnPixels.add(key);
                
                let pixelShift = 0;
                
                if (direction === 'right') {
                  if (pixels[y][x] === '#000000' || pixels[y][x] === '#ffffff') {
                    if (x < 29) {
                      pixelShift = 3;
                    } else {
                      pixelShift = 1;
                    }
                  } else if (pixels[y][x] === '#ff6060' || pixels[y][x] === '#af7b0e') {
                    pixelShift = 2;
                  }
                } else if (direction === 'left') {
                  if (pixels[y][x] === '#000000' || pixels[y][x] === '#ffffff') {
                    if (x < 29) {
                      pixelShift = -1;
                    } else {
                      pixelShift = -3;
                    }
                  } else if (pixels[y][x] === '#ff6060' || pixels[y][x] === '#af7b0e') {
                    pixelShift = -2;
                  }
                }

                let finalOffsetX = 0;
                let finalOffsetY = 0;
                let rotationShift = 0;

                if (isNodding && y < headRegionY) {
                  finalOffsetX = nodOffsetX;
                  finalOffsetY = nodOffsetY;
                  rotationShift = Math.floor((y - headRegionY / 2) * nodRotation);
                }

                const drawX = Math.floor(offsetX + x * scale + pixelShift * scale + finalOffsetX * scale + rotationShift * scale);
                const drawY = Math.floor(offsetY + y * scale + finalOffsetY * scale);
                const drawSize = Math.ceil(scale);

                ctx.fillStyle = isOnOutline ? outlineColor : '#000000';
                ctx.fillRect(drawX, drawY, drawSize, drawSize);
              }
            }
          }
        }
      }
    }

    return canvas;
  }

  createCowboySprite(direction, frame, isLocalPlayer = false, player = null) {
    const size = 48;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    ctx.imageSmoothingEnabled = false;

    const legOffset = (frame === 1 ? 2 : (frame === 2 ? -2 : 0));
    const armOffset = (frame === 1 ? -2 : (frame === 2 ? 2 : 0));
    const verticalOffset = (frame === 1 ? -1 : (frame === 2 ? 1 : 0));
    const armVerticalOffset = (frame === 1 ? -1 : (frame === 2 ? 1 : 0));

    const skinColor = '#FFDBAC';
    const vestColor = '#1a1a1a';
    const shirtColor = '#F5DEB3';
    const pantsColor = '#2F4F4F';
    const chapsColor = '#5D4037';
    const bootColor = '#3D2B1F';
    const hatColor = '#5D4037';
    const hatBandColor = '#C4A484';

    if (direction === 'down') {
      ctx.fillStyle = bootColor;
      ctx.fillRect(14 + legOffset, 38 + verticalOffset, 10, 10);
      ctx.fillRect(25 - legOffset, 38 + verticalOffset, 10, 10);

      ctx.fillStyle = '#2D1B0F';
      ctx.fillRect(14 + legOffset, 36 + verticalOffset, 10, 3);
      ctx.fillRect(25 - legOffset, 36 + verticalOffset, 10, 3);

      ctx.fillStyle = '#FFD700';
      ctx.fillRect(13 + legOffset, 44 + verticalOffset, 2, 2);
      ctx.fillRect(24 - legOffset, 44 + verticalOffset, 2, 2);
      ctx.fillRect(13 + legOffset, 46 + verticalOffset, 1, 1);
      ctx.fillRect(24 - legOffset, 46 + verticalOffset, 1, 1);

      ctx.fillStyle = pantsColor;
      ctx.fillRect(15 + legOffset, 30 + verticalOffset, 8, 7);
      ctx.fillRect(26 - legOffset, 30 + verticalOffset, 8, 7);

      ctx.fillStyle = '#1a3a3a';
      ctx.fillRect(15 + legOffset, 30 + verticalOffset, 8, 3);
      ctx.fillRect(26 - legOffset, 30 + verticalOffset, 8, 3);

      ctx.fillStyle = chapsColor;
      ctx.fillRect(14 + legOffset, 30 + verticalOffset, 10, 6);
      ctx.fillRect(25 - legOffset, 30 + verticalOffset, 10, 6);

      ctx.fillStyle = '#4E342E';
      ctx.fillRect(14 + legOffset, 30 + verticalOffset, 10, 2);
      ctx.fillRect(25 - legOffset, 30 + verticalOffset, 10, 2);

      ctx.fillStyle = shirtColor;
      ctx.fillRect(12, 18 + verticalOffset, 24, 15);

      ctx.fillStyle = vestColor;
      ctx.fillRect(18, 18 + verticalOffset, 12, 15);

      ctx.fillStyle = shirtColor;
      ctx.fillRect(21, 18 + verticalOffset, 6, 8);

      ctx.fillStyle = vestColor;
      ctx.fillRect(9, 18 + verticalOffset + armVerticalOffset, 6, 12);
      ctx.fillRect(33, 18 + verticalOffset - armVerticalOffset, 6, 12);

      ctx.fillStyle = '#6B3410';
      ctx.fillRect(9, 18 + verticalOffset + armVerticalOffset, 6, 4);
      ctx.fillRect(33, 18 + verticalOffset - armVerticalOffset, 6, 4);

      ctx.fillStyle = shirtColor;
      ctx.fillRect(9, 22 + verticalOffset + armVerticalOffset, 6, 3);
      ctx.fillRect(33, 22 + verticalOffset - armVerticalOffset, 6, 3);

      ctx.fillStyle = '#c0c0c0';
      ctx.fillRect(9, 25 + verticalOffset + armVerticalOffset, 6, 2);
      ctx.fillRect(33, 25 + verticalOffset - armVerticalOffset, 6, 2);

      ctx.fillStyle = skinColor;
      ctx.fillRect(9, 27 + verticalOffset + armVerticalOffset, 6, 3);
      ctx.fillRect(33, 27 + verticalOffset - armVerticalOffset, 6, 3);

      ctx.fillStyle = hatColor;
      ctx.fillRect(3, 5 + verticalOffset, 42, 2);
      ctx.fillRect(2, 6 + verticalOffset, 44, 2);
      ctx.fillRect(3, 7 + verticalOffset, 42, 1);

      ctx.fillStyle = '#8B4513';
      ctx.fillRect(5, 8 + verticalOffset, 38, 1);
      ctx.fillRect(6, 9 + verticalOffset, 36, 1);

      ctx.fillStyle = '#A0522D';
      ctx.fillRect(16, 0 + verticalOffset, 16, 2);
      ctx.fillRect(15, 1 + verticalOffset, 18, 2);
      ctx.fillRect(14, 2 + verticalOffset, 20, 2);
      ctx.fillRect(13, 3 + verticalOffset, 22, 2);
      ctx.fillRect(12, 4 + verticalOffset, 24, 2);
      ctx.fillRect(13, 5 + verticalOffset, 22, 1);

      ctx.fillStyle = hatBandColor;
      ctx.fillRect(17, 0 + verticalOffset, 14, 1);

      ctx.fillStyle = '#4E342E';
      ctx.fillRect(16, 3 + verticalOffset, 16, 1);

      ctx.fillStyle = skinColor;
      ctx.fillRect(16, verticalOffset + 10, 16, 8);

      ctx.fillStyle = '#e8d4b8';
      ctx.fillRect(17, verticalOffset + 11, 14, 6);

      ctx.fillStyle = '#4169E1';
      ctx.fillRect(19, verticalOffset + 12, 3, 3);
      ctx.fillRect(26, verticalOffset + 12, 3, 3);

      ctx.fillStyle = '#FFF';
      ctx.fillRect(20, verticalOffset + 13, 1, 1);
      ctx.fillRect(27, verticalOffset + 13, 1, 1);

      ctx.fillStyle = '#2F1810';
      ctx.fillRect(20, verticalOffset + 15, 1, 2);
      ctx.fillRect(21, verticalOffset + 16, 1, 2);
      ctx.fillRect(22, verticalOffset + 16, 1, 1);
      ctx.fillRect(23, verticalOffset + 15, 1, 1);
      ctx.fillRect(24, verticalOffset + 15, 1, 1);
      ctx.fillRect(25, verticalOffset + 16, 1, 1);
      ctx.fillRect(26, verticalOffset + 16, 1, 2);
      ctx.fillRect(27, verticalOffset + 15, 1, 2);

    } else if (direction === 'up') {
      ctx.fillStyle = bootColor;
      ctx.fillRect(14 + legOffset, 38 + verticalOffset, 10, 10);
      ctx.fillRect(25 - legOffset, 38 + verticalOffset, 10, 10);

      ctx.fillStyle = '#2D1B0F';
      ctx.fillRect(14 + legOffset, 36 + verticalOffset, 10, 3);
      ctx.fillRect(25 - legOffset, 36 + verticalOffset, 10, 3);

      ctx.fillStyle = '#FFD700';
      ctx.fillRect(13 + legOffset, 44 + verticalOffset, 2, 2);
      ctx.fillRect(24 - legOffset, 44 + verticalOffset, 2, 2);
      ctx.fillRect(13 + legOffset, 46 + verticalOffset, 1, 1);
      ctx.fillRect(24 - legOffset, 46 + verticalOffset, 1, 1);

      ctx.fillStyle = pantsColor;
      ctx.fillRect(15 + legOffset, 30 + verticalOffset, 8, 7);
      ctx.fillRect(26 - legOffset, 30 + verticalOffset, 8, 7);

      ctx.fillStyle = '#1a3a3a';
      ctx.fillRect(15 + legOffset, 30 + verticalOffset, 8, 3);
      ctx.fillRect(26 - legOffset, 30 + verticalOffset, 8, 3);

      ctx.fillStyle = chapsColor;
      ctx.fillRect(14 + legOffset, 30 + verticalOffset, 10, 6);
      ctx.fillRect(25 - legOffset, 30 + verticalOffset, 10, 6);

      ctx.fillStyle = '#4E342E';
      ctx.fillRect(14 + legOffset, 30 + verticalOffset, 10, 2);
      ctx.fillRect(25 - legOffset, 30 + verticalOffset, 10, 2);

      ctx.fillStyle = shirtColor;
      ctx.fillRect(12, 18 + verticalOffset, 24, 15);

      ctx.fillStyle = vestColor;
      ctx.fillRect(18, 18 + verticalOffset, 12, 15);

      ctx.fillStyle = vestColor;
      ctx.fillRect(9, 18 + verticalOffset + armVerticalOffset, 5, 10);
      ctx.fillRect(34, 18 + verticalOffset - armVerticalOffset, 5, 10);

      ctx.fillStyle = '#6B3410';
      ctx.fillRect(9, 18 + verticalOffset + armVerticalOffset, 5, 3);
      ctx.fillRect(34, 18 + verticalOffset - armVerticalOffset, 5, 3);

      ctx.fillStyle = '#c0c0c0';
      ctx.fillRect(9, 23 + verticalOffset + armVerticalOffset, 5, 2);
      ctx.fillRect(34, 23 + verticalOffset - armVerticalOffset, 5, 2);

      ctx.fillStyle = skinColor;
      ctx.fillRect(9, 25 + verticalOffset + armVerticalOffset, 5, 3);
      ctx.fillRect(34, 25 + verticalOffset - armVerticalOffset, 5, 3);

      ctx.fillStyle = hatColor;
      ctx.fillRect(3, 5 + verticalOffset, 42, 2);
      ctx.fillRect(2, 6 + verticalOffset, 44, 2);
      ctx.fillRect(3, 7 + verticalOffset, 42, 1);

      ctx.fillStyle = '#8B4513';
      ctx.fillRect(5, 8 + verticalOffset, 38, 1);
      ctx.fillRect(6, 9 + verticalOffset, 36, 1);

      ctx.fillStyle = '#A0522D';
      ctx.fillRect(16, 0 + verticalOffset, 16, 2);
      ctx.fillRect(15, 1 + verticalOffset, 18, 2);
      ctx.fillRect(14, 2 + verticalOffset, 20, 2);
      ctx.fillRect(13, 3 + verticalOffset, 22, 2);
      ctx.fillRect(12, 4 + verticalOffset, 24, 2);
      ctx.fillRect(13, 5 + verticalOffset, 22, 1);

      ctx.fillStyle = hatBandColor;
      ctx.fillRect(17, 0 + verticalOffset, 14, 1);

      ctx.fillStyle = '#4E342E';
      ctx.fillRect(16, 3 + verticalOffset, 16, 1);

      ctx.fillStyle = '#0f0f1a';
      ctx.fillRect(16, verticalOffset + 10, 16, 8);

      ctx.fillStyle = '#1a3a3a';
      ctx.fillRect(17, verticalOffset + 11, 14, 6);

      ctx.fillStyle = '#2a4a4a';
      ctx.fillRect(19, verticalOffset + 13, 10, 3);

    } else if (direction === 'left') {
      ctx.fillStyle = bootColor;
      ctx.fillRect(14 + legOffset, 38, 10, 10);
      ctx.fillRect(25 - legOffset, 38, 10, 10);

      ctx.fillStyle = '#2D1B0F';
      ctx.fillRect(14 + legOffset, 36, 10, 3);
      ctx.fillRect(25 - legOffset, 36, 10, 3);

      ctx.fillStyle = '#FFD700';
      ctx.fillRect(13 + legOffset, 44, 2, 2);
      ctx.fillRect(24 - legOffset, 44, 2, 2);
      ctx.fillRect(13 + legOffset, 46, 1, 1);
      ctx.fillRect(24 - legOffset, 46, 1, 1);

      ctx.fillStyle = pantsColor;
      ctx.fillRect(15 + legOffset, 30, 8, 7);
      ctx.fillRect(26 - legOffset, 30, 8, 7);

      ctx.fillStyle = '#1a3a3a';
      ctx.fillRect(15 + legOffset, 30, 8, 3);
      ctx.fillRect(26 - legOffset, 30, 8, 3);

      ctx.fillStyle = chapsColor;
      ctx.fillRect(14 + legOffset, 30, 10, 6);
      ctx.fillRect(25 - legOffset, 30, 10, 6);

      ctx.fillStyle = '#4E342E';
      ctx.fillRect(14 + legOffset, 30, 10, 2);
      ctx.fillRect(25 - legOffset, 30, 10, 2);

      ctx.fillStyle = vestColor;
      ctx.fillRect(11 + armOffset, 18 + armVerticalOffset, 6, 12);

      ctx.fillStyle = '#6B3410';
      ctx.fillRect(11 + armOffset, 18 + armVerticalOffset, 6, 4);

      ctx.fillStyle = shirtColor;
      ctx.fillRect(11 + armOffset, 22 + armVerticalOffset, 6, 3);

      ctx.fillStyle = '#c0c0c0';
      ctx.fillRect(11 + armOffset, 25 + armVerticalOffset, 6, 2);

      ctx.fillStyle = skinColor;
      ctx.fillRect(11 + armOffset, 27 + armVerticalOffset, 6, 3);

      ctx.fillStyle = shirtColor;
      ctx.fillRect(12, 18, 24, 15);

      ctx.fillStyle = vestColor;
      ctx.fillRect(18, 18, 12, 15);

      ctx.fillStyle = shirtColor;
      ctx.fillRect(21, 18, 6, 8);

      ctx.fillStyle = vestColor;
      ctx.fillRect(31 - armOffset, 18 + armVerticalOffset, 6, 12);

      ctx.fillStyle = '#6B3410';
      ctx.fillRect(31 - armOffset, 18 + armVerticalOffset, 6, 4);

      ctx.fillStyle = shirtColor;
      ctx.fillRect(31 - armOffset, 22 + armVerticalOffset, 6, 3);

      ctx.fillStyle = '#c0c0c0';
      ctx.fillRect(31 - armOffset, 25 + armVerticalOffset, 6, 2);

      ctx.fillStyle = skinColor;
      ctx.fillRect(31 - armOffset, 27 + armVerticalOffset, 6, 3);

      ctx.fillStyle = hatColor;
      ctx.fillRect(3, 5 + verticalOffset, 42, 2);
      ctx.fillRect(2, 6 + verticalOffset, 44, 2);
      ctx.fillRect(3, 7 + verticalOffset, 42, 1);

      ctx.fillStyle = '#8B4513';
      ctx.fillRect(5, 8 + verticalOffset, 38, 1);
      ctx.fillRect(6, 9 + verticalOffset, 36, 1);

      ctx.fillStyle = '#A0522D';
      ctx.fillRect(16, 0 + verticalOffset, 16, 2);
      ctx.fillRect(15, 1 + verticalOffset, 18, 2);
      ctx.fillRect(14, 2 + verticalOffset, 20, 2);
      ctx.fillRect(13, 3 + verticalOffset, 22, 2);
      ctx.fillRect(12, 4 + verticalOffset, 24, 2);
      ctx.fillRect(13, 5 + verticalOffset, 22, 1);

      ctx.fillStyle = hatBandColor;
      ctx.fillRect(17, 0 + verticalOffset, 14, 1);

      ctx.fillStyle = '#4E342E';
      ctx.fillRect(16, 3 + verticalOffset, 16, 1);

      ctx.fillStyle = skinColor;
      ctx.fillRect(16, verticalOffset + 10, 16, 8);

      ctx.fillStyle = '#e8d4b8';
      ctx.fillRect(17, verticalOffset + 11, 14, 6);

      ctx.fillStyle = '#4169E1';
      ctx.fillRect(19, verticalOffset + 12, 3, 3);
      ctx.fillRect(26, verticalOffset + 12, 3, 3);

      ctx.fillStyle = '#FFF';
      ctx.fillRect(20, verticalOffset + 13, 1, 1);
      ctx.fillRect(27, verticalOffset + 13, 1, 1);

      ctx.fillStyle = '#2F1810';
      ctx.fillRect(20, verticalOffset + 15, 1, 2);
      ctx.fillRect(21, verticalOffset + 16, 1, 2);
      ctx.fillRect(22, verticalOffset + 16, 1, 1);
      ctx.fillRect(23, verticalOffset + 15, 1, 1);
      ctx.fillRect(24, verticalOffset + 15, 1, 1);
      ctx.fillRect(25, verticalOffset + 16, 1, 1);
      ctx.fillRect(26, verticalOffset + 16, 1, 2);
      ctx.fillRect(27, verticalOffset + 15, 1, 2);

    } else if (direction === 'right') {
      ctx.fillStyle = bootColor;
      ctx.fillRect(14 + legOffset, 38, 10, 10);
      ctx.fillRect(25 - legOffset, 38, 10, 10);

      ctx.fillStyle = '#2D1B0F';
      ctx.fillRect(14 + legOffset, 36, 10, 3);
      ctx.fillRect(25 - legOffset, 36, 10, 3);

      ctx.fillStyle = '#FFD700';
      ctx.fillRect(13 + legOffset, 44, 2, 2);
      ctx.fillRect(24 - legOffset, 44, 2, 2);
      ctx.fillRect(13 + legOffset, 46, 1, 1);
      ctx.fillRect(24 - legOffset, 46, 1, 1);

      ctx.fillStyle = pantsColor;
      ctx.fillRect(15 + legOffset, 30, 8, 7);
      ctx.fillRect(26 - legOffset, 30, 8, 7);

      ctx.fillStyle = '#1a3a3a';
      ctx.fillRect(15 + legOffset, 30, 8, 3);
      ctx.fillRect(26 - legOffset, 30, 8, 3);

      ctx.fillStyle = chapsColor;
      ctx.fillRect(14 + legOffset, 30, 10, 6);
      ctx.fillRect(25 - legOffset, 30, 10, 6);

      ctx.fillStyle = '#4E342E';
      ctx.fillRect(14 + legOffset, 30, 10, 2);
      ctx.fillRect(25 - legOffset, 30, 10, 2);

      ctx.fillStyle = vestColor;
      ctx.fillRect(33 - armOffset, 18 + armVerticalOffset, 6, 12);

      ctx.fillStyle = '#6B3410';
      ctx.fillRect(33 - armOffset, 18 + armVerticalOffset, 6, 4);

      ctx.fillStyle = shirtColor;
      ctx.fillRect(33 - armOffset, 22 + armVerticalOffset, 6, 3);

      ctx.fillStyle = '#c0c0c0';
      ctx.fillRect(33 - armOffset, 25 + armVerticalOffset, 6, 2);

      ctx.fillStyle = skinColor;
      ctx.fillRect(33 - armOffset, 27 + armVerticalOffset, 6, 3);

      ctx.fillStyle = shirtColor;
      ctx.fillRect(12, 18, 24, 15);

      ctx.fillStyle = vestColor;
      ctx.fillRect(18, 18, 12, 15);

      ctx.fillStyle = shirtColor;
      ctx.fillRect(21, 18, 6, 8);

      ctx.fillStyle = vestColor;
      ctx.fillRect(11 + armOffset, 18 + armVerticalOffset, 6, 12);

      ctx.fillStyle = '#6B3410';
      ctx.fillRect(11 + armOffset, 18 + armVerticalOffset, 6, 4);

      ctx.fillStyle = shirtColor;
      ctx.fillRect(11 + armOffset, 22 + armVerticalOffset, 6, 3);

      ctx.fillStyle = '#c0c0c0';
      ctx.fillRect(11 + armOffset, 25 + armVerticalOffset, 6, 2);

      ctx.fillStyle = skinColor;
      ctx.fillRect(11 + armOffset, 27 + armVerticalOffset, 6, 3);

      ctx.fillStyle = hatColor;
      ctx.fillRect(3, 5 + verticalOffset, 42, 2);
      ctx.fillRect(2, 6 + verticalOffset, 44, 2);
      ctx.fillRect(3, 7 + verticalOffset, 42, 1);

      ctx.fillStyle = '#8B4513';
      ctx.fillRect(5, 8 + verticalOffset, 38, 1);
      ctx.fillRect(6, 9 + verticalOffset, 36, 1);

      ctx.fillStyle = '#A0522D';
      ctx.fillRect(16, 0 + verticalOffset, 16, 2);
      ctx.fillRect(15, 1 + verticalOffset, 18, 2);
      ctx.fillRect(14, 2 + verticalOffset, 20, 2);
      ctx.fillRect(13, 3 + verticalOffset, 22, 2);
      ctx.fillRect(12, 4 + verticalOffset, 24, 2);
      ctx.fillRect(13, 5 + verticalOffset, 22, 1);

      ctx.fillStyle = hatBandColor;
      ctx.fillRect(17, 0 + verticalOffset, 14, 1);

      ctx.fillStyle = '#4E342E';
      ctx.fillRect(16, 3 + verticalOffset, 16, 1);

      ctx.fillStyle = skinColor;
      ctx.fillRect(16, verticalOffset + 10, 16, 8);

      ctx.fillStyle = '#e8d4b8';
      ctx.fillRect(17, verticalOffset + 11, 14, 6);

      ctx.fillStyle = '#4169E1';
      ctx.fillRect(19, verticalOffset + 12, 3, 3);
      ctx.fillRect(26, verticalOffset + 12, 3, 3);

      ctx.fillStyle = '#FFF';
      ctx.fillRect(20, verticalOffset + 13, 1, 1);
      ctx.fillRect(27, verticalOffset + 13, 1, 1);

      ctx.fillStyle = '#2F1810';
      ctx.fillRect(20, verticalOffset + 15, 1, 2);
      ctx.fillRect(21, verticalOffset + 16, 1, 2);
      ctx.fillRect(22, verticalOffset + 16, 1, 1);
      ctx.fillRect(23, verticalOffset + 15, 1, 1);
      ctx.fillRect(24, verticalOffset + 15, 1, 1);
      ctx.fillRect(25, verticalOffset + 16, 1, 1);
      ctx.fillRect(26, verticalOffset + 16, 1, 2);
      ctx.fillRect(27, verticalOffset + 15, 1, 2);
    }

    return canvas;
  }

  createWoodTexture() {
    const width = 4096;
    const height = 64;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    const woodColors = ['#8B4513', '#A0522D', '#CD853F', '#DEB887', '#D2691E'];
    const darkColors = ['#654321', '#5D4037', '#4E342E'];
    const lightColors = ['#F4A460', '#DEB887', '#FFE4C4'];

    let currentY = 0;
    while (currentY < height) {
      const boardHeight = 16;
      const baseColor = woodColors[Math.floor(Math.random() * woodColors.length)];
      ctx.fillStyle = baseColor;
      ctx.fillRect(0, currentY, width, boardHeight);

      ctx.fillStyle = darkColors[Math.floor(Math.random() * darkColors.length)];
      ctx.fillRect(0, currentY, width, 2);

      ctx.fillStyle = lightColors[Math.floor(Math.random() * lightColors.length)];
      ctx.fillRect(0, currentY + 2, width, 1);

      for (let i = 0; i < 2; i++) {
        ctx.fillStyle = 'rgba(0,0,0,0.05)';
        const grainY = currentY + 5 + i * 5;
        ctx.fillRect(0, grainY, width, 1);
      }

      currentY += boardHeight;
    }

    return ctx.createPattern(canvas, 'repeat-x');
  }

  createFloorboardTexture() {
    const width = 80;
    const height = 16;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#A0522D';
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = '#CD853F';
    ctx.fillRect(0, 0, width, 2);

    ctx.fillStyle = '#DEB887';
    ctx.fillRect(0, 2, width, 1);

    ctx.fillStyle = '#8B4513';
    ctx.fillRect(0, height - 2, width, 2);

    for (let i = 0; i < 8; i++) {
      ctx.fillStyle = 'rgba(0,0,0,0.08)';
      const grainY = 3 + i * 1.5;
      ctx.fillRect(0, grainY, width, 1);
    }

    for (let i = 0; i < 15; i++) {
      ctx.fillStyle = 'rgba(0,0,0,0.05)';
      const grainX = 5 + i * 5;
      ctx.fillRect(grainX, 3, 1, 10);
    }

    for (let i = 0; i < 10; i++) {
      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      const highlightX = 8 + i * 7;
      ctx.fillRect(highlightX, 4, 1, 8);
    }

    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = 'rgba(0,0,0,0.1)';
      const knotX = 10 + i * 15;
      const knotY = 5 + (i % 2) * 4;
      ctx.beginPath();
      ctx.arc(knotX, knotY, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.fillRect(width - 2, 0, 2, height);

    return canvas;
  }

  createTileTexture() {
    const size = 32;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    const tileColors = ['#4A90A4', '#5BA3B8', '#3D7A8C', '#6BB8D0'];
    const groutColor = '#2C3E50';
    const highlightColor = '#7EC8E3';

    for (let y = 0; y < size; y += 16) {
      for (let x = 0; x < size; x += 16) {
        const baseColor = tileColors[Math.floor(Math.random() * tileColors.length)];
        ctx.fillStyle = baseColor;
        ctx.fillRect(x, y, 16, 16);

        ctx.fillStyle = highlightColor;
        ctx.fillRect(x, y, 16, 2);
        ctx.fillRect(x, y, 2, 16);

        ctx.fillStyle = groutColor;
        ctx.fillRect(x + 14, y, 2, 16);
        ctx.fillRect(x, y + 14, 16, 2);

        if (Math.random() > 0.6) {
          ctx.fillStyle = 'rgba(255,255,255,0.2)';
          ctx.fillRect(x + 4, y + 4, 4, 4);
        }
      }
    }

    return ctx.createPattern(canvas, 'repeat');
  }

  createCarpetTexture() {
    const size = 16;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    const carpetColors = ['#6B5B95', '#7B6BA5', '#5B4B85', '#8B7BB5'];
    const patternColors = ['#9B8BC5', '#AB9BD5'];

    ctx.fillStyle = carpetColors[Math.floor(Math.random() * carpetColors.length)];
    ctx.fillRect(0, 0, size, size);

    for (let i = 0; i < 8; i++) {
      ctx.fillStyle = patternColors[Math.floor(Math.random() * patternColors.length)];
      const x = Math.floor(Math.random() * size);
      const y = Math.floor(Math.random() * size);
      ctx.fillRect(x, y, 2, 2);
    }

    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = 'rgba(255,255,255,0.1)';
      const x = Math.floor(Math.random() * size);
      const y = Math.floor(Math.random() * size);
      ctx.fillRect(x, y, 1, 1);
    }

    return ctx.createPattern(canvas, 'repeat');
  }

  createBrickTexture() {
    const size = 32;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    const brickColors = ['#8B0000', '#A52A2A', '#B22222', '#CD5C5C', '#DC143C'];
    const mortarColor = '#2C2C2C';
    const highlightColor = '#FF6B6B';

    for (let y = 0; y < size; y += 8) {
      const offset = (y / 8) % 2 === 0 ? 0 : 8;
      for (let x = -8; x < size; x += 16) {
        const baseColor = brickColors[Math.floor(Math.random() * brickColors.length)];
        ctx.fillStyle = baseColor;
        ctx.fillRect(x + offset, y, 15, 7);

        ctx.fillStyle = highlightColor;
        ctx.fillRect(x + offset, y, 15, 1);
        ctx.fillRect(x + offset, y, 1, 7);

        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.fillRect(x + offset + 14, y, 1, 7);
        ctx.fillRect(x + offset, y + 6, 15, 1);

        if (Math.random() > 0.7) {
          ctx.fillStyle = 'rgba(0,0,0,0.15)';
          ctx.fillRect(x + offset + 4, y + 2, 6, 2);
        }
      }
    }

    ctx.fillStyle = mortarColor;
    for (let y = 0; y < size; y += 8) {
      ctx.fillRect(0, y, size, 1);
    }
    for (let x = 0; x < size; x += 16) {
      ctx.fillRect(x, 0, 1, size);
    }

    return ctx.createPattern(canvas, 'repeat');
  }

  createWoodWallTexture() {
    const size = 64;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    const colors = ['#654321', '#8B4513', '#A0522D', '#5D4037'];
    for (let y = 0; y < size; y += 4) {
      ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
      ctx.fillRect(0, y, size, 4);
    }

    for (let i = 0; i < 100; i++) {
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      ctx.fillRect(Math.random() * size, Math.random() * size, 3, 1);
    }

    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    for (let x = 0; x < size; x += 16) {
      ctx.fillRect(x, 0, 1, size);
    }

    return ctx.createPattern(canvas, 'repeat');
  }

  createDevFloorTexture() {
    const size = 32;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    const tileColors = ['#2C3E50', '#34495E', '#1A252F', '#3D566E'];
    const groutColor = '#1a1a1a';
    const highlightColor = '#4A6FA5';

    for (let y = 0; y < size; y += 16) {
      for (let x = 0; x < size; x += 16) {
        const baseColor = tileColors[Math.floor(Math.random() * tileColors.length)];
        ctx.fillStyle = baseColor;
        ctx.fillRect(x, y, 16, 16);

        ctx.fillStyle = highlightColor;
        ctx.fillRect(x, y, 16, 2);
        ctx.fillRect(x, y, 2, 16);

        ctx.fillStyle = groutColor;
        ctx.fillRect(x + 14, y, 2, 16);
        ctx.fillRect(x, y + 14, 16, 2);

        if (Math.random() > 0.6) {
          ctx.fillStyle = 'rgba(255,255,255,0.1)';
          ctx.fillRect(x + 4, y + 4, 4, 4);
        }
      }
    }

    return ctx.createPattern(canvas, 'repeat');
  }

  createMusicCarpetTexture() {
    const width = 120;
    const height = 120;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#4A2C5A';
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = '#5D3A6E';
    ctx.fillRect(0, 0, width, 4);
    ctx.fillRect(0, 0, 4, height);

    ctx.fillStyle = '#3D1F4A';
    ctx.fillRect(0, height - 4, width, 4);
    ctx.fillRect(width - 4, 0, 4, height);

    for (let i = 0; i < 12; i++) {
      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      const patternX = 8 + (i % 4) * 28;
      const patternY = 8 + Math.floor(i / 4) * 28;
      ctx.fillRect(patternX, patternY, 20, 20);
    }

    for (let i = 0; i < 8; i++) {
      ctx.fillStyle = 'rgba(0,0,0,0.1)';
      const accentX = 12 + (i % 4) * 28;
      const accentY = 12 + Math.floor(i / 4) * 28;
      ctx.fillRect(accentX, accentY, 12, 12);
    }

    for (let i = 0; i < 20; i++) {
      ctx.fillStyle = 'rgba(255,255,255,0.03)';
      const detailX = Math.random() * (width - 8);
      const detailY = Math.random() * (height - 8);
      ctx.fillRect(detailX, detailY, 4, 4);
    }

    for (let i = 0; i < 6; i++) {
      ctx.fillStyle = 'rgba(139, 69, 19, 0.15)';
      const cornerX = 20 + (i % 3) * 40;
      const cornerY = 20 + Math.floor(i / 3) * 40;
      ctx.beginPath();
      ctx.arc(cornerX, cornerY, 8, 0, Math.PI * 2);
      ctx.fill();
    }

    return canvas;
  }

  setupCanvas() {
    this.canvas.width = 800;
    this.canvas.height = 600;
  }

  setupControls() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.key] = true;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
      }
      if (e.key === ' ' || e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        this.handleVideoButtonInteraction();
        this.handleSeatInteraction();
      }
      if (e.key === 'o' || e.key === 'O') {
        e.preventDefault();
        this.triggerPeanutMouthOpen();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.key] = false;
    });
  }

  triggerPeanutNod() {
    if (this.localPlayer && this.localPlayer.color === 'peanut' && !this.peanutNodding) {
      this.peanutNodding = true;
      this.peanutNodFrame = 0;
      this.sendPeanutAnimation('nod');
    }
  }

  triggerPeanutShock() {
    if (this.localPlayer && this.localPlayer.color === 'peanut') {
      this.peanutShockMouth = true;
      this.peanutShockEndTime = Date.now() + 2000;
      this.sendPeanutAnimation('shock');
    }
  }

  triggerPeanutMouthOpen() {
    if (this.localPlayer && this.localPlayer.color === 'peanut') {
      this.peanutMouthOpen = true;
      this.peanutMouthOpenEndTime = Date.now() + 1000;
      this.sendPeanutAnimation('mouthOpen');
    }
  }

  sendPeanutAnimation(type) {
    if (window.ws && window.ws.readyState === WebSocket.OPEN) {
      window.ws.send(JSON.stringify({
        type: 'peanutAnimation',
        animation: type
      }));
    }
  }

  handlePeanutAnimation(userId, animationType) {
    const player = this.players.get(userId);
    if (player && player.color === 'peanut') {
      if (animationType === 'nod') {
        player.peanutNodding = true;
        player.peanutNodFrame = 0;
      } else if (animationType === 'shock') {
        player.peanutShockMouth = true;
        player.peanutShockEndTime = Date.now() + 2000;
      } else if (animationType === 'mouthOpen') {
        player.peanutMouthOpen = true;
        player.peanutMouthOpenEndTime = Date.now() + 1000;
      }
    }
  }

  handleVideoButtonInteraction() {
    if (this.currentRoom?.roomId !== 'cinema') return;

    const player = this.localPlayer;
    const button = this.videoButton;
    const distance = Math.sqrt(Math.pow(player.x - button.x, 2) + Math.pow(player.y - button.y, 2));

    if (distance < 50) {
      this.toggleVideoPlayback();
    }

    const resetButton = this.videoResetButton;
    const resetDistance = Math.sqrt(Math.pow(player.x - resetButton.x, 2) + Math.pow(player.y - resetButton.y, 2));

    if (resetDistance < 50) {
      this.resetVideo();
    }
  }

  handleSeatInteraction() {
    if (this.currentRoom?.roomId !== 'cinema') return;

    const player = this.localPlayer;

    if (this.sittingOnSeat !== null) {
      this.cinemaSeats[this.sittingOnSeat].occupied = false;
      this.sendSeatState(null);
      this.sittingOnSeat = null;
      return;
    }

    for (let i = 0; i < this.cinemaSeats.length; i++) {
      const seat = this.cinemaSeats[i];
      const distance = Math.sqrt(Math.pow(player.x - seat.x, 2) + Math.pow(player.y - seat.y, 2));

      if (distance < 50 && !seat.occupied) {
        this.sittingOnSeat = i;
        this.cinemaSeats[i].occupied = true;
        this.localPlayer.x = seat.x;
        this.localPlayer.y = seat.y - 10;
        this.localPlayer.direction = 'up';
        this.sendSeatState(i);
        break;
      }
    }
  }

  sendSeatState(seatIndex) {
    if (window.ws && window.ws.readyState === WebSocket.OPEN) {
      const message = {
        type: 'seatState',
        seatIndex: seatIndex
      };
      window.ws.send(JSON.stringify(message));
    }
  }

  handleRemoteSeatState(userId, seatIndex) {
    for (let i = 0; i < this.cinemaSeats.length; i++) {
      if (this.cinemaSeats[i].occupied && this.cinemaSeats[i].userId === userId) {
        this.cinemaSeats[i].occupied = false;
        this.cinemaSeats[i].userId = null;
      }
    }

    if (seatIndex !== null && this.cinemaSeats[seatIndex]) {
      this.cinemaSeats[seatIndex].occupied = true;
      this.cinemaSeats[seatIndex].userId = userId;
      
      const player = this.players.get(userId);
      if (player) {
        player.x = this.cinemaSeats[seatIndex].x;
        player.y = this.cinemaSeats[seatIndex].y - 10;
        player.targetX = player.x;
        player.targetY = player.y;
        player.sitting = true;
      }
    }
  }

  toggleVideoPlayback() {
    if (!this.videoElement) return;

    if (this.videoElement.paused) {
      this.videoElement.play();
      this.videoAudio.play().catch(err => console.error('Error playing audio:', err));
      this.videoScreen.playing = true;
      this.isVideoSource = true;
      this.startVideoStreaming();
      this.sendVideoState(true);
    } else {
      this.videoElement.pause();
      this.videoAudio.pause();
      this.videoScreen.playing = false;
      this.isVideoSource = false;
      this.stopVideoStreaming();
      this.sendVideoState(false);
    }
  }

  resetVideo() {
    if (!this.videoElement) return;

    this.videoElement.currentTime = 0;
    this.videoAudio.currentTime = 0;
    this.sendVideoReset();
  }

  handleVideoReset() {
    if (!this.videoElement) return;

    this.videoElement.currentTime = 0;
    this.videoAudio.currentTime = 0;
  }

  setVideoSource(isSource) {
    if (this.isVideoSource && !isSource) {
      this.stopVideoStreaming();
      this.hasReceivedVideoFrame = false;
      this.videoCtx.fillStyle = '#000';
      this.videoCtx.fillRect(0, 0, 760, 428);
    }
    if (!this.isVideoSource && isSource) {
      this.hasReceivedVideoFrame = false;
    }
    this.isVideoSource = isSource;
  }

  sendVideoState(playing) {
    if (window.ws && window.ws.readyState === WebSocket.OPEN) {
      window.ws.send(JSON.stringify({
        type: 'videoState',
        playing: playing,
        currentTime: this.videoElement ? this.videoElement.currentTime : 0
      }));
    }
  }

  sendVideoReset() {
    if (window.ws && window.ws.readyState === WebSocket.OPEN) {
      window.ws.send(JSON.stringify({
        type: 'videoReset'
      }));
    }
  }

  startVideoStreaming() {
    if (!this.videoElement || this.videoStreamingInterval) return;

    console.log('[VIDEO] Starting video streaming');
    this.videoStreamingInterval = setInterval(() => {
      if (this.videoScreen.playing && window.ws && window.ws.readyState === WebSocket.OPEN) {
        const dataUrl = this.videoCanvas.toDataURL('image/webp', 0.8);
        console.log('[VIDEO] Sending video frame, data length:', dataUrl.length);
        window.ws.send(JSON.stringify({
          type: 'videoFrame',
          data: dataUrl
        }));
      }
    }, 100);
  }

  stopVideoStreaming() {
    if (this.videoStreamingInterval) {
      clearInterval(this.videoStreamingInterval);
      this.videoStreamingInterval = null;
    }
  }

  receiveVideoFrame(data) {
    console.log('[VIDEO] receiveVideoFrame called, hasReceivedVideoFrame was:', this.hasReceivedVideoFrame);
    console.log('[VIDEO] Received data type:', typeof data, 'length:', data ? data.length : 0);
    console.log('[VIDEO] Data prefix:', data ? data.substring(0, 50) : 'null');
    this.hasReceivedVideoFrame = true;
    const img = new Image();
    img.onload = () => {
      console.log('[VIDEO] Image loaded, drawing to videoCanvas');
      this.videoCtx.drawImage(img, 0, 0, 760, 428);
    };
    img.onerror = (err) => {
      console.error('[VIDEO] Image load error:', err);
      console.error('[VIDEO] Image src:', img.src.substring(0, 100));
    };
    img.src = data;
  }

  triggerPeanutSound() {
    if (this.localPlayer && this.localPlayer.color === 'peanut' && !this.peanutSoundPlaying) {
      this.peanutSoundPlaying = true;
      this.peanutSound.currentTime = 0;
      this.peanutSound.play();
      this.peanutMouthToggleTime = Date.now();
      this.peanutSound.onended = () => {
        this.peanutSoundPlaying = false;
      };
      return true;
    }
    return false;
  }

  playPeanutSoundForPlayer(playerId) {
    console.log('playPeanutSoundForPlayer called for:', playerId);
    const player = this.players.get(playerId);
    console.log('Player found:', player);
    console.log('Player color:', player ? player.color : 'N/A');
    if (player && player.color === 'peanut') {
      console.log('Playing peanut sound for player:', playerId);
      player.peanutSoundPlaying = true;
      player.peanutSound = new Audio('/sounds/excellent-raid.mp3');
      player.peanutSound.currentTime = 0;
      player.peanutSound.play().catch(err => console.error('Error playing sound:', err));
      player.peanutMouthToggleTime = Date.now();
      player.peanutSound.onended = () => {
        player.peanutSoundPlaying = false;
      };
    } else {
      console.log('Not playing sound - player not found or not peanut color');
    }
  }

  setMap(map) {
    this.map = map;
    this.canvas.width = map.width;
    this.canvas.height = map.height;
  }

  setRooms(rooms) {
    this.rooms = rooms;
    console.log('Rooms received:', rooms.map(r => r.roomId));
    const hubRoom = rooms.find(r => r.roomId === 'hub');
    if (hubRoom) {
      this.currentRoom = hubRoom;
    } else {
      console.warn('Hub room not found, using first room');
      this.currentRoom = rooms[0];
    }
    console.log('Current room set to:', this.currentRoom.roomId);
  }

  setCurrentRoom(roomId) {
    const room = this.rooms.find(r => r.roomId === roomId);
    if (room) {
      this.currentRoom = room;
      console.log('Current room changed to:', roomId);
    }
  }

  setLocalPlayer(player) {
    this.localPlayer = player;
    this.localPlayer.room = this.currentRoom.roomId;
    console.log('Setting local player:', player);
    console.log('Current room at setLocalPlayer:', this.currentRoom.roomId);
    this.players.set(player.id, player);
  }

  updatePlayer(id, data) {
    const player = this.players.get(id);
    if (player) {
      player.targetX = data.x;
      player.targetY = data.y;
      player.room = data.room;
      player.lastUpdate = Date.now();
      if (data.color) player.color = data.color;
      if (data.username) player.username = data.username;
      if (data.sitting !== undefined) player.sitting = data.sitting;
      if (data.peanutNodding !== undefined) player.peanutNodding = data.peanutNodding;
      if (data.peanutShockMouth !== undefined) player.peanutShockMouth = data.peanutShockMouth;
    } else {
      console.log('Creating new player:', id, 'with color:', data.color, 'username:', data.username);
      this.players.set(id, {
        id,
        x: data.x,
        y: data.y,
        targetX: data.x,
        targetY: data.y,
        color: data.color || '#4ECDC4',
        username: data.username || 'Player',
        room: data.room,
        lastUpdate: Date.now(),
        peanutSoundPlaying: false,
        peanutMouthOpen: false,
        peanutMouthToggleTime: 0,
        peanutNodding: false,
        peanutShockMouth: false,
        sitting: data.sitting || false
      });
    }
  }

  updateVideoState(playing, currentTime, sourceId) {
    console.log('updateVideoState called:', playing, 'isVideoSource:', this.isVideoSource, 'currentTime:', currentTime, 'sourceId:', sourceId);
    this.videoScreen.playing = playing;
    this.videoScreen.currentTime = currentTime || 0;

    const amISource = sourceId === this.localPlayer?.id;

    if (amISource) {
      this.setVideoSource(true);
      if (this.videoElement) {
        if (playing) {
          console.log('Playing video (source)');
          this.videoElement.play().catch(err => console.error('Error playing video:', err));
        } else {
          console.log('Pausing video (source)');
          this.videoElement.pause();
        }
      }
    } else {
      this.setVideoSource(false);
      if (this.videoAudio) {
        this.videoAudio.currentTime = currentTime || 0;
        if (playing) {
          console.log('Playing audio (viewer)');
          this.videoAudio.play().catch(err => console.error('Error playing audio:', err));
        } else {
          console.log('Pausing audio (viewer)');
          this.videoAudio.pause();
        }
      }
    }
  }

  updateVideoCanvas() {
    if (this.isVideoSource && this.videoScreen.playing && this.videoElement && this.videoElement.readyState >= 2) {
      this.videoCtx.drawImage(this.videoElement, 0, 0, 760, 428);
    }
  }

  removePlayer(id) {
    this.players.delete(id);
  }

  initializePlayers(users) {
    users.forEach(user => {
      if (user.id !== this.localPlayer?.id) {
        this.players.set(user.id, {
          id: user.id,
          x: 400,
          y: 300,
          targetX: 400,
          targetY: 300,
          color: user.color,
          username: user.username,
          room: this.currentRoom?.roomId || 'hub',
          lastUpdate: Date.now(),
          peanutSoundPlaying: false,
          peanutMouthOpen: false,
          peanutMouthToggleTime: 0
        });
      }
    });
  }

  update() {
    if (!this.localPlayer || this.transitioning) return;

    if (this.sittingOnSeat !== null) {
      return null;
    }

    const speed = 3;
    let dx = 0;
    let dy = 0;

    if (this.keys['ArrowUp']) dy -= speed;
    if (this.keys['ArrowDown']) dy += speed;
    if (this.keys['ArrowLeft']) dx -= speed;
    if (this.keys['ArrowRight']) dx += speed;

    if (dx !== 0 && dy !== 0) {
      dx *= 0.707;
      dy *= 0.707;
    }

    const isMoving = dx !== 0 || dy !== 0;

    if (isMoving) {
      if (dy < 0 && dx < 0) {
        this.localPlayer.direction = 'left';
      } else if (dy < 0 && dx > 0) {
        this.localPlayer.direction = 'right';
      } else if (dy > 0 && dx < 0) {
        this.localPlayer.direction = 'left';
      } else if (dy > 0 && dx > 0) {
        this.localPlayer.direction = 'right';
      } else if (dy < 0) {
        this.localPlayer.direction = 'up';
      } else if (dy > 0) {
        this.localPlayer.direction = 'down';
      } else if (dx < 0) {
        this.localPlayer.direction = 'left';
      } else {
        this.localPlayer.direction = 'right';
      }
      this.localPlayer.isMoving = true;
      this.animationFrame = Math.floor(Date.now() / (1000 / this.animationSpeed)) % 3;
    } else {
      this.localPlayer.isMoving = false;
      this.animationFrame = 0;
    }

    const newX = this.localPlayer.x + dx;
    const newY = this.localPlayer.y + dy;

    if (this.isValidPosition(newX, newY)) {
      this.localPlayer.x = newX;
      this.localPlayer.y = newY;
      this.checkRoomTransition();
    }



    if (this.peanutShockMouth && Date.now() >= this.peanutShockEndTime) {
      this.peanutShockMouth = false;
    }

    if (this.peanutMouthOpenEndTime > 0 && Date.now() >= this.peanutMouthOpenEndTime) {
      this.peanutMouthOpen = false;
      this.peanutMouthOpenEndTime = 0;
    }

    if (this.peanutSoundPlaying) {
      if (Date.now() - this.peanutMouthToggleTime > 150) {
        this.peanutMouthOpen = !this.peanutMouthOpen;
        this.peanutMouthToggleTime = Date.now();
      }
    }

    const now = Date.now();
    if (now - this.lastPositionUpdate > this.positionUpdateInterval) {
      this.lastPositionUpdate = now;
      if (this.sittingOnSeat !== null) {
        const seat = this.cinemaSeats[this.sittingOnSeat];
        const update = { x: seat.x, y: seat.y - 10, timestamp: now, room: this.currentRoom.roomId, sitting: true };
        return update;
      }
      const update = { x: this.localPlayer.x, y: this.localPlayer.y, timestamp: now, room: this.currentRoom.roomId, sitting: false };
      return update;
    }

    return null;
  }

  isValidPosition(x, y) {
    if (!this.map) return true;

    const playerSize = 16;
    const margin = 20;

    if (x < margin || x > this.map.width - margin) return false;
    if (y < margin || y > this.map.height - margin) return false;

    return true;
  }

  checkRoomTransition() {
    if (!this.currentRoom || !this.currentRoom.doorways) return;

    const player = this.localPlayer;
    const playerSize = 16;

    for (const doorway of this.currentRoom.doorways) {
      let inDoorway = false;

      if (doorway.direction === 'top') {
        inDoorway = player.y < 30 && player.x >= doorway.x - doorway.width / 2 && player.x <= doorway.x + doorway.width / 2;
      } else if (doorway.direction === 'bottom') {
        inDoorway = player.y > this.map.height - 30 && player.x >= doorway.x - doorway.width / 2 && player.x <= doorway.x + doorway.width / 2;
      } else if (doorway.direction === 'left') {
        inDoorway = player.x < 30 && player.y >= doorway.y - doorway.width / 2 && player.y <= doorway.y + doorway.width / 2;
      } else if (doorway.direction === 'right') {
        inDoorway = player.x > this.map.width - 30 && player.y >= doorway.y - doorway.width / 2 && player.y <= doorway.y + doorway.width / 2;
      }

      if (inDoorway) {
        this.transitionToRoom(doorway.targetRoom);
        break;
      }
    }
  }

  transitionToRoom(roomId) {
    const targetRoom = this.rooms.find(r => r.roomId === roomId);
    if (!targetRoom) return;

    const previousRoom = this.currentRoom;
    this.transitioning = true;
    this.currentRoom = targetRoom;
    this.sittingOnSeat = null;

    let spawnX, spawnY;

    if (roomId === 'hub') {
      const hubDoorway = this.findHubDoorwayFromRoom(previousRoom.roomId);
      console.log('Transitioning to hub from', previousRoom.roomId, 'doorway:', hubDoorway);
      if (hubDoorway) {
        spawnX = hubDoorway.x || 400;
        spawnY = hubDoorway.y || 300;

        if (hubDoorway.direction === 'top') {
          spawnY = 80;
        } else if (hubDoorway.direction === 'bottom') {
          spawnY = this.map.height - 80;
        } else if (hubDoorway.direction === 'left') {
          spawnX = 80;
        } else if (hubDoorway.direction === 'right') {
          spawnX = this.map.width - 80;
        }
      } else {
        spawnX = targetRoom.spawnPoint.x;
        spawnY = targetRoom.spawnPoint.y;
      }
    } else {
      const doorway = this.findDoorwayToRoom(roomId);
      console.log('Transitioning to', roomId, 'doorway:', doorway);
      if (doorway) {
        spawnX = doorway.x || 400;
        spawnY = doorway.y || 300;

        if (doorway.direction === 'top') {
          spawnY = 80;
        } else if (doorway.direction === 'bottom') {
          spawnY = this.map.height - 80;
        } else if (doorway.direction === 'left') {
          spawnX = 80;
        } else if (doorway.direction === 'right') {
          spawnX = this.map.width - 80;
        }
      } else {
        spawnX = targetRoom.spawnPoint.x;
        spawnY = targetRoom.spawnPoint.y;
      }
    }

    console.log('Spawning at:', spawnX, spawnY);
    this.localPlayer.x = spawnX;
    this.localPlayer.y = spawnY;
    this.localPlayer.room = roomId;

    setTimeout(() => {
      this.transitioning = false;
    }, 200);
  }

  findDoorwayToRoom(targetRoomId) {
    if (!this.currentRoom.doorways) return null;

    return this.currentRoom.doorways.find(d => d.targetRoom === targetRoomId);
  }

  findHubDoorwayFromRoom(fromRoomId) {
    const hub = this.rooms.find(r => r.roomId === 'hub');
    if (!hub || !hub.doorways) return null;

    console.log('Finding hub doorway from', fromRoomId, 'hub doorways:', hub.doorways);
    return hub.doorways.find(d => d.targetRoom === fromRoomId);
  }

  getRoomAtPosition(x, y) {
    for (const room of this.rooms) {
      if (x >= room.bounds.x && x <= room.bounds.x + room.bounds.width &&
          y >= room.bounds.y && y <= room.bounds.y + room.bounds.height) {
        return room;
      }
    }
    return null;
  }

  interpolate() {
    const now = Date.now();
    this.players.forEach((player, id) => {
      if (id === this.localPlayer?.id) return;
      
      if (player.targetX !== undefined && player.targetY !== undefined) {
        const lerpFactor = 0.3;
        player.x += (player.targetX - player.x) * lerpFactor;
        player.y += (player.targetY - player.y) * lerpFactor;
      }

      if (player.peanutSoundPlaying) {
        if (Date.now() - player.peanutMouthToggleTime > 150) {
          player.peanutMouthOpen = !player.peanutMouthOpen;
          player.peanutMouthToggleTime = Date.now();
        }
      } else if (player.peanutMouthOpenEndTime > 0 && Date.now() >= player.peanutMouthOpenEndTime) {
        player.peanutMouthOpen = false;
        player.peanutMouthOpenEndTime = 0;
      }

      if (player.peanutShockMouth && Date.now() >= player.peanutShockEndTime) {
        player.peanutShockMouth = false;
      }

      if (player.peanutNodding) {
        player.peanutNodFrame = (player.peanutNodFrame || 0) + 1;
        if (player.peanutNodFrame >= this.peanutNodMaxFrames) {
          player.peanutNodding = false;
          player.peanutNodFrame = 0;
        }
      }
    });

    if (this.peanutNodding) {
      this.peanutNodFrame++;
      if (this.peanutNodFrame >= this.peanutNodMaxFrames) {
        this.peanutNodding = false;
        this.peanutNodFrame = 0;
      }
    }
  }

  render() {
    this.ctx.fillStyle = '#0f0f23';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.updateVideoCanvas();
    this.renderCurrentRoom();
    this.renderFurniture();
    this.renderPlayers();
  }

  renderCurrentRoom() {
    if (!this.currentRoom) return;

    this.renderFloor();
    this.renderWalls();
    this.renderDoorways();
    if (this.currentRoom.roomId !== 'games') {
      this.renderRoomLabel();
    }
  }

  renderFloor() {
    this.ctx.fillStyle = '#1a1a1a';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    if (this.currentRoom.roomId === 'games') {
      this.ctx.fillStyle = '#2a2a2a';
      this.ctx.fillRect(20, 20, this.map.width - 40, this.map.height - 40);
    } else if (this.currentRoom.roomId === 'lounge') {
      this.ctx.fillStyle = this.textures.carpet;
      this.ctx.fillRect(20, 20, this.map.width - 40, this.map.height - 40);
    } else if (this.currentRoom.roomId === 'dev') {
      this.ctx.fillStyle = this.textures.devFloor;
      this.ctx.fillRect(20, 20, this.map.width - 40, this.map.height - 40);
    } else {
      this.renderWoodFloorboards(20, 20, this.map.width - 40, this.map.height - 40);
    }
  }

  renderWoodFloorboards(x, y, width, height) {
    const boardHeight = 16;
    const boardWidth = 80;
    let currentY = y;
    let rowIndex = 0;

    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.rect(x, y, width, height);
    this.ctx.clip();

    while (currentY < y + height) {
      const offsetX = (rowIndex % 2 === 1) ? -boardWidth / 2 : 0;
      let currentX = x + offsetX;

      while (currentX < x + width + boardWidth) {
        this.ctx.drawImage(this.textures.floorboard, currentX, currentY);
        currentX += boardWidth;
      }
      currentY += boardHeight;
      rowIndex++;
    }

    this.ctx.restore();
  }

  renderWalls() {
    const wallThickness = 12;
    const wallHeight = 24;
    const wallTexture = this.textures.woodWall;

    this.drawWall(20, 20, this.map.width - 40, wallThickness, wallHeight, wallTexture);
    this.drawWall(20, this.map.height - 20 - wallThickness, this.map.width - 40, wallThickness, wallHeight, wallTexture);
    this.drawWall(20, 20, wallThickness, this.map.height - 40, wallHeight, wallTexture);
    this.drawWall(this.map.width - 20 - wallThickness, 20, wallThickness, this.map.height - 40, wallHeight, wallTexture);
  }

  drawWall(x, y, width, height, wallHeight, texture) {
    this.ctx.save();

    this.ctx.fillStyle = texture;
    this.ctx.fillRect(x, y, width, height);

    this.ctx.fillStyle = 'rgba(0,0,0,0.4)';
    this.ctx.fillRect(x, y - wallHeight, width, wallHeight);

    this.ctx.fillStyle = 'rgba(255,255,255,0.1)';
    this.ctx.fillRect(x, y - wallHeight, width, 3);

    this.ctx.fillStyle = 'rgba(0,0,0,0.6)';
    this.ctx.fillRect(x, y + height - 2, width, 2);

    this.ctx.restore();
  }

  renderDoorways() {
    if (!this.currentRoom.doorways) return;

    const wallThickness = 12;

    this.currentRoom.doorways.forEach(doorway => {
      this.ctx.fillStyle = '#2a2a2a';

      if (doorway.direction === 'top') {
        this.ctx.fillRect(doorway.x - doorway.width / 2, 20, doorway.width, wallThickness);
      } else if (doorway.direction === 'bottom') {
        this.ctx.fillRect(doorway.x - doorway.width / 2, this.map.height - 20 - wallThickness, doorway.width, wallThickness);
      } else if (doorway.direction === 'left') {
        this.ctx.fillRect(20, doorway.y - doorway.width / 2, wallThickness, doorway.width);
      } else if (doorway.direction === 'right') {
        this.ctx.fillRect(this.map.width - 20 - wallThickness, doorway.y - doorway.width / 2, wallThickness, doorway.width);
      }
    });
  }

  renderRoomLabel() {
    const color = this.currentRoom.color || '#4ECDC4';
    this.ctx.fillStyle = color;
    this.ctx.font = 'bold 24px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.strokeStyle = '#000';
    this.ctx.lineWidth = 4;
    this.ctx.strokeText(this.currentRoom.name.toUpperCase(), this.map.width / 2, 50);
    this.ctx.fillText(this.currentRoom.name.toUpperCase(), this.map.width / 2, 50);
  }

  renderFurniture() {
    if (!this.currentRoom) return;

    if (this.currentRoom.roomId === 'hub') {
      this.renderHubFurniture();
    } else if (this.currentRoom.roomId === 'lounge') {
      this.renderLoungeFurniture();
    } else if (this.currentRoom.roomId === 'dev') {
      this.renderDevFurniture();
    } else if (this.currentRoom.roomId === 'games') {
      this.renderGamesFurniture();
    } else if (this.currentRoom.roomId === 'music') {
      this.renderMusicFurniture();
    } else if (this.currentRoom.roomId === 'cinema') {
      this.renderCinemaFurniture();
    }
  }

  renderHubFurniture() {
    this.renderWelcomeSign(400, 100);
    this.renderInfoBoard(400, 200);
    this.renderSeatingArea(200, 350);
    this.renderSeatingArea(600, 350);
    this.renderPlant(100, 100, 2);
    this.renderPlant(700, 100, 2);
    this.renderFloorLamp(150, 450);
    this.renderFloorLamp(650, 450);
  }

  renderWelcomeSign(x, y) {
    this.ctx.fillStyle = '#4E342E';
    this.ctx.fillRect(x - 80, y, 160, 40);
    this.ctx.fillStyle = '#5D4037';
    this.ctx.fillRect(x - 78, y + 2, 156, 36);
    this.ctx.fillStyle = '#FFD700';
    this.ctx.font = 'bold 18px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('WELCOME!', x, y + 25);
  }

  renderInfoBoard(x, y) {
    this.ctx.fillStyle = '#8B4513';
    this.ctx.fillRect(x - 30, y, 60, 80);
    this.ctx.fillStyle = '#F5F5DC';
    this.ctx.fillRect(x - 28, y + 2, 56, 76);
    this.ctx.fillStyle = '#000';
    this.ctx.font = '10px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('ROOMS:', x, y + 15);
    this.ctx.fillText('Lounge', x, y + 30);
    this.ctx.fillText('Dev', x, y + 45);
    this.ctx.fillText('Games', x, y + 60);
    this.ctx.fillText('Music', x, y + 75);
  }

  renderSeatingArea(x, y) {
    this.ctx.fillStyle = '#5D4037';
    this.ctx.fillRect(x - 40, y, 80, 25);
    this.ctx.fillStyle = '#4E342E';
    this.ctx.fillRect(x - 38, y + 2, 76, 21);
    this.ctx.fillStyle = '#8B4513';
    this.ctx.fillRect(x - 35, y + 5, 70, 15);
    this.ctx.fillStyle = '#3E2723';
    this.ctx.fillRect(x - 35, y + 25, 10, 5);
    this.ctx.fillRect(x + 25, y + 25, 10, 5);
  }

  renderFloorLamp(x, y) {
    this.ctx.fillStyle = '#5D4037';
    this.ctx.fillRect(x - 3, y, 6, 40);
    this.ctx.fillStyle = '#4E342E';
    this.ctx.fillRect(x - 4, y + 36, 8, 6);
    this.ctx.fillStyle = '#FFD700';
    this.ctx.beginPath();
    this.ctx.moveTo(x - 15, y);
    this.ctx.lineTo(x + 15, y);
    this.ctx.lineTo(x + 8, y - 20);
    this.ctx.lineTo(x - 8, y - 20);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.fillStyle = '#FFA500';
    this.ctx.beginPath();
    this.ctx.moveTo(x - 12, y);
    this.ctx.lineTo(x + 12, y);
    this.ctx.lineTo(x + 6, y - 16);
    this.ctx.lineTo(x - 6, y - 16);
    this.ctx.closePath();
    this.ctx.fill();
  }

  renderWaterCooler(x, y) {
    this.ctx.fillStyle = '#E0E0E0';
    this.ctx.fillRect(x - 15, y, 30, 40);
    this.ctx.fillStyle = '#C0C0C0';
    this.ctx.fillRect(x - 13, y + 2, 26, 36);
    this.ctx.fillStyle = '#87CEEB';
    this.ctx.beginPath();
    this.ctx.arc(x, y + 10, 10, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.fillStyle = '#ADD8E6';
    this.ctx.beginPath();
    this.ctx.arc(x, y + 10, 7, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.fillStyle = '#1a1a1a';
    this.ctx.fillRect(x - 5, y + 25, 10, 12);
  }

  renderLoungeFurniture() {
    this.renderSofa(80, 120, 1.5);
    this.renderSofa(550, 120, 1.5);
    this.renderTable(320, 220, 1.3);
    this.renderFireplace(380, 50);
    this.renderRug(350, 350, 120, 80);
    this.renderLamp(150, 400);
    this.renderLamp(550, 400);
    this.renderBookshelf(50, 200);
    this.renderBookshelf(700, 200);
    this.renderCoffeeTable(350, 320);
    this.renderPlant(100, 100);
    this.renderPlant(700, 100);
  }

  renderDevFurniture() {
    this.renderDesk(80, 150, 1.4);
    this.renderDesk(80, 280, 1.4);
    this.renderDesk(350, 150, 1.4);
    this.renderDesk(350, 280, 1.4);
    this.renderDesk(600, 150, 1.4);
    this.renderDesk(600, 280, 1.4);
    this.renderOfficeChair(110, 180);
    this.renderOfficeChair(110, 310);
    this.renderOfficeChair(380, 180);
    this.renderOfficeChair(380, 310);
    this.renderOfficeChair(630, 180);
    this.renderOfficeChair(630, 310);
    this.renderBigScreen(400, 30);
    this.renderServerRack(50, 400);
    this.renderServerRack(700, 400);
    this.renderWhiteboard(200, 80);
    this.renderWhiteboard(600, 80);
    this.renderCoffeeMachine(400, 450);
  }

  renderGamesFurniture() {
    this.renderArcadeMachine(60, 120, 1.3);
    this.renderArcadeMachine(160, 120, 1.3);
    this.renderArcadeMachine(260, 120, 1.3);
    this.renderPoolTable(350, 380, 1.2);
    this.renderPS5Setup(550, 150);
    this.renderNeonSign(400, 40);
    this.renderNeonPoster(50, 80);
  }

  renderCinemaFurniture() {
    this.renderCinemaScreen(400, 80);
    this.renderCinemaSeats();
    this.renderVideoButton(this.videoButton.x, this.videoButton.y);
    this.renderVideoResetButton(this.videoResetButton.x, this.videoResetButton.y);
  }

  renderMusicFurniture() {
    this.renderStage(400, 80);
    this.renderBigSpeaker(150, 100, 1.5);
    this.renderBigSpeaker(650, 100, 1.5);
    this.renderPiano(80, 120, 1.3);
    this.renderGuitar(250, 150);
    this.renderGuitar(550, 150);
    this.renderDrumKit(400, 150);
    this.renderMicrophoneStand(300, 130);
    this.renderMicrophoneStand(500, 130);
    this.renderAmp(200, 400);
    this.renderAmp(600, 400);
    this.renderVinylPlayer(400, 450);
    this.renderMusicNotes(400, 50);
    this.renderSpotlight(200, 40);
    this.renderSpotlight(600, 40);
  }

  renderSofa(x, y, scale = 1) {
    const w = Math.floor(50 * scale);
    const h = Math.floor(25 * scale);
    this.ctx.fillStyle = '#8B4513';
    this.ctx.fillRect(x, y, w, h);
    this.ctx.fillStyle = '#A0522D';
    this.ctx.fillRect(x, y, w, Math.floor(8 * scale));
    this.ctx.fillStyle = '#CD853F';
    this.ctx.fillRect(x + Math.floor(2 * scale), y + Math.floor(2 * scale), w - Math.floor(4 * scale), Math.floor(4 * scale));
    this.ctx.fillStyle = '#654321';
    this.ctx.fillRect(x, y + h, Math.floor(10 * scale), Math.floor(5 * scale));
    this.ctx.fillRect(x + w - Math.floor(10 * scale), y + h, Math.floor(10 * scale), Math.floor(5 * scale));
    this.ctx.fillStyle = '#5D4037';
    this.ctx.fillRect(x + Math.floor(2 * scale), y + h + 1, Math.floor(6 * scale), Math.floor(3 * scale));
    this.ctx.fillRect(x + w - Math.floor(8 * scale), y + h + 1, Math.floor(6 * scale), Math.floor(3 * scale));
    this.ctx.fillStyle = '#A0522D';
    this.ctx.fillRect(x + Math.floor(5 * scale), y + Math.floor(10 * scale), w - Math.floor(10 * scale), Math.floor(12 * scale));
    this.ctx.fillStyle = '#CD853F';
    this.ctx.fillRect(x + Math.floor(7 * scale), y + Math.floor(12 * scale), w - Math.floor(14 * scale), Math.floor(8 * scale));
    this.ctx.fillStyle = '#8B4513';
    this.ctx.fillRect(x + Math.floor(10 * scale), y + Math.floor(14 * scale), w - Math.floor(20 * scale), Math.floor(4 * scale));
  }

  renderTable(x, y, scale = 1) {
    const w = Math.floor(40 * scale);
    const h = Math.floor(30 * scale);
    this.ctx.fillStyle = '#5D4037';
    this.ctx.fillRect(x, y, w, h);
    this.ctx.fillStyle = '#4E342E';
    this.ctx.fillRect(x, y, w, Math.floor(5 * scale));
    this.ctx.fillStyle = '#8B4513';
    this.ctx.fillRect(x + Math.floor(2 * scale), y + Math.floor(2 * scale), w - Math.floor(4 * scale), Math.floor(3 * scale));
    this.ctx.fillStyle = '#A0522D';
    this.ctx.fillRect(x + Math.floor(5 * scale), y + Math.floor(8 * scale), w - Math.floor(10 * scale), Math.floor(18 * scale));
    this.ctx.fillStyle = '#CD853F';
    this.ctx.fillRect(x + Math.floor(8 * scale), y + Math.floor(11 * scale), w - Math.floor(16 * scale), Math.floor(12 * scale));
    this.ctx.fillStyle = '#3E2723';
    this.ctx.fillRect(x + Math.floor(3 * scale), y + h - 3, Math.floor(8 * scale), 3);
    this.ctx.fillRect(x + w - Math.floor(11 * scale), y + h - 3, Math.floor(8 * scale), 3);
    this.ctx.fillStyle = '#654321';
    this.ctx.fillRect(x + Math.floor(5 * scale), y + h - 2, Math.floor(4 * scale), 2);
    this.ctx.fillRect(x + w - Math.floor(9 * scale), y + h - 2, Math.floor(4 * scale), 2);
  }

  renderDesk(x, y, scale = 1) {
    const w = Math.floor(40 * scale);
    const h = Math.floor(25 * scale);
    this.ctx.fillStyle = '#696969';
    this.ctx.fillRect(x, y, w, h);
    this.ctx.fillStyle = '#808080';
    this.ctx.fillRect(x, y, w, Math.floor(5 * scale));
    this.ctx.fillStyle = '#A9A9A9';
    this.ctx.fillRect(x + Math.floor(2 * scale), y + Math.floor(2 * scale), w - Math.floor(4 * scale), Math.floor(3 * scale));
    this.ctx.fillStyle = '#505050';
    this.ctx.fillRect(x, y + h - 3, w, 3);
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(x + Math.floor(5 * scale), y + Math.floor(8 * scale), w - Math.floor(10 * scale), Math.floor(15 * scale));
    this.ctx.fillStyle = '#1a1a1a';
    this.ctx.fillRect(x + Math.floor(6 * scale), y + Math.floor(9 * scale), w - Math.floor(12 * scale), Math.floor(13 * scale));
    this.ctx.fillStyle = '#333';
    this.ctx.fillRect(x + Math.floor(8 * scale), y + Math.floor(11 * scale), w - Math.floor(16 * scale), Math.floor(9 * scale));
    this.ctx.fillStyle = '#00FF00';
    this.ctx.fillRect(x + Math.floor(10 * scale), y + Math.floor(13 * scale), Math.floor(4 * scale), 2);
    this.ctx.fillRect(x + Math.floor(16 * scale), y + Math.floor(13 * scale), Math.floor(4 * scale), 2);
    this.ctx.fillRect(x + Math.floor(22 * scale), y + Math.floor(13 * scale), Math.floor(4 * scale), 2);
    this.ctx.fillStyle = '#404040';
    this.ctx.fillRect(x + Math.floor(3 * scale), y + h, Math.floor(8 * scale), 3);
    this.ctx.fillRect(x + w - Math.floor(11 * scale), y + h, Math.floor(8 * scale), 3);
  }

  renderArcadeMachine(x, y, scale = 1) {
    const width = Math.floor(30 * scale);
    const height = Math.floor(40 * scale);
    const tiltOffset = Math.floor(4 * scale);
    const sideDepth = Math.floor(6 * scale);
    const legWidth = Math.floor(4 * scale);
    const legHeight = Math.floor(8 * scale);

    this.ctx.fillStyle = 'rgba(0,0,0,0.3)';
    this.ctx.beginPath();
    this.ctx.moveTo(x + 2, y + 2);
    this.ctx.lineTo(x + width - tiltOffset + 2, y + 2);
    this.ctx.lineTo(x + width + 2, y + height + 8);
    this.ctx.lineTo(x + 2, y + height + 8);
    this.ctx.closePath();
    this.ctx.fill();

    this.ctx.fillStyle = '#1a1a1a';
    this.ctx.fillRect(x + 4, y + height + 2, legWidth, legHeight);
    this.ctx.fillRect(x + width - legWidth - 4, y + height + 2, legWidth, legHeight);

    this.ctx.fillStyle = '#2a2a2a';
    this.ctx.fillRect(x + 5, y + height + 3, legWidth - 2, legHeight - 2);
    this.ctx.fillRect(x + width - legWidth - 3, y + height + 3, legWidth - 2, legHeight - 2);

    this.ctx.fillStyle = '#660000';
    this.ctx.beginPath();
    this.ctx.moveTo(x, y);
    this.ctx.lineTo(x - sideDepth, y + 4);
    this.ctx.lineTo(x - sideDepth, y + height - 4);
    this.ctx.lineTo(x, y + height);
    this.ctx.closePath();
    this.ctx.fill();

    this.ctx.fillStyle = '#8B0000';
    this.ctx.beginPath();
    this.ctx.moveTo(x, y);
    this.ctx.lineTo(x + width - tiltOffset, y);
    this.ctx.lineTo(x + width, y + height);
    this.ctx.lineTo(x, y + height);
    this.ctx.closePath();
    this.ctx.fill();

    this.ctx.fillStyle = '#FF0000';
    this.ctx.beginPath();
    this.ctx.moveTo(x, y);
    this.ctx.lineTo(x + width - tiltOffset, y);
    this.ctx.lineTo(x + width, y + height - 2);
    this.ctx.lineTo(x, y + height - 2);
    this.ctx.closePath();
    this.ctx.fill();

    this.ctx.fillStyle = '#CC0000';
    this.ctx.beginPath();
    this.ctx.moveTo(x + 2, y + 2);
    this.ctx.lineTo(x + width - tiltOffset - 2, y + 2);
    this.ctx.lineTo(x + width - 2, y + height - 4);
    this.ctx.lineTo(x + 2, y + height - 4);
    this.ctx.closePath();
    this.ctx.fill();

    this.ctx.fillStyle = '#FF4444';
    this.ctx.beginPath();
    this.ctx.moveTo(x + 4, y + 4);
    this.ctx.lineTo(x + width - tiltOffset - 4, y + 4);
    this.ctx.lineTo(x + width - 4, y + height - 6);
    this.ctx.lineTo(x + 4, y + height - 6);
    this.ctx.closePath();
    this.ctx.fill();

    this.ctx.fillStyle = '#000';
    this.ctx.beginPath();
    this.ctx.moveTo(x + 3, y + 3);
    this.ctx.lineTo(x + width - tiltOffset - 3, y + 3);
    this.ctx.lineTo(x + width - 3, y + 23);
    this.ctx.lineTo(x + 3, y + 23);
    this.ctx.closePath();
    this.ctx.fill();

    this.ctx.fillStyle = '#1a1a1a';
    this.ctx.beginPath();
    this.ctx.moveTo(x + 4, y + 4);
    this.ctx.lineTo(x + width - tiltOffset - 4, y + 4);
    this.ctx.lineTo(x + width - 4, y + 21);
    this.ctx.lineTo(x + 4, y + 21);
    this.ctx.closePath();
    this.ctx.fill();

    this.ctx.fillStyle = '#00FF00';
    this.ctx.beginPath();
    this.ctx.moveTo(x + 8, y + 8);
    this.ctx.lineTo(x + width - tiltOffset - 8, y + 8);
    this.ctx.lineTo(x + width - 8, y + 18);
    this.ctx.lineTo(x + 8, y + 18);
    this.ctx.closePath();
    this.ctx.fill();

    this.ctx.fillStyle = '#00CC00';
    this.ctx.beginPath();
    this.ctx.moveTo(x + 9, y + 9);
    this.ctx.lineTo(x + width - tiltOffset - 9, y + 9);
    this.ctx.lineTo(x + width - 9, y + 17);
    this.ctx.lineTo(x + 9, y + 17);
    this.ctx.closePath();
    this.ctx.fill();

    this.ctx.fillStyle = '#FFFF00';
    this.ctx.fillRect(x + 10, y + 10, 3, 3);
    this.ctx.fillRect(x + 17, y + 10, 3, 3);
    this.ctx.fillRect(x + 10, y + 14, 3, 3);
    this.ctx.fillRect(x + 17, y + 14, 3, 3);

    this.ctx.fillStyle = '#FF0000';
    this.ctx.beginPath();
    this.ctx.moveTo(x + 5, y + 26);
    this.ctx.lineTo(x + width - 5, y + 26);
    this.ctx.lineTo(x + width - 5, y + 29);
    this.ctx.lineTo(x + 5, y + 29);
    this.ctx.closePath();
    this.ctx.fill();

    this.ctx.fillStyle = '#FF4444';
    this.ctx.beginPath();
    this.ctx.moveTo(x + 6, y + 27);
    this.ctx.lineTo(x + width - 6, y + 27);
    this.ctx.lineTo(x + width - 6, y + 28);
    this.ctx.lineTo(x + 6, y + 28);
    this.ctx.closePath();
    this.ctx.fill();

    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(x + 8, y + 32, 4, 4);
    this.ctx.fillRect(x + 18, y + 32, 4, 4);

    this.ctx.fillStyle = '#333';
    this.ctx.fillRect(x + 9, y + 33, 2, 2);
    this.ctx.fillRect(x + 19, y + 33, 2, 2);

    this.ctx.fillStyle = 'rgba(255,255,255,0.2)';
    this.ctx.beginPath();
    this.ctx.moveTo(x, y);
    this.ctx.lineTo(x + width - tiltOffset, y);
    this.ctx.lineTo(x + width - tiltOffset, y + 2);
    this.ctx.lineTo(x, y + 2);
    this.ctx.closePath();
    this.ctx.fill();

    this.ctx.fillStyle = 'rgba(0,0,0,0.3)';
    this.ctx.beginPath();
    this.ctx.moveTo(x + width - tiltOffset - 2, y);
    this.ctx.lineTo(x + width - tiltOffset, y);
    this.ctx.lineTo(x + width, y + height);
    this.ctx.lineTo(x + width - 2, y + height);
    this.ctx.closePath();
    this.ctx.fill();

    this.ctx.beginPath();
    this.ctx.moveTo(x, y + height - 2);
    this.ctx.lineTo(x + width, y + height - 2);
    this.ctx.lineTo(x + width, y + height);
    this.ctx.lineTo(x, y + height);
    this.ctx.closePath();
    this.ctx.fill();

    this.ctx.fillStyle = 'rgba(0,0,0,0.2)';
    this.ctx.beginPath();
    this.ctx.moveTo(x - sideDepth, y + 4);
    this.ctx.lineTo(x, y);
    this.ctx.lineTo(x, y + 2);
    this.ctx.lineTo(x - sideDepth, y + 6);
    this.ctx.closePath();
    this.ctx.fill();
  }

  renderPoolTable(x, y, scale = 1) {
    const tableWidth = Math.floor(80 * scale);
    const tableHeight = Math.floor(40 * scale);
    const sideDepth = Math.floor(8 * scale);
    const legWidth = Math.floor(6 * scale);
    const legHeight = Math.floor(12 * scale);
    const tiltOffset = Math.floor(8 * scale);

    this.ctx.fillStyle = 'rgba(0,0,0,0.3)';
    this.ctx.beginPath();
    this.ctx.moveTo(x - 5, y - 5);
    this.ctx.lineTo(x + tableWidth - tiltOffset + 5, y - 5);
    this.ctx.lineTo(x + tableWidth + 5, y + tableHeight + 10);
    this.ctx.lineTo(x - 5, y + tableHeight + 10);
    this.ctx.closePath();
    this.ctx.fill();

    this.ctx.fillStyle = '#2D1B15';
    this.ctx.fillRect(x - 3, y + tableHeight - 2, legWidth, legHeight);
    this.ctx.fillRect(x + tableWidth - tiltOffset - 3, y + tableHeight - 2, legWidth, legHeight);

    this.ctx.fillStyle = '#3E2723';
    this.ctx.fillRect(x - 2, y + tableHeight - 1, legWidth - 2, legHeight - 2);
    this.ctx.fillRect(x + tableWidth - tiltOffset - 2, y + tableHeight - 1, legWidth - 2, legHeight - 2);

    this.ctx.fillStyle = '#4E342E';
    this.ctx.fillRect(x - 1, y + tableHeight, legWidth - 4, legHeight - 4);
    this.ctx.fillRect(x + tableWidth - tiltOffset - 1, y + tableHeight, legWidth - 4, legHeight - 4);

    this.ctx.fillStyle = '#2D1B15';
    this.ctx.beginPath();
    this.ctx.moveTo(x - sideDepth - 5, y - 5);
    this.ctx.lineTo(x - 5, y - 5);
    this.ctx.lineTo(x - 5, y + tableHeight + 5);
    this.ctx.lineTo(x - sideDepth - 5, y + tableHeight + 5);
    this.ctx.closePath();
    this.ctx.fill();

    this.ctx.fillStyle = '#3E2723';
    this.ctx.beginPath();
    this.ctx.moveTo(x - sideDepth - 5, y - 5);
    this.ctx.lineTo(x + tableWidth - tiltOffset + 5, y - 5);
    this.ctx.lineTo(x + tableWidth + 5, y + tableHeight + 5);
    this.ctx.lineTo(x - 5, y + tableHeight + 5);
    this.ctx.closePath();
    this.ctx.fill();

    this.ctx.fillStyle = '#5D4037';
    this.ctx.beginPath();
    this.ctx.moveTo(x - sideDepth - 5, y - 5);
    this.ctx.lineTo(x + tableWidth - tiltOffset + 5, y - 5);
    this.ctx.lineTo(x + tableWidth + 5, y + tableHeight + 3);
    this.ctx.lineTo(x - 5, y + tableHeight + 3);
    this.ctx.closePath();
    this.ctx.fill();

    this.ctx.fillStyle = '#8B4513';
    this.ctx.beginPath();
    this.ctx.moveTo(x - sideDepth - 3, y - 3);
    this.ctx.lineTo(x + tableWidth - tiltOffset + 3, y - 3);
    this.ctx.lineTo(x + tableWidth + 3, y + tableHeight + 1);
    this.ctx.lineTo(x - 3, y + tableHeight + 1);
    this.ctx.closePath();
    this.ctx.fill();

    this.ctx.fillStyle = '#A0522D';
    this.ctx.beginPath();
    this.ctx.moveTo(x - sideDepth - 2, y - 2);
    this.ctx.lineTo(x + tableWidth - tiltOffset + 2, y - 2);
    this.ctx.lineTo(x + tableWidth + 2, y + tableHeight - 1);
    this.ctx.lineTo(x - 2, y + tableHeight - 1);
    this.ctx.closePath();
    this.ctx.fill();

    this.ctx.fillStyle = '#006400';
    this.ctx.beginPath();
    this.ctx.moveTo(x - sideDepth - 2, y - 2);
    this.ctx.lineTo(x + tableWidth - tiltOffset + 2, y - 2);
    this.ctx.lineTo(x + tableWidth + 2, y + tableHeight - 2);
    this.ctx.lineTo(x - 2, y + tableHeight - 2);
    this.ctx.closePath();
    this.ctx.fill();

    this.ctx.fillStyle = '#008000';
    this.ctx.beginPath();
    this.ctx.moveTo(x - sideDepth, y);
    this.ctx.lineTo(x + tableWidth - tiltOffset, y);
    this.ctx.lineTo(x + tableWidth, y + tableHeight);
    this.ctx.lineTo(x, y + tableHeight);
    this.ctx.closePath();
    this.ctx.fill();

    this.ctx.fillStyle = '#004D00';
    this.ctx.beginPath();
    this.ctx.moveTo(x - sideDepth + 2, y + 2);
    this.ctx.lineTo(x + tableWidth - tiltOffset - 2, y + 2);
    this.ctx.lineTo(x + tableWidth - 2, y + tableHeight - 2);
    this.ctx.lineTo(x + 2, y + tableHeight - 2);
    this.ctx.closePath();
    this.ctx.fill();

    this.ctx.fillStyle = '#FFF';
    this.ctx.beginPath();
    this.ctx.arc(x - sideDepth + 5, y + 5, 3, 0, Math.PI * 2);
    this.ctx.arc(x + tableWidth - tiltOffset - 5, y + 5, 3, 0, Math.PI * 2);
    this.ctx.arc(x + 5, y + tableHeight - 5, 3, 0, Math.PI * 2);
    this.ctx.arc(x + tableWidth - 5, y + tableHeight - 5, 3, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = '#000';
    this.ctx.beginPath();
    this.ctx.arc(x - sideDepth + 5, y + 5, 2, 0, Math.PI * 2);
    this.ctx.arc(x + tableWidth - tiltOffset - 5, y + 5, 2, 0, Math.PI * 2);
    this.ctx.arc(x + 5, y + tableHeight - 5, 2, 0, Math.PI * 2);
    this.ctx.arc(x + tableWidth - 5, y + tableHeight - 5, 2, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = 'rgba(255,255,255,0.15)';
    this.ctx.beginPath();
    this.ctx.moveTo(x, y - 5);
    this.ctx.lineTo(x + tableWidth - tiltOffset + 5, y - 5);
    this.ctx.lineTo(x + tableWidth - tiltOffset + 5, y - 3);
    this.ctx.lineTo(x, y - 3);
    this.ctx.closePath();
    this.ctx.fill();

    this.ctx.fillStyle = 'rgba(0,0,0,0.3)';
    this.ctx.beginPath();
    this.ctx.moveTo(x + tableWidth - tiltOffset + 3, y - 5);
    this.ctx.lineTo(x + tableWidth - tiltOffset + 5, y - 5);
    this.ctx.lineTo(x + tableWidth + 5, y + tableHeight + 1);
    this.ctx.lineTo(x + tableWidth + 3, y + tableHeight + 1);
    this.ctx.closePath();
    this.ctx.fill();

    this.ctx.beginPath();
    this.ctx.moveTo(x - 5, y + tableHeight + 1);
    this.ctx.lineTo(x + tableWidth + 5, y + tableHeight + 1);
    this.ctx.lineTo(x + tableWidth + 5, y + tableHeight + 3);
    this.ctx.lineTo(x - 5, y + tableHeight + 3);
    this.ctx.closePath();
    this.ctx.fill();

    this.ctx.fillStyle = 'rgba(0,0,0,0.2)';
    this.ctx.fillRect(x - 3, y + tableHeight + legHeight - 2, legWidth, 3);
    this.ctx.fillRect(x + tableWidth - tiltOffset - 3, y + tableHeight + legHeight - 2, legWidth, 3);
  }

  renderSpeaker(x, y) {
    this.ctx.fillStyle = '#1a1a1a';
    this.ctx.fillRect(x, y, 30, 50);
    this.ctx.fillStyle = '#2a2a2a';
    this.ctx.fillRect(x + 2, y + 2, 26, 46);
    this.ctx.fillStyle = '#333';
    this.ctx.fillRect(x + 4, y + 4, 22, 42);
    this.ctx.fillStyle = '#222';
    this.ctx.beginPath();
    this.ctx.arc(x + 15, y + 15, 10, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.fillStyle = '#444';
    this.ctx.beginPath();
    this.ctx.arc(x + 15, y + 15, 8, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.fillStyle = '#333';
    this.ctx.beginPath();
    this.ctx.arc(x + 15, y + 15, 5, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.fillStyle = '#222';
    this.ctx.beginPath();
    this.ctx.arc(x + 15, y + 35, 8, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.fillStyle = '#444';
    this.ctx.beginPath();
    this.ctx.arc(x + 15, y + 35, 6, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.fillStyle = '#333';
    this.ctx.beginPath();
    this.ctx.arc(x + 15, y + 35, 3, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(x + 5, y + 46, 20, 4);
  }

  renderFireplace(x, y) {
    const frameWidth = 80;
    const frameHeight = 50;
    const fireAnim = Math.sin(Date.now() / 200) * 2;

    this.ctx.fillStyle = '#4E342E';
    this.ctx.fillRect(x - frameWidth / 2, y, frameWidth, frameHeight);
    this.ctx.fillStyle = '#3E2723';
    this.ctx.fillRect(x - frameWidth / 2 + 4, y + 4, frameWidth - 8, frameHeight - 8);
    this.ctx.fillStyle = '#2D1B15';
    this.ctx.fillRect(x - frameWidth / 2 + 8, y + 8, frameWidth - 16, frameHeight - 16);

    this.ctx.fillStyle = '#1a1a1a';
    this.ctx.fillRect(x - 25, y + 15, 50, 30);

    this.ctx.fillStyle = '#FF4500';
    this.ctx.beginPath();
    this.ctx.moveTo(x - 15, y + 40);
    this.ctx.lineTo(x - 5, y + 25 + fireAnim);
    this.ctx.lineTo(x + 5, y + 40);
    this.ctx.closePath();
    this.ctx.fill();

    this.ctx.fillStyle = '#FF6600';
    this.ctx.beginPath();
    this.ctx.moveTo(x - 5, y + 40);
    this.ctx.lineTo(x + 5, y + 28 + fireAnim);
    this.ctx.lineTo(x + 15, y + 40);
    this.ctx.closePath();
    this.ctx.fill();

    this.ctx.fillStyle = '#FFCC00';
    this.ctx.beginPath();
    this.ctx.arc(x, y + 35, 5 + fireAnim * 0.3, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = '#FF8800';
    this.ctx.beginPath();
    this.ctx.arc(x - 8, y + 38, 3, 0, Math.PI * 2);
    this.ctx.arc(x + 8, y + 38, 3, 0, Math.PI * 2);
    this.ctx.fill();
  }

  renderRug(x, y, width, height) {
    this.ctx.fillStyle = '#6B5B95';
    this.ctx.fillRect(x - width / 2, y - height / 2, width, height);
    this.ctx.fillStyle = '#7B6BA5';
    this.ctx.fillRect(x - width / 2 + 5, y - height / 2 + 5, width - 10, height - 10);
    this.ctx.fillStyle = '#8B7BB5';
    this.ctx.fillRect(x - width / 2 + 10, y - height / 2 + 10, width - 20, height - 20);
  }

  renderLamp(x, y) {
    this.ctx.fillStyle = '#5D4037';
    this.ctx.fillRect(x - 3, y, 6, 20);
    this.ctx.fillStyle = '#4E342E';
    this.ctx.fillRect(x - 4, y + 18, 8, 4);
    this.ctx.fillStyle = '#FFD700';
    this.ctx.beginPath();
    this.ctx.moveTo(x - 10, y);
    this.ctx.lineTo(x + 10, y);
    this.ctx.lineTo(x + 5, y - 15);
    this.ctx.lineTo(x - 5, y - 15);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.fillStyle = '#FFA500';
    this.ctx.beginPath();
    this.ctx.moveTo(x - 8, y);
    this.ctx.lineTo(x + 8, y);
    this.ctx.lineTo(x + 4, y - 12);
    this.ctx.lineTo(x - 4, y - 12);
    this.ctx.closePath();
    this.ctx.fill();
  }

  renderBookshelf(x, y) {
    this.ctx.fillStyle = '#5D4037';
    this.ctx.fillRect(x, y, 40, 60);
    this.ctx.fillStyle = '#4E342E';
    this.ctx.fillRect(x + 2, y + 2, 36, 56);
    this.ctx.fillStyle = '#3E2723';
    this.ctx.fillRect(x + 4, y + 18, 32, 2);
    this.ctx.fillRect(x + 4, y + 38, 32, 2);

    const bookColors = ['#8B0000', '#006400', '#00008B', '#FF8C00', '#4B0082', '#B22222'];
    for (let i = 0; i < 8; i++) {
      this.ctx.fillStyle = bookColors[i % bookColors.length];
      this.ctx.fillRect(x + 5 + i * 4, y + 4, 3, 12);
    }
    for (let i = 0; i < 8; i++) {
      this.ctx.fillStyle = bookColors[(i + 3) % bookColors.length];
      this.ctx.fillRect(x + 5 + i * 4, y + 22, 3, 14);
    }
    for (let i = 0; i < 8; i++) {
      this.ctx.fillStyle = bookColors[(i + 5) % bookColors.length];
      this.ctx.fillRect(x + 5 + i * 4, y + 42, 3, 14);
    }
  }

  renderCoffeeTable(x, y) {
    this.ctx.fillStyle = '#5D4037';
    this.ctx.fillRect(x - 30, y - 15, 60, 30);
    this.ctx.fillStyle = '#4E342E';
    this.ctx.fillRect(x - 28, y - 13, 56, 26);
    this.ctx.fillStyle = '#8B4513';
    this.ctx.fillRect(x - 25, y - 10, 50, 20);
    this.ctx.fillStyle = '#3E2723';
    this.ctx.fillRect(x - 25, y + 15, 8, 5);
    this.ctx.fillRect(x + 17, y + 15, 8, 5);
  }

  renderPlant(x, y, scale = 1) {
    const potW = Math.floor(14 * scale);
    const potH = Math.floor(18 * scale);
    const leafSize = Math.floor(12 * scale);

    this.ctx.fillStyle = '#8B4513';
    this.ctx.fillRect(x - potW / 2, y, potW, potH);
    this.ctx.fillStyle = '#A0522D';
    this.ctx.fillRect(x - potW / 2 - 1, y + potH - 2, potW + 2, 4);
    this.ctx.fillStyle = '#CD853F';
    this.ctx.fillRect(x - potW / 2 + 2, y + 2, potW - 4, 3);

    this.ctx.fillStyle = '#228B22';
    this.ctx.beginPath();
    this.ctx.arc(x, y - leafSize / 2, leafSize, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.fillStyle = '#32CD32';
    this.ctx.beginPath();
    this.ctx.arc(x - leafSize * 0.4, y - leafSize * 0.3, leafSize * 0.7, 0, Math.PI * 2);
    this.ctx.arc(x + leafSize * 0.4, y - leafSize * 0.3, leafSize * 0.7, 0, Math.PI * 2);
    this.ctx.fill();
  }

  renderOfficeChair(x, y) {
    this.ctx.fillStyle = '#2F4F4F';
    this.ctx.fillRect(x - 8, y - 10, 16, 20);
    this.ctx.fillStyle = '#1a1a1a';
    this.ctx.fillRect(x - 6, y - 8, 12, 16);
    this.ctx.fillStyle = '#3E2723';
    this.ctx.fillRect(x - 3, y + 10, 6, 8);
    this.ctx.fillStyle = '#5D4037';
    this.ctx.fillRect(x - 5, y + 16, 10, 3);
  }

  renderBigScreen(x, y) {
    const width = 200;
    const height = 60;
    const time = Date.now() / 1000;

    this.ctx.fillStyle = '#1a1a1a';
    this.ctx.fillRect(x - width / 2, y, width, height);
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(x - width / 2 + 5, y + 5, width - 10, height - 10);

    for (let i = 0; i < 20; i++) {
      const barHeight = Math.sin(time * 2 + i * 0.5) * 15 + 20;
      this.ctx.fillStyle = `hsl(${120 + Math.sin(time + i * 0.3) * 60}, 70%, 50%)`;
      this.ctx.fillRect(x - width / 2 + 10 + i * 9, y + height - 10 - barHeight, 7, barHeight);
    }

    this.ctx.fillStyle = '#00FF00';
    this.ctx.font = '10px monospace';
    this.ctx.textAlign = 'left';
    for (let i = 0; i < 5; i++) {
      const text = `DATA: ${Math.floor(Math.random() * 10000)}`;
      this.ctx.fillText(text, x - width / 2 + 10, y + 15 + i * 8);
    }
  }

  renderServerRack(x, y) {
    this.ctx.fillStyle = '#2a2a2a';
    this.ctx.fillRect(x, y, 30, 50);
    this.ctx.fillStyle = '#1a1a1a';
    this.ctx.fillRect(x + 2, y + 2, 26, 46);

    for (let i = 0; i < 6; i++) {
      this.ctx.fillStyle = '#333';
      this.ctx.fillRect(x + 4, y + 4 + i * 7, 22, 5);
      this.ctx.fillStyle = i % 2 === 0 ? '#00FF00' : '#0066FF';
      this.ctx.fillRect(x + 6, y + 6 + i * 7, 3, 2);
      this.ctx.fillRect(x + 12, y + 6 + i * 7, 3, 2);
      this.ctx.fillRect(x + 18, y + 6 + i * 7, 3, 2);
    }
  }

  renderWhiteboard(x, y) {
    this.ctx.fillStyle = '#8B4513';
    this.ctx.fillRect(x - 2, y - 2, 64, 44);
    this.ctx.fillStyle = '#F5F5DC';
    this.ctx.fillRect(x, y, 60, 40);
    this.ctx.fillStyle = '#000';
    this.ctx.font = '8px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText('TODO:', x + 5, y + 12);
    this.ctx.fillText('- Fix bugs', x + 5, y + 22);
    this.ctx.fillText('- Deploy', x + 5, y + 32);
  }

  renderCoffeeMachine(x, y) {
    this.ctx.fillStyle = '#C0C0C0';
    this.ctx.fillRect(x - 15, y, 30, 35);
    this.ctx.fillStyle = '#A9A9A9';
    this.ctx.fillRect(x - 13, y + 2, 26, 31);
    this.ctx.fillStyle = '#1a1a1a';
    this.ctx.fillRect(x - 10, y + 5, 20, 15);
    this.ctx.fillStyle = '#4E342E';
    this.ctx.fillRect(x - 5, y + 25, 10, 8);
    this.ctx.fillStyle = '#8B4513';
    this.ctx.fillRect(x - 3, y + 27, 6, 5);
  }

  renderPS5Setup(x, y) {
    this.ctx.fillStyle = '#FFF';
    this.ctx.fillRect(x - 20, y, 40, 8);
    this.ctx.fillStyle = '#E0E0E0';
    this.ctx.fillRect(x - 18, y + 2, 36, 4);
    this.ctx.fillStyle = '#1a1a1a';
    this.ctx.fillRect(x - 15, y + 10, 30, 6);
    this.ctx.fillStyle = '#333';
    this.ctx.fillRect(x - 13, y + 12, 26, 2);
    this.ctx.fillStyle = '#0066FF';
    this.ctx.fillRect(x - 8, y + 18, 16, 3);
  }

  renderTV(x, y) {
    const width = 80;
    const height = 50;
    this.ctx.fillStyle = '#1a1a1a';
    this.ctx.fillRect(x - width / 2, y, width, height);
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(x - width / 2 + 3, y + 3, width - 6, height - 6);
    this.ctx.fillStyle = '#001133';
    this.ctx.fillRect(x - width / 2 + 5, y + 5, width - 10, height - 10);
    this.ctx.fillStyle = '#3E2723';
    this.ctx.fillRect(x - 5, y + height, 10, 5);
  }

  renderLSofa(x, y) {
    const seatW = 80;
    const seatH = 25;
    const backH = 15;
    const armW = 20;
    const armH = 50;

    this.ctx.fillStyle = '#1E3A7E';
    this.ctx.fillRect(x - seatW / 2, y, seatW, seatH);

    this.ctx.fillStyle = '#2E4A8E';
    this.ctx.fillRect(x - seatW / 2, y - backH, seatW, backH);

    this.ctx.fillStyle = '#3E5A9E';
    this.ctx.fillRect(x - seatW / 2 + 2, y - backH + 2, seatW - 4, backH - 4);

    this.ctx.fillStyle = '#4E6AAE';
    this.ctx.fillRect(x - seatW / 2 + 4, y - backH + 4, seatW - 8, backH - 8);

    this.ctx.fillStyle = '#5E7ABE';
    this.ctx.fillRect(x - seatW / 2 + 3, y + 3, seatW - 6, seatH - 6);

    this.ctx.fillStyle = '#6E8ACE';
    this.ctx.fillRect(x - seatW / 2 + 5, y + 5, seatW - 10, seatH - 10);

    this.ctx.fillStyle = '#7E9ADE';
    this.ctx.fillRect(x - seatW / 2 + 7, y + 7, seatW - 14, seatH - 14);

    this.ctx.fillStyle = '#1E3A7E';
    this.ctx.fillRect(x - seatW / 2, y - armH, armW, armH);

    this.ctx.fillStyle = '#2E4A8E';
    this.ctx.fillRect(x - seatW / 2, y - armH - backH, armW, backH);

    this.ctx.fillStyle = '#3E5A9E';
    this.ctx.fillRect(x - seatW / 2 + 2, y - armH - backH + 2, armW - 4, backH - 4);

    this.ctx.fillStyle = '#4E6AAE';
    this.ctx.fillRect(x - seatW / 2 + 4, y - armH - backH + 4, armW - 8, backH - 8);

    this.ctx.fillStyle = '#5E7ABE';
    this.ctx.fillRect(x - seatW / 2 + 3, y - armH + 3, armW - 6, armH - 6);

    this.ctx.fillStyle = '#6E8ACE';
    this.ctx.fillRect(x - seatW / 2 + 5, y - armH + 5, armW - 10, armH - 10);

    this.ctx.fillStyle = '#7E9ADE';
    this.ctx.fillRect(x - seatW / 2 + 7, y - armH + 7, armW - 14, armH - 14);
  }

  renderBeanbag(x, y) {
    this.ctx.fillStyle = '#FF6B6B';
    this.ctx.beginPath();
    this.ctx.ellipse(x, y, 25, 18, 0, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.fillStyle = '#FF8585';
    this.ctx.beginPath();
    this.ctx.ellipse(x, y - 3, 20, 14, 0, 0, Math.PI * 2);
    this.ctx.fill();
  }

  renderGamingChair(x, y) {
    this.ctx.fillStyle = '#1a1a1a';
    this.ctx.fillRect(x - 8, y + 15, 16, 12);

    this.ctx.fillStyle = '#CC0000';
    this.ctx.fillRect(x - 12, y - 15, 24, 35);

    this.ctx.fillStyle = '#FF0000';
    this.ctx.fillRect(x - 10, y - 13, 20, 31);

    this.ctx.fillStyle = '#FF3333';
    this.ctx.fillRect(x - 8, y - 11, 16, 27);

    this.ctx.fillStyle = '#1a1a1a';
    this.ctx.fillRect(x - 6, y - 8, 12, 8);

    this.ctx.fillStyle = '#333';
    this.ctx.fillRect(x - 5, y - 7, 10, 6);

    this.ctx.fillStyle = '#CC0000';
    this.ctx.fillRect(x - 10, y + 18, 6, 8);
    this.ctx.fillRect(x + 4, y + 18, 6, 8);

    this.ctx.fillStyle = '#FF0000';
    this.ctx.fillRect(x - 9, y + 19, 4, 6);
    this.ctx.fillRect(x + 5, y + 19, 4, 6);
  }

  renderMiniFridge(x, y) {
    this.ctx.fillStyle = '#E0E0E0';
    this.ctx.fillRect(x - 12, y, 24, 35);
    this.ctx.fillStyle = '#C0C0C0';
    this.ctx.fillRect(x - 10, y + 2, 20, 31);
    this.ctx.fillStyle = '#1a1a1a';
    this.ctx.fillRect(x - 8, y + 5, 16, 12);
    this.ctx.fillRect(x - 8, y + 20, 16, 10);
    this.ctx.fillStyle = '#0066FF';
    this.ctx.fillRect(x - 2, y + 32, 4, 2);
  }

  renderNeonSign(x, y) {
    const time = Date.now() / 500;
    const alpha = (Math.sin(time) + 1) / 2 * 0.5 + 0.5;
    this.ctx.fillStyle = `rgba(180, 0, 255, ${alpha})`;
    this.ctx.font = 'bold 32px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('GAMES', x, y);
    this.ctx.strokeStyle = `rgba(180, 0, 255, ${alpha})`;
    this.ctx.lineWidth = 3;
    this.ctx.strokeText('GAMES', x, y);
  }

  renderPoster(x, y) {
    this.ctx.fillStyle = '#8B4513';
    this.ctx.fillRect(x, y, 30, 40);
    this.ctx.fillStyle = '#FFD700';
    this.ctx.fillRect(x + 2, y + 2, 26, 36);
    this.ctx.fillStyle = '#000';
    this.ctx.font = 'bold 8px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('ARCADE', x + 15, y + 20);
  }

  renderNeonPoster(x, y) {
    const time = Date.now() / 500;
    const alpha = (Math.sin(time) + 1) / 2 * 0.5 + 0.5;
    this.ctx.fillStyle = `rgba(255, 255, 0, ${alpha})`;
    this.ctx.font = 'bold 10px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('ARCADE', x + 15, y + 25);
    this.ctx.strokeStyle = `rgba(255, 255, 0, ${alpha})`;
    this.ctx.lineWidth = 2;
    this.ctx.strokeText('ARCADE', x + 15, y + 25);
  }

  renderVideoScreen(x, y) {
    const width = this.videoScreen.width;
    const height = this.videoScreen.height;
    const depth = 15;

    this.ctx.fillStyle = '#1a1a1a';
    this.ctx.fillRect(x - width / 2 - 10, y - 10, width + 20, height + 20);

    this.ctx.fillStyle = '#2a2a2a';
    this.ctx.fillRect(x - width / 2 - 8, y - 8, width + 16, height + 16);

    this.ctx.fillStyle = '#0a0a0a';
    this.ctx.fillRect(x - width / 2, y, width, height);

    if (this.videoScreen.playing && this.videoCanvas && (this.isVideoSource || this.hasReceivedVideoFrame)) {
      console.log('[VIDEO] renderVideoScreen: drawing videoCanvas, playing:', this.videoScreen.playing, 'isVideoSource:', this.isVideoSource, 'hasReceivedVideoFrame:', this.hasReceivedVideoFrame);
      this.ctx.drawImage(
        this.videoCanvas,
        x - width / 2 + 2,
        y + 2,
        width - 4,
        height - 4
      );
    } else {
      console.log('[VIDEO] renderVideoScreen: NOT drawing, playing:', this.videoScreen.playing, 'isVideoSource:', this.isVideoSource, 'hasReceivedVideoFrame:', this.hasReceivedVideoFrame);
      this.ctx.fillStyle = '#1a1a1a';
      this.ctx.fillRect(x - width / 2 + 2, y + 2, width - 4, height - 4);

      this.ctx.fillStyle = '#666';
      this.ctx.font = 'bold 12px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('VIDEO SCREEN', x, y + height / 2 - 10);
      this.ctx.fillText('Press button to play', x, y + height / 2 + 10);
    }

    this.ctx.fillStyle = '#333';
    this.ctx.fillRect(x - width / 2 - 10, y + height + 10, width + 20, depth);
    this.ctx.fillStyle = '#444';
    this.ctx.fillRect(x - width / 2 - 8, y + height + 12, width + 16, depth - 4);
  }

  renderVideoButton(x, y) {
    const width = this.videoButton.width;
    const height = this.videoButton.height;
    const isPlayerNear = this.localPlayer && Math.sqrt(Math.pow(this.localPlayer.x - x, 2) + Math.pow(this.localPlayer.y - y, 2)) < 50;

    this.ctx.fillStyle = this.videoScreen.playing ? '#ff6b6b' : '#4ECDC4';
    this.ctx.fillRect(x - width / 2, y - height / 2, width, height);

    this.ctx.fillStyle = this.videoScreen.playing ? '#ff5252' : '#45b7aa';
    this.ctx.fillRect(x - width / 2 + 2, y - height / 2 + 2, width - 4, height - 4);

    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 10px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(this.videoScreen.playing ? 'STOP' : 'PLAY', x, y + 4);

    if (isPlayerNear) {
      this.ctx.fillStyle = '#fff';
      this.ctx.font = 'bold 8px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('[SPACE/F]', x, y + height / 2 + 12);
    }
  }

  renderVideoResetButton(x, y) {
    const width = this.videoResetButton.width;
    const height = this.videoResetButton.height;
    const isPlayerNear = this.localPlayer && Math.sqrt(Math.pow(this.localPlayer.x - x, 2) + Math.pow(this.localPlayer.y - y, 2)) < 50;

    this.ctx.fillStyle = '#FFA726';
    this.ctx.fillRect(x - width / 2, y - height / 2, width, height);

    this.ctx.fillStyle = '#FF9800';
    this.ctx.fillRect(x - width / 2 + 2, y - height / 2 + 2, width - 4, height - 4);

    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 10px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('RESET', x, y + 4);

    if (isPlayerNear) {
      this.ctx.fillStyle = '#fff';
      this.ctx.font = 'bold 8px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('[SPACE/F]', x, y + height / 2 + 12);
    }
  }

  renderCinemaScreen(x, y) {
    const width = this.videoScreen.width;
    const height = this.videoScreen.height;

    this.ctx.fillStyle = '#1a1a1a';
    this.ctx.fillRect(x - width / 2 - 20, y - 20, width + 40, height + 40);

    this.ctx.fillStyle = '#2a2a2a';
    this.ctx.fillRect(x - width / 2 - 15, y - 15, width + 30, height + 30);

    this.ctx.fillStyle = '#0a0a0a';
    this.ctx.fillRect(x - width / 2, y, width, height);

    if (this.videoScreen.playing && this.videoCanvas && (this.isVideoSource || this.hasReceivedVideoFrame)) {
      console.log('[VIDEO] renderVideoScreen: drawing videoCanvas, playing:', this.videoScreen.playing, 'isVideoSource:', this.isVideoSource, 'hasReceivedVideoFrame:', this.hasReceivedVideoFrame);
      this.ctx.drawImage(
        this.videoCanvas,
        x - width / 2 + 2,
        y + 2,
        width - 4,
        height - 4
      );
    } else {
      console.log('[VIDEO] renderVideoScreen: NOT drawing, playing:', this.videoScreen.playing, 'isVideoSource:', this.isVideoSource, 'hasReceivedVideoFrame:', this.hasReceivedVideoFrame);
      this.ctx.fillStyle = '#1a1a1a';
      this.ctx.fillRect(x - width / 2 + 2, y + 2, width - 4, height - 4);

      this.ctx.fillStyle = '#666';
      this.ctx.font = 'bold 24px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('CINEMA SCREEN', x, y + height / 2 - 20);
      this.ctx.fillText('Press button to play', x, y + height / 2 + 20);
    }
  }

  renderCinemaSeats() {
    const seatWidth = 40;
    const seatHeight = 30;
    const seatDepth = 20;
    const startY = 520;

    const leftSeats = [60, 130, 200, 270];
    const rightSeats = [530, 600, 670, 740];

    [...leftSeats, ...rightSeats].forEach(x => {
      const seatIndex = this.cinemaSeats.findIndex(s => s.x === x && s.y === startY);
      const isOccupied = seatIndex !== -1 && this.cinemaSeats[seatIndex].occupied;

      this.ctx.fillStyle = isOccupied ? '#4a0000' : '#8B0000';
      this.ctx.fillRect(x - seatWidth / 2, startY, seatWidth, seatHeight);

      this.ctx.fillStyle = isOccupied ? '#6a0000' : '#A52A2A';
      this.ctx.fillRect(x - seatWidth / 2 + 2, startY + 2, seatWidth - 4, seatHeight - 4);

      this.ctx.fillStyle = isOccupied ? '#8a0000' : '#CD5C5C';
      this.ctx.fillRect(x - seatWidth / 2 + 4, startY + 4, seatWidth - 8, seatHeight - 8);

      this.ctx.fillStyle = '#8B0000';
      this.ctx.fillRect(x - seatWidth / 2, startY + seatHeight, seatWidth, seatDepth);

      this.ctx.fillStyle = '#A52A2A';
      this.ctx.fillRect(x - seatWidth / 2 + 2, startY + seatHeight + 2, seatWidth - 4, seatDepth - 4);
    });
  }

  renderStage(x, y) {
    const stageWidth = 300;
    const stageDepth = 60;
    const stageHeight = 20;

    this.ctx.fillStyle = '#4E342E';
    this.ctx.fillRect(x - stageWidth / 2, y, stageWidth, stageDepth);

    this.ctx.fillStyle = '#3E2723';
    this.ctx.fillRect(x - stageWidth / 2, y - stageHeight, stageWidth, stageHeight);

    this.ctx.fillStyle = '#5D4037';
    this.ctx.fillRect(x - stageWidth / 2 + 2, y - stageHeight + 2, stageWidth - 4, stageHeight - 4);

    this.ctx.fillStyle = '#6D5047';
    this.ctx.fillRect(x - stageWidth / 2 + 4, y - stageHeight + 4, stageWidth - 8, stageHeight - 8);

    this.ctx.fillStyle = '#7D6057';
    this.ctx.fillRect(x - stageWidth / 2 + 6, y - stageHeight + 6, stageWidth - 12, stageHeight - 12);

    this.ctx.fillStyle = '#2D1B15';
    this.ctx.fillRect(x - stageWidth / 2, y + stageDepth - 5, stageWidth, 5);

    this.ctx.fillStyle = '#3E2723';
    this.ctx.fillRect(x - stageWidth / 2 + 2, y + stageDepth - 4, stageWidth - 4, 3);

    this.ctx.fillStyle = '#4E342E';
    this.ctx.fillRect(x - stageWidth / 2 + 4, y + stageDepth - 3, stageWidth - 8, 2);

    this.ctx.fillStyle = '#5D4037';
    this.ctx.fillRect(x - stageWidth / 2 + 6, y + stageDepth - 2, stageWidth - 12, 1);
  }

  renderBigSpeaker(x, y, scale = 1) {
    const w = Math.floor(40 * scale);
    const h = Math.floor(60 * scale);
    this.ctx.fillStyle = '#1a1a1a';
    this.ctx.fillRect(x - w / 2, y, w, h);
    this.ctx.fillStyle = '#2a2a2a';
    this.ctx.fillRect(x - w / 2 + 3, y + 3, w - 6, h - 6);
    this.ctx.fillStyle = '#333';
    this.ctx.fillRect(x - w / 2 + 5, y + 5, w - 10, h - 10);
    this.ctx.fillStyle = '#222';
    this.ctx.beginPath();
    this.ctx.arc(x, y + 18, Math.floor(12 * scale), 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.fillStyle = '#444';
    this.ctx.beginPath();
    this.ctx.arc(x, y + 18, Math.floor(10 * scale), 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.fillStyle = '#333';
    this.ctx.beginPath();
    this.ctx.arc(x, y + 18, Math.floor(6 * scale), 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.fillStyle = '#222';
    this.ctx.beginPath();
    this.ctx.arc(x, y + 42, Math.floor(10 * scale), 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.fillStyle = '#444';
    this.ctx.beginPath();
    this.ctx.arc(x, y + 42, Math.floor(8 * scale), 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.fillStyle = '#333';
    this.ctx.beginPath();
    this.ctx.arc(x, y + 42, Math.floor(4 * scale), 0, Math.PI * 2);
    this.ctx.fill();
  }

  renderGuitar(x, y) {
    this.ctx.fillStyle = '#8B4513';
    this.ctx.fillRect(x - 3, y, 6, 40);
    this.ctx.fillStyle = '#A0522D';
    this.ctx.fillRect(x - 2, y + 2, 4, 36);
    this.ctx.fillStyle = '#5D4037';
    this.ctx.beginPath();
    this.ctx.ellipse(x, y + 35, 8, 10, 0, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.fillStyle = '#3E2723';
    this.ctx.beginPath();
    this.ctx.ellipse(x, y + 35, 5, 7, 0, 0, Math.PI * 2);
    this.ctx.fill();
  }

  renderDrumKit(x, y) {
    this.ctx.fillStyle = '#FFF';
    this.ctx.beginPath();
    this.ctx.arc(x, y + 20, 15, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.fillStyle = '#EEE';
    this.ctx.beginPath();
    this.ctx.arc(x, y + 20, 12, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.fillStyle = '#DDD';
    this.ctx.beginPath();
    this.ctx.arc(x, y + 20, 8, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = '#FF0000';
    this.ctx.beginPath();
    this.ctx.arc(x - 20, y + 25, 8, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.beginPath();
    this.ctx.arc(x + 20, y + 25, 8, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = '#FFD700';
    this.ctx.fillRect(x - 2, y - 5, 4, 25);
  }

  renderMicrophoneStand(x, y) {
    this.ctx.fillStyle = '#C0C0C0';
    this.ctx.fillRect(x - 1, y, 2, 30);
    this.ctx.fillStyle = '#A0A0A0';
    this.ctx.fillRect(x - 2, y + 28, 4, 4);
    this.ctx.fillStyle = '#333';
    this.ctx.beginPath();
    this.ctx.arc(x, y - 5, 5, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.fillStyle = '#444';
    this.ctx.beginPath();
    this.ctx.arc(x, y - 5, 3, 0, Math.PI * 2);
    this.ctx.fill();
  }

  renderAmp(x, y) {
    this.ctx.fillStyle = '#1a1a1a';
    this.ctx.fillRect(x - 20, y, 40, 30);
    this.ctx.fillStyle = '#2a2a2a';
    this.ctx.fillRect(x - 18, y + 2, 36, 26);
    this.ctx.fillStyle = '#333';
    this.ctx.fillRect(x - 15, y + 5, 30, 20);
    this.ctx.fillStyle = '#00FF00';
    this.ctx.beginPath();
    this.ctx.arc(x - 8, y + 15, 5, 0, Math.PI * 2);
    this.ctx.arc(x + 8, y + 15, 5, 0, Math.PI * 2);
    this.ctx.fill();
  }

  renderVinylPlayer(x, y) {
    this.ctx.fillStyle = '#8B4513';
    this.ctx.fillRect(x - 25, y, 50, 20);
    this.ctx.fillStyle = '#A0522D';
    this.ctx.fillRect(x - 23, y + 2, 46, 16);
    this.ctx.fillStyle = '#1a1a1a';
    this.ctx.beginPath();
    this.ctx.arc(x, y + 10, 15, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.fillStyle = '#333';
    this.ctx.beginPath();
    this.ctx.arc(x, y + 10, 12, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.fillStyle = '#222';
    this.ctx.beginPath();
    this.ctx.arc(x, y + 10, 3, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.fillStyle = '#C0C0C0';
    this.ctx.fillRect(x + 15, y - 5, 3, 15);
  }

  renderMusicNotes(x, y) {
    const time = Date.now() / 1000;
    this.ctx.fillStyle = '#FFD700';
    this.ctx.font = '20px Arial';
    this.ctx.textAlign = 'center';
    const notes = ['♪', '♫', '♬'];
    for (let i = 0; i < 3; i++) {
      const offset = Math.sin(time + i) * 10;
      this.ctx.fillText(notes[i], x - 20 + i * 20, y + offset);
    }
  }

  renderSpotlight(x, y) {
    this.ctx.fillStyle = '#FFD700';
    this.ctx.beginPath();
    this.ctx.moveTo(x - 5, y);
    this.ctx.lineTo(x + 5, y);
    this.ctx.lineTo(x + 15, y + 40);
    this.ctx.lineTo(x - 15, y + 40);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
    this.ctx.beginPath();
    this.ctx.moveTo(x - 3, y + 5);
    this.ctx.lineTo(x + 3, y + 5);
    this.ctx.lineTo(x + 12, y + 35);
    this.ctx.lineTo(x - 12, y + 35);
    this.ctx.closePath();
    this.ctx.fill();
  }

  renderPiano(x, y, scale = 1) {
    const w = Math.floor(30 * scale);
    const h = Math.floor(60 * scale);
    const depth = Math.floor(15 * scale);

    this.ctx.fillStyle = '#1a1a1a';
    this.ctx.fillRect(x, y, w, h);

    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(x + Math.floor(2 * scale), y + Math.floor(2 * scale), w - Math.floor(4 * scale), h - Math.floor(4 * scale));

    this.ctx.fillStyle = '#2a2a2a';
    this.ctx.fillRect(x + Math.floor(4 * scale), y + Math.floor(4 * scale), w - Math.floor(8 * scale), h - Math.floor(8 * scale));

    this.ctx.fillStyle = '#FFF';
    for (let i = 0; i < 14; i++) {
      this.ctx.fillRect(x + Math.floor(5 * scale), y + Math.floor(2 * scale) + i * Math.floor(4 * scale), Math.floor(20 * scale), Math.floor(3 * scale));
    }

    this.ctx.fillStyle = '#EEE';
    for (let i = 0; i < 14; i++) {
      this.ctx.fillRect(x + Math.floor(6 * scale), y + Math.floor(3 * scale) + i * Math.floor(4 * scale), Math.floor(18 * scale), Math.floor(2 * scale));
    }

    this.ctx.fillStyle = '#000';
    for (let i = 0; i < 10; i++) {
      this.ctx.fillRect(x + Math.floor(5 * scale), y + Math.floor(4 * scale) + i * Math.floor(6 * scale), Math.floor(12 * scale), Math.floor(2 * scale));
    }

    this.ctx.fillStyle = '#1a1a1a';
    for (let i = 0; i < 10; i++) {
      this.ctx.fillRect(x + Math.floor(6 * scale), y + Math.floor(5 * scale) + i * Math.floor(6 * scale), Math.floor(10 * scale), 1);
    }

    this.ctx.fillStyle = '#8B4513';
    this.ctx.fillRect(x + w - 5, y + Math.floor(20 * scale), 5, Math.floor(20 * scale));

    this.ctx.fillStyle = '#A0522D';
    this.ctx.fillRect(x + w - 4, y + Math.floor(22 * scale), 3, Math.floor(16 * scale));

    this.ctx.fillStyle = '#CD853F';
    this.ctx.fillRect(x + w - 3, y + Math.floor(24 * scale), 2, Math.floor(12 * scale));

    this.ctx.fillStyle = '#0a0a0a';
    this.ctx.fillRect(x + w, y, depth, h);

    this.ctx.fillStyle = '#1a1a1a';
    this.ctx.fillRect(x + w + 1, y + 1, depth - 2, h - 2);

    this.ctx.fillStyle = '#2a2a2a';
    this.ctx.fillRect(x + w + 2, y + 2, depth - 4, h - 4);
  }

  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 78, g: 205, b: 196 };
  }

  hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash;
  }

  renderPlayers() {
    this.players.forEach(player => {
      if (player.room !== this.currentRoom.roomId) return;
      if (this.localPlayer && player.id === this.localPlayer.id) return;

      let playerX = player.x;
      let playerY = player.y;
      let isSitting = false;

      for (const seat of this.cinemaSeats) {
        if (seat.occupied && seat.userId === player.id) {
          playerX = seat.x;
          playerY = seat.y - 10;
          isSitting = true;
          break;
        }
      }

      const direction = player.direction || 'down';
      const frame = player.isMoving ? Math.floor(Date.now() / (1000 / this.animationSpeed)) % 3 : 0;
      const sprite = this.createCharacterSprite(player.color, direction, frame, false, player);

      this.ctx.imageSmoothingEnabled = false;
      const spriteSize = isSitting ? 36 : 48;
      const spriteOffset = isSitting ? 18 : 24;
      this.ctx.drawImage(sprite, playerX - spriteOffset, playerY - spriteOffset, spriteSize, spriteSize);

      this.ctx.fillStyle = '#fff';
      this.ctx.font = 'bold 11px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.strokeStyle = '#000';
      this.ctx.lineWidth = 2;
      this.ctx.strokeText(player.username, playerX, playerY - 30);
      this.ctx.fillText(player.username, playerX, playerY - 30);
    });

    if (this.localPlayer && this.localPlayer.room === this.currentRoom.roomId) {
      let playerX = this.localPlayer.x;
      let playerY = this.localPlayer.y;
      let isSitting = false;

      if (this.sittingOnSeat !== null && this.cinemaSeats[this.sittingOnSeat]) {
        const seat = this.cinemaSeats[this.sittingOnSeat];
        playerX = seat.x;
        playerY = seat.y - 10;
        isSitting = true;
      }

      const direction = this.localPlayer.direction || 'down';
      const frame = this.localPlayer.isMoving ? this.animationFrame : 0;
      const sprite = this.createCharacterSprite(this.localPlayer.color, direction, frame, true, this.localPlayer);

      this.ctx.imageSmoothingEnabled = false;
      const spriteSize = isSitting ? 36 : 48;
      const spriteOffset = isSitting ? 18 : 24;
      this.ctx.drawImage(sprite, playerX - spriteOffset, playerY - spriteOffset, spriteSize, spriteSize);

      this.ctx.fillStyle = '#fff';
      this.ctx.font = 'bold 11px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.strokeStyle = '#000';
      this.ctx.lineWidth = 2;
      this.ctx.strokeText(this.localPlayer.username, playerX, playerY - 30);
      this.ctx.fillText(this.localPlayer.username, playerX, playerY - 30);
    }
  }
}
