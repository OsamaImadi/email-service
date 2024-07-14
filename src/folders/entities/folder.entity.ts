import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema()
export class Folder extends Document {
    @Prop({ required: true })
    name: string;
  
    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
    user: MongooseSchema.Types.ObjectId;
}

export const FolderSchema = SchemaFactory.createForClass(Folder);
