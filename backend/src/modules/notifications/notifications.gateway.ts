import { JwtService } from '@nestjs/jwt';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '../../database/prisma/prisma.service';

@WebSocketGateway({
  cors: {
    origin: true,
    credentials: true,
  },
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const authToken = client.handshake.auth?.token;
      const headerAuth = client.handshake.headers?.authorization;
      const rawToken =
        typeof authToken === 'string' && authToken
          ? authToken
          : typeof headerAuth === 'string' && headerAuth.startsWith('Bearer ')
            ? headerAuth.slice(7)
            : null;

      if (!rawToken) {
        client.disconnect();
        return;
      }

      const payload = await this.jwtService.verifyAsync<{ sub: string }>(
        rawToken,
      );
      if (!payload?.sub) {
        client.disconnect();
        return;
      }

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, isActive: true },
      });

      if (!user || !user.isActive) {
        client.disconnect();
        return;
      }

      client.data.userId = user.id;
      await client.join(this.getUserRoom(user.id));
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    if (client.data?.userId) {
      client.leave(this.getUserRoom(client.data.userId));
    }
  }

  sendNotificationToUser(userId: string, notification: unknown) {
    if (!this.server) return;
    this.server.to(this.getUserRoom(userId)).emit('notification:new', notification);
  }

  private getUserRoom(userId: string) {
    return `user:${userId}`;
  }
}
