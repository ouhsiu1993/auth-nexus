require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors'); // ✅ 補上
const helmet = require('helmet');
const morgan = require('morgan');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// 路由
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const tenantRoutes = require('./routes/tenantRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ CORS 設定
const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? process.env.SITE_URL
    : 'http://localhost:5173',
    
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-tenant-id'],
  credentials: true,
};

// ✅ Middleware
app.use(helmet());
app.use(cors(corsOptions)); // ✅ 只保留這一個
app.use(express.json());
app.use(morgan('dev'));

// ✅ Swagger
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Auth-Nexus API',
      version: '1.0.0',
      description: '多工作區認證系統 API 文件',
    },
    servers: [
      {
        url: process.env.SITE_URL || `http://localhost:${PORT}`,
        description: 'API 伺服器',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/routes/*.js'],
};
const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// ✅ API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tenants', tenantRoutes);

// ✅ 全域錯誤處理
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    code: 'SERVER_ERROR',
    message: '伺服器內部錯誤',
    data: process.env.NODE_ENV === 'development' ? err.message : null,
  });
});

// ✅ MongoDB 連線與啟動伺服器
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB 連接成功');
    app.listen(PORT, () => {
      console.log(`🚀 伺服器運行於 http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB 連接失敗:', err.message);
    process.exit(1);
  });

// 用於生產環境，處理 SPA 路由
if (process.env.NODE_ENV === 'production') {
  const path = require('path');
  // 靜態檔案服務
  app.use(express.static(path.join(__dirname, '../client/dist')));
  
  // 所有未匹配的路由返回 index.html
  app.get('*', (req, res) => {
    // 檢查請求是否是 API 路由
    if (!req.originalUrl.startsWith('/api/')) {
      res.sendFile(path.join(__dirname, '../client/dist/index.html'));
    } else {
      res.status(404).json({
        code: 'NOT_FOUND',
        message: 'API 端點不存在',
        data: null,
      });
    }
  });
}