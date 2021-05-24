const pc = require('process');//console.log(pc.argv);
const fs = require('fs');
const path = require('path');

const getAllFiles = (root, files) => {
  let contents = fs.readdirSync(root);
  files = files || [];

  contents.forEach(function(content) {
    if (fs.statSync(root + "\\" + content).isDirectory())
      files = getAllFiles(root + "\\" + content, files);
    else
      files.push(path.join(root, "\\", content));
  });
  return files;
}
const ruleTest = (o,rule) => {
  let rexp = (typeof rule === 'string') ? rule.match(/^(\W)(.+)\1$/) : null;
  if( rexp !== null )  rule = rexp[2];
  return (typeof rule === 'string') ? (new RegExp(rule)).test(o) : rule.test(o);
}
const isMatch = (o,pos,neg) => {
  // `and` operand, default
  let flags = new Set();
  for(let rule of pos)
    flags.add(  ruleTest(o,rule) );
  for(let rule of neg)
    flags.add( !ruleTest(o,rule) );
  return !flags.has(false);
}
const essentialFiles = (files, callback, irules, xrules) => files.filter( (file)=>isMatch(file,irules,xrules) );
//const essentialFiles = (files, irules, xrules) => files.filter( (file)=>isMatch(file.map((e)=>e.match(/^(.+)\/.+?$/)),irules,xrules) );
const expressions = (expr,args={},last='') => {
    for(let ex of expr){
        if( /^\-/.test(ex) && operands(last) ){
          delete args[last];
          args = {"${last} ${ex}":''};
          last = "${last} ${ex}";
        //} else if ( /^\-/.test(ex) && commands(last) ) {
        } else if ( /^\-/.test(ex) ) {
          args[ex] = '';
          last = ex;
        } else { // please accept multiple `-iname`s
          args[last] = ex;
        }
    }
    args.irules = makerules([],args,(e)=>/^(\-name|\-iname|\-regex|\-iregex)$/.test(e));
    args.xrules = makerules([],args,(e)=>/^\-not (\-name|\-iname|\-regex|\-iregex)$/.test(e));
    return args;
}
const makerules = (rules,ruble,callback) => {
  let rulekeys = Object.keys(ruble).filter(callback);
  for(let rulekey of rulekeys){
      if( /\-name/.test(rulekey) ){
        rules.push( new RegExp(ruble[rulekey].replace(/\*/g,".*")) );
      } else if ( /\-iname/.test(rulekey) ){
        rules.push( new RegExp(ruble[rulekey].replace(/\*/g,".*"),"i") );
      } else if (/\-regex/.test(rulekey)) {
        rules.push(            ruble[rulekey]      );
      } else if (/\-iregex/.test(rulekey)) {
        rules.push( new RegExp(ruble[rulekey],"i") );
      }
  }
  return rules;
}
const operands = (e) => /^(\-not|\-and|\-a|\-or?)$/.test(e);
const commands = (e) => /^(\-print0?|\-ls|\-empty|\-true|\-false|\-delete)$/.test(e);

let roots = [pc.argv[2]];
let files = [];
let args = expressions(pc.argv.slice(3));
console.log(args);

  for(let root of roots)
    files = getAllFiles(root,files);

console.log("N(Found): "+files.length);

console.log( essentialFiles( (args["-type"] == "f") ? files : files.filter( (e)=>fs.statSync(e).isDirectory() ),args.irules,args.xrules) );
