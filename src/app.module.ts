import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MailModule } from './mail/mail.module';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { FoldersModule } from './folders/folders.module';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot('mongodb+srv://osama:54321@cluster0.uelcusg.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0/email-service'),
    MailModule,
    UsersModule,
    FoldersModule,
    AuthModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
