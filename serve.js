/* 临时静态服务器（性能测试用，带 gzip 压缩与异常兜底） */
const http = require('http'), fs = require('fs'), path = require('path'), zlib = require('zlib');
process.on('uncaughtException', e => { try { fs.appendFileSync(__dirname + '/serve.log', new Date().toISOString() + ' ' + String(e && e.stack || e) + '\n'); } catch {} });
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png', '.ico': 'image/x-icon', '.md': 'text/markdown', '.svg': 'image/svg+xml' };
const COMPRESSIBLE = new Set(['text/html', 'text/javascript', 'text/css', 'application/json', 'text/markdown', 'image/svg+xml']);
http.createServer((req, res) => {
    let p = path.join(__dirname, decodeURIComponent(req.url.split('?')[0]));
    if (p.endsWith(path.sep) || p.endsWith('/')) p = path.join(p, 'index.html');
    fs.readFile(p, (e, d) => {
        if (e) { res.writeHead(404); res.end('404'); return; }
        const type = TYPES[path.extname(p)] || 'application/octet-stream';
        if (COMPRESSIBLE.has(type) && (req.headers['accept-encoding'] || '').includes('gzip')) {
            zlib.gzip(d, (e2, gz) => {
                if (e2) { res.writeHead(200, { 'Content-Type': type }); res.end(d); return; }
                res.writeHead(200, { 'Content-Type': type, 'Content-Encoding': 'gzip' });
                res.end(gz);
            });
            return;
        }
        res.writeHead(200, { 'Content-Type': type });
        res.end(d);
    });
}).listen(8765, '127.0.0.1');
