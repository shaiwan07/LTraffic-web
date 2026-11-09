const spec = require('./ltraffic-openapi.json');
const paths = process.argv.slice(2);
for (const path of paths) {
  console.log(`\nPATH ${path}`);
  const item = spec.paths[path];
  for (const method of ['get','post','put','patch','delete']) {
    if (!item?.[method]) continue;
    const op = item[method];
    console.log(JSON.stringify({ method, summary: op.summary, requestBody: op.requestBody?.content?.['application/json']?.schema, responses: op.responses, security: op.security }, null, 2));
  }
}
