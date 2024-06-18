import { ObjectId } from 'mongodb';
import dbClient from '../utils/db';

class BaseModel {
  constructor() {
    this.created_at = new Date();
    this.updated_at = new Date();
  }

  async save(collectionName) {
    const collection = dbClient.db.collection(collectionName);
    this.updated_at = new Date();
    const result = await collection.insertOne(this);
    this._id = result.insertedId;
    return this;
  }

  static async findById(collectionName, id) {
    const collection = dbClient.db.collection(collectionName);
    return await collection.findOne({ _id: new ObjectId(id) });
  }

  static async findAll(collectionName) {
    const collection = dbClient.db.collection(collectionName);
    return await collection.find({}).toArray();
  }

  async update(collectionName, updateData) {
    const collection = dbClient.db.collection(collectionName);
    this.updated_at = new Date();
    const result = await collection.updateOne({ _id: this._id }, { $set: { ...updateData, updated_at: this.updated_at } });
    return result.modifiedCount > 0;
  }
}

export default BaseModel;
