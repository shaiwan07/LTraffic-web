const spec = require('./ltraffic-openapi.json');
for (const name of process.argv.slice(2)) {
  console.log(`\nSCHEMA ${name}`);
  console.log(JSON.stringify(spec.components?.schemas?.[name], null, 2));
}
