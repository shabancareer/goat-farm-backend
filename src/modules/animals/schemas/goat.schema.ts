import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Goat extends Document {

    @Prop({ type: Types.ObjectId, ref: 'Organisation', required: true })
    orgId: Types.ObjectId;

    @Prop({ required: true })
    animalName: string;

    @Prop({ required: true, enum: ['Male', 'Female'] })
    gender: string;

    @Prop({ required: true, enum: ['Own', 'Purchase'] })
    purchaseType: string;

    @Prop({ required: false })
    dateOfBirth: Date;

    @Prop({ default: false })
    isEstimatedDOB: boolean;

    @Prop({ required: false })
    purchaseDate: Date;

    @Prop({ required: false, enum: ['BUK', 'Wether', 'Doe'] })
    type: string;

    @Prop({ required: false, enum: [1, 2, 3, 4, 5] })
    kiddingCapacity: number;

    @Prop({ required: true })
    tagId: number;

    @Prop({ required: true })
    weight: number;

    @Prop({ required: true, enum: ['Beetal', 'Teddy', 'Nachi', 'Dera Din Panah (DDP)', 'Barbari', 'Pothwari/Potohari', 'Hairy/Kajli'] })
    breedType: string;

    @Prop({ required: false })
    motherId: number;

    @Prop({ required: false })
    fatherId: number;

    @Prop({ required: false })
    orgName: string;

    @Prop({ required: true })
    site: string;

    @Prop({ required: function () { return this.purchaseType === 'Purchase'; } })
    purchasePrice: number;

    @Prop({ required: function () { return this.purchaseType === 'Purchase'; } })
    purchaseFrom: string;

    @Prop({ type: Types.ObjectId, ref: 'Goat' }) // Self-reference for Sire/father
    sire: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'Goat' }) // Self-reference for Dam/mother
    dam: Types.ObjectId;
}

export const GoatSchema = SchemaFactory.createForClass(Goat);
GoatSchema.index({ orgId: 1, tagId: 1 }, { unique: true });
GoatSchema.index({ orgId: 1, animalName: 1 }, { unique: true });
