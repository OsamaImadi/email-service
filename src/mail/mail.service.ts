import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { CreateMailDto } from './dto/create-mail.dto';
import { UpdateMailDto } from './dto/update-mail.dto';
import * as nodemailer from 'nodemailer';
import * as Imap from 'imap';
import * as dotenv from 'dotenv';
import { simpleParser } from 'mailparser';
import { InjectModel } from '@nestjs/mongoose';
import { User } from 'src/users/entities/user.entity';
import { Folder } from 'src/folders/entities/folder.entity';
import { Mail } from './entities/mail.entity';
import { Model } from 'mongoose';

dotenv.config();

@Injectable()
export class MailService implements OnModuleInit{
  private transporter;
  private imap;
  private readonly logger = new Logger(MailService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Folder.name) private folderModel: Model<Folder>,
    @InjectModel(Mail.name) private mailModel: Model<Mail>,
  ) {}


  async onModuleInit() {
    // Initialize Nodemailer transporter
    this.transporter = nodemailer.createTransport({
      service: 'Outlook365',
      auth: {
        user: process.env.OUTLOOK_EMAIL,
        pass: process.env.OUTLOOK_PASSWORD,
        // user: this.configService.get<string>('OUTLOOK_EMAIL'),
        // pass: this.configService.get<string>('OUTLOOK_PASSWORD'),
      },
    });

    // Initialize IMAP client
    this.imap = new Imap({
      user: process.env.OUTLOOK_EMAIL,
      password: process.env.OUTLOOK_PASSWORD,
      // user: this.configService.get<string>('OUTLOOK_EMAIL'),
      // password: this.configService.get<string>('OUTLOOK_PASSWORD'),
      host: 'outlook.office365.com',
      port: 993,
      tls: true,
    });
    this.imap.once('ready', this.openInbox.bind(this));
    this.imap.once('error', (err) => {
      console.error('IMAP error: ', err);
    });

    this.imap.connect();
  }

  private openInbox() {
    this.imap.openBox('INBOX', false, (err, box) => {
      if (err) throw err;
      this.imap.on('mail', this.handleNewMail.bind(this));
    });
  }

  private handleNewMail() {
    this.logger.log('New mail received');
    this.imap.search(['UNSEEN'], (err, results) => {
      if (err) throw err;
      if (!results || !results.length) return;

      const f = this.imap.fetch(results, { bodies: '', struct: true });
      f.on('message', (msg, seqno) => {
        let uid;
        msg.on('attributes', (attrs) => {
          uid = attrs.uid;
        });
        msg.on('body', (stream, info) => {
          let emailBuffer = '';
          stream.on('data', (chunk) => {
            emailBuffer += chunk.toString('utf8');
          });
          stream.on('end', async () => {
            try {
              const parsedEmail = await simpleParser(emailBuffer);
              const emailDetails = {
                uid,
                subject: parsedEmail.subject,
                from: parsedEmail.from?.text,
                body: parsedEmail.text,
                date: parsedEmail.date,
              };
              this.logger.log('Parsed email: ', emailDetails);
                            
              const userEmail = process.env.OUTLOOK_EMAIL;
              let user = await this.userModel.findOne({ email: userEmail });
              if (!user) {
                user = new this.userModel({ email: userEmail, password: '' });
                await user.save();
              }

              let folder = await this.folderModel.findOne({ name: 'INBOX', user: user._id });
              if (!folder) {
                folder = new this.folderModel({ name: 'INBOX', user: user._id });
                await folder.save();
              }

              const email = new this.mailModel({ ...emailDetails, folder: folder._id });
              await email.save();
              // Handle the email details as needed
            } catch (error) {
              this.logger.error('Error parsing email: ', error);
            }
          });
        });
      });
      f.once('error', (err) => {
        this.logger.error('Fetch error: ' + err);
      });
      f.once('end', () => {
        this.logger.log('Done fetching all messages!');
      });
    });
  }

  async sendMail(to: string, subject: string, text: string) {
    const mailOptions = {
      from: process.env.OUTLOOK_EMAIL,
      to,
      subject,
      text,
    };

    const info = await this.transporter.sendMail(mailOptions);

    const userEmail = mailOptions.from;
    let user = await this.userModel.findOne({ email: userEmail });
    if (!user) {
      user = new this.userModel({ email: userEmail, password: '' });
      await user.save();
    }

    let folder = await this.folderModel.findOne({ name: 'Sent', user: user._id });
    if (!folder) {
      folder = new this.folderModel({ name: 'Sent', user: user._id });
      await folder.save();
    }

    const sentEmail = new this.mailModel({
      uid: info.messageId,
      subject,
      from: userEmail,
      body: text,
      date: new Date(),
      folder: folder._id,
    });

    await sentEmail.save();

    return info;
  }

  create(createMailDto: CreateMailDto) {
    return 'This action adds a new mail';
  }

  findAll() {
    return `This action returns all mail`;
  }

  findOne(id: number) {
    return `This action returns a #${id} mail`;
  }

  update(id: number, updateMailDto: UpdateMailDto) {
    return `This action updates a #${id} mail`;
  }

  remove(id: number) {
    return `This action removes a #${id} mail`;
  }
}
