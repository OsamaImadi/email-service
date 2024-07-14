import { Controller, Get, Post, Body, Patch, Param, Delete, Req, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { ConfigService } from '@nestjs/config';
import * as dotenv from 'dotenv';

dotenv.config();
const { PublicClientApplication, ConfidentialClientApplication } = require("@azure/msal-node");


const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const tenantId = process.env.TENANT_ID;
const redirectUri = process.env.REDIRECT_URI; //or any redirect uri you set on the azure AD

const scopes = ["https://graph.microsoft.com/.default"];

const msalConfig = {
  auth: {
    clientId,
    authority: `https://login.microsoftonline.com/${tenantId}`,
    redirectUri,
  },
};

const pca = new PublicClientApplication(msalConfig);

const ccaConfig = {
  auth: {
    clientId,
    authority: `https://login.microsoftonline.com/${tenantId}`,
    clientSecret,
  },
};

const cca = new ConfidentialClientApplication(ccaConfig);

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService
  ) {}

  @Post('register')
  async register(@Body() body: { email: string, password: string }) {
    return this.authService.register(body.email, body.password);
  }

  @Post('login')
  async login(@Body() body: { email: string, password: string }) {
    return this.authService.login(await this.authService.validateUser(body.email, body.password));
  }

  @Post()
  create(@Body() createAuthDto: CreateAuthDto) {
    return this.authService.create(createAuthDto);
  }

  @Get()
  findAll(@Req() req, @Res() res) {
    const tokenRequest = {
      code: req.query.code,
      scopes,
      redirectUri,
      clientSecret: clientSecret,
    };
  
    pca.acquireTokenByCode(tokenRequest).then((response) => {
  
      res.send({message: 'Token acquired', token: response.accessToken}); 
    }).catch((error) => {
      console.log(error);
      res.status(500).send(error);
    });
  }
  @Get('/get-token')
  getToken(@Req() req, @Res() res) {
    const authCodeUrlParameters = {
      scopes,
      redirectUri,
    };
  
    pca.getAuthCodeUrl(authCodeUrlParameters).then((response) => {
      res.redirect(response);
    });
  }

  @Get('/get-access-token')
  async getAccessToken(@Req() req, @Res() res) {
    try {
      const tokenRequest = {
        scopes,
        clientSecret: clientSecret,
      };
  
      const response = await cca.acquireTokenByClientCredential(tokenRequest);
      const accessToken = response.accessToken;

      req.session.clientAccessToken = accessToken;
  
      res.send("Access token acquired successfully!");
    } catch (error) {
      res.status(500).send(error);
      console.log("Error acquiring access token:", error.message);
    }
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAuthDto: UpdateAuthDto) {
    return this.authService.update(+id, updateAuthDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.authService.remove(+id);
  }
}
