import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Folder } from 'src/folders/entities/folder.entity';
import { Mail } from 'src/mail/entities/mail.entity';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Folder.name) private folderModel: Model<Folder>,
    @InjectModel(Mail.name) private mailModel: Model<Mail>,
  ) {}

  async createUser(email: string, password: string): Promise<User> {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new this.userModel({ email, password: hashedPassword });
    return user.save();
  }

  async findUserByEmail(email: string): Promise<User> {
    return this.userModel.findOne({ email }).exec();
  }

  async getUserInbox(userId: string) {
    const inboxFolder = await this.folderModel.findOne({ user: userId, name: 'INBOX' });
    if (!inboxFolder) {
      return [];
    }
    return this.mailModel.find({ folder: inboxFolder._id }).exec();
  }

  async getUserSentItems(userId: string) {
    const sentFolder = await this.folderModel.findOne({ user: userId, name: 'Sent' });
    if (!sentFolder) {
      return [];
    }
    return this.mailModel.find({ folder: sentFolder._id }).exec();
  }

  create(createUserDto: CreateUserDto) {
    return 'This action adds a new user';
  }

  findAll() {
    return `This action returns all users`;
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
