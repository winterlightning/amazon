var amazon = require('../..')
  , fs = require('fs')
  , configuration = JSON.parse(fs.readFileSync(process.env.HOME + '/.aws', 'utf8'))
  , email = amazon(configuration)({ service: 'email', region: 'us-east-1' });

email('ListIdentities', {}, function (error, body) {
  if (error) throw error;
  console.log(body);
});

var message = '\
Subject: Hello, World! \n\
To: alan@prettyrobots.com \n\
From: alan@prettyrobots.com \n\
\n\
Hello, World! \n\
'

var base64 = new Buffer(message).toString('base64');
