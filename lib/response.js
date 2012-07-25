var isTimestamp = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}).(\d*)Z/
  , xmldom = require('xmldom')
  ;

function parse (text, callback) {
  var accumulator = [], depth = 0, names = [], base = {}, branches = [base]
    , value, map, match;

  children(new (xmldom.DOMParser)().parseFromString(text).documentElement);

  function children (child) {
    for (; child != null; child = child.nextSibling) {
      switch (child.nodeType) {
      case 1:
        element(child);
        break;
      case 3:
      case 4:
        onCharacters(child);
        break;
      }
    }
  }

  function element (node) {
    var name = node.localName, isError = /^item|Error$/.test(name);
    if (isError) {
      if (branches.length !== depth) branches.push([]);
      names.push(name);
    } else if (depth !== 0) {
      if (depth > 1 && branches.length !== depth) {
        branches.push({});
      }
      names.push(name);
    }
    accumulator.length = 0;
    depth++;
    children(node.firstChild);
    if (!--depth) {
      callback(null, base);
    } else if (/^item|Error$/.test(names[depth - 1])) {
      map = branches.pop();
      branches[branches.length - 1].push(map);
      names.pop();
    } else if (branches[depth]) {
      map = branches.pop();
      branches[branches.length - 1][names.pop()] = map;
    } else {
      name = names.pop();
      if (accumulator.length === 0) {
        value = null;
        if (name === 'Errors' || /Set$/.test(name)) value = [];
      } else {
        value = accumulator.join('');
        if (/Time$/.test(name)) {
          match = isTimestamp.exec(value);
          if (match) {
            match = match.slice(1).map(function(part) { return +part });
            match[1]--;
            value = new Date(Date.UTC.apply(null, match));
          }
        }
        if (/size$/i.test(name)) value = parseInt(value, 10);
        if (name === 'return' && /^true|false$/.test(value)) {
          value = value === 'true';
        }
      }
      branches[branches.length - 1][name] = value;
      accumulator.length = 0;
    }
  }

  function onCharacters (node) {
    var chars = node.nodeValue;
    if (accumulator.length === 0 && /\S/.test(chars)) {
      accumulator.push(chars);
    }
  }
}

module.exports.parse = parse;
