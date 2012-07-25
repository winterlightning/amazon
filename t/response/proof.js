var _parse = require("../../lib/response").parse
  , fs = require("fs");
module.exports = require("proof")(function () {
  function parse (name, callback) {
    _parse(fs.readFileSync(__dirname + "/responses/" + name, "utf8"), callback);
  }
  return { parse: parse };
});
