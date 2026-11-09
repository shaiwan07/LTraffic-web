const spec = require('./ltraffic-openapi.json');
for (const [path, item] of Object.entries(spec.paths)) {
  for (const method of ['get','post','put','patch','delete']) {
    const op = item[method];
    if (op) console.log(`${method.toUpperCase().padEnd(6)} /api/v1${path} | ${op.tags?.join(', ')} | ${op.summary || op.operationId || ''}`);
  }
}
