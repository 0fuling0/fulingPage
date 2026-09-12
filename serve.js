/* 临时静态服务器（性能测试用） */
const http = require('http'), fs = require('fs'), path = require('path');
http.createServer((req, res) => {
    let p = path.join(__dirname, decodeURIComponent(req.url.split('?')[0]));
    if (p.endsWith(path.sep) || p.endsWith('/')) p = path.join(p, 'index.html');
    fs.readFile(p, (e, d) => {
        if (e) { res.writeHead(404); res.end('404'); return; }
        const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png', '.md': 'text/markdown' };
        res.writeHead(200, { 'Content-Type': types[path.extname(p)] || 'application/octet-stream' });
        res.end(d);
    });
}).listen(8765, '127.0.0.1');
