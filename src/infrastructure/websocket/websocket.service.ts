import { Injectable, Inject } from '@nestjs/common';
import type { Server, Socket } from 'socket.io';
import { type ILogger, LOGGER } from '@core/domain/ports/services';

export interface BroadcastOptions {
  room?: string;
  except?: string[];
  volatile?: boolean;
}

export interface NotificationPayload {
  id: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  createdAt: Date;
  read?: boolean;
}

/**
 * WebSocket Service
 *
 * Provides methods for broadcasting events and managing connections.
 */
@Injectable()
export class WebSocketService {
  private server: Server | null = null;

  constructor(@Inject(LOGGER) private readonly logger: ILogger) {}

  /**
   * Set the Socket.io server instance
   */
  setServer(server: Server): void {
    this.server = server;
    this.logger.info('WebSocket server initialized');
  }

  /**
   * Get the Socket.io server instance
   */
  getServer(): Server | null {
    return this.server;
  }

  /**
   * Emit event to all connected clients
   */
  emitToAll(event: string, data: unknown): void {
    if (!this.server) {
      this.logger.warn('WebSocket server not initialized');
      return;
    }
    this.server.emit(event, data);
  }

  /**
   * Emit event to a specific room
   */
  emitToRoom(room: string, event: string, data: unknown): void {
    if (!this.server) {
      this.logger.warn('WebSocket server not initialized');
      return;
    }
    this.server.to(room).emit(event, data);
  }

  /**
   * Emit event to a specific user
   */
  emitToUser(userId: string, event: string, data: unknown): void {
    this.emitToRoom(`user:${userId}`, event, data);
  }

  /**
   * Emit event to all users in a tenant
   */
  emitToTenant(tenantId: string, event: string, data: unknown): void {
    this.emitToRoom(`tenant:${tenantId}`, event, data);
  }

  /**
   * Send notification to a specific user
   */
  sendNotification(userId: string, notification: NotificationPayload): void {
    this.emitToUser(userId, 'notification', notification);
    this.logger.debug('Notification sent', { userId, type: notification.type });
  }

  /**
   * Send notification to all users in a tenant
   */
  sendTenantNotification(tenantId: string, notification: NotificationPayload): void {
    this.emitToTenant(tenantId, 'notification', notification);
    this.logger.debug('Tenant notification sent', { tenantId, type: notification.type });
  }

  /**
   * Broadcast with options
   */
  broadcast(event: string, data: unknown, options: BroadcastOptions = {}): void {
    if (!this.server) {
      this.logger.warn('WebSocket server not initialized');
      return;
    }

    let emitter = options.room ? this.server.to(options.room) : this.server;

    if (options.except && options.except.length > 0) {
      for (const socketId of options.except) {
        emitter = emitter.except(socketId);
      }
    }

    if (options.volatile) {
      emitter.volatile.emit(event, data);
    } else {
      emitter.emit(event, data);
    }
  }

  /**
   * Get connected socket by ID
   */
  async getSocket(socketId: string): Promise<Socket | undefined> {
    if (!this.server) {
      return undefined;
    }
    const sockets = await this.server.fetchSockets();
    return sockets.find((s) => s.id === socketId) as unknown as Socket | undefined;
  }

  /**
   * Get all sockets in a room
   */
  async getSocketsInRoom(room: string): Promise<string[]> {
    if (!this.server) {
      return [];
    }
    const sockets = await this.server.in(room).fetchSockets();
    return sockets.map((s) => s.id);
  }

  /**
   * Get room count
   */
  async getRoomSize(room: string): Promise<number> {
    const sockets = await this.getSocketsInRoom(room);
    return sockets.length;
  }

  /**
   * Disconnect a specific socket
   */
  async disconnectSocket(socketId: string, close = false): Promise<void> {
    const socket = await this.getSocket(socketId);
    if (socket) {
      socket.disconnect(close);
    }
  }

  /**
   * Disconnect all sockets for a user
   */
  async disconnectUser(userId: string): Promise<void> {
    const socketIds = await this.getSocketsInRoom(`user:${userId}`);
    for (const socketId of socketIds) {
      await this.disconnectSocket(socketId, true);
    }
    this.logger.info('User disconnected from all sockets', { userId });
  }
}
