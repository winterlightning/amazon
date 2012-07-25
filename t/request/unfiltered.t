#!/usr/bin/env node

var configuration =
{ key: 'AKIAIBI7OMTXJHBKKPRA'
, secret: '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'
, region: 'us-east-1'
, service: 'ec2'
};

require('proof')(1, function (callback) {
  var ec2 = require('../..')(configuration);
  ec2('DescribeRegions', {}, callback);
}, function (object, equal) {
  equal(object.regionInfo.filter(function (info) { return info.regionName == 'us-east-1' }).length, 1, 'request');
});
