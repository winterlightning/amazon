var http = require('https')
  , parse = require("./lib/response").parse
  , endpoints = require("./lib/endpoints")
  , __slice = Array.prototype.slice;
  ;

function amazon (options, vargs) {
  var callback
    , endpoint
    , extended
    , version
    , key
    , name
    , parameters
    , secret
    , set
    , value
    , extensions
    , host
    , service
    , i, I
    ;

  extended = options;
  switch (vargs.length) {
    case 1:
    case 4:
      extended = {};
      extensions = [options, vargs[0]];
      for (i = 0, I = extensions.length; i < I; i++) {
        set = extensions[i];
        for (key in set) {
          extended[key] = set[key];
        }
      }
  }
  switch (vargs.length) {
    case 3:
      name = vargs[0], parameters = vargs[1], callback = vargs[2];
      break;
    case 4:
      name = vargs[1], parameters = vargs[2], callback = vargs[3];
      break;
  }
  switch (vargs.length) {
    case 0:
      return options;
    case 1:
      return function() {
        var vargs = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        return amazon(extended, vargs);
      };
    case 3:
    case 4:
      invoke(options, name, parameters, callback);
  }
};

var signature = require('./lib/signature')
  , enc = signature.enc
  ;

function postJSON (host, action, query) {
  var post =
  { request:
    { port: 443
    , host: host
    , method: 'POST'
    , path: '/'
    , headers:
      { host: host
      , 'content-type': 'application/x-amz-json-1.0'
      }
    }
  , body: JSON.stringify(query)
  };
  return post;
}

function getQuery (host, action, query) {
  var qs = Object.keys(query)
                 .map(function (key) { return enc(key) + '=' + enc(query[key]) })
                 .join('&')
    , get =
      { request:
        { port: 443
        , host: host
        , method: 'GET'
        , path: '/?' + qs
        , headers: { host: host }
        }
      , body: ''
      };
  return get;
}

function postHTTPS (host, action, query) {
  var qs, post;
  qs = Object.keys(query)
             .map(function (key) { return enc(key) + '=' + enc(query[key]) });
  qs.push('Action=' + enc(action));
  qs = qs.join('&');
  post =
  { request:
    { port: 443
    , host: host
    , method: 'POST'
    , path: '/'
    , headers:
      { host: host
      , 'content-type': 'application/x-www-form-urlencoded'
      }
    }
  , body: qs
  };
  return post;
}

const VERSION2GETTER =
{ pack: getQuery
, sign: signature.version2
, parse: parse
};

const VERSION3POSTER =
{ pack: postHTTPS
, sign: signature.version3https
, parse: parse
};

const VERSION4POSTER =
{ pack: postJSON
, sign: signature.version4
, parse: function (body, callback) { callback(null, JSON.parse(body)) }
};

const PROTOCOL =
{ ec2: VERSION2GETTER
, dynamodb: VERSION4POSTER
, email: VERSION3POSTER
};

function invoke (conf, action, parameters, callback) {
  var service = conf.service
    , region = conf.region
    , protocol = PROTOCOL[service]
    , host, packed, signed, request
    ;

  if (region == '') {
    host = options.service + '.amazonaws.com'  
  } else if (service == 's3') {
    host = conf.service + '-' + region + '.amazonaws.com'  
  } else {
    host = conf.service + '.' + region + '.amazonaws.com'  
  }

  packed = protocol.pack(host, action, parameters);
  signed = protocol.sign(conf, action, packed.request, packed.body);

  request = http.request(signed, function(response) {
    var body = [];

    response.setEncoding('utf8');
    response.on('data', function(chunk) { body.push(chunk) });
    response.on('end', function() { complete() });
    response.once('error', complete);

    function complete (error) {
      var statusCode;
      try {
        if (error) {
          callback(error);
        } else {
          statusCode = Math.floor(response.statusCode / 100);
          if (statusCode === 2) {
            protocol.parse(body.join(''), callback);
          } else if (body.length) {
            protocol.parse(body.join(''), function(error, object) {
              if (error) {
                callback(new Error(http.STATUS_CODES[response.statusCode]));
              } else {
                error = new Error(object.Errors[0].Message);
                error.code = object.Errors[0].Code;
                error.status = statusCode;
                callback(error);
              }
            });
          } else {
            callback(new Error(http.STATUS_CODES[response.statusCode]));
          }
        }
      } catch (error) {
        callback(error);
      }
    }
  });
  request.once('error', callback);
  request.end(packed.body);
}

module.exports = amazon({}, [{}]);
