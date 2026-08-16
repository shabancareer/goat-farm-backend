import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Role } from '../../../common/enums/role.enum';

export type UserDocument = User & Document;

@Schema({
    timestamps: true,
    collection: 'users',
})
export class User {

    // ─────────────────────────────────────────
    // Identity
    // ─────────────────────────────────────────

    @Prop({
        required: true,
        trim: true,
    })
    name: string;

    @Prop({
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    })
    email: string;

    @Prop({
        required: true,
        select: false,
    })
    password: string;


    // ─────────────────────────────────────────
    // Account Status
    // ─────────────────────────────────────────

    @Prop({ default: true })
    isActive: boolean;

    @Prop({ default: false })
    isDeleted: boolean;

    @Prop({ default: null })
    deletedAt: Date;

    @Prop({
        type: Types.ObjectId,
        ref: 'User',
        default: null,
    })
    deletedBy: Types.ObjectId;


    // ─────────────────────────────────────────
    // Email Verification
    // ─────────────────────────────────────────

    @Prop({ default: false })
    isEmailVerified: boolean;

    @Prop({
        type: String,
        default: null,
        select: false,
    })
    emailVerificationTokenHash: string | null;

    @Prop({
        type: Date,
        default: null,
        select: false,
    })
    emailVerificationExpiresAt: Date | null;

    @Prop({
        type: Date,
        default: null,
    })
    emailVerifiedAt: Date | null;


    // ─────────────────────────────────────────
    // RBAC
    // ─────────────────────────────────────────

    @Prop({
        type: String,
        enum: Role,
        default: Role.VIEWER,
    })
    role: Role;

    @Prop({ default: false })
    isSuperOwner: boolean;


    // ─────────────────────────────────────────
    // Organisation
    // ─────────────────────────────────────────

    @Prop({
        type: Types.ObjectId,
        ref: 'Organisation',
        required: true,
    })
    orgId: Types.ObjectId;

    @Prop({
        type: Types.ObjectId,
        ref: 'User',
        default: null,
    })
    createdBy: Types.ObjectId;


    // ─────────────────────────────────────────
    // Profile
    // ─────────────────────────────────────────

    @Prop({ default: null })
    phone: string;

    @Prop({ default: null })
    photoUrl: string;

    @Prop({ default: true })
    isAvailable: boolean;

    @Prop({
        default: null,
        maxlength: 120,
    })
    statusMessage: string;


    // ─────────────────────────────────────────
    // Security
    // ─────────────────────────────────────────

    @Prop({
        default: null,
        select: false,
    })
    refreshTokenHash: string;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Useful indexes
UserSchema.index({ orgId: 1 });
// UserSchema.index({ email: 1 }, { unique: true });
