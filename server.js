import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createProxyMiddleware } from 'http-proxy-middleware';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8080';

// 代理 API 请求到 Flask 后端
app.use('/api', createProxyMiddleware({
  target: BACKEND_URL,
  changeOrigin: true,
  logLevel: 'debug'
}));

// 静态文件目录指向 build 后的 dist 文件夹
app.use(express.static(path.join(__dirname, 'dist')));

// 所有的路由都指向 index.html (支持 SPA 路由)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Frontend server is running on http://localhost:${PORT}`);
  console.log(`Proxying /api to ${BACKEND_URL}`);
});
