#!/usr/bin/env node

require("./proof")(1, function (parse, async) {
  parse("Errors", async());
}, function (object, deepEqual) {
  var expected =
  { Errors: [ { Code: 'MissingParameter', Message: 'The request must contain the parameter MinCount' } ]
  , RequestID: '2258815d-0be5-4491-b199-673aec77dfe3'
  };
  deepEqual(object, expected, "parse errors");
});
