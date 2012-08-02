var parse = require('url').parse
  , endpoints = require('./endpoints')
  , crypto = require('crypto');

module.exports.version2 = version2;
module.exports.version3https = version3https;
module.exports.version4 = version4;
module.exports.enc = enc;

// Zero pad a two-digit number.
function pad (n) { return n < 10 ? '0' + n : n }

// Format an ISO 8601 date.
function iso8601 (now) {
  var date = [], now = new Date(now);
  'FullYear - Month - Date T Hours : Minutes :00Z'.split(/\s/).forEach(function (part, i) {;
    date.push(i % 2 ? part : pad(now['getUTC' + part]() + (part == 'Month' ? 1 : 0)));
  });
  return date.join('');
}

// Format an RFC 2822 date.
const DOW = 'Sun Mon Tue Wed Thu Fri Sat'.split(/\s/);
const MONTH = 'Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec'.split(/\s/);

function rfc2822 (now) {
  var now = new Date(now)
    , date =
      [ DOW[now.getUTCDay()], ', '
      , pad(now.getUTCDate()), ' '
      , MONTH[now.getUTCMonth()], ' '
      , now.getUTCFullYear(), ' '
      , pad(now.getUTCHours()), ':'
      , pad(now.getUTCMinutes()), ':'
      , pad(now.getUTCSeconds()), ' +0000'
      ];
  return date.join('');
}

// Extend one object with the values of another.
function extend (to, from) {
  for (var key in from) to[key] = from[key];
  return to;
}

// Implementation of RFC 3986 encoding that includes ASCII control characters.
// Spaces are encoded as `%20`.
function enc (string) {
  return encodeURIComponent(string).replace(/[^-%0-9A-Za-z_.~]/g, function ($) {
    return '%' + $.charCodeAt(0);
  });
}

// SHA256 hash-based message authentication code.
function hmac (key, value) {
  var hmac = crypto.createHmac('sha256', key);
  hmac.update(value);
  return hmac.digest('binary');
}

// SHA256 hash.
function hash (buffer) {
  var encoded = crypto.createHash('SHA256');
  encoded.update(buffer);
  return encoded.digest('hex');
}

// Convert a binary string to base 64.
function base64 (string) {
  return new Buffer(string, 'binary').toString('base64');
}

// Convert a binary string to hexadecimal.
function hex16 (string) {
  return new Buffer(string, 'binary').toString('hex');
}

// [Version
// 2](http://docs.amazonwebservices.com/general/latest/gr/signature-version-2.html)
// signing, used by EC2 and many others.

//
function version2 (configuration, action, request) {
  var sign = []
    , parts = request.host.split('.')
    , service = parts[0]
    , version = endpoints.service.version[service]
    , url = parse(request.path, true)
    , query, encoded
    ;

  sign.push(request.method.toUpperCase());
  sign.push(request.host);
  sign.push(url.pathname);

  query = extend(url.query,
  { AWSAccessKeyId: configuration.key
  , Action: action
  , SignatureMethod: 'HmacSHA256'
  , Timestamp: iso8601(Date.now())
  , SignatureVersion: 2
  , Version: version
  });

  // The API documentation says to sort by "lexicographic byte ordering" which
  // means *nothing*. The Ruby SDK just uses a standard sort and it has worked
  // here so far.
  query = Object.keys(url.query).sort().map(function (key) {
    return enc(key) + '=' + enc(url.query[key]);
  });
  sign.push(query.join('&'));

  query.push('Signature=' + enc(base64(hmac(configuration.secret, sign.join('\n')))));

  request.path = url.pathname + '?' + query.join('&');

  return request;
}

// Route 53, CloudFront and Simple Email Service use
// [`AWS3-HTTPS`](http://docs.amazonwebservices.com/ses/latest/DeveloperGuide/QueryInterface.Authentication.html).
// It only signs the date header and it only works through HTTPS.
// 
// The Ruby AWS SDK implements a mysterious version 3 signature, but I cannot
// find mention of it anywhere in the AWS documentation. The signature also uses
// the X-Amzn-Authorization` header, starting with `AWS3`, and it creates a
// string to sign similar to the string to sign in version 4.

