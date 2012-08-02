var amazon = require('../..')
  , fs = require('fs')
  , configuration = JSON.parse(fs.readFileSync(process.env.HOME + '/.aws', 'utf8'))
  , dynamodb = amazon(configuration)({ service: 'dynamodb', region: 'us-east-1' });

dynamodb('ListTables', {}, function (error, body) {
  if (error) throw error;
  console.log(body);
});
