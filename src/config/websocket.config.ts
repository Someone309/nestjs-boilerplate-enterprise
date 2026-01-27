import { registerAs } from '@nestjs/config';

/**
 * WebSocket Configuration
 *
 * Environment variables:
 * - WEBSOCKET_ENABLED: Enable/disable WebSocket (default: true)
 * - WEBSOCKET_CORS_ORIGIN: Allowed origins (comma-separated)
 * - WEBSOCKET_PING_TIMEOUT: Ping timeout in ms (default: 5000)
 * - WEBSOCKET_PING_INTERVAL: Ping interval in ms (default: 25000)
 * - WEBSOCKET_MAX_PAYLOAD: Max payload size in bytes (default: 1MB)
 * - WEBSOCKET_TRANSPORTS: Transports (comma-separated: websocket,polling)
 */
export const websocketConfig = registerAs('websocket', () => ({
  enabled: process.env.WEBSOCKET_ENABLED !== 'false',
  cors: {
    origin: process.env.WEBSOCKET_CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
    credentials: true,
  },
  pingTimeout: parseInt(process.env.WEBSOCKET_PING_TIMEOUT || '5000', 10),
  pingInterval: parseInt(process.env.WEBSOCKET_PING_INTERVAL || '25000', 10),
  maxPayload: parseInt(process.env.WEBSOCKET_MAX_PAYLOAD || '1048576', 10), // 1MB
  transports: (process.env.WEBSOCKET_TRANSPORTS?.split(',') as ('websocket' | 'polling')[]) || [
    'websocket',
    'polling',
  ],
}));

export type WebSocketConfig = ReturnType<typeof websocketConfig>;
