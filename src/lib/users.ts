import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import { verifyPassword } from "./auth";

const DATA_DIR = join(process.cwd(), "data");
const USERS_FILE = join(DATA_DIR, "users.json");

export interface User {
  id: string;
  email: string;
  name: string;
  password: string;
  provider: "email" | "x";
  xHandle?: string;
  walletAddress?: string;
  createdAt: string;
}

function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadUsers(): User[] {
  ensureDataDir();
  if (!existsSync(USERS_FILE)) return [];
  try {
    const raw = readFileSync(USERS_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveUsers(users: User[]) {
  ensureDataDir();
  writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

export function authenticateUser(email: string, password: string): User | null {
  const users = loadUsers();
  const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!user) return null;
  if (!verifyPassword(password, user.password)) return null;
  return user;
}

export function findUserById(id: string): User | null {
  const users = loadUsers();
  return users.find((u) => u.id === id) || null;
}

export function findUserByEmail(email: string): User | null {
  const users = loadUsers();
  return users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
}

export function sanitizeUser(user: User) {
  const { password, ...safe } = user;
  return safe;
}

export function linkWallet(userId: string, walletAddress: string): User | null {
  const users = loadUsers();
  const user = users.find((u) => u.id === userId);
  if (!user) return null;
  user.walletAddress = walletAddress.toLowerCase();
  saveUsers(users);
  return user;
}
