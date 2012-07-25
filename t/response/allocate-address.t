#!/usr/bin/env node

require("./proof")(1, function (parse, callback) {
  parse("AllocateAddress", callback);
}, function (object, deepEqual) {
  var expected = { "publicIp": "67.202.55.255" };
  deepEqual(object, expected, "parse allocate address");
});
