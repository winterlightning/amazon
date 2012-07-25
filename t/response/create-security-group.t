#!/usr/bin/env node

require("./proof")(1, function (parse, callback) {
  parse("CreateSecurityGroup", callback);
}, function (object, deepEqual) {
  var expected = { "return": true };
  deepEqual(object, expected, "parse errors");
});
