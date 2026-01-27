import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Server, Socket } from 'socket.io';
import { type ILogger, LOGGER } from '@core/domain/ports/services';
import { WebSocketService } from '../websocket.service';
import { PresenceService } from '../presence.service';
import type { WebSocketConfig } from '@config/websocket.config';
import { JwtService } from '@nestjs/jwt';

interface AuthenticatedSocket extends Socket {
  data: {
    userId?: string;
    tenantId?: string;
    roles?: string[];
  };
}

interface JoinRoomPayload {
  room: string;
}

interface LeaveRoomPayload {
  room: string;
}

interface StatusUpdatePayload {
  status: 'online' | 'away' | 'busy';
}

interface TypingPayload {
  room: string;
  isTyping: boolean;
}

/**
 * Notification Gateway
 *
 * Main WebSocket gateway for real-time notifications and events.
 */
@WebSocketGateway({
  namespace: '/notifications',
  cors: {
    origin: true,
    credentials: true,
  },
})
export class NotificationGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  constructor(
    @Inject(LOGGER) private readonly logger: ILogger,
    private readonly configService: ConfigService,
    private readonly webSocketService: WebSocketService,
    private readonly presenceService: PresenceService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Initialize gateway
   */
  afterInit(server: Server): void {
    const config = this.configService.get<WebSocketConfig>('websocket');

    if (config) {
      server.engine.opts.pingTimeout = config.pingTimeout;
      server.engine.opts.pingInterval = config.pingInterval;
    }

    this.webSocketService.setServer(server);
    this.logger.info('WebSocket Notification Gateway initialized');
  }

  /**
   * Handle new connection
   */
  async handleConnection(client: AuthenticatedSocket): Promise<void> {
    try {
      // Extract token from handshake
      const authToken = (client.handshake.auth as { token?: string } | undefined)?.token;
      const headerToken = client.handshake.headers.authorization?.replace('Bearer ', '');
      const token = authToken || headerToken;

      if (!token) {
        this.logger.warn('WebSocket connection rejected: No token provided', {
          socketId: client.id,
        });
        client.emit('error', { message: 'Authentication required' });
        client.disconnect();
        return;
      }

      // Verify JWT token
      const payload = await this.verifyToken(token);
      if (!payload) {
        this.logger.warn('WebSocket connection rejected: Invalid token', {
          socketId: client.id,
        });
        client.emit('error', { message: 'Invalid token' });
        client.disconnect();
        return;
      }

      // Store user info in socket data
      client.data.userId = payload.sub;
      client.data.tenantId = payload.tenantId;
      client.data.roles = payload.roles;

      // Join user-specific room
      await client.join(`user:${payload.sub}`);

      // Join tenant room if applicable
      if (payload.tenantId) {
        await client.join(`tenant:${payload.tenantId}`);
      }

      // Set user as online
      await this.presenceService.setOnline(payload.sub, client.id);

      // Notify others about user coming online
      this.server.to(`tenant:${payload.tenantId}`).emit('presence:update', {
        userId: payload.sub,
        status: 'online',
        timestamp: new Date(),
      });

      this.logger.info('WebSocket client connected', {
        socketId: client.id,
        userId: payload.sub,
        tenantId: payload.tenantId,
      });

      // Send connection success
      client.emit('connected', {
        socketId: client.id,
        userId: payload.sub,
        timestamp: new Date(),
      });
    } catch (error) {
      this.logger.error('WebSocket connection error', error as Error, {
        socketId: client.id,
      });
      client.emit('error', { message: 'Connection failed' });
      client.disconnect();
    }
  }

  /**
   * Handle disconnection
   */
  async handleDisconnect(client: AuthenticatedSocket): Promise<void> {
    const userId = client.data.userId;
    const tenantId = client.data.tenantId;

    if (userId) {
      // Set user as offline
      await this.presenceService.setOffline(userId);

      // Notify others about user going offline
      if (tenantId) {
        this.server.to(`tenant:${tenantId}`).emit('presence:update', {
          userId,
          status: 'offline',
          timestamp: new Date(),
        });
      }
    }

    this.logger.info('WebSocket client disconnected', {
      socketId: client.id,
      userId,
    });
  }

  /**
   * Handle join room request
   */
  @SubscribeMessage('join:room')
  async handleJoinRoom(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: JoinRoomPayload,
  ): Promise<{ success: boolean; room: string }> {
    const { room } = payload;

    // Validate room access (prevent joining other users' private rooms)
    if (room.startsWith('user:') && room !== `user:${client.data.userId}`) {
      return { success: false, room };
    }

    if (room.startsWith('tenant:') && room !== `tenant:${client.data.tenantId}`) {
      return { success: false, room };
    }

    await client.join(room);
    this.logger.debug('Client joined room', {
      socketId: client.id,
      room,
    });

    return { success: true, room };
  }

  /**
   * Handle leave room request
   */
  @SubscribeMessage('leave:room')
  async handleLeaveRoom(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: LeaveRoomPayload,
  ): Promise<{ success: boolean; room: string }> {
    const { room } = payload;

    // Don't allow leaving user's own room
    if (room === `user:${client.data.userId}`) {
      return { success: false, room };
    }

    await client.leave(room);
    this.logger.debug('Client left room', {
      socketId: client.id,
      room,
    });

    return { success: true, room };
  }

  /**
   * Handle status update
   */
  @SubscribeMessage('presence:status')
  async handleStatusUpdate(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: StatusUpdatePayload,
  ): Promise<{ success: boolean }> {
    const userId = client.data.userId;
    const tenantId = client.data.tenantId;

    if (!userId) {
      return { success: false };
    }

    await this.presenceService.updateStatus(userId, payload.status);

    // Broadcast status change to tenant
    if (tenantId) {
      this.server.to(`tenant:${tenantId}`).emit('presence:update', {
        userId,
        status: payload.status,
        timestamp: new Date(),
      });
    }

    return { success: true };
  }

  /**
   * Handle typing indicator
   */
  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: TypingPayload,
  ): void {
    const userId = client.data.userId;
    if (!userId) {
      return;
    }

    client.to(payload.room).emit('typing', {
      userId,
      isTyping: payload.isTyping,
      room: payload.room,
    });
  }

  /**
   * Handle heartbeat/ping
   */
  @SubscribeMessage('heartbeat')
  async handleHeartbeat(
    @ConnectedSocket() client: AuthenticatedSocket,
  ): Promise<{ timestamp: Date }> {
    const userId = client.data.userId;
    if (userId) {
      await this.presenceService.heartbeat(userId);
    }
    return { timestamp: new Date() };
  }

  /**
   * Verify JWT token
   */
  private async verifyToken(
    token: string,
  ): Promise<{ sub: string; tenantId?: string; roles?: string[] } | null> {
    try {
      const payload = await this.jwtService.verifyAsync<{
        sub: string;
        tenantId?: string;
        roles?: string[];
      }>(token);
      return payload;
    } catch {
      return null;
    }
  }
}
