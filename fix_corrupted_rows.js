const fs = require('fs');

const content = fs.readFileSync('./public/peanut_sprite_data.js', 'utf8');
const match = content.match(/const peanutSpriteData = ({[\s\S]*});/);
const objectContent = match[1].trim().replace(/;$/, '');
const data = eval('(' + objectContent + ')');

function fixRow(row, targetLength) {
  const currentLength = row.length;
  if (currentLength < targetLength) {
    const padding = targetLength - currentLength;
    for (let i = 0; i < padding; i++) {
      row.push('#191929');
    }
  } else if (currentLength > targetLength) {
    row.length = targetLength;
  }
  return row;
}

const directions = ['down', 'up', 'left', 'right'];
directions.forEach(dir => {
  console.log(`Fixing ${dir} direction...`);
  const pixels = data[dir].pixels;
  
  for (let i = 0; i < pixels.length; i++) {
    if (pixels[i].length !== 59) {
      console.log(`  Row ${i+1}: ${pixels[i].length} -> 59`);
      fixRow(pixels[i], 59);
    }
  }
});

const output = `const peanutSpriteData = ${JSON.stringify(data, null, 2)};`;
fs.writeFileSync('./public/peanut_sprite_data.js', output);

console.log('\nFixed peanut_sprite_data.js created successfully');

const newContent = fs.readFileSync('./public/peanut_sprite_data.js', 'utf8');
const newMatch = newContent.match(/const peanutSpriteData = ({[\s\S]*});/);
const newObjectContent = newMatch[1].trim().replace(/;$/, '');
const newData = eval('(' + newObjectContent + ')');

directions.forEach(dir => {
  const pixels = newData[dir].pixels;
  let bad = 0;
  for (let i = 0; i < pixels.length; i++) {
    if (pixels[i].length !== 59) {
      bad++;
    }
  }
  console.log(`${dir}: ${bad} bad rows`);
});
