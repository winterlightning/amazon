var amazon = require('../..')
  , fs = require('fs')
  , configuration = JSON.parse(fs.readFileSync(process.env.HOME + '/.aws', 'utf8'))
  , ec2 = amazon(configuration)({ service: 'ec2', region: 'us-east-1' });

ec2('DescribeInstances', {}, function (error, body) {
  if (error) throw error;
  console.log(body);
});
