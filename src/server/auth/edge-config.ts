import { authConfig } from "./config";
import NextAuth from "next-auth";

// Buat versi ringan khusus untuk Edge Runtime
export const edgeAuthConfig = {
  ...authConfig,
  adapter: undefined, // PrismaAdapter berat, tidak perlu di middleware
  providers: [], // CredentialsProvider berat, tidak perlu di middleware
  callbacks: {
    ...authConfig.callbacks,
    authorized: authConfig.callbacks?.authorized, // hanya authorized
  },
};

export default NextAuth(edgeAuthConfig).auth;
