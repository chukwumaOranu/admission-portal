import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

const getApiBaseUrl = () => {
  const configuredUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
  return configuredUrl.replace(/\/$/, '');
};

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        try {
          const apiBaseUrl = getApiBaseUrl();
          const res = await fetch(`${apiBaseUrl}/users/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              username: credentials.username,
              password: credentials.password,
            }),
          });

          const contentType = res.headers.get('content-type') || '';
          const responseText = await res.text();
          let data = null;

          if (contentType.includes('application/json')) {
            data = JSON.parse(responseText);
          } else {
            const snippet = responseText.slice(0, 200).replace(/\s+/g, ' ').trim();
            throw new Error(
              `Login API returned non-JSON response (${res.status} ${res.statusText}) from ${apiBaseUrl}/users/login: ${snippet}`
            );
          }

          if (res.ok && data.success && data.data && data.data.user) {
            return {
              id: data.data.user.id,
              username: data.data.user.username,
              email: data.data.user.email,
              role: data.data.user.role_name,
              roleId: data.data.user.role_id,
              permissions: data.data.user.permissions || [],
              isActive: Boolean(data.data.user.is_active),
              emailVerified: Boolean(data.data.user.email_verified),
            };
          }

          if (!res.ok) {
            console.error('Login API rejected credentials:', {
              status: res.status,
              statusText: res.statusText,
              body: data
            });
          }

          return null;
        } catch (error) {
          console.error('NextAuth authorize error:', error);
          return null;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.username = user.username;
        token.role = user.role;
        token.roleId = user.roleId;
        token.permissions = user.permissions;
        token.isActive = user.isActive;
        token.emailVerified = user.emailVerified;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub;
        session.user.username = token.username;
        session.user.role = token.role;
        session.user.roleId = token.roleId;
        session.user.permissions = token.permissions;
        session.user.isActive = token.isActive;
        session.user.emailVerified = token.emailVerified;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export default NextAuth(authOptions);