//
function version3https (configuration, action, request, body) {
  var date = rfc2822(Date.now());
  request.headers['x-amz-date'] = date;
  request.headers['x-amzn-authorization'] =
  [ [ 'AWS3-HTTPS AWSAccessKeyId', configuration.key ]
  , [ 'Algorithm', 'HmacSHA256' ]
  , [ 'Signature', base64(hmac(configuration.secret, date)) ]
  ].map(function (pair) { return pair[0] + '=' + pair[1] }).join(',');

  return request;
}

const TARGET =
{ dynamodb: 'DynamoDB'
};

// [Version
// 4](http://docs.amazonwebservices.com/general/latest/gr/signature-version-4.html)
// signing, used by DynamoDB.

//
function version4 (configuration, action, request, payload) {
  var now = iso8601(Date.now())
    , sign = []
    , url = parse(request.path, true)
    , encoded, keys, key
    , parts = request.host.split('.')
    , service = parts[0]
    , region = parts[1]
    , version = endpoints.service.version[service]
    ;

  // An `x-amx-date` header is required and it must agree with the signature.
  request.headers['x-amz-date'] = now;
  request.headers['x-amz-target'] = TARGET[service] + '_' + version.replace(/-/g, '') + '.' + action;
 
  // 1. The request method.
  request.method = request.method.toUpperCase();
  sign.push(request.method);

  // 2. The request path with each part URI encoded.
  encoded = url.pathname.split('/')
                        .map(function (part) { return enc(part) })
                        .join('/');
  sign.push(encoded);  

  // 3. The query string URI encoded and ordered by the character codes of the
  // encoded key names.
  encoded = {};
  for (key in url.query) encoded[enc(key)] = enc(query[value]);

  encoded = Object.keys(encoded).sort()
                  .map(function (key) { return key + '=' + encoded[key] })
                  .join('&');
  sign.push(encoded);
  
  // 4. The headers excluding the Authorization header, with key names
  // converted to lower case, values trimmed, and pairs ordered by the
  // character codes of the encoded key names.
  //
  // There is a new line after each header including the last one, so when we
  // join the request there will be two newlines after the headers.
  encoded = {};
  for (key in request.headers)
    encoded[key.toLowerCase()] = request.headers[key].trim();
  delete encoded.authorization;

  keys = Object.keys(encoded).sort();
  encoded = keys.map(function (key) { return key + ':' + request.headers[key] })
                .join('\n') + '\n';
  sign.push(encoded);

  // 5. The names headers signed joined by semi-colons.
  encoded = keys.join(';');
  sign.push(encoded);

  // 6. A hash of the body of the message.
  encoded = hash(typeof payload == 'string' ? new Buffer(payload) : payload);
  sign.push(encoded);

  var date = now.split('T').shift().replace(/-/g, '');
  sign =
  [ 'AWS4-HMAC-SHA256'
  , now.replace(/[:-]/g, '')
  , date + '/us-east-1/dynamodb/aws4_request'
  , hash(new Buffer(sign.join('\n'), 'utf8'))
  ];
  
  key = hmac("AWS4" + configuration.secret, date);
  key = hmac(key, region);
  key = hmac(key, service);
  key = hmac(key, 'aws4_request');

  request.headers.Authorization =
  [ [ 'AWS4-HMAC-SHA256 Credential'
    , [ configuration.key, date, region, service, 'aws4_request' ].join('/')
    ]
  , [ 'SignedHeaders', keys.join(';') ]
  , [ 'Signature', hex16(hmac(key, sign.join('\n'))) ]
  ].map(function (pair) { return pair.join('=') }).join(',');

  return request;
}
