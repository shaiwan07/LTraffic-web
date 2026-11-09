const fs = require('fs');
const source = fs.readFileSync('swagger-ui-init.js', 'utf8');
const marker = '"swaggerDoc":';
const start = source.indexOf(marker) + marker.length;
let index = source.indexOf('{', start);
let depth = 0;
let end = -1;
for (let i = index; i < source.length; i++) {
  if (source[i] === '{') depth++;
  if (source[i] === '}') {
    depth--;
    if (depth === 0) { end = i + 1; break; }
  }
}
const spec = JSON.parse(source.slice(index, end));
fs.writeFileSync('ltraffic-openapi.json', JSON.stringify(spec, null, 2));
console.log(`${Object.keys(spec.paths).length} paths`);
console.log(Object.keys(spec.paths).filter((path) => /auth|admin|contact|privacy|page/i.test(path)).join('\n'));
