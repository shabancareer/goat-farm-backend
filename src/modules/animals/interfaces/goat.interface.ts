import { Document, Types } from 'mongoose';

export interface IGoat extends Document {
    animalName: string;
    gender: string;
    purchaseType: string;
    dateOfBirth: string;
    purchaseDate: string;
    type: string;
    kiddingCapacity: number;
    tagId: number;
    weight: number;
    breedType: string;
    motherId: number;
    fatherId: number;
    partition: string;
    site: string;
    purchasePrice: number;
    purchaseFrom: string;
    sire?: Types.ObjectId;
    dam?: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

export interface IGoatResponse {
    success: boolean;
    message: string;
    data?: IGoat | IGoat[];
    meta?: {
        total: number;
        page: number;
        limit: number;
        pages: number;
    };
    error?: any;
}
