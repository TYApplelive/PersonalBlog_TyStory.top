declare module "#auth-utils" {
  interface User {
    id: string;
    username: string;
    displayName: string;
    role: "admin" | "user";
  }

  interface UserSession {
    loggedInAt?: string;
  }
}

export {};
