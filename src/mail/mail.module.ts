import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { MailController } from './mail.controller';
import { User, UserSchema } from 'src/users/entities/user.entity';
import { Folder, FolderSchema } from 'src/folders/entities/folder.entity';
import { Mail, MailSchema } from './entities/mail.entity';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Folder.name, schema: FolderSchema },
      { name: Mail.name, schema: MailSchema },
    ]),
  ],
  controllers: [MailController],
  providers: [MailService],
})
export class MailModule {}
