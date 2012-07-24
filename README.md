# Node Amazon [![Build Status](https://secure.travis-ci.org/bigeasy/amazon.png?branch=master)](http://travis-ci.org/bigeasy/amazon)

Evented Node.js bindings to the Amaozn AWS Query API.

 * **Node Amazon** is a minimal Node.js API with a pinch of sugar.
 * **Node Amazon** creates a signed request from a AWS AWS command name a plain old
JavaScript object of command parameters.
 * **Node Amazon** parses the XML response and converts it into JSON.
 * **Node Amazon** does **not** define control flow, so use your favorite control flow
library.
 * **Node Amazon** lets Amazon AWS do all the error checking in one place, then
   returns the errors as an `Error` to a Node.js style callback.

Because **Node Amazon** is such a thin layer over the Amazon AWS API you can use
the [Amazon API
Reference](http://docs.amazonwebservices.com/AWSEC2/latest/APIReference/index.html?query-apis.html)
to find your way around. **Node Amazon** calls translate directly to Amazon Query API.

## Synopsis

An example using
[RunInstances](http://docs.amazonwebservices.com/AWSEC2/latest/APIReference/index.html?ApiReference-query-RunInstances.html) to launch a 32-bit Fedora 17 instance in Virginia.

Our program reads the AWS secrets from a file named '~/.aws' that contains the
key and secret as JSON.

```
{ 'key': 'EXAMPLE'
, 'secret': 'EXAMPLE'
}
```

Our program launches and instance, then calls `'DescribeInstances'` until it is
ready to use. When it's read it prints the TK host name for use with `ssh`.

```javascript
// Require Amazon.
var amazon = require('amazon')
  , fs = require('fs')
  , path = require('path')
  , configuration = path.resolve(process.env.HOME, '.aws')
  ;

// Read in the configuration above.
var configuration = JSON.parse(fs.readFileSync(configuration, 'utf8'));

// Create an ec2 function that uses your configuration.
configuration.service = 'ec2';
ec2 = amazon(configuration)

// Run an instance and wait for it to become ready.
ec2('RunInstances', {
  ImageId: 'ami-2d4aa444', KeyName: 'launch_key', MinCount: 1, MaxCount: 1
}, running);


var reservationId, instanceId;
function running (error, response) {
  if (error) throw error;
  reservationId = response.reservationId
  instanceId = response.instancesSet[0].instanceId;
  describe();
}

function describe () {
  ec2('DescribeInstances', {}, starting);
}

function starting (error, response) {
  if (error) throw error;
  var reservation, instance;
  reservation = response.reservationSet.filter(function (reservation) {
    return reservation.reservationId == reservationId;
  })[0];
  instance = reservation.instancesSet.filter(function (instance) {
    return instance.instanceId == instanceId;
  })[0];
  if (instance.instanceState.name == 'running') ready();
  else setTimeout(describe, 2500);
}

function ready () {
  console.log('Instance created with id: ' + instanceId);
}
```

I'm afraid you'll find that working with Amazon AWS is a bit wordy. The XML
documents seem to gravitate toward the longest possible element name that could
possibly describe the property.

## Installing

The easiest way to install is using npm.

```
npm install amazon
```

You can also checkout the source code for using `git`. It has only one
dependency, the wonderful little XML parser `node-xml`.

## Initialization

**Node Amazon** exports a function you can use to build a function to connect to
the AWS service of your choice. You can call it directly from `require('amazon')`
to build an `amazon` function configured for your application.

```javascript
var sdb = require('amazon')({ key: '<REDACTED>'
                            , secret: '<REDACTED>'
                            , serivce: 'sdb' });

sdb('ListDomains', {}, function (error, result) {
  if (error) throw error;
  console.log(result)
});
```

The above example creates a SimpleDB function and lists the domains in the
default region, `'us-east-1'`.

Options to the `amazon` function are:

 * `key` &mdash; Your Amazon AWS key.
 * `secret` &mdash; Your Amazon AWS secret key, which you should always keep
   secret.
 * `service` &mdash; The Amazon AWS service identifier.
 * `region` &mdash; Either the region identifier or else the fully qualified
   domain name of the AWS server.

The service identifiers are one of the following.

 * cloudformation &mdash; [AWS CloudFormation](http://aws.amazon.com/documentation/cloudformation/).
 * cloudfront &mdash; [Amazon CloudFront](http://aws.amazon.com/documentation/cloudfront/).
 * monitoring: &mdash; [Amazon CloudWatch](http://aws.amazon.com/documentation/cloudwatch/).
 * is: &mdash; [Amazon DevPay](http://aws.amazon.com/documentation/devpay/).
 * dynamodb: [Amazon DynamoDB](http://aws.amazon.com/documentation/dynamodb/).
 * ec2: [Amazon Elastic Compute Cloud (EC2)](http://aws.amazon.com/documentation/ec2/).
 * elasticmapreduce: [Amazon Elastic MapReduce](http://aws.amazon.com/documentation/elasticmapreduce/).
 * elasticache: [Amazon ElastiCache](http://aws.amazon.com/documentation/elasticache/).
 * fps: [Amazon Flexible Payments Service (FPS and ASP)](http://aws.amazon.com/documentation/fps/).
 * mechanicalturk: [Amazon Mechanical Turk](http://aws.amazon.com/documentation/mturk/).
 * rds: [Amazon Relational Database Service (RDS)](http://aws.amazon.com/documentation/rds/).
 * route53: [Amazon Route 53](http://aws.amazon.com/documentation/route53/).
 * email: [Amazon Simple Email Service (SES)](http://aws.amazon.com/documentation/ses/).
 * sdb: [Amazon SimpleDB](http://aws.amazon.com/documentation/simpledb/).
 * sns: [Amazon Simple Notification Service (SNS)](http://aws.amazon.com/documentation/sns/).
 * sqs: [Amazon Simple Queue Service (SQS)](http://aws.amazon.com/documentation/sqs/).
 * s3: [Amazon Simple Storage Service (S3)](http://aws.amazon.com/documentation/s3/).
 * autoscaling: [Auto Scaling](http://aws.amazon.com/documentation/autoscaling/).
 * elasticbeanstalk: [AWS Elastic Beanstalk](http://aws.amazon.com/documentation/elasticbeanstalk/).
 * iam: [AWS Identity and Access Management (IAM)](http://aws.amazon.com/documentation/iam/).
 * importexport: [AWS Import/Export](http://aws.amazon.com/documentation/importexport/).
 * sts: [AWS Security Token Service](http://aws.amazon.com/documentation/iam/).
 * storagegateway: [AWS Storage Gateway](http://aws.amazon.com/documentation/storagegateway/).
 * elasticloadbalancing: [Elastic Load Balancing](http://aws.amazon.com/documentation/elasticloadbalancing/).

The region identifiers are one of the following.

 * `us-west-2` &mdash; Oregon.
 * `us-west-1` &mdash; California.
 * `us-east-1` &mdash; Virginia.
 * `sa-east-1` &mdash; Sao Paluo.
 * `ap-northeast-1` &mdash; Tokyo.
 * `ap-southeast-1` &mdash; Singapore.
 * `eu-west-1` &mdash; Ireland.
 * `us-gov-west-1` &mdash; US Government.

If you do not specify `region` when you construct your `amazon` function, you
can specify it later when you call your `amazon` function.

## Invocation

Invoke **Node Amazon** by passing a command name, command parameters in an
object, and a callback.

```javascript
var ec2 = require('amazon')({ key: '<REDACTED>'
                            , secret: '<REDACTED>'
                            , region: 'us-east-1'
                            , service: 'ec2'
                            })
  , parameters;

parameters =
{ ImageId: 'ami-2d4aa444'
, KeyName: 'launch_key'
, MinCount: 1
, MaxCount: 1
};

ec2('RunInstances', parameters, function (error, result) {
  if (error) throw error;
  console.log(result)
});
```

You can override configuration details by passing an options object as the first
argument to the **Node Amazon** function.

```javascript
var ec2 = require('amazon')({ key: '<REDACTED>'
                            , secret: '<REDACTED>'
                            , region: 'us-east-1'
                            })
  , parameters;

parameters =
{ ImageId: 'ami-e269e5d2'
, KeyName: 'launch_key'
, MinCount: 1
, MaxCount: 1
};

ec2({ region: 'us-west-2' }, 'RunInstances', parameters, function (error, result) {
  if (error) throw error;
  console.log(result)
});
```

You can also create a new **Node Amazon** function that extends configuration of an
**Node Amazon** function. You can use this to create a base function that holds
your credentials, and specific functions for the specific regions.

```javascript
var ec2 = require('ec2')({ key: '<REDACTED>' , secret: '<REDACTED>' })
  , ec2east = ec2({ region: 'us-east-1' })
  , ec2west = ec2({ region: 'us-west-2' })
  , parameters
  ;

parameters =
{ ImageId: 'ami-e269e5d2'
, KeyName: 'launch_key'
, MinCount: 1
, MaxCount: 1
};

ec2east('RunInstances', parameters, function (error, eastern) {
  if (error) throw error;
  parameters.ImageId = 'ami-e269e5d2';
  ec2west('RunInstances', parameters, function (error, western) {
    if (error) throw error;
    console.log(eastern, western);
  });
});
```

## Why So Simple?

Another implementation might set out to define a library of functions, one for
each function provided by the AWS Amazon API. This way, you could validate the
command name and parameters before you call.

We believe that if there's something wrong with your request, you'll find out
soon enough. The Amazon AWS server that handles your request will do a bang up
job of error checking, and it will be able to do all the error checking in one
place.

On the client side, we could validate parameter names, but on the AWS site
validation goes beyond semantics to authorization, service availability, etc.

If the Amazon service you're using adds a dozen new features overnight, you
don't have to wait for a new version of **Node Amazon** to use them.

Because of this, there is a one to one mapping between the Amazon Query API and
the actions provided by **Node Amazon**. Changes to the Amazon Query API are
available immediately to **Node Amazon** applications.

You can learn more about node-ec2 at the node-ec2 GitHub web page and by reading
the wiki.

## Command Line Interface

**Node Amazon** also comes with a command line interface. The command line
interface is very helpful if you want to examine the JSON results of an Amazon
AWS AWS API call.

The `amazon` program will look for a configuration file at `~/.aws` or else use
the value of the `AWS_CONFIG` environment variable as the path to the
configuration file. The configuration file is the JSON file used to create a
**Node Amazon** function described above. It contains your key, secret key and
the service endpoint.

```
$ amazon ec2 DescribeKeyPairs
{
  "requestId": "1d42624e-a3c8-4dca-8d42-6ac0a11f4468",
  "keySet": [
    {
      "keyName": "automation_key",
      "keyFingerprint": "82:a4:69:ca:89:31:8f:58:75:ae:24:eb:e5:71:78:56:32:09:3a:24"
    },
    {
      "keyName": "temporary_key",
      "keyFingerprint": "c0:14:ff:06:23:dd:52:6a:4d:29:e9:0f:1f:54:13:73:e1:c8:fd:90"
    },
    {
      "keyName": "launch_key",
      "keyFingerprint": "8c:cf:71:0d:84:05:19:cd:7d:89:ca:62:7e:8f:51:0b:16:df:f4:c0"
    }
  ]
}
```

Invocation is first the command name, then command arguments just as they appear
in the Amazon AWS API. Note that some arguments in the API require a number
appended to the argument name.

```
$ amazon ec2 RunInstances ImageId ami-08d97e61 KeyName launch_key MinCount 1 MaxCount 1
{
  "requestId": "7aa586a5-c658-4735-9152-72ad20cb3282",
  "reservationId": "r-de7200bb",
  "ownerId": "341264201128",
  "groupSet": [
    {
      "groupId": "sg-c8f72da7",
      "groupName": "default"
    }
  ],
  "instancesSet": [
    {
      "instanceId": "i-2af0e253",
      "imageId": "ami-08d97e61",
      "instanceState": {
        "code": "0",
        "name": "pending"
      },
      "privateDnsName": null,
      "dnsName": null,
      "reason": null,
      "keyName": "launch_key",
      "amiLaunchIndex": "0",
      "productCodes": null,
      "instanceType": "m1.small",
      "launchTime": "2012-06-28T18:29:55.000Z",
      "placement": {
        "availabilityZone": "us-east-1a",
        "groupName": null,
        "tenancy": "default"
      },
      "kernelId": "aki-407d9529",
      "monitoring": {
        "state": "disabled"
      },
      "groupSet": [
        {
          "groupId": "sg-c8f72da7",
          "groupName": "default"
        }
      ],
      "stateReason": {
        "code": "pending",
        "message": "pending"
      },
      "architecture": "i386",
      "rootDeviceType": "ebs",
      "rootDeviceName": "/dev/sda1",
      "blockDeviceMapping": null,
      "virtualizationType": "paravirtual",
      "clientToken": null,
      "hypervisor": "xen"
    }
  ]
}
```

## Change Log

Changes for each release.

### Version 0.0.0

Released: Mon Jul 23 07:25:52 UTC 2012

 * Build at Travis CI. #11.
 * Specify region on the command line. #8.
 * Specify service on the command line. #7.
 * Map services to API versions. #6.
 * Initial release of Node EC2 expanded to cover all services. #2.
