/**
 * JWT Type Augmentation
 */

declare module '@fastify/jwt' {
  interface FastifyJWT {
    user: {
      user_id: string;
      username: string;
      email?: string;
      is_admin?: boolean;
    };
  }
}

export {};
