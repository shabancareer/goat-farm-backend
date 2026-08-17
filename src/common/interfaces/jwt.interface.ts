import { Role, Permission } from '../enums/role.enum';

// ── JWT token payload (embedded in both access and refresh tokens) ────────────
export interface JwtPayload {
    sub: string;           // MongoDB user _id as string
    email: string;
    role: Role;
    orgId?: string;           // Organisation _id as string
    isSuperOwner: boolean;
    type: 'access' | 'refresh';
    jti?: string;           // unique id — present only on refresh tokens
    iat?: number;
    exp?: number;
}

// ── The user object attached to req.user after guard validation ───────────────
export interface RequestUser {
    id: string;
    email: string;
    name: string;
    role: Role;
    orgId?: string;
    isSuperOwner: boolean;
    permissions: Permission[];
    phone?: string;
    photoUrl?: string;
    isAvailable: boolean;
    statusMessage?: string;
}

// ── Token pair returned to the client ─────────────────────────────────────────
export interface TokenPair {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;   // seconds until accessToken expires
}