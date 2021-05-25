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
const regexp_safe = (rule) => {
  let rexp = (typeof rule === 'string') ? rule.match(/^(\W)(.+)\1$/) : null;
  retrun (rexp !== null) ? new RegExp(rexp[2]) : rule;
}
const isMatch = (o,pos,neg,flags = []) => {  // `and` operand, default
  for(let rule of pos)
    flags.push(  rule.test(o) );
  for(let rule of neg)
    flags.push( !rule.test(o) );
  return !flags.includes(false);
}
const essentialFiles = (files, irules, xrules) => files.filter( (file)=>isMatch(file,irules,xrules) );
const expressions = (args,expr,last) => {
    for(let ex of expr){
        if( /^\-/.test(ex) && operands(last) ){
          delete args[last];
          last = `${last} ${ex}`;
          ex = '';
        } else if ( /^\-/.test(ex) ) {
          last = ex;
          ex = '';
        }
        // please accept multiple `-iname`s
        if(last.length == 0)  console.log("Review the command.");
        else  args[last] = ex;
    }
    args.irules = makerules([],args,Object.keys(args).filter( (e)=>/^(\-i?name|\-i?regex)$/.test(e) ));
    args.xrules = makerules([],args,Object.keys(args).filter( (e)=>/^\-not (\-i?name|\-i?regex)$/.test(e) ));
    return args;
}
const makerules = (rules,ruble,rulekeys) => {
  for(let rulekey of rulekeys){
      let rexp = (typeof ruble[rulekey] === 'string') ? ruble[rulekey].match(/^(\W)(.+)\1$/) : null;  // wildcard '*' is also trimmed, if enclosing
      let rule = (rexp !== null) ? rexp[2] : ruble[rulekey];
            if ( /\-i?name/.test(rulekey) || /\-not\s+\-i?name/.test(rulekey) ){
        rules.push( new RegExp(rule.replace(/\*/g,".$1"),/\-i/.test(rulekey) ? "i" : "") );
      } else if ( /\-i?regex/.test(rulekey) || /\-not\s+\-i?regex/.test(rulekey) ) {
        rules.push( new RegExp(rule                     ,/\-i/.test(rulekey) ? "i" : "") );
      }
  }
  return rules;
}
const operands = (e) => /^(\-not|\-and|\-a|\-or?)$/.test(e);
const commands = (e) => /^(\-print0?|\-ls|\-empty|\-true|\-false|\-delete)$/.test(e);

let roots = [pc.argv[2]];
let files = [];
let args = expressions({},pc.argv.slice(3),'');
console.log(args);

  for(let root of roots)
    files = getAllFiles(root,files);

console.log("N(Found): "+files.length);

console.log( essentialFiles( (args["-type"] == "f") ? files : files.filter( (e)=>fs.statSync(e).isDirectory() ),args.irules,args.xrules) );
