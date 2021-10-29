import { Request, Response } from 'express';
import http, { IncomingMessage } from 'http';
import https from 'https';
import { URL, URLSearchParams } from 'url';
import { ErrorResponse } from './error-response.interface';

const proxyRequest = (req: Request, res: Response, url: string) => {
  // Cache raw body as soon as possible
  const segments: Buffer[] = [];
  req.on('data', (seg: Buffer) => segments.push(seg));

  // Strip "forbidden" headers, and create a object containing remaining entries
  const strippedHeaders = ['connection', 'accept', 'content-length', 'accept-encoding', 'host'];
  const filteredHeaders = Object.keys(req.headers)
    .filter((key) => !strippedHeaders.includes(key))
    .reduce((acc, key) => {
      acc[key] = req.headers[key];
      return acc;
    }, <{ [ key: string ]: any }>{});

  // Build query parameter string
  const paramBuilder = new URLSearchParams();
  Object.keys(req.query).forEach((qi) => {
    const val = req.query[qi] as string;
    // Differentiate between arrays (multiple entries) and scalar values
    if (Array.isArray(val)) {
      for (let i = 0; i < val.length; i += 1)
        paramBuilder.append(qi, val[i]);
    } else
      paramBuilder.append(qi, val);
  });

  const dest = new URL(url);

  // Create proxy request config
  const proxyReqConf = {
    host: dest.hostname,
    port: dest.port,
    path: `${dest.pathname}${dest.search}`,
    method: req.method,
    headers: {
      // Pass along filtered headers
      ...filteredHeaders,
    },
  };

  // This will handle proxy responses
  const proxyResHandler = (proxyRes: IncomingMessage) => {
    // Copy over status-code and response headers
    res.writeHead(proxyRes.statusCode || 500, proxyRes.headers);
    // Pipe proxy's response into local response
    proxyRes.pipe(res);
  };

  // Decide on internally used protocol
  const proxyReq = dest.protocol.startsWith('https')
    ? https.request(proxyReqConf, proxyResHandler)
    : http.request(proxyReqConf, proxyResHandler);

  // Handle requesting errors
  proxyReq.on('error', (e: any) => {
    console.log(e);
    // Map to a more human-readable error description
    let msg = 'An error occurred during request-processing!';
    switch (e.code) {
      case 'ECONNREFUSED':
        msg = 'Connection refused, endpoint is not responding!';
        break;

      case 'ERR_TLS_CERT_ALTNAME_INVALID':
        msg = 'The requested subdomain is not within the registered cert!';
        break;
    }

    res.statusCode = 500;
    res.send({
      code: e.code,
      message: msg,
    } as ErrorResponse);
  });

  // Incoming request read till end, send to proxy
  req.on('end', () => {
    proxyReq?.write(Buffer.concat(segments));
    proxyReq?.end();
  });
};

export default proxyRequest;
