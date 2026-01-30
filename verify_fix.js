const fs = require('fs');
const vm = require('vm');

const context = vm.createContext({});
vm.runInContext(fs.readFileSync('./public/peanut_sprite_data.js', 'utf8'), context);

console.log('Down direction row 13 length:', context.peanutSpriteData.down.pixels[12].length);
console.log('Up direction row 13 length:', context.peanutSpriteData.up.pixels[12].length);
console.log('Left direction row 13 length:', context.peanutSpriteData.left.pixels[12].length);
console.log('Right direction row 13 length:', context.peanutSpriteData.right.pixels[12].length);
console.log('All directions have correct row 13 length:', 
  context.peanutSpriteData.down.pixels[12].length === 59 &&
  context.peanutSpriteData.up.pixels[12].length === 59 &&
  context.peanutSpriteData.left.pixels[12].length === 59 &&
  context.peanutSpriteData.right.pixels[12].length === 59
);
