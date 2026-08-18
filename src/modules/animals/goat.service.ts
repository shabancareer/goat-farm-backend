import { Injectable, ConflictException, InternalServerErrorException } from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { Goat } from './schemas/goat.schema';
import { CreateGoatDto, PurchaseType } from './dto/create-goat.dto';
import { UpdateGoatDto } from './dto/update-goat.dto';
import { GoatQueryDto } from './dto/goat-query.dto';
import { IGoatResponse } from './interfaces/goat.interface';
import { calculateAge } from '../../common/utils/age.util';
import { calculateEstimatedDOB } from '../../common/utils/calculateEstimatedDOB';

@Injectable()
export class GoatService {
    constructor(
        @InjectModel(Goat.name) private goatModel: Model<Goat>,
    ) { }

    private formatGoatResponse(goat: any) {
        if (!goat) return null;
        const goatObj = typeof goat.toObject === 'function' ? goat.toObject() : goat;
        const age = calculateAge(goatObj.dateOfBirth);

        let estimatedAgeYears: number | null = null;
        let estimatedAgeMonths: number | null = null;
        let estimatedAgeDays: number | null = null;
        if (
            goatObj.purchaseType === 'Purchase' &&
            goatObj.isEstimatedDOB &&
            goatObj.dateOfBirth &&
            goatObj.purchaseDate
        ) {
            const birth = new Date(goatObj.dateOfBirth);
            const purchase = new Date(goatObj.purchaseDate);

            let years = purchase.getFullYear() - birth.getFullYear();
            let months = purchase.getMonth() - birth.getMonth();
            let days = purchase.getDate() - birth.getDate();

            if (days < 0) {
                months--;
                const prevMonth = new Date(purchase.getFullYear(), purchase.getMonth(), 0);
                days += prevMonth.getDate();
            }

            if (months < 0) {
                years--;
                months += 12;
            }

            estimatedAgeYears = years >= 0 ? years : 0;
            estimatedAgeMonths = months >= 0 ? months : 0;
            estimatedAgeDays = days >= 0 ? days : 0;
        }

        return {
            ...goatObj,
            age,
            estimatedAgeYears,
            estimatedAgeMonths,
            estimatedAgeDays,
        };
    }

    async create(createGoatDto: CreateGoatDto): Promise<any> {
        let goatData: any = { ...createGoatDto };

        // 1. Calculate estimated DOB if it's a purchase
        if (createGoatDto.purchaseType === PurchaseType.PURCHASE) {
            goatData.dateOfBirth = calculateEstimatedDOB(
                createGoatDto.purchaseDate,
                createGoatDto.estimatedAgeYears,
                createGoatDto.estimatedAgeMonths,
                createGoatDto.estimatedAgeDays,
            );

            goatData.isEstimatedDOB = true;

            delete goatData.estimatedAgeYears;
            delete goatData.estimatedAgeMonths;
            delete goatData.estimatedAgeDays;

            // Clear lineage fields for purchase type
            goatData.motherId = null;
            goatData.fatherId = null;
        }

        try {
            // 2. Optimization: Check for duplicate tagId or animalName within the same organization
            if (createGoatDto.orgId) {
                const orgObjectId = Types.ObjectId.isValid(createGoatDto.orgId as any)
                    ? new Types.ObjectId(createGoatDto.orgId as any)
                    : createGoatDto.orgId;

                const existingGoat = await this.goatModel.findOne({
                    $or: [
                        { orgId: orgObjectId },
                        { orgId: createGoatDto.orgId }
                    ],
                    $and: [
                        {
                            $or: [
                                { tagId: createGoatDto.tagId },
                                { animalName: createGoatDto.animalName }
                            ]
                        }
                    ]
                }).exec();

                if (existingGoat) {
                    if (existingGoat.tagId === createGoatDto.tagId) {
                        throw new ConflictException(`Goat with tag ID ${createGoatDto.tagId} already exists in this organization`);
                    }
                    if (existingGoat.animalName === createGoatDto.animalName) {
                        throw new ConflictException(`Goat with name ${createGoatDto.animalName} already exists in this organization`);
                    }
                }
            }

            // 3. Instantiate model with the CORRECT modified goatData, then save
            const newGoat = new this.goatModel(goatData);
            const savedGoat = await newGoat.save();
            return this.formatGoatResponse(savedGoat);

        } catch (error) {
            // Log errors using template literals safely
            console.error('❌ Error saving goat:', error instanceof Error ? error.message : error);

            // Pass through your custom ConflictExceptions without wrapping them in InternalServerErrorException
            if (error instanceof ConflictException) {
                throw error;
            }

            // MongoDB duplicate key error fallback (in case of concurrent race conditions)
            if (error.code === 11000) {
                const field = Object.keys(error.keyPattern || {})[0] || 'field';
                throw new ConflictException(`Goat with this ${field} already exists in this organization`);
            }

            throw new InternalServerErrorException('Failed to save goat to database');
        }
    }

