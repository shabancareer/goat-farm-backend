// import { Injectable } from '@nestjs/common';
// import { InjectModel } from '@nestjs/mongoose';
// import { Model, Types } from 'mongoose';
// import { Goat } from './schemas/goat.schema';
// import { CreateGoatDto } from './dto/create-goat.dto';
// import { UpdateGoatDto } from './dto/update-goat.dto';
// import { GoatQueryDto } from './dto/goat-query.dto';

// @Injectable()
// export class GoatRepository {
//     constructor(
//         @InjectModel(Goat.name) private readonly goatModel: Model<Goat>,
//     ) { }

//     async create(createGoatDto: CreateGoatDto): Promise<Goat> {
//         const newGoat = new this.goatModel(createGoatDto);
//         return await newGoat.save();
//     }

//     async findAll(queryDto: GoatQueryDto): Promise<{ data: Goat[]; total: number }> {
//         const {
//             search, gender, breedType, type,
//             minWeight, maxWeight, fromDate, toDate,
//             page, limit, sortBy, sortOrder
//         } = queryDto;

//         // Build filter object
//         const filter: any = {};

//         if (search) {
//             filter.$or = [
//                 { animalName: { $regex: search, $options: 'i' } },
//                 { tagId: { $regex: search, $options: 'i' } },
//             ];
//         }

//         if (gender) filter.gender = gender;
//         if (breedType) filter.breedType = breedType;
//         if (type) filter.type = type;

//         if (minWeight !== undefined || maxWeight !== undefined) {
//             filter.weight = {};
//             if (minWeight !== undefined) filter.weight.$gte = minWeight;
//             if (maxWeight !== undefined) filter.weight.$lte = maxWeight;
//         }

//         if (fromDate || toDate) {
//             filter.purchaseDate = {};
//             if (fromDate) filter.purchaseDate.$gte = new Date(fromDate);
//             if (toDate) filter.purchaseDate.$lte = new Date(toDate);
//         }

//         // Calculate pagination
//         const skip = (page - 1) * limit;
//         const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

//         // Execute query
//         const [data, total] = await Promise.all([
//             this.goatModel
//                 .find(filter)
//                 .populate('sire', 'animalName tagId')
//                 .populate('dam', 'animalName tagId')
//                 .sort(sort)
//                 .skip(skip)
//                 .limit(limit)
//                 .exec(),
//             this.goatModel.countDocuments(filter),
//         ]);

//         return { data, total };
//     }

//     async findById(id: string): Promise<Goat> {
//         return await this.goatModel
//             .findById(id)
//             .populate('sire', 'animalName tagId breedType')
//             .populate('dam', 'animalName tagId breedType')
//             .exec();
//     }

//     async findByTagId(tagId: string): Promise<Goat> {
//         return await this.goatModel.findOne({ tagId }).exec();
//     }

//     async update(id: string, updateGoatDto: UpdateGoatDto): Promise<Goat> {
//         return await this.goatModel
//             .findByIdAndUpdate(id, updateGoatDto, { new: true })
//             .populate('sire', 'animalName tagId')
//             .populate('dam', 'animalName tagId')
//             .exec();
//     }

//     async delete(id: string): Promise<Goat> {
//         return await this.goatModel.findByIdAndDelete(id).exec();
//     }

//     async getStats(): Promise<any> {
//         const stats = await this.goatModel.aggregate([
//             {
//                 $group: {
//                     _id: null,
//                     totalGoats: { $sum: 1 },
//                     avgWeight: { $avg: '$weight' },
//                     totalPurchasePrice: { $sum: '$purchasePrice' },
//                     maleCount: { $sum: { $cond: [{ $eq: ['$gender', 'Male'] }, 1, 0] } },
//                     femaleCount: { $sum: { $cond: [{ $eq: ['$gender', 'Female'] }, 1, 0] } },
//                     breedCounts: { $push: '$breedType' },
//                 },
//             },
//             {
//                 $project: {
//                     _id: 0,
//                     totalGoats: 1,
//                     avgWeight: { $round: ['$avgWeight', 1] },
//                     totalPurchasePrice: 1,
//                     maleCount: 1,
//                     femaleCount: 1,
//                     breedCounts: 1,
//                 },
//             },
//         ]);

//         return stats[0] || {};
//     }

//     async getBreedingReport(): Promise<any> {
//         return await this.goatModel.aggregate([
//             {
//                 $match: { gender: 'Female', kiddingCapacity: { $gt: 0 } }
//             },
//             {
//                 $lookup: {
//                     from: 'goats',
//                     localField: 'sire',
//                     foreignField: '_id',
//                     as: 'sireDetails'
//                 }
//             },
//             {
//                 $project: {
//                     animalName: 1,
//                     tagId: 1,
//                     kiddingCapacity: 1,
//                     'sireDetails.animalName': 1,
//                     'sireDetails.tagId': 1,
//                 }
//             }
//         ]);
//     }
// }
