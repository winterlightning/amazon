var crypto = require("crypto")
  , http = require("https")
  , querystring = require("querystring")
  ;

function pad (n) { return n < 10 ? "0" + n : n }

function timestamp () {
  var date = [], now = new Date();
  'FullYear - Month - Date T Hours : Minutes :00Z'.split(/\s/).forEach(function (part, i) {;
    date.push(i % 2 ? part : pad(now["getUTC" + part]() + (part == 'Month' ? 1 : 0)));
  });
  return date.join('');
}

function invoke (endpoint, version, key, secret, command, parameters, callback) {
  var digest, hmac, key, map, name, names, query, request, toSign;

  map = {
    AWSAccessKeyId: key,
    Action: command,
    SignatureMethod: "HmacSHA256",
    Timestamp: timestamp(),
    SignatureVersion: 2,
    Version: version
  };

  for (key in parameters) {
    map[key] = typeof parameters[key] === "function" ? parameters[key]() : parameters[key];
  }

  names = Object.keys(map).sort();

  query = [];
  names.forEach(function (name) {
    query.push(querystring.escape(name) + "=" + querystring.escape(map[name]));
  });

  if (!~endpoint.indexOf(".")) endpoint = "ec2." + endpoint + ".amazonaws.com";

  toSign = "GET\n" + (endpoint + "\n") + "/\n" + query.join("&");
  hmac = crypto.createHmac("sha256", secret);
  hmac.update(toSign);

  digest = querystring.escape(hmac.digest("base64"));
  query.push("Signature=" + digest);

  request = http.request({
    port: 443,
    host: endpoint,
    method: "GET",
    path: "/?" + query.join("&"),
    headers: { host: endpoint }
  }, function(response) {
    var body = "";
    response.setEncoding("utf8");
    response.on("data", function(chunk) {
      return body += chunk;
    });
    response.on("end", function() {
      return callback(null, response, body);
    });
    return response.on("error", function(error) {
      return callback(error);
    })
  })
  request.once("error", callback);
  request.end();
};

module.exports.invoke = invoke;