    async findAll(orgId?: string): Promise<any[]> {
        try {
            if (!orgId) {
                return [];
            }

            const orgObjectId = Types.ObjectId.isValid(orgId) ? new Types.ObjectId(orgId) : orgId;
            const goats = await this.goatModel.find({
                $or: [
                    { orgId: orgObjectId },
                    { orgId: orgId }
                ]
            }).lean();

            // Add calculated age to response
            return goats.map((goat: any) => this.formatGoatResponse(goat));
        } catch (error) {
            console.error('Error fetching goats:', error);
            throw new InternalServerErrorException('Failed to fetch goats');
        }
    }

    async findOne(id: string, orgId?: string): Promise<any> {
        try {
            let query: any = Types.ObjectId.isValid(id) ? { _id: id } : { tagId: Number(id) };
            if (orgId) {
                const orgObjectId = Types.ObjectId.isValid(orgId) ? new Types.ObjectId(orgId) : orgId;
                query.orgId = orgObjectId;
            }
            const goat = await this.goatModel.findOne(query).exec();
            if (!goat) {
                throw new ConflictException(`Goat with ID or Tag ${id} not found`);
            }
            return this.formatGoatResponse(goat);
        } catch (error) {
            console.error('❌ Error finding goat:', error);
            throw error;
		}
    }

    async remove(id: string | number, orgId?: string): Promise<any> {
        try {
            let query: any = (typeof id === 'string' && Types.ObjectId.isValid(id)) ? { _id: id } : { tagId: Number(id) };
            if (orgId) {
                const orgObjectId = Types.ObjectId.isValid(orgId) ? new Types.ObjectId(orgId) : orgId;
                query.orgId = orgObjectId;
            }
            const deletedGoat = await this.goatModel.findOneAndDelete(query).exec();
            if (!deletedGoat) {
                throw new ConflictException(`Goat with ID or Tag ${id} not found`);
            }
            return this.formatGoatResponse(deletedGoat);
        } catch (error) {
            console.error('❌ Error deleting goat:', error);
            throw error;
        }
    }

    async update(id: string, updateGoatDto: UpdateGoatDto, orgId?: string): Promise<any> {
        try {
            let query: any = Types.ObjectId.isValid(id) ? { _id: id } : { tagId: Number(id) };
            if (orgId) {
                const orgObjectId = Types.ObjectId.isValid(orgId) ? new Types.ObjectId(orgId) : orgId;
                query.orgId = orgObjectId;
            }
            const existingGoat = await this.goatModel.findOne(query).exec();
            if (!existingGoat) {
                throw new ConflictException(`Goat with ID or Tag ${id} not found`);
            }

            let goatData: any = { ...updateGoatDto };

            // Determine purchaseType: either from DTO or existing database value
            const finalPurchaseType = updateGoatDto.purchaseType !== undefined
                ? updateGoatDto.purchaseType
                : existingGoat.purchaseType;

            if (finalPurchaseType === PurchaseType.PURCHASE) {
                const finalPurchaseDate = updateGoatDto.purchaseDate !== undefined
                    ? updateGoatDto.purchaseDate
                    : existingGoat.purchaseDate;

                const finalYears = updateGoatDto.estimatedAgeYears !== undefined
                    ? updateGoatDto.estimatedAgeYears
                    : 0;

                const finalMonths = updateGoatDto.estimatedAgeMonths !== undefined
                    ? updateGoatDto.estimatedAgeMonths
                    : 0;

                const finalDays = updateGoatDto.estimatedAgeDays !== undefined
                    ? updateGoatDto.estimatedAgeDays
                    : 0;

                goatData.dateOfBirth = calculateEstimatedDOB(
                    finalPurchaseDate,
                    finalYears,
                    finalMonths,
                    finalDays,
                );

                goatData.isEstimatedDOB = true;

                // Ensure temporary DTO-only fields are deleted before saving
                delete goatData.estimatedAgeYears;
                delete goatData.estimatedAgeMonths;
                delete goatData.estimatedAgeDays;

                // Clear lineage fields for purchase type
                goatData.motherId = null;
                goatData.fatherId = null;
            } else if (finalPurchaseType === PurchaseType.OWN) {
                goatData.isEstimatedDOB = false;

                // Clear purchase fields for own type
                goatData.purchasePrice = null;
                goatData.purchaseFrom = null;
                goatData.purchaseDate = null;
            }

            const updatedGoat = await this.goatModel.findOneAndUpdate(query, goatData, { new: true }).exec();
            return this.formatGoatResponse(updatedGoat);
        } catch (error) {
            console.error('❌ Error updating goat:', error);
            throw error;
        }
    }
}
