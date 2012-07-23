var regions, publicRegions;

module.exports.regions = regions =
[ 'us-gov-west-1'
, 'us-east-1'
, 'us-west-1'
, 'us-west-2'
, 'eu-west-1'
, 'ap-southeast-1'
, 'ap-north-east'
, 'sa-east-1'
];

publicRegions = regions.slice(1);

module.exports.service = {};
module.exports.service.regions =
{ cloudformation: publicRegions
, cloudfront: []
, monitoring: regions
, is: []
, dynamodb: publicRegions
, ec2: regions
, elasticmapreduce: publicRegions
, fps: [ 'sandbox' ]
, mechanicalturk: [ 'sandbox' ]
, rds: publicRegions
, route53: []
, email: [ 'us-east-1' ]
, sdb: publicRegions
, sns: publicRegions
, s3: regions
, autoscaling: publicRegions
, elasticbeanstalk: [ 'us-east-1', 'ap-northeast-1', 'eu-west-1', 'us-west-1', 'us-west-2']
, iam: [ 'us-gov-west-1' ]
, importexport: []
, sts: [ 'us-gov-west-1' ]
, storagegateway: publicRegions
, elasticloadbalancing: publicRegions
};

module.exports.service.version =
{ cloudformation: '2010-05-15'
, cloudfront: '2012-05-05'
, monitoring: '2010-08-01'
, is: '2008-04-28'
, dynamodb: '2011-12-05'
, ec2: '2012-06-15'
, elasticmapreduce: '2009-03-31'
, elasticache: '2012-03-09'
, fps: '2010-08-28'
, mechanicalturk: '2012-03-25'
, rds: '2012-04-23'
, route53: '2012-02-29'
, email: '2010-12-01'
, sdb: '2009-04-15'
, sns: '2010-03-31'
, sqs: '2011-10-01'
, s3: '2006-03-01'
, autoscaling: '2011-01-01'
, elasticbeanstalk: '2010-12-01'
, iam: '2010-05-08'
, importexport: '2010-06-03'
, sts: ' 2011-06-15'
, storagegateway: '2012-04-30'
, elasticloadbalancing: '2012-06-01'
};
