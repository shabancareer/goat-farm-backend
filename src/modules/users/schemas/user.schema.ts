import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Role } from '../../../common/enums/role.enum';

export type UserDocument = User & Document;

@Schema({ timestamps: true, collection: 'users' })
export class User {
    // ── Identity ───────────────────────────────────────────────────────────────
    @Prop({ required: true, trim: true })
    name: string;

    @Prop({ required: true, unique: true, lowercase: true, trim: true })
    email: string;

    @Prop({ required: true, select: false }) // never returned in queries
    password: string;

    // ── RBAC ───────────────────────────────────────────────────────────────────
    @Prop({ type: String, enum: Role, default: Role.VIEWER })
    role: Role;
    /**
     * Permanent flag set only on the account created at software purchase.
     * Cannot be changed via API — requires direct DB intervention.
     */
    @Prop({ default: false })
    isSuperOwner: boolean;

    @Prop({ default: true })
    isActive: boolean;

    // ── Organisation ───────────────────────────────────────────────────────────
    @Prop({ type: Types.ObjectId, ref: 'Organisation', required: true })
    orgId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'User', default: null })
    createdBy: Types.ObjectId;

    // ── Profile ────────────────────────────────────────────────────────────────
    @Prop({ default: null })
    phone: string;

    @Prop({ default: null })
    photoUrl: string;

    /** true = available (green dot), false = unavailable/busy */
    @Prop({ default: true })
    isAvailable: boolean;

    @Prop({ default: null, maxlength: 120 })
    statusMessage: string;

    // ── Security — refresh token hash ─────────────────────────────────────────
    /**
     * bcrypt hash of the current active refresh token.
     * Null means no active session on this record.
     * Stored here (vs separate collection) for simplicity.
     * For multi-device support, move to a separate RefreshToken collection.
     */
    @Prop({ default: null, select: false })
    refreshTokenHash: string;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Useful indexes
UserSchema.index({ orgId: 1 });
// UserSchema.index({ email: 1 }, { unique: true });
