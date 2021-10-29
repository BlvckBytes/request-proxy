import express from 'express';
import cors from 'cors';
import fs from 'fs';
import http from 'http';
import https from 'https';
import path from 'path';
import Config from './config.class';
import proxyRequest from './http-proxy.module';
import { RequestParams } from './request-params.interface';
import { ErrorResponse } from './error-response.interface';

// Setup express and disable cors
const app = express();
app.use(cors());

// Read accounts from config
Config.init('config.ini');
const accounts = Config.items('users');

// Listen on all paths with all methods
app.all('/proxy', (req, res) => {
  // Get login credentials and destination url from query params
  const params: RequestParams = req.query as any;

  // Parameter(s) missing
  if (!(params.username && params.password && params.url)) {
    res.statusCode = 400;
    res.send({
      code: 'EMISSINGPARAMS',
      message: 'Please provide username, password and url as query parameters!',
    } as ErrorResponse);
    return;
  }

  // Authenticate
  const user = accounts.find((acc) => acc[0].toLowerCase() === params.username.toLowerCase());
  if (!user || user[1] !== params.password) {
    res.statusCode = 400;
    res.send({
      code: 'EINVCRED',
      message: 'Invalid credentials provided!',
    } as ErrorResponse);
    return;
  }

  proxyRequest(req, res, params.url);
});

// Listen on port 5006
http.createServer(app).listen(5006);

// Listen on port 5005
const crtDir = Config.settings.letsEncryptDir;
https.createServer({
  key: fs.readFileSync(`${path.join(crtDir, 'privkey.pem')}`, 'utf8'),
  cert: fs.readFileSync(`${path.join(crtDir, 'cert.pem')}`, 'utf8'),
  ca: fs.readFileSync(`${path.join(crtDir, 'chain.pem')}`, 'utf8'),
}, app).listen(5005);

// Notify of status
console.log('Listening for HTTP / HTTPS requests!');
