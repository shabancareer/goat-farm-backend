import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type OrganisationDocument = Organisation & Document;

@Schema({ timestamps: true, collection: 'organisations' })

export class Organisation {
    @Prop({ required: true, unique: true, trim: true })
    name: string;

    @Prop({ type: Types.ObjectId, ref: 'User', default: null })
    superOwnerId: Types.ObjectId;

    @Prop({ default: true })
    isActive: boolean;
}

export const OrganisationSchema = SchemaFactory.createForClass(Organisation);
