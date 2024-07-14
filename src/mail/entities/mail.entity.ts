import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema()
export class Mail extends Document {
    @Prop({ required: true })
    subject: string;
  
    @Prop({ required: true })
    from: string;
  
    @Prop({ required: true })
    body: string;
  
    @Prop({ required: true })
    date: Date;
  
    @Prop({ required: false })
    uid: string;
  
    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Folder', required: true })
    folder: MongooseSchema.Types.ObjectId;
}

export const MailSchema = SchemaFactory.createForClass(Mail);