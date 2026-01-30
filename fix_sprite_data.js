const fs = require('fs');

const backupFileContent = fs.readFileSync('./public/peanut_sprite_data.js.bak', 'utf8');
const moduleContent = backupFileContent.replace('const peanutSpriteData = ', 'module.exports = ');
fs.writeFileSync('./temp_backup_module.js', moduleContent);
const peanutSpriteData = require('./temp_backup_module.js');
fs.unlinkSync('./temp_backup_module.js');

const multiDirectionData = {
  down: {
    width: peanutSpriteData.width,
    height: peanutSpriteData.height,
    pixels: JSON.parse(JSON.stringify(peanutSpriteData.pixels))
  },
  up: {
    width: peanutSpriteData.width,
    height: peanutSpriteData.height,
    pixels: JSON.parse(JSON.stringify(peanutSpriteData.pixels))
  },
  left: {
    width: peanutSpriteData.width,
    height: peanutSpriteData.height,
    pixels: JSON.parse(JSON.stringify(peanutSpriteData.pixels))
  },
  right: {
    width: peanutSpriteData.width,
    height: peanutSpriteData.height,
    pixels: JSON.parse(JSON.stringify(peanutSpriteData.pixels))
  }
};

const output = `const peanutSpriteData = ${JSON.stringify(multiDirectionData, null, 2)};`;

fs.writeFileSync('./public/peanut_sprite_data.js', output);

console.log('Fixed peanut_sprite_data.js created successfully');
console.log(`Width: ${peanutSpriteData.width}, Height: ${peanutSpriteData.height}`);
console.log(`Total rows: ${peanutSpriteData.pixels.length}`);
console.log(`Row 13 length: ${peanutSpriteData.pixels[12].length}`);
