import type { Claims } from "@auth0/nextjs-auth0";

export type User = {
  name: string;
  picture: string;
};

export function parseSession(session?: Claims | null): User | undefined {
  const user = session?.["user"];

  if (user == null) return undefined;

  return {
    name: user.name ?? "Guest",
    picture: user.picture ?? user.image ?? "",
  };
}
