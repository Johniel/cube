var CLOSURE_NO_DEPS = true;
var COMPILED = false;
var goog = goog || {};
goog.global = this;
goog.DEBUG = true;
goog.LOCALE = "en";
goog.TRUSTED_SITE = true;
goog.provide = function(name) {
  if(!COMPILED) {
    if(goog.isProvided_(name)) {
      throw Error('Namespace "' + name + '" already declared.');
    }
    delete goog.implicitNamespaces_[name];
    var namespace = name;
    while(namespace = namespace.substring(0, namespace.lastIndexOf("."))) {
      if(goog.getObjectByName(namespace)) {
        break
      }
      goog.implicitNamespaces_[namespace] = true
    }
  }
  goog.exportPath_(name)
};
goog.setTestOnly = function(opt_message) {
  if(COMPILED && !goog.DEBUG) {
    opt_message = opt_message || "";
    throw Error("Importing test-only code into non-debug environment" + opt_message ? ": " + opt_message : ".");
  }
};
if(!COMPILED) {
  goog.isProvided_ = function(name) {
    return!goog.implicitNamespaces_[name] && !!goog.getObjectByName(name)
  };
  goog.implicitNamespaces_ = {}
}
goog.exportPath_ = function(name, opt_object, opt_objectToExportTo) {
  var parts = name.split(".");
  var cur = opt_objectToExportTo || goog.global;
  if(!(parts[0] in cur) && cur.execScript) {
    cur.execScript("var " + parts[0])
  }
  for(var part;parts.length && (part = parts.shift());) {
    if(!parts.length && goog.isDef(opt_object)) {
      cur[part] = opt_object
    }else {
      if(cur[part]) {
        cur = cur[part]
      }else {
        cur = cur[part] = {}
      }
    }
  }
};
goog.getObjectByName = function(name, opt_obj) {
  var parts = name.split(".");
  var cur = opt_obj || goog.global;
  for(var part;part = parts.shift();) {
    if(goog.isDefAndNotNull(cur[part])) {
      cur = cur[part]
    }else {
      return null
    }
  }
  return cur
};
goog.globalize = function(obj, opt_global) {
  var global = opt_global || goog.global;
  for(var x in obj) {
    global[x] = obj[x]
  }
};
goog.addDependency = function(relPath, provides, requires) {
  if(!COMPILED) {
    var provide, require;
    var path = relPath.replace(/\\/g, "/");
    var deps = goog.dependencies_;
    for(var i = 0;provide = provides[i];i++) {
      deps.nameToPath[provide] = path;
      if(!(path in deps.pathToNames)) {
        deps.pathToNames[path] = {}
      }
      deps.pathToNames[path][provide] = true
    }
    for(var j = 0;require = requires[j];j++) {
      if(!(path in deps.requires)) {
        deps.requires[path] = {}
      }
      deps.requires[path][require] = true
    }
  }
};
goog.ENABLE_DEBUG_LOADER = true;
goog.require = function(name) {
  if(!COMPILED) {
    if(goog.isProvided_(name)) {
      return
    }
    if(goog.ENABLE_DEBUG_LOADER) {
      var path = goog.getPathFromDeps_(name);
      if(path) {
        goog.included_[path] = true;
        goog.writeScripts_();
        return
      }
    }
    var errorMessage = "goog.require could not find: " + name;
    if(goog.global.console) {
      goog.global.console["error"](errorMessage)
    }
    throw Error(errorMessage);
  }
};
goog.basePath = "";
goog.global.CLOSURE_BASE_PATH;
goog.global.CLOSURE_NO_DEPS;
goog.global.CLOSURE_IMPORT_SCRIPT;
goog.nullFunction = function() {
};
goog.identityFunction = function(opt_returnValue, var_args) {
  return opt_returnValue
};
goog.abstractMethod = function() {
  throw Error("unimplemented abstract method");
};
goog.addSingletonGetter = function(ctor) {
  ctor.getInstance = function() {
    if(ctor.instance_) {
      return ctor.instance_
    }
    if(goog.DEBUG) {
      goog.instantiatedSingletons_[goog.instantiatedSingletons_.length] = ctor
    }
    return ctor.instance_ = new ctor
  }
};
goog.instantiatedSingletons_ = [];
if(!COMPILED && goog.ENABLE_DEBUG_LOADER) {
  goog.included_ = {};
  goog.dependencies_ = {pathToNames:{}, nameToPath:{}, requires:{}, visited:{}, written:{}};
  goog.inHtmlDocument_ = function() {
    var doc = goog.global.document;
    return typeof doc != "undefined" && "write" in doc
  };
  goog.findBasePath_ = function() {
    if(goog.global.CLOSURE_BASE_PATH) {
      goog.basePath = goog.global.CLOSURE_BASE_PATH;
      return
    }else {
      if(!goog.inHtmlDocument_()) {
        return
      }
    }
    var doc = goog.global.document;
    var scripts = doc.getElementsByTagName("script");
    for(var i = scripts.length - 1;i >= 0;--i) {
      var src = scripts[i].src;
      var qmark = src.lastIndexOf("?");
      var l = qmark == -1 ? src.length : qmark;
      if(src.substr(l - 7, 7) == "base.js") {
        goog.basePath = src.substr(0, l - 7);
        return
      }
    }
  };
  goog.importScript_ = function(src) {
    var importScript = goog.global.CLOSURE_IMPORT_SCRIPT || goog.writeScriptTag_;
    if(!goog.dependencies_.written[src] && importScript(src)) {
      goog.dependencies_.written[src] = true
    }
  };
  goog.writeScriptTag_ = function(src) {
    if(goog.inHtmlDocument_()) {
      var doc = goog.global.document;
      if(doc.readyState == "complete") {
        var isDeps = /\bdeps.js$/.test(src);
        if(isDeps) {
          return false
        }else {
          throw Error('Cannot write "' + src + '" after document load');
        }
      }
      doc.write('\x3cscript type\x3d"text/javascript" src\x3d"' + src + '"\x3e\x3c/' + "script\x3e");
      return true
    }else {
      return false
    }
  };
  goog.writeScripts_ = function() {
    var scripts = [];
    var seenScript = {};
    var deps = goog.dependencies_;
    function visitNode(path) {
      if(path in deps.written) {
        return
      }
      if(path in deps.visited) {
        if(!(path in seenScript)) {
          seenScript[path] = true;
          scripts.push(path)
        }
        return
      }
      deps.visited[path] = true;
      if(path in deps.requires) {
        for(var requireName in deps.requires[path]) {
          if(!goog.isProvided_(requireName)) {
            if(requireName in deps.nameToPath) {
              visitNode(deps.nameToPath[requireName])
            }else {
              throw Error("Undefined nameToPath for " + requireName);
            }
          }
        }
      }
      if(!(path in seenScript)) {
        seenScript[path] = true;
        scripts.push(path)
      }
    }
    for(var path in goog.included_) {
      if(!deps.written[path]) {
        visitNode(path)
      }
    }
    for(var i = 0;i < scripts.length;i++) {
      if(scripts[i]) {
        goog.importScript_(goog.basePath + scripts[i])
      }else {
        throw Error("Undefined script input");
      }
    }
  };
  goog.getPathFromDeps_ = function(rule) {
    if(rule in goog.dependencies_.nameToPath) {
      return goog.dependencies_.nameToPath[rule]
    }else {
      return null
    }
  };
  goog.findBasePath_();
  if(!goog.global.CLOSURE_NO_DEPS) {
    goog.importScript_(goog.basePath + "deps.js")
  }
}
goog.typeOf = function(value) {
  var s = typeof value;
  if(s == "object") {
    if(value) {
      if(value instanceof Array) {
        return"array"
      }else {
        if(value instanceof Object) {
          return s
        }
      }
      var className = Object.prototype.toString.call((value));
      if(className == "[object Window]") {
        return"object"
      }
      if(className == "[object Array]" || typeof value.length == "number" && typeof value.splice != "undefined" && typeof value.propertyIsEnumerable != "undefined" && !value.propertyIsEnumerable("splice")) {
        return"array"
      }
      if(className == "[object Function]" || typeof value.call != "undefined" && typeof value.propertyIsEnumerable != "undefined" && !value.propertyIsEnumerable("call")) {
        return"function"
      }
    }else {
      return"null"
    }
  }else {
    if(s == "function" && typeof value.call == "undefined") {
      return"object"
    }
  }
  return s
};
goog.isDef = function(val) {
  return val !== undefined
};
goog.isNull = function(val) {
  return val === null
};
goog.isDefAndNotNull = function(val) {
  return val != null
};
goog.isArray = function(val) {
  return goog.typeOf(val) == "array"
};
goog.isArrayLike = function(val) {
  var type = goog.typeOf(val);
  return type == "array" || type == "object" && typeof val.length == "number"
};
goog.isDateLike = function(val) {
  return goog.isObject(val) && typeof val.getFullYear == "function"
};
goog.isString = function(val) {
  return typeof val == "string"
};
goog.isBoolean = function(val) {
  return typeof val == "boolean"
};
goog.isNumber = function(val) {
  return typeof val == "number"
};
goog.isFunction = function(val) {
  return goog.typeOf(val) == "function"
};
goog.isObject = function(val) {
  var type = typeof val;
  return type == "object" && val != null || type == "function"
};
goog.getUid = function(obj) {
  return obj[goog.UID_PROPERTY_] || (obj[goog.UID_PROPERTY_] = ++goog.uidCounter_)
};
goog.removeUid = function(obj) {
  if("removeAttribute" in obj) {
    obj.removeAttribute(goog.UID_PROPERTY_)
  }
  try {
    delete obj[goog.UID_PROPERTY_]
  }catch(ex) {
  }
};
goog.UID_PROPERTY_ = "closure_uid_" + (Math.random() * 1E9 >>> 0);
goog.uidCounter_ = 0;
goog.getHashCode = goog.getUid;
goog.removeHashCode = goog.removeUid;
goog.cloneObject = function(obj) {
  var type = goog.typeOf(obj);
  if(type == "object" || type == "array") {
    if(obj.clone) {
      return obj.clone()
    }
    var clone = type == "array" ? [] : {};
    for(var key in obj) {
      clone[key] = goog.cloneObject(obj[key])
    }
    return clone
  }
  return obj
};
goog.bindNative_ = function(fn, selfObj, var_args) {
  return(fn.call.apply(fn.bind, arguments))
};
goog.bindJs_ = function(fn, selfObj, var_args) {
  if(!fn) {
    throw new Error;
  }
  if(arguments.length > 2) {
    var boundArgs = Array.prototype.slice.call(arguments, 2);
    return function() {
      var newArgs = Array.prototype.slice.call(arguments);
      Array.prototype.unshift.apply(newArgs, boundArgs);
      return fn.apply(selfObj, newArgs)
    }
  }else {
    return function() {
      return fn.apply(selfObj, arguments)
    }
  }
};
goog.bind = function(fn, selfObj, var_args) {
  if(Function.prototype.bind && Function.prototype.bind.toString().indexOf("native code") != -1) {
    goog.bind = goog.bindNative_
  }else {
    goog.bind = goog.bindJs_
  }
  return goog.bind.apply(null, arguments)
};
goog.partial = function(fn, var_args) {
  var args = Array.prototype.slice.call(arguments, 1);
  return function() {
    var newArgs = Array.prototype.slice.call(arguments);
    newArgs.unshift.apply(newArgs, args);
    return fn.apply(this, newArgs)
  }
};
goog.mixin = function(target, source) {
  for(var x in source) {
    target[x] = source[x]
  }
};
goog.now = goog.TRUSTED_SITE && Date.now || function() {
  return+new Date
};
goog.globalEval = function(script) {
  if(goog.global.execScript) {
    goog.global.execScript(script, "JavaScript")
  }else {
    if(goog.global.eval) {
      if(goog.evalWorksForGlobals_ == null) {
        goog.global.eval("var _et_ \x3d 1;");
        if(typeof goog.global["_et_"] != "undefined") {
          delete goog.global["_et_"];
          goog.evalWorksForGlobals_ = true
        }else {
          goog.evalWorksForGlobals_ = false
        }
      }
      if(goog.evalWorksForGlobals_) {
        goog.global.eval(script)
      }else {
        var doc = goog.global.document;
        var scriptElt = doc.createElement("script");
        scriptElt.type = "text/javascript";
        scriptElt.defer = false;
        scriptElt.appendChild(doc.createTextNode(script));
        doc.body.appendChild(scriptElt);
        doc.body.removeChild(scriptElt)
      }
    }else {
      throw Error("goog.globalEval not available");
    }
  }
};
goog.evalWorksForGlobals_ = null;
goog.cssNameMapping_;
goog.cssNameMappingStyle_;
goog.getCssName = function(className, opt_modifier) {
  var getMapping = function(cssName) {
    return goog.cssNameMapping_[cssName] || cssName
  };
  var renameByParts = function(cssName) {
    var parts = cssName.split("-");
    var mapped = [];
    for(var i = 0;i < parts.length;i++) {
      mapped.push(getMapping(parts[i]))
    }
    return mapped.join("-")
  };
  var rename;
  if(goog.cssNameMapping_) {
    rename = goog.cssNameMappingStyle_ == "BY_WHOLE" ? getMapping : renameByParts
  }else {
    rename = function(a) {
      return a
    }
  }
  if(opt_modifier) {
    return className + "-" + rename(opt_modifier)
  }else {
    return rename(className)
  }
};
goog.setCssNameMapping = function(mapping, opt_style) {
  goog.cssNameMapping_ = mapping;
  goog.cssNameMappingStyle_ = opt_style
};
goog.global.CLOSURE_CSS_NAME_MAPPING;
if(!COMPILED && goog.global.CLOSURE_CSS_NAME_MAPPING) {
  goog.cssNameMapping_ = goog.global.CLOSURE_CSS_NAME_MAPPING
}
goog.getMsg = function(str, opt_values) {
  var values = opt_values || {};
  for(var key in values) {
    var value = ("" + values[key]).replace(/\$/g, "$$$$");
    str = str.replace(new RegExp("\\{\\$" + key + "\\}", "gi"), value)
  }
  return str
};
goog.getMsgWithFallback = function(a, b) {
  return a
};
goog.exportSymbol = function(publicPath, object, opt_objectToExportTo) {
  goog.exportPath_(publicPath, object, opt_objectToExportTo)
};
goog.exportProperty = function(object, publicName, symbol) {
  object[publicName] = symbol
};
goog.inherits = function(childCtor, parentCtor) {
  function tempCtor() {
  }
  tempCtor.prototype = parentCtor.prototype;
  childCtor.superClass_ = parentCtor.prototype;
  childCtor.prototype = new tempCtor;
  childCtor.prototype.constructor = childCtor
};
goog.base = function(me, opt_methodName, var_args) {
  var caller = arguments.callee.caller;
  if(caller.superClass_) {
    return caller.superClass_.constructor.apply(me, Array.prototype.slice.call(arguments, 1))
  }
  var args = Array.prototype.slice.call(arguments, 2);
  var foundCaller = false;
  for(var ctor = me.constructor;ctor;ctor = ctor.superClass_ && ctor.superClass_.constructor) {
    if(ctor.prototype[opt_methodName] === caller) {
      foundCaller = true
    }else {
      if(foundCaller) {
        return ctor.prototype[opt_methodName].apply(me, args)
      }
    }
  }
  if(me[opt_methodName] === caller) {
    return me.constructor.prototype[opt_methodName].apply(me, args)
  }else {
    throw Error("goog.base called from a method of one name " + "to a method of a different name");
  }
};
goog.scope = function(fn) {
  fn.call(goog.global)
};
goog.provide("goog.debug.Error");
goog.debug.Error = function(opt_msg) {
  if(Error.captureStackTrace) {
    Error.captureStackTrace(this, goog.debug.Error)
  }else {
    this.stack = (new Error).stack || ""
  }
  if(opt_msg) {
    this.message = String(opt_msg)
  }
};
goog.inherits(goog.debug.Error, Error);
goog.debug.Error.prototype.name = "CustomError";
goog.provide("goog.string");
goog.provide("goog.string.Unicode");
goog.string.Unicode = {NBSP:"\u00a0"};
goog.string.startsWith = function(str, prefix) {
  return str.lastIndexOf(prefix, 0) == 0
};
goog.string.endsWith = function(str, suffix) {
  var l = str.length - suffix.length;
  return l >= 0 && str.indexOf(suffix, l) == l
};
goog.string.caseInsensitiveStartsWith = function(str, prefix) {
  return goog.string.caseInsensitiveCompare(prefix, str.substr(0, prefix.length)) == 0
};
goog.string.caseInsensitiveEndsWith = function(str, suffix) {
  return goog.string.caseInsensitiveCompare(suffix, str.substr(str.length - suffix.length, suffix.length)) == 0
};
goog.string.subs = function(str, var_args) {
  for(var i = 1;i < arguments.length;i++) {
    var replacement = String(arguments[i]).replace(/\$/g, "$$$$");
    str = str.replace(/\%s/, replacement)
  }
  return str
};
goog.string.collapseWhitespace = function(str) {
  return str.replace(/[\s\xa0]+/g, " ").replace(/^\s+|\s+$/g, "")
};
goog.string.isEmpty = function(str) {
  return/^[\s\xa0]*$/.test(str)
};
goog.string.isEmptySafe = function(str) {
  return goog.string.isEmpty(goog.string.makeSafe(str))
};
goog.string.isBreakingWhitespace = function(str) {
  return!/[^\t\n\r ]/.test(str)
};
goog.string.isAlpha = function(str) {
  return!/[^a-zA-Z]/.test(str)
};
goog.string.isNumeric = function(str) {
  return!/[^0-9]/.test(str)
};
goog.string.isAlphaNumeric = function(str) {
  return!/[^a-zA-Z0-9]/.test(str)
};
goog.string.isSpace = function(ch) {
  return ch == " "
};
goog.string.isUnicodeChar = function(ch) {
  return ch.length == 1 && ch >= " " && ch <= "~" || ch >= "\u0080" && ch <= "\ufffd"
};
goog.string.stripNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)+/g, " ")
};
goog.string.canonicalizeNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)/g, "\n")
};
goog.string.normalizeWhitespace = function(str) {
  return str.replace(/\xa0|\s/g, " ")
};
goog.string.normalizeSpaces = function(str) {
  return str.replace(/\xa0|[ \t]+/g, " ")
};
goog.string.collapseBreakingSpaces = function(str) {
  return str.replace(/[\t\r\n ]+/g, " ").replace(/^[\t\r\n ]+|[\t\r\n ]+$/g, "")
};
goog.string.trim = function(str) {
  return str.replace(/^[\s\xa0]+|[\s\xa0]+$/g, "")
};
goog.string.trimLeft = function(str) {
  return str.replace(/^[\s\xa0]+/, "")
};
goog.string.trimRight = function(str) {
  return str.replace(/[\s\xa0]+$/, "")
};
goog.string.caseInsensitiveCompare = function(str1, str2) {
  var test1 = String(str1).toLowerCase();
  var test2 = String(str2).toLowerCase();
  if(test1 < test2) {
    return-1
  }else {
    if(test1 == test2) {
      return 0
    }else {
      return 1
    }
  }
};
goog.string.numerateCompareRegExp_ = /(\.\d+)|(\d+)|(\D+)/g;
goog.string.numerateCompare = function(str1, str2) {
  if(str1 == str2) {
    return 0
  }
  if(!str1) {
    return-1
  }
  if(!str2) {
    return 1
  }
  var tokens1 = str1.toLowerCase().match(goog.string.numerateCompareRegExp_);
  var tokens2 = str2.toLowerCase().match(goog.string.numerateCompareRegExp_);
  var count = Math.min(tokens1.length, tokens2.length);
  for(var i = 0;i < count;i++) {
    var a = tokens1[i];
    var b = tokens2[i];
    if(a != b) {
      var num1 = parseInt(a, 10);
      if(!isNaN(num1)) {
        var num2 = parseInt(b, 10);
        if(!isNaN(num2) && num1 - num2) {
          return num1 - num2
        }
      }
      return a < b ? -1 : 1
    }
  }
  if(tokens1.length != tokens2.length) {
    return tokens1.length - tokens2.length
  }
  return str1 < str2 ? -1 : 1
};
goog.string.urlEncode = function(str) {
  return encodeURIComponent(String(str))
};
goog.string.urlDecode = function(str) {
  return decodeURIComponent(str.replace(/\+/g, " "))
};
goog.string.newLineToBr = function(str, opt_xml) {
  return str.replace(/(\r\n|\r|\n)/g, opt_xml ? "\x3cbr /\x3e" : "\x3cbr\x3e")
};
goog.string.htmlEscape = function(str, opt_isLikelyToContainHtmlChars) {
  if(opt_isLikelyToContainHtmlChars) {
    return str.replace(goog.string.amperRe_, "\x26amp;").replace(goog.string.ltRe_, "\x26lt;").replace(goog.string.gtRe_, "\x26gt;").replace(goog.string.quotRe_, "\x26quot;")
  }else {
    if(!goog.string.allRe_.test(str)) {
      return str
    }
    if(str.indexOf("\x26") != -1) {
      str = str.replace(goog.string.amperRe_, "\x26amp;")
    }
    if(str.indexOf("\x3c") != -1) {
      str = str.replace(goog.string.ltRe_, "\x26lt;")
    }
    if(str.indexOf("\x3e") != -1) {
      str = str.replace(goog.string.gtRe_, "\x26gt;")
    }
    if(str.indexOf('"') != -1) {
      str = str.replace(goog.string.quotRe_, "\x26quot;")
    }
    return str
  }
};
goog.string.amperRe_ = /&/g;
goog.string.ltRe_ = /</g;
goog.string.gtRe_ = />/g;
goog.string.quotRe_ = /\"/g;
goog.string.allRe_ = /[&<>\"]/;
goog.string.unescapeEntities = function(str) {
  if(goog.string.contains(str, "\x26")) {
    if("document" in goog.global) {
      return goog.string.unescapeEntitiesUsingDom_(str)
    }else {
      return goog.string.unescapePureXmlEntities_(str)
    }
  }
  return str
};
goog.string.unescapeEntitiesUsingDom_ = function(str) {
  var seen = {"\x26amp;":"\x26", "\x26lt;":"\x3c", "\x26gt;":"\x3e", "\x26quot;":'"'};
  var div = document.createElement("div");
  return str.replace(goog.string.HTML_ENTITY_PATTERN_, function(s, entity) {
    var value = seen[s];
    if(value) {
      return value
    }
    if(entity.charAt(0) == "#") {
      var n = Number("0" + entity.substr(1));
      if(!isNaN(n)) {
        value = String.fromCharCode(n)
      }
    }
    if(!value) {
      div.innerHTML = s + " ";
      value = div.firstChild.nodeValue.slice(0, -1)
    }
    return seen[s] = value
  })
};
goog.string.unescapePureXmlEntities_ = function(str) {
  return str.replace(/&([^;]+);/g, function(s, entity) {
    switch(entity) {
      case "amp":
        return"\x26";
      case "lt":
        return"\x3c";
      case "gt":
        return"\x3e";
      case "quot":
        return'"';
      default:
        if(entity.charAt(0) == "#") {
          var n = Number("0" + entity.substr(1));
          if(!isNaN(n)) {
            return String.fromCharCode(n)
          }
        }
        return s
    }
  })
};
goog.string.HTML_ENTITY_PATTERN_ = /&([^;\s<&]+);?/g;
goog.string.whitespaceEscape = function(str, opt_xml) {
  return goog.string.newLineToBr(str.replace(/  /g, " \x26#160;"), opt_xml)
};
goog.string.stripQuotes = function(str, quoteChars) {
  var length = quoteChars.length;
  for(var i = 0;i < length;i++) {
    var quoteChar = length == 1 ? quoteChars : quoteChars.charAt(i);
    if(str.charAt(0) == quoteChar && str.charAt(str.length - 1) == quoteChar) {
      return str.substring(1, str.length - 1)
    }
  }
  return str
};
goog.string.truncate = function(str, chars, opt_protectEscapedCharacters) {
  if(opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str)
  }
  if(str.length > chars) {
    str = str.substring(0, chars - 3) + "..."
  }
  if(opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str)
  }
  return str
};
goog.string.truncateMiddle = function(str, chars, opt_protectEscapedCharacters, opt_trailingChars) {
  if(opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str)
  }
  if(opt_trailingChars && str.length > chars) {
    if(opt_trailingChars > chars) {
      opt_trailingChars = chars
    }
    var endPoint = str.length - opt_trailingChars;
    var startPoint = chars - opt_trailingChars;
    str = str.substring(0, startPoint) + "..." + str.substring(endPoint)
  }else {
    if(str.length > chars) {
      var half = Math.floor(chars / 2);
      var endPos = str.length - half;
      half += chars % 2;
      str = str.substring(0, half) + "..." + str.substring(endPos)
    }
  }
  if(opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str)
  }
  return str
};
goog.string.specialEscapeChars_ = {"\x00":"\\0", "\b":"\\b", "\f":"\\f", "\n":"\\n", "\r":"\\r", "\t":"\\t", "\x0B":"\\x0B", '"':'\\"', "\\":"\\\\"};
goog.string.jsEscapeCache_ = {"'":"\\'"};
goog.string.quote = function(s) {
  s = String(s);
  if(s.quote) {
    return s.quote()
  }else {
    var sb = ['"'];
    for(var i = 0;i < s.length;i++) {
      var ch = s.charAt(i);
      var cc = ch.charCodeAt(0);
      sb[i + 1] = goog.string.specialEscapeChars_[ch] || (cc > 31 && cc < 127 ? ch : goog.string.escapeChar(ch))
    }
    sb.push('"');
    return sb.join("")
  }
};
goog.string.escapeString = function(str) {
  var sb = [];
  for(var i = 0;i < str.length;i++) {
    sb[i] = goog.string.escapeChar(str.charAt(i))
  }
  return sb.join("")
};
goog.string.escapeChar = function(c) {
  if(c in goog.string.jsEscapeCache_) {
    return goog.string.jsEscapeCache_[c]
  }
  if(c in goog.string.specialEscapeChars_) {
    return goog.string.jsEscapeCache_[c] = goog.string.specialEscapeChars_[c]
  }
  var rv = c;
  var cc = c.charCodeAt(0);
  if(cc > 31 && cc < 127) {
    rv = c
  }else {
    if(cc < 256) {
      rv = "\\x";
      if(cc < 16 || cc > 256) {
        rv += "0"
      }
    }else {
      rv = "\\u";
      if(cc < 4096) {
        rv += "0"
      }
    }
    rv += cc.toString(16).toUpperCase()
  }
  return goog.string.jsEscapeCache_[c] = rv
};
goog.string.toMap = function(s) {
  var rv = {};
  for(var i = 0;i < s.length;i++) {
    rv[s.charAt(i)] = true
  }
  return rv
};
goog.string.contains = function(s, ss) {
  return s.indexOf(ss) != -1
};
goog.string.countOf = function(s, ss) {
  return s && ss ? s.split(ss).length - 1 : 0
};
goog.string.removeAt = function(s, index, stringLength) {
  var resultStr = s;
  if(index >= 0 && index < s.length && stringLength > 0) {
    resultStr = s.substr(0, index) + s.substr(index + stringLength, s.length - index - stringLength)
  }
  return resultStr
};
goog.string.remove = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), "");
  return s.replace(re, "")
};
goog.string.removeAll = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), "g");
  return s.replace(re, "")
};
goog.string.regExpEscape = function(s) {
  return String(s).replace(/([-()\[\]{}+?*.$\^|,:#<!\\])/g, "\\$1").replace(/\x08/g, "\\x08")
};
goog.string.repeat = function(string, length) {
  return(new Array(length + 1)).join(string)
};
goog.string.padNumber = function(num, length, opt_precision) {
  var s = goog.isDef(opt_precision) ? num.toFixed(opt_precision) : String(num);
  var index = s.indexOf(".");
  if(index == -1) {
    index = s.length
  }
  return goog.string.repeat("0", Math.max(0, length - index)) + s
};
goog.string.makeSafe = function(obj) {
  return obj == null ? "" : String(obj)
};
goog.string.buildString = function(var_args) {
  return Array.prototype.join.call(arguments, "")
};
goog.string.getRandomString = function() {
  var x = 2147483648;
  return Math.floor(Math.random() * x).toString(36) + Math.abs(Math.floor(Math.random() * x) ^ goog.now()).toString(36)
};
goog.string.compareVersions = function(version1, version2) {
  var order = 0;
  var v1Subs = goog.string.trim(String(version1)).split(".");
  var v2Subs = goog.string.trim(String(version2)).split(".");
  var subCount = Math.max(v1Subs.length, v2Subs.length);
  for(var subIdx = 0;order == 0 && subIdx < subCount;subIdx++) {
    var v1Sub = v1Subs[subIdx] || "";
    var v2Sub = v2Subs[subIdx] || "";
    var v1CompParser = new RegExp("(\\d*)(\\D*)", "g");
    var v2CompParser = new RegExp("(\\d*)(\\D*)", "g");
    do {
      var v1Comp = v1CompParser.exec(v1Sub) || ["", "", ""];
      var v2Comp = v2CompParser.exec(v2Sub) || ["", "", ""];
      if(v1Comp[0].length == 0 && v2Comp[0].length == 0) {
        break
      }
      var v1CompNum = v1Comp[1].length == 0 ? 0 : parseInt(v1Comp[1], 10);
      var v2CompNum = v2Comp[1].length == 0 ? 0 : parseInt(v2Comp[1], 10);
      order = goog.string.compareElements_(v1CompNum, v2CompNum) || goog.string.compareElements_(v1Comp[2].length == 0, v2Comp[2].length == 0) || goog.string.compareElements_(v1Comp[2], v2Comp[2])
    }while(order == 0)
  }
  return order
};
goog.string.compareElements_ = function(left, right) {
  if(left < right) {
    return-1
  }else {
    if(left > right) {
      return 1
    }
  }
  return 0
};
goog.string.HASHCODE_MAX_ = 4294967296;
goog.string.hashCode = function(str) {
  var result = 0;
  for(var i = 0;i < str.length;++i) {
    result = 31 * result + str.charCodeAt(i);
    result %= goog.string.HASHCODE_MAX_
  }
  return result
};
goog.string.uniqueStringCounter_ = Math.random() * 2147483648 | 0;
goog.string.createUniqueString = function() {
  return"goog_" + goog.string.uniqueStringCounter_++
};
goog.string.toNumber = function(str) {
  var num = Number(str);
  if(num == 0 && goog.string.isEmpty(str)) {
    return NaN
  }
  return num
};
goog.string.toCamelCase = function(str) {
  return String(str).replace(/\-([a-z])/g, function(all, match) {
    return match.toUpperCase()
  })
};
goog.string.toSelectorCase = function(str) {
  return String(str).replace(/([A-Z])/g, "-$1").toLowerCase()
};
goog.string.toTitleCase = function(str, opt_delimiters) {
  var delimiters = goog.isString(opt_delimiters) ? goog.string.regExpEscape(opt_delimiters) : "\\s";
  delimiters = delimiters ? "|[" + delimiters + "]+" : "";
  var regexp = new RegExp("(^" + delimiters + ")([a-z])", "g");
  return str.replace(regexp, function(all, p1, p2) {
    return p1 + p2.toUpperCase()
  })
};
goog.string.parseInt = function(value) {
  if(isFinite(value)) {
    value = String(value)
  }
  if(goog.isString(value)) {
    return/^\s*-?0x/i.test(value) ? parseInt(value, 16) : parseInt(value, 10)
  }
  return NaN
};
goog.provide("goog.asserts");
goog.provide("goog.asserts.AssertionError");
goog.require("goog.debug.Error");
goog.require("goog.string");
goog.asserts.ENABLE_ASSERTS = goog.DEBUG;
goog.asserts.AssertionError = function(messagePattern, messageArgs) {
  messageArgs.unshift(messagePattern);
  goog.debug.Error.call(this, goog.string.subs.apply(null, messageArgs));
  messageArgs.shift();
  this.messagePattern = messagePattern
};
goog.inherits(goog.asserts.AssertionError, goog.debug.Error);
goog.asserts.AssertionError.prototype.name = "AssertionError";
goog.asserts.doAssertFailure_ = function(defaultMessage, defaultArgs, givenMessage, givenArgs) {
  var message = "Assertion failed";
  if(givenMessage) {
    message += ": " + givenMessage;
    var args = givenArgs
  }else {
    if(defaultMessage) {
      message += ": " + defaultMessage;
      args = defaultArgs
    }
  }
  throw new goog.asserts.AssertionError("" + message, args || []);
};
goog.asserts.assert = function(condition, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !condition) {
    goog.asserts.doAssertFailure_("", null, opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return condition
};
goog.asserts.fail = function(opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS) {
    throw new goog.asserts.AssertionError("Failure" + (opt_message ? ": " + opt_message : ""), Array.prototype.slice.call(arguments, 1));
  }
};
goog.asserts.assertNumber = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isNumber(value)) {
    goog.asserts.doAssertFailure_("Expected number but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return(value)
};
goog.asserts.assertString = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isString(value)) {
    goog.asserts.doAssertFailure_("Expected string but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return(value)
};
goog.asserts.assertFunction = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isFunction(value)) {
    goog.asserts.doAssertFailure_("Expected function but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return(value)
};
goog.asserts.assertObject = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isObject(value)) {
    goog.asserts.doAssertFailure_("Expected object but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return(value)
};
goog.asserts.assertArray = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isArray(value)) {
    goog.asserts.doAssertFailure_("Expected array but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return(value)
};
goog.asserts.assertBoolean = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isBoolean(value)) {
    goog.asserts.doAssertFailure_("Expected boolean but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return(value)
};
goog.asserts.assertInstanceof = function(value, type, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !(value instanceof type)) {
    goog.asserts.doAssertFailure_("instanceof check failed.", null, opt_message, Array.prototype.slice.call(arguments, 3))
  }
  return(value)
};
goog.provide("goog.array");
goog.provide("goog.array.ArrayLike");
goog.require("goog.asserts");
goog.NATIVE_ARRAY_PROTOTYPES = goog.TRUSTED_SITE;
goog.array.ArrayLike;
goog.array.peek = function(array) {
  return array[array.length - 1]
};
goog.array.ARRAY_PROTOTYPE_ = Array.prototype;
goog.array.indexOf = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.indexOf ? function(arr, obj, opt_fromIndex) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.indexOf.call(arr, obj, opt_fromIndex)
} : function(arr, obj, opt_fromIndex) {
  var fromIndex = opt_fromIndex == null ? 0 : opt_fromIndex < 0 ? Math.max(0, arr.length + opt_fromIndex) : opt_fromIndex;
  if(goog.isString(arr)) {
    if(!goog.isString(obj) || obj.length != 1) {
      return-1
    }
    return arr.indexOf(obj, fromIndex)
  }
  for(var i = fromIndex;i < arr.length;i++) {
    if(i in arr && arr[i] === obj) {
      return i
    }
  }
  return-1
};
goog.array.lastIndexOf = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.lastIndexOf ? function(arr, obj, opt_fromIndex) {
  goog.asserts.assert(arr.length != null);
  var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;
  return goog.array.ARRAY_PROTOTYPE_.lastIndexOf.call(arr, obj, fromIndex)
} : function(arr, obj, opt_fromIndex) {
  var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;
  if(fromIndex < 0) {
    fromIndex = Math.max(0, arr.length + fromIndex)
  }
  if(goog.isString(arr)) {
    if(!goog.isString(obj) || obj.length != 1) {
      return-1
    }
    return arr.lastIndexOf(obj, fromIndex)
  }
  for(var i = fromIndex;i >= 0;i--) {
    if(i in arr && arr[i] === obj) {
      return i
    }
  }
  return-1
};
goog.array.forEach = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.forEach ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  goog.array.ARRAY_PROTOTYPE_.forEach.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      f.call(opt_obj, arr2[i], i, arr)
    }
  }
};
goog.array.forEachRight = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = l - 1;i >= 0;--i) {
    if(i in arr2) {
      f.call(opt_obj, arr2[i], i, arr)
    }
  }
};
goog.array.filter = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.filter ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.filter.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var res = [];
  var resLength = 0;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      var val = arr2[i];
      if(f.call(opt_obj, val, i, arr)) {
        res[resLength++] = val
      }
    }
  }
  return res
};
goog.array.map = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.map ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.map.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var res = new Array(l);
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      res[i] = f.call(opt_obj, arr2[i], i, arr)
    }
  }
  return res
};
goog.array.reduce = function(arr, f, val, opt_obj) {
  if(arr.reduce) {
    if(opt_obj) {
      return arr.reduce(goog.bind(f, opt_obj), val)
    }else {
      return arr.reduce(f, val)
    }
  }
  var rval = val;
  goog.array.forEach(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr)
  });
  return rval
};
goog.array.reduceRight = function(arr, f, val, opt_obj) {
  if(arr.reduceRight) {
    if(opt_obj) {
      return arr.reduceRight(goog.bind(f, opt_obj), val)
    }else {
      return arr.reduceRight(f, val)
    }
  }
  var rval = val;
  goog.array.forEachRight(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr)
  });
  return rval
};
goog.array.some = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.some ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.some.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return true
    }
  }
  return false
};
goog.array.every = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.every ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.every.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && !f.call(opt_obj, arr2[i], i, arr)) {
      return false
    }
  }
  return true
};
goog.array.count = function(arr, f, opt_obj) {
  var count = 0;
  goog.array.forEach(arr, function(element, index, arr) {
    if(f.call(opt_obj, element, index, arr)) {
      ++count
    }
  }, opt_obj);
  return count
};
goog.array.find = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i]
};
goog.array.findIndex = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i
    }
  }
  return-1
};
goog.array.findRight = function(arr, f, opt_obj) {
  var i = goog.array.findIndexRight(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i]
};
goog.array.findIndexRight = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = l - 1;i >= 0;i--) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i
    }
  }
  return-1
};
goog.array.contains = function(arr, obj) {
  return goog.array.indexOf(arr, obj) >= 0
};
goog.array.isEmpty = function(arr) {
  return arr.length == 0
};
goog.array.clear = function(arr) {
  if(!goog.isArray(arr)) {
    for(var i = arr.length - 1;i >= 0;i--) {
      delete arr[i]
    }
  }
  arr.length = 0
};
goog.array.insert = function(arr, obj) {
  if(!goog.array.contains(arr, obj)) {
    arr.push(obj)
  }
};
goog.array.insertAt = function(arr, obj, opt_i) {
  goog.array.splice(arr, opt_i, 0, obj)
};
goog.array.insertArrayAt = function(arr, elementsToAdd, opt_i) {
  goog.partial(goog.array.splice, arr, opt_i, 0).apply(null, elementsToAdd)
};
goog.array.insertBefore = function(arr, obj, opt_obj2) {
  var i;
  if(arguments.length == 2 || (i = goog.array.indexOf(arr, opt_obj2)) < 0) {
    arr.push(obj)
  }else {
    goog.array.insertAt(arr, obj, i)
  }
};
goog.array.remove = function(arr, obj) {
  var i = goog.array.indexOf(arr, obj);
  var rv;
  if(rv = i >= 0) {
    goog.array.removeAt(arr, i)
  }
  return rv
};
goog.array.removeAt = function(arr, i) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.splice.call(arr, i, 1).length == 1
};
goog.array.removeIf = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  if(i >= 0) {
    goog.array.removeAt(arr, i);
    return true
  }
  return false
};
goog.array.concat = function(var_args) {
  return goog.array.ARRAY_PROTOTYPE_.concat.apply(goog.array.ARRAY_PROTOTYPE_, arguments)
};
goog.array.toArray = function(object) {
  var length = object.length;
  if(length > 0) {
    var rv = new Array(length);
    for(var i = 0;i < length;i++) {
      rv[i] = object[i]
    }
    return rv
  }
  return[]
};
goog.array.clone = goog.array.toArray;
goog.array.extend = function(arr1, var_args) {
  for(var i = 1;i < arguments.length;i++) {
    var arr2 = arguments[i];
    var isArrayLike;
    if(goog.isArray(arr2) || (isArrayLike = goog.isArrayLike(arr2)) && Object.prototype.hasOwnProperty.call(arr2, "callee")) {
      arr1.push.apply(arr1, arr2)
    }else {
      if(isArrayLike) {
        var len1 = arr1.length;
        var len2 = arr2.length;
        for(var j = 0;j < len2;j++) {
          arr1[len1 + j] = arr2[j]
        }
      }else {
        arr1.push(arr2)
      }
    }
  }
};
goog.array.splice = function(arr, index, howMany, var_args) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.splice.apply(arr, goog.array.slice(arguments, 1))
};
goog.array.slice = function(arr, start, opt_end) {
  goog.asserts.assert(arr.length != null);
  if(arguments.length <= 2) {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start)
  }else {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start, opt_end)
  }
};
goog.array.removeDuplicates = function(arr, opt_rv) {
  var returnArray = opt_rv || arr;
  var seen = {}, cursorInsert = 0, cursorRead = 0;
  while(cursorRead < arr.length) {
    var current = arr[cursorRead++];
    var key = goog.isObject(current) ? "o" + goog.getUid(current) : (typeof current).charAt(0) + current;
    if(!Object.prototype.hasOwnProperty.call(seen, key)) {
      seen[key] = true;
      returnArray[cursorInsert++] = current
    }
  }
  returnArray.length = cursorInsert
};
goog.array.binarySearch = function(arr, target, opt_compareFn) {
  return goog.array.binarySearch_(arr, opt_compareFn || goog.array.defaultCompare, false, target)
};
goog.array.binarySelect = function(arr, evaluator, opt_obj) {
  return goog.array.binarySearch_(arr, evaluator, true, undefined, opt_obj)
};
goog.array.binarySearch_ = function(arr, compareFn, isEvaluator, opt_target, opt_selfObj) {
  var left = 0;
  var right = arr.length;
  var found;
  while(left < right) {
    var middle = left + right >> 1;
    var compareResult;
    if(isEvaluator) {
      compareResult = compareFn.call(opt_selfObj, arr[middle], middle, arr)
    }else {
      compareResult = compareFn(opt_target, arr[middle])
    }
    if(compareResult > 0) {
      left = middle + 1
    }else {
      right = middle;
      found = !compareResult
    }
  }
  return found ? left : ~left
};
goog.array.sort = function(arr, opt_compareFn) {
  goog.asserts.assert(arr.length != null);
  goog.array.ARRAY_PROTOTYPE_.sort.call(arr, opt_compareFn || goog.array.defaultCompare)
};
goog.array.stableSort = function(arr, opt_compareFn) {
  for(var i = 0;i < arr.length;i++) {
    arr[i] = {index:i, value:arr[i]}
  }
  var valueCompareFn = opt_compareFn || goog.array.defaultCompare;
  function stableCompareFn(obj1, obj2) {
    return valueCompareFn(obj1.value, obj2.value) || obj1.index - obj2.index
  }
  goog.array.sort(arr, stableCompareFn);
  for(var i = 0;i < arr.length;i++) {
    arr[i] = arr[i].value
  }
};
goog.array.sortObjectsByKey = function(arr, key, opt_compareFn) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  goog.array.sort(arr, function(a, b) {
    return compare(a[key], b[key])
  })
};
goog.array.isSorted = function(arr, opt_compareFn, opt_strict) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  for(var i = 1;i < arr.length;i++) {
    var compareResult = compare(arr[i - 1], arr[i]);
    if(compareResult > 0 || compareResult == 0 && opt_strict) {
      return false
    }
  }
  return true
};
goog.array.equals = function(arr1, arr2, opt_equalsFn) {
  if(!goog.isArrayLike(arr1) || !goog.isArrayLike(arr2) || arr1.length != arr2.length) {
    return false
  }
  var l = arr1.length;
  var equalsFn = opt_equalsFn || goog.array.defaultCompareEquality;
  for(var i = 0;i < l;i++) {
    if(!equalsFn(arr1[i], arr2[i])) {
      return false
    }
  }
  return true
};
goog.array.compare = function(arr1, arr2, opt_equalsFn) {
  return goog.array.equals(arr1, arr2, opt_equalsFn)
};
goog.array.compare3 = function(arr1, arr2, opt_compareFn) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  var l = Math.min(arr1.length, arr2.length);
  for(var i = 0;i < l;i++) {
    var result = compare(arr1[i], arr2[i]);
    if(result != 0) {
      return result
    }
  }
  return goog.array.defaultCompare(arr1.length, arr2.length)
};
goog.array.defaultCompare = function(a, b) {
  return a > b ? 1 : a < b ? -1 : 0
};
goog.array.defaultCompareEquality = function(a, b) {
  return a === b
};
goog.array.binaryInsert = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  if(index < 0) {
    goog.array.insertAt(array, value, -(index + 1));
    return true
  }
  return false
};
goog.array.binaryRemove = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  return index >= 0 ? goog.array.removeAt(array, index) : false
};
goog.array.bucket = function(array, sorter) {
  var buckets = {};
  for(var i = 0;i < array.length;i++) {
    var value = array[i];
    var key = sorter(value, i, array);
    if(goog.isDef(key)) {
      var bucket = buckets[key] || (buckets[key] = []);
      bucket.push(value)
    }
  }
  return buckets
};
goog.array.toObject = function(arr, keyFunc, opt_obj) {
  var ret = {};
  goog.array.forEach(arr, function(element, index) {
    ret[keyFunc.call(opt_obj, element, index, arr)] = element
  });
  return ret
};
goog.array.range = function(startOrEnd, opt_end, opt_step) {
  var array = [];
  var start = 0;
  var end = startOrEnd;
  var step = opt_step || 1;
  if(opt_end !== undefined) {
    start = startOrEnd;
    end = opt_end
  }
  if(step * (end - start) < 0) {
    return[]
  }
  if(step > 0) {
    for(var i = start;i < end;i += step) {
      array.push(i)
    }
  }else {
    for(var i = start;i > end;i += step) {
      array.push(i)
    }
  }
  return array
};
goog.array.repeat = function(value, n) {
  var array = [];
  for(var i = 0;i < n;i++) {
    array[i] = value
  }
  return array
};
goog.array.flatten = function(var_args) {
  var result = [];
  for(var i = 0;i < arguments.length;i++) {
    var element = arguments[i];
    if(goog.isArray(element)) {
      result.push.apply(result, goog.array.flatten.apply(null, element))
    }else {
      result.push(element)
    }
  }
  return result
};
goog.array.rotate = function(array, n) {
  goog.asserts.assert(array.length != null);
  if(array.length) {
    n %= array.length;
    if(n > 0) {
      goog.array.ARRAY_PROTOTYPE_.unshift.apply(array, array.splice(-n, n))
    }else {
      if(n < 0) {
        goog.array.ARRAY_PROTOTYPE_.push.apply(array, array.splice(0, -n))
      }
    }
  }
  return array
};
goog.array.zip = function(var_args) {
  if(!arguments.length) {
    return[]
  }
  var result = [];
  for(var i = 0;true;i++) {
    var value = [];
    for(var j = 0;j < arguments.length;j++) {
      var arr = arguments[j];
      if(i >= arr.length) {
        return result
      }
      value.push(arr[i])
    }
    result.push(value)
  }
};
goog.array.shuffle = function(arr, opt_randFn) {
  var randFn = opt_randFn || Math.random;
  for(var i = arr.length - 1;i > 0;i--) {
    var j = Math.floor(randFn() * (i + 1));
    var tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp
  }
};
goog.provide("goog.object");
goog.object.forEach = function(obj, f, opt_obj) {
  for(var key in obj) {
    f.call(opt_obj, obj[key], key, obj)
  }
};
goog.object.filter = function(obj, f, opt_obj) {
  var res = {};
  for(var key in obj) {
    if(f.call(opt_obj, obj[key], key, obj)) {
      res[key] = obj[key]
    }
  }
  return res
};
goog.object.map = function(obj, f, opt_obj) {
  var res = {};
  for(var key in obj) {
    res[key] = f.call(opt_obj, obj[key], key, obj)
  }
  return res
};
goog.object.some = function(obj, f, opt_obj) {
  for(var key in obj) {
    if(f.call(opt_obj, obj[key], key, obj)) {
      return true
    }
  }
  return false
};
goog.object.every = function(obj, f, opt_obj) {
  for(var key in obj) {
    if(!f.call(opt_obj, obj[key], key, obj)) {
      return false
    }
  }
  return true
};
goog.object.getCount = function(obj) {
  var rv = 0;
  for(var key in obj) {
    rv++
  }
  return rv
};
goog.object.getAnyKey = function(obj) {
  for(var key in obj) {
    return key
  }
};
goog.object.getAnyValue = function(obj) {
  for(var key in obj) {
    return obj[key]
  }
};
goog.object.contains = function(obj, val) {
  return goog.object.containsValue(obj, val)
};
goog.object.getValues = function(obj) {
  var res = [];
  var i = 0;
  for(var key in obj) {
    res[i++] = obj[key]
  }
  return res
};
goog.object.getKeys = function(obj) {
  var res = [];
  var i = 0;
  for(var key in obj) {
    res[i++] = key
  }
  return res
};
goog.object.getValueByKeys = function(obj, var_args) {
  var isArrayLike = goog.isArrayLike(var_args);
  var keys = isArrayLike ? var_args : arguments;
  for(var i = isArrayLike ? 0 : 1;i < keys.length;i++) {
    obj = obj[keys[i]];
    if(!goog.isDef(obj)) {
      break
    }
  }
  return obj
};
goog.object.containsKey = function(obj, key) {
  return key in obj
};
goog.object.containsValue = function(obj, val) {
  for(var key in obj) {
    if(obj[key] == val) {
      return true
    }
  }
  return false
};
goog.object.findKey = function(obj, f, opt_this) {
  for(var key in obj) {
    if(f.call(opt_this, obj[key], key, obj)) {
      return key
    }
  }
  return undefined
};
goog.object.findValue = function(obj, f, opt_this) {
  var key = goog.object.findKey(obj, f, opt_this);
  return key && obj[key]
};
goog.object.isEmpty = function(obj) {
  for(var key in obj) {
    return false
  }
  return true
};
goog.object.clear = function(obj) {
  for(var i in obj) {
    delete obj[i]
  }
};
goog.object.remove = function(obj, key) {
  var rv;
  if(rv = key in obj) {
    delete obj[key]
  }
  return rv
};
goog.object.add = function(obj, key, val) {
  if(key in obj) {
    throw Error('The object already contains the key "' + key + '"');
  }
  goog.object.set(obj, key, val)
};
goog.object.get = function(obj, key, opt_val) {
  if(key in obj) {
    return obj[key]
  }
  return opt_val
};
goog.object.set = function(obj, key, value) {
  obj[key] = value
};
goog.object.setIfUndefined = function(obj, key, value) {
  return key in obj ? obj[key] : obj[key] = value
};
goog.object.clone = function(obj) {
  var res = {};
  for(var key in obj) {
    res[key] = obj[key]
  }
  return res
};
goog.object.unsafeClone = function(obj) {
  var type = goog.typeOf(obj);
  if(type == "object" || type == "array") {
    if(obj.clone) {
      return obj.clone()
    }
    var clone = type == "array" ? [] : {};
    for(var key in obj) {
      clone[key] = goog.object.unsafeClone(obj[key])
    }
    return clone
  }
  return obj
};
goog.object.transpose = function(obj) {
  var transposed = {};
  for(var key in obj) {
    transposed[obj[key]] = key
  }
  return transposed
};
goog.object.PROTOTYPE_FIELDS_ = ["constructor", "hasOwnProperty", "isPrototypeOf", "propertyIsEnumerable", "toLocaleString", "toString", "valueOf"];
goog.object.extend = function(target, var_args) {
  var key, source;
  for(var i = 1;i < arguments.length;i++) {
    source = arguments[i];
    for(key in source) {
      target[key] = source[key]
    }
    for(var j = 0;j < goog.object.PROTOTYPE_FIELDS_.length;j++) {
      key = goog.object.PROTOTYPE_FIELDS_[j];
      if(Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key]
      }
    }
  }
};
goog.object.create = function(var_args) {
  var argLength = arguments.length;
  if(argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.create.apply(null, arguments[0])
  }
  if(argLength % 2) {
    throw Error("Uneven number of arguments");
  }
  var rv = {};
  for(var i = 0;i < argLength;i += 2) {
    rv[arguments[i]] = arguments[i + 1]
  }
  return rv
};
goog.object.createSet = function(var_args) {
  var argLength = arguments.length;
  if(argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.createSet.apply(null, arguments[0])
  }
  var rv = {};
  for(var i = 0;i < argLength;i++) {
    rv[arguments[i]] = true
  }
  return rv
};
goog.object.createImmutableView = function(obj) {
  var result = obj;
  if(Object.isFrozen && !Object.isFrozen(obj)) {
    result = Object.create(obj);
    Object.freeze(result)
  }
  return result
};
goog.object.isImmutableView = function(obj) {
  return!!Object.isFrozen && Object.isFrozen(obj)
};
goog.provide("goog.string.format");
goog.require("goog.string");
goog.string.format = function(formatString, var_args) {
  var args = Array.prototype.slice.call(arguments);
  var template = args.shift();
  if(typeof template == "undefined") {
    throw Error("[goog.string.format] Template required");
  }
  var formatRe = /%([0\-\ \+]*)(\d+)?(\.(\d+))?([%sfdiu])/g;
  function replacerDemuxer(match, flags, width, dotp, precision, type, offset, wholeString) {
    if(type == "%") {
      return"%"
    }
    var value = args.shift();
    if(typeof value == "undefined") {
      throw Error("[goog.string.format] Not enough arguments");
    }
    arguments[0] = value;
    return goog.string.format.demuxes_[type].apply(null, arguments)
  }
  return template.replace(formatRe, replacerDemuxer)
};
goog.string.format.demuxes_ = {};
goog.string.format.demuxes_["s"] = function(value, flags, width, dotp, precision, type, offset, wholeString) {
  var replacement = value;
  if(isNaN(width) || width == "" || replacement.length >= width) {
    return replacement
  }
  if(flags.indexOf("-", 0) > -1) {
    replacement = replacement + goog.string.repeat(" ", width - replacement.length)
  }else {
    replacement = goog.string.repeat(" ", width - replacement.length) + replacement
  }
  return replacement
};
goog.string.format.demuxes_["f"] = function(value, flags, width, dotp, precision, type, offset, wholeString) {
  var replacement = value.toString();
  if(!(isNaN(precision) || precision == "")) {
    replacement = value.toFixed(precision)
  }
  var sign;
  if(value < 0) {
    sign = "-"
  }else {
    if(flags.indexOf("+") >= 0) {
      sign = "+"
    }else {
      if(flags.indexOf(" ") >= 0) {
        sign = " "
      }else {
        sign = ""
      }
    }
  }
  if(value >= 0) {
    replacement = sign + replacement
  }
  if(isNaN(width) || replacement.length >= width) {
    return replacement
  }
  replacement = isNaN(precision) ? Math.abs(value).toString() : Math.abs(value).toFixed(precision);
  var padCount = width - replacement.length - sign.length;
  if(flags.indexOf("-", 0) >= 0) {
    replacement = sign + replacement + goog.string.repeat(" ", padCount)
  }else {
    var paddingChar = flags.indexOf("0", 0) >= 0 ? "0" : " ";
    replacement = sign + goog.string.repeat(paddingChar, padCount) + replacement
  }
  return replacement
};
goog.string.format.demuxes_["d"] = function(value, flags, width, dotp, precision, type, offset, wholeString) {
  return goog.string.format.demuxes_["f"](parseInt(value, 10), flags, width, dotp, 0, type, offset, wholeString)
};
goog.string.format.demuxes_["i"] = goog.string.format.demuxes_["d"];
goog.string.format.demuxes_["u"] = goog.string.format.demuxes_["d"];
goog.provide("goog.string.StringBuffer");
goog.string.StringBuffer = function(opt_a1, var_args) {
  if(opt_a1 != null) {
    this.append.apply(this, arguments)
  }
};
goog.string.StringBuffer.prototype.buffer_ = "";
goog.string.StringBuffer.prototype.set = function(s) {
  this.buffer_ = "" + s
};
goog.string.StringBuffer.prototype.append = function(a1, opt_a2, var_args) {
  this.buffer_ += a1;
  if(opt_a2 != null) {
    for(var i = 1;i < arguments.length;i++) {
      this.buffer_ += arguments[i]
    }
  }
  return this
};
goog.string.StringBuffer.prototype.clear = function() {
  this.buffer_ = ""
};
goog.string.StringBuffer.prototype.getLength = function() {
  return this.buffer_.length
};
goog.string.StringBuffer.prototype.toString = function() {
  return this.buffer_
};
goog.provide("cljs.core");
goog.require("goog.array");
goog.require("goog.object");
goog.require("goog.string.format");
goog.require("goog.string.StringBuffer");
goog.require("goog.string");
cljs.core._STAR_unchecked_if_STAR_ = false;
cljs.core._STAR_print_fn_STAR_ = function _STAR_print_fn_STAR_(_) {
  throw new Error("No *print-fn* fn set for evaluation environment");
};
cljs.core.truth_ = function truth_(x) {
  return x != null && x !== false
};
cljs.core.type_satisfies_ = function type_satisfies_(p, x) {
  var x__6090 = x == null ? null : x;
  if(p[goog.typeOf(x__6090)]) {
    return true
  }else {
    if(p["_"]) {
      return true
    }else {
      if("\ufdd0'else") {
        return false
      }else {
        return null
      }
    }
  }
};
cljs.core.is_proto_ = function is_proto_(x) {
  return x.constructor.prototype === x
};
cljs.core._STAR_main_cli_fn_STAR_ = null;
cljs.core.missing_protocol = function missing_protocol(proto, obj) {
  return Error(["No protocol method ", proto, " defined for type ", goog.typeOf(obj), ": ", obj].join(""))
};
cljs.core.aclone = function aclone(array_like) {
  return array_like.slice()
};
cljs.core.array = function array(var_args) {
  return Array.prototype.slice.call(arguments)
};
cljs.core.make_array = function() {
  var make_array = null;
  var make_array__1 = function(size) {
    return new Array(size)
  };
  var make_array__2 = function(type, size) {
    return make_array.call(null, size)
  };
  make_array = function(type, size) {
    switch(arguments.length) {
      case 1:
        return make_array__1.call(this, type);
      case 2:
        return make_array__2.call(this, type, size)
    }
    throw"Invalid arity: " + arguments.length;
  };
  make_array.cljs$lang$arity$1 = make_array__1;
  make_array.cljs$lang$arity$2 = make_array__2;
  return make_array
}();
cljs.core.aget = function() {
  var aget = null;
  var aget__2 = function(array, i) {
    return array[i]
  };
  var aget__3 = function() {
    var G__6091__delegate = function(array, i, idxs) {
      return cljs.core.apply.call(null, aget, aget.call(null, array, i), idxs)
    };
    var G__6091 = function(array, i, var_args) {
      var idxs = null;
      if(goog.isDef(var_args)) {
        idxs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6091__delegate.call(this, array, i, idxs)
    };
    G__6091.cljs$lang$maxFixedArity = 2;
    G__6091.cljs$lang$applyTo = function(arglist__6092) {
      var array = cljs.core.first(arglist__6092);
      var i = cljs.core.first(cljs.core.next(arglist__6092));
      var idxs = cljs.core.rest(cljs.core.next(arglist__6092));
      return G__6091__delegate(array, i, idxs)
    };
    G__6091.cljs$lang$arity$variadic = G__6091__delegate;
    return G__6091
  }();
  aget = function(array, i, var_args) {
    var idxs = var_args;
    switch(arguments.length) {
      case 2:
        return aget__2.call(this, array, i);
      default:
        return aget__3.cljs$lang$arity$variadic(array, i, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  aget.cljs$lang$maxFixedArity = 2;
  aget.cljs$lang$applyTo = aget__3.cljs$lang$applyTo;
  aget.cljs$lang$arity$2 = aget__2;
  aget.cljs$lang$arity$variadic = aget__3.cljs$lang$arity$variadic;
  return aget
}();
cljs.core.aset = function aset(array, i, val) {
  return array[i] = val
};
cljs.core.alength = function alength(array) {
  return array.length
};
cljs.core.into_array = function() {
  var into_array = null;
  var into_array__1 = function(aseq) {
    return into_array.call(null, null, aseq)
  };
  var into_array__2 = function(type, aseq) {
    return cljs.core.reduce.call(null, function(a, x) {
      a.push(x);
      return a
    }, [], aseq)
  };
  into_array = function(type, aseq) {
    switch(arguments.length) {
      case 1:
        return into_array__1.call(this, type);
      case 2:
        return into_array__2.call(this, type, aseq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  into_array.cljs$lang$arity$1 = into_array__1;
  into_array.cljs$lang$arity$2 = into_array__2;
  return into_array
}();
cljs.core.IFn = {};
cljs.core._invoke = function() {
  var _invoke = null;
  var _invoke__1 = function(this$) {
    if(function() {
      var and__3941__auto____6177 = this$;
      if(and__3941__auto____6177) {
        return this$.cljs$core$IFn$_invoke$arity$1
      }else {
        return and__3941__auto____6177
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$1(this$)
    }else {
      var x__2304__auto____6178 = this$ == null ? null : this$;
      return function() {
        var or__3943__auto____6179 = cljs.core._invoke[goog.typeOf(x__2304__auto____6178)];
        if(or__3943__auto____6179) {
          return or__3943__auto____6179
        }else {
          var or__3943__auto____6180 = cljs.core._invoke["_"];
          if(or__3943__auto____6180) {
            return or__3943__auto____6180
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$)
    }
  };
  var _invoke__2 = function(this$, a) {
    if(function() {
      var and__3941__auto____6181 = this$;
      if(and__3941__auto____6181) {
        return this$.cljs$core$IFn$_invoke$arity$2
      }else {
        return and__3941__auto____6181
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$2(this$, a)
    }else {
      var x__2304__auto____6182 = this$ == null ? null : this$;
      return function() {
        var or__3943__auto____6183 = cljs.core._invoke[goog.typeOf(x__2304__auto____6182)];
        if(or__3943__auto____6183) {
          return or__3943__auto____6183
        }else {
          var or__3943__auto____6184 = cljs.core._invoke["_"];
          if(or__3943__auto____6184) {
            return or__3943__auto____6184
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a)
    }
  };
  var _invoke__3 = function(this$, a, b) {
    if(function() {
      var and__3941__auto____6185 = this$;
      if(and__3941__auto____6185) {
        return this$.cljs$core$IFn$_invoke$arity$3
      }else {
        return and__3941__auto____6185
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$3(this$, a, b)
    }else {
      var x__2304__auto____6186 = this$ == null ? null : this$;
      return function() {
        var or__3943__auto____6187 = cljs.core._invoke[goog.typeOf(x__2304__auto____6186)];
        if(or__3943__auto____6187) {
          return or__3943__auto____6187
        }else {
          var or__3943__auto____6188 = cljs.core._invoke["_"];
          if(or__3943__auto____6188) {
            return or__3943__auto____6188
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b)
    }
  };
  var _invoke__4 = function(this$, a, b, c) {
    if(function() {
      var and__3941__auto____6189 = this$;
      if(and__3941__auto____6189) {
        return this$.cljs$core$IFn$_invoke$arity$4
      }else {
        return and__3941__auto____6189
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$4(this$, a, b, c)
    }else {
      var x__2304__auto____6190 = this$ == null ? null : this$;
      return function() {
        var or__3943__auto____6191 = cljs.core._invoke[goog.typeOf(x__2304__auto____6190)];
        if(or__3943__auto____6191) {
          return or__3943__auto____6191
        }else {
          var or__3943__auto____6192 = cljs.core._invoke["_"];
          if(or__3943__auto____6192) {
            return or__3943__auto____6192
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c)
    }
  };
  var _invoke__5 = function(this$, a, b, c, d) {
    if(function() {
      var and__3941__auto____6193 = this$;
      if(and__3941__auto____6193) {
        return this$.cljs$core$IFn$_invoke$arity$5
      }else {
        return and__3941__auto____6193
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$5(this$, a, b, c, d)
    }else {
      var x__2304__auto____6194 = this$ == null ? null : this$;
      return function() {
        var or__3943__auto____6195 = cljs.core._invoke[goog.typeOf(x__2304__auto____6194)];
        if(or__3943__auto____6195) {
          return or__3943__auto____6195
        }else {
          var or__3943__auto____6196 = cljs.core._invoke["_"];
          if(or__3943__auto____6196) {
            return or__3943__auto____6196
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d)
    }
  };
  var _invoke__6 = function(this$, a, b, c, d, e) {
    if(function() {
      var and__3941__auto____6197 = this$;
      if(and__3941__auto____6197) {
        return this$.cljs$core$IFn$_invoke$arity$6
      }else {
        return and__3941__auto____6197
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$6(this$, a, b, c, d, e)
    }else {
      var x__2304__auto____6198 = this$ == null ? null : this$;
      return function() {
        var or__3943__auto____6199 = cljs.core._invoke[goog.typeOf(x__2304__auto____6198)];
        if(or__3943__auto____6199) {
          return or__3943__auto____6199
        }else {
          var or__3943__auto____6200 = cljs.core._invoke["_"];
          if(or__3943__auto____6200) {
            return or__3943__auto____6200
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e)
    }
  };
  var _invoke__7 = function(this$, a, b, c, d, e, f) {
    if(function() {
      var and__3941__auto____6201 = this$;
      if(and__3941__auto____6201) {
        return this$.cljs$core$IFn$_invoke$arity$7
      }else {
        return and__3941__auto____6201
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$7(this$, a, b, c, d, e, f)
    }else {
      var x__2304__auto____6202 = this$ == null ? null : this$;
      return function() {
        var or__3943__auto____6203 = cljs.core._invoke[goog.typeOf(x__2304__auto____6202)];
        if(or__3943__auto____6203) {
          return or__3943__auto____6203
        }else {
          var or__3943__auto____6204 = cljs.core._invoke["_"];
          if(or__3943__auto____6204) {
            return or__3943__auto____6204
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f)
    }
  };
  var _invoke__8 = function(this$, a, b, c, d, e, f, g) {
    if(function() {
      var and__3941__auto____6205 = this$;
      if(and__3941__auto____6205) {
        return this$.cljs$core$IFn$_invoke$arity$8
      }else {
        return and__3941__auto____6205
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$8(this$, a, b, c, d, e, f, g)
    }else {
      var x__2304__auto____6206 = this$ == null ? null : this$;
      return function() {
        var or__3943__auto____6207 = cljs.core._invoke[goog.typeOf(x__2304__auto____6206)];
        if(or__3943__auto____6207) {
          return or__3943__auto____6207
        }else {
          var or__3943__auto____6208 = cljs.core._invoke["_"];
          if(or__3943__auto____6208) {
            return or__3943__auto____6208
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g)
    }
  };
  var _invoke__9 = function(this$, a, b, c, d, e, f, g, h) {
    if(function() {
      var and__3941__auto____6209 = this$;
      if(and__3941__auto____6209) {
        return this$.cljs$core$IFn$_invoke$arity$9
      }else {
        return and__3941__auto____6209
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$9(this$, a, b, c, d, e, f, g, h)
    }else {
      var x__2304__auto____6210 = this$ == null ? null : this$;
      return function() {
        var or__3943__auto____6211 = cljs.core._invoke[goog.typeOf(x__2304__auto____6210)];
        if(or__3943__auto____6211) {
          return or__3943__auto____6211
        }else {
          var or__3943__auto____6212 = cljs.core._invoke["_"];
          if(or__3943__auto____6212) {
            return or__3943__auto____6212
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h)
    }
  };
  var _invoke__10 = function(this$, a, b, c, d, e, f, g, h, i) {
    if(function() {
      var and__3941__auto____6213 = this$;
      if(and__3941__auto____6213) {
        return this$.cljs$core$IFn$_invoke$arity$10
      }else {
        return and__3941__auto____6213
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$10(this$, a, b, c, d, e, f, g, h, i)
    }else {
      var x__2304__auto____6214 = this$ == null ? null : this$;
      return function() {
        var or__3943__auto____6215 = cljs.core._invoke[goog.typeOf(x__2304__auto____6214)];
        if(or__3943__auto____6215) {
          return or__3943__auto____6215
        }else {
          var or__3943__auto____6216 = cljs.core._invoke["_"];
          if(or__3943__auto____6216) {
            return or__3943__auto____6216
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i)
    }
  };
  var _invoke__11 = function(this$, a, b, c, d, e, f, g, h, i, j) {
    if(function() {
      var and__3941__auto____6217 = this$;
      if(and__3941__auto____6217) {
        return this$.cljs$core$IFn$_invoke$arity$11
      }else {
        return and__3941__auto____6217
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$11(this$, a, b, c, d, e, f, g, h, i, j)
    }else {
      var x__2304__auto____6218 = this$ == null ? null : this$;
      return function() {
        var or__3943__auto____6219 = cljs.core._invoke[goog.typeOf(x__2304__auto____6218)];
        if(or__3943__auto____6219) {
          return or__3943__auto____6219
        }else {
          var or__3943__auto____6220 = cljs.core._invoke["_"];
          if(or__3943__auto____6220) {
            return or__3943__auto____6220
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j)
    }
  };
  var _invoke__12 = function(this$, a, b, c, d, e, f, g, h, i, j, k) {
    if(function() {
      var and__3941__auto____6221 = this$;
      if(and__3941__auto____6221) {
        return this$.cljs$core$IFn$_invoke$arity$12
      }else {
        return and__3941__auto____6221
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$12(this$, a, b, c, d, e, f, g, h, i, j, k)
    }else {
      var x__2304__auto____6222 = this$ == null ? null : this$;
      return function() {
        var or__3943__auto____6223 = cljs.core._invoke[goog.typeOf(x__2304__auto____6222)];
        if(or__3943__auto____6223) {
          return or__3943__auto____6223
        }else {
          var or__3943__auto____6224 = cljs.core._invoke["_"];
          if(or__3943__auto____6224) {
            return or__3943__auto____6224
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k)
    }
  };
  var _invoke__13 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l) {
    if(function() {
      var and__3941__auto____6225 = this$;
      if(and__3941__auto____6225) {
        return this$.cljs$core$IFn$_invoke$arity$13
      }else {
        return and__3941__auto____6225
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$13(this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }else {
      var x__2304__auto____6226 = this$ == null ? null : this$;
      return function() {
        var or__3943__auto____6227 = cljs.core._invoke[goog.typeOf(x__2304__auto____6226)];
        if(or__3943__auto____6227) {
          return or__3943__auto____6227
        }else {
          var or__3943__auto____6228 = cljs.core._invoke["_"];
          if(or__3943__auto____6228) {
            return or__3943__auto____6228
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }
  };
  var _invoke__14 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m) {
    if(function() {
      var and__3941__auto____6229 = this$;
      if(and__3941__auto____6229) {
        return this$.cljs$core$IFn$_invoke$arity$14
      }else {
        return and__3941__auto____6229
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$14(this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }else {
      var x__2304__auto____6230 = this$ == null ? null : this$;
      return function() {
        var or__3943__auto____6231 = cljs.core._invoke[goog.typeOf(x__2304__auto____6230)];
        if(or__3943__auto____6231) {
          return or__3943__auto____6231
        }else {
          var or__3943__auto____6232 = cljs.core._invoke["_"];
          if(or__3943__auto____6232) {
            return or__3943__auto____6232
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }
  };
  var _invoke__15 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n) {
    if(function() {
      var and__3941__auto____6233 = this$;
      if(and__3941__auto____6233) {
        return this$.cljs$core$IFn$_invoke$arity$15
      }else {
        return and__3941__auto____6233
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$15(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }else {
      var x__2304__auto____6234 = this$ == null ? null : this$;
      return function() {
        var or__3943__auto____6235 = cljs.core._invoke[goog.typeOf(x__2304__auto____6234)];
        if(or__3943__auto____6235) {
          return or__3943__auto____6235
        }else {
          var or__3943__auto____6236 = cljs.core._invoke["_"];
          if(or__3943__auto____6236) {
            return or__3943__auto____6236
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }
  };
  var _invoke__16 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o) {
    if(function() {
      var and__3941__auto____6237 = this$;
      if(and__3941__auto____6237) {
        return this$.cljs$core$IFn$_invoke$arity$16
      }else {
        return and__3941__auto____6237
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$16(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }else {
      var x__2304__auto____6238 = this$ == null ? null : this$;
      return function() {
        var or__3943__auto____6239 = cljs.core._invoke[goog.typeOf(x__2304__auto____6238)];
        if(or__3943__auto____6239) {
          return or__3943__auto____6239
        }else {
          var or__3943__auto____6240 = cljs.core._invoke["_"];
          if(or__3943__auto____6240) {
            return or__3943__auto____6240
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }
  };
  var _invoke__17 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p) {
    if(function() {
      var and__3941__auto____6241 = this$;
      if(and__3941__auto____6241) {
        return this$.cljs$core$IFn$_invoke$arity$17
      }else {
        return and__3941__auto____6241
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$17(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }else {
      var x__2304__auto____6242 = this$ == null ? null : this$;
      return function() {
        var or__3943__auto____6243 = cljs.core._invoke[goog.typeOf(x__2304__auto____6242)];
        if(or__3943__auto____6243) {
          return or__3943__auto____6243
        }else {
          var or__3943__auto____6244 = cljs.core._invoke["_"];
          if(or__3943__auto____6244) {
            return or__3943__auto____6244
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }
  };
  var _invoke__18 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q) {
    if(function() {
      var and__3941__auto____6245 = this$;
      if(and__3941__auto____6245) {
        return this$.cljs$core$IFn$_invoke$arity$18
      }else {
        return and__3941__auto____6245
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$18(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }else {
      var x__2304__auto____6246 = this$ == null ? null : this$;
      return function() {
        var or__3943__auto____6247 = cljs.core._invoke[goog.typeOf(x__2304__auto____6246)];
        if(or__3943__auto____6247) {
          return or__3943__auto____6247
        }else {
          var or__3943__auto____6248 = cljs.core._invoke["_"];
          if(or__3943__auto____6248) {
            return or__3943__auto____6248
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }
  };
  var _invoke__19 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s) {
    if(function() {
      var and__3941__auto____6249 = this$;
      if(and__3941__auto____6249) {
        return this$.cljs$core$IFn$_invoke$arity$19
      }else {
        return and__3941__auto____6249
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$19(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }else {
      var x__2304__auto____6250 = this$ == null ? null : this$;
      return function() {
        var or__3943__auto____6251 = cljs.core._invoke[goog.typeOf(x__2304__auto____6250)];
        if(or__3943__auto____6251) {
          return or__3943__auto____6251
        }else {
          var or__3943__auto____6252 = cljs.core._invoke["_"];
          if(or__3943__auto____6252) {
            return or__3943__auto____6252
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }
  };
  var _invoke__20 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t) {
    if(function() {
      var and__3941__auto____6253 = this$;
      if(and__3941__auto____6253) {
        return this$.cljs$core$IFn$_invoke$arity$20
      }else {
        return and__3941__auto____6253
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$20(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }else {
      var x__2304__auto____6254 = this$ == null ? null : this$;
      return function() {
        var or__3943__auto____6255 = cljs.core._invoke[goog.typeOf(x__2304__auto____6254)];
        if(or__3943__auto____6255) {
          return or__3943__auto____6255
        }else {
          var or__3943__auto____6256 = cljs.core._invoke["_"];
          if(or__3943__auto____6256) {
            return or__3943__auto____6256
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }
  };
  var _invoke__21 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    if(function() {
      var and__3941__auto____6257 = this$;
      if(and__3941__auto____6257) {
        return this$.cljs$core$IFn$_invoke$arity$21
      }else {
        return and__3941__auto____6257
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$21(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }else {
      var x__2304__auto____6258 = this$ == null ? null : this$;
      return function() {
        var or__3943__auto____6259 = cljs.core._invoke[goog.typeOf(x__2304__auto____6258)];
        if(or__3943__auto____6259) {
          return or__3943__auto____6259
        }else {
          var or__3943__auto____6260 = cljs.core._invoke["_"];
          if(or__3943__auto____6260) {
            return or__3943__auto____6260
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }
  };
  _invoke = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    switch(arguments.length) {
      case 1:
        return _invoke__1.call(this, this$);
      case 2:
        return _invoke__2.call(this, this$, a);
      case 3:
        return _invoke__3.call(this, this$, a, b);
      case 4:
        return _invoke__4.call(this, this$, a, b, c);
      case 5:
        return _invoke__5.call(this, this$, a, b, c, d);
      case 6:
        return _invoke__6.call(this, this$, a, b, c, d, e);
      case 7:
        return _invoke__7.call(this, this$, a, b, c, d, e, f);
      case 8:
        return _invoke__8.call(this, this$, a, b, c, d, e, f, g);
      case 9:
        return _invoke__9.call(this, this$, a, b, c, d, e, f, g, h);
      case 10:
        return _invoke__10.call(this, this$, a, b, c, d, e, f, g, h, i);
      case 11:
        return _invoke__11.call(this, this$, a, b, c, d, e, f, g, h, i, j);
      case 12:
        return _invoke__12.call(this, this$, a, b, c, d, e, f, g, h, i, j, k);
      case 13:
        return _invoke__13.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l);
      case 14:
        return _invoke__14.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m);
      case 15:
        return _invoke__15.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n);
      case 16:
        return _invoke__16.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o);
      case 17:
        return _invoke__17.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p);
      case 18:
        return _invoke__18.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q);
      case 19:
        return _invoke__19.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s);
      case 20:
        return _invoke__20.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t);
      case 21:
        return _invoke__21.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _invoke.cljs$lang$arity$1 = _invoke__1;
  _invoke.cljs$lang$arity$2 = _invoke__2;
  _invoke.cljs$lang$arity$3 = _invoke__3;
  _invoke.cljs$lang$arity$4 = _invoke__4;
  _invoke.cljs$lang$arity$5 = _invoke__5;
  _invoke.cljs$lang$arity$6 = _invoke__6;
  _invoke.cljs$lang$arity$7 = _invoke__7;
  _invoke.cljs$lang$arity$8 = _invoke__8;
  _invoke.cljs$lang$arity$9 = _invoke__9;
  _invoke.cljs$lang$arity$10 = _invoke__10;
  _invoke.cljs$lang$arity$11 = _invoke__11;
  _invoke.cljs$lang$arity$12 = _invoke__12;
  _invoke.cljs$lang$arity$13 = _invoke__13;
  _invoke.cljs$lang$arity$14 = _invoke__14;
  _invoke.cljs$lang$arity$15 = _invoke__15;
  _invoke.cljs$lang$arity$16 = _invoke__16;
  _invoke.cljs$lang$arity$17 = _invoke__17;
  _invoke.cljs$lang$arity$18 = _invoke__18;
  _invoke.cljs$lang$arity$19 = _invoke__19;
  _invoke.cljs$lang$arity$20 = _invoke__20;
  _invoke.cljs$lang$arity$21 = _invoke__21;
  return _invoke
}();
cljs.core.ICounted = {};
cljs.core._count = function _count(coll) {
  if(function() {
    var and__3941__auto____6265 = coll;
    if(and__3941__auto____6265) {
      return coll.cljs$core$ICounted$_count$arity$1
    }else {
      return and__3941__auto____6265
    }
  }()) {
    return coll.cljs$core$ICounted$_count$arity$1(coll)
  }else {
    var x__2304__auto____6266 = coll == null ? null : coll;
    return function() {
      var or__3943__auto____6267 = cljs.core._count[goog.typeOf(x__2304__auto____6266)];
      if(or__3943__auto____6267) {
        return or__3943__auto____6267
      }else {
        var or__3943__auto____6268 = cljs.core._count["_"];
        if(or__3943__auto____6268) {
          return or__3943__auto____6268
        }else {
          throw cljs.core.missing_protocol.call(null, "ICounted.-count", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IEmptyableCollection = {};
cljs.core._empty = function _empty(coll) {
  if(function() {
    var and__3941__auto____6273 = coll;
    if(and__3941__auto____6273) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1
    }else {
      return and__3941__auto____6273
    }
  }()) {
    return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
  }else {
    var x__2304__auto____6274 = coll == null ? null : coll;
    return function() {
      var or__3943__auto____6275 = cljs.core._empty[goog.typeOf(x__2304__auto____6274)];
      if(or__3943__auto____6275) {
        return or__3943__auto____6275
      }else {
        var or__3943__auto____6276 = cljs.core._empty["_"];
        if(or__3943__auto____6276) {
          return or__3943__auto____6276
        }else {
          throw cljs.core.missing_protocol.call(null, "IEmptyableCollection.-empty", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ICollection = {};
cljs.core._conj = function _conj(coll, o) {
  if(function() {
    var and__3941__auto____6281 = coll;
    if(and__3941__auto____6281) {
      return coll.cljs$core$ICollection$_conj$arity$2
    }else {
      return and__3941__auto____6281
    }
  }()) {
    return coll.cljs$core$ICollection$_conj$arity$2(coll, o)
  }else {
    var x__2304__auto____6282 = coll == null ? null : coll;
    return function() {
      var or__3943__auto____6283 = cljs.core._conj[goog.typeOf(x__2304__auto____6282)];
      if(or__3943__auto____6283) {
        return or__3943__auto____6283
      }else {
        var or__3943__auto____6284 = cljs.core._conj["_"];
        if(or__3943__auto____6284) {
          return or__3943__auto____6284
        }else {
          throw cljs.core.missing_protocol.call(null, "ICollection.-conj", coll);
        }
      }
    }().call(null, coll, o)
  }
};
cljs.core.IIndexed = {};
cljs.core._nth = function() {
  var _nth = null;
  var _nth__2 = function(coll, n) {
    if(function() {
      var and__3941__auto____6293 = coll;
      if(and__3941__auto____6293) {
        return coll.cljs$core$IIndexed$_nth$arity$2
      }else {
        return and__3941__auto____6293
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
    }else {
      var x__2304__auto____6294 = coll == null ? null : coll;
      return function() {
        var or__3943__auto____6295 = cljs.core._nth[goog.typeOf(x__2304__auto____6294)];
        if(or__3943__auto____6295) {
          return or__3943__auto____6295
        }else {
          var or__3943__auto____6296 = cljs.core._nth["_"];
          if(or__3943__auto____6296) {
            return or__3943__auto____6296
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n)
    }
  };
  var _nth__3 = function(coll, n, not_found) {
    if(function() {
      var and__3941__auto____6297 = coll;
      if(and__3941__auto____6297) {
        return coll.cljs$core$IIndexed$_nth$arity$3
      }else {
        return and__3941__auto____6297
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$3(coll, n, not_found)
    }else {
      var x__2304__auto____6298 = coll == null ? null : coll;
      return function() {
        var or__3943__auto____6299 = cljs.core._nth[goog.typeOf(x__2304__auto____6298)];
        if(or__3943__auto____6299) {
          return or__3943__auto____6299
        }else {
          var or__3943__auto____6300 = cljs.core._nth["_"];
          if(or__3943__auto____6300) {
            return or__3943__auto____6300
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n, not_found)
    }
  };
  _nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return _nth__2.call(this, coll, n);
      case 3:
        return _nth__3.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _nth.cljs$lang$arity$2 = _nth__2;
  _nth.cljs$lang$arity$3 = _nth__3;
  return _nth
}();
cljs.core.ASeq = {};
cljs.core.ISeq = {};
cljs.core._first = function _first(coll) {
  if(function() {
    var and__3941__auto____6305 = coll;
    if(and__3941__auto____6305) {
      return coll.cljs$core$ISeq$_first$arity$1
    }else {
      return and__3941__auto____6305
    }
  }()) {
    return coll.cljs$core$ISeq$_first$arity$1(coll)
  }else {
    var x__2304__auto____6306 = coll == null ? null : coll;
    return function() {
      var or__3943__auto____6307 = cljs.core._first[goog.typeOf(x__2304__auto____6306)];
      if(or__3943__auto____6307) {
        return or__3943__auto____6307
      }else {
        var or__3943__auto____6308 = cljs.core._first["_"];
        if(or__3943__auto____6308) {
          return or__3943__auto____6308
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._rest = function _rest(coll) {
  if(function() {
    var and__3941__auto____6313 = coll;
    if(and__3941__auto____6313) {
      return coll.cljs$core$ISeq$_rest$arity$1
    }else {
      return and__3941__auto____6313
    }
  }()) {
    return coll.cljs$core$ISeq$_rest$arity$1(coll)
  }else {
    var x__2304__auto____6314 = coll == null ? null : coll;
    return function() {
      var or__3943__auto____6315 = cljs.core._rest[goog.typeOf(x__2304__auto____6314)];
      if(or__3943__auto____6315) {
        return or__3943__auto____6315
      }else {
        var or__3943__auto____6316 = cljs.core._rest["_"];
        if(or__3943__auto____6316) {
          return or__3943__auto____6316
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-rest", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.INext = {};
cljs.core._next = function _next(coll) {
  if(function() {
    var and__3941__auto____6321 = coll;
    if(and__3941__auto____6321) {
      return coll.cljs$core$INext$_next$arity$1
    }else {
      return and__3941__auto____6321
    }
  }()) {
    return coll.cljs$core$INext$_next$arity$1(coll)
  }else {
    var x__2304__auto____6322 = coll == null ? null : coll;
    return function() {
      var or__3943__auto____6323 = cljs.core._next[goog.typeOf(x__2304__auto____6322)];
      if(or__3943__auto____6323) {
        return or__3943__auto____6323
      }else {
        var or__3943__auto____6324 = cljs.core._next["_"];
        if(or__3943__auto____6324) {
          return or__3943__auto____6324
        }else {
          throw cljs.core.missing_protocol.call(null, "INext.-next", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ILookup = {};
cljs.core._lookup = function() {
  var _lookup = null;
  var _lookup__2 = function(o, k) {
    if(function() {
      var and__3941__auto____6333 = o;
      if(and__3941__auto____6333) {
        return o.cljs$core$ILookup$_lookup$arity$2
      }else {
        return and__3941__auto____6333
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$2(o, k)
    }else {
      var x__2304__auto____6334 = o == null ? null : o;
      return function() {
        var or__3943__auto____6335 = cljs.core._lookup[goog.typeOf(x__2304__auto____6334)];
        if(or__3943__auto____6335) {
          return or__3943__auto____6335
        }else {
          var or__3943__auto____6336 = cljs.core._lookup["_"];
          if(or__3943__auto____6336) {
            return or__3943__auto____6336
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k)
    }
  };
  var _lookup__3 = function(o, k, not_found) {
    if(function() {
      var and__3941__auto____6337 = o;
      if(and__3941__auto____6337) {
        return o.cljs$core$ILookup$_lookup$arity$3
      }else {
        return and__3941__auto____6337
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$3(o, k, not_found)
    }else {
      var x__2304__auto____6338 = o == null ? null : o;
      return function() {
        var or__3943__auto____6339 = cljs.core._lookup[goog.typeOf(x__2304__auto____6338)];
        if(or__3943__auto____6339) {
          return or__3943__auto____6339
        }else {
          var or__3943__auto____6340 = cljs.core._lookup["_"];
          if(or__3943__auto____6340) {
            return or__3943__auto____6340
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k, not_found)
    }
  };
  _lookup = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return _lookup__2.call(this, o, k);
      case 3:
        return _lookup__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _lookup.cljs$lang$arity$2 = _lookup__2;
  _lookup.cljs$lang$arity$3 = _lookup__3;
  return _lookup
}();
cljs.core.IAssociative = {};
cljs.core._contains_key_QMARK_ = function _contains_key_QMARK_(coll, k) {
  if(function() {
    var and__3941__auto____6345 = coll;
    if(and__3941__auto____6345) {
      return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2
    }else {
      return and__3941__auto____6345
    }
  }()) {
    return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2(coll, k)
  }else {
    var x__2304__auto____6346 = coll == null ? null : coll;
    return function() {
      var or__3943__auto____6347 = cljs.core._contains_key_QMARK_[goog.typeOf(x__2304__auto____6346)];
      if(or__3943__auto____6347) {
        return or__3943__auto____6347
      }else {
        var or__3943__auto____6348 = cljs.core._contains_key_QMARK_["_"];
        if(or__3943__auto____6348) {
          return or__3943__auto____6348
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-contains-key?", coll);
        }
      }
    }().call(null, coll, k)
  }
};
cljs.core._assoc = function _assoc(coll, k, v) {
  if(function() {
    var and__3941__auto____6353 = coll;
    if(and__3941__auto____6353) {
      return coll.cljs$core$IAssociative$_assoc$arity$3
    }else {
      return and__3941__auto____6353
    }
  }()) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, k, v)
  }else {
    var x__2304__auto____6354 = coll == null ? null : coll;
    return function() {
      var or__3943__auto____6355 = cljs.core._assoc[goog.typeOf(x__2304__auto____6354)];
      if(or__3943__auto____6355) {
        return or__3943__auto____6355
      }else {
        var or__3943__auto____6356 = cljs.core._assoc["_"];
        if(or__3943__auto____6356) {
          return or__3943__auto____6356
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-assoc", coll);
        }
      }
    }().call(null, coll, k, v)
  }
};
cljs.core.IMap = {};
cljs.core._dissoc = function _dissoc(coll, k) {
  if(function() {
    var and__3941__auto____6361 = coll;
    if(and__3941__auto____6361) {
      return coll.cljs$core$IMap$_dissoc$arity$2
    }else {
      return and__3941__auto____6361
    }
  }()) {
    return coll.cljs$core$IMap$_dissoc$arity$2(coll, k)
  }else {
    var x__2304__auto____6362 = coll == null ? null : coll;
    return function() {
      var or__3943__auto____6363 = cljs.core._dissoc[goog.typeOf(x__2304__auto____6362)];
      if(or__3943__auto____6363) {
        return or__3943__auto____6363
      }else {
        var or__3943__auto____6364 = cljs.core._dissoc["_"];
        if(or__3943__auto____6364) {
          return or__3943__auto____6364
        }else {
          throw cljs.core.missing_protocol.call(null, "IMap.-dissoc", coll);
        }
      }
    }().call(null, coll, k)
  }
};
cljs.core.IMapEntry = {};
cljs.core._key = function _key(coll) {
  if(function() {
    var and__3941__auto____6369 = coll;
    if(and__3941__auto____6369) {
      return coll.cljs$core$IMapEntry$_key$arity$1
    }else {
      return and__3941__auto____6369
    }
  }()) {
    return coll.cljs$core$IMapEntry$_key$arity$1(coll)
  }else {
    var x__2304__auto____6370 = coll == null ? null : coll;
    return function() {
      var or__3943__auto____6371 = cljs.core._key[goog.typeOf(x__2304__auto____6370)];
      if(or__3943__auto____6371) {
        return or__3943__auto____6371
      }else {
        var or__3943__auto____6372 = cljs.core._key["_"];
        if(or__3943__auto____6372) {
          return or__3943__auto____6372
        }else {
          throw cljs.core.missing_protocol.call(null, "IMapEntry.-key", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._val = function _val(coll) {
  if(function() {
    var and__3941__auto____6377 = coll;
    if(and__3941__auto____6377) {
      return coll.cljs$core$IMapEntry$_val$arity$1
    }else {
      return and__3941__auto____6377
    }
  }()) {
    return coll.cljs$core$IMapEntry$_val$arity$1(coll)
  }else {
    var x__2304__auto____6378 = coll == null ? null : coll;
    return function() {
      var or__3943__auto____6379 = cljs.core._val[goog.typeOf(x__2304__auto____6378)];
      if(or__3943__auto____6379) {
        return or__3943__auto____6379
      }else {
        var or__3943__auto____6380 = cljs.core._val["_"];
        if(or__3943__auto____6380) {
          return or__3943__auto____6380
        }else {
          throw cljs.core.missing_protocol.call(null, "IMapEntry.-val", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ISet = {};
cljs.core._disjoin = function _disjoin(coll, v) {
  if(function() {
    var and__3941__auto____6385 = coll;
    if(and__3941__auto____6385) {
      return coll.cljs$core$ISet$_disjoin$arity$2
    }else {
      return and__3941__auto____6385
    }
  }()) {
    return coll.cljs$core$ISet$_disjoin$arity$2(coll, v)
  }else {
    var x__2304__auto____6386 = coll == null ? null : coll;
    return function() {
      var or__3943__auto____6387 = cljs.core._disjoin[goog.typeOf(x__2304__auto____6386)];
      if(or__3943__auto____6387) {
        return or__3943__auto____6387
      }else {
        var or__3943__auto____6388 = cljs.core._disjoin["_"];
        if(or__3943__auto____6388) {
          return or__3943__auto____6388
        }else {
          throw cljs.core.missing_protocol.call(null, "ISet.-disjoin", coll);
        }
      }
    }().call(null, coll, v)
  }
};
cljs.core.IStack = {};
cljs.core._peek = function _peek(coll) {
  if(function() {
    var and__3941__auto____6393 = coll;
    if(and__3941__auto____6393) {
      return coll.cljs$core$IStack$_peek$arity$1
    }else {
      return and__3941__auto____6393
    }
  }()) {
    return coll.cljs$core$IStack$_peek$arity$1(coll)
  }else {
    var x__2304__auto____6394 = coll == null ? null : coll;
    return function() {
      var or__3943__auto____6395 = cljs.core._peek[goog.typeOf(x__2304__auto____6394)];
      if(or__3943__auto____6395) {
        return or__3943__auto____6395
      }else {
        var or__3943__auto____6396 = cljs.core._peek["_"];
        if(or__3943__auto____6396) {
          return or__3943__auto____6396
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-peek", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._pop = function _pop(coll) {
  if(function() {
    var and__3941__auto____6401 = coll;
    if(and__3941__auto____6401) {
      return coll.cljs$core$IStack$_pop$arity$1
    }else {
      return and__3941__auto____6401
    }
  }()) {
    return coll.cljs$core$IStack$_pop$arity$1(coll)
  }else {
    var x__2304__auto____6402 = coll == null ? null : coll;
    return function() {
      var or__3943__auto____6403 = cljs.core._pop[goog.typeOf(x__2304__auto____6402)];
      if(or__3943__auto____6403) {
        return or__3943__auto____6403
      }else {
        var or__3943__auto____6404 = cljs.core._pop["_"];
        if(or__3943__auto____6404) {
          return or__3943__auto____6404
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-pop", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IVector = {};
cljs.core._assoc_n = function _assoc_n(coll, n, val) {
  if(function() {
    var and__3941__auto____6409 = coll;
    if(and__3941__auto____6409) {
      return coll.cljs$core$IVector$_assoc_n$arity$3
    }else {
      return and__3941__auto____6409
    }
  }()) {
    return coll.cljs$core$IVector$_assoc_n$arity$3(coll, n, val)
  }else {
    var x__2304__auto____6410 = coll == null ? null : coll;
    return function() {
      var or__3943__auto____6411 = cljs.core._assoc_n[goog.typeOf(x__2304__auto____6410)];
      if(or__3943__auto____6411) {
        return or__3943__auto____6411
      }else {
        var or__3943__auto____6412 = cljs.core._assoc_n["_"];
        if(or__3943__auto____6412) {
          return or__3943__auto____6412
        }else {
          throw cljs.core.missing_protocol.call(null, "IVector.-assoc-n", coll);
        }
      }
    }().call(null, coll, n, val)
  }
};
cljs.core.IDeref = {};
cljs.core._deref = function _deref(o) {
  if(function() {
    var and__3941__auto____6417 = o;
    if(and__3941__auto____6417) {
      return o.cljs$core$IDeref$_deref$arity$1
    }else {
      return and__3941__auto____6417
    }
  }()) {
    return o.cljs$core$IDeref$_deref$arity$1(o)
  }else {
    var x__2304__auto____6418 = o == null ? null : o;
    return function() {
      var or__3943__auto____6419 = cljs.core._deref[goog.typeOf(x__2304__auto____6418)];
      if(or__3943__auto____6419) {
        return or__3943__auto____6419
      }else {
        var or__3943__auto____6420 = cljs.core._deref["_"];
        if(or__3943__auto____6420) {
          return or__3943__auto____6420
        }else {
          throw cljs.core.missing_protocol.call(null, "IDeref.-deref", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.IDerefWithTimeout = {};
cljs.core._deref_with_timeout = function _deref_with_timeout(o, msec, timeout_val) {
  if(function() {
    var and__3941__auto____6425 = o;
    if(and__3941__auto____6425) {
      return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3
    }else {
      return and__3941__auto____6425
    }
  }()) {
    return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3(o, msec, timeout_val)
  }else {
    var x__2304__auto____6426 = o == null ? null : o;
    return function() {
      var or__3943__auto____6427 = cljs.core._deref_with_timeout[goog.typeOf(x__2304__auto____6426)];
      if(or__3943__auto____6427) {
        return or__3943__auto____6427
      }else {
        var or__3943__auto____6428 = cljs.core._deref_with_timeout["_"];
        if(or__3943__auto____6428) {
          return or__3943__auto____6428
        }else {
          throw cljs.core.missing_protocol.call(null, "IDerefWithTimeout.-deref-with-timeout", o);
        }
      }
    }().call(null, o, msec, timeout_val)
  }
};
cljs.core.IMeta = {};
cljs.core._meta = function _meta(o) {
  if(function() {
    var and__3941__auto____6433 = o;
    if(and__3941__auto____6433) {
      return o.cljs$core$IMeta$_meta$arity$1
    }else {
      return and__3941__auto____6433
    }
  }()) {
    return o.cljs$core$IMeta$_meta$arity$1(o)
  }else {
    var x__2304__auto____6434 = o == null ? null : o;
    return function() {
      var or__3943__auto____6435 = cljs.core._meta[goog.typeOf(x__2304__auto____6434)];
      if(or__3943__auto____6435) {
        return or__3943__auto____6435
      }else {
        var or__3943__auto____6436 = cljs.core._meta["_"];
        if(or__3943__auto____6436) {
          return or__3943__auto____6436
        }else {
          throw cljs.core.missing_protocol.call(null, "IMeta.-meta", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.IWithMeta = {};
cljs.core._with_meta = function _with_meta(o, meta) {
  if(function() {
    var and__3941__auto____6441 = o;
    if(and__3941__auto____6441) {
      return o.cljs$core$IWithMeta$_with_meta$arity$2
    }else {
      return and__3941__auto____6441
    }
  }()) {
    return o.cljs$core$IWithMeta$_with_meta$arity$2(o, meta)
  }else {
    var x__2304__auto____6442 = o == null ? null : o;
    return function() {
      var or__3943__auto____6443 = cljs.core._with_meta[goog.typeOf(x__2304__auto____6442)];
      if(or__3943__auto____6443) {
        return or__3943__auto____6443
      }else {
        var or__3943__auto____6444 = cljs.core._with_meta["_"];
        if(or__3943__auto____6444) {
          return or__3943__auto____6444
        }else {
          throw cljs.core.missing_protocol.call(null, "IWithMeta.-with-meta", o);
        }
      }
    }().call(null, o, meta)
  }
};
cljs.core.IReduce = {};
cljs.core._reduce = function() {
  var _reduce = null;
  var _reduce__2 = function(coll, f) {
    if(function() {
      var and__3941__auto____6453 = coll;
      if(and__3941__auto____6453) {
        return coll.cljs$core$IReduce$_reduce$arity$2
      }else {
        return and__3941__auto____6453
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$2(coll, f)
    }else {
      var x__2304__auto____6454 = coll == null ? null : coll;
      return function() {
        var or__3943__auto____6455 = cljs.core._reduce[goog.typeOf(x__2304__auto____6454)];
        if(or__3943__auto____6455) {
          return or__3943__auto____6455
        }else {
          var or__3943__auto____6456 = cljs.core._reduce["_"];
          if(or__3943__auto____6456) {
            return or__3943__auto____6456
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f)
    }
  };
  var _reduce__3 = function(coll, f, start) {
    if(function() {
      var and__3941__auto____6457 = coll;
      if(and__3941__auto____6457) {
        return coll.cljs$core$IReduce$_reduce$arity$3
      }else {
        return and__3941__auto____6457
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$3(coll, f, start)
    }else {
      var x__2304__auto____6458 = coll == null ? null : coll;
      return function() {
        var or__3943__auto____6459 = cljs.core._reduce[goog.typeOf(x__2304__auto____6458)];
        if(or__3943__auto____6459) {
          return or__3943__auto____6459
        }else {
          var or__3943__auto____6460 = cljs.core._reduce["_"];
          if(or__3943__auto____6460) {
            return or__3943__auto____6460
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f, start)
    }
  };
  _reduce = function(coll, f, start) {
    switch(arguments.length) {
      case 2:
        return _reduce__2.call(this, coll, f);
      case 3:
        return _reduce__3.call(this, coll, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _reduce.cljs$lang$arity$2 = _reduce__2;
  _reduce.cljs$lang$arity$3 = _reduce__3;
  return _reduce
}();
cljs.core.IKVReduce = {};
cljs.core._kv_reduce = function _kv_reduce(coll, f, init) {
  if(function() {
    var and__3941__auto____6465 = coll;
    if(and__3941__auto____6465) {
      return coll.cljs$core$IKVReduce$_kv_reduce$arity$3
    }else {
      return and__3941__auto____6465
    }
  }()) {
    return coll.cljs$core$IKVReduce$_kv_reduce$arity$3(coll, f, init)
  }else {
    var x__2304__auto____6466 = coll == null ? null : coll;
    return function() {
      var or__3943__auto____6467 = cljs.core._kv_reduce[goog.typeOf(x__2304__auto____6466)];
      if(or__3943__auto____6467) {
        return or__3943__auto____6467
      }else {
        var or__3943__auto____6468 = cljs.core._kv_reduce["_"];
        if(or__3943__auto____6468) {
          return or__3943__auto____6468
        }else {
          throw cljs.core.missing_protocol.call(null, "IKVReduce.-kv-reduce", coll);
        }
      }
    }().call(null, coll, f, init)
  }
};
cljs.core.IEquiv = {};
cljs.core._equiv = function _equiv(o, other) {
  if(function() {
    var and__3941__auto____6473 = o;
    if(and__3941__auto____6473) {
      return o.cljs$core$IEquiv$_equiv$arity$2
    }else {
      return and__3941__auto____6473
    }
  }()) {
    return o.cljs$core$IEquiv$_equiv$arity$2(o, other)
  }else {
    var x__2304__auto____6474 = o == null ? null : o;
    return function() {
      var or__3943__auto____6475 = cljs.core._equiv[goog.typeOf(x__2304__auto____6474)];
      if(or__3943__auto____6475) {
        return or__3943__auto____6475
      }else {
        var or__3943__auto____6476 = cljs.core._equiv["_"];
        if(or__3943__auto____6476) {
          return or__3943__auto____6476
        }else {
          throw cljs.core.missing_protocol.call(null, "IEquiv.-equiv", o);
        }
      }
    }().call(null, o, other)
  }
};
cljs.core.IHash = {};
cljs.core._hash = function _hash(o) {
  if(function() {
    var and__3941__auto____6481 = o;
    if(and__3941__auto____6481) {
      return o.cljs$core$IHash$_hash$arity$1
    }else {
      return and__3941__auto____6481
    }
  }()) {
    return o.cljs$core$IHash$_hash$arity$1(o)
  }else {
    var x__2304__auto____6482 = o == null ? null : o;
    return function() {
      var or__3943__auto____6483 = cljs.core._hash[goog.typeOf(x__2304__auto____6482)];
      if(or__3943__auto____6483) {
        return or__3943__auto____6483
      }else {
        var or__3943__auto____6484 = cljs.core._hash["_"];
        if(or__3943__auto____6484) {
          return or__3943__auto____6484
        }else {
          throw cljs.core.missing_protocol.call(null, "IHash.-hash", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.ISeqable = {};
cljs.core._seq = function _seq(o) {
  if(function() {
    var and__3941__auto____6489 = o;
    if(and__3941__auto____6489) {
      return o.cljs$core$ISeqable$_seq$arity$1
    }else {
      return and__3941__auto____6489
    }
  }()) {
    return o.cljs$core$ISeqable$_seq$arity$1(o)
  }else {
    var x__2304__auto____6490 = o == null ? null : o;
    return function() {
      var or__3943__auto____6491 = cljs.core._seq[goog.typeOf(x__2304__auto____6490)];
      if(or__3943__auto____6491) {
        return or__3943__auto____6491
      }else {
        var or__3943__auto____6492 = cljs.core._seq["_"];
        if(or__3943__auto____6492) {
          return or__3943__auto____6492
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeqable.-seq", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.ISequential = {};
cljs.core.IList = {};
cljs.core.IRecord = {};
cljs.core.IReversible = {};
cljs.core._rseq = function _rseq(coll) {
  if(function() {
    var and__3941__auto____6497 = coll;
    if(and__3941__auto____6497) {
      return coll.cljs$core$IReversible$_rseq$arity$1
    }else {
      return and__3941__auto____6497
    }
  }()) {
    return coll.cljs$core$IReversible$_rseq$arity$1(coll)
  }else {
    var x__2304__auto____6498 = coll == null ? null : coll;
    return function() {
      var or__3943__auto____6499 = cljs.core._rseq[goog.typeOf(x__2304__auto____6498)];
      if(or__3943__auto____6499) {
        return or__3943__auto____6499
      }else {
        var or__3943__auto____6500 = cljs.core._rseq["_"];
        if(or__3943__auto____6500) {
          return or__3943__auto____6500
        }else {
          throw cljs.core.missing_protocol.call(null, "IReversible.-rseq", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ISorted = {};
cljs.core._sorted_seq = function _sorted_seq(coll, ascending_QMARK_) {
  if(function() {
    var and__3941__auto____6505 = coll;
    if(and__3941__auto____6505) {
      return coll.cljs$core$ISorted$_sorted_seq$arity$2
    }else {
      return and__3941__auto____6505
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq$arity$2(coll, ascending_QMARK_)
  }else {
    var x__2304__auto____6506 = coll == null ? null : coll;
    return function() {
      var or__3943__auto____6507 = cljs.core._sorted_seq[goog.typeOf(x__2304__auto____6506)];
      if(or__3943__auto____6507) {
        return or__3943__auto____6507
      }else {
        var or__3943__auto____6508 = cljs.core._sorted_seq["_"];
        if(or__3943__auto____6508) {
          return or__3943__auto____6508
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq", coll);
        }
      }
    }().call(null, coll, ascending_QMARK_)
  }
};
cljs.core._sorted_seq_from = function _sorted_seq_from(coll, k, ascending_QMARK_) {
  if(function() {
    var and__3941__auto____6513 = coll;
    if(and__3941__auto____6513) {
      return coll.cljs$core$ISorted$_sorted_seq_from$arity$3
    }else {
      return and__3941__auto____6513
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq_from$arity$3(coll, k, ascending_QMARK_)
  }else {
    var x__2304__auto____6514 = coll == null ? null : coll;
    return function() {
      var or__3943__auto____6515 = cljs.core._sorted_seq_from[goog.typeOf(x__2304__auto____6514)];
      if(or__3943__auto____6515) {
        return or__3943__auto____6515
      }else {
        var or__3943__auto____6516 = cljs.core._sorted_seq_from["_"];
        if(or__3943__auto____6516) {
          return or__3943__auto____6516
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq-from", coll);
        }
      }
    }().call(null, coll, k, ascending_QMARK_)
  }
};
cljs.core._entry_key = function _entry_key(coll, entry) {
  if(function() {
    var and__3941__auto____6521 = coll;
    if(and__3941__auto____6521) {
      return coll.cljs$core$ISorted$_entry_key$arity$2
    }else {
      return and__3941__auto____6521
    }
  }()) {
    return coll.cljs$core$ISorted$_entry_key$arity$2(coll, entry)
  }else {
    var x__2304__auto____6522 = coll == null ? null : coll;
    return function() {
      var or__3943__auto____6523 = cljs.core._entry_key[goog.typeOf(x__2304__auto____6522)];
      if(or__3943__auto____6523) {
        return or__3943__auto____6523
      }else {
        var or__3943__auto____6524 = cljs.core._entry_key["_"];
        if(or__3943__auto____6524) {
          return or__3943__auto____6524
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-entry-key", coll);
        }
      }
    }().call(null, coll, entry)
  }
};
cljs.core._comparator = function _comparator(coll) {
  if(function() {
    var and__3941__auto____6529 = coll;
    if(and__3941__auto____6529) {
      return coll.cljs$core$ISorted$_comparator$arity$1
    }else {
      return and__3941__auto____6529
    }
  }()) {
    return coll.cljs$core$ISorted$_comparator$arity$1(coll)
  }else {
    var x__2304__auto____6530 = coll == null ? null : coll;
    return function() {
      var or__3943__auto____6531 = cljs.core._comparator[goog.typeOf(x__2304__auto____6530)];
      if(or__3943__auto____6531) {
        return or__3943__auto____6531
      }else {
        var or__3943__auto____6532 = cljs.core._comparator["_"];
        if(or__3943__auto____6532) {
          return or__3943__auto____6532
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-comparator", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IPrintable = {};
cljs.core._pr_seq = function _pr_seq(o, opts) {
  if(function() {
    var and__3941__auto____6537 = o;
    if(and__3941__auto____6537) {
      return o.cljs$core$IPrintable$_pr_seq$arity$2
    }else {
      return and__3941__auto____6537
    }
  }()) {
    return o.cljs$core$IPrintable$_pr_seq$arity$2(o, opts)
  }else {
    var x__2304__auto____6538 = o == null ? null : o;
    return function() {
      var or__3943__auto____6539 = cljs.core._pr_seq[goog.typeOf(x__2304__auto____6538)];
      if(or__3943__auto____6539) {
        return or__3943__auto____6539
      }else {
        var or__3943__auto____6540 = cljs.core._pr_seq["_"];
        if(or__3943__auto____6540) {
          return or__3943__auto____6540
        }else {
          throw cljs.core.missing_protocol.call(null, "IPrintable.-pr-seq", o);
        }
      }
    }().call(null, o, opts)
  }
};
cljs.core.IPending = {};
cljs.core._realized_QMARK_ = function _realized_QMARK_(d) {
  if(function() {
    var and__3941__auto____6545 = d;
    if(and__3941__auto____6545) {
      return d.cljs$core$IPending$_realized_QMARK_$arity$1
    }else {
      return and__3941__auto____6545
    }
  }()) {
    return d.cljs$core$IPending$_realized_QMARK_$arity$1(d)
  }else {
    var x__2304__auto____6546 = d == null ? null : d;
    return function() {
      var or__3943__auto____6547 = cljs.core._realized_QMARK_[goog.typeOf(x__2304__auto____6546)];
      if(or__3943__auto____6547) {
        return or__3943__auto____6547
      }else {
        var or__3943__auto____6548 = cljs.core._realized_QMARK_["_"];
        if(or__3943__auto____6548) {
          return or__3943__auto____6548
        }else {
          throw cljs.core.missing_protocol.call(null, "IPending.-realized?", d);
        }
      }
    }().call(null, d)
  }
};
cljs.core.IWatchable = {};
cljs.core._notify_watches = function _notify_watches(this$, oldval, newval) {
  if(function() {
    var and__3941__auto____6553 = this$;
    if(and__3941__auto____6553) {
      return this$.cljs$core$IWatchable$_notify_watches$arity$3
    }else {
      return and__3941__auto____6553
    }
  }()) {
    return this$.cljs$core$IWatchable$_notify_watches$arity$3(this$, oldval, newval)
  }else {
    var x__2304__auto____6554 = this$ == null ? null : this$;
    return function() {
      var or__3943__auto____6555 = cljs.core._notify_watches[goog.typeOf(x__2304__auto____6554)];
      if(or__3943__auto____6555) {
        return or__3943__auto____6555
      }else {
        var or__3943__auto____6556 = cljs.core._notify_watches["_"];
        if(or__3943__auto____6556) {
          return or__3943__auto____6556
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-notify-watches", this$);
        }
      }
    }().call(null, this$, oldval, newval)
  }
};
cljs.core._add_watch = function _add_watch(this$, key, f) {
  if(function() {
    var and__3941__auto____6561 = this$;
    if(and__3941__auto____6561) {
      return this$.cljs$core$IWatchable$_add_watch$arity$3
    }else {
      return and__3941__auto____6561
    }
  }()) {
    return this$.cljs$core$IWatchable$_add_watch$arity$3(this$, key, f)
  }else {
    var x__2304__auto____6562 = this$ == null ? null : this$;
    return function() {
      var or__3943__auto____6563 = cljs.core._add_watch[goog.typeOf(x__2304__auto____6562)];
      if(or__3943__auto____6563) {
        return or__3943__auto____6563
      }else {
        var or__3943__auto____6564 = cljs.core._add_watch["_"];
        if(or__3943__auto____6564) {
          return or__3943__auto____6564
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-add-watch", this$);
        }
      }
    }().call(null, this$, key, f)
  }
};
cljs.core._remove_watch = function _remove_watch(this$, key) {
  if(function() {
    var and__3941__auto____6569 = this$;
    if(and__3941__auto____6569) {
      return this$.cljs$core$IWatchable$_remove_watch$arity$2
    }else {
      return and__3941__auto____6569
    }
  }()) {
    return this$.cljs$core$IWatchable$_remove_watch$arity$2(this$, key)
  }else {
    var x__2304__auto____6570 = this$ == null ? null : this$;
    return function() {
      var or__3943__auto____6571 = cljs.core._remove_watch[goog.typeOf(x__2304__auto____6570)];
      if(or__3943__auto____6571) {
        return or__3943__auto____6571
      }else {
        var or__3943__auto____6572 = cljs.core._remove_watch["_"];
        if(or__3943__auto____6572) {
          return or__3943__auto____6572
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-remove-watch", this$);
        }
      }
    }().call(null, this$, key)
  }
};
cljs.core.IEditableCollection = {};
cljs.core._as_transient = function _as_transient(coll) {
  if(function() {
    var and__3941__auto____6577 = coll;
    if(and__3941__auto____6577) {
      return coll.cljs$core$IEditableCollection$_as_transient$arity$1
    }else {
      return and__3941__auto____6577
    }
  }()) {
    return coll.cljs$core$IEditableCollection$_as_transient$arity$1(coll)
  }else {
    var x__2304__auto____6578 = coll == null ? null : coll;
    return function() {
      var or__3943__auto____6579 = cljs.core._as_transient[goog.typeOf(x__2304__auto____6578)];
      if(or__3943__auto____6579) {
        return or__3943__auto____6579
      }else {
        var or__3943__auto____6580 = cljs.core._as_transient["_"];
        if(or__3943__auto____6580) {
          return or__3943__auto____6580
        }else {
          throw cljs.core.missing_protocol.call(null, "IEditableCollection.-as-transient", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ITransientCollection = {};
cljs.core._conj_BANG_ = function _conj_BANG_(tcoll, val) {
  if(function() {
    var and__3941__auto____6585 = tcoll;
    if(and__3941__auto____6585) {
      return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2
    }else {
      return and__3941__auto____6585
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2(tcoll, val)
  }else {
    var x__2304__auto____6586 = tcoll == null ? null : tcoll;
    return function() {
      var or__3943__auto____6587 = cljs.core._conj_BANG_[goog.typeOf(x__2304__auto____6586)];
      if(or__3943__auto____6587) {
        return or__3943__auto____6587
      }else {
        var or__3943__auto____6588 = cljs.core._conj_BANG_["_"];
        if(or__3943__auto____6588) {
          return or__3943__auto____6588
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientCollection.-conj!", tcoll);
        }
      }
    }().call(null, tcoll, val)
  }
};
cljs.core._persistent_BANG_ = function _persistent_BANG_(tcoll) {
  if(function() {
    var and__3941__auto____6593 = tcoll;
    if(and__3941__auto____6593) {
      return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1
    }else {
      return and__3941__auto____6593
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1(tcoll)
  }else {
    var x__2304__auto____6594 = tcoll == null ? null : tcoll;
    return function() {
      var or__3943__auto____6595 = cljs.core._persistent_BANG_[goog.typeOf(x__2304__auto____6594)];
      if(or__3943__auto____6595) {
        return or__3943__auto____6595
      }else {
        var or__3943__auto____6596 = cljs.core._persistent_BANG_["_"];
        if(or__3943__auto____6596) {
          return or__3943__auto____6596
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientCollection.-persistent!", tcoll);
        }
      }
    }().call(null, tcoll)
  }
};
cljs.core.ITransientAssociative = {};
cljs.core._assoc_BANG_ = function _assoc_BANG_(tcoll, key, val) {
  if(function() {
    var and__3941__auto____6601 = tcoll;
    if(and__3941__auto____6601) {
      return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3
    }else {
      return and__3941__auto____6601
    }
  }()) {
    return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll, key, val)
  }else {
    var x__2304__auto____6602 = tcoll == null ? null : tcoll;
    return function() {
      var or__3943__auto____6603 = cljs.core._assoc_BANG_[goog.typeOf(x__2304__auto____6602)];
      if(or__3943__auto____6603) {
        return or__3943__auto____6603
      }else {
        var or__3943__auto____6604 = cljs.core._assoc_BANG_["_"];
        if(or__3943__auto____6604) {
          return or__3943__auto____6604
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientAssociative.-assoc!", tcoll);
        }
      }
    }().call(null, tcoll, key, val)
  }
};
cljs.core.ITransientMap = {};
cljs.core._dissoc_BANG_ = function _dissoc_BANG_(tcoll, key) {
  if(function() {
    var and__3941__auto____6609 = tcoll;
    if(and__3941__auto____6609) {
      return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2
    }else {
      return and__3941__auto____6609
    }
  }()) {
    return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2(tcoll, key)
  }else {
    var x__2304__auto____6610 = tcoll == null ? null : tcoll;
    return function() {
      var or__3943__auto____6611 = cljs.core._dissoc_BANG_[goog.typeOf(x__2304__auto____6610)];
      if(or__3943__auto____6611) {
        return or__3943__auto____6611
      }else {
        var or__3943__auto____6612 = cljs.core._dissoc_BANG_["_"];
        if(or__3943__auto____6612) {
          return or__3943__auto____6612
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientMap.-dissoc!", tcoll);
        }
      }
    }().call(null, tcoll, key)
  }
};
cljs.core.ITransientVector = {};
cljs.core._assoc_n_BANG_ = function _assoc_n_BANG_(tcoll, n, val) {
  if(function() {
    var and__3941__auto____6617 = tcoll;
    if(and__3941__auto____6617) {
      return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3
    }else {
      return and__3941__auto____6617
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3(tcoll, n, val)
  }else {
    var x__2304__auto____6618 = tcoll == null ? null : tcoll;
    return function() {
      var or__3943__auto____6619 = cljs.core._assoc_n_BANG_[goog.typeOf(x__2304__auto____6618)];
      if(or__3943__auto____6619) {
        return or__3943__auto____6619
      }else {
        var or__3943__auto____6620 = cljs.core._assoc_n_BANG_["_"];
        if(or__3943__auto____6620) {
          return or__3943__auto____6620
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientVector.-assoc-n!", tcoll);
        }
      }
    }().call(null, tcoll, n, val)
  }
};
cljs.core._pop_BANG_ = function _pop_BANG_(tcoll) {
  if(function() {
    var and__3941__auto____6625 = tcoll;
    if(and__3941__auto____6625) {
      return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1
    }else {
      return and__3941__auto____6625
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1(tcoll)
  }else {
    var x__2304__auto____6626 = tcoll == null ? null : tcoll;
    return function() {
      var or__3943__auto____6627 = cljs.core._pop_BANG_[goog.typeOf(x__2304__auto____6626)];
      if(or__3943__auto____6627) {
        return or__3943__auto____6627
      }else {
        var or__3943__auto____6628 = cljs.core._pop_BANG_["_"];
        if(or__3943__auto____6628) {
          return or__3943__auto____6628
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientVector.-pop!", tcoll);
        }
      }
    }().call(null, tcoll)
  }
};
cljs.core.ITransientSet = {};
cljs.core._disjoin_BANG_ = function _disjoin_BANG_(tcoll, v) {
  if(function() {
    var and__3941__auto____6633 = tcoll;
    if(and__3941__auto____6633) {
      return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2
    }else {
      return and__3941__auto____6633
    }
  }()) {
    return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2(tcoll, v)
  }else {
    var x__2304__auto____6634 = tcoll == null ? null : tcoll;
    return function() {
      var or__3943__auto____6635 = cljs.core._disjoin_BANG_[goog.typeOf(x__2304__auto____6634)];
      if(or__3943__auto____6635) {
        return or__3943__auto____6635
      }else {
        var or__3943__auto____6636 = cljs.core._disjoin_BANG_["_"];
        if(or__3943__auto____6636) {
          return or__3943__auto____6636
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientSet.-disjoin!", tcoll);
        }
      }
    }().call(null, tcoll, v)
  }
};
cljs.core.IComparable = {};
cljs.core._compare = function _compare(x, y) {
  if(function() {
    var and__3941__auto____6641 = x;
    if(and__3941__auto____6641) {
      return x.cljs$core$IComparable$_compare$arity$2
    }else {
      return and__3941__auto____6641
    }
  }()) {
    return x.cljs$core$IComparable$_compare$arity$2(x, y)
  }else {
    var x__2304__auto____6642 = x == null ? null : x;
    return function() {
      var or__3943__auto____6643 = cljs.core._compare[goog.typeOf(x__2304__auto____6642)];
      if(or__3943__auto____6643) {
        return or__3943__auto____6643
      }else {
        var or__3943__auto____6644 = cljs.core._compare["_"];
        if(or__3943__auto____6644) {
          return or__3943__auto____6644
        }else {
          throw cljs.core.missing_protocol.call(null, "IComparable.-compare", x);
        }
      }
    }().call(null, x, y)
  }
};
cljs.core.IChunk = {};
cljs.core._drop_first = function _drop_first(coll) {
  if(function() {
    var and__3941__auto____6649 = coll;
    if(and__3941__auto____6649) {
      return coll.cljs$core$IChunk$_drop_first$arity$1
    }else {
      return and__3941__auto____6649
    }
  }()) {
    return coll.cljs$core$IChunk$_drop_first$arity$1(coll)
  }else {
    var x__2304__auto____6650 = coll == null ? null : coll;
    return function() {
      var or__3943__auto____6651 = cljs.core._drop_first[goog.typeOf(x__2304__auto____6650)];
      if(or__3943__auto____6651) {
        return or__3943__auto____6651
      }else {
        var or__3943__auto____6652 = cljs.core._drop_first["_"];
        if(or__3943__auto____6652) {
          return or__3943__auto____6652
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunk.-drop-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IChunkedSeq = {};
cljs.core._chunked_first = function _chunked_first(coll) {
  if(function() {
    var and__3941__auto____6657 = coll;
    if(and__3941__auto____6657) {
      return coll.cljs$core$IChunkedSeq$_chunked_first$arity$1
    }else {
      return and__3941__auto____6657
    }
  }()) {
    return coll.cljs$core$IChunkedSeq$_chunked_first$arity$1(coll)
  }else {
    var x__2304__auto____6658 = coll == null ? null : coll;
    return function() {
      var or__3943__auto____6659 = cljs.core._chunked_first[goog.typeOf(x__2304__auto____6658)];
      if(or__3943__auto____6659) {
        return or__3943__auto____6659
      }else {
        var or__3943__auto____6660 = cljs.core._chunked_first["_"];
        if(or__3943__auto____6660) {
          return or__3943__auto____6660
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunkedSeq.-chunked-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._chunked_rest = function _chunked_rest(coll) {
  if(function() {
    var and__3941__auto____6665 = coll;
    if(and__3941__auto____6665) {
      return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1
    }else {
      return and__3941__auto____6665
    }
  }()) {
    return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1(coll)
  }else {
    var x__2304__auto____6666 = coll == null ? null : coll;
    return function() {
      var or__3943__auto____6667 = cljs.core._chunked_rest[goog.typeOf(x__2304__auto____6666)];
      if(or__3943__auto____6667) {
        return or__3943__auto____6667
      }else {
        var or__3943__auto____6668 = cljs.core._chunked_rest["_"];
        if(or__3943__auto____6668) {
          return or__3943__auto____6668
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunkedSeq.-chunked-rest", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IChunkedNext = {};
cljs.core._chunked_next = function _chunked_next(coll) {
  if(function() {
    var and__3941__auto____6673 = coll;
    if(and__3941__auto____6673) {
      return coll.cljs$core$IChunkedNext$_chunked_next$arity$1
    }else {
      return and__3941__auto____6673
    }
  }()) {
    return coll.cljs$core$IChunkedNext$_chunked_next$arity$1(coll)
  }else {
    var x__2304__auto____6674 = coll == null ? null : coll;
    return function() {
      var or__3943__auto____6675 = cljs.core._chunked_next[goog.typeOf(x__2304__auto____6674)];
      if(or__3943__auto____6675) {
        return or__3943__auto____6675
      }else {
        var or__3943__auto____6676 = cljs.core._chunked_next["_"];
        if(or__3943__auto____6676) {
          return or__3943__auto____6676
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunkedNext.-chunked-next", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.identical_QMARK_ = function identical_QMARK_(x, y) {
  return x === y
};
cljs.core._EQ_ = function() {
  var _EQ_ = null;
  var _EQ___1 = function(x) {
    return true
  };
  var _EQ___2 = function(x, y) {
    var or__3943__auto____6678 = x === y;
    if(or__3943__auto____6678) {
      return or__3943__auto____6678
    }else {
      return cljs.core._equiv.call(null, x, y)
    }
  };
  var _EQ___3 = function() {
    var G__6679__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ_.call(null, x, y))) {
          if(cljs.core.next.call(null, more)) {
            var G__6680 = y;
            var G__6681 = cljs.core.first.call(null, more);
            var G__6682 = cljs.core.next.call(null, more);
            x = G__6680;
            y = G__6681;
            more = G__6682;
            continue
          }else {
            return _EQ_.call(null, y, cljs.core.first.call(null, more))
          }
        }else {
          return false
        }
        break
      }
    };
    var G__6679 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6679__delegate.call(this, x, y, more)
    };
    G__6679.cljs$lang$maxFixedArity = 2;
    G__6679.cljs$lang$applyTo = function(arglist__6683) {
      var x = cljs.core.first(arglist__6683);
      var y = cljs.core.first(cljs.core.next(arglist__6683));
      var more = cljs.core.rest(cljs.core.next(arglist__6683));
      return G__6679__delegate(x, y, more)
    };
    G__6679.cljs$lang$arity$variadic = G__6679__delegate;
    return G__6679
  }();
  _EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _EQ___1.call(this, x);
      case 2:
        return _EQ___2.call(this, x, y);
      default:
        return _EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _EQ_.cljs$lang$maxFixedArity = 2;
  _EQ_.cljs$lang$applyTo = _EQ___3.cljs$lang$applyTo;
  _EQ_.cljs$lang$arity$1 = _EQ___1;
  _EQ_.cljs$lang$arity$2 = _EQ___2;
  _EQ_.cljs$lang$arity$variadic = _EQ___3.cljs$lang$arity$variadic;
  return _EQ_
}();
cljs.core.nil_QMARK_ = function nil_QMARK_(x) {
  return x == null
};
cljs.core.type = function type(x) {
  if(x == null) {
    return null
  }else {
    return x.constructor
  }
};
cljs.core.instance_QMARK_ = function instance_QMARK_(t, o) {
  return o instanceof t
};
cljs.core.IHash["null"] = true;
cljs.core._hash["null"] = function(o) {
  return 0
};
cljs.core.ILookup["null"] = true;
cljs.core._lookup["null"] = function() {
  var G__6684 = null;
  var G__6684__2 = function(o, k) {
    return null
  };
  var G__6684__3 = function(o, k, not_found) {
    return not_found
  };
  G__6684 = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6684__2.call(this, o, k);
      case 3:
        return G__6684__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6684
}();
cljs.core.IAssociative["null"] = true;
cljs.core._assoc["null"] = function(_, k, v) {
  return cljs.core.hash_map.call(null, k, v)
};
cljs.core.INext["null"] = true;
cljs.core._next["null"] = function(_) {
  return null
};
cljs.core.ICollection["null"] = true;
cljs.core._conj["null"] = function(_, o) {
  return cljs.core.list.call(null, o)
};
cljs.core.IReduce["null"] = true;
cljs.core._reduce["null"] = function() {
  var G__6685 = null;
  var G__6685__2 = function(_, f) {
    return f.call(null)
  };
  var G__6685__3 = function(_, f, start) {
    return start
  };
  G__6685 = function(_, f, start) {
    switch(arguments.length) {
      case 2:
        return G__6685__2.call(this, _, f);
      case 3:
        return G__6685__3.call(this, _, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6685
}();
cljs.core.IPrintable["null"] = true;
cljs.core._pr_seq["null"] = function(o) {
  return cljs.core.list.call(null, "nil")
};
cljs.core.ISet["null"] = true;
cljs.core._disjoin["null"] = function(_, v) {
  return null
};
cljs.core.ICounted["null"] = true;
cljs.core._count["null"] = function(_) {
  return 0
};
cljs.core.IStack["null"] = true;
cljs.core._peek["null"] = function(_) {
  return null
};
cljs.core._pop["null"] = function(_) {
  return null
};
cljs.core.ISeq["null"] = true;
cljs.core._first["null"] = function(_) {
  return null
};
cljs.core._rest["null"] = function(_) {
  return cljs.core.list.call(null)
};
cljs.core.IEquiv["null"] = true;
cljs.core._equiv["null"] = function(_, o) {
  return o == null
};
cljs.core.IWithMeta["null"] = true;
cljs.core._with_meta["null"] = function(_, meta) {
  return null
};
cljs.core.IMeta["null"] = true;
cljs.core._meta["null"] = function(_) {
  return null
};
cljs.core.IIndexed["null"] = true;
cljs.core._nth["null"] = function() {
  var G__6686 = null;
  var G__6686__2 = function(_, n) {
    return null
  };
  var G__6686__3 = function(_, n, not_found) {
    return not_found
  };
  G__6686 = function(_, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6686__2.call(this, _, n);
      case 3:
        return G__6686__3.call(this, _, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6686
}();
cljs.core.IEmptyableCollection["null"] = true;
cljs.core._empty["null"] = function(_) {
  return null
};
cljs.core.IMap["null"] = true;
cljs.core._dissoc["null"] = function(_, k) {
  return null
};
Date.prototype.cljs$core$IEquiv$ = true;
Date.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var and__3941__auto____6687 = cljs.core.instance_QMARK_.call(null, Date, other);
  if(and__3941__auto____6687) {
    return o.toString() === other.toString()
  }else {
    return and__3941__auto____6687
  }
};
cljs.core.IHash["number"] = true;
cljs.core._hash["number"] = function(o) {
  return o
};
cljs.core.IEquiv["number"] = true;
cljs.core._equiv["number"] = function(x, o) {
  return x === o
};
cljs.core.IHash["boolean"] = true;
cljs.core._hash["boolean"] = function(o) {
  if(o === true) {
    return 1
  }else {
    return 0
  }
};
cljs.core.IHash["_"] = true;
cljs.core._hash["_"] = function(o) {
  return goog.getUid(o)
};
cljs.core.inc = function inc(x) {
  return x + 1
};
cljs.core.ci_reduce = function() {
  var ci_reduce = null;
  var ci_reduce__2 = function(cicoll, f) {
    var cnt__6700 = cljs.core._count.call(null, cicoll);
    if(cnt__6700 === 0) {
      return f.call(null)
    }else {
      var val__6701 = cljs.core._nth.call(null, cicoll, 0);
      var n__6702 = 1;
      while(true) {
        if(n__6702 < cnt__6700) {
          var nval__6703 = f.call(null, val__6701, cljs.core._nth.call(null, cicoll, n__6702));
          if(cljs.core.reduced_QMARK_.call(null, nval__6703)) {
            return cljs.core.deref.call(null, nval__6703)
          }else {
            var G__6712 = nval__6703;
            var G__6713 = n__6702 + 1;
            val__6701 = G__6712;
            n__6702 = G__6713;
            continue
          }
        }else {
          return val__6701
        }
        break
      }
    }
  };
  var ci_reduce__3 = function(cicoll, f, val) {
    var cnt__6704 = cljs.core._count.call(null, cicoll);
    var val__6705 = val;
    var n__6706 = 0;
    while(true) {
      if(n__6706 < cnt__6704) {
        var nval__6707 = f.call(null, val__6705, cljs.core._nth.call(null, cicoll, n__6706));
        if(cljs.core.reduced_QMARK_.call(null, nval__6707)) {
          return cljs.core.deref.call(null, nval__6707)
        }else {
          var G__6714 = nval__6707;
          var G__6715 = n__6706 + 1;
          val__6705 = G__6714;
          n__6706 = G__6715;
          continue
        }
      }else {
        return val__6705
      }
      break
    }
  };
  var ci_reduce__4 = function(cicoll, f, val, idx) {
    var cnt__6708 = cljs.core._count.call(null, cicoll);
    var val__6709 = val;
    var n__6710 = idx;
    while(true) {
      if(n__6710 < cnt__6708) {
        var nval__6711 = f.call(null, val__6709, cljs.core._nth.call(null, cicoll, n__6710));
        if(cljs.core.reduced_QMARK_.call(null, nval__6711)) {
          return cljs.core.deref.call(null, nval__6711)
        }else {
          var G__6716 = nval__6711;
          var G__6717 = n__6710 + 1;
          val__6709 = G__6716;
          n__6710 = G__6717;
          continue
        }
      }else {
        return val__6709
      }
      break
    }
  };
  ci_reduce = function(cicoll, f, val, idx) {
    switch(arguments.length) {
      case 2:
        return ci_reduce__2.call(this, cicoll, f);
      case 3:
        return ci_reduce__3.call(this, cicoll, f, val);
      case 4:
        return ci_reduce__4.call(this, cicoll, f, val, idx)
    }
    throw"Invalid arity: " + arguments.length;
  };
  ci_reduce.cljs$lang$arity$2 = ci_reduce__2;
  ci_reduce.cljs$lang$arity$3 = ci_reduce__3;
  ci_reduce.cljs$lang$arity$4 = ci_reduce__4;
  return ci_reduce
}();
cljs.core.array_reduce = function() {
  var array_reduce = null;
  var array_reduce__2 = function(arr, f) {
    var cnt__6730 = arr.length;
    if(arr.length === 0) {
      return f.call(null)
    }else {
      var val__6731 = arr[0];
      var n__6732 = 1;
      while(true) {
        if(n__6732 < cnt__6730) {
          var nval__6733 = f.call(null, val__6731, arr[n__6732]);
          if(cljs.core.reduced_QMARK_.call(null, nval__6733)) {
            return cljs.core.deref.call(null, nval__6733)
          }else {
            var G__6742 = nval__6733;
            var G__6743 = n__6732 + 1;
            val__6731 = G__6742;
            n__6732 = G__6743;
            continue
          }
        }else {
          return val__6731
        }
        break
      }
    }
  };
  var array_reduce__3 = function(arr, f, val) {
    var cnt__6734 = arr.length;
    var val__6735 = val;
    var n__6736 = 0;
    while(true) {
      if(n__6736 < cnt__6734) {
        var nval__6737 = f.call(null, val__6735, arr[n__6736]);
        if(cljs.core.reduced_QMARK_.call(null, nval__6737)) {
          return cljs.core.deref.call(null, nval__6737)
        }else {
          var G__6744 = nval__6737;
          var G__6745 = n__6736 + 1;
          val__6735 = G__6744;
          n__6736 = G__6745;
          continue
        }
      }else {
        return val__6735
      }
      break
    }
  };
  var array_reduce__4 = function(arr, f, val, idx) {
    var cnt__6738 = arr.length;
    var val__6739 = val;
    var n__6740 = idx;
    while(true) {
      if(n__6740 < cnt__6738) {
        var nval__6741 = f.call(null, val__6739, arr[n__6740]);
        if(cljs.core.reduced_QMARK_.call(null, nval__6741)) {
          return cljs.core.deref.call(null, nval__6741)
        }else {
          var G__6746 = nval__6741;
          var G__6747 = n__6740 + 1;
          val__6739 = G__6746;
          n__6740 = G__6747;
          continue
        }
      }else {
        return val__6739
      }
      break
    }
  };
  array_reduce = function(arr, f, val, idx) {
    switch(arguments.length) {
      case 2:
        return array_reduce__2.call(this, arr, f);
      case 3:
        return array_reduce__3.call(this, arr, f, val);
      case 4:
        return array_reduce__4.call(this, arr, f, val, idx)
    }
    throw"Invalid arity: " + arguments.length;
  };
  array_reduce.cljs$lang$arity$2 = array_reduce__2;
  array_reduce.cljs$lang$arity$3 = array_reduce__3;
  array_reduce.cljs$lang$arity$4 = array_reduce__4;
  return array_reduce
}();
cljs.core.IndexedSeq = function(a, i) {
  this.a = a;
  this.i = i;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 166199546
};
cljs.core.IndexedSeq.cljs$lang$type = true;
cljs.core.IndexedSeq.cljs$lang$ctorPrSeq = function(this__2250__auto__) {
  return cljs.core.list.call(null, "cljs.core/IndexedSeq")
};
cljs.core.IndexedSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__6748 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$INext$_next$arity$1 = function(_) {
  var this__6749 = this;
  if(this__6749.i + 1 < this__6749.a.length) {
    return new cljs.core.IndexedSeq(this__6749.a, this__6749.i + 1)
  }else {
    return null
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__6750 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__6751 = this;
  var c__6752 = coll.cljs$core$ICounted$_count$arity$1(coll);
  if(c__6752 > 0) {
    return new cljs.core.RSeq(coll, c__6752 - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.IndexedSeq.prototype.toString = function() {
  var this__6753 = this;
  var this__6754 = this;
  return cljs.core.pr_str.call(null, this__6754)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__6755 = this;
  if(cljs.core.counted_QMARK_.call(null, this__6755.a)) {
    return cljs.core.ci_reduce.call(null, this__6755.a, f, this__6755.a[this__6755.i], this__6755.i + 1)
  }else {
    return cljs.core.ci_reduce.call(null, coll, f, this__6755.a[this__6755.i], 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__6756 = this;
  if(cljs.core.counted_QMARK_.call(null, this__6756.a)) {
    return cljs.core.ci_reduce.call(null, this__6756.a, f, start, this__6756.i)
  }else {
    return cljs.core.ci_reduce.call(null, coll, f, start, 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__6757 = this;
  return this$
};
cljs.core.IndexedSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__6758 = this;
  return this__6758.a.length - this__6758.i
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(_) {
  var this__6759 = this;
  return this__6759.a[this__6759.i]
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(_) {
  var this__6760 = this;
  if(this__6760.i + 1 < this__6760.a.length) {
    return new cljs.core.IndexedSeq(this__6760.a, this__6760.i + 1)
  }else {
    return cljs.core.list.call(null)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6761 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__6762 = this;
  var i__6763 = n + this__6762.i;
  if(i__6763 < this__6762.a.length) {
    return this__6762.a[i__6763]
  }else {
    return null
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__6764 = this;
  var i__6765 = n + this__6764.i;
  if(i__6765 < this__6764.a.length) {
    return this__6764.a[i__6765]
  }else {
    return not_found
  }
};
cljs.core.IndexedSeq;
cljs.core.prim_seq = function() {
  var prim_seq = null;
  var prim_seq__1 = function(prim) {
    return prim_seq.call(null, prim, 0)
  };
  var prim_seq__2 = function(prim, i) {
    if(prim.length === 0) {
      return null
    }else {
      return new cljs.core.IndexedSeq(prim, i)
    }
  };
  prim_seq = function(prim, i) {
    switch(arguments.length) {
      case 1:
        return prim_seq__1.call(this, prim);
      case 2:
        return prim_seq__2.call(this, prim, i)
    }
    throw"Invalid arity: " + arguments.length;
  };
  prim_seq.cljs$lang$arity$1 = prim_seq__1;
  prim_seq.cljs$lang$arity$2 = prim_seq__2;
  return prim_seq
}();
cljs.core.array_seq = function() {
  var array_seq = null;
  var array_seq__1 = function(array) {
    return cljs.core.prim_seq.call(null, array, 0)
  };
  var array_seq__2 = function(array, i) {
    return cljs.core.prim_seq.call(null, array, i)
  };
  array_seq = function(array, i) {
    switch(arguments.length) {
      case 1:
        return array_seq__1.call(this, array);
      case 2:
        return array_seq__2.call(this, array, i)
    }
    throw"Invalid arity: " + arguments.length;
  };
  array_seq.cljs$lang$arity$1 = array_seq__1;
  array_seq.cljs$lang$arity$2 = array_seq__2;
  return array_seq
}();
cljs.core.IReduce["array"] = true;
cljs.core._reduce["array"] = function() {
  var G__6766 = null;
  var G__6766__2 = function(array, f) {
    return cljs.core.ci_reduce.call(null, array, f)
  };
  var G__6766__3 = function(array, f, start) {
    return cljs.core.ci_reduce.call(null, array, f, start)
  };
  G__6766 = function(array, f, start) {
    switch(arguments.length) {
      case 2:
        return G__6766__2.call(this, array, f);
      case 3:
        return G__6766__3.call(this, array, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6766
}();
cljs.core.ILookup["array"] = true;
cljs.core._lookup["array"] = function() {
  var G__6767 = null;
  var G__6767__2 = function(array, k) {
    return array[k]
  };
  var G__6767__3 = function(array, k, not_found) {
    return cljs.core._nth.call(null, array, k, not_found)
  };
  G__6767 = function(array, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6767__2.call(this, array, k);
      case 3:
        return G__6767__3.call(this, array, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6767
}();
cljs.core.IIndexed["array"] = true;
cljs.core._nth["array"] = function() {
  var G__6768 = null;
  var G__6768__2 = function(array, n) {
    if(n < array.length) {
      return array[n]
    }else {
      return null
    }
  };
  var G__6768__3 = function(array, n, not_found) {
    if(n < array.length) {
      return array[n]
    }else {
      return not_found
    }
  };
  G__6768 = function(array, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6768__2.call(this, array, n);
      case 3:
        return G__6768__3.call(this, array, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6768
}();
cljs.core.ICounted["array"] = true;
cljs.core._count["array"] = function(a) {
  return a.length
};
cljs.core.ISeqable["array"] = true;
cljs.core._seq["array"] = function(array) {
  return cljs.core.array_seq.call(null, array, 0)
};
cljs.core.RSeq = function(ci, i, meta) {
  this.ci = ci;
  this.i = i;
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850570
};
cljs.core.RSeq.cljs$lang$type = true;
cljs.core.RSeq.cljs$lang$ctorPrSeq = function(this__2250__auto__) {
  return cljs.core.list.call(null, "cljs.core/RSeq")
};
cljs.core.RSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__6769 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.RSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__6770 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.RSeq.prototype.toString = function() {
  var this__6771 = this;
  var this__6772 = this;
  return cljs.core.pr_str.call(null, this__6772)
};
cljs.core.RSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__6773 = this;
  return coll
};
cljs.core.RSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__6774 = this;
  return this__6774.i + 1
};
cljs.core.RSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__6775 = this;
  return cljs.core._nth.call(null, this__6775.ci, this__6775.i)
};
cljs.core.RSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__6776 = this;
  if(this__6776.i > 0) {
    return new cljs.core.RSeq(this__6776.ci, this__6776.i - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.RSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6777 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.RSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, new_meta) {
  var this__6778 = this;
  return new cljs.core.RSeq(this__6778.ci, this__6778.i, new_meta)
};
cljs.core.RSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__6779 = this;
  return this__6779.meta
};
cljs.core.RSeq;
cljs.core.seq = function seq(coll) {
  if(coll == null) {
    return null
  }else {
    if(function() {
      var G__6783__6784 = coll;
      if(G__6783__6784) {
        if(function() {
          var or__3943__auto____6785 = G__6783__6784.cljs$lang$protocol_mask$partition0$ & 32;
          if(or__3943__auto____6785) {
            return or__3943__auto____6785
          }else {
            return G__6783__6784.cljs$core$ASeq$
          }
        }()) {
          return true
        }else {
          if(!G__6783__6784.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__6783__6784)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__6783__6784)
      }
    }()) {
      return coll
    }else {
      return cljs.core._seq.call(null, coll)
    }
  }
};
cljs.core.first = function first(coll) {
  if(coll == null) {
    return null
  }else {
    if(function() {
      var G__6790__6791 = coll;
      if(G__6790__6791) {
        if(function() {
          var or__3943__auto____6792 = G__6790__6791.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3943__auto____6792) {
            return or__3943__auto____6792
          }else {
            return G__6790__6791.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__6790__6791.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__6790__6791)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__6790__6791)
      }
    }()) {
      return cljs.core._first.call(null, coll)
    }else {
      var s__6793 = cljs.core.seq.call(null, coll);
      if(s__6793 == null) {
        return null
      }else {
        return cljs.core._first.call(null, s__6793)
      }
    }
  }
};
cljs.core.rest = function rest(coll) {
  if(!(coll == null)) {
    if(function() {
      var G__6798__6799 = coll;
      if(G__6798__6799) {
        if(function() {
          var or__3943__auto____6800 = G__6798__6799.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3943__auto____6800) {
            return or__3943__auto____6800
          }else {
            return G__6798__6799.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__6798__6799.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__6798__6799)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__6798__6799)
      }
    }()) {
      return cljs.core._rest.call(null, coll)
    }else {
      var s__6801 = cljs.core.seq.call(null, coll);
      if(!(s__6801 == null)) {
        return cljs.core._rest.call(null, s__6801)
      }else {
        return cljs.core.List.EMPTY
      }
    }
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.next = function next(coll) {
  if(coll == null) {
    return null
  }else {
    if(function() {
      var G__6805__6806 = coll;
      if(G__6805__6806) {
        if(function() {
          var or__3943__auto____6807 = G__6805__6806.cljs$lang$protocol_mask$partition0$ & 128;
          if(or__3943__auto____6807) {
            return or__3943__auto____6807
          }else {
            return G__6805__6806.cljs$core$INext$
          }
        }()) {
          return true
        }else {
          if(!G__6805__6806.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.INext, G__6805__6806)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.INext, G__6805__6806)
      }
    }()) {
      return cljs.core._next.call(null, coll)
    }else {
      return cljs.core.seq.call(null, cljs.core.rest.call(null, coll))
    }
  }
};
cljs.core.second = function second(coll) {
  return cljs.core.first.call(null, cljs.core.next.call(null, coll))
};
cljs.core.ffirst = function ffirst(coll) {
  return cljs.core.first.call(null, cljs.core.first.call(null, coll))
};
cljs.core.nfirst = function nfirst(coll) {
  return cljs.core.next.call(null, cljs.core.first.call(null, coll))
};
cljs.core.fnext = function fnext(coll) {
  return cljs.core.first.call(null, cljs.core.next.call(null, coll))
};
cljs.core.nnext = function nnext(coll) {
  return cljs.core.next.call(null, cljs.core.next.call(null, coll))
};
cljs.core.last = function last(s) {
  while(true) {
    var sn__6809 = cljs.core.next.call(null, s);
    if(!(sn__6809 == null)) {
      var G__6810 = sn__6809;
      s = G__6810;
      continue
    }else {
      return cljs.core.first.call(null, s)
    }
    break
  }
};
cljs.core.IEquiv["_"] = true;
cljs.core._equiv["_"] = function(x, o) {
  return x === o
};
cljs.core.not = function not(x) {
  if(cljs.core.truth_(x)) {
    return false
  }else {
    return true
  }
};
cljs.core.conj = function() {
  var conj = null;
  var conj__2 = function(coll, x) {
    return cljs.core._conj.call(null, coll, x)
  };
  var conj__3 = function() {
    var G__6811__delegate = function(coll, x, xs) {
      while(true) {
        if(cljs.core.truth_(xs)) {
          var G__6812 = conj.call(null, coll, x);
          var G__6813 = cljs.core.first.call(null, xs);
          var G__6814 = cljs.core.next.call(null, xs);
          coll = G__6812;
          x = G__6813;
          xs = G__6814;
          continue
        }else {
          return conj.call(null, coll, x)
        }
        break
      }
    };
    var G__6811 = function(coll, x, var_args) {
      var xs = null;
      if(goog.isDef(var_args)) {
        xs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6811__delegate.call(this, coll, x, xs)
    };
    G__6811.cljs$lang$maxFixedArity = 2;
    G__6811.cljs$lang$applyTo = function(arglist__6815) {
      var coll = cljs.core.first(arglist__6815);
      var x = cljs.core.first(cljs.core.next(arglist__6815));
      var xs = cljs.core.rest(cljs.core.next(arglist__6815));
      return G__6811__delegate(coll, x, xs)
    };
    G__6811.cljs$lang$arity$variadic = G__6811__delegate;
    return G__6811
  }();
  conj = function(coll, x, var_args) {
    var xs = var_args;
    switch(arguments.length) {
      case 2:
        return conj__2.call(this, coll, x);
      default:
        return conj__3.cljs$lang$arity$variadic(coll, x, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  conj.cljs$lang$maxFixedArity = 2;
  conj.cljs$lang$applyTo = conj__3.cljs$lang$applyTo;
  conj.cljs$lang$arity$2 = conj__2;
  conj.cljs$lang$arity$variadic = conj__3.cljs$lang$arity$variadic;
  return conj
}();
cljs.core.empty = function empty(coll) {
  return cljs.core._empty.call(null, coll)
};
cljs.core.accumulating_seq_count = function accumulating_seq_count(coll) {
  var s__6818 = cljs.core.seq.call(null, coll);
  var acc__6819 = 0;
  while(true) {
    if(cljs.core.counted_QMARK_.call(null, s__6818)) {
      return acc__6819 + cljs.core._count.call(null, s__6818)
    }else {
      var G__6820 = cljs.core.next.call(null, s__6818);
      var G__6821 = acc__6819 + 1;
      s__6818 = G__6820;
      acc__6819 = G__6821;
      continue
    }
    break
  }
};
cljs.core.count = function count(coll) {
  if(cljs.core.counted_QMARK_.call(null, coll)) {
    return cljs.core._count.call(null, coll)
  }else {
    return cljs.core.accumulating_seq_count.call(null, coll)
  }
};
cljs.core.linear_traversal_nth = function() {
  var linear_traversal_nth = null;
  var linear_traversal_nth__2 = function(coll, n) {
    if(coll == null) {
      throw new Error("Index out of bounds");
    }else {
      if(n === 0) {
        if(cljs.core.seq.call(null, coll)) {
          return cljs.core.first.call(null, coll)
        }else {
          throw new Error("Index out of bounds");
        }
      }else {
        if(cljs.core.indexed_QMARK_.call(null, coll)) {
          return cljs.core._nth.call(null, coll, n)
        }else {
          if(cljs.core.seq.call(null, coll)) {
            return linear_traversal_nth.call(null, cljs.core.next.call(null, coll), n - 1)
          }else {
            if("\ufdd0'else") {
              throw new Error("Index out of bounds");
            }else {
              return null
            }
          }
        }
      }
    }
  };
  var linear_traversal_nth__3 = function(coll, n, not_found) {
    if(coll == null) {
      return not_found
    }else {
      if(n === 0) {
        if(cljs.core.seq.call(null, coll)) {
          return cljs.core.first.call(null, coll)
        }else {
          return not_found
        }
      }else {
        if(cljs.core.indexed_QMARK_.call(null, coll)) {
          return cljs.core._nth.call(null, coll, n, not_found)
        }else {
          if(cljs.core.seq.call(null, coll)) {
            return linear_traversal_nth.call(null, cljs.core.next.call(null, coll), n - 1, not_found)
          }else {
            if("\ufdd0'else") {
              return not_found
            }else {
              return null
            }
          }
        }
      }
    }
  };
  linear_traversal_nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return linear_traversal_nth__2.call(this, coll, n);
      case 3:
        return linear_traversal_nth__3.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  linear_traversal_nth.cljs$lang$arity$2 = linear_traversal_nth__2;
  linear_traversal_nth.cljs$lang$arity$3 = linear_traversal_nth__3;
  return linear_traversal_nth
}();
cljs.core.nth = function() {
  var nth = null;
  var nth__2 = function(coll, n) {
    if(coll == null) {
      return null
    }else {
      if(function() {
        var G__6828__6829 = coll;
        if(G__6828__6829) {
          if(function() {
            var or__3943__auto____6830 = G__6828__6829.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3943__auto____6830) {
              return or__3943__auto____6830
            }else {
              return G__6828__6829.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            if(!G__6828__6829.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__6828__6829)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__6828__6829)
        }
      }()) {
        return cljs.core._nth.call(null, coll, Math.floor(n))
      }else {
        return cljs.core.linear_traversal_nth.call(null, coll, Math.floor(n))
      }
    }
  };
  var nth__3 = function(coll, n, not_found) {
    if(!(coll == null)) {
      if(function() {
        var G__6831__6832 = coll;
        if(G__6831__6832) {
          if(function() {
            var or__3943__auto____6833 = G__6831__6832.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3943__auto____6833) {
              return or__3943__auto____6833
            }else {
              return G__6831__6832.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            if(!G__6831__6832.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__6831__6832)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__6831__6832)
        }
      }()) {
        return cljs.core._nth.call(null, coll, Math.floor(n), not_found)
      }else {
        return cljs.core.linear_traversal_nth.call(null, coll, Math.floor(n), not_found)
      }
    }else {
      return not_found
    }
  };
  nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return nth__2.call(this, coll, n);
      case 3:
        return nth__3.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  nth.cljs$lang$arity$2 = nth__2;
  nth.cljs$lang$arity$3 = nth__3;
  return nth
}();
cljs.core.get = function() {
  var get = null;
  var get__2 = function(o, k) {
    return cljs.core._lookup.call(null, o, k)
  };
  var get__3 = function(o, k, not_found) {
    return cljs.core._lookup.call(null, o, k, not_found)
  };
  get = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return get__2.call(this, o, k);
      case 3:
        return get__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  get.cljs$lang$arity$2 = get__2;
  get.cljs$lang$arity$3 = get__3;
  return get
}();
cljs.core.assoc = function() {
  var assoc = null;
  var assoc__3 = function(coll, k, v) {
    return cljs.core._assoc.call(null, coll, k, v)
  };
  var assoc__4 = function() {
    var G__6836__delegate = function(coll, k, v, kvs) {
      while(true) {
        var ret__6835 = assoc.call(null, coll, k, v);
        if(cljs.core.truth_(kvs)) {
          var G__6837 = ret__6835;
          var G__6838 = cljs.core.first.call(null, kvs);
          var G__6839 = cljs.core.second.call(null, kvs);
          var G__6840 = cljs.core.nnext.call(null, kvs);
          coll = G__6837;
          k = G__6838;
          v = G__6839;
          kvs = G__6840;
          continue
        }else {
          return ret__6835
        }
        break
      }
    };
    var G__6836 = function(coll, k, v, var_args) {
      var kvs = null;
      if(goog.isDef(var_args)) {
        kvs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__6836__delegate.call(this, coll, k, v, kvs)
    };
    G__6836.cljs$lang$maxFixedArity = 3;
    G__6836.cljs$lang$applyTo = function(arglist__6841) {
      var coll = cljs.core.first(arglist__6841);
      var k = cljs.core.first(cljs.core.next(arglist__6841));
      var v = cljs.core.first(cljs.core.next(cljs.core.next(arglist__6841)));
      var kvs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__6841)));
      return G__6836__delegate(coll, k, v, kvs)
    };
    G__6836.cljs$lang$arity$variadic = G__6836__delegate;
    return G__6836
  }();
  assoc = function(coll, k, v, var_args) {
    var kvs = var_args;
    switch(arguments.length) {
      case 3:
        return assoc__3.call(this, coll, k, v);
      default:
        return assoc__4.cljs$lang$arity$variadic(coll, k, v, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  assoc.cljs$lang$maxFixedArity = 3;
  assoc.cljs$lang$applyTo = assoc__4.cljs$lang$applyTo;
  assoc.cljs$lang$arity$3 = assoc__3;
  assoc.cljs$lang$arity$variadic = assoc__4.cljs$lang$arity$variadic;
  return assoc
}();
cljs.core.dissoc = function() {
  var dissoc = null;
  var dissoc__1 = function(coll) {
    return coll
  };
  var dissoc__2 = function(coll, k) {
    return cljs.core._dissoc.call(null, coll, k)
  };
  var dissoc__3 = function() {
    var G__6844__delegate = function(coll, k, ks) {
      while(true) {
        var ret__6843 = dissoc.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__6845 = ret__6843;
          var G__6846 = cljs.core.first.call(null, ks);
          var G__6847 = cljs.core.next.call(null, ks);
          coll = G__6845;
          k = G__6846;
          ks = G__6847;
          continue
        }else {
          return ret__6843
        }
        break
      }
    };
    var G__6844 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6844__delegate.call(this, coll, k, ks)
    };
    G__6844.cljs$lang$maxFixedArity = 2;
    G__6844.cljs$lang$applyTo = function(arglist__6848) {
      var coll = cljs.core.first(arglist__6848);
      var k = cljs.core.first(cljs.core.next(arglist__6848));
      var ks = cljs.core.rest(cljs.core.next(arglist__6848));
      return G__6844__delegate(coll, k, ks)
    };
    G__6844.cljs$lang$arity$variadic = G__6844__delegate;
    return G__6844
  }();
  dissoc = function(coll, k, var_args) {
    var ks = var_args;
    switch(arguments.length) {
      case 1:
        return dissoc__1.call(this, coll);
      case 2:
        return dissoc__2.call(this, coll, k);
      default:
        return dissoc__3.cljs$lang$arity$variadic(coll, k, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  dissoc.cljs$lang$maxFixedArity = 2;
  dissoc.cljs$lang$applyTo = dissoc__3.cljs$lang$applyTo;
  dissoc.cljs$lang$arity$1 = dissoc__1;
  dissoc.cljs$lang$arity$2 = dissoc__2;
  dissoc.cljs$lang$arity$variadic = dissoc__3.cljs$lang$arity$variadic;
  return dissoc
}();
cljs.core.with_meta = function with_meta(o, meta) {
  return cljs.core._with_meta.call(null, o, meta)
};
cljs.core.meta = function meta(o) {
  if(function() {
    var G__6852__6853 = o;
    if(G__6852__6853) {
      if(function() {
        var or__3943__auto____6854 = G__6852__6853.cljs$lang$protocol_mask$partition0$ & 131072;
        if(or__3943__auto____6854) {
          return or__3943__auto____6854
        }else {
          return G__6852__6853.cljs$core$IMeta$
        }
      }()) {
        return true
      }else {
        if(!G__6852__6853.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__6852__6853)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__6852__6853)
    }
  }()) {
    return cljs.core._meta.call(null, o)
  }else {
    return null
  }
};
cljs.core.peek = function peek(coll) {
  return cljs.core._peek.call(null, coll)
};
cljs.core.pop = function pop(coll) {
  return cljs.core._pop.call(null, coll)
};
cljs.core.disj = function() {
  var disj = null;
  var disj__1 = function(coll) {
    return coll
  };
  var disj__2 = function(coll, k) {
    return cljs.core._disjoin.call(null, coll, k)
  };
  var disj__3 = function() {
    var G__6857__delegate = function(coll, k, ks) {
      while(true) {
        var ret__6856 = disj.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__6858 = ret__6856;
          var G__6859 = cljs.core.first.call(null, ks);
          var G__6860 = cljs.core.next.call(null, ks);
          coll = G__6858;
          k = G__6859;
          ks = G__6860;
          continue
        }else {
          return ret__6856
        }
        break
      }
    };
    var G__6857 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6857__delegate.call(this, coll, k, ks)
    };
    G__6857.cljs$lang$maxFixedArity = 2;
    G__6857.cljs$lang$applyTo = function(arglist__6861) {
      var coll = cljs.core.first(arglist__6861);
      var k = cljs.core.first(cljs.core.next(arglist__6861));
      var ks = cljs.core.rest(cljs.core.next(arglist__6861));
      return G__6857__delegate(coll, k, ks)
    };
    G__6857.cljs$lang$arity$variadic = G__6857__delegate;
    return G__6857
  }();
  disj = function(coll, k, var_args) {
    var ks = var_args;
    switch(arguments.length) {
      case 1:
        return disj__1.call(this, coll);
      case 2:
        return disj__2.call(this, coll, k);
      default:
        return disj__3.cljs$lang$arity$variadic(coll, k, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  disj.cljs$lang$maxFixedArity = 2;
  disj.cljs$lang$applyTo = disj__3.cljs$lang$applyTo;
  disj.cljs$lang$arity$1 = disj__1;
  disj.cljs$lang$arity$2 = disj__2;
  disj.cljs$lang$arity$variadic = disj__3.cljs$lang$arity$variadic;
  return disj
}();
cljs.core.string_hash_cache = {};
cljs.core.string_hash_cache_count = 0;
cljs.core.add_to_string_hash_cache = function add_to_string_hash_cache(k) {
  var h__6863 = goog.string.hashCode(k);
  cljs.core.string_hash_cache[k] = h__6863;
  cljs.core.string_hash_cache_count = cljs.core.string_hash_cache_count + 1;
  return h__6863
};
cljs.core.check_string_hash_cache = function check_string_hash_cache(k) {
  if(cljs.core.string_hash_cache_count > 255) {
    cljs.core.string_hash_cache = {};
    cljs.core.string_hash_cache_count = 0
  }else {
  }
  var h__6865 = cljs.core.string_hash_cache[k];
  if(!(h__6865 == null)) {
    return h__6865
  }else {
    return cljs.core.add_to_string_hash_cache.call(null, k)
  }
};
cljs.core.hash = function() {
  var hash = null;
  var hash__1 = function(o) {
    return hash.call(null, o, true)
  };
  var hash__2 = function(o, check_cache) {
    if(function() {
      var and__3941__auto____6867 = goog.isString(o);
      if(and__3941__auto____6867) {
        return check_cache
      }else {
        return and__3941__auto____6867
      }
    }()) {
      return cljs.core.check_string_hash_cache.call(null, o)
    }else {
      return cljs.core._hash.call(null, o)
    }
  };
  hash = function(o, check_cache) {
    switch(arguments.length) {
      case 1:
        return hash__1.call(this, o);
      case 2:
        return hash__2.call(this, o, check_cache)
    }
    throw"Invalid arity: " + arguments.length;
  };
  hash.cljs$lang$arity$1 = hash__1;
  hash.cljs$lang$arity$2 = hash__2;
  return hash
}();
cljs.core.empty_QMARK_ = function empty_QMARK_(coll) {
  return cljs.core.not.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.coll_QMARK_ = function coll_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__6871__6872 = x;
    if(G__6871__6872) {
      if(function() {
        var or__3943__auto____6873 = G__6871__6872.cljs$lang$protocol_mask$partition0$ & 8;
        if(or__3943__auto____6873) {
          return or__3943__auto____6873
        }else {
          return G__6871__6872.cljs$core$ICollection$
        }
      }()) {
        return true
      }else {
        if(!G__6871__6872.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__6871__6872)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__6871__6872)
    }
  }
};
cljs.core.set_QMARK_ = function set_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__6877__6878 = x;
    if(G__6877__6878) {
      if(function() {
        var or__3943__auto____6879 = G__6877__6878.cljs$lang$protocol_mask$partition0$ & 4096;
        if(or__3943__auto____6879) {
          return or__3943__auto____6879
        }else {
          return G__6877__6878.cljs$core$ISet$
        }
      }()) {
        return true
      }else {
        if(!G__6877__6878.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__6877__6878)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__6877__6878)
    }
  }
};
cljs.core.associative_QMARK_ = function associative_QMARK_(x) {
  var G__6883__6884 = x;
  if(G__6883__6884) {
    if(function() {
      var or__3943__auto____6885 = G__6883__6884.cljs$lang$protocol_mask$partition0$ & 512;
      if(or__3943__auto____6885) {
        return or__3943__auto____6885
      }else {
        return G__6883__6884.cljs$core$IAssociative$
      }
    }()) {
      return true
    }else {
      if(!G__6883__6884.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__6883__6884)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__6883__6884)
  }
};
cljs.core.sequential_QMARK_ = function sequential_QMARK_(x) {
  var G__6889__6890 = x;
  if(G__6889__6890) {
    if(function() {
      var or__3943__auto____6891 = G__6889__6890.cljs$lang$protocol_mask$partition0$ & 16777216;
      if(or__3943__auto____6891) {
        return or__3943__auto____6891
      }else {
        return G__6889__6890.cljs$core$ISequential$
      }
    }()) {
      return true
    }else {
      if(!G__6889__6890.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__6889__6890)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__6889__6890)
  }
};
cljs.core.counted_QMARK_ = function counted_QMARK_(x) {
  var G__6895__6896 = x;
  if(G__6895__6896) {
    if(function() {
      var or__3943__auto____6897 = G__6895__6896.cljs$lang$protocol_mask$partition0$ & 2;
      if(or__3943__auto____6897) {
        return or__3943__auto____6897
      }else {
        return G__6895__6896.cljs$core$ICounted$
      }
    }()) {
      return true
    }else {
      if(!G__6895__6896.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__6895__6896)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__6895__6896)
  }
};
cljs.core.indexed_QMARK_ = function indexed_QMARK_(x) {
  var G__6901__6902 = x;
  if(G__6901__6902) {
    if(function() {
      var or__3943__auto____6903 = G__6901__6902.cljs$lang$protocol_mask$partition0$ & 16;
      if(or__3943__auto____6903) {
        return or__3943__auto____6903
      }else {
        return G__6901__6902.cljs$core$IIndexed$
      }
    }()) {
      return true
    }else {
      if(!G__6901__6902.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__6901__6902)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__6901__6902)
  }
};
cljs.core.reduceable_QMARK_ = function reduceable_QMARK_(x) {
  var G__6907__6908 = x;
  if(G__6907__6908) {
    if(function() {
      var or__3943__auto____6909 = G__6907__6908.cljs$lang$protocol_mask$partition0$ & 524288;
      if(or__3943__auto____6909) {
        return or__3943__auto____6909
      }else {
        return G__6907__6908.cljs$core$IReduce$
      }
    }()) {
      return true
    }else {
      if(!G__6907__6908.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__6907__6908)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__6907__6908)
  }
};
cljs.core.map_QMARK_ = function map_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__6913__6914 = x;
    if(G__6913__6914) {
      if(function() {
        var or__3943__auto____6915 = G__6913__6914.cljs$lang$protocol_mask$partition0$ & 1024;
        if(or__3943__auto____6915) {
          return or__3943__auto____6915
        }else {
          return G__6913__6914.cljs$core$IMap$
        }
      }()) {
        return true
      }else {
        if(!G__6913__6914.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__6913__6914)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__6913__6914)
    }
  }
};
cljs.core.vector_QMARK_ = function vector_QMARK_(x) {
  var G__6919__6920 = x;
  if(G__6919__6920) {
    if(function() {
      var or__3943__auto____6921 = G__6919__6920.cljs$lang$protocol_mask$partition0$ & 16384;
      if(or__3943__auto____6921) {
        return or__3943__auto____6921
      }else {
        return G__6919__6920.cljs$core$IVector$
      }
    }()) {
      return true
    }else {
      if(!G__6919__6920.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__6919__6920)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__6919__6920)
  }
};
cljs.core.chunked_seq_QMARK_ = function chunked_seq_QMARK_(x) {
  var G__6925__6926 = x;
  if(G__6925__6926) {
    if(cljs.core.truth_(function() {
      var or__3943__auto____6927 = null;
      if(cljs.core.truth_(or__3943__auto____6927)) {
        return or__3943__auto____6927
      }else {
        return G__6925__6926.cljs$core$IChunkedSeq$
      }
    }())) {
      return true
    }else {
      if(!G__6925__6926.cljs$lang$protocol_mask$partition$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedSeq, G__6925__6926)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedSeq, G__6925__6926)
  }
};
cljs.core.js_obj = function() {
  var js_obj = null;
  var js_obj__0 = function() {
    return{}
  };
  var js_obj__1 = function() {
    var G__6928__delegate = function(keyvals) {
      return cljs.core.apply.call(null, goog.object.create, keyvals)
    };
    var G__6928 = function(var_args) {
      var keyvals = null;
      if(goog.isDef(var_args)) {
        keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__6928__delegate.call(this, keyvals)
    };
    G__6928.cljs$lang$maxFixedArity = 0;
    G__6928.cljs$lang$applyTo = function(arglist__6929) {
      var keyvals = cljs.core.seq(arglist__6929);
      return G__6928__delegate(keyvals)
    };
    G__6928.cljs$lang$arity$variadic = G__6928__delegate;
    return G__6928
  }();
  js_obj = function(var_args) {
    var keyvals = var_args;
    switch(arguments.length) {
      case 0:
        return js_obj__0.call(this);
      default:
        return js_obj__1.cljs$lang$arity$variadic(cljs.core.array_seq(arguments, 0))
    }
    throw"Invalid arity: " + arguments.length;
  };
  js_obj.cljs$lang$maxFixedArity = 0;
  js_obj.cljs$lang$applyTo = js_obj__1.cljs$lang$applyTo;
  js_obj.cljs$lang$arity$0 = js_obj__0;
  js_obj.cljs$lang$arity$variadic = js_obj__1.cljs$lang$arity$variadic;
  return js_obj
}();
cljs.core.js_keys = function js_keys(obj) {
  var keys__6931 = [];
  goog.object.forEach(obj, function(val, key, obj) {
    return keys__6931.push(key)
  });
  return keys__6931
};
cljs.core.js_delete = function js_delete(obj, key) {
  return delete obj[key]
};
cljs.core.array_copy = function array_copy(from, i, to, j, len) {
  var i__6935 = i;
  var j__6936 = j;
  var len__6937 = len;
  while(true) {
    if(len__6937 === 0) {
      return to
    }else {
      to[j__6936] = from[i__6935];
      var G__6938 = i__6935 + 1;
      var G__6939 = j__6936 + 1;
      var G__6940 = len__6937 - 1;
      i__6935 = G__6938;
      j__6936 = G__6939;
      len__6937 = G__6940;
      continue
    }
    break
  }
};
cljs.core.array_copy_downward = function array_copy_downward(from, i, to, j, len) {
  var i__6944 = i + (len - 1);
  var j__6945 = j + (len - 1);
  var len__6946 = len;
  while(true) {
    if(len__6946 === 0) {
      return to
    }else {
      to[j__6945] = from[i__6944];
      var G__6947 = i__6944 - 1;
      var G__6948 = j__6945 - 1;
      var G__6949 = len__6946 - 1;
      i__6944 = G__6947;
      j__6945 = G__6948;
      len__6946 = G__6949;
      continue
    }
    break
  }
};
cljs.core.lookup_sentinel = {};
cljs.core.false_QMARK_ = function false_QMARK_(x) {
  return x === false
};
cljs.core.true_QMARK_ = function true_QMARK_(x) {
  return x === true
};
cljs.core.undefined_QMARK_ = function undefined_QMARK_(x) {
  return void 0 === x
};
cljs.core.seq_QMARK_ = function seq_QMARK_(s) {
  if(s == null) {
    return false
  }else {
    var G__6953__6954 = s;
    if(G__6953__6954) {
      if(function() {
        var or__3943__auto____6955 = G__6953__6954.cljs$lang$protocol_mask$partition0$ & 64;
        if(or__3943__auto____6955) {
          return or__3943__auto____6955
        }else {
          return G__6953__6954.cljs$core$ISeq$
        }
      }()) {
        return true
      }else {
        if(!G__6953__6954.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__6953__6954)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__6953__6954)
    }
  }
};
cljs.core.seqable_QMARK_ = function seqable_QMARK_(s) {
  var G__6959__6960 = s;
  if(G__6959__6960) {
    if(function() {
      var or__3943__auto____6961 = G__6959__6960.cljs$lang$protocol_mask$partition0$ & 8388608;
      if(or__3943__auto____6961) {
        return or__3943__auto____6961
      }else {
        return G__6959__6960.cljs$core$ISeqable$
      }
    }()) {
      return true
    }else {
      if(!G__6959__6960.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__6959__6960)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__6959__6960)
  }
};
cljs.core.boolean$ = function boolean$(x) {
  if(cljs.core.truth_(x)) {
    return true
  }else {
    return false
  }
};
cljs.core.string_QMARK_ = function string_QMARK_(x) {
  var and__3941__auto____6964 = goog.isString(x);
  if(and__3941__auto____6964) {
    return!function() {
      var or__3943__auto____6965 = x.charAt(0) === "\ufdd0";
      if(or__3943__auto____6965) {
        return or__3943__auto____6965
      }else {
        return x.charAt(0) === "\ufdd1"
      }
    }()
  }else {
    return and__3941__auto____6964
  }
};
cljs.core.keyword_QMARK_ = function keyword_QMARK_(x) {
  var and__3941__auto____6967 = goog.isString(x);
  if(and__3941__auto____6967) {
    return x.charAt(0) === "\ufdd0"
  }else {
    return and__3941__auto____6967
  }
};
cljs.core.symbol_QMARK_ = function symbol_QMARK_(x) {
  var and__3941__auto____6969 = goog.isString(x);
  if(and__3941__auto____6969) {
    return x.charAt(0) === "\ufdd1"
  }else {
    return and__3941__auto____6969
  }
};
cljs.core.number_QMARK_ = function number_QMARK_(n) {
  return goog.isNumber(n)
};
cljs.core.fn_QMARK_ = function fn_QMARK_(f) {
  return goog.isFunction(f)
};
cljs.core.ifn_QMARK_ = function ifn_QMARK_(f) {
  var or__3943__auto____6974 = cljs.core.fn_QMARK_.call(null, f);
  if(or__3943__auto____6974) {
    return or__3943__auto____6974
  }else {
    var G__6975__6976 = f;
    if(G__6975__6976) {
      if(function() {
        var or__3943__auto____6977 = G__6975__6976.cljs$lang$protocol_mask$partition0$ & 1;
        if(or__3943__auto____6977) {
          return or__3943__auto____6977
        }else {
          return G__6975__6976.cljs$core$IFn$
        }
      }()) {
        return true
      }else {
        if(!G__6975__6976.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__6975__6976)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__6975__6976)
    }
  }
};
cljs.core.integer_QMARK_ = function integer_QMARK_(n) {
  var and__3941__auto____6979 = cljs.core.number_QMARK_.call(null, n);
  if(and__3941__auto____6979) {
    return n == n.toFixed()
  }else {
    return and__3941__auto____6979
  }
};
cljs.core.contains_QMARK_ = function contains_QMARK_(coll, v) {
  if(cljs.core._lookup.call(null, coll, v, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
    return false
  }else {
    return true
  }
};
cljs.core.find = function find(coll, k) {
  if(cljs.core.truth_(function() {
    var and__3941__auto____6982 = coll;
    if(cljs.core.truth_(and__3941__auto____6982)) {
      var and__3941__auto____6983 = cljs.core.associative_QMARK_.call(null, coll);
      if(and__3941__auto____6983) {
        return cljs.core.contains_QMARK_.call(null, coll, k)
      }else {
        return and__3941__auto____6983
      }
    }else {
      return and__3941__auto____6982
    }
  }())) {
    return cljs.core.PersistentVector.fromArray([k, cljs.core._lookup.call(null, coll, k)], true)
  }else {
    return null
  }
};
cljs.core.distinct_QMARK_ = function() {
  var distinct_QMARK_ = null;
  var distinct_QMARK___1 = function(x) {
    return true
  };
  var distinct_QMARK___2 = function(x, y) {
    return!cljs.core._EQ_.call(null, x, y)
  };
  var distinct_QMARK___3 = function() {
    var G__6992__delegate = function(x, y, more) {
      if(!cljs.core._EQ_.call(null, x, y)) {
        var s__6988 = cljs.core.PersistentHashSet.fromArray([y, x]);
        var xs__6989 = more;
        while(true) {
          var x__6990 = cljs.core.first.call(null, xs__6989);
          var etc__6991 = cljs.core.next.call(null, xs__6989);
          if(cljs.core.truth_(xs__6989)) {
            if(cljs.core.contains_QMARK_.call(null, s__6988, x__6990)) {
              return false
            }else {
              var G__6993 = cljs.core.conj.call(null, s__6988, x__6990);
              var G__6994 = etc__6991;
              s__6988 = G__6993;
              xs__6989 = G__6994;
              continue
            }
          }else {
            return true
          }
          break
        }
      }else {
        return false
      }
    };
    var G__6992 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6992__delegate.call(this, x, y, more)
    };
    G__6992.cljs$lang$maxFixedArity = 2;
    G__6992.cljs$lang$applyTo = function(arglist__6995) {
      var x = cljs.core.first(arglist__6995);
      var y = cljs.core.first(cljs.core.next(arglist__6995));
      var more = cljs.core.rest(cljs.core.next(arglist__6995));
      return G__6992__delegate(x, y, more)
    };
    G__6992.cljs$lang$arity$variadic = G__6992__delegate;
    return G__6992
  }();
  distinct_QMARK_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return distinct_QMARK___1.call(this, x);
      case 2:
        return distinct_QMARK___2.call(this, x, y);
      default:
        return distinct_QMARK___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  distinct_QMARK_.cljs$lang$maxFixedArity = 2;
  distinct_QMARK_.cljs$lang$applyTo = distinct_QMARK___3.cljs$lang$applyTo;
  distinct_QMARK_.cljs$lang$arity$1 = distinct_QMARK___1;
  distinct_QMARK_.cljs$lang$arity$2 = distinct_QMARK___2;
  distinct_QMARK_.cljs$lang$arity$variadic = distinct_QMARK___3.cljs$lang$arity$variadic;
  return distinct_QMARK_
}();
cljs.core.compare = function compare(x, y) {
  if(x === y) {
    return 0
  }else {
    if(x == null) {
      return-1
    }else {
      if(y == null) {
        return 1
      }else {
        if(cljs.core.type.call(null, x) === cljs.core.type.call(null, y)) {
          if(function() {
            var G__6999__7000 = x;
            if(G__6999__7000) {
              if(cljs.core.truth_(function() {
                var or__3943__auto____7001 = null;
                if(cljs.core.truth_(or__3943__auto____7001)) {
                  return or__3943__auto____7001
                }else {
                  return G__6999__7000.cljs$core$IComparable$
                }
              }())) {
                return true
              }else {
                if(!G__6999__7000.cljs$lang$protocol_mask$partition$) {
                  return cljs.core.type_satisfies_.call(null, cljs.core.IComparable, G__6999__7000)
                }else {
                  return false
                }
              }
            }else {
              return cljs.core.type_satisfies_.call(null, cljs.core.IComparable, G__6999__7000)
            }
          }()) {
            return cljs.core._compare.call(null, x, y)
          }else {
            return goog.array.defaultCompare(x, y)
          }
        }else {
          if("\ufdd0'else") {
            throw new Error("compare on non-nil objects of different types");
          }else {
            return null
          }
        }
      }
    }
  }
};
cljs.core.compare_indexed = function() {
  var compare_indexed = null;
  var compare_indexed__2 = function(xs, ys) {
    var xl__7006 = cljs.core.count.call(null, xs);
    var yl__7007 = cljs.core.count.call(null, ys);
    if(xl__7006 < yl__7007) {
      return-1
    }else {
      if(xl__7006 > yl__7007) {
        return 1
      }else {
        if("\ufdd0'else") {
          return compare_indexed.call(null, xs, ys, xl__7006, 0)
        }else {
          return null
        }
      }
    }
  };
  var compare_indexed__4 = function(xs, ys, len, n) {
    while(true) {
      var d__7008 = cljs.core.compare.call(null, cljs.core.nth.call(null, xs, n), cljs.core.nth.call(null, ys, n));
      if(function() {
        var and__3941__auto____7009 = d__7008 === 0;
        if(and__3941__auto____7009) {
          return n + 1 < len
        }else {
          return and__3941__auto____7009
        }
      }()) {
        var G__7010 = xs;
        var G__7011 = ys;
        var G__7012 = len;
        var G__7013 = n + 1;
        xs = G__7010;
        ys = G__7011;
        len = G__7012;
        n = G__7013;
        continue
      }else {
        return d__7008
      }
      break
    }
  };
  compare_indexed = function(xs, ys, len, n) {
    switch(arguments.length) {
      case 2:
        return compare_indexed__2.call(this, xs, ys);
      case 4:
        return compare_indexed__4.call(this, xs, ys, len, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  compare_indexed.cljs$lang$arity$2 = compare_indexed__2;
  compare_indexed.cljs$lang$arity$4 = compare_indexed__4;
  return compare_indexed
}();
cljs.core.fn__GT_comparator = function fn__GT_comparator(f) {
  if(cljs.core._EQ_.call(null, f, cljs.core.compare)) {
    return cljs.core.compare
  }else {
    return function(x, y) {
      var r__7015 = f.call(null, x, y);
      if(cljs.core.number_QMARK_.call(null, r__7015)) {
        return r__7015
      }else {
        if(cljs.core.truth_(r__7015)) {
          return-1
        }else {
          if(cljs.core.truth_(f.call(null, y, x))) {
            return 1
          }else {
            return 0
          }
        }
      }
    }
  }
};
cljs.core.sort = function() {
  var sort = null;
  var sort__1 = function(coll) {
    return sort.call(null, cljs.core.compare, coll)
  };
  var sort__2 = function(comp, coll) {
    if(cljs.core.seq.call(null, coll)) {
      var a__7017 = cljs.core.to_array.call(null, coll);
      goog.array.stableSort(a__7017, cljs.core.fn__GT_comparator.call(null, comp));
      return cljs.core.seq.call(null, a__7017)
    }else {
      return cljs.core.List.EMPTY
    }
  };
  sort = function(comp, coll) {
    switch(arguments.length) {
      case 1:
        return sort__1.call(this, comp);
      case 2:
        return sort__2.call(this, comp, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  sort.cljs$lang$arity$1 = sort__1;
  sort.cljs$lang$arity$2 = sort__2;
  return sort
}();
cljs.core.sort_by = function() {
  var sort_by = null;
  var sort_by__2 = function(keyfn, coll) {
    return sort_by.call(null, keyfn, cljs.core.compare, coll)
  };
  var sort_by__3 = function(keyfn, comp, coll) {
    return cljs.core.sort.call(null, function(x, y) {
      return cljs.core.fn__GT_comparator.call(null, comp).call(null, keyfn.call(null, x), keyfn.call(null, y))
    }, coll)
  };
  sort_by = function(keyfn, comp, coll) {
    switch(arguments.length) {
      case 2:
        return sort_by__2.call(this, keyfn, comp);
      case 3:
        return sort_by__3.call(this, keyfn, comp, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  sort_by.cljs$lang$arity$2 = sort_by__2;
  sort_by.cljs$lang$arity$3 = sort_by__3;
  return sort_by
}();
cljs.core.seq_reduce = function() {
  var seq_reduce = null;
  var seq_reduce__2 = function(f, coll) {
    var temp__4090__auto____7023 = cljs.core.seq.call(null, coll);
    if(temp__4090__auto____7023) {
      var s__7024 = temp__4090__auto____7023;
      return cljs.core.reduce.call(null, f, cljs.core.first.call(null, s__7024), cljs.core.next.call(null, s__7024))
    }else {
      return f.call(null)
    }
  };
  var seq_reduce__3 = function(f, val, coll) {
    var val__7025 = val;
    var coll__7026 = cljs.core.seq.call(null, coll);
    while(true) {
      if(coll__7026) {
        var nval__7027 = f.call(null, val__7025, cljs.core.first.call(null, coll__7026));
        if(cljs.core.reduced_QMARK_.call(null, nval__7027)) {
          return cljs.core.deref.call(null, nval__7027)
        }else {
          var G__7028 = nval__7027;
          var G__7029 = cljs.core.next.call(null, coll__7026);
          val__7025 = G__7028;
          coll__7026 = G__7029;
          continue
        }
      }else {
        return val__7025
      }
      break
    }
  };
  seq_reduce = function(f, val, coll) {
    switch(arguments.length) {
      case 2:
        return seq_reduce__2.call(this, f, val);
      case 3:
        return seq_reduce__3.call(this, f, val, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  seq_reduce.cljs$lang$arity$2 = seq_reduce__2;
  seq_reduce.cljs$lang$arity$3 = seq_reduce__3;
  return seq_reduce
}();
cljs.core.shuffle = function shuffle(coll) {
  var a__7031 = cljs.core.to_array.call(null, coll);
  goog.array.shuffle(a__7031);
  return cljs.core.vec.call(null, a__7031)
};
cljs.core.reduce = function() {
  var reduce = null;
  var reduce__2 = function(f, coll) {
    if(function() {
      var G__7038__7039 = coll;
      if(G__7038__7039) {
        if(function() {
          var or__3943__auto____7040 = G__7038__7039.cljs$lang$protocol_mask$partition0$ & 524288;
          if(or__3943__auto____7040) {
            return or__3943__auto____7040
          }else {
            return G__7038__7039.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__7038__7039.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__7038__7039)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__7038__7039)
      }
    }()) {
      return cljs.core._reduce.call(null, coll, f)
    }else {
      return cljs.core.seq_reduce.call(null, f, coll)
    }
  };
  var reduce__3 = function(f, val, coll) {
    if(function() {
      var G__7041__7042 = coll;
      if(G__7041__7042) {
        if(function() {
          var or__3943__auto____7043 = G__7041__7042.cljs$lang$protocol_mask$partition0$ & 524288;
          if(or__3943__auto____7043) {
            return or__3943__auto____7043
          }else {
            return G__7041__7042.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__7041__7042.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__7041__7042)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__7041__7042)
      }
    }()) {
      return cljs.core._reduce.call(null, coll, f, val)
    }else {
      return cljs.core.seq_reduce.call(null, f, val, coll)
    }
  };
  reduce = function(f, val, coll) {
    switch(arguments.length) {
      case 2:
        return reduce__2.call(this, f, val);
      case 3:
        return reduce__3.call(this, f, val, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  reduce.cljs$lang$arity$2 = reduce__2;
  reduce.cljs$lang$arity$3 = reduce__3;
  return reduce
}();
cljs.core.reduce_kv = function reduce_kv(f, init, coll) {
  return cljs.core._kv_reduce.call(null, coll, f, init)
};
cljs.core.Reduced = function(val) {
  this.val = val;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32768
};
cljs.core.Reduced.cljs$lang$type = true;
cljs.core.Reduced.cljs$lang$ctorPrSeq = function(this__2250__auto__) {
  return cljs.core.list.call(null, "cljs.core/Reduced")
};
cljs.core.Reduced.prototype.cljs$core$IDeref$_deref$arity$1 = function(o) {
  var this__7044 = this;
  return this__7044.val
};
cljs.core.Reduced;
cljs.core.reduced_QMARK_ = function reduced_QMARK_(r) {
  return cljs.core.instance_QMARK_.call(null, cljs.core.Reduced, r)
};
cljs.core.reduced = function reduced(x) {
  return new cljs.core.Reduced(x)
};
cljs.core._PLUS_ = function() {
  var _PLUS_ = null;
  var _PLUS___0 = function() {
    return 0
  };
  var _PLUS___1 = function(x) {
    return x
  };
  var _PLUS___2 = function(x, y) {
    return x + y
  };
  var _PLUS___3 = function() {
    var G__7045__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _PLUS_, x + y, more)
    };
    var G__7045 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7045__delegate.call(this, x, y, more)
    };
    G__7045.cljs$lang$maxFixedArity = 2;
    G__7045.cljs$lang$applyTo = function(arglist__7046) {
      var x = cljs.core.first(arglist__7046);
      var y = cljs.core.first(cljs.core.next(arglist__7046));
      var more = cljs.core.rest(cljs.core.next(arglist__7046));
      return G__7045__delegate(x, y, more)
    };
    G__7045.cljs$lang$arity$variadic = G__7045__delegate;
    return G__7045
  }();
  _PLUS_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return _PLUS___0.call(this);
      case 1:
        return _PLUS___1.call(this, x);
      case 2:
        return _PLUS___2.call(this, x, y);
      default:
        return _PLUS___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _PLUS_.cljs$lang$maxFixedArity = 2;
  _PLUS_.cljs$lang$applyTo = _PLUS___3.cljs$lang$applyTo;
  _PLUS_.cljs$lang$arity$0 = _PLUS___0;
  _PLUS_.cljs$lang$arity$1 = _PLUS___1;
  _PLUS_.cljs$lang$arity$2 = _PLUS___2;
  _PLUS_.cljs$lang$arity$variadic = _PLUS___3.cljs$lang$arity$variadic;
  return _PLUS_
}();
cljs.core._ = function() {
  var _ = null;
  var ___1 = function(x) {
    return-x
  };
  var ___2 = function(x, y) {
    return x - y
  };
  var ___3 = function() {
    var G__7047__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _, x - y, more)
    };
    var G__7047 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7047__delegate.call(this, x, y, more)
    };
    G__7047.cljs$lang$maxFixedArity = 2;
    G__7047.cljs$lang$applyTo = function(arglist__7048) {
      var x = cljs.core.first(arglist__7048);
      var y = cljs.core.first(cljs.core.next(arglist__7048));
      var more = cljs.core.rest(cljs.core.next(arglist__7048));
      return G__7047__delegate(x, y, more)
    };
    G__7047.cljs$lang$arity$variadic = G__7047__delegate;
    return G__7047
  }();
  _ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return ___1.call(this, x);
      case 2:
        return ___2.call(this, x, y);
      default:
        return ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _.cljs$lang$maxFixedArity = 2;
  _.cljs$lang$applyTo = ___3.cljs$lang$applyTo;
  _.cljs$lang$arity$1 = ___1;
  _.cljs$lang$arity$2 = ___2;
  _.cljs$lang$arity$variadic = ___3.cljs$lang$arity$variadic;
  return _
}();
cljs.core._STAR_ = function() {
  var _STAR_ = null;
  var _STAR___0 = function() {
    return 1
  };
  var _STAR___1 = function(x) {
    return x
  };
  var _STAR___2 = function(x, y) {
    return x * y
  };
  var _STAR___3 = function() {
    var G__7049__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _STAR_, x * y, more)
    };
    var G__7049 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7049__delegate.call(this, x, y, more)
    };
    G__7049.cljs$lang$maxFixedArity = 2;
    G__7049.cljs$lang$applyTo = function(arglist__7050) {
      var x = cljs.core.first(arglist__7050);
      var y = cljs.core.first(cljs.core.next(arglist__7050));
      var more = cljs.core.rest(cljs.core.next(arglist__7050));
      return G__7049__delegate(x, y, more)
    };
    G__7049.cljs$lang$arity$variadic = G__7049__delegate;
    return G__7049
  }();
  _STAR_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return _STAR___0.call(this);
      case 1:
        return _STAR___1.call(this, x);
      case 2:
        return _STAR___2.call(this, x, y);
      default:
        return _STAR___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _STAR_.cljs$lang$maxFixedArity = 2;
  _STAR_.cljs$lang$applyTo = _STAR___3.cljs$lang$applyTo;
  _STAR_.cljs$lang$arity$0 = _STAR___0;
  _STAR_.cljs$lang$arity$1 = _STAR___1;
  _STAR_.cljs$lang$arity$2 = _STAR___2;
  _STAR_.cljs$lang$arity$variadic = _STAR___3.cljs$lang$arity$variadic;
  return _STAR_
}();
cljs.core._SLASH_ = function() {
  var _SLASH_ = null;
  var _SLASH___1 = function(x) {
    return _SLASH_.call(null, 1, x)
  };
  var _SLASH___2 = function(x, y) {
    return x / y
  };
  var _SLASH___3 = function() {
    var G__7051__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _SLASH_, _SLASH_.call(null, x, y), more)
    };
    var G__7051 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7051__delegate.call(this, x, y, more)
    };
    G__7051.cljs$lang$maxFixedArity = 2;
    G__7051.cljs$lang$applyTo = function(arglist__7052) {
      var x = cljs.core.first(arglist__7052);
      var y = cljs.core.first(cljs.core.next(arglist__7052));
      var more = cljs.core.rest(cljs.core.next(arglist__7052));
      return G__7051__delegate(x, y, more)
    };
    G__7051.cljs$lang$arity$variadic = G__7051__delegate;
    return G__7051
  }();
  _SLASH_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _SLASH___1.call(this, x);
      case 2:
        return _SLASH___2.call(this, x, y);
      default:
        return _SLASH___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _SLASH_.cljs$lang$maxFixedArity = 2;
  _SLASH_.cljs$lang$applyTo = _SLASH___3.cljs$lang$applyTo;
  _SLASH_.cljs$lang$arity$1 = _SLASH___1;
  _SLASH_.cljs$lang$arity$2 = _SLASH___2;
  _SLASH_.cljs$lang$arity$variadic = _SLASH___3.cljs$lang$arity$variadic;
  return _SLASH_
}();
cljs.core._LT_ = function() {
  var _LT_ = null;
  var _LT___1 = function(x) {
    return true
  };
  var _LT___2 = function(x, y) {
    return x < y
  };
  var _LT___3 = function() {
    var G__7053__delegate = function(x, y, more) {
      while(true) {
        if(x < y) {
          if(cljs.core.next.call(null, more)) {
            var G__7054 = y;
            var G__7055 = cljs.core.first.call(null, more);
            var G__7056 = cljs.core.next.call(null, more);
            x = G__7054;
            y = G__7055;
            more = G__7056;
            continue
          }else {
            return y < cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__7053 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7053__delegate.call(this, x, y, more)
    };
    G__7053.cljs$lang$maxFixedArity = 2;
    G__7053.cljs$lang$applyTo = function(arglist__7057) {
      var x = cljs.core.first(arglist__7057);
      var y = cljs.core.first(cljs.core.next(arglist__7057));
      var more = cljs.core.rest(cljs.core.next(arglist__7057));
      return G__7053__delegate(x, y, more)
    };
    G__7053.cljs$lang$arity$variadic = G__7053__delegate;
    return G__7053
  }();
  _LT_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _LT___1.call(this, x);
      case 2:
        return _LT___2.call(this, x, y);
      default:
        return _LT___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _LT_.cljs$lang$maxFixedArity = 2;
  _LT_.cljs$lang$applyTo = _LT___3.cljs$lang$applyTo;
  _LT_.cljs$lang$arity$1 = _LT___1;
  _LT_.cljs$lang$arity$2 = _LT___2;
  _LT_.cljs$lang$arity$variadic = _LT___3.cljs$lang$arity$variadic;
  return _LT_
}();
cljs.core._LT__EQ_ = function() {
  var _LT__EQ_ = null;
  var _LT__EQ___1 = function(x) {
    return true
  };
  var _LT__EQ___2 = function(x, y) {
    return x <= y
  };
  var _LT__EQ___3 = function() {
    var G__7058__delegate = function(x, y, more) {
      while(true) {
        if(x <= y) {
          if(cljs.core.next.call(null, more)) {
            var G__7059 = y;
            var G__7060 = cljs.core.first.call(null, more);
            var G__7061 = cljs.core.next.call(null, more);
            x = G__7059;
            y = G__7060;
            more = G__7061;
            continue
          }else {
            return y <= cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__7058 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7058__delegate.call(this, x, y, more)
    };
    G__7058.cljs$lang$maxFixedArity = 2;
    G__7058.cljs$lang$applyTo = function(arglist__7062) {
      var x = cljs.core.first(arglist__7062);
      var y = cljs.core.first(cljs.core.next(arglist__7062));
      var more = cljs.core.rest(cljs.core.next(arglist__7062));
      return G__7058__delegate(x, y, more)
    };
    G__7058.cljs$lang$arity$variadic = G__7058__delegate;
    return G__7058
  }();
  _LT__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _LT__EQ___1.call(this, x);
      case 2:
        return _LT__EQ___2.call(this, x, y);
      default:
        return _LT__EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _LT__EQ_.cljs$lang$maxFixedArity = 2;
  _LT__EQ_.cljs$lang$applyTo = _LT__EQ___3.cljs$lang$applyTo;
  _LT__EQ_.cljs$lang$arity$1 = _LT__EQ___1;
  _LT__EQ_.cljs$lang$arity$2 = _LT__EQ___2;
  _LT__EQ_.cljs$lang$arity$variadic = _LT__EQ___3.cljs$lang$arity$variadic;
  return _LT__EQ_
}();
cljs.core._GT_ = function() {
  var _GT_ = null;
  var _GT___1 = function(x) {
    return true
  };
  var _GT___2 = function(x, y) {
    return x > y
  };
  var _GT___3 = function() {
    var G__7063__delegate = function(x, y, more) {
      while(true) {
        if(x > y) {
          if(cljs.core.next.call(null, more)) {
            var G__7064 = y;
            var G__7065 = cljs.core.first.call(null, more);
            var G__7066 = cljs.core.next.call(null, more);
            x = G__7064;
            y = G__7065;
            more = G__7066;
            continue
          }else {
            return y > cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__7063 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7063__delegate.call(this, x, y, more)
    };
    G__7063.cljs$lang$maxFixedArity = 2;
    G__7063.cljs$lang$applyTo = function(arglist__7067) {
      var x = cljs.core.first(arglist__7067);
      var y = cljs.core.first(cljs.core.next(arglist__7067));
      var more = cljs.core.rest(cljs.core.next(arglist__7067));
      return G__7063__delegate(x, y, more)
    };
    G__7063.cljs$lang$arity$variadic = G__7063__delegate;
    return G__7063
  }();
  _GT_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _GT___1.call(this, x);
      case 2:
        return _GT___2.call(this, x, y);
      default:
        return _GT___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _GT_.cljs$lang$maxFixedArity = 2;
  _GT_.cljs$lang$applyTo = _GT___3.cljs$lang$applyTo;
  _GT_.cljs$lang$arity$1 = _GT___1;
  _GT_.cljs$lang$arity$2 = _GT___2;
  _GT_.cljs$lang$arity$variadic = _GT___3.cljs$lang$arity$variadic;
  return _GT_
}();
cljs.core._GT__EQ_ = function() {
  var _GT__EQ_ = null;
  var _GT__EQ___1 = function(x) {
    return true
  };
  var _GT__EQ___2 = function(x, y) {
    return x >= y
  };
  var _GT__EQ___3 = function() {
    var G__7068__delegate = function(x, y, more) {
      while(true) {
        if(x >= y) {
          if(cljs.core.next.call(null, more)) {
            var G__7069 = y;
            var G__7070 = cljs.core.first.call(null, more);
            var G__7071 = cljs.core.next.call(null, more);
            x = G__7069;
            y = G__7070;
            more = G__7071;
            continue
          }else {
            return y >= cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__7068 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7068__delegate.call(this, x, y, more)
    };
    G__7068.cljs$lang$maxFixedArity = 2;
    G__7068.cljs$lang$applyTo = function(arglist__7072) {
      var x = cljs.core.first(arglist__7072);
      var y = cljs.core.first(cljs.core.next(arglist__7072));
      var more = cljs.core.rest(cljs.core.next(arglist__7072));
      return G__7068__delegate(x, y, more)
    };
    G__7068.cljs$lang$arity$variadic = G__7068__delegate;
    return G__7068
  }();
  _GT__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _GT__EQ___1.call(this, x);
      case 2:
        return _GT__EQ___2.call(this, x, y);
      default:
        return _GT__EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _GT__EQ_.cljs$lang$maxFixedArity = 2;
  _GT__EQ_.cljs$lang$applyTo = _GT__EQ___3.cljs$lang$applyTo;
  _GT__EQ_.cljs$lang$arity$1 = _GT__EQ___1;
  _GT__EQ_.cljs$lang$arity$2 = _GT__EQ___2;
  _GT__EQ_.cljs$lang$arity$variadic = _GT__EQ___3.cljs$lang$arity$variadic;
  return _GT__EQ_
}();
cljs.core.dec = function dec(x) {
  return x - 1
};
cljs.core.max = function() {
  var max = null;
  var max__1 = function(x) {
    return x
  };
  var max__2 = function(x, y) {
    return x > y ? x : y
  };
  var max__3 = function() {
    var G__7073__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, max, x > y ? x : y, more)
    };
    var G__7073 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7073__delegate.call(this, x, y, more)
    };
    G__7073.cljs$lang$maxFixedArity = 2;
    G__7073.cljs$lang$applyTo = function(arglist__7074) {
      var x = cljs.core.first(arglist__7074);
      var y = cljs.core.first(cljs.core.next(arglist__7074));
      var more = cljs.core.rest(cljs.core.next(arglist__7074));
      return G__7073__delegate(x, y, more)
    };
    G__7073.cljs$lang$arity$variadic = G__7073__delegate;
    return G__7073
  }();
  max = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return max__1.call(this, x);
      case 2:
        return max__2.call(this, x, y);
      default:
        return max__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  max.cljs$lang$maxFixedArity = 2;
  max.cljs$lang$applyTo = max__3.cljs$lang$applyTo;
  max.cljs$lang$arity$1 = max__1;
  max.cljs$lang$arity$2 = max__2;
  max.cljs$lang$arity$variadic = max__3.cljs$lang$arity$variadic;
  return max
}();
cljs.core.min = function() {
  var min = null;
  var min__1 = function(x) {
    return x
  };
  var min__2 = function(x, y) {
    return x < y ? x : y
  };
  var min__3 = function() {
    var G__7075__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, min, x < y ? x : y, more)
    };
    var G__7075 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7075__delegate.call(this, x, y, more)
    };
    G__7075.cljs$lang$maxFixedArity = 2;
    G__7075.cljs$lang$applyTo = function(arglist__7076) {
      var x = cljs.core.first(arglist__7076);
      var y = cljs.core.first(cljs.core.next(arglist__7076));
      var more = cljs.core.rest(cljs.core.next(arglist__7076));
      return G__7075__delegate(x, y, more)
    };
    G__7075.cljs$lang$arity$variadic = G__7075__delegate;
    return G__7075
  }();
  min = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return min__1.call(this, x);
      case 2:
        return min__2.call(this, x, y);
      default:
        return min__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  min.cljs$lang$maxFixedArity = 2;
  min.cljs$lang$applyTo = min__3.cljs$lang$applyTo;
  min.cljs$lang$arity$1 = min__1;
  min.cljs$lang$arity$2 = min__2;
  min.cljs$lang$arity$variadic = min__3.cljs$lang$arity$variadic;
  return min
}();
cljs.core.fix = function fix(q) {
  if(q >= 0) {
    return Math.floor.call(null, q)
  }else {
    return Math.ceil.call(null, q)
  }
};
cljs.core.int$ = function int$(x) {
  return cljs.core.fix.call(null, x)
};
cljs.core.long$ = function long$(x) {
  return cljs.core.fix.call(null, x)
};
cljs.core.mod = function mod(n, d) {
  return n % d
};
cljs.core.quot = function quot(n, d) {
  var rem__7078 = n % d;
  return cljs.core.fix.call(null, (n - rem__7078) / d)
};
cljs.core.rem = function rem(n, d) {
  var q__7080 = cljs.core.quot.call(null, n, d);
  return n - d * q__7080
};
cljs.core.rand = function() {
  var rand = null;
  var rand__0 = function() {
    return Math.random.call(null)
  };
  var rand__1 = function(n) {
    return n * rand.call(null)
  };
  rand = function(n) {
    switch(arguments.length) {
      case 0:
        return rand__0.call(this);
      case 1:
        return rand__1.call(this, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  rand.cljs$lang$arity$0 = rand__0;
  rand.cljs$lang$arity$1 = rand__1;
  return rand
}();
cljs.core.rand_int = function rand_int(n) {
  return cljs.core.fix.call(null, cljs.core.rand.call(null, n))
};
cljs.core.bit_xor = function bit_xor(x, y) {
  return x ^ y
};
cljs.core.bit_and = function bit_and(x, y) {
  return x & y
};
cljs.core.bit_or = function bit_or(x, y) {
  return x | y
};
cljs.core.bit_and_not = function bit_and_not(x, y) {
  return x & ~y
};
cljs.core.bit_clear = function bit_clear(x, n) {
  return x & ~(1 << n)
};
cljs.core.bit_flip = function bit_flip(x, n) {
  return x ^ 1 << n
};
cljs.core.bit_not = function bit_not(x) {
  return~x
};
cljs.core.bit_set = function bit_set(x, n) {
  return x | 1 << n
};
cljs.core.bit_test = function bit_test(x, n) {
  return(x & 1 << n) != 0
};
cljs.core.bit_shift_left = function bit_shift_left(x, n) {
  return x << n
};
cljs.core.bit_shift_right = function bit_shift_right(x, n) {
  return x >> n
};
cljs.core.bit_shift_right_zero_fill = function bit_shift_right_zero_fill(x, n) {
  return x >>> n
};
cljs.core.bit_count = function bit_count(v) {
  var v__7083 = v - (v >> 1 & 1431655765);
  var v__7084 = (v__7083 & 858993459) + (v__7083 >> 2 & 858993459);
  return(v__7084 + (v__7084 >> 4) & 252645135) * 16843009 >> 24
};
cljs.core._EQ__EQ_ = function() {
  var _EQ__EQ_ = null;
  var _EQ__EQ___1 = function(x) {
    return true
  };
  var _EQ__EQ___2 = function(x, y) {
    return cljs.core._equiv.call(null, x, y)
  };
  var _EQ__EQ___3 = function() {
    var G__7085__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ__EQ_.call(null, x, y))) {
          if(cljs.core.next.call(null, more)) {
            var G__7086 = y;
            var G__7087 = cljs.core.first.call(null, more);
            var G__7088 = cljs.core.next.call(null, more);
            x = G__7086;
            y = G__7087;
            more = G__7088;
            continue
          }else {
            return _EQ__EQ_.call(null, y, cljs.core.first.call(null, more))
          }
        }else {
          return false
        }
        break
      }
    };
    var G__7085 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7085__delegate.call(this, x, y, more)
    };
    G__7085.cljs$lang$maxFixedArity = 2;
    G__7085.cljs$lang$applyTo = function(arglist__7089) {
      var x = cljs.core.first(arglist__7089);
      var y = cljs.core.first(cljs.core.next(arglist__7089));
      var more = cljs.core.rest(cljs.core.next(arglist__7089));
      return G__7085__delegate(x, y, more)
    };
    G__7085.cljs$lang$arity$variadic = G__7085__delegate;
    return G__7085
  }();
  _EQ__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _EQ__EQ___1.call(this, x);
      case 2:
        return _EQ__EQ___2.call(this, x, y);
      default:
        return _EQ__EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _EQ__EQ_.cljs$lang$maxFixedArity = 2;
  _EQ__EQ_.cljs$lang$applyTo = _EQ__EQ___3.cljs$lang$applyTo;
  _EQ__EQ_.cljs$lang$arity$1 = _EQ__EQ___1;
  _EQ__EQ_.cljs$lang$arity$2 = _EQ__EQ___2;
  _EQ__EQ_.cljs$lang$arity$variadic = _EQ__EQ___3.cljs$lang$arity$variadic;
  return _EQ__EQ_
}();
cljs.core.pos_QMARK_ = function pos_QMARK_(n) {
  return n > 0
};
cljs.core.zero_QMARK_ = function zero_QMARK_(n) {
  return n === 0
};
cljs.core.neg_QMARK_ = function neg_QMARK_(x) {
  return x < 0
};
cljs.core.nthnext = function nthnext(coll, n) {
  var n__7093 = n;
  var xs__7094 = cljs.core.seq.call(null, coll);
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3941__auto____7095 = xs__7094;
      if(and__3941__auto____7095) {
        return n__7093 > 0
      }else {
        return and__3941__auto____7095
      }
    }())) {
      var G__7096 = n__7093 - 1;
      var G__7097 = cljs.core.next.call(null, xs__7094);
      n__7093 = G__7096;
      xs__7094 = G__7097;
      continue
    }else {
      return xs__7094
    }
    break
  }
};
cljs.core.str_STAR_ = function() {
  var str_STAR_ = null;
  var str_STAR___0 = function() {
    return""
  };
  var str_STAR___1 = function(x) {
    if(x == null) {
      return""
    }else {
      if("\ufdd0'else") {
        return x.toString()
      }else {
        return null
      }
    }
  };
  var str_STAR___2 = function() {
    var G__7098__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__7099 = sb.append(str_STAR_.call(null, cljs.core.first.call(null, more)));
            var G__7100 = cljs.core.next.call(null, more);
            sb = G__7099;
            more = G__7100;
            continue
          }else {
            return str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str_STAR_.call(null, x)), ys)
    };
    var G__7098 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__7098__delegate.call(this, x, ys)
    };
    G__7098.cljs$lang$maxFixedArity = 1;
    G__7098.cljs$lang$applyTo = function(arglist__7101) {
      var x = cljs.core.first(arglist__7101);
      var ys = cljs.core.rest(arglist__7101);
      return G__7098__delegate(x, ys)
    };
    G__7098.cljs$lang$arity$variadic = G__7098__delegate;
    return G__7098
  }();
  str_STAR_ = function(x, var_args) {
    var ys = var_args;
    switch(arguments.length) {
      case 0:
        return str_STAR___0.call(this);
      case 1:
        return str_STAR___1.call(this, x);
      default:
        return str_STAR___2.cljs$lang$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  str_STAR_.cljs$lang$maxFixedArity = 1;
  str_STAR_.cljs$lang$applyTo = str_STAR___2.cljs$lang$applyTo;
  str_STAR_.cljs$lang$arity$0 = str_STAR___0;
  str_STAR_.cljs$lang$arity$1 = str_STAR___1;
  str_STAR_.cljs$lang$arity$variadic = str_STAR___2.cljs$lang$arity$variadic;
  return str_STAR_
}();
cljs.core.str = function() {
  var str = null;
  var str__0 = function() {
    return""
  };
  var str__1 = function(x) {
    if(cljs.core.symbol_QMARK_.call(null, x)) {
      return x.substring(2, x.length)
    }else {
      if(cljs.core.keyword_QMARK_.call(null, x)) {
        return cljs.core.str_STAR_.call(null, ":", x.substring(2, x.length))
      }else {
        if(x == null) {
          return""
        }else {
          if("\ufdd0'else") {
            return x.toString()
          }else {
            return null
          }
        }
      }
    }
  };
  var str__2 = function() {
    var G__7102__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__7103 = sb.append(str.call(null, cljs.core.first.call(null, more)));
            var G__7104 = cljs.core.next.call(null, more);
            sb = G__7103;
            more = G__7104;
            continue
          }else {
            return cljs.core.str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str.call(null, x)), ys)
    };
    var G__7102 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__7102__delegate.call(this, x, ys)
    };
    G__7102.cljs$lang$maxFixedArity = 1;
    G__7102.cljs$lang$applyTo = function(arglist__7105) {
      var x = cljs.core.first(arglist__7105);
      var ys = cljs.core.rest(arglist__7105);
      return G__7102__delegate(x, ys)
    };
    G__7102.cljs$lang$arity$variadic = G__7102__delegate;
    return G__7102
  }();
  str = function(x, var_args) {
    var ys = var_args;
    switch(arguments.length) {
      case 0:
        return str__0.call(this);
      case 1:
        return str__1.call(this, x);
      default:
        return str__2.cljs$lang$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  str.cljs$lang$maxFixedArity = 1;
  str.cljs$lang$applyTo = str__2.cljs$lang$applyTo;
  str.cljs$lang$arity$0 = str__0;
  str.cljs$lang$arity$1 = str__1;
  str.cljs$lang$arity$variadic = str__2.cljs$lang$arity$variadic;
  return str
}();
cljs.core.subs = function() {
  var subs = null;
  var subs__2 = function(s, start) {
    return s.substring(start)
  };
  var subs__3 = function(s, start, end) {
    return s.substring(start, end)
  };
  subs = function(s, start, end) {
    switch(arguments.length) {
      case 2:
        return subs__2.call(this, s, start);
      case 3:
        return subs__3.call(this, s, start, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  subs.cljs$lang$arity$2 = subs__2;
  subs.cljs$lang$arity$3 = subs__3;
  return subs
}();
cljs.core.format = function() {
  var format__delegate = function(fmt, args) {
    return cljs.core.apply.call(null, goog.string.format, fmt, args)
  };
  var format = function(fmt, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return format__delegate.call(this, fmt, args)
  };
  format.cljs$lang$maxFixedArity = 1;
  format.cljs$lang$applyTo = function(arglist__7106) {
    var fmt = cljs.core.first(arglist__7106);
    var args = cljs.core.rest(arglist__7106);
    return format__delegate(fmt, args)
  };
  format.cljs$lang$arity$variadic = format__delegate;
  return format
}();
cljs.core.symbol = function() {
  var symbol = null;
  var symbol__1 = function(name) {
    if(cljs.core.symbol_QMARK_.call(null, name)) {
      name
    }else {
      if(cljs.core.keyword_QMARK_.call(null, name)) {
        cljs.core.str_STAR_.call(null, "\ufdd1", "'", cljs.core.subs.call(null, name, 2))
      }else {
      }
    }
    return cljs.core.str_STAR_.call(null, "\ufdd1", "'", name)
  };
  var symbol__2 = function(ns, name) {
    return symbol.call(null, cljs.core.str_STAR_.call(null, ns, "/", name))
  };
  symbol = function(ns, name) {
    switch(arguments.length) {
      case 1:
        return symbol__1.call(this, ns);
      case 2:
        return symbol__2.call(this, ns, name)
    }
    throw"Invalid arity: " + arguments.length;
  };
  symbol.cljs$lang$arity$1 = symbol__1;
  symbol.cljs$lang$arity$2 = symbol__2;
  return symbol
}();
cljs.core.keyword = function() {
  var keyword = null;
  var keyword__1 = function(name) {
    if(cljs.core.keyword_QMARK_.call(null, name)) {
      return name
    }else {
      if(cljs.core.symbol_QMARK_.call(null, name)) {
        return cljs.core.str_STAR_.call(null, "\ufdd0", "'", cljs.core.subs.call(null, name, 2))
      }else {
        if("\ufdd0'else") {
          return cljs.core.str_STAR_.call(null, "\ufdd0", "'", name)
        }else {
          return null
        }
      }
    }
  };
  var keyword__2 = function(ns, name) {
    return keyword.call(null, cljs.core.str_STAR_.call(null, ns, "/", name))
  };
  keyword = function(ns, name) {
    switch(arguments.length) {
      case 1:
        return keyword__1.call(this, ns);
      case 2:
        return keyword__2.call(this, ns, name)
    }
    throw"Invalid arity: " + arguments.length;
  };
  keyword.cljs$lang$arity$1 = keyword__1;
  keyword.cljs$lang$arity$2 = keyword__2;
  return keyword
}();
cljs.core.equiv_sequential = function equiv_sequential(x, y) {
  return cljs.core.boolean$.call(null, cljs.core.sequential_QMARK_.call(null, y) ? function() {
    var xs__7109 = cljs.core.seq.call(null, x);
    var ys__7110 = cljs.core.seq.call(null, y);
    while(true) {
      if(xs__7109 == null) {
        return ys__7110 == null
      }else {
        if(ys__7110 == null) {
          return false
        }else {
          if(cljs.core._EQ_.call(null, cljs.core.first.call(null, xs__7109), cljs.core.first.call(null, ys__7110))) {
            var G__7111 = cljs.core.next.call(null, xs__7109);
            var G__7112 = cljs.core.next.call(null, ys__7110);
            xs__7109 = G__7111;
            ys__7110 = G__7112;
            continue
          }else {
            if("\ufdd0'else") {
              return false
            }else {
              return null
            }
          }
        }
      }
      break
    }
  }() : null)
};
cljs.core.hash_combine = function hash_combine(seed, hash) {
  return seed ^ hash + 2654435769 + (seed << 6) + (seed >> 2)
};
cljs.core.hash_coll = function hash_coll(coll) {
  return cljs.core.reduce.call(null, function(p1__7113_SHARP_, p2__7114_SHARP_) {
    return cljs.core.hash_combine.call(null, p1__7113_SHARP_, cljs.core.hash.call(null, p2__7114_SHARP_, false))
  }, cljs.core.hash.call(null, cljs.core.first.call(null, coll), false), cljs.core.next.call(null, coll))
};
cljs.core.hash_imap = function hash_imap(m) {
  var h__7118 = 0;
  var s__7119 = cljs.core.seq.call(null, m);
  while(true) {
    if(s__7119) {
      var e__7120 = cljs.core.first.call(null, s__7119);
      var G__7121 = (h__7118 + (cljs.core.hash.call(null, cljs.core.key.call(null, e__7120)) ^ cljs.core.hash.call(null, cljs.core.val.call(null, e__7120)))) % 4503599627370496;
      var G__7122 = cljs.core.next.call(null, s__7119);
      h__7118 = G__7121;
      s__7119 = G__7122;
      continue
    }else {
      return h__7118
    }
    break
  }
};
cljs.core.hash_iset = function hash_iset(s) {
  var h__7126 = 0;
  var s__7127 = cljs.core.seq.call(null, s);
  while(true) {
    if(s__7127) {
      var e__7128 = cljs.core.first.call(null, s__7127);
      var G__7129 = (h__7126 + cljs.core.hash.call(null, e__7128)) % 4503599627370496;
      var G__7130 = cljs.core.next.call(null, s__7127);
      h__7126 = G__7129;
      s__7127 = G__7130;
      continue
    }else {
      return h__7126
    }
    break
  }
};
cljs.core.extend_object_BANG_ = function extend_object_BANG_(obj, fn_map) {
  var G__7151__7152 = cljs.core.seq.call(null, fn_map);
  if(G__7151__7152) {
    var G__7154__7156 = cljs.core.first.call(null, G__7151__7152);
    var vec__7155__7157 = G__7154__7156;
    var key_name__7158 = cljs.core.nth.call(null, vec__7155__7157, 0, null);
    var f__7159 = cljs.core.nth.call(null, vec__7155__7157, 1, null);
    var G__7151__7160 = G__7151__7152;
    var G__7154__7161 = G__7154__7156;
    var G__7151__7162 = G__7151__7160;
    while(true) {
      var vec__7163__7164 = G__7154__7161;
      var key_name__7165 = cljs.core.nth.call(null, vec__7163__7164, 0, null);
      var f__7166 = cljs.core.nth.call(null, vec__7163__7164, 1, null);
      var G__7151__7167 = G__7151__7162;
      var str_name__7168 = cljs.core.name.call(null, key_name__7165);
      obj[str_name__7168] = f__7166;
      var temp__4092__auto____7169 = cljs.core.next.call(null, G__7151__7167);
      if(temp__4092__auto____7169) {
        var G__7151__7170 = temp__4092__auto____7169;
        var G__7171 = cljs.core.first.call(null, G__7151__7170);
        var G__7172 = G__7151__7170;
        G__7154__7161 = G__7171;
        G__7151__7162 = G__7172;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return obj
};
cljs.core.List = function(meta, first, rest, count, __hash) {
  this.meta = meta;
  this.first = first;
  this.rest = rest;
  this.count = count;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 65413358
};
cljs.core.List.cljs$lang$type = true;
cljs.core.List.cljs$lang$ctorPrSeq = function(this__2250__auto__) {
  return cljs.core.list.call(null, "cljs.core/List")
};
cljs.core.List.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__7173 = this;
  var h__2133__auto____7174 = this__7173.__hash;
  if(!(h__2133__auto____7174 == null)) {
    return h__2133__auto____7174
  }else {
    var h__2133__auto____7175 = cljs.core.hash_coll.call(null, coll);
    this__7173.__hash = h__2133__auto____7175;
    return h__2133__auto____7175
  }
};
cljs.core.List.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__7176 = this;
  if(this__7176.count === 1) {
    return null
  }else {
    return this__7176.rest
  }
};
cljs.core.List.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__7177 = this;
  return new cljs.core.List(this__7177.meta, o, coll, this__7177.count + 1, null)
};
cljs.core.List.prototype.toString = function() {
  var this__7178 = this;
  var this__7179 = this;
  return cljs.core.pr_str.call(null, this__7179)
};
cljs.core.List.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7180 = this;
  return coll
};
cljs.core.List.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__7181 = this;
  return this__7181.count
};
cljs.core.List.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__7182 = this;
  return this__7182.first
};
cljs.core.List.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__7183 = this;
  return coll.cljs$core$ISeq$_rest$arity$1(coll)
};
cljs.core.List.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__7184 = this;
  return this__7184.first
};
cljs.core.List.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__7185 = this;
  if(this__7185.count === 1) {
    return cljs.core.List.EMPTY
  }else {
    return this__7185.rest
  }
};
cljs.core.List.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7186 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.List.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__7187 = this;
  return new cljs.core.List(meta, this__7187.first, this__7187.rest, this__7187.count, this__7187.__hash)
};
cljs.core.List.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7188 = this;
  return this__7188.meta
};
cljs.core.List.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__7189 = this;
  return cljs.core.List.EMPTY
};
cljs.core.List;
cljs.core.EmptyList = function(meta) {
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 65413326
};
cljs.core.EmptyList.cljs$lang$type = true;
cljs.core.EmptyList.cljs$lang$ctorPrSeq = function(this__2250__auto__) {
  return cljs.core.list.call(null, "cljs.core/EmptyList")
};
cljs.core.EmptyList.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__7190 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__7191 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__7192 = this;
  return new cljs.core.List(this__7192.meta, o, null, 1, null)
};
cljs.core.EmptyList.prototype.toString = function() {
  var this__7193 = this;
  var this__7194 = this;
  return cljs.core.pr_str.call(null, this__7194)
};
cljs.core.EmptyList.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7195 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__7196 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__7197 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__7198 = this;
  throw new Error("Can't pop empty list");
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__7199 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__7200 = this;
  return cljs.core.List.EMPTY
};
cljs.core.EmptyList.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7201 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.EmptyList.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__7202 = this;
  return new cljs.core.EmptyList(meta)
};
cljs.core.EmptyList.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7203 = this;
  return this__7203.meta
};
cljs.core.EmptyList.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__7204 = this;
  return coll
};
cljs.core.EmptyList;
cljs.core.List.EMPTY = new cljs.core.EmptyList(null);
cljs.core.reversible_QMARK_ = function reversible_QMARK_(coll) {
  var G__7208__7209 = coll;
  if(G__7208__7209) {
    if(function() {
      var or__3943__auto____7210 = G__7208__7209.cljs$lang$protocol_mask$partition0$ & 134217728;
      if(or__3943__auto____7210) {
        return or__3943__auto____7210
      }else {
        return G__7208__7209.cljs$core$IReversible$
      }
    }()) {
      return true
    }else {
      if(!G__7208__7209.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__7208__7209)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__7208__7209)
  }
};
cljs.core.rseq = function rseq(coll) {
  return cljs.core._rseq.call(null, coll)
};
cljs.core.reverse = function reverse(coll) {
  if(cljs.core.reversible_QMARK_.call(null, coll)) {
    return cljs.core.rseq.call(null, coll)
  }else {
    return cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, coll)
  }
};
cljs.core.list = function() {
  var list = null;
  var list__0 = function() {
    return cljs.core.List.EMPTY
  };
  var list__1 = function(x) {
    return cljs.core.conj.call(null, cljs.core.List.EMPTY, x)
  };
  var list__2 = function(x, y) {
    return cljs.core.conj.call(null, list.call(null, y), x)
  };
  var list__3 = function(x, y, z) {
    return cljs.core.conj.call(null, list.call(null, y, z), x)
  };
  var list__4 = function() {
    var G__7211__delegate = function(x, y, z, items) {
      return cljs.core.conj.call(null, cljs.core.conj.call(null, cljs.core.conj.call(null, cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, cljs.core.reverse.call(null, items)), z), y), x)
    };
    var G__7211 = function(x, y, z, var_args) {
      var items = null;
      if(goog.isDef(var_args)) {
        items = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__7211__delegate.call(this, x, y, z, items)
    };
    G__7211.cljs$lang$maxFixedArity = 3;
    G__7211.cljs$lang$applyTo = function(arglist__7212) {
      var x = cljs.core.first(arglist__7212);
      var y = cljs.core.first(cljs.core.next(arglist__7212));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7212)));
      var items = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7212)));
      return G__7211__delegate(x, y, z, items)
    };
    G__7211.cljs$lang$arity$variadic = G__7211__delegate;
    return G__7211
  }();
  list = function(x, y, z, var_args) {
    var items = var_args;
    switch(arguments.length) {
      case 0:
        return list__0.call(this);
      case 1:
        return list__1.call(this, x);
      case 2:
        return list__2.call(this, x, y);
      case 3:
        return list__3.call(this, x, y, z);
      default:
        return list__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  list.cljs$lang$maxFixedArity = 3;
  list.cljs$lang$applyTo = list__4.cljs$lang$applyTo;
  list.cljs$lang$arity$0 = list__0;
  list.cljs$lang$arity$1 = list__1;
  list.cljs$lang$arity$2 = list__2;
  list.cljs$lang$arity$3 = list__3;
  list.cljs$lang$arity$variadic = list__4.cljs$lang$arity$variadic;
  return list
}();
cljs.core.Cons = function(meta, first, rest, __hash) {
  this.meta = meta;
  this.first = first;
  this.rest = rest;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 65405164
};
cljs.core.Cons.cljs$lang$type = true;
cljs.core.Cons.cljs$lang$ctorPrSeq = function(this__2250__auto__) {
  return cljs.core.list.call(null, "cljs.core/Cons")
};
cljs.core.Cons.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__7213 = this;
  var h__2133__auto____7214 = this__7213.__hash;
  if(!(h__2133__auto____7214 == null)) {
    return h__2133__auto____7214
  }else {
    var h__2133__auto____7215 = cljs.core.hash_coll.call(null, coll);
    this__7213.__hash = h__2133__auto____7215;
    return h__2133__auto____7215
  }
};
cljs.core.Cons.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__7216 = this;
  if(this__7216.rest == null) {
    return null
  }else {
    return cljs.core._seq.call(null, this__7216.rest)
  }
};
cljs.core.Cons.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__7217 = this;
  return new cljs.core.Cons(null, o, coll, this__7217.__hash)
};
cljs.core.Cons.prototype.toString = function() {
  var this__7218 = this;
  var this__7219 = this;
  return cljs.core.pr_str.call(null, this__7219)
};
cljs.core.Cons.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7220 = this;
  return coll
};
cljs.core.Cons.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__7221 = this;
  return this__7221.first
};
cljs.core.Cons.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__7222 = this;
  if(this__7222.rest == null) {
    return cljs.core.List.EMPTY
  }else {
    return this__7222.rest
  }
};
cljs.core.Cons.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7223 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Cons.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__7224 = this;
  return new cljs.core.Cons(meta, this__7224.first, this__7224.rest, this__7224.__hash)
};
cljs.core.Cons.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7225 = this;
  return this__7225.meta
};
cljs.core.Cons.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__7226 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__7226.meta)
};
cljs.core.Cons;
cljs.core.cons = function cons(x, coll) {
  if(function() {
    var or__3943__auto____7231 = coll == null;
    if(or__3943__auto____7231) {
      return or__3943__auto____7231
    }else {
      var G__7232__7233 = coll;
      if(G__7232__7233) {
        if(function() {
          var or__3943__auto____7234 = G__7232__7233.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3943__auto____7234) {
            return or__3943__auto____7234
          }else {
            return G__7232__7233.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__7232__7233.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__7232__7233)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__7232__7233)
      }
    }
  }()) {
    return new cljs.core.Cons(null, x, coll, null)
  }else {
    return new cljs.core.Cons(null, x, cljs.core.seq.call(null, coll), null)
  }
};
cljs.core.list_QMARK_ = function list_QMARK_(x) {
  var G__7238__7239 = x;
  if(G__7238__7239) {
    if(function() {
      var or__3943__auto____7240 = G__7238__7239.cljs$lang$protocol_mask$partition0$ & 33554432;
      if(or__3943__auto____7240) {
        return or__3943__auto____7240
      }else {
        return G__7238__7239.cljs$core$IList$
      }
    }()) {
      return true
    }else {
      if(!G__7238__7239.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__7238__7239)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__7238__7239)
  }
};
cljs.core.IReduce["string"] = true;
cljs.core._reduce["string"] = function() {
  var G__7241 = null;
  var G__7241__2 = function(string, f) {
    return cljs.core.ci_reduce.call(null, string, f)
  };
  var G__7241__3 = function(string, f, start) {
    return cljs.core.ci_reduce.call(null, string, f, start)
  };
  G__7241 = function(string, f, start) {
    switch(arguments.length) {
      case 2:
        return G__7241__2.call(this, string, f);
      case 3:
        return G__7241__3.call(this, string, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7241
}();
cljs.core.ILookup["string"] = true;
cljs.core._lookup["string"] = function() {
  var G__7242 = null;
  var G__7242__2 = function(string, k) {
    return cljs.core._nth.call(null, string, k)
  };
  var G__7242__3 = function(string, k, not_found) {
    return cljs.core._nth.call(null, string, k, not_found)
  };
  G__7242 = function(string, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7242__2.call(this, string, k);
      case 3:
        return G__7242__3.call(this, string, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7242
}();
cljs.core.IIndexed["string"] = true;
cljs.core._nth["string"] = function() {
  var G__7243 = null;
  var G__7243__2 = function(string, n) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return null
    }
  };
  var G__7243__3 = function(string, n, not_found) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return not_found
    }
  };
  G__7243 = function(string, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7243__2.call(this, string, n);
      case 3:
        return G__7243__3.call(this, string, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7243
}();
cljs.core.ICounted["string"] = true;
cljs.core._count["string"] = function(s) {
  return s.length
};
cljs.core.ISeqable["string"] = true;
cljs.core._seq["string"] = function(string) {
  return cljs.core.prim_seq.call(null, string, 0)
};
cljs.core.IHash["string"] = true;
cljs.core._hash["string"] = function(o) {
  return goog.string.hashCode(o)
};
cljs.core.Keyword = function(k) {
  this.k = k;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 1
};
cljs.core.Keyword.cljs$lang$type = true;
cljs.core.Keyword.cljs$lang$ctorPrSeq = function(this__2250__auto__) {
  return cljs.core.list.call(null, "cljs.core/Keyword")
};
cljs.core.Keyword.prototype.call = function() {
  var G__7255 = null;
  var G__7255__2 = function(this_sym7246, coll) {
    var this__7248 = this;
    var this_sym7246__7249 = this;
    var ___7250 = this_sym7246__7249;
    if(coll == null) {
      return null
    }else {
      var strobj__7251 = coll.strobj;
      if(strobj__7251 == null) {
        return cljs.core._lookup.call(null, coll, this__7248.k, null)
      }else {
        return strobj__7251[this__7248.k]
      }
    }
  };
  var G__7255__3 = function(this_sym7247, coll, not_found) {
    var this__7248 = this;
    var this_sym7247__7252 = this;
    var ___7253 = this_sym7247__7252;
    if(coll == null) {
      return not_found
    }else {
      return cljs.core._lookup.call(null, coll, this__7248.k, not_found)
    }
  };
  G__7255 = function(this_sym7247, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7255__2.call(this, this_sym7247, coll);
      case 3:
        return G__7255__3.call(this, this_sym7247, coll, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7255
}();
cljs.core.Keyword.prototype.apply = function(this_sym7244, args7245) {
  var this__7254 = this;
  return this_sym7244.call.apply(this_sym7244, [this_sym7244].concat(args7245.slice()))
};
cljs.core.Keyword;
String.prototype.cljs$core$IFn$ = true;
String.prototype.call = function() {
  var G__7264 = null;
  var G__7264__2 = function(this_sym7258, coll) {
    var this_sym7258__7260 = this;
    var this__7261 = this_sym7258__7260;
    return cljs.core._lookup.call(null, coll, this__7261.toString(), null)
  };
  var G__7264__3 = function(this_sym7259, coll, not_found) {
    var this_sym7259__7262 = this;
    var this__7263 = this_sym7259__7262;
    return cljs.core._lookup.call(null, coll, this__7263.toString(), not_found)
  };
  G__7264 = function(this_sym7259, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7264__2.call(this, this_sym7259, coll);
      case 3:
        return G__7264__3.call(this, this_sym7259, coll, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7264
}();
String.prototype.apply = function(this_sym7256, args7257) {
  return this_sym7256.call.apply(this_sym7256, [this_sym7256].concat(args7257.slice()))
};
String.prototype.apply = function(s, args) {
  if(cljs.core.count.call(null, args) < 2) {
    return cljs.core._lookup.call(null, args[0], s, null)
  }else {
    return cljs.core._lookup.call(null, args[0], s, args[1])
  }
};
cljs.core.lazy_seq_value = function lazy_seq_value(lazy_seq) {
  var x__7266 = lazy_seq.x;
  if(lazy_seq.realized) {
    return x__7266
  }else {
    lazy_seq.x = x__7266.call(null);
    lazy_seq.realized = true;
    return lazy_seq.x
  }
};
cljs.core.LazySeq = function(meta, realized, x, __hash) {
  this.meta = meta;
  this.realized = realized;
  this.x = x;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850700
};
cljs.core.LazySeq.cljs$lang$type = true;
cljs.core.LazySeq.cljs$lang$ctorPrSeq = function(this__2250__auto__) {
  return cljs.core.list.call(null, "cljs.core/LazySeq")
};
cljs.core.LazySeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__7267 = this;
  var h__2133__auto____7268 = this__7267.__hash;
  if(!(h__2133__auto____7268 == null)) {
    return h__2133__auto____7268
  }else {
    var h__2133__auto____7269 = cljs.core.hash_coll.call(null, coll);
    this__7267.__hash = h__2133__auto____7269;
    return h__2133__auto____7269
  }
};
cljs.core.LazySeq.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__7270 = this;
  return cljs.core._seq.call(null, coll.cljs$core$ISeq$_rest$arity$1(coll))
};
cljs.core.LazySeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__7271 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.LazySeq.prototype.toString = function() {
  var this__7272 = this;
  var this__7273 = this;
  return cljs.core.pr_str.call(null, this__7273)
};
cljs.core.LazySeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7274 = this;
  return cljs.core.seq.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__7275 = this;
  return cljs.core.first.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__7276 = this;
  return cljs.core.rest.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7277 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.LazySeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__7278 = this;
  return new cljs.core.LazySeq(meta, this__7278.realized, this__7278.x, this__7278.__hash)
};
cljs.core.LazySeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7279 = this;
  return this__7279.meta
};
cljs.core.LazySeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__7280 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__7280.meta)
};
cljs.core.LazySeq;
cljs.core.ChunkBuffer = function(buf, end) {
  this.buf = buf;
  this.end = end;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2
};
cljs.core.ChunkBuffer.cljs$lang$type = true;
cljs.core.ChunkBuffer.cljs$lang$ctorPrSeq = function(this__2250__auto__) {
  return cljs.core.list.call(null, "cljs.core/ChunkBuffer")
};
cljs.core.ChunkBuffer.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__7281 = this;
  return this__7281.end
};
cljs.core.ChunkBuffer.prototype.add = function(o) {
  var this__7282 = this;
  var ___7283 = this;
  this__7282.buf[this__7282.end] = o;
  return this__7282.end = this__7282.end + 1
};
cljs.core.ChunkBuffer.prototype.chunk = function(o) {
  var this__7284 = this;
  var ___7285 = this;
  var ret__7286 = new cljs.core.ArrayChunk(this__7284.buf, 0, this__7284.end);
  this__7284.buf = null;
  return ret__7286
};
cljs.core.ChunkBuffer;
cljs.core.chunk_buffer = function chunk_buffer(capacity) {
  return new cljs.core.ChunkBuffer(cljs.core.make_array.call(null, capacity), 0)
};
cljs.core.ArrayChunk = function(arr, off, end) {
  this.arr = arr;
  this.off = off;
  this.end = end;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 524306
};
cljs.core.ArrayChunk.cljs$lang$type = true;
cljs.core.ArrayChunk.cljs$lang$ctorPrSeq = function(this__2250__auto__) {
  return cljs.core.list.call(null, "cljs.core/ArrayChunk")
};
cljs.core.ArrayChunk.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__7287 = this;
  return cljs.core.ci_reduce.call(null, coll, f, this__7287.arr[this__7287.off], this__7287.off + 1)
};
cljs.core.ArrayChunk.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__7288 = this;
  return cljs.core.ci_reduce.call(null, coll, f, start, this__7288.off)
};
cljs.core.ArrayChunk.prototype.cljs$core$IChunk$ = true;
cljs.core.ArrayChunk.prototype.cljs$core$IChunk$_drop_first$arity$1 = function(coll) {
  var this__7289 = this;
  if(this__7289.off === this__7289.end) {
    throw new Error("-drop-first of empty chunk");
  }else {
    return new cljs.core.ArrayChunk(this__7289.arr, this__7289.off + 1, this__7289.end)
  }
};
cljs.core.ArrayChunk.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, i) {
  var this__7290 = this;
  return this__7290.arr[this__7290.off + i]
};
cljs.core.ArrayChunk.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, i, not_found) {
  var this__7291 = this;
  if(function() {
    var and__3941__auto____7292 = i >= 0;
    if(and__3941__auto____7292) {
      return i < this__7291.end - this__7291.off
    }else {
      return and__3941__auto____7292
    }
  }()) {
    return this__7291.arr[this__7291.off + i]
  }else {
    return not_found
  }
};
cljs.core.ArrayChunk.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__7293 = this;
  return this__7293.end - this__7293.off
};
cljs.core.ArrayChunk;
cljs.core.array_chunk = function() {
  var array_chunk = null;
  var array_chunk__1 = function(arr) {
    return array_chunk.call(null, arr, 0, arr.length)
  };
  var array_chunk__2 = function(arr, off) {
    return array_chunk.call(null, arr, off, arr.length)
  };
  var array_chunk__3 = function(arr, off, end) {
    return new cljs.core.ArrayChunk(arr, off, end)
  };
  array_chunk = function(arr, off, end) {
    switch(arguments.length) {
      case 1:
        return array_chunk__1.call(this, arr);
      case 2:
        return array_chunk__2.call(this, arr, off);
      case 3:
        return array_chunk__3.call(this, arr, off, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  array_chunk.cljs$lang$arity$1 = array_chunk__1;
  array_chunk.cljs$lang$arity$2 = array_chunk__2;
  array_chunk.cljs$lang$arity$3 = array_chunk__3;
  return array_chunk
}();
cljs.core.ChunkedCons = function(chunk, more, meta) {
  this.chunk = chunk;
  this.more = more;
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 27656296
};
cljs.core.ChunkedCons.cljs$lang$type = true;
cljs.core.ChunkedCons.cljs$lang$ctorPrSeq = function(this__2250__auto__) {
  return cljs.core.list.call(null, "cljs.core/ChunkedCons")
};
cljs.core.ChunkedCons.prototype.cljs$core$ICollection$_conj$arity$2 = function(this$, o) {
  var this__7294 = this;
  return cljs.core.cons.call(null, o, this$)
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7295 = this;
  return coll
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__7296 = this;
  return cljs.core._nth.call(null, this__7296.chunk, 0)
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__7297 = this;
  if(cljs.core._count.call(null, this__7297.chunk) > 1) {
    return new cljs.core.ChunkedCons(cljs.core._drop_first.call(null, this__7297.chunk), this__7297.more, this__7297.meta)
  }else {
    if(this__7297.more == null) {
      return cljs.core.List.EMPTY
    }else {
      return this__7297.more
    }
  }
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedNext$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedNext$_chunked_next$arity$1 = function(coll) {
  var this__7298 = this;
  if(this__7298.more == null) {
    return null
  }else {
    return this__7298.more
  }
};
cljs.core.ChunkedCons.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7299 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ChunkedCons.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, m) {
  var this__7300 = this;
  return new cljs.core.ChunkedCons(this__7300.chunk, this__7300.more, m)
};
cljs.core.ChunkedCons.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7301 = this;
  return this__7301.meta
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$_chunked_first$arity$1 = function(coll) {
  var this__7302 = this;
  return this__7302.chunk
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$_chunked_rest$arity$1 = function(coll) {
  var this__7303 = this;
  if(this__7303.more == null) {
    return cljs.core.List.EMPTY
  }else {
    return this__7303.more
  }
};
cljs.core.ChunkedCons;
cljs.core.chunk_cons = function chunk_cons(chunk, rest) {
  if(cljs.core._count.call(null, chunk) === 0) {
    return rest
  }else {
    return new cljs.core.ChunkedCons(chunk, rest, null)
  }
};
cljs.core.chunk_append = function chunk_append(b, x) {
  return b.add(x)
};
cljs.core.chunk = function chunk(b) {
  return b.chunk()
};
cljs.core.chunk_first = function chunk_first(s) {
  return cljs.core._chunked_first.call(null, s)
};
cljs.core.chunk_rest = function chunk_rest(s) {
  return cljs.core._chunked_rest.call(null, s)
};
cljs.core.chunk_next = function chunk_next(s) {
  if(function() {
    var G__7307__7308 = s;
    if(G__7307__7308) {
      if(cljs.core.truth_(function() {
        var or__3943__auto____7309 = null;
        if(cljs.core.truth_(or__3943__auto____7309)) {
          return or__3943__auto____7309
        }else {
          return G__7307__7308.cljs$core$IChunkedNext$
        }
      }())) {
        return true
      }else {
        if(!G__7307__7308.cljs$lang$protocol_mask$partition$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedNext, G__7307__7308)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedNext, G__7307__7308)
    }
  }()) {
    return cljs.core._chunked_next.call(null, s)
  }else {
    return cljs.core.seq.call(null, cljs.core._chunked_rest.call(null, s))
  }
};
cljs.core.to_array = function to_array(s) {
  var ary__7312 = [];
  var s__7313 = s;
  while(true) {
    if(cljs.core.seq.call(null, s__7313)) {
      ary__7312.push(cljs.core.first.call(null, s__7313));
      var G__7314 = cljs.core.next.call(null, s__7313);
      s__7313 = G__7314;
      continue
    }else {
      return ary__7312
    }
    break
  }
};
cljs.core.to_array_2d = function to_array_2d(coll) {
  var ret__7318 = cljs.core.make_array.call(null, cljs.core.count.call(null, coll));
  var i__7319 = 0;
  var xs__7320 = cljs.core.seq.call(null, coll);
  while(true) {
    if(xs__7320) {
      ret__7318[i__7319] = cljs.core.to_array.call(null, cljs.core.first.call(null, xs__7320));
      var G__7321 = i__7319 + 1;
      var G__7322 = cljs.core.next.call(null, xs__7320);
      i__7319 = G__7321;
      xs__7320 = G__7322;
      continue
    }else {
    }
    break
  }
  return ret__7318
};
cljs.core.long_array = function() {
  var long_array = null;
  var long_array__1 = function(size_or_seq) {
    if(cljs.core.number_QMARK_.call(null, size_or_seq)) {
      return long_array.call(null, size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_.call(null, size_or_seq)) {
        return cljs.core.into_array.call(null, size_or_seq)
      }else {
        if("\ufdd0'else") {
          throw new Error("long-array called with something other than size or ISeq");
        }else {
          return null
        }
      }
    }
  };
  var long_array__2 = function(size, init_val_or_seq) {
    var a__7330 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__7331 = cljs.core.seq.call(null, init_val_or_seq);
      var i__7332 = 0;
      var s__7333 = s__7331;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3941__auto____7334 = s__7333;
          if(and__3941__auto____7334) {
            return i__7332 < size
          }else {
            return and__3941__auto____7334
          }
        }())) {
          a__7330[i__7332] = cljs.core.first.call(null, s__7333);
          var G__7337 = i__7332 + 1;
          var G__7338 = cljs.core.next.call(null, s__7333);
          i__7332 = G__7337;
          s__7333 = G__7338;
          continue
        }else {
          return a__7330
        }
        break
      }
    }else {
      var n__2468__auto____7335 = size;
      var i__7336 = 0;
      while(true) {
        if(i__7336 < n__2468__auto____7335) {
          a__7330[i__7336] = init_val_or_seq;
          var G__7339 = i__7336 + 1;
          i__7336 = G__7339;
          continue
        }else {
        }
        break
      }
      return a__7330
    }
  };
  long_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return long_array__1.call(this, size);
      case 2:
        return long_array__2.call(this, size, init_val_or_seq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  long_array.cljs$lang$arity$1 = long_array__1;
  long_array.cljs$lang$arity$2 = long_array__2;
  return long_array
}();
cljs.core.double_array = function() {
  var double_array = null;
  var double_array__1 = function(size_or_seq) {
    if(cljs.core.number_QMARK_.call(null, size_or_seq)) {
      return double_array.call(null, size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_.call(null, size_or_seq)) {
        return cljs.core.into_array.call(null, size_or_seq)
      }else {
        if("\ufdd0'else") {
          throw new Error("double-array called with something other than size or ISeq");
        }else {
          return null
        }
      }
    }
  };
  var double_array__2 = function(size, init_val_or_seq) {
    var a__7347 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__7348 = cljs.core.seq.call(null, init_val_or_seq);
      var i__7349 = 0;
      var s__7350 = s__7348;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3941__auto____7351 = s__7350;
          if(and__3941__auto____7351) {
            return i__7349 < size
          }else {
            return and__3941__auto____7351
          }
        }())) {
          a__7347[i__7349] = cljs.core.first.call(null, s__7350);
          var G__7354 = i__7349 + 1;
          var G__7355 = cljs.core.next.call(null, s__7350);
          i__7349 = G__7354;
          s__7350 = G__7355;
          continue
        }else {
          return a__7347
        }
        break
      }
    }else {
      var n__2468__auto____7352 = size;
      var i__7353 = 0;
      while(true) {
        if(i__7353 < n__2468__auto____7352) {
          a__7347[i__7353] = init_val_or_seq;
          var G__7356 = i__7353 + 1;
          i__7353 = G__7356;
          continue
        }else {
        }
        break
      }
      return a__7347
    }
  };
  double_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return double_array__1.call(this, size);
      case 2:
        return double_array__2.call(this, size, init_val_or_seq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  double_array.cljs$lang$arity$1 = double_array__1;
  double_array.cljs$lang$arity$2 = double_array__2;
  return double_array
}();
cljs.core.object_array = function() {
  var object_array = null;
  var object_array__1 = function(size_or_seq) {
    if(cljs.core.number_QMARK_.call(null, size_or_seq)) {
      return object_array.call(null, size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_.call(null, size_or_seq)) {
        return cljs.core.into_array.call(null, size_or_seq)
      }else {
        if("\ufdd0'else") {
          throw new Error("object-array called with something other than size or ISeq");
        }else {
          return null
        }
      }
    }
  };
  var object_array__2 = function(size, init_val_or_seq) {
    var a__7364 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__7365 = cljs.core.seq.call(null, init_val_or_seq);
      var i__7366 = 0;
      var s__7367 = s__7365;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3941__auto____7368 = s__7367;
          if(and__3941__auto____7368) {
            return i__7366 < size
          }else {
            return and__3941__auto____7368
          }
        }())) {
          a__7364[i__7366] = cljs.core.first.call(null, s__7367);
          var G__7371 = i__7366 + 1;
          var G__7372 = cljs.core.next.call(null, s__7367);
          i__7366 = G__7371;
          s__7367 = G__7372;
          continue
        }else {
          return a__7364
        }
        break
      }
    }else {
      var n__2468__auto____7369 = size;
      var i__7370 = 0;
      while(true) {
        if(i__7370 < n__2468__auto____7369) {
          a__7364[i__7370] = init_val_or_seq;
          var G__7373 = i__7370 + 1;
          i__7370 = G__7373;
          continue
        }else {
        }
        break
      }
      return a__7364
    }
  };
  object_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return object_array__1.call(this, size);
      case 2:
        return object_array__2.call(this, size, init_val_or_seq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  object_array.cljs$lang$arity$1 = object_array__1;
  object_array.cljs$lang$arity$2 = object_array__2;
  return object_array
}();
cljs.core.bounded_count = function bounded_count(s, n) {
  if(cljs.core.counted_QMARK_.call(null, s)) {
    return cljs.core.count.call(null, s)
  }else {
    var s__7378 = s;
    var i__7379 = n;
    var sum__7380 = 0;
    while(true) {
      if(cljs.core.truth_(function() {
        var and__3941__auto____7381 = i__7379 > 0;
        if(and__3941__auto____7381) {
          return cljs.core.seq.call(null, s__7378)
        }else {
          return and__3941__auto____7381
        }
      }())) {
        var G__7382 = cljs.core.next.call(null, s__7378);
        var G__7383 = i__7379 - 1;
        var G__7384 = sum__7380 + 1;
        s__7378 = G__7382;
        i__7379 = G__7383;
        sum__7380 = G__7384;
        continue
      }else {
        return sum__7380
      }
      break
    }
  }
};
cljs.core.spread = function spread(arglist) {
  if(arglist == null) {
    return null
  }else {
    if(cljs.core.next.call(null, arglist) == null) {
      return cljs.core.seq.call(null, cljs.core.first.call(null, arglist))
    }else {
      if("\ufdd0'else") {
        return cljs.core.cons.call(null, cljs.core.first.call(null, arglist), spread.call(null, cljs.core.next.call(null, arglist)))
      }else {
        return null
      }
    }
  }
};
cljs.core.concat = function() {
  var concat = null;
  var concat__0 = function() {
    return new cljs.core.LazySeq(null, false, function() {
      return null
    }, null)
  };
  var concat__1 = function(x) {
    return new cljs.core.LazySeq(null, false, function() {
      return x
    }, null)
  };
  var concat__2 = function(x, y) {
    return new cljs.core.LazySeq(null, false, function() {
      var s__7389 = cljs.core.seq.call(null, x);
      if(s__7389) {
        if(cljs.core.chunked_seq_QMARK_.call(null, s__7389)) {
          return cljs.core.chunk_cons.call(null, cljs.core.chunk_first.call(null, s__7389), concat.call(null, cljs.core.chunk_rest.call(null, s__7389), y))
        }else {
          return cljs.core.cons.call(null, cljs.core.first.call(null, s__7389), concat.call(null, cljs.core.rest.call(null, s__7389), y))
        }
      }else {
        return y
      }
    }, null)
  };
  var concat__3 = function() {
    var G__7393__delegate = function(x, y, zs) {
      var cat__7392 = function cat(xys, zs) {
        return new cljs.core.LazySeq(null, false, function() {
          var xys__7391 = cljs.core.seq.call(null, xys);
          if(xys__7391) {
            if(cljs.core.chunked_seq_QMARK_.call(null, xys__7391)) {
              return cljs.core.chunk_cons.call(null, cljs.core.chunk_first.call(null, xys__7391), cat.call(null, cljs.core.chunk_rest.call(null, xys__7391), zs))
            }else {
              return cljs.core.cons.call(null, cljs.core.first.call(null, xys__7391), cat.call(null, cljs.core.rest.call(null, xys__7391), zs))
            }
          }else {
            if(cljs.core.truth_(zs)) {
              return cat.call(null, cljs.core.first.call(null, zs), cljs.core.next.call(null, zs))
            }else {
              return null
            }
          }
        }, null)
      };
      return cat__7392.call(null, concat.call(null, x, y), zs)
    };
    var G__7393 = function(x, y, var_args) {
      var zs = null;
      if(goog.isDef(var_args)) {
        zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7393__delegate.call(this, x, y, zs)
    };
    G__7393.cljs$lang$maxFixedArity = 2;
    G__7393.cljs$lang$applyTo = function(arglist__7394) {
      var x = cljs.core.first(arglist__7394);
      var y = cljs.core.first(cljs.core.next(arglist__7394));
      var zs = cljs.core.rest(cljs.core.next(arglist__7394));
      return G__7393__delegate(x, y, zs)
    };
    G__7393.cljs$lang$arity$variadic = G__7393__delegate;
    return G__7393
  }();
  concat = function(x, y, var_args) {
    var zs = var_args;
    switch(arguments.length) {
      case 0:
        return concat__0.call(this);
      case 1:
        return concat__1.call(this, x);
      case 2:
        return concat__2.call(this, x, y);
      default:
        return concat__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  concat.cljs$lang$maxFixedArity = 2;
  concat.cljs$lang$applyTo = concat__3.cljs$lang$applyTo;
  concat.cljs$lang$arity$0 = concat__0;
  concat.cljs$lang$arity$1 = concat__1;
  concat.cljs$lang$arity$2 = concat__2;
  concat.cljs$lang$arity$variadic = concat__3.cljs$lang$arity$variadic;
  return concat
}();
cljs.core.list_STAR_ = function() {
  var list_STAR_ = null;
  var list_STAR___1 = function(args) {
    return cljs.core.seq.call(null, args)
  };
  var list_STAR___2 = function(a, args) {
    return cljs.core.cons.call(null, a, args)
  };
  var list_STAR___3 = function(a, b, args) {
    return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, args))
  };
  var list_STAR___4 = function(a, b, c, args) {
    return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, args)))
  };
  var list_STAR___5 = function() {
    var G__7395__delegate = function(a, b, c, d, more) {
      return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, more)))))
    };
    var G__7395 = function(a, b, c, d, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__7395__delegate.call(this, a, b, c, d, more)
    };
    G__7395.cljs$lang$maxFixedArity = 4;
    G__7395.cljs$lang$applyTo = function(arglist__7396) {
      var a = cljs.core.first(arglist__7396);
      var b = cljs.core.first(cljs.core.next(arglist__7396));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7396)));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7396))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7396))));
      return G__7395__delegate(a, b, c, d, more)
    };
    G__7395.cljs$lang$arity$variadic = G__7395__delegate;
    return G__7395
  }();
  list_STAR_ = function(a, b, c, d, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return list_STAR___1.call(this, a);
      case 2:
        return list_STAR___2.call(this, a, b);
      case 3:
        return list_STAR___3.call(this, a, b, c);
      case 4:
        return list_STAR___4.call(this, a, b, c, d);
      default:
        return list_STAR___5.cljs$lang$arity$variadic(a, b, c, d, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  list_STAR_.cljs$lang$maxFixedArity = 4;
  list_STAR_.cljs$lang$applyTo = list_STAR___5.cljs$lang$applyTo;
  list_STAR_.cljs$lang$arity$1 = list_STAR___1;
  list_STAR_.cljs$lang$arity$2 = list_STAR___2;
  list_STAR_.cljs$lang$arity$3 = list_STAR___3;
  list_STAR_.cljs$lang$arity$4 = list_STAR___4;
  list_STAR_.cljs$lang$arity$variadic = list_STAR___5.cljs$lang$arity$variadic;
  return list_STAR_
}();
cljs.core.transient$ = function transient$(coll) {
  return cljs.core._as_transient.call(null, coll)
};
cljs.core.persistent_BANG_ = function persistent_BANG_(tcoll) {
  return cljs.core._persistent_BANG_.call(null, tcoll)
};
cljs.core.conj_BANG_ = function conj_BANG_(tcoll, val) {
  return cljs.core._conj_BANG_.call(null, tcoll, val)
};
cljs.core.assoc_BANG_ = function assoc_BANG_(tcoll, key, val) {
  return cljs.core._assoc_BANG_.call(null, tcoll, key, val)
};
cljs.core.dissoc_BANG_ = function dissoc_BANG_(tcoll, key) {
  return cljs.core._dissoc_BANG_.call(null, tcoll, key)
};
cljs.core.pop_BANG_ = function pop_BANG_(tcoll) {
  return cljs.core._pop_BANG_.call(null, tcoll)
};
cljs.core.disj_BANG_ = function disj_BANG_(tcoll, val) {
  return cljs.core._disjoin_BANG_.call(null, tcoll, val)
};
cljs.core.apply_to = function apply_to(f, argc, args) {
  var args__7438 = cljs.core.seq.call(null, args);
  if(argc === 0) {
    return f.call(null)
  }else {
    var a__7439 = cljs.core._first.call(null, args__7438);
    var args__7440 = cljs.core._rest.call(null, args__7438);
    if(argc === 1) {
      if(f.cljs$lang$arity$1) {
        return f.cljs$lang$arity$1(a__7439)
      }else {
        return f.call(null, a__7439)
      }
    }else {
      var b__7441 = cljs.core._first.call(null, args__7440);
      var args__7442 = cljs.core._rest.call(null, args__7440);
      if(argc === 2) {
        if(f.cljs$lang$arity$2) {
          return f.cljs$lang$arity$2(a__7439, b__7441)
        }else {
          return f.call(null, a__7439, b__7441)
        }
      }else {
        var c__7443 = cljs.core._first.call(null, args__7442);
        var args__7444 = cljs.core._rest.call(null, args__7442);
        if(argc === 3) {
          if(f.cljs$lang$arity$3) {
            return f.cljs$lang$arity$3(a__7439, b__7441, c__7443)
          }else {
            return f.call(null, a__7439, b__7441, c__7443)
          }
        }else {
          var d__7445 = cljs.core._first.call(null, args__7444);
          var args__7446 = cljs.core._rest.call(null, args__7444);
          if(argc === 4) {
            if(f.cljs$lang$arity$4) {
              return f.cljs$lang$arity$4(a__7439, b__7441, c__7443, d__7445)
            }else {
              return f.call(null, a__7439, b__7441, c__7443, d__7445)
            }
          }else {
            var e__7447 = cljs.core._first.call(null, args__7446);
            var args__7448 = cljs.core._rest.call(null, args__7446);
            if(argc === 5) {
              if(f.cljs$lang$arity$5) {
                return f.cljs$lang$arity$5(a__7439, b__7441, c__7443, d__7445, e__7447)
              }else {
                return f.call(null, a__7439, b__7441, c__7443, d__7445, e__7447)
              }
            }else {
              var f__7449 = cljs.core._first.call(null, args__7448);
              var args__7450 = cljs.core._rest.call(null, args__7448);
              if(argc === 6) {
                if(f__7449.cljs$lang$arity$6) {
                  return f__7449.cljs$lang$arity$6(a__7439, b__7441, c__7443, d__7445, e__7447, f__7449)
                }else {
                  return f__7449.call(null, a__7439, b__7441, c__7443, d__7445, e__7447, f__7449)
                }
              }else {
                var g__7451 = cljs.core._first.call(null, args__7450);
                var args__7452 = cljs.core._rest.call(null, args__7450);
                if(argc === 7) {
                  if(f__7449.cljs$lang$arity$7) {
                    return f__7449.cljs$lang$arity$7(a__7439, b__7441, c__7443, d__7445, e__7447, f__7449, g__7451)
                  }else {
                    return f__7449.call(null, a__7439, b__7441, c__7443, d__7445, e__7447, f__7449, g__7451)
                  }
                }else {
                  var h__7453 = cljs.core._first.call(null, args__7452);
                  var args__7454 = cljs.core._rest.call(null, args__7452);
                  if(argc === 8) {
                    if(f__7449.cljs$lang$arity$8) {
                      return f__7449.cljs$lang$arity$8(a__7439, b__7441, c__7443, d__7445, e__7447, f__7449, g__7451, h__7453)
                    }else {
                      return f__7449.call(null, a__7439, b__7441, c__7443, d__7445, e__7447, f__7449, g__7451, h__7453)
                    }
                  }else {
                    var i__7455 = cljs.core._first.call(null, args__7454);
                    var args__7456 = cljs.core._rest.call(null, args__7454);
                    if(argc === 9) {
                      if(f__7449.cljs$lang$arity$9) {
                        return f__7449.cljs$lang$arity$9(a__7439, b__7441, c__7443, d__7445, e__7447, f__7449, g__7451, h__7453, i__7455)
                      }else {
                        return f__7449.call(null, a__7439, b__7441, c__7443, d__7445, e__7447, f__7449, g__7451, h__7453, i__7455)
                      }
                    }else {
                      var j__7457 = cljs.core._first.call(null, args__7456);
                      var args__7458 = cljs.core._rest.call(null, args__7456);
                      if(argc === 10) {
                        if(f__7449.cljs$lang$arity$10) {
                          return f__7449.cljs$lang$arity$10(a__7439, b__7441, c__7443, d__7445, e__7447, f__7449, g__7451, h__7453, i__7455, j__7457)
                        }else {
                          return f__7449.call(null, a__7439, b__7441, c__7443, d__7445, e__7447, f__7449, g__7451, h__7453, i__7455, j__7457)
                        }
                      }else {
                        var k__7459 = cljs.core._first.call(null, args__7458);
                        var args__7460 = cljs.core._rest.call(null, args__7458);
                        if(argc === 11) {
                          if(f__7449.cljs$lang$arity$11) {
                            return f__7449.cljs$lang$arity$11(a__7439, b__7441, c__7443, d__7445, e__7447, f__7449, g__7451, h__7453, i__7455, j__7457, k__7459)
                          }else {
                            return f__7449.call(null, a__7439, b__7441, c__7443, d__7445, e__7447, f__7449, g__7451, h__7453, i__7455, j__7457, k__7459)
                          }
                        }else {
                          var l__7461 = cljs.core._first.call(null, args__7460);
                          var args__7462 = cljs.core._rest.call(null, args__7460);
                          if(argc === 12) {
                            if(f__7449.cljs$lang$arity$12) {
                              return f__7449.cljs$lang$arity$12(a__7439, b__7441, c__7443, d__7445, e__7447, f__7449, g__7451, h__7453, i__7455, j__7457, k__7459, l__7461)
                            }else {
                              return f__7449.call(null, a__7439, b__7441, c__7443, d__7445, e__7447, f__7449, g__7451, h__7453, i__7455, j__7457, k__7459, l__7461)
                            }
                          }else {
                            var m__7463 = cljs.core._first.call(null, args__7462);
                            var args__7464 = cljs.core._rest.call(null, args__7462);
                            if(argc === 13) {
                              if(f__7449.cljs$lang$arity$13) {
                                return f__7449.cljs$lang$arity$13(a__7439, b__7441, c__7443, d__7445, e__7447, f__7449, g__7451, h__7453, i__7455, j__7457, k__7459, l__7461, m__7463)
                              }else {
                                return f__7449.call(null, a__7439, b__7441, c__7443, d__7445, e__7447, f__7449, g__7451, h__7453, i__7455, j__7457, k__7459, l__7461, m__7463)
                              }
                            }else {
                              var n__7465 = cljs.core._first.call(null, args__7464);
                              var args__7466 = cljs.core._rest.call(null, args__7464);
                              if(argc === 14) {
                                if(f__7449.cljs$lang$arity$14) {
                                  return f__7449.cljs$lang$arity$14(a__7439, b__7441, c__7443, d__7445, e__7447, f__7449, g__7451, h__7453, i__7455, j__7457, k__7459, l__7461, m__7463, n__7465)
                                }else {
                                  return f__7449.call(null, a__7439, b__7441, c__7443, d__7445, e__7447, f__7449, g__7451, h__7453, i__7455, j__7457, k__7459, l__7461, m__7463, n__7465)
                                }
                              }else {
                                var o__7467 = cljs.core._first.call(null, args__7466);
                                var args__7468 = cljs.core._rest.call(null, args__7466);
                                if(argc === 15) {
                                  if(f__7449.cljs$lang$arity$15) {
                                    return f__7449.cljs$lang$arity$15(a__7439, b__7441, c__7443, d__7445, e__7447, f__7449, g__7451, h__7453, i__7455, j__7457, k__7459, l__7461, m__7463, n__7465, o__7467)
                                  }else {
                                    return f__7449.call(null, a__7439, b__7441, c__7443, d__7445, e__7447, f__7449, g__7451, h__7453, i__7455, j__7457, k__7459, l__7461, m__7463, n__7465, o__7467)
                                  }
                                }else {
                                  var p__7469 = cljs.core._first.call(null, args__7468);
                                  var args__7470 = cljs.core._rest.call(null, args__7468);
                                  if(argc === 16) {
                                    if(f__7449.cljs$lang$arity$16) {
                                      return f__7449.cljs$lang$arity$16(a__7439, b__7441, c__7443, d__7445, e__7447, f__7449, g__7451, h__7453, i__7455, j__7457, k__7459, l__7461, m__7463, n__7465, o__7467, p__7469)
                                    }else {
                                      return f__7449.call(null, a__7439, b__7441, c__7443, d__7445, e__7447, f__7449, g__7451, h__7453, i__7455, j__7457, k__7459, l__7461, m__7463, n__7465, o__7467, p__7469)
                                    }
                                  }else {
                                    var q__7471 = cljs.core._first.call(null, args__7470);
                                    var args__7472 = cljs.core._rest.call(null, args__7470);
                                    if(argc === 17) {
                                      if(f__7449.cljs$lang$arity$17) {
                                        return f__7449.cljs$lang$arity$17(a__7439, b__7441, c__7443, d__7445, e__7447, f__7449, g__7451, h__7453, i__7455, j__7457, k__7459, l__7461, m__7463, n__7465, o__7467, p__7469, q__7471)
                                      }else {
                                        return f__7449.call(null, a__7439, b__7441, c__7443, d__7445, e__7447, f__7449, g__7451, h__7453, i__7455, j__7457, k__7459, l__7461, m__7463, n__7465, o__7467, p__7469, q__7471)
                                      }
                                    }else {
                                      var r__7473 = cljs.core._first.call(null, args__7472);
                                      var args__7474 = cljs.core._rest.call(null, args__7472);
                                      if(argc === 18) {
                                        if(f__7449.cljs$lang$arity$18) {
                                          return f__7449.cljs$lang$arity$18(a__7439, b__7441, c__7443, d__7445, e__7447, f__7449, g__7451, h__7453, i__7455, j__7457, k__7459, l__7461, m__7463, n__7465, o__7467, p__7469, q__7471, r__7473)
                                        }else {
                                          return f__7449.call(null, a__7439, b__7441, c__7443, d__7445, e__7447, f__7449, g__7451, h__7453, i__7455, j__7457, k__7459, l__7461, m__7463, n__7465, o__7467, p__7469, q__7471, r__7473)
                                        }
                                      }else {
                                        var s__7475 = cljs.core._first.call(null, args__7474);
                                        var args__7476 = cljs.core._rest.call(null, args__7474);
                                        if(argc === 19) {
                                          if(f__7449.cljs$lang$arity$19) {
                                            return f__7449.cljs$lang$arity$19(a__7439, b__7441, c__7443, d__7445, e__7447, f__7449, g__7451, h__7453, i__7455, j__7457, k__7459, l__7461, m__7463, n__7465, o__7467, p__7469, q__7471, r__7473, s__7475)
                                          }else {
                                            return f__7449.call(null, a__7439, b__7441, c__7443, d__7445, e__7447, f__7449, g__7451, h__7453, i__7455, j__7457, k__7459, l__7461, m__7463, n__7465, o__7467, p__7469, q__7471, r__7473, s__7475)
                                          }
                                        }else {
                                          var t__7477 = cljs.core._first.call(null, args__7476);
                                          var args__7478 = cljs.core._rest.call(null, args__7476);
                                          if(argc === 20) {
                                            if(f__7449.cljs$lang$arity$20) {
                                              return f__7449.cljs$lang$arity$20(a__7439, b__7441, c__7443, d__7445, e__7447, f__7449, g__7451, h__7453, i__7455, j__7457, k__7459, l__7461, m__7463, n__7465, o__7467, p__7469, q__7471, r__7473, s__7475, t__7477)
                                            }else {
                                              return f__7449.call(null, a__7439, b__7441, c__7443, d__7445, e__7447, f__7449, g__7451, h__7453, i__7455, j__7457, k__7459, l__7461, m__7463, n__7465, o__7467, p__7469, q__7471, r__7473, s__7475, t__7477)
                                            }
                                          }else {
                                            throw new Error("Only up to 20 arguments supported on functions");
                                          }
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
};
cljs.core.apply = function() {
  var apply = null;
  var apply__2 = function(f, args) {
    var fixed_arity__7493 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__7494 = cljs.core.bounded_count.call(null, args, fixed_arity__7493 + 1);
      if(bc__7494 <= fixed_arity__7493) {
        return cljs.core.apply_to.call(null, f, bc__7494, args)
      }else {
        return f.cljs$lang$applyTo(args)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, args))
    }
  };
  var apply__3 = function(f, x, args) {
    var arglist__7495 = cljs.core.list_STAR_.call(null, x, args);
    var fixed_arity__7496 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__7497 = cljs.core.bounded_count.call(null, arglist__7495, fixed_arity__7496 + 1);
      if(bc__7497 <= fixed_arity__7496) {
        return cljs.core.apply_to.call(null, f, bc__7497, arglist__7495)
      }else {
        return f.cljs$lang$applyTo(arglist__7495)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__7495))
    }
  };
  var apply__4 = function(f, x, y, args) {
    var arglist__7498 = cljs.core.list_STAR_.call(null, x, y, args);
    var fixed_arity__7499 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__7500 = cljs.core.bounded_count.call(null, arglist__7498, fixed_arity__7499 + 1);
      if(bc__7500 <= fixed_arity__7499) {
        return cljs.core.apply_to.call(null, f, bc__7500, arglist__7498)
      }else {
        return f.cljs$lang$applyTo(arglist__7498)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__7498))
    }
  };
  var apply__5 = function(f, x, y, z, args) {
    var arglist__7501 = cljs.core.list_STAR_.call(null, x, y, z, args);
    var fixed_arity__7502 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__7503 = cljs.core.bounded_count.call(null, arglist__7501, fixed_arity__7502 + 1);
      if(bc__7503 <= fixed_arity__7502) {
        return cljs.core.apply_to.call(null, f, bc__7503, arglist__7501)
      }else {
        return f.cljs$lang$applyTo(arglist__7501)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__7501))
    }
  };
  var apply__6 = function() {
    var G__7507__delegate = function(f, a, b, c, d, args) {
      var arglist__7504 = cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, args)))));
      var fixed_arity__7505 = f.cljs$lang$maxFixedArity;
      if(cljs.core.truth_(f.cljs$lang$applyTo)) {
        var bc__7506 = cljs.core.bounded_count.call(null, arglist__7504, fixed_arity__7505 + 1);
        if(bc__7506 <= fixed_arity__7505) {
          return cljs.core.apply_to.call(null, f, bc__7506, arglist__7504)
        }else {
          return f.cljs$lang$applyTo(arglist__7504)
        }
      }else {
        return f.apply(f, cljs.core.to_array.call(null, arglist__7504))
      }
    };
    var G__7507 = function(f, a, b, c, d, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__7507__delegate.call(this, f, a, b, c, d, args)
    };
    G__7507.cljs$lang$maxFixedArity = 5;
    G__7507.cljs$lang$applyTo = function(arglist__7508) {
      var f = cljs.core.first(arglist__7508);
      var a = cljs.core.first(cljs.core.next(arglist__7508));
      var b = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7508)));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7508))));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7508)))));
      var args = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7508)))));
      return G__7507__delegate(f, a, b, c, d, args)
    };
    G__7507.cljs$lang$arity$variadic = G__7507__delegate;
    return G__7507
  }();
  apply = function(f, a, b, c, d, var_args) {
    var args = var_args;
    switch(arguments.length) {
      case 2:
        return apply__2.call(this, f, a);
      case 3:
        return apply__3.call(this, f, a, b);
      case 4:
        return apply__4.call(this, f, a, b, c);
      case 5:
        return apply__5.call(this, f, a, b, c, d);
      default:
        return apply__6.cljs$lang$arity$variadic(f, a, b, c, d, cljs.core.array_seq(arguments, 5))
    }
    throw"Invalid arity: " + arguments.length;
  };
  apply.cljs$lang$maxFixedArity = 5;
  apply.cljs$lang$applyTo = apply__6.cljs$lang$applyTo;
  apply.cljs$lang$arity$2 = apply__2;
  apply.cljs$lang$arity$3 = apply__3;
  apply.cljs$lang$arity$4 = apply__4;
  apply.cljs$lang$arity$5 = apply__5;
  apply.cljs$lang$arity$variadic = apply__6.cljs$lang$arity$variadic;
  return apply
}();
cljs.core.vary_meta = function() {
  var vary_meta__delegate = function(obj, f, args) {
    return cljs.core.with_meta.call(null, obj, cljs.core.apply.call(null, f, cljs.core.meta.call(null, obj), args))
  };
  var vary_meta = function(obj, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return vary_meta__delegate.call(this, obj, f, args)
  };
  vary_meta.cljs$lang$maxFixedArity = 2;
  vary_meta.cljs$lang$applyTo = function(arglist__7509) {
    var obj = cljs.core.first(arglist__7509);
    var f = cljs.core.first(cljs.core.next(arglist__7509));
    var args = cljs.core.rest(cljs.core.next(arglist__7509));
    return vary_meta__delegate(obj, f, args)
  };
  vary_meta.cljs$lang$arity$variadic = vary_meta__delegate;
  return vary_meta
}();
cljs.core.not_EQ_ = function() {
  var not_EQ_ = null;
  var not_EQ___1 = function(x) {
    return false
  };
  var not_EQ___2 = function(x, y) {
    return!cljs.core._EQ_.call(null, x, y)
  };
  var not_EQ___3 = function() {
    var G__7510__delegate = function(x, y, more) {
      return cljs.core.not.call(null, cljs.core.apply.call(null, cljs.core._EQ_, x, y, more))
    };
    var G__7510 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7510__delegate.call(this, x, y, more)
    };
    G__7510.cljs$lang$maxFixedArity = 2;
    G__7510.cljs$lang$applyTo = function(arglist__7511) {
      var x = cljs.core.first(arglist__7511);
      var y = cljs.core.first(cljs.core.next(arglist__7511));
      var more = cljs.core.rest(cljs.core.next(arglist__7511));
      return G__7510__delegate(x, y, more)
    };
    G__7510.cljs$lang$arity$variadic = G__7510__delegate;
    return G__7510
  }();
  not_EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return not_EQ___1.call(this, x);
      case 2:
        return not_EQ___2.call(this, x, y);
      default:
        return not_EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  not_EQ_.cljs$lang$maxFixedArity = 2;
  not_EQ_.cljs$lang$applyTo = not_EQ___3.cljs$lang$applyTo;
  not_EQ_.cljs$lang$arity$1 = not_EQ___1;
  not_EQ_.cljs$lang$arity$2 = not_EQ___2;
  not_EQ_.cljs$lang$arity$variadic = not_EQ___3.cljs$lang$arity$variadic;
  return not_EQ_
}();
cljs.core.not_empty = function not_empty(coll) {
  if(cljs.core.seq.call(null, coll)) {
    return coll
  }else {
    return null
  }
};
cljs.core.every_QMARK_ = function every_QMARK_(pred, coll) {
  while(true) {
    if(cljs.core.seq.call(null, coll) == null) {
      return true
    }else {
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, coll)))) {
        var G__7512 = pred;
        var G__7513 = cljs.core.next.call(null, coll);
        pred = G__7512;
        coll = G__7513;
        continue
      }else {
        if("\ufdd0'else") {
          return false
        }else {
          return null
        }
      }
    }
    break
  }
};
cljs.core.not_every_QMARK_ = function not_every_QMARK_(pred, coll) {
  return!cljs.core.every_QMARK_.call(null, pred, coll)
};
cljs.core.some = function some(pred, coll) {
  while(true) {
    if(cljs.core.seq.call(null, coll)) {
      var or__3943__auto____7515 = pred.call(null, cljs.core.first.call(null, coll));
      if(cljs.core.truth_(or__3943__auto____7515)) {
        return or__3943__auto____7515
      }else {
        var G__7516 = pred;
        var G__7517 = cljs.core.next.call(null, coll);
        pred = G__7516;
        coll = G__7517;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.not_any_QMARK_ = function not_any_QMARK_(pred, coll) {
  return cljs.core.not.call(null, cljs.core.some.call(null, pred, coll))
};
cljs.core.even_QMARK_ = function even_QMARK_(n) {
  if(cljs.core.integer_QMARK_.call(null, n)) {
    return(n & 1) === 0
  }else {
    throw new Error([cljs.core.str("Argument must be an integer: "), cljs.core.str(n)].join(""));
  }
};
cljs.core.odd_QMARK_ = function odd_QMARK_(n) {
  return!cljs.core.even_QMARK_.call(null, n)
};
cljs.core.identity = function identity(x) {
  return x
};
cljs.core.complement = function complement(f) {
  return function() {
    var G__7518 = null;
    var G__7518__0 = function() {
      return cljs.core.not.call(null, f.call(null))
    };
    var G__7518__1 = function(x) {
      return cljs.core.not.call(null, f.call(null, x))
    };
    var G__7518__2 = function(x, y) {
      return cljs.core.not.call(null, f.call(null, x, y))
    };
    var G__7518__3 = function() {
      var G__7519__delegate = function(x, y, zs) {
        return cljs.core.not.call(null, cljs.core.apply.call(null, f, x, y, zs))
      };
      var G__7519 = function(x, y, var_args) {
        var zs = null;
        if(goog.isDef(var_args)) {
          zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
        }
        return G__7519__delegate.call(this, x, y, zs)
      };
      G__7519.cljs$lang$maxFixedArity = 2;
      G__7519.cljs$lang$applyTo = function(arglist__7520) {
        var x = cljs.core.first(arglist__7520);
        var y = cljs.core.first(cljs.core.next(arglist__7520));
        var zs = cljs.core.rest(cljs.core.next(arglist__7520));
        return G__7519__delegate(x, y, zs)
      };
      G__7519.cljs$lang$arity$variadic = G__7519__delegate;
      return G__7519
    }();
    G__7518 = function(x, y, var_args) {
      var zs = var_args;
      switch(arguments.length) {
        case 0:
          return G__7518__0.call(this);
        case 1:
          return G__7518__1.call(this, x);
        case 2:
          return G__7518__2.call(this, x, y);
        default:
          return G__7518__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
      }
      throw"Invalid arity: " + arguments.length;
    };
    G__7518.cljs$lang$maxFixedArity = 2;
    G__7518.cljs$lang$applyTo = G__7518__3.cljs$lang$applyTo;
    return G__7518
  }()
};
cljs.core.constantly = function constantly(x) {
  return function() {
    var G__7521__delegate = function(args) {
      return x
    };
    var G__7521 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__7521__delegate.call(this, args)
    };
    G__7521.cljs$lang$maxFixedArity = 0;
    G__7521.cljs$lang$applyTo = function(arglist__7522) {
      var args = cljs.core.seq(arglist__7522);
      return G__7521__delegate(args)
    };
    G__7521.cljs$lang$arity$variadic = G__7521__delegate;
    return G__7521
  }()
};
cljs.core.comp = function() {
  var comp = null;
  var comp__0 = function() {
    return cljs.core.identity
  };
  var comp__1 = function(f) {
    return f
  };
  var comp__2 = function(f, g) {
    return function() {
      var G__7529 = null;
      var G__7529__0 = function() {
        return f.call(null, g.call(null))
      };
      var G__7529__1 = function(x) {
        return f.call(null, g.call(null, x))
      };
      var G__7529__2 = function(x, y) {
        return f.call(null, g.call(null, x, y))
      };
      var G__7529__3 = function(x, y, z) {
        return f.call(null, g.call(null, x, y, z))
      };
      var G__7529__4 = function() {
        var G__7530__delegate = function(x, y, z, args) {
          return f.call(null, cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__7530 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7530__delegate.call(this, x, y, z, args)
        };
        G__7530.cljs$lang$maxFixedArity = 3;
        G__7530.cljs$lang$applyTo = function(arglist__7531) {
          var x = cljs.core.first(arglist__7531);
          var y = cljs.core.first(cljs.core.next(arglist__7531));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7531)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7531)));
          return G__7530__delegate(x, y, z, args)
        };
        G__7530.cljs$lang$arity$variadic = G__7530__delegate;
        return G__7530
      }();
      G__7529 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__7529__0.call(this);
          case 1:
            return G__7529__1.call(this, x);
          case 2:
            return G__7529__2.call(this, x, y);
          case 3:
            return G__7529__3.call(this, x, y, z);
          default:
            return G__7529__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__7529.cljs$lang$maxFixedArity = 3;
      G__7529.cljs$lang$applyTo = G__7529__4.cljs$lang$applyTo;
      return G__7529
    }()
  };
  var comp__3 = function(f, g, h) {
    return function() {
      var G__7532 = null;
      var G__7532__0 = function() {
        return f.call(null, g.call(null, h.call(null)))
      };
      var G__7532__1 = function(x) {
        return f.call(null, g.call(null, h.call(null, x)))
      };
      var G__7532__2 = function(x, y) {
        return f.call(null, g.call(null, h.call(null, x, y)))
      };
      var G__7532__3 = function(x, y, z) {
        return f.call(null, g.call(null, h.call(null, x, y, z)))
      };
      var G__7532__4 = function() {
        var G__7533__delegate = function(x, y, z, args) {
          return f.call(null, g.call(null, cljs.core.apply.call(null, h, x, y, z, args)))
        };
        var G__7533 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7533__delegate.call(this, x, y, z, args)
        };
        G__7533.cljs$lang$maxFixedArity = 3;
        G__7533.cljs$lang$applyTo = function(arglist__7534) {
          var x = cljs.core.first(arglist__7534);
          var y = cljs.core.first(cljs.core.next(arglist__7534));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7534)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7534)));
          return G__7533__delegate(x, y, z, args)
        };
        G__7533.cljs$lang$arity$variadic = G__7533__delegate;
        return G__7533
      }();
      G__7532 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__7532__0.call(this);
          case 1:
            return G__7532__1.call(this, x);
          case 2:
            return G__7532__2.call(this, x, y);
          case 3:
            return G__7532__3.call(this, x, y, z);
          default:
            return G__7532__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__7532.cljs$lang$maxFixedArity = 3;
      G__7532.cljs$lang$applyTo = G__7532__4.cljs$lang$applyTo;
      return G__7532
    }()
  };
  var comp__4 = function() {
    var G__7535__delegate = function(f1, f2, f3, fs) {
      var fs__7526 = cljs.core.reverse.call(null, cljs.core.list_STAR_.call(null, f1, f2, f3, fs));
      return function() {
        var G__7536__delegate = function(args) {
          var ret__7527 = cljs.core.apply.call(null, cljs.core.first.call(null, fs__7526), args);
          var fs__7528 = cljs.core.next.call(null, fs__7526);
          while(true) {
            if(fs__7528) {
              var G__7537 = cljs.core.first.call(null, fs__7528).call(null, ret__7527);
              var G__7538 = cljs.core.next.call(null, fs__7528);
              ret__7527 = G__7537;
              fs__7528 = G__7538;
              continue
            }else {
              return ret__7527
            }
            break
          }
        };
        var G__7536 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__7536__delegate.call(this, args)
        };
        G__7536.cljs$lang$maxFixedArity = 0;
        G__7536.cljs$lang$applyTo = function(arglist__7539) {
          var args = cljs.core.seq(arglist__7539);
          return G__7536__delegate(args)
        };
        G__7536.cljs$lang$arity$variadic = G__7536__delegate;
        return G__7536
      }()
    };
    var G__7535 = function(f1, f2, f3, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__7535__delegate.call(this, f1, f2, f3, fs)
    };
    G__7535.cljs$lang$maxFixedArity = 3;
    G__7535.cljs$lang$applyTo = function(arglist__7540) {
      var f1 = cljs.core.first(arglist__7540);
      var f2 = cljs.core.first(cljs.core.next(arglist__7540));
      var f3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7540)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7540)));
      return G__7535__delegate(f1, f2, f3, fs)
    };
    G__7535.cljs$lang$arity$variadic = G__7535__delegate;
    return G__7535
  }();
  comp = function(f1, f2, f3, var_args) {
    var fs = var_args;
    switch(arguments.length) {
      case 0:
        return comp__0.call(this);
      case 1:
        return comp__1.call(this, f1);
      case 2:
        return comp__2.call(this, f1, f2);
      case 3:
        return comp__3.call(this, f1, f2, f3);
      default:
        return comp__4.cljs$lang$arity$variadic(f1, f2, f3, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  comp.cljs$lang$maxFixedArity = 3;
  comp.cljs$lang$applyTo = comp__4.cljs$lang$applyTo;
  comp.cljs$lang$arity$0 = comp__0;
  comp.cljs$lang$arity$1 = comp__1;
  comp.cljs$lang$arity$2 = comp__2;
  comp.cljs$lang$arity$3 = comp__3;
  comp.cljs$lang$arity$variadic = comp__4.cljs$lang$arity$variadic;
  return comp
}();
cljs.core.partial = function() {
  var partial = null;
  var partial__2 = function(f, arg1) {
    return function() {
      var G__7541__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, args)
      };
      var G__7541 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__7541__delegate.call(this, args)
      };
      G__7541.cljs$lang$maxFixedArity = 0;
      G__7541.cljs$lang$applyTo = function(arglist__7542) {
        var args = cljs.core.seq(arglist__7542);
        return G__7541__delegate(args)
      };
      G__7541.cljs$lang$arity$variadic = G__7541__delegate;
      return G__7541
    }()
  };
  var partial__3 = function(f, arg1, arg2) {
    return function() {
      var G__7543__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, args)
      };
      var G__7543 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__7543__delegate.call(this, args)
      };
      G__7543.cljs$lang$maxFixedArity = 0;
      G__7543.cljs$lang$applyTo = function(arglist__7544) {
        var args = cljs.core.seq(arglist__7544);
        return G__7543__delegate(args)
      };
      G__7543.cljs$lang$arity$variadic = G__7543__delegate;
      return G__7543
    }()
  };
  var partial__4 = function(f, arg1, arg2, arg3) {
    return function() {
      var G__7545__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, arg3, args)
      };
      var G__7545 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__7545__delegate.call(this, args)
      };
      G__7545.cljs$lang$maxFixedArity = 0;
      G__7545.cljs$lang$applyTo = function(arglist__7546) {
        var args = cljs.core.seq(arglist__7546);
        return G__7545__delegate(args)
      };
      G__7545.cljs$lang$arity$variadic = G__7545__delegate;
      return G__7545
    }()
  };
  var partial__5 = function() {
    var G__7547__delegate = function(f, arg1, arg2, arg3, more) {
      return function() {
        var G__7548__delegate = function(args) {
          return cljs.core.apply.call(null, f, arg1, arg2, arg3, cljs.core.concat.call(null, more, args))
        };
        var G__7548 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__7548__delegate.call(this, args)
        };
        G__7548.cljs$lang$maxFixedArity = 0;
        G__7548.cljs$lang$applyTo = function(arglist__7549) {
          var args = cljs.core.seq(arglist__7549);
          return G__7548__delegate(args)
        };
        G__7548.cljs$lang$arity$variadic = G__7548__delegate;
        return G__7548
      }()
    };
    var G__7547 = function(f, arg1, arg2, arg3, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__7547__delegate.call(this, f, arg1, arg2, arg3, more)
    };
    G__7547.cljs$lang$maxFixedArity = 4;
    G__7547.cljs$lang$applyTo = function(arglist__7550) {
      var f = cljs.core.first(arglist__7550);
      var arg1 = cljs.core.first(cljs.core.next(arglist__7550));
      var arg2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7550)));
      var arg3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7550))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7550))));
      return G__7547__delegate(f, arg1, arg2, arg3, more)
    };
    G__7547.cljs$lang$arity$variadic = G__7547__delegate;
    return G__7547
  }();
  partial = function(f, arg1, arg2, arg3, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return partial__2.call(this, f, arg1);
      case 3:
        return partial__3.call(this, f, arg1, arg2);
      case 4:
        return partial__4.call(this, f, arg1, arg2, arg3);
      default:
        return partial__5.cljs$lang$arity$variadic(f, arg1, arg2, arg3, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  partial.cljs$lang$maxFixedArity = 4;
  partial.cljs$lang$applyTo = partial__5.cljs$lang$applyTo;
  partial.cljs$lang$arity$2 = partial__2;
  partial.cljs$lang$arity$3 = partial__3;
  partial.cljs$lang$arity$4 = partial__4;
  partial.cljs$lang$arity$variadic = partial__5.cljs$lang$arity$variadic;
  return partial
}();
cljs.core.fnil = function() {
  var fnil = null;
  var fnil__2 = function(f, x) {
    return function() {
      var G__7551 = null;
      var G__7551__1 = function(a) {
        return f.call(null, a == null ? x : a)
      };
      var G__7551__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b)
      };
      var G__7551__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b, c)
      };
      var G__7551__4 = function() {
        var G__7552__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b, c, ds)
        };
        var G__7552 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7552__delegate.call(this, a, b, c, ds)
        };
        G__7552.cljs$lang$maxFixedArity = 3;
        G__7552.cljs$lang$applyTo = function(arglist__7553) {
          var a = cljs.core.first(arglist__7553);
          var b = cljs.core.first(cljs.core.next(arglist__7553));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7553)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7553)));
          return G__7552__delegate(a, b, c, ds)
        };
        G__7552.cljs$lang$arity$variadic = G__7552__delegate;
        return G__7552
      }();
      G__7551 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 1:
            return G__7551__1.call(this, a);
          case 2:
            return G__7551__2.call(this, a, b);
          case 3:
            return G__7551__3.call(this, a, b, c);
          default:
            return G__7551__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__7551.cljs$lang$maxFixedArity = 3;
      G__7551.cljs$lang$applyTo = G__7551__4.cljs$lang$applyTo;
      return G__7551
    }()
  };
  var fnil__3 = function(f, x, y) {
    return function() {
      var G__7554 = null;
      var G__7554__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__7554__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c)
      };
      var G__7554__4 = function() {
        var G__7555__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c, ds)
        };
        var G__7555 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7555__delegate.call(this, a, b, c, ds)
        };
        G__7555.cljs$lang$maxFixedArity = 3;
        G__7555.cljs$lang$applyTo = function(arglist__7556) {
          var a = cljs.core.first(arglist__7556);
          var b = cljs.core.first(cljs.core.next(arglist__7556));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7556)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7556)));
          return G__7555__delegate(a, b, c, ds)
        };
        G__7555.cljs$lang$arity$variadic = G__7555__delegate;
        return G__7555
      }();
      G__7554 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__7554__2.call(this, a, b);
          case 3:
            return G__7554__3.call(this, a, b, c);
          default:
            return G__7554__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__7554.cljs$lang$maxFixedArity = 3;
      G__7554.cljs$lang$applyTo = G__7554__4.cljs$lang$applyTo;
      return G__7554
    }()
  };
  var fnil__4 = function(f, x, y, z) {
    return function() {
      var G__7557 = null;
      var G__7557__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__7557__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c == null ? z : c)
      };
      var G__7557__4 = function() {
        var G__7558__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c == null ? z : c, ds)
        };
        var G__7558 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7558__delegate.call(this, a, b, c, ds)
        };
        G__7558.cljs$lang$maxFixedArity = 3;
        G__7558.cljs$lang$applyTo = function(arglist__7559) {
          var a = cljs.core.first(arglist__7559);
          var b = cljs.core.first(cljs.core.next(arglist__7559));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7559)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7559)));
          return G__7558__delegate(a, b, c, ds)
        };
        G__7558.cljs$lang$arity$variadic = G__7558__delegate;
        return G__7558
      }();
      G__7557 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__7557__2.call(this, a, b);
          case 3:
            return G__7557__3.call(this, a, b, c);
          default:
            return G__7557__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__7557.cljs$lang$maxFixedArity = 3;
      G__7557.cljs$lang$applyTo = G__7557__4.cljs$lang$applyTo;
      return G__7557
    }()
  };
  fnil = function(f, x, y, z) {
    switch(arguments.length) {
      case 2:
        return fnil__2.call(this, f, x);
      case 3:
        return fnil__3.call(this, f, x, y);
      case 4:
        return fnil__4.call(this, f, x, y, z)
    }
    throw"Invalid arity: " + arguments.length;
  };
  fnil.cljs$lang$arity$2 = fnil__2;
  fnil.cljs$lang$arity$3 = fnil__3;
  fnil.cljs$lang$arity$4 = fnil__4;
  return fnil
}();
cljs.core.map_indexed = function map_indexed(f, coll) {
  var mapi__7575 = function mapi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__4092__auto____7583 = cljs.core.seq.call(null, coll);
      if(temp__4092__auto____7583) {
        var s__7584 = temp__4092__auto____7583;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__7584)) {
          var c__7585 = cljs.core.chunk_first.call(null, s__7584);
          var size__7586 = cljs.core.count.call(null, c__7585);
          var b__7587 = cljs.core.chunk_buffer.call(null, size__7586);
          var n__2468__auto____7588 = size__7586;
          var i__7589 = 0;
          while(true) {
            if(i__7589 < n__2468__auto____7588) {
              cljs.core.chunk_append.call(null, b__7587, f.call(null, idx + i__7589, cljs.core._nth.call(null, c__7585, i__7589)));
              var G__7590 = i__7589 + 1;
              i__7589 = G__7590;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__7587), mapi.call(null, idx + size__7586, cljs.core.chunk_rest.call(null, s__7584)))
        }else {
          return cljs.core.cons.call(null, f.call(null, idx, cljs.core.first.call(null, s__7584)), mapi.call(null, idx + 1, cljs.core.rest.call(null, s__7584)))
        }
      }else {
        return null
      }
    }, null)
  };
  return mapi__7575.call(null, 0, coll)
};
cljs.core.keep = function keep(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__4092__auto____7600 = cljs.core.seq.call(null, coll);
    if(temp__4092__auto____7600) {
      var s__7601 = temp__4092__auto____7600;
      if(cljs.core.chunked_seq_QMARK_.call(null, s__7601)) {
        var c__7602 = cljs.core.chunk_first.call(null, s__7601);
        var size__7603 = cljs.core.count.call(null, c__7602);
        var b__7604 = cljs.core.chunk_buffer.call(null, size__7603);
        var n__2468__auto____7605 = size__7603;
        var i__7606 = 0;
        while(true) {
          if(i__7606 < n__2468__auto____7605) {
            var x__7607 = f.call(null, cljs.core._nth.call(null, c__7602, i__7606));
            if(x__7607 == null) {
            }else {
              cljs.core.chunk_append.call(null, b__7604, x__7607)
            }
            var G__7609 = i__7606 + 1;
            i__7606 = G__7609;
            continue
          }else {
          }
          break
        }
        return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__7604), keep.call(null, f, cljs.core.chunk_rest.call(null, s__7601)))
      }else {
        var x__7608 = f.call(null, cljs.core.first.call(null, s__7601));
        if(x__7608 == null) {
          return keep.call(null, f, cljs.core.rest.call(null, s__7601))
        }else {
          return cljs.core.cons.call(null, x__7608, keep.call(null, f, cljs.core.rest.call(null, s__7601)))
        }
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.keep_indexed = function keep_indexed(f, coll) {
  var keepi__7635 = function keepi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__4092__auto____7645 = cljs.core.seq.call(null, coll);
      if(temp__4092__auto____7645) {
        var s__7646 = temp__4092__auto____7645;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__7646)) {
          var c__7647 = cljs.core.chunk_first.call(null, s__7646);
          var size__7648 = cljs.core.count.call(null, c__7647);
          var b__7649 = cljs.core.chunk_buffer.call(null, size__7648);
          var n__2468__auto____7650 = size__7648;
          var i__7651 = 0;
          while(true) {
            if(i__7651 < n__2468__auto____7650) {
              var x__7652 = f.call(null, idx + i__7651, cljs.core._nth.call(null, c__7647, i__7651));
              if(x__7652 == null) {
              }else {
                cljs.core.chunk_append.call(null, b__7649, x__7652)
              }
              var G__7654 = i__7651 + 1;
              i__7651 = G__7654;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__7649), keepi.call(null, idx + size__7648, cljs.core.chunk_rest.call(null, s__7646)))
        }else {
          var x__7653 = f.call(null, idx, cljs.core.first.call(null, s__7646));
          if(x__7653 == null) {
            return keepi.call(null, idx + 1, cljs.core.rest.call(null, s__7646))
          }else {
            return cljs.core.cons.call(null, x__7653, keepi.call(null, idx + 1, cljs.core.rest.call(null, s__7646)))
          }
        }
      }else {
        return null
      }
    }, null)
  };
  return keepi__7635.call(null, 0, coll)
};
cljs.core.every_pred = function() {
  var every_pred = null;
  var every_pred__1 = function(p) {
    return function() {
      var ep1 = null;
      var ep1__0 = function() {
        return true
      };
      var ep1__1 = function(x) {
        return cljs.core.boolean$.call(null, p.call(null, x))
      };
      var ep1__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3941__auto____7740 = p.call(null, x);
          if(cljs.core.truth_(and__3941__auto____7740)) {
            return p.call(null, y)
          }else {
            return and__3941__auto____7740
          }
        }())
      };
      var ep1__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3941__auto____7741 = p.call(null, x);
          if(cljs.core.truth_(and__3941__auto____7741)) {
            var and__3941__auto____7742 = p.call(null, y);
            if(cljs.core.truth_(and__3941__auto____7742)) {
              return p.call(null, z)
            }else {
              return and__3941__auto____7742
            }
          }else {
            return and__3941__auto____7741
          }
        }())
      };
      var ep1__4 = function() {
        var G__7811__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3941__auto____7743 = ep1.call(null, x, y, z);
            if(cljs.core.truth_(and__3941__auto____7743)) {
              return cljs.core.every_QMARK_.call(null, p, args)
            }else {
              return and__3941__auto____7743
            }
          }())
        };
        var G__7811 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7811__delegate.call(this, x, y, z, args)
        };
        G__7811.cljs$lang$maxFixedArity = 3;
        G__7811.cljs$lang$applyTo = function(arglist__7812) {
          var x = cljs.core.first(arglist__7812);
          var y = cljs.core.first(cljs.core.next(arglist__7812));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7812)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7812)));
          return G__7811__delegate(x, y, z, args)
        };
        G__7811.cljs$lang$arity$variadic = G__7811__delegate;
        return G__7811
      }();
      ep1 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep1__0.call(this);
          case 1:
            return ep1__1.call(this, x);
          case 2:
            return ep1__2.call(this, x, y);
          case 3:
            return ep1__3.call(this, x, y, z);
          default:
            return ep1__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep1.cljs$lang$maxFixedArity = 3;
      ep1.cljs$lang$applyTo = ep1__4.cljs$lang$applyTo;
      ep1.cljs$lang$arity$0 = ep1__0;
      ep1.cljs$lang$arity$1 = ep1__1;
      ep1.cljs$lang$arity$2 = ep1__2;
      ep1.cljs$lang$arity$3 = ep1__3;
      ep1.cljs$lang$arity$variadic = ep1__4.cljs$lang$arity$variadic;
      return ep1
    }()
  };
  var every_pred__2 = function(p1, p2) {
    return function() {
      var ep2 = null;
      var ep2__0 = function() {
        return true
      };
      var ep2__1 = function(x) {
        return cljs.core.boolean$.call(null, function() {
          var and__3941__auto____7755 = p1.call(null, x);
          if(cljs.core.truth_(and__3941__auto____7755)) {
            return p2.call(null, x)
          }else {
            return and__3941__auto____7755
          }
        }())
      };
      var ep2__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3941__auto____7756 = p1.call(null, x);
          if(cljs.core.truth_(and__3941__auto____7756)) {
            var and__3941__auto____7757 = p1.call(null, y);
            if(cljs.core.truth_(and__3941__auto____7757)) {
              var and__3941__auto____7758 = p2.call(null, x);
              if(cljs.core.truth_(and__3941__auto____7758)) {
                return p2.call(null, y)
              }else {
                return and__3941__auto____7758
              }
            }else {
              return and__3941__auto____7757
            }
          }else {
            return and__3941__auto____7756
          }
        }())
      };
      var ep2__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3941__auto____7759 = p1.call(null, x);
          if(cljs.core.truth_(and__3941__auto____7759)) {
            var and__3941__auto____7760 = p1.call(null, y);
            if(cljs.core.truth_(and__3941__auto____7760)) {
              var and__3941__auto____7761 = p1.call(null, z);
              if(cljs.core.truth_(and__3941__auto____7761)) {
                var and__3941__auto____7762 = p2.call(null, x);
                if(cljs.core.truth_(and__3941__auto____7762)) {
                  var and__3941__auto____7763 = p2.call(null, y);
                  if(cljs.core.truth_(and__3941__auto____7763)) {
                    return p2.call(null, z)
                  }else {
                    return and__3941__auto____7763
                  }
                }else {
                  return and__3941__auto____7762
                }
              }else {
                return and__3941__auto____7761
              }
            }else {
              return and__3941__auto____7760
            }
          }else {
            return and__3941__auto____7759
          }
        }())
      };
      var ep2__4 = function() {
        var G__7813__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3941__auto____7764 = ep2.call(null, x, y, z);
            if(cljs.core.truth_(and__3941__auto____7764)) {
              return cljs.core.every_QMARK_.call(null, function(p1__7610_SHARP_) {
                var and__3941__auto____7765 = p1.call(null, p1__7610_SHARP_);
                if(cljs.core.truth_(and__3941__auto____7765)) {
                  return p2.call(null, p1__7610_SHARP_)
                }else {
                  return and__3941__auto____7765
                }
              }, args)
            }else {
              return and__3941__auto____7764
            }
          }())
        };
        var G__7813 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7813__delegate.call(this, x, y, z, args)
        };
        G__7813.cljs$lang$maxFixedArity = 3;
        G__7813.cljs$lang$applyTo = function(arglist__7814) {
          var x = cljs.core.first(arglist__7814);
          var y = cljs.core.first(cljs.core.next(arglist__7814));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7814)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7814)));
          return G__7813__delegate(x, y, z, args)
        };
        G__7813.cljs$lang$arity$variadic = G__7813__delegate;
        return G__7813
      }();
      ep2 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep2__0.call(this);
          case 1:
            return ep2__1.call(this, x);
          case 2:
            return ep2__2.call(this, x, y);
          case 3:
            return ep2__3.call(this, x, y, z);
          default:
            return ep2__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep2.cljs$lang$maxFixedArity = 3;
      ep2.cljs$lang$applyTo = ep2__4.cljs$lang$applyTo;
      ep2.cljs$lang$arity$0 = ep2__0;
      ep2.cljs$lang$arity$1 = ep2__1;
      ep2.cljs$lang$arity$2 = ep2__2;
      ep2.cljs$lang$arity$3 = ep2__3;
      ep2.cljs$lang$arity$variadic = ep2__4.cljs$lang$arity$variadic;
      return ep2
    }()
  };
  var every_pred__3 = function(p1, p2, p3) {
    return function() {
      var ep3 = null;
      var ep3__0 = function() {
        return true
      };
      var ep3__1 = function(x) {
        return cljs.core.boolean$.call(null, function() {
          var and__3941__auto____7784 = p1.call(null, x);
          if(cljs.core.truth_(and__3941__auto____7784)) {
            var and__3941__auto____7785 = p2.call(null, x);
            if(cljs.core.truth_(and__3941__auto____7785)) {
              return p3.call(null, x)
            }else {
              return and__3941__auto____7785
            }
          }else {
            return and__3941__auto____7784
          }
        }())
      };
      var ep3__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3941__auto____7786 = p1.call(null, x);
          if(cljs.core.truth_(and__3941__auto____7786)) {
            var and__3941__auto____7787 = p2.call(null, x);
            if(cljs.core.truth_(and__3941__auto____7787)) {
              var and__3941__auto____7788 = p3.call(null, x);
              if(cljs.core.truth_(and__3941__auto____7788)) {
                var and__3941__auto____7789 = p1.call(null, y);
                if(cljs.core.truth_(and__3941__auto____7789)) {
                  var and__3941__auto____7790 = p2.call(null, y);
                  if(cljs.core.truth_(and__3941__auto____7790)) {
                    return p3.call(null, y)
                  }else {
                    return and__3941__auto____7790
                  }
                }else {
                  return and__3941__auto____7789
                }
              }else {
                return and__3941__auto____7788
              }
            }else {
              return and__3941__auto____7787
            }
          }else {
            return and__3941__auto____7786
          }
        }())
      };
      var ep3__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3941__auto____7791 = p1.call(null, x);
          if(cljs.core.truth_(and__3941__auto____7791)) {
            var and__3941__auto____7792 = p2.call(null, x);
            if(cljs.core.truth_(and__3941__auto____7792)) {
              var and__3941__auto____7793 = p3.call(null, x);
              if(cljs.core.truth_(and__3941__auto____7793)) {
                var and__3941__auto____7794 = p1.call(null, y);
                if(cljs.core.truth_(and__3941__auto____7794)) {
                  var and__3941__auto____7795 = p2.call(null, y);
                  if(cljs.core.truth_(and__3941__auto____7795)) {
                    var and__3941__auto____7796 = p3.call(null, y);
                    if(cljs.core.truth_(and__3941__auto____7796)) {
                      var and__3941__auto____7797 = p1.call(null, z);
                      if(cljs.core.truth_(and__3941__auto____7797)) {
                        var and__3941__auto____7798 = p2.call(null, z);
                        if(cljs.core.truth_(and__3941__auto____7798)) {
                          return p3.call(null, z)
                        }else {
                          return and__3941__auto____7798
                        }
                      }else {
                        return and__3941__auto____7797
                      }
                    }else {
                      return and__3941__auto____7796
                    }
                  }else {
                    return and__3941__auto____7795
                  }
                }else {
                  return and__3941__auto____7794
                }
              }else {
                return and__3941__auto____7793
              }
            }else {
              return and__3941__auto____7792
            }
          }else {
            return and__3941__auto____7791
          }
        }())
      };
      var ep3__4 = function() {
        var G__7815__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3941__auto____7799 = ep3.call(null, x, y, z);
            if(cljs.core.truth_(and__3941__auto____7799)) {
              return cljs.core.every_QMARK_.call(null, function(p1__7611_SHARP_) {
                var and__3941__auto____7800 = p1.call(null, p1__7611_SHARP_);
                if(cljs.core.truth_(and__3941__auto____7800)) {
                  var and__3941__auto____7801 = p2.call(null, p1__7611_SHARP_);
                  if(cljs.core.truth_(and__3941__auto____7801)) {
                    return p3.call(null, p1__7611_SHARP_)
                  }else {
                    return and__3941__auto____7801
                  }
                }else {
                  return and__3941__auto____7800
                }
              }, args)
            }else {
              return and__3941__auto____7799
            }
          }())
        };
        var G__7815 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7815__delegate.call(this, x, y, z, args)
        };
        G__7815.cljs$lang$maxFixedArity = 3;
        G__7815.cljs$lang$applyTo = function(arglist__7816) {
          var x = cljs.core.first(arglist__7816);
          var y = cljs.core.first(cljs.core.next(arglist__7816));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7816)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7816)));
          return G__7815__delegate(x, y, z, args)
        };
        G__7815.cljs$lang$arity$variadic = G__7815__delegate;
        return G__7815
      }();
      ep3 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep3__0.call(this);
          case 1:
            return ep3__1.call(this, x);
          case 2:
            return ep3__2.call(this, x, y);
          case 3:
            return ep3__3.call(this, x, y, z);
          default:
            return ep3__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep3.cljs$lang$maxFixedArity = 3;
      ep3.cljs$lang$applyTo = ep3__4.cljs$lang$applyTo;
      ep3.cljs$lang$arity$0 = ep3__0;
      ep3.cljs$lang$arity$1 = ep3__1;
      ep3.cljs$lang$arity$2 = ep3__2;
      ep3.cljs$lang$arity$3 = ep3__3;
      ep3.cljs$lang$arity$variadic = ep3__4.cljs$lang$arity$variadic;
      return ep3
    }()
  };
  var every_pred__4 = function() {
    var G__7817__delegate = function(p1, p2, p3, ps) {
      var ps__7802 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var epn = null;
        var epn__0 = function() {
          return true
        };
        var epn__1 = function(x) {
          return cljs.core.every_QMARK_.call(null, function(p1__7612_SHARP_) {
            return p1__7612_SHARP_.call(null, x)
          }, ps__7802)
        };
        var epn__2 = function(x, y) {
          return cljs.core.every_QMARK_.call(null, function(p1__7613_SHARP_) {
            var and__3941__auto____7807 = p1__7613_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3941__auto____7807)) {
              return p1__7613_SHARP_.call(null, y)
            }else {
              return and__3941__auto____7807
            }
          }, ps__7802)
        };
        var epn__3 = function(x, y, z) {
          return cljs.core.every_QMARK_.call(null, function(p1__7614_SHARP_) {
            var and__3941__auto____7808 = p1__7614_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3941__auto____7808)) {
              var and__3941__auto____7809 = p1__7614_SHARP_.call(null, y);
              if(cljs.core.truth_(and__3941__auto____7809)) {
                return p1__7614_SHARP_.call(null, z)
              }else {
                return and__3941__auto____7809
              }
            }else {
              return and__3941__auto____7808
            }
          }, ps__7802)
        };
        var epn__4 = function() {
          var G__7818__delegate = function(x, y, z, args) {
            return cljs.core.boolean$.call(null, function() {
              var and__3941__auto____7810 = epn.call(null, x, y, z);
              if(cljs.core.truth_(and__3941__auto____7810)) {
                return cljs.core.every_QMARK_.call(null, function(p1__7615_SHARP_) {
                  return cljs.core.every_QMARK_.call(null, p1__7615_SHARP_, args)
                }, ps__7802)
              }else {
                return and__3941__auto____7810
              }
            }())
          };
          var G__7818 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__7818__delegate.call(this, x, y, z, args)
          };
          G__7818.cljs$lang$maxFixedArity = 3;
          G__7818.cljs$lang$applyTo = function(arglist__7819) {
            var x = cljs.core.first(arglist__7819);
            var y = cljs.core.first(cljs.core.next(arglist__7819));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7819)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7819)));
            return G__7818__delegate(x, y, z, args)
          };
          G__7818.cljs$lang$arity$variadic = G__7818__delegate;
          return G__7818
        }();
        epn = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return epn__0.call(this);
            case 1:
              return epn__1.call(this, x);
            case 2:
              return epn__2.call(this, x, y);
            case 3:
              return epn__3.call(this, x, y, z);
            default:
              return epn__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        epn.cljs$lang$maxFixedArity = 3;
        epn.cljs$lang$applyTo = epn__4.cljs$lang$applyTo;
        epn.cljs$lang$arity$0 = epn__0;
        epn.cljs$lang$arity$1 = epn__1;
        epn.cljs$lang$arity$2 = epn__2;
        epn.cljs$lang$arity$3 = epn__3;
        epn.cljs$lang$arity$variadic = epn__4.cljs$lang$arity$variadic;
        return epn
      }()
    };
    var G__7817 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__7817__delegate.call(this, p1, p2, p3, ps)
    };
    G__7817.cljs$lang$maxFixedArity = 3;
    G__7817.cljs$lang$applyTo = function(arglist__7820) {
      var p1 = cljs.core.first(arglist__7820);
      var p2 = cljs.core.first(cljs.core.next(arglist__7820));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7820)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7820)));
      return G__7817__delegate(p1, p2, p3, ps)
    };
    G__7817.cljs$lang$arity$variadic = G__7817__delegate;
    return G__7817
  }();
  every_pred = function(p1, p2, p3, var_args) {
    var ps = var_args;
    switch(arguments.length) {
      case 1:
        return every_pred__1.call(this, p1);
      case 2:
        return every_pred__2.call(this, p1, p2);
      case 3:
        return every_pred__3.call(this, p1, p2, p3);
      default:
        return every_pred__4.cljs$lang$arity$variadic(p1, p2, p3, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  every_pred.cljs$lang$maxFixedArity = 3;
  every_pred.cljs$lang$applyTo = every_pred__4.cljs$lang$applyTo;
  every_pred.cljs$lang$arity$1 = every_pred__1;
  every_pred.cljs$lang$arity$2 = every_pred__2;
  every_pred.cljs$lang$arity$3 = every_pred__3;
  every_pred.cljs$lang$arity$variadic = every_pred__4.cljs$lang$arity$variadic;
  return every_pred
}();
cljs.core.some_fn = function() {
  var some_fn = null;
  var some_fn__1 = function(p) {
    return function() {
      var sp1 = null;
      var sp1__0 = function() {
        return null
      };
      var sp1__1 = function(x) {
        return p.call(null, x)
      };
      var sp1__2 = function(x, y) {
        var or__3943__auto____7901 = p.call(null, x);
        if(cljs.core.truth_(or__3943__auto____7901)) {
          return or__3943__auto____7901
        }else {
          return p.call(null, y)
        }
      };
      var sp1__3 = function(x, y, z) {
        var or__3943__auto____7902 = p.call(null, x);
        if(cljs.core.truth_(or__3943__auto____7902)) {
          return or__3943__auto____7902
        }else {
          var or__3943__auto____7903 = p.call(null, y);
          if(cljs.core.truth_(or__3943__auto____7903)) {
            return or__3943__auto____7903
          }else {
            return p.call(null, z)
          }
        }
      };
      var sp1__4 = function() {
        var G__7972__delegate = function(x, y, z, args) {
          var or__3943__auto____7904 = sp1.call(null, x, y, z);
          if(cljs.core.truth_(or__3943__auto____7904)) {
            return or__3943__auto____7904
          }else {
            return cljs.core.some.call(null, p, args)
          }
        };
        var G__7972 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7972__delegate.call(this, x, y, z, args)
        };
        G__7972.cljs$lang$maxFixedArity = 3;
        G__7972.cljs$lang$applyTo = function(arglist__7973) {
          var x = cljs.core.first(arglist__7973);
          var y = cljs.core.first(cljs.core.next(arglist__7973));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7973)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7973)));
          return G__7972__delegate(x, y, z, args)
        };
        G__7972.cljs$lang$arity$variadic = G__7972__delegate;
        return G__7972
      }();
      sp1 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp1__0.call(this);
          case 1:
            return sp1__1.call(this, x);
          case 2:
            return sp1__2.call(this, x, y);
          case 3:
            return sp1__3.call(this, x, y, z);
          default:
            return sp1__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp1.cljs$lang$maxFixedArity = 3;
      sp1.cljs$lang$applyTo = sp1__4.cljs$lang$applyTo;
      sp1.cljs$lang$arity$0 = sp1__0;
      sp1.cljs$lang$arity$1 = sp1__1;
      sp1.cljs$lang$arity$2 = sp1__2;
      sp1.cljs$lang$arity$3 = sp1__3;
      sp1.cljs$lang$arity$variadic = sp1__4.cljs$lang$arity$variadic;
      return sp1
    }()
  };
  var some_fn__2 = function(p1, p2) {
    return function() {
      var sp2 = null;
      var sp2__0 = function() {
        return null
      };
      var sp2__1 = function(x) {
        var or__3943__auto____7916 = p1.call(null, x);
        if(cljs.core.truth_(or__3943__auto____7916)) {
          return or__3943__auto____7916
        }else {
          return p2.call(null, x)
        }
      };
      var sp2__2 = function(x, y) {
        var or__3943__auto____7917 = p1.call(null, x);
        if(cljs.core.truth_(or__3943__auto____7917)) {
          return or__3943__auto____7917
        }else {
          var or__3943__auto____7918 = p1.call(null, y);
          if(cljs.core.truth_(or__3943__auto____7918)) {
            return or__3943__auto____7918
          }else {
            var or__3943__auto____7919 = p2.call(null, x);
            if(cljs.core.truth_(or__3943__auto____7919)) {
              return or__3943__auto____7919
            }else {
              return p2.call(null, y)
            }
          }
        }
      };
      var sp2__3 = function(x, y, z) {
        var or__3943__auto____7920 = p1.call(null, x);
        if(cljs.core.truth_(or__3943__auto____7920)) {
          return or__3943__auto____7920
        }else {
          var or__3943__auto____7921 = p1.call(null, y);
          if(cljs.core.truth_(or__3943__auto____7921)) {
            return or__3943__auto____7921
          }else {
            var or__3943__auto____7922 = p1.call(null, z);
            if(cljs.core.truth_(or__3943__auto____7922)) {
              return or__3943__auto____7922
            }else {
              var or__3943__auto____7923 = p2.call(null, x);
              if(cljs.core.truth_(or__3943__auto____7923)) {
                return or__3943__auto____7923
              }else {
                var or__3943__auto____7924 = p2.call(null, y);
                if(cljs.core.truth_(or__3943__auto____7924)) {
                  return or__3943__auto____7924
                }else {
                  return p2.call(null, z)
                }
              }
            }
          }
        }
      };
      var sp2__4 = function() {
        var G__7974__delegate = function(x, y, z, args) {
          var or__3943__auto____7925 = sp2.call(null, x, y, z);
          if(cljs.core.truth_(or__3943__auto____7925)) {
            return or__3943__auto____7925
          }else {
            return cljs.core.some.call(null, function(p1__7655_SHARP_) {
              var or__3943__auto____7926 = p1.call(null, p1__7655_SHARP_);
              if(cljs.core.truth_(or__3943__auto____7926)) {
                return or__3943__auto____7926
              }else {
                return p2.call(null, p1__7655_SHARP_)
              }
            }, args)
          }
        };
        var G__7974 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7974__delegate.call(this, x, y, z, args)
        };
        G__7974.cljs$lang$maxFixedArity = 3;
        G__7974.cljs$lang$applyTo = function(arglist__7975) {
          var x = cljs.core.first(arglist__7975);
          var y = cljs.core.first(cljs.core.next(arglist__7975));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7975)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7975)));
          return G__7974__delegate(x, y, z, args)
        };
        G__7974.cljs$lang$arity$variadic = G__7974__delegate;
        return G__7974
      }();
      sp2 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp2__0.call(this);
          case 1:
            return sp2__1.call(this, x);
          case 2:
            return sp2__2.call(this, x, y);
          case 3:
            return sp2__3.call(this, x, y, z);
          default:
            return sp2__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp2.cljs$lang$maxFixedArity = 3;
      sp2.cljs$lang$applyTo = sp2__4.cljs$lang$applyTo;
      sp2.cljs$lang$arity$0 = sp2__0;
      sp2.cljs$lang$arity$1 = sp2__1;
      sp2.cljs$lang$arity$2 = sp2__2;
      sp2.cljs$lang$arity$3 = sp2__3;
      sp2.cljs$lang$arity$variadic = sp2__4.cljs$lang$arity$variadic;
      return sp2
    }()
  };
  var some_fn__3 = function(p1, p2, p3) {
    return function() {
      var sp3 = null;
      var sp3__0 = function() {
        return null
      };
      var sp3__1 = function(x) {
        var or__3943__auto____7945 = p1.call(null, x);
        if(cljs.core.truth_(or__3943__auto____7945)) {
          return or__3943__auto____7945
        }else {
          var or__3943__auto____7946 = p2.call(null, x);
          if(cljs.core.truth_(or__3943__auto____7946)) {
            return or__3943__auto____7946
          }else {
            return p3.call(null, x)
          }
        }
      };
      var sp3__2 = function(x, y) {
        var or__3943__auto____7947 = p1.call(null, x);
        if(cljs.core.truth_(or__3943__auto____7947)) {
          return or__3943__auto____7947
        }else {
          var or__3943__auto____7948 = p2.call(null, x);
          if(cljs.core.truth_(or__3943__auto____7948)) {
            return or__3943__auto____7948
          }else {
            var or__3943__auto____7949 = p3.call(null, x);
            if(cljs.core.truth_(or__3943__auto____7949)) {
              return or__3943__auto____7949
            }else {
              var or__3943__auto____7950 = p1.call(null, y);
              if(cljs.core.truth_(or__3943__auto____7950)) {
                return or__3943__auto____7950
              }else {
                var or__3943__auto____7951 = p2.call(null, y);
                if(cljs.core.truth_(or__3943__auto____7951)) {
                  return or__3943__auto____7951
                }else {
                  return p3.call(null, y)
                }
              }
            }
          }
        }
      };
      var sp3__3 = function(x, y, z) {
        var or__3943__auto____7952 = p1.call(null, x);
        if(cljs.core.truth_(or__3943__auto____7952)) {
          return or__3943__auto____7952
        }else {
          var or__3943__auto____7953 = p2.call(null, x);
          if(cljs.core.truth_(or__3943__auto____7953)) {
            return or__3943__auto____7953
          }else {
            var or__3943__auto____7954 = p3.call(null, x);
            if(cljs.core.truth_(or__3943__auto____7954)) {
              return or__3943__auto____7954
            }else {
              var or__3943__auto____7955 = p1.call(null, y);
              if(cljs.core.truth_(or__3943__auto____7955)) {
                return or__3943__auto____7955
              }else {
                var or__3943__auto____7956 = p2.call(null, y);
                if(cljs.core.truth_(or__3943__auto____7956)) {
                  return or__3943__auto____7956
                }else {
                  var or__3943__auto____7957 = p3.call(null, y);
                  if(cljs.core.truth_(or__3943__auto____7957)) {
                    return or__3943__auto____7957
                  }else {
                    var or__3943__auto____7958 = p1.call(null, z);
                    if(cljs.core.truth_(or__3943__auto____7958)) {
                      return or__3943__auto____7958
                    }else {
                      var or__3943__auto____7959 = p2.call(null, z);
                      if(cljs.core.truth_(or__3943__auto____7959)) {
                        return or__3943__auto____7959
                      }else {
                        return p3.call(null, z)
                      }
                    }
                  }
                }
              }
            }
          }
        }
      };
      var sp3__4 = function() {
        var G__7976__delegate = function(x, y, z, args) {
          var or__3943__auto____7960 = sp3.call(null, x, y, z);
          if(cljs.core.truth_(or__3943__auto____7960)) {
            return or__3943__auto____7960
          }else {
            return cljs.core.some.call(null, function(p1__7656_SHARP_) {
              var or__3943__auto____7961 = p1.call(null, p1__7656_SHARP_);
              if(cljs.core.truth_(or__3943__auto____7961)) {
                return or__3943__auto____7961
              }else {
                var or__3943__auto____7962 = p2.call(null, p1__7656_SHARP_);
                if(cljs.core.truth_(or__3943__auto____7962)) {
                  return or__3943__auto____7962
                }else {
                  return p3.call(null, p1__7656_SHARP_)
                }
              }
            }, args)
          }
        };
        var G__7976 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7976__delegate.call(this, x, y, z, args)
        };
        G__7976.cljs$lang$maxFixedArity = 3;
        G__7976.cljs$lang$applyTo = function(arglist__7977) {
          var x = cljs.core.first(arglist__7977);
          var y = cljs.core.first(cljs.core.next(arglist__7977));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7977)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7977)));
          return G__7976__delegate(x, y, z, args)
        };
        G__7976.cljs$lang$arity$variadic = G__7976__delegate;
        return G__7976
      }();
      sp3 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp3__0.call(this);
          case 1:
            return sp3__1.call(this, x);
          case 2:
            return sp3__2.call(this, x, y);
          case 3:
            return sp3__3.call(this, x, y, z);
          default:
            return sp3__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp3.cljs$lang$maxFixedArity = 3;
      sp3.cljs$lang$applyTo = sp3__4.cljs$lang$applyTo;
      sp3.cljs$lang$arity$0 = sp3__0;
      sp3.cljs$lang$arity$1 = sp3__1;
      sp3.cljs$lang$arity$2 = sp3__2;
      sp3.cljs$lang$arity$3 = sp3__3;
      sp3.cljs$lang$arity$variadic = sp3__4.cljs$lang$arity$variadic;
      return sp3
    }()
  };
  var some_fn__4 = function() {
    var G__7978__delegate = function(p1, p2, p3, ps) {
      var ps__7963 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var spn = null;
        var spn__0 = function() {
          return null
        };
        var spn__1 = function(x) {
          return cljs.core.some.call(null, function(p1__7657_SHARP_) {
            return p1__7657_SHARP_.call(null, x)
          }, ps__7963)
        };
        var spn__2 = function(x, y) {
          return cljs.core.some.call(null, function(p1__7658_SHARP_) {
            var or__3943__auto____7968 = p1__7658_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3943__auto____7968)) {
              return or__3943__auto____7968
            }else {
              return p1__7658_SHARP_.call(null, y)
            }
          }, ps__7963)
        };
        var spn__3 = function(x, y, z) {
          return cljs.core.some.call(null, function(p1__7659_SHARP_) {
            var or__3943__auto____7969 = p1__7659_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3943__auto____7969)) {
              return or__3943__auto____7969
            }else {
              var or__3943__auto____7970 = p1__7659_SHARP_.call(null, y);
              if(cljs.core.truth_(or__3943__auto____7970)) {
                return or__3943__auto____7970
              }else {
                return p1__7659_SHARP_.call(null, z)
              }
            }
          }, ps__7963)
        };
        var spn__4 = function() {
          var G__7979__delegate = function(x, y, z, args) {
            var or__3943__auto____7971 = spn.call(null, x, y, z);
            if(cljs.core.truth_(or__3943__auto____7971)) {
              return or__3943__auto____7971
            }else {
              return cljs.core.some.call(null, function(p1__7660_SHARP_) {
                return cljs.core.some.call(null, p1__7660_SHARP_, args)
              }, ps__7963)
            }
          };
          var G__7979 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__7979__delegate.call(this, x, y, z, args)
          };
          G__7979.cljs$lang$maxFixedArity = 3;
          G__7979.cljs$lang$applyTo = function(arglist__7980) {
            var x = cljs.core.first(arglist__7980);
            var y = cljs.core.first(cljs.core.next(arglist__7980));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7980)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7980)));
            return G__7979__delegate(x, y, z, args)
          };
          G__7979.cljs$lang$arity$variadic = G__7979__delegate;
          return G__7979
        }();
        spn = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return spn__0.call(this);
            case 1:
              return spn__1.call(this, x);
            case 2:
              return spn__2.call(this, x, y);
            case 3:
              return spn__3.call(this, x, y, z);
            default:
              return spn__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        spn.cljs$lang$maxFixedArity = 3;
        spn.cljs$lang$applyTo = spn__4.cljs$lang$applyTo;
        spn.cljs$lang$arity$0 = spn__0;
        spn.cljs$lang$arity$1 = spn__1;
        spn.cljs$lang$arity$2 = spn__2;
        spn.cljs$lang$arity$3 = spn__3;
        spn.cljs$lang$arity$variadic = spn__4.cljs$lang$arity$variadic;
        return spn
      }()
    };
    var G__7978 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__7978__delegate.call(this, p1, p2, p3, ps)
    };
    G__7978.cljs$lang$maxFixedArity = 3;
    G__7978.cljs$lang$applyTo = function(arglist__7981) {
      var p1 = cljs.core.first(arglist__7981);
      var p2 = cljs.core.first(cljs.core.next(arglist__7981));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7981)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7981)));
      return G__7978__delegate(p1, p2, p3, ps)
    };
    G__7978.cljs$lang$arity$variadic = G__7978__delegate;
    return G__7978
  }();
  some_fn = function(p1, p2, p3, var_args) {
    var ps = var_args;
    switch(arguments.length) {
      case 1:
        return some_fn__1.call(this, p1);
      case 2:
        return some_fn__2.call(this, p1, p2);
      case 3:
        return some_fn__3.call(this, p1, p2, p3);
      default:
        return some_fn__4.cljs$lang$arity$variadic(p1, p2, p3, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  some_fn.cljs$lang$maxFixedArity = 3;
  some_fn.cljs$lang$applyTo = some_fn__4.cljs$lang$applyTo;
  some_fn.cljs$lang$arity$1 = some_fn__1;
  some_fn.cljs$lang$arity$2 = some_fn__2;
  some_fn.cljs$lang$arity$3 = some_fn__3;
  some_fn.cljs$lang$arity$variadic = some_fn__4.cljs$lang$arity$variadic;
  return some_fn
}();
cljs.core.map = function() {
  var map = null;
  var map__2 = function(f, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__4092__auto____8000 = cljs.core.seq.call(null, coll);
      if(temp__4092__auto____8000) {
        var s__8001 = temp__4092__auto____8000;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__8001)) {
          var c__8002 = cljs.core.chunk_first.call(null, s__8001);
          var size__8003 = cljs.core.count.call(null, c__8002);
          var b__8004 = cljs.core.chunk_buffer.call(null, size__8003);
          var n__2468__auto____8005 = size__8003;
          var i__8006 = 0;
          while(true) {
            if(i__8006 < n__2468__auto____8005) {
              cljs.core.chunk_append.call(null, b__8004, f.call(null, cljs.core._nth.call(null, c__8002, i__8006)));
              var G__8018 = i__8006 + 1;
              i__8006 = G__8018;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__8004), map.call(null, f, cljs.core.chunk_rest.call(null, s__8001)))
        }else {
          return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s__8001)), map.call(null, f, cljs.core.rest.call(null, s__8001)))
        }
      }else {
        return null
      }
    }, null)
  };
  var map__3 = function(f, c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__8007 = cljs.core.seq.call(null, c1);
      var s2__8008 = cljs.core.seq.call(null, c2);
      if(function() {
        var and__3941__auto____8009 = s1__8007;
        if(and__3941__auto____8009) {
          return s2__8008
        }else {
          return and__3941__auto____8009
        }
      }()) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__8007), cljs.core.first.call(null, s2__8008)), map.call(null, f, cljs.core.rest.call(null, s1__8007), cljs.core.rest.call(null, s2__8008)))
      }else {
        return null
      }
    }, null)
  };
  var map__4 = function(f, c1, c2, c3) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__8010 = cljs.core.seq.call(null, c1);
      var s2__8011 = cljs.core.seq.call(null, c2);
      var s3__8012 = cljs.core.seq.call(null, c3);
      if(function() {
        var and__3941__auto____8013 = s1__8010;
        if(and__3941__auto____8013) {
          var and__3941__auto____8014 = s2__8011;
          if(and__3941__auto____8014) {
            return s3__8012
          }else {
            return and__3941__auto____8014
          }
        }else {
          return and__3941__auto____8013
        }
      }()) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__8010), cljs.core.first.call(null, s2__8011), cljs.core.first.call(null, s3__8012)), map.call(null, f, cljs.core.rest.call(null, s1__8010), cljs.core.rest.call(null, s2__8011), cljs.core.rest.call(null, s3__8012)))
      }else {
        return null
      }
    }, null)
  };
  var map__5 = function() {
    var G__8019__delegate = function(f, c1, c2, c3, colls) {
      var step__8017 = function step(cs) {
        return new cljs.core.LazySeq(null, false, function() {
          var ss__8016 = map.call(null, cljs.core.seq, cs);
          if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__8016)) {
            return cljs.core.cons.call(null, map.call(null, cljs.core.first, ss__8016), step.call(null, map.call(null, cljs.core.rest, ss__8016)))
          }else {
            return null
          }
        }, null)
      };
      return map.call(null, function(p1__7821_SHARP_) {
        return cljs.core.apply.call(null, f, p1__7821_SHARP_)
      }, step__8017.call(null, cljs.core.conj.call(null, colls, c3, c2, c1)))
    };
    var G__8019 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__8019__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__8019.cljs$lang$maxFixedArity = 4;
    G__8019.cljs$lang$applyTo = function(arglist__8020) {
      var f = cljs.core.first(arglist__8020);
      var c1 = cljs.core.first(cljs.core.next(arglist__8020));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8020)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8020))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8020))));
      return G__8019__delegate(f, c1, c2, c3, colls)
    };
    G__8019.cljs$lang$arity$variadic = G__8019__delegate;
    return G__8019
  }();
  map = function(f, c1, c2, c3, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return map__2.call(this, f, c1);
      case 3:
        return map__3.call(this, f, c1, c2);
      case 4:
        return map__4.call(this, f, c1, c2, c3);
      default:
        return map__5.cljs$lang$arity$variadic(f, c1, c2, c3, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  map.cljs$lang$maxFixedArity = 4;
  map.cljs$lang$applyTo = map__5.cljs$lang$applyTo;
  map.cljs$lang$arity$2 = map__2;
  map.cljs$lang$arity$3 = map__3;
  map.cljs$lang$arity$4 = map__4;
  map.cljs$lang$arity$variadic = map__5.cljs$lang$arity$variadic;
  return map
}();
cljs.core.take = function take(n, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    if(n > 0) {
      var temp__4092__auto____8023 = cljs.core.seq.call(null, coll);
      if(temp__4092__auto____8023) {
        var s__8024 = temp__4092__auto____8023;
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__8024), take.call(null, n - 1, cljs.core.rest.call(null, s__8024)))
      }else {
        return null
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.drop = function drop(n, coll) {
  var step__8030 = function(n, coll) {
    while(true) {
      var s__8028 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3941__auto____8029 = n > 0;
        if(and__3941__auto____8029) {
          return s__8028
        }else {
          return and__3941__auto____8029
        }
      }())) {
        var G__8031 = n - 1;
        var G__8032 = cljs.core.rest.call(null, s__8028);
        n = G__8031;
        coll = G__8032;
        continue
      }else {
        return s__8028
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__8030.call(null, n, coll)
  }, null)
};
cljs.core.drop_last = function() {
  var drop_last = null;
  var drop_last__1 = function(s) {
    return drop_last.call(null, 1, s)
  };
  var drop_last__2 = function(n, s) {
    return cljs.core.map.call(null, function(x, _) {
      return x
    }, s, cljs.core.drop.call(null, n, s))
  };
  drop_last = function(n, s) {
    switch(arguments.length) {
      case 1:
        return drop_last__1.call(this, n);
      case 2:
        return drop_last__2.call(this, n, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  drop_last.cljs$lang$arity$1 = drop_last__1;
  drop_last.cljs$lang$arity$2 = drop_last__2;
  return drop_last
}();
cljs.core.take_last = function take_last(n, coll) {
  var s__8035 = cljs.core.seq.call(null, coll);
  var lead__8036 = cljs.core.seq.call(null, cljs.core.drop.call(null, n, coll));
  while(true) {
    if(lead__8036) {
      var G__8037 = cljs.core.next.call(null, s__8035);
      var G__8038 = cljs.core.next.call(null, lead__8036);
      s__8035 = G__8037;
      lead__8036 = G__8038;
      continue
    }else {
      return s__8035
    }
    break
  }
};
cljs.core.drop_while = function drop_while(pred, coll) {
  var step__8044 = function(pred, coll) {
    while(true) {
      var s__8042 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3941__auto____8043 = s__8042;
        if(and__3941__auto____8043) {
          return pred.call(null, cljs.core.first.call(null, s__8042))
        }else {
          return and__3941__auto____8043
        }
      }())) {
        var G__8045 = pred;
        var G__8046 = cljs.core.rest.call(null, s__8042);
        pred = G__8045;
        coll = G__8046;
        continue
      }else {
        return s__8042
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__8044.call(null, pred, coll)
  }, null)
};
cljs.core.cycle = function cycle(coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__4092__auto____8049 = cljs.core.seq.call(null, coll);
    if(temp__4092__auto____8049) {
      var s__8050 = temp__4092__auto____8049;
      return cljs.core.concat.call(null, s__8050, cycle.call(null, s__8050))
    }else {
      return null
    }
  }, null)
};
cljs.core.split_at = function split_at(n, coll) {
  return cljs.core.PersistentVector.fromArray([cljs.core.take.call(null, n, coll), cljs.core.drop.call(null, n, coll)], true)
};
cljs.core.repeat = function() {
  var repeat = null;
  var repeat__1 = function(x) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, x, repeat.call(null, x))
    }, null)
  };
  var repeat__2 = function(n, x) {
    return cljs.core.take.call(null, n, repeat.call(null, x))
  };
  repeat = function(n, x) {
    switch(arguments.length) {
      case 1:
        return repeat__1.call(this, n);
      case 2:
        return repeat__2.call(this, n, x)
    }
    throw"Invalid arity: " + arguments.length;
  };
  repeat.cljs$lang$arity$1 = repeat__1;
  repeat.cljs$lang$arity$2 = repeat__2;
  return repeat
}();
cljs.core.replicate = function replicate(n, x) {
  return cljs.core.take.call(null, n, cljs.core.repeat.call(null, x))
};
cljs.core.repeatedly = function() {
  var repeatedly = null;
  var repeatedly__1 = function(f) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, f.call(null), repeatedly.call(null, f))
    }, null)
  };
  var repeatedly__2 = function(n, f) {
    return cljs.core.take.call(null, n, repeatedly.call(null, f))
  };
  repeatedly = function(n, f) {
    switch(arguments.length) {
      case 1:
        return repeatedly__1.call(this, n);
      case 2:
        return repeatedly__2.call(this, n, f)
    }
    throw"Invalid arity: " + arguments.length;
  };
  repeatedly.cljs$lang$arity$1 = repeatedly__1;
  repeatedly.cljs$lang$arity$2 = repeatedly__2;
  return repeatedly
}();
cljs.core.iterate = function iterate(f, x) {
  return cljs.core.cons.call(null, x, new cljs.core.LazySeq(null, false, function() {
    return iterate.call(null, f, f.call(null, x))
  }, null))
};
cljs.core.interleave = function() {
  var interleave = null;
  var interleave__2 = function(c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__8055 = cljs.core.seq.call(null, c1);
      var s2__8056 = cljs.core.seq.call(null, c2);
      if(function() {
        var and__3941__auto____8057 = s1__8055;
        if(and__3941__auto____8057) {
          return s2__8056
        }else {
          return and__3941__auto____8057
        }
      }()) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s1__8055), cljs.core.cons.call(null, cljs.core.first.call(null, s2__8056), interleave.call(null, cljs.core.rest.call(null, s1__8055), cljs.core.rest.call(null, s2__8056))))
      }else {
        return null
      }
    }, null)
  };
  var interleave__3 = function() {
    var G__8059__delegate = function(c1, c2, colls) {
      return new cljs.core.LazySeq(null, false, function() {
        var ss__8058 = cljs.core.map.call(null, cljs.core.seq, cljs.core.conj.call(null, colls, c2, c1));
        if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__8058)) {
          return cljs.core.concat.call(null, cljs.core.map.call(null, cljs.core.first, ss__8058), cljs.core.apply.call(null, interleave, cljs.core.map.call(null, cljs.core.rest, ss__8058)))
        }else {
          return null
        }
      }, null)
    };
    var G__8059 = function(c1, c2, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__8059__delegate.call(this, c1, c2, colls)
    };
    G__8059.cljs$lang$maxFixedArity = 2;
    G__8059.cljs$lang$applyTo = function(arglist__8060) {
      var c1 = cljs.core.first(arglist__8060);
      var c2 = cljs.core.first(cljs.core.next(arglist__8060));
      var colls = cljs.core.rest(cljs.core.next(arglist__8060));
      return G__8059__delegate(c1, c2, colls)
    };
    G__8059.cljs$lang$arity$variadic = G__8059__delegate;
    return G__8059
  }();
  interleave = function(c1, c2, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return interleave__2.call(this, c1, c2);
      default:
        return interleave__3.cljs$lang$arity$variadic(c1, c2, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  interleave.cljs$lang$maxFixedArity = 2;
  interleave.cljs$lang$applyTo = interleave__3.cljs$lang$applyTo;
  interleave.cljs$lang$arity$2 = interleave__2;
  interleave.cljs$lang$arity$variadic = interleave__3.cljs$lang$arity$variadic;
  return interleave
}();
cljs.core.interpose = function interpose(sep, coll) {
  return cljs.core.drop.call(null, 1, cljs.core.interleave.call(null, cljs.core.repeat.call(null, sep), coll))
};
cljs.core.flatten1 = function flatten1(colls) {
  var cat__8070 = function cat(coll, colls) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__4090__auto____8068 = cljs.core.seq.call(null, coll);
      if(temp__4090__auto____8068) {
        var coll__8069 = temp__4090__auto____8068;
        return cljs.core.cons.call(null, cljs.core.first.call(null, coll__8069), cat.call(null, cljs.core.rest.call(null, coll__8069), colls))
      }else {
        if(cljs.core.seq.call(null, colls)) {
          return cat.call(null, cljs.core.first.call(null, colls), cljs.core.rest.call(null, colls))
        }else {
          return null
        }
      }
    }, null)
  };
  return cat__8070.call(null, null, colls)
};
cljs.core.mapcat = function() {
  var mapcat = null;
  var mapcat__2 = function(f, coll) {
    return cljs.core.flatten1.call(null, cljs.core.map.call(null, f, coll))
  };
  var mapcat__3 = function() {
    var G__8071__delegate = function(f, coll, colls) {
      return cljs.core.flatten1.call(null, cljs.core.apply.call(null, cljs.core.map, f, coll, colls))
    };
    var G__8071 = function(f, coll, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__8071__delegate.call(this, f, coll, colls)
    };
    G__8071.cljs$lang$maxFixedArity = 2;
    G__8071.cljs$lang$applyTo = function(arglist__8072) {
      var f = cljs.core.first(arglist__8072);
      var coll = cljs.core.first(cljs.core.next(arglist__8072));
      var colls = cljs.core.rest(cljs.core.next(arglist__8072));
      return G__8071__delegate(f, coll, colls)
    };
    G__8071.cljs$lang$arity$variadic = G__8071__delegate;
    return G__8071
  }();
  mapcat = function(f, coll, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return mapcat__2.call(this, f, coll);
      default:
        return mapcat__3.cljs$lang$arity$variadic(f, coll, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  mapcat.cljs$lang$maxFixedArity = 2;
  mapcat.cljs$lang$applyTo = mapcat__3.cljs$lang$applyTo;
  mapcat.cljs$lang$arity$2 = mapcat__2;
  mapcat.cljs$lang$arity$variadic = mapcat__3.cljs$lang$arity$variadic;
  return mapcat
}();
cljs.core.filter = function filter(pred, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__4092__auto____8082 = cljs.core.seq.call(null, coll);
    if(temp__4092__auto____8082) {
      var s__8083 = temp__4092__auto____8082;
      if(cljs.core.chunked_seq_QMARK_.call(null, s__8083)) {
        var c__8084 = cljs.core.chunk_first.call(null, s__8083);
        var size__8085 = cljs.core.count.call(null, c__8084);
        var b__8086 = cljs.core.chunk_buffer.call(null, size__8085);
        var n__2468__auto____8087 = size__8085;
        var i__8088 = 0;
        while(true) {
          if(i__8088 < n__2468__auto____8087) {
            if(cljs.core.truth_(pred.call(null, cljs.core._nth.call(null, c__8084, i__8088)))) {
              cljs.core.chunk_append.call(null, b__8086, cljs.core._nth.call(null, c__8084, i__8088))
            }else {
            }
            var G__8091 = i__8088 + 1;
            i__8088 = G__8091;
            continue
          }else {
          }
          break
        }
        return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__8086), filter.call(null, pred, cljs.core.chunk_rest.call(null, s__8083)))
      }else {
        var f__8089 = cljs.core.first.call(null, s__8083);
        var r__8090 = cljs.core.rest.call(null, s__8083);
        if(cljs.core.truth_(pred.call(null, f__8089))) {
          return cljs.core.cons.call(null, f__8089, filter.call(null, pred, r__8090))
        }else {
          return filter.call(null, pred, r__8090)
        }
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.remove = function remove(pred, coll) {
  return cljs.core.filter.call(null, cljs.core.complement.call(null, pred), coll)
};
cljs.core.tree_seq = function tree_seq(branch_QMARK_, children, root) {
  var walk__8094 = function walk(node) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, node, cljs.core.truth_(branch_QMARK_.call(null, node)) ? cljs.core.mapcat.call(null, walk, children.call(null, node)) : null)
    }, null)
  };
  return walk__8094.call(null, root)
};
cljs.core.flatten = function flatten(x) {
  return cljs.core.filter.call(null, function(p1__8092_SHARP_) {
    return!cljs.core.sequential_QMARK_.call(null, p1__8092_SHARP_)
  }, cljs.core.rest.call(null, cljs.core.tree_seq.call(null, cljs.core.sequential_QMARK_, cljs.core.seq, x)))
};
cljs.core.into = function into(to, from) {
  if(function() {
    var G__8098__8099 = to;
    if(G__8098__8099) {
      if(function() {
        var or__3943__auto____8100 = G__8098__8099.cljs$lang$protocol_mask$partition1$ & 1;
        if(or__3943__auto____8100) {
          return or__3943__auto____8100
        }else {
          return G__8098__8099.cljs$core$IEditableCollection$
        }
      }()) {
        return true
      }else {
        if(!G__8098__8099.cljs$lang$protocol_mask$partition1$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__8098__8099)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__8098__8099)
    }
  }()) {
    return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, cljs.core._conj_BANG_, cljs.core.transient$.call(null, to), from))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, to, from)
  }
};
cljs.core.mapv = function() {
  var mapv = null;
  var mapv__2 = function(f, coll) {
    return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, function(v, o) {
      return cljs.core.conj_BANG_.call(null, v, f.call(null, o))
    }, cljs.core.transient$.call(null, cljs.core.PersistentVector.EMPTY), coll))
  };
  var mapv__3 = function(f, c1, c2) {
    return cljs.core.into.call(null, cljs.core.PersistentVector.EMPTY, cljs.core.map.call(null, f, c1, c2))
  };
  var mapv__4 = function(f, c1, c2, c3) {
    return cljs.core.into.call(null, cljs.core.PersistentVector.EMPTY, cljs.core.map.call(null, f, c1, c2, c3))
  };
  var mapv__5 = function() {
    var G__8101__delegate = function(f, c1, c2, c3, colls) {
      return cljs.core.into.call(null, cljs.core.PersistentVector.EMPTY, cljs.core.apply.call(null, cljs.core.map, f, c1, c2, c3, colls))
    };
    var G__8101 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__8101__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__8101.cljs$lang$maxFixedArity = 4;
    G__8101.cljs$lang$applyTo = function(arglist__8102) {
      var f = cljs.core.first(arglist__8102);
      var c1 = cljs.core.first(cljs.core.next(arglist__8102));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8102)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8102))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8102))));
      return G__8101__delegate(f, c1, c2, c3, colls)
    };
    G__8101.cljs$lang$arity$variadic = G__8101__delegate;
    return G__8101
  }();
  mapv = function(f, c1, c2, c3, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return mapv__2.call(this, f, c1);
      case 3:
        return mapv__3.call(this, f, c1, c2);
      case 4:
        return mapv__4.call(this, f, c1, c2, c3);
      default:
        return mapv__5.cljs$lang$arity$variadic(f, c1, c2, c3, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  mapv.cljs$lang$maxFixedArity = 4;
  mapv.cljs$lang$applyTo = mapv__5.cljs$lang$applyTo;
  mapv.cljs$lang$arity$2 = mapv__2;
  mapv.cljs$lang$arity$3 = mapv__3;
  mapv.cljs$lang$arity$4 = mapv__4;
  mapv.cljs$lang$arity$variadic = mapv__5.cljs$lang$arity$variadic;
  return mapv
}();
cljs.core.filterv = function filterv(pred, coll) {
  return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, function(v, o) {
    if(cljs.core.truth_(pred.call(null, o))) {
      return cljs.core.conj_BANG_.call(null, v, o)
    }else {
      return v
    }
  }, cljs.core.transient$.call(null, cljs.core.PersistentVector.EMPTY), coll))
};
cljs.core.partition = function() {
  var partition = null;
  var partition__2 = function(n, coll) {
    return partition.call(null, n, n, coll)
  };
  var partition__3 = function(n, step, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__4092__auto____8109 = cljs.core.seq.call(null, coll);
      if(temp__4092__auto____8109) {
        var s__8110 = temp__4092__auto____8109;
        var p__8111 = cljs.core.take.call(null, n, s__8110);
        if(n === cljs.core.count.call(null, p__8111)) {
          return cljs.core.cons.call(null, p__8111, partition.call(null, n, step, cljs.core.drop.call(null, step, s__8110)))
        }else {
          return null
        }
      }else {
        return null
      }
    }, null)
  };
  var partition__4 = function(n, step, pad, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__4092__auto____8112 = cljs.core.seq.call(null, coll);
      if(temp__4092__auto____8112) {
        var s__8113 = temp__4092__auto____8112;
        var p__8114 = cljs.core.take.call(null, n, s__8113);
        if(n === cljs.core.count.call(null, p__8114)) {
          return cljs.core.cons.call(null, p__8114, partition.call(null, n, step, pad, cljs.core.drop.call(null, step, s__8113)))
        }else {
          return cljs.core.list.call(null, cljs.core.take.call(null, n, cljs.core.concat.call(null, p__8114, pad)))
        }
      }else {
        return null
      }
    }, null)
  };
  partition = function(n, step, pad, coll) {
    switch(arguments.length) {
      case 2:
        return partition__2.call(this, n, step);
      case 3:
        return partition__3.call(this, n, step, pad);
      case 4:
        return partition__4.call(this, n, step, pad, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  partition.cljs$lang$arity$2 = partition__2;
  partition.cljs$lang$arity$3 = partition__3;
  partition.cljs$lang$arity$4 = partition__4;
  return partition
}();
cljs.core.get_in = function() {
  var get_in = null;
  var get_in__2 = function(m, ks) {
    return cljs.core.reduce.call(null, cljs.core.get, m, ks)
  };
  var get_in__3 = function(m, ks, not_found) {
    var sentinel__8119 = cljs.core.lookup_sentinel;
    var m__8120 = m;
    var ks__8121 = cljs.core.seq.call(null, ks);
    while(true) {
      if(ks__8121) {
        var m__8122 = cljs.core._lookup.call(null, m__8120, cljs.core.first.call(null, ks__8121), sentinel__8119);
        if(sentinel__8119 === m__8122) {
          return not_found
        }else {
          var G__8123 = sentinel__8119;
          var G__8124 = m__8122;
          var G__8125 = cljs.core.next.call(null, ks__8121);
          sentinel__8119 = G__8123;
          m__8120 = G__8124;
          ks__8121 = G__8125;
          continue
        }
      }else {
        return m__8120
      }
      break
    }
  };
  get_in = function(m, ks, not_found) {
    switch(arguments.length) {
      case 2:
        return get_in__2.call(this, m, ks);
      case 3:
        return get_in__3.call(this, m, ks, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  get_in.cljs$lang$arity$2 = get_in__2;
  get_in.cljs$lang$arity$3 = get_in__3;
  return get_in
}();
cljs.core.assoc_in = function assoc_in(m, p__8126, v) {
  var vec__8131__8132 = p__8126;
  var k__8133 = cljs.core.nth.call(null, vec__8131__8132, 0, null);
  var ks__8134 = cljs.core.nthnext.call(null, vec__8131__8132, 1);
  if(cljs.core.truth_(ks__8134)) {
    return cljs.core.assoc.call(null, m, k__8133, assoc_in.call(null, cljs.core._lookup.call(null, m, k__8133, null), ks__8134, v))
  }else {
    return cljs.core.assoc.call(null, m, k__8133, v)
  }
};
cljs.core.update_in = function() {
  var update_in__delegate = function(m, p__8135, f, args) {
    var vec__8140__8141 = p__8135;
    var k__8142 = cljs.core.nth.call(null, vec__8140__8141, 0, null);
    var ks__8143 = cljs.core.nthnext.call(null, vec__8140__8141, 1);
    if(cljs.core.truth_(ks__8143)) {
      return cljs.core.assoc.call(null, m, k__8142, cljs.core.apply.call(null, update_in, cljs.core._lookup.call(null, m, k__8142, null), ks__8143, f, args))
    }else {
      return cljs.core.assoc.call(null, m, k__8142, cljs.core.apply.call(null, f, cljs.core._lookup.call(null, m, k__8142, null), args))
    }
  };
  var update_in = function(m, p__8135, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
    }
    return update_in__delegate.call(this, m, p__8135, f, args)
  };
  update_in.cljs$lang$maxFixedArity = 3;
  update_in.cljs$lang$applyTo = function(arglist__8144) {
    var m = cljs.core.first(arglist__8144);
    var p__8135 = cljs.core.first(cljs.core.next(arglist__8144));
    var f = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8144)));
    var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8144)));
    return update_in__delegate(m, p__8135, f, args)
  };
  update_in.cljs$lang$arity$variadic = update_in__delegate;
  return update_in
}();
cljs.core.Vector = function(meta, array, __hash) {
  this.meta = meta;
  this.array = array;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32400159
};
cljs.core.Vector.cljs$lang$type = true;
cljs.core.Vector.cljs$lang$ctorPrSeq = function(this__2250__auto__) {
  return cljs.core.list.call(null, "cljs.core/Vector")
};
cljs.core.Vector.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8147 = this;
  var h__2133__auto____8148 = this__8147.__hash;
  if(!(h__2133__auto____8148 == null)) {
    return h__2133__auto____8148
  }else {
    var h__2133__auto____8149 = cljs.core.hash_coll.call(null, coll);
    this__8147.__hash = h__2133__auto____8149;
    return h__2133__auto____8149
  }
};
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8150 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8151 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.Vector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__8152 = this;
  var new_array__8153 = this__8152.array.slice();
  new_array__8153[k] = v;
  return new cljs.core.Vector(this__8152.meta, new_array__8153, null)
};
cljs.core.Vector.prototype.call = function() {
  var G__8184 = null;
  var G__8184__2 = function(this_sym8154, k) {
    var this__8156 = this;
    var this_sym8154__8157 = this;
    var coll__8158 = this_sym8154__8157;
    return coll__8158.cljs$core$ILookup$_lookup$arity$2(coll__8158, k)
  };
  var G__8184__3 = function(this_sym8155, k, not_found) {
    var this__8156 = this;
    var this_sym8155__8159 = this;
    var coll__8160 = this_sym8155__8159;
    return coll__8160.cljs$core$ILookup$_lookup$arity$3(coll__8160, k, not_found)
  };
  G__8184 = function(this_sym8155, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8184__2.call(this, this_sym8155, k);
      case 3:
        return G__8184__3.call(this, this_sym8155, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8184
}();
cljs.core.Vector.prototype.apply = function(this_sym8145, args8146) {
  var this__8161 = this;
  return this_sym8145.call.apply(this_sym8145, [this_sym8145].concat(args8146.slice()))
};
cljs.core.Vector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8162 = this;
  var new_array__8163 = this__8162.array.slice();
  new_array__8163.push(o);
  return new cljs.core.Vector(this__8162.meta, new_array__8163, null)
};
cljs.core.Vector.prototype.toString = function() {
  var this__8164 = this;
  var this__8165 = this;
  return cljs.core.pr_str.call(null, this__8165)
};
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__8166 = this;
  return cljs.core.ci_reduce.call(null, this__8166.array, f)
};
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__8167 = this;
  return cljs.core.ci_reduce.call(null, this__8167.array, f, start)
};
cljs.core.Vector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8168 = this;
  if(this__8168.array.length > 0) {
    var vector_seq__8169 = function vector_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < this__8168.array.length) {
          return cljs.core.cons.call(null, this__8168.array[i], vector_seq.call(null, i + 1))
        }else {
          return null
        }
      }, null)
    };
    return vector_seq__8169.call(null, 0)
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8170 = this;
  return this__8170.array.length
};
cljs.core.Vector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__8171 = this;
  var count__8172 = this__8171.array.length;
  if(count__8172 > 0) {
    return this__8171.array[count__8172 - 1]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__8173 = this;
  if(this__8173.array.length > 0) {
    var new_array__8174 = this__8173.array.slice();
    new_array__8174.pop();
    return new cljs.core.Vector(this__8173.meta, new_array__8174, null)
  }else {
    throw new Error("Can't pop empty vector");
  }
};
cljs.core.Vector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__8175 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.Vector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8176 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Vector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8177 = this;
  return new cljs.core.Vector(meta, this__8177.array, this__8177.__hash)
};
cljs.core.Vector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8178 = this;
  return this__8178.meta
};
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__8179 = this;
  if(function() {
    var and__3941__auto____8180 = 0 <= n;
    if(and__3941__auto____8180) {
      return n < this__8179.array.length
    }else {
      return and__3941__auto____8180
    }
  }()) {
    return this__8179.array[n]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__8181 = this;
  if(function() {
    var and__3941__auto____8182 = 0 <= n;
    if(and__3941__auto____8182) {
      return n < this__8181.array.length
    }else {
      return and__3941__auto____8182
    }
  }()) {
    return this__8181.array[n]
  }else {
    return not_found
  }
};
cljs.core.Vector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8183 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__8183.meta)
};
cljs.core.Vector;
cljs.core.Vector.EMPTY = new cljs.core.Vector(null, [], 0);
cljs.core.Vector.fromArray = function(xs) {
  return new cljs.core.Vector(null, xs, null)
};
cljs.core.VectorNode = function(edit, arr) {
  this.edit = edit;
  this.arr = arr
};
cljs.core.VectorNode.cljs$lang$type = true;
cljs.core.VectorNode.cljs$lang$ctorPrSeq = function(this__2251__auto__) {
  return cljs.core.list.call(null, "cljs.core/VectorNode")
};
cljs.core.VectorNode;
cljs.core.pv_fresh_node = function pv_fresh_node(edit) {
  return new cljs.core.VectorNode(edit, cljs.core.make_array.call(null, 32))
};
cljs.core.pv_aget = function pv_aget(node, idx) {
  return node.arr[idx]
};
cljs.core.pv_aset = function pv_aset(node, idx, val) {
  return node.arr[idx] = val
};
cljs.core.pv_clone_node = function pv_clone_node(node) {
  return new cljs.core.VectorNode(node.edit, node.arr.slice())
};
cljs.core.tail_off = function tail_off(pv) {
  var cnt__8186 = pv.cnt;
  if(cnt__8186 < 32) {
    return 0
  }else {
    return cnt__8186 - 1 >>> 5 << 5
  }
};
cljs.core.new_path = function new_path(edit, level, node) {
  var ll__8192 = level;
  var ret__8193 = node;
  while(true) {
    if(ll__8192 === 0) {
      return ret__8193
    }else {
      var embed__8194 = ret__8193;
      var r__8195 = cljs.core.pv_fresh_node.call(null, edit);
      var ___8196 = cljs.core.pv_aset.call(null, r__8195, 0, embed__8194);
      var G__8197 = ll__8192 - 5;
      var G__8198 = r__8195;
      ll__8192 = G__8197;
      ret__8193 = G__8198;
      continue
    }
    break
  }
};
cljs.core.push_tail = function push_tail(pv, level, parent, tailnode) {
  var ret__8204 = cljs.core.pv_clone_node.call(null, parent);
  var subidx__8205 = pv.cnt - 1 >>> level & 31;
  if(5 === level) {
    cljs.core.pv_aset.call(null, ret__8204, subidx__8205, tailnode);
    return ret__8204
  }else {
    var child__8206 = cljs.core.pv_aget.call(null, parent, subidx__8205);
    if(!(child__8206 == null)) {
      var node_to_insert__8207 = push_tail.call(null, pv, level - 5, child__8206, tailnode);
      cljs.core.pv_aset.call(null, ret__8204, subidx__8205, node_to_insert__8207);
      return ret__8204
    }else {
      var node_to_insert__8208 = cljs.core.new_path.call(null, null, level - 5, tailnode);
      cljs.core.pv_aset.call(null, ret__8204, subidx__8205, node_to_insert__8208);
      return ret__8204
    }
  }
};
cljs.core.array_for = function array_for(pv, i) {
  if(function() {
    var and__3941__auto____8212 = 0 <= i;
    if(and__3941__auto____8212) {
      return i < pv.cnt
    }else {
      return and__3941__auto____8212
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, pv)) {
      return pv.tail
    }else {
      var node__8213 = pv.root;
      var level__8214 = pv.shift;
      while(true) {
        if(level__8214 > 0) {
          var G__8215 = cljs.core.pv_aget.call(null, node__8213, i >>> level__8214 & 31);
          var G__8216 = level__8214 - 5;
          node__8213 = G__8215;
          level__8214 = G__8216;
          continue
        }else {
          return node__8213.arr
        }
        break
      }
    }
  }else {
    throw new Error([cljs.core.str("No item "), cljs.core.str(i), cljs.core.str(" in vector of length "), cljs.core.str(pv.cnt)].join(""));
  }
};
cljs.core.do_assoc = function do_assoc(pv, level, node, i, val) {
  var ret__8219 = cljs.core.pv_clone_node.call(null, node);
  if(level === 0) {
    cljs.core.pv_aset.call(null, ret__8219, i & 31, val);
    return ret__8219
  }else {
    var subidx__8220 = i >>> level & 31;
    cljs.core.pv_aset.call(null, ret__8219, subidx__8220, do_assoc.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx__8220), i, val));
    return ret__8219
  }
};
cljs.core.pop_tail = function pop_tail(pv, level, node) {
  var subidx__8226 = pv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__8227 = pop_tail.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx__8226));
    if(function() {
      var and__3941__auto____8228 = new_child__8227 == null;
      if(and__3941__auto____8228) {
        return subidx__8226 === 0
      }else {
        return and__3941__auto____8228
      }
    }()) {
      return null
    }else {
      var ret__8229 = cljs.core.pv_clone_node.call(null, node);
      cljs.core.pv_aset.call(null, ret__8229, subidx__8226, new_child__8227);
      return ret__8229
    }
  }else {
    if(subidx__8226 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        var ret__8230 = cljs.core.pv_clone_node.call(null, node);
        cljs.core.pv_aset.call(null, ret__8230, subidx__8226, null);
        return ret__8230
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentVector = function(meta, cnt, shift, root, tail, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.shift = shift;
  this.root = root;
  this.tail = tail;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 167668511
};
cljs.core.PersistentVector.cljs$lang$type = true;
cljs.core.PersistentVector.cljs$lang$ctorPrSeq = function(this__2250__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentVector")
};
cljs.core.PersistentVector.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__8233 = this;
  return new cljs.core.TransientVector(this__8233.cnt, this__8233.shift, cljs.core.tv_editable_root.call(null, this__8233.root), cljs.core.tv_editable_tail.call(null, this__8233.tail))
};
cljs.core.PersistentVector.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8234 = this;
  var h__2133__auto____8235 = this__8234.__hash;
  if(!(h__2133__auto____8235 == null)) {
    return h__2133__auto____8235
  }else {
    var h__2133__auto____8236 = cljs.core.hash_coll.call(null, coll);
    this__8234.__hash = h__2133__auto____8236;
    return h__2133__auto____8236
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8237 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8238 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.PersistentVector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__8239 = this;
  if(function() {
    var and__3941__auto____8240 = 0 <= k;
    if(and__3941__auto____8240) {
      return k < this__8239.cnt
    }else {
      return and__3941__auto____8240
    }
  }()) {
    if(cljs.core.tail_off.call(null, coll) <= k) {
      var new_tail__8241 = this__8239.tail.slice();
      new_tail__8241[k & 31] = v;
      return new cljs.core.PersistentVector(this__8239.meta, this__8239.cnt, this__8239.shift, this__8239.root, new_tail__8241, null)
    }else {
      return new cljs.core.PersistentVector(this__8239.meta, this__8239.cnt, this__8239.shift, cljs.core.do_assoc.call(null, coll, this__8239.shift, this__8239.root, k, v), this__8239.tail, null)
    }
  }else {
    if(k === this__8239.cnt) {
      return coll.cljs$core$ICollection$_conj$arity$2(coll, v)
    }else {
      if("\ufdd0'else") {
        throw new Error([cljs.core.str("Index "), cljs.core.str(k), cljs.core.str(" out of bounds  [0,"), cljs.core.str(this__8239.cnt), cljs.core.str("]")].join(""));
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentVector.prototype.call = function() {
  var G__8289 = null;
  var G__8289__2 = function(this_sym8242, k) {
    var this__8244 = this;
    var this_sym8242__8245 = this;
    var coll__8246 = this_sym8242__8245;
    return coll__8246.cljs$core$ILookup$_lookup$arity$2(coll__8246, k)
  };
  var G__8289__3 = function(this_sym8243, k, not_found) {
    var this__8244 = this;
    var this_sym8243__8247 = this;
    var coll__8248 = this_sym8243__8247;
    return coll__8248.cljs$core$ILookup$_lookup$arity$3(coll__8248, k, not_found)
  };
  G__8289 = function(this_sym8243, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8289__2.call(this, this_sym8243, k);
      case 3:
        return G__8289__3.call(this, this_sym8243, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8289
}();
cljs.core.PersistentVector.prototype.apply = function(this_sym8231, args8232) {
  var this__8249 = this;
  return this_sym8231.call.apply(this_sym8231, [this_sym8231].concat(args8232.slice()))
};
cljs.core.PersistentVector.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(v, f, init) {
  var this__8250 = this;
  var step_init__8251 = [0, init];
  var i__8252 = 0;
  while(true) {
    if(i__8252 < this__8250.cnt) {
      var arr__8253 = cljs.core.array_for.call(null, v, i__8252);
      var len__8254 = arr__8253.length;
      var init__8258 = function() {
        var j__8255 = 0;
        var init__8256 = step_init__8251[1];
        while(true) {
          if(j__8255 < len__8254) {
            var init__8257 = f.call(null, init__8256, j__8255 + i__8252, arr__8253[j__8255]);
            if(cljs.core.reduced_QMARK_.call(null, init__8257)) {
              return init__8257
            }else {
              var G__8290 = j__8255 + 1;
              var G__8291 = init__8257;
              j__8255 = G__8290;
              init__8256 = G__8291;
              continue
            }
          }else {
            step_init__8251[0] = len__8254;
            step_init__8251[1] = init__8256;
            return init__8256
          }
          break
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__8258)) {
        return cljs.core.deref.call(null, init__8258)
      }else {
        var G__8292 = i__8252 + step_init__8251[0];
        i__8252 = G__8292;
        continue
      }
    }else {
      return step_init__8251[1]
    }
    break
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8259 = this;
  if(this__8259.cnt - cljs.core.tail_off.call(null, coll) < 32) {
    var new_tail__8260 = this__8259.tail.slice();
    new_tail__8260.push(o);
    return new cljs.core.PersistentVector(this__8259.meta, this__8259.cnt + 1, this__8259.shift, this__8259.root, new_tail__8260, null)
  }else {
    var root_overflow_QMARK___8261 = this__8259.cnt >>> 5 > 1 << this__8259.shift;
    var new_shift__8262 = root_overflow_QMARK___8261 ? this__8259.shift + 5 : this__8259.shift;
    var new_root__8264 = root_overflow_QMARK___8261 ? function() {
      var n_r__8263 = cljs.core.pv_fresh_node.call(null, null);
      cljs.core.pv_aset.call(null, n_r__8263, 0, this__8259.root);
      cljs.core.pv_aset.call(null, n_r__8263, 1, cljs.core.new_path.call(null, null, this__8259.shift, new cljs.core.VectorNode(null, this__8259.tail)));
      return n_r__8263
    }() : cljs.core.push_tail.call(null, coll, this__8259.shift, this__8259.root, new cljs.core.VectorNode(null, this__8259.tail));
    return new cljs.core.PersistentVector(this__8259.meta, this__8259.cnt + 1, new_shift__8262, new_root__8264, [o], null)
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__8265 = this;
  if(this__8265.cnt > 0) {
    return new cljs.core.RSeq(coll, this__8265.cnt - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_key$arity$1 = function(coll) {
  var this__8266 = this;
  return coll.cljs$core$IIndexed$_nth$arity$2(coll, 0)
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_val$arity$1 = function(coll) {
  var this__8267 = this;
  return coll.cljs$core$IIndexed$_nth$arity$2(coll, 1)
};
cljs.core.PersistentVector.prototype.toString = function() {
  var this__8268 = this;
  var this__8269 = this;
  return cljs.core.pr_str.call(null, this__8269)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__8270 = this;
  return cljs.core.ci_reduce.call(null, v, f)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__8271 = this;
  return cljs.core.ci_reduce.call(null, v, f, start)
};
cljs.core.PersistentVector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8272 = this;
  if(this__8272.cnt === 0) {
    return null
  }else {
    return cljs.core.chunked_seq.call(null, coll, 0, 0)
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8273 = this;
  return this__8273.cnt
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__8274 = this;
  if(this__8274.cnt > 0) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, this__8274.cnt - 1)
  }else {
    return null
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__8275 = this;
  if(this__8275.cnt === 0) {
    throw new Error("Can't pop empty vector");
  }else {
    if(1 === this__8275.cnt) {
      return cljs.core._with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__8275.meta)
    }else {
      if(1 < this__8275.cnt - cljs.core.tail_off.call(null, coll)) {
        return new cljs.core.PersistentVector(this__8275.meta, this__8275.cnt - 1, this__8275.shift, this__8275.root, this__8275.tail.slice(0, -1), null)
      }else {
        if("\ufdd0'else") {
          var new_tail__8276 = cljs.core.array_for.call(null, coll, this__8275.cnt - 2);
          var nr__8277 = cljs.core.pop_tail.call(null, coll, this__8275.shift, this__8275.root);
          var new_root__8278 = nr__8277 == null ? cljs.core.PersistentVector.EMPTY_NODE : nr__8277;
          var cnt_1__8279 = this__8275.cnt - 1;
          if(function() {
            var and__3941__auto____8280 = 5 < this__8275.shift;
            if(and__3941__auto____8280) {
              return cljs.core.pv_aget.call(null, new_root__8278, 1) == null
            }else {
              return and__3941__auto____8280
            }
          }()) {
            return new cljs.core.PersistentVector(this__8275.meta, cnt_1__8279, this__8275.shift - 5, cljs.core.pv_aget.call(null, new_root__8278, 0), new_tail__8276, null)
          }else {
            return new cljs.core.PersistentVector(this__8275.meta, cnt_1__8279, this__8275.shift, new_root__8278, new_tail__8276, null)
          }
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__8281 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.PersistentVector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8282 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentVector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8283 = this;
  return new cljs.core.PersistentVector(meta, this__8283.cnt, this__8283.shift, this__8283.root, this__8283.tail, this__8283.__hash)
};
cljs.core.PersistentVector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8284 = this;
  return this__8284.meta
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__8285 = this;
  return cljs.core.array_for.call(null, coll, n)[n & 31]
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__8286 = this;
  if(function() {
    var and__3941__auto____8287 = 0 <= n;
    if(and__3941__auto____8287) {
      return n < this__8286.cnt
    }else {
      return and__3941__auto____8287
    }
  }()) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
  }else {
    return not_found
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8288 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__8288.meta)
};
cljs.core.PersistentVector;
cljs.core.PersistentVector.EMPTY_NODE = cljs.core.pv_fresh_node.call(null, null);
cljs.core.PersistentVector.EMPTY = new cljs.core.PersistentVector(null, 0, 5, cljs.core.PersistentVector.EMPTY_NODE, [], 0);
cljs.core.PersistentVector.fromArray = function(xs, no_clone) {
  var l__8293 = xs.length;
  var xs__8294 = no_clone === true ? xs : xs.slice();
  if(l__8293 < 32) {
    return new cljs.core.PersistentVector(null, l__8293, 5, cljs.core.PersistentVector.EMPTY_NODE, xs__8294, null)
  }else {
    var node__8295 = xs__8294.slice(0, 32);
    var v__8296 = new cljs.core.PersistentVector(null, 32, 5, cljs.core.PersistentVector.EMPTY_NODE, node__8295, null);
    var i__8297 = 32;
    var out__8298 = cljs.core._as_transient.call(null, v__8296);
    while(true) {
      if(i__8297 < l__8293) {
        var G__8299 = i__8297 + 1;
        var G__8300 = cljs.core.conj_BANG_.call(null, out__8298, xs__8294[i__8297]);
        i__8297 = G__8299;
        out__8298 = G__8300;
        continue
      }else {
        return cljs.core.persistent_BANG_.call(null, out__8298)
      }
      break
    }
  }
};
cljs.core.vec = function vec(coll) {
  return cljs.core._persistent_BANG_.call(null, cljs.core.reduce.call(null, cljs.core._conj_BANG_, cljs.core._as_transient.call(null, cljs.core.PersistentVector.EMPTY), coll))
};
cljs.core.vector = function() {
  var vector__delegate = function(args) {
    return cljs.core.vec.call(null, args)
  };
  var vector = function(var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return vector__delegate.call(this, args)
  };
  vector.cljs$lang$maxFixedArity = 0;
  vector.cljs$lang$applyTo = function(arglist__8301) {
    var args = cljs.core.seq(arglist__8301);
    return vector__delegate(args)
  };
  vector.cljs$lang$arity$variadic = vector__delegate;
  return vector
}();
cljs.core.ChunkedSeq = function(vec, node, i, off, meta) {
  this.vec = vec;
  this.node = node;
  this.i = i;
  this.off = off;
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 27525356
};
cljs.core.ChunkedSeq.cljs$lang$type = true;
cljs.core.ChunkedSeq.cljs$lang$ctorPrSeq = function(this__2250__auto__) {
  return cljs.core.list.call(null, "cljs.core/ChunkedSeq")
};
cljs.core.ChunkedSeq.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__8302 = this;
  if(this__8302.off + 1 < this__8302.node.length) {
    var s__8303 = cljs.core.chunked_seq.call(null, this__8302.vec, this__8302.node, this__8302.i, this__8302.off + 1);
    if(s__8303 == null) {
      return null
    }else {
      return s__8303
    }
  }else {
    return coll.cljs$core$IChunkedNext$_chunked_next$arity$1(coll)
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8304 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8305 = this;
  return coll
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__8306 = this;
  return this__8306.node[this__8306.off]
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__8307 = this;
  if(this__8307.off + 1 < this__8307.node.length) {
    var s__8308 = cljs.core.chunked_seq.call(null, this__8307.vec, this__8307.node, this__8307.i, this__8307.off + 1);
    if(s__8308 == null) {
      return cljs.core.List.EMPTY
    }else {
      return s__8308
    }
  }else {
    return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1(coll)
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedNext$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedNext$_chunked_next$arity$1 = function(coll) {
  var this__8309 = this;
  var l__8310 = this__8309.node.length;
  var s__8311 = this__8309.i + l__8310 < cljs.core._count.call(null, this__8309.vec) ? cljs.core.chunked_seq.call(null, this__8309.vec, this__8309.i + l__8310, 0) : null;
  if(s__8311 == null) {
    return null
  }else {
    return s__8311
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8312 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, m) {
  var this__8313 = this;
  return cljs.core.chunked_seq.call(null, this__8313.vec, this__8313.node, this__8313.i, this__8313.off, m)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IWithMeta$_meta$arity$1 = function(coll) {
  var this__8314 = this;
  return this__8314.meta
};
cljs.core.ChunkedSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8315 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__8315.meta)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$_chunked_first$arity$1 = function(coll) {
  var this__8316 = this;
  return cljs.core.array_chunk.call(null, this__8316.node, this__8316.off)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$_chunked_rest$arity$1 = function(coll) {
  var this__8317 = this;
  var l__8318 = this__8317.node.length;
  var s__8319 = this__8317.i + l__8318 < cljs.core._count.call(null, this__8317.vec) ? cljs.core.chunked_seq.call(null, this__8317.vec, this__8317.i + l__8318, 0) : null;
  if(s__8319 == null) {
    return cljs.core.List.EMPTY
  }else {
    return s__8319
  }
};
cljs.core.ChunkedSeq;
cljs.core.chunked_seq = function() {
  var chunked_seq = null;
  var chunked_seq__3 = function(vec, i, off) {
    return chunked_seq.call(null, vec, cljs.core.array_for.call(null, vec, i), i, off, null)
  };
  var chunked_seq__4 = function(vec, node, i, off) {
    return chunked_seq.call(null, vec, node, i, off, null)
  };
  var chunked_seq__5 = function(vec, node, i, off, meta) {
    return new cljs.core.ChunkedSeq(vec, node, i, off, meta)
  };
  chunked_seq = function(vec, node, i, off, meta) {
    switch(arguments.length) {
      case 3:
        return chunked_seq__3.call(this, vec, node, i);
      case 4:
        return chunked_seq__4.call(this, vec, node, i, off);
      case 5:
        return chunked_seq__5.call(this, vec, node, i, off, meta)
    }
    throw"Invalid arity: " + arguments.length;
  };
  chunked_seq.cljs$lang$arity$3 = chunked_seq__3;
  chunked_seq.cljs$lang$arity$4 = chunked_seq__4;
  chunked_seq.cljs$lang$arity$5 = chunked_seq__5;
  return chunked_seq
}();
cljs.core.Subvec = function(meta, v, start, end, __hash) {
  this.meta = meta;
  this.v = v;
  this.start = start;
  this.end = end;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32400159
};
cljs.core.Subvec.cljs$lang$type = true;
cljs.core.Subvec.cljs$lang$ctorPrSeq = function(this__2250__auto__) {
  return cljs.core.list.call(null, "cljs.core/Subvec")
};
cljs.core.Subvec.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8322 = this;
  var h__2133__auto____8323 = this__8322.__hash;
  if(!(h__2133__auto____8323 == null)) {
    return h__2133__auto____8323
  }else {
    var h__2133__auto____8324 = cljs.core.hash_coll.call(null, coll);
    this__8322.__hash = h__2133__auto____8324;
    return h__2133__auto____8324
  }
};
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8325 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8326 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, key, val) {
  var this__8327 = this;
  var v_pos__8328 = this__8327.start + key;
  return new cljs.core.Subvec(this__8327.meta, cljs.core._assoc.call(null, this__8327.v, v_pos__8328, val), this__8327.start, this__8327.end > v_pos__8328 + 1 ? this__8327.end : v_pos__8328 + 1, null)
};
cljs.core.Subvec.prototype.call = function() {
  var G__8354 = null;
  var G__8354__2 = function(this_sym8329, k) {
    var this__8331 = this;
    var this_sym8329__8332 = this;
    var coll__8333 = this_sym8329__8332;
    return coll__8333.cljs$core$ILookup$_lookup$arity$2(coll__8333, k)
  };
  var G__8354__3 = function(this_sym8330, k, not_found) {
    var this__8331 = this;
    var this_sym8330__8334 = this;
    var coll__8335 = this_sym8330__8334;
    return coll__8335.cljs$core$ILookup$_lookup$arity$3(coll__8335, k, not_found)
  };
  G__8354 = function(this_sym8330, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8354__2.call(this, this_sym8330, k);
      case 3:
        return G__8354__3.call(this, this_sym8330, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8354
}();
cljs.core.Subvec.prototype.apply = function(this_sym8320, args8321) {
  var this__8336 = this;
  return this_sym8320.call.apply(this_sym8320, [this_sym8320].concat(args8321.slice()))
};
cljs.core.Subvec.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8337 = this;
  return new cljs.core.Subvec(this__8337.meta, cljs.core._assoc_n.call(null, this__8337.v, this__8337.end, o), this__8337.start, this__8337.end + 1, null)
};
cljs.core.Subvec.prototype.toString = function() {
  var this__8338 = this;
  var this__8339 = this;
  return cljs.core.pr_str.call(null, this__8339)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__8340 = this;
  return cljs.core.ci_reduce.call(null, coll, f)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__8341 = this;
  return cljs.core.ci_reduce.call(null, coll, f, start)
};
cljs.core.Subvec.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8342 = this;
  var subvec_seq__8343 = function subvec_seq(i) {
    if(i === this__8342.end) {
      return null
    }else {
      return cljs.core.cons.call(null, cljs.core._nth.call(null, this__8342.v, i), new cljs.core.LazySeq(null, false, function() {
        return subvec_seq.call(null, i + 1)
      }, null))
    }
  };
  return subvec_seq__8343.call(null, this__8342.start)
};
cljs.core.Subvec.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8344 = this;
  return this__8344.end - this__8344.start
};
cljs.core.Subvec.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__8345 = this;
  return cljs.core._nth.call(null, this__8345.v, this__8345.end - 1)
};
cljs.core.Subvec.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__8346 = this;
  if(this__8346.start === this__8346.end) {
    throw new Error("Can't pop empty vector");
  }else {
    return new cljs.core.Subvec(this__8346.meta, this__8346.v, this__8346.start, this__8346.end - 1, null)
  }
};
cljs.core.Subvec.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__8347 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.Subvec.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8348 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Subvec.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8349 = this;
  return new cljs.core.Subvec(meta, this__8349.v, this__8349.start, this__8349.end, this__8349.__hash)
};
cljs.core.Subvec.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8350 = this;
  return this__8350.meta
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__8351 = this;
  return cljs.core._nth.call(null, this__8351.v, this__8351.start + n)
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__8352 = this;
  return cljs.core._nth.call(null, this__8352.v, this__8352.start + n, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8353 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__8353.meta)
};
cljs.core.Subvec;
cljs.core.subvec = function() {
  var subvec = null;
  var subvec__2 = function(v, start) {
    return subvec.call(null, v, start, cljs.core.count.call(null, v))
  };
  var subvec__3 = function(v, start, end) {
    return new cljs.core.Subvec(null, v, start, end, null)
  };
  subvec = function(v, start, end) {
    switch(arguments.length) {
      case 2:
        return subvec__2.call(this, v, start);
      case 3:
        return subvec__3.call(this, v, start, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  subvec.cljs$lang$arity$2 = subvec__2;
  subvec.cljs$lang$arity$3 = subvec__3;
  return subvec
}();
cljs.core.tv_ensure_editable = function tv_ensure_editable(edit, node) {
  if(edit === node.edit) {
    return node
  }else {
    return new cljs.core.VectorNode(edit, node.arr.slice())
  }
};
cljs.core.tv_editable_root = function tv_editable_root(node) {
  return new cljs.core.VectorNode({}, node.arr.slice())
};
cljs.core.tv_editable_tail = function tv_editable_tail(tl) {
  var ret__8356 = cljs.core.make_array.call(null, 32);
  cljs.core.array_copy.call(null, tl, 0, ret__8356, 0, tl.length);
  return ret__8356
};
cljs.core.tv_push_tail = function tv_push_tail(tv, level, parent, tail_node) {
  var ret__8360 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, parent);
  var subidx__8361 = tv.cnt - 1 >>> level & 31;
  cljs.core.pv_aset.call(null, ret__8360, subidx__8361, level === 5 ? tail_node : function() {
    var child__8362 = cljs.core.pv_aget.call(null, ret__8360, subidx__8361);
    if(!(child__8362 == null)) {
      return tv_push_tail.call(null, tv, level - 5, child__8362, tail_node)
    }else {
      return cljs.core.new_path.call(null, tv.root.edit, level - 5, tail_node)
    }
  }());
  return ret__8360
};
cljs.core.tv_pop_tail = function tv_pop_tail(tv, level, node) {
  var node__8367 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, node);
  var subidx__8368 = tv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__8369 = tv_pop_tail.call(null, tv, level - 5, cljs.core.pv_aget.call(null, node__8367, subidx__8368));
    if(function() {
      var and__3941__auto____8370 = new_child__8369 == null;
      if(and__3941__auto____8370) {
        return subidx__8368 === 0
      }else {
        return and__3941__auto____8370
      }
    }()) {
      return null
    }else {
      cljs.core.pv_aset.call(null, node__8367, subidx__8368, new_child__8369);
      return node__8367
    }
  }else {
    if(subidx__8368 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        cljs.core.pv_aset.call(null, node__8367, subidx__8368, null);
        return node__8367
      }else {
        return null
      }
    }
  }
};
cljs.core.editable_array_for = function editable_array_for(tv, i) {
  if(function() {
    var and__3941__auto____8375 = 0 <= i;
    if(and__3941__auto____8375) {
      return i < tv.cnt
    }else {
      return and__3941__auto____8375
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, tv)) {
      return tv.tail
    }else {
      var root__8376 = tv.root;
      var node__8377 = root__8376;
      var level__8378 = tv.shift;
      while(true) {
        if(level__8378 > 0) {
          var G__8379 = cljs.core.tv_ensure_editable.call(null, root__8376.edit, cljs.core.pv_aget.call(null, node__8377, i >>> level__8378 & 31));
          var G__8380 = level__8378 - 5;
          node__8377 = G__8379;
          level__8378 = G__8380;
          continue
        }else {
          return node__8377.arr
        }
        break
      }
    }
  }else {
    throw new Error([cljs.core.str("No item "), cljs.core.str(i), cljs.core.str(" in transient vector of length "), cljs.core.str(tv.cnt)].join(""));
  }
};
cljs.core.TransientVector = function(cnt, shift, root, tail) {
  this.cnt = cnt;
  this.shift = shift;
  this.root = root;
  this.tail = tail;
  this.cljs$lang$protocol_mask$partition0$ = 275;
  this.cljs$lang$protocol_mask$partition1$ = 22
};
cljs.core.TransientVector.cljs$lang$type = true;
cljs.core.TransientVector.cljs$lang$ctorPrSeq = function(this__2250__auto__) {
  return cljs.core.list.call(null, "cljs.core/TransientVector")
};
cljs.core.TransientVector.prototype.call = function() {
  var G__8420 = null;
  var G__8420__2 = function(this_sym8383, k) {
    var this__8385 = this;
    var this_sym8383__8386 = this;
    var coll__8387 = this_sym8383__8386;
    return coll__8387.cljs$core$ILookup$_lookup$arity$2(coll__8387, k)
  };
  var G__8420__3 = function(this_sym8384, k, not_found) {
    var this__8385 = this;
    var this_sym8384__8388 = this;
    var coll__8389 = this_sym8384__8388;
    return coll__8389.cljs$core$ILookup$_lookup$arity$3(coll__8389, k, not_found)
  };
  G__8420 = function(this_sym8384, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8420__2.call(this, this_sym8384, k);
      case 3:
        return G__8420__3.call(this, this_sym8384, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8420
}();
cljs.core.TransientVector.prototype.apply = function(this_sym8381, args8382) {
  var this__8390 = this;
  return this_sym8381.call.apply(this_sym8381, [this_sym8381].concat(args8382.slice()))
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8391 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8392 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__8393 = this;
  if(this__8393.root.edit) {
    return cljs.core.array_for.call(null, coll, n)[n & 31]
  }else {
    throw new Error("nth after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__8394 = this;
  if(function() {
    var and__3941__auto____8395 = 0 <= n;
    if(and__3941__auto____8395) {
      return n < this__8394.cnt
    }else {
      return and__3941__auto____8395
    }
  }()) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
  }else {
    return not_found
  }
};
cljs.core.TransientVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8396 = this;
  if(this__8396.root.edit) {
    return this__8396.cnt
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3 = function(tcoll, n, val) {
  var this__8397 = this;
  if(this__8397.root.edit) {
    if(function() {
      var and__3941__auto____8398 = 0 <= n;
      if(and__3941__auto____8398) {
        return n < this__8397.cnt
      }else {
        return and__3941__auto____8398
      }
    }()) {
      if(cljs.core.tail_off.call(null, tcoll) <= n) {
        this__8397.tail[n & 31] = val;
        return tcoll
      }else {
        var new_root__8403 = function go(level, node) {
          var node__8401 = cljs.core.tv_ensure_editable.call(null, this__8397.root.edit, node);
          if(level === 0) {
            cljs.core.pv_aset.call(null, node__8401, n & 31, val);
            return node__8401
          }else {
            var subidx__8402 = n >>> level & 31;
            cljs.core.pv_aset.call(null, node__8401, subidx__8402, go.call(null, level - 5, cljs.core.pv_aget.call(null, node__8401, subidx__8402)));
            return node__8401
          }
        }.call(null, this__8397.shift, this__8397.root);
        this__8397.root = new_root__8403;
        return tcoll
      }
    }else {
      if(n === this__8397.cnt) {
        return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2(tcoll, val)
      }else {
        if("\ufdd0'else") {
          throw new Error([cljs.core.str("Index "), cljs.core.str(n), cljs.core.str(" out of bounds for TransientVector of length"), cljs.core.str(this__8397.cnt)].join(""));
        }else {
          return null
        }
      }
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$_pop_BANG_$arity$1 = function(tcoll) {
  var this__8404 = this;
  if(this__8404.root.edit) {
    if(this__8404.cnt === 0) {
      throw new Error("Can't pop empty vector");
    }else {
      if(1 === this__8404.cnt) {
        this__8404.cnt = 0;
        return tcoll
      }else {
        if((this__8404.cnt - 1 & 31) > 0) {
          this__8404.cnt = this__8404.cnt - 1;
          return tcoll
        }else {
          if("\ufdd0'else") {
            var new_tail__8405 = cljs.core.editable_array_for.call(null, tcoll, this__8404.cnt - 2);
            var new_root__8407 = function() {
              var nr__8406 = cljs.core.tv_pop_tail.call(null, tcoll, this__8404.shift, this__8404.root);
              if(!(nr__8406 == null)) {
                return nr__8406
              }else {
                return new cljs.core.VectorNode(this__8404.root.edit, cljs.core.make_array.call(null, 32))
              }
            }();
            if(function() {
              var and__3941__auto____8408 = 5 < this__8404.shift;
              if(and__3941__auto____8408) {
                return cljs.core.pv_aget.call(null, new_root__8407, 1) == null
              }else {
                return and__3941__auto____8408
              }
            }()) {
              var new_root__8409 = cljs.core.tv_ensure_editable.call(null, this__8404.root.edit, cljs.core.pv_aget.call(null, new_root__8407, 0));
              this__8404.root = new_root__8409;
              this__8404.shift = this__8404.shift - 5;
              this__8404.cnt = this__8404.cnt - 1;
              this__8404.tail = new_tail__8405;
              return tcoll
            }else {
              this__8404.root = new_root__8407;
              this__8404.cnt = this__8404.cnt - 1;
              this__8404.tail = new_tail__8405;
              return tcoll
            }
          }else {
            return null
          }
        }
      }
    }
  }else {
    throw new Error("pop! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__8410 = this;
  return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3(tcoll, key, val)
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__8411 = this;
  if(this__8411.root.edit) {
    if(this__8411.cnt - cljs.core.tail_off.call(null, tcoll) < 32) {
      this__8411.tail[this__8411.cnt & 31] = o;
      this__8411.cnt = this__8411.cnt + 1;
      return tcoll
    }else {
      var tail_node__8412 = new cljs.core.VectorNode(this__8411.root.edit, this__8411.tail);
      var new_tail__8413 = cljs.core.make_array.call(null, 32);
      new_tail__8413[0] = o;
      this__8411.tail = new_tail__8413;
      if(this__8411.cnt >>> 5 > 1 << this__8411.shift) {
        var new_root_array__8414 = cljs.core.make_array.call(null, 32);
        var new_shift__8415 = this__8411.shift + 5;
        new_root_array__8414[0] = this__8411.root;
        new_root_array__8414[1] = cljs.core.new_path.call(null, this__8411.root.edit, this__8411.shift, tail_node__8412);
        this__8411.root = new cljs.core.VectorNode(this__8411.root.edit, new_root_array__8414);
        this__8411.shift = new_shift__8415;
        this__8411.cnt = this__8411.cnt + 1;
        return tcoll
      }else {
        var new_root__8416 = cljs.core.tv_push_tail.call(null, tcoll, this__8411.shift, this__8411.root, tail_node__8412);
        this__8411.root = new_root__8416;
        this__8411.cnt = this__8411.cnt + 1;
        return tcoll
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__8417 = this;
  if(this__8417.root.edit) {
    this__8417.root.edit = null;
    var len__8418 = this__8417.cnt - cljs.core.tail_off.call(null, tcoll);
    var trimmed_tail__8419 = cljs.core.make_array.call(null, len__8418);
    cljs.core.array_copy.call(null, this__8417.tail, 0, trimmed_tail__8419, 0, len__8418);
    return new cljs.core.PersistentVector(null, this__8417.cnt, this__8417.shift, this__8417.root, trimmed_tail__8419, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientVector;
cljs.core.PersistentQueueSeq = function(meta, front, rear, __hash) {
  this.meta = meta;
  this.front = front;
  this.rear = rear;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850572
};
cljs.core.PersistentQueueSeq.cljs$lang$type = true;
cljs.core.PersistentQueueSeq.cljs$lang$ctorPrSeq = function(this__2250__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentQueueSeq")
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8421 = this;
  var h__2133__auto____8422 = this__8421.__hash;
  if(!(h__2133__auto____8422 == null)) {
    return h__2133__auto____8422
  }else {
    var h__2133__auto____8423 = cljs.core.hash_coll.call(null, coll);
    this__8421.__hash = h__2133__auto____8423;
    return h__2133__auto____8423
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8424 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentQueueSeq.prototype.toString = function() {
  var this__8425 = this;
  var this__8426 = this;
  return cljs.core.pr_str.call(null, this__8426)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8427 = this;
  return coll
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__8428 = this;
  return cljs.core._first.call(null, this__8428.front)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__8429 = this;
  var temp__4090__auto____8430 = cljs.core.next.call(null, this__8429.front);
  if(temp__4090__auto____8430) {
    var f1__8431 = temp__4090__auto____8430;
    return new cljs.core.PersistentQueueSeq(this__8429.meta, f1__8431, this__8429.rear, null)
  }else {
    if(this__8429.rear == null) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
    }else {
      return new cljs.core.PersistentQueueSeq(this__8429.meta, this__8429.rear, null, null)
    }
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8432 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8433 = this;
  return new cljs.core.PersistentQueueSeq(meta, this__8433.front, this__8433.rear, this__8433.__hash)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8434 = this;
  return this__8434.meta
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8435 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__8435.meta)
};
cljs.core.PersistentQueueSeq;
cljs.core.PersistentQueue = function(meta, count, front, rear, __hash) {
  this.meta = meta;
  this.count = count;
  this.front = front;
  this.rear = rear;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31858766
};
cljs.core.PersistentQueue.cljs$lang$type = true;
cljs.core.PersistentQueue.cljs$lang$ctorPrSeq = function(this__2250__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentQueue")
};
cljs.core.PersistentQueue.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8436 = this;
  var h__2133__auto____8437 = this__8436.__hash;
  if(!(h__2133__auto____8437 == null)) {
    return h__2133__auto____8437
  }else {
    var h__2133__auto____8438 = cljs.core.hash_coll.call(null, coll);
    this__8436.__hash = h__2133__auto____8438;
    return h__2133__auto____8438
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8439 = this;
  if(cljs.core.truth_(this__8439.front)) {
    return new cljs.core.PersistentQueue(this__8439.meta, this__8439.count + 1, this__8439.front, cljs.core.conj.call(null, function() {
      var or__3943__auto____8440 = this__8439.rear;
      if(cljs.core.truth_(or__3943__auto____8440)) {
        return or__3943__auto____8440
      }else {
        return cljs.core.PersistentVector.EMPTY
      }
    }(), o), null)
  }else {
    return new cljs.core.PersistentQueue(this__8439.meta, this__8439.count + 1, cljs.core.conj.call(null, this__8439.front, o), cljs.core.PersistentVector.EMPTY, null)
  }
};
cljs.core.PersistentQueue.prototype.toString = function() {
  var this__8441 = this;
  var this__8442 = this;
  return cljs.core.pr_str.call(null, this__8442)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8443 = this;
  var rear__8444 = cljs.core.seq.call(null, this__8443.rear);
  if(cljs.core.truth_(function() {
    var or__3943__auto____8445 = this__8443.front;
    if(cljs.core.truth_(or__3943__auto____8445)) {
      return or__3943__auto____8445
    }else {
      return rear__8444
    }
  }())) {
    return new cljs.core.PersistentQueueSeq(null, this__8443.front, cljs.core.seq.call(null, rear__8444), null)
  }else {
    return null
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8446 = this;
  return this__8446.count
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__8447 = this;
  return cljs.core._first.call(null, this__8447.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__8448 = this;
  if(cljs.core.truth_(this__8448.front)) {
    var temp__4090__auto____8449 = cljs.core.next.call(null, this__8448.front);
    if(temp__4090__auto____8449) {
      var f1__8450 = temp__4090__auto____8449;
      return new cljs.core.PersistentQueue(this__8448.meta, this__8448.count - 1, f1__8450, this__8448.rear, null)
    }else {
      return new cljs.core.PersistentQueue(this__8448.meta, this__8448.count - 1, cljs.core.seq.call(null, this__8448.rear), cljs.core.PersistentVector.EMPTY, null)
    }
  }else {
    return coll
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__8451 = this;
  return cljs.core.first.call(null, this__8451.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__8452 = this;
  return cljs.core.rest.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentQueue.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8453 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueue.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8454 = this;
  return new cljs.core.PersistentQueue(meta, this__8454.count, this__8454.front, this__8454.rear, this__8454.__hash)
};
cljs.core.PersistentQueue.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8455 = this;
  return this__8455.meta
};
cljs.core.PersistentQueue.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8456 = this;
  return cljs.core.PersistentQueue.EMPTY
};
cljs.core.PersistentQueue;
cljs.core.PersistentQueue.EMPTY = new cljs.core.PersistentQueue(null, 0, null, cljs.core.PersistentVector.EMPTY, 0);
cljs.core.NeverEquiv = function() {
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2097152
};
cljs.core.NeverEquiv.cljs$lang$type = true;
cljs.core.NeverEquiv.cljs$lang$ctorPrSeq = function(this__2250__auto__) {
  return cljs.core.list.call(null, "cljs.core/NeverEquiv")
};
cljs.core.NeverEquiv.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var this__8457 = this;
  return false
};
cljs.core.NeverEquiv;
cljs.core.never_equiv = new cljs.core.NeverEquiv;
cljs.core.equiv_map = function equiv_map(x, y) {
  return cljs.core.boolean$.call(null, cljs.core.map_QMARK_.call(null, y) ? cljs.core.count.call(null, x) === cljs.core.count.call(null, y) ? cljs.core.every_QMARK_.call(null, cljs.core.identity, cljs.core.map.call(null, function(xkv) {
    return cljs.core._EQ_.call(null, cljs.core._lookup.call(null, y, cljs.core.first.call(null, xkv), cljs.core.never_equiv), cljs.core.second.call(null, xkv))
  }, x)) : null : null)
};
cljs.core.scan_array = function scan_array(incr, k, array) {
  var len__8460 = array.length;
  var i__8461 = 0;
  while(true) {
    if(i__8461 < len__8460) {
      if(k === array[i__8461]) {
        return i__8461
      }else {
        var G__8462 = i__8461 + incr;
        i__8461 = G__8462;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.obj_map_compare_keys = function obj_map_compare_keys(a, b) {
  var a__8465 = cljs.core.hash.call(null, a);
  var b__8466 = cljs.core.hash.call(null, b);
  if(a__8465 < b__8466) {
    return-1
  }else {
    if(a__8465 > b__8466) {
      return 1
    }else {
      if("\ufdd0'else") {
        return 0
      }else {
        return null
      }
    }
  }
};
cljs.core.obj_map__GT_hash_map = function obj_map__GT_hash_map(m, k, v) {
  var ks__8474 = m.keys;
  var len__8475 = ks__8474.length;
  var so__8476 = m.strobj;
  var out__8477 = cljs.core.with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, cljs.core.meta.call(null, m));
  var i__8478 = 0;
  var out__8479 = cljs.core.transient$.call(null, out__8477);
  while(true) {
    if(i__8478 < len__8475) {
      var k__8480 = ks__8474[i__8478];
      var G__8481 = i__8478 + 1;
      var G__8482 = cljs.core.assoc_BANG_.call(null, out__8479, k__8480, so__8476[k__8480]);
      i__8478 = G__8481;
      out__8479 = G__8482;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, out__8479, k, v))
    }
    break
  }
};
cljs.core.obj_clone = function obj_clone(obj, ks) {
  var new_obj__8488 = {};
  var l__8489 = ks.length;
  var i__8490 = 0;
  while(true) {
    if(i__8490 < l__8489) {
      var k__8491 = ks[i__8490];
      new_obj__8488[k__8491] = obj[k__8491];
      var G__8492 = i__8490 + 1;
      i__8490 = G__8492;
      continue
    }else {
    }
    break
  }
  return new_obj__8488
};
cljs.core.ObjMap = function(meta, keys, strobj, update_count, __hash) {
  this.meta = meta;
  this.keys = keys;
  this.strobj = strobj;
  this.update_count = update_count;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 15075087
};
cljs.core.ObjMap.cljs$lang$type = true;
cljs.core.ObjMap.cljs$lang$ctorPrSeq = function(this__2250__auto__) {
  return cljs.core.list.call(null, "cljs.core/ObjMap")
};
cljs.core.ObjMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__8495 = this;
  return cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.hash_map.call(null), coll))
};
cljs.core.ObjMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8496 = this;
  var h__2133__auto____8497 = this__8496.__hash;
  if(!(h__2133__auto____8497 == null)) {
    return h__2133__auto____8497
  }else {
    var h__2133__auto____8498 = cljs.core.hash_imap.call(null, coll);
    this__8496.__hash = h__2133__auto____8498;
    return h__2133__auto____8498
  }
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8499 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8500 = this;
  if(function() {
    var and__3941__auto____8501 = goog.isString(k);
    if(and__3941__auto____8501) {
      return!(cljs.core.scan_array.call(null, 1, k, this__8500.keys) == null)
    }else {
      return and__3941__auto____8501
    }
  }()) {
    return this__8500.strobj[k]
  }else {
    return not_found
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__8502 = this;
  if(goog.isString(k)) {
    if(function() {
      var or__3943__auto____8503 = this__8502.update_count > cljs.core.ObjMap.HASHMAP_THRESHOLD;
      if(or__3943__auto____8503) {
        return or__3943__auto____8503
      }else {
        return this__8502.keys.length >= cljs.core.ObjMap.HASHMAP_THRESHOLD
      }
    }()) {
      return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
    }else {
      if(!(cljs.core.scan_array.call(null, 1, k, this__8502.keys) == null)) {
        var new_strobj__8504 = cljs.core.obj_clone.call(null, this__8502.strobj, this__8502.keys);
        new_strobj__8504[k] = v;
        return new cljs.core.ObjMap(this__8502.meta, this__8502.keys, new_strobj__8504, this__8502.update_count + 1, null)
      }else {
        var new_strobj__8505 = cljs.core.obj_clone.call(null, this__8502.strobj, this__8502.keys);
        var new_keys__8506 = this__8502.keys.slice();
        new_strobj__8505[k] = v;
        new_keys__8506.push(k);
        return new cljs.core.ObjMap(this__8502.meta, new_keys__8506, new_strobj__8505, this__8502.update_count + 1, null)
      }
    }
  }else {
    return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__8507 = this;
  if(function() {
    var and__3941__auto____8508 = goog.isString(k);
    if(and__3941__auto____8508) {
      return!(cljs.core.scan_array.call(null, 1, k, this__8507.keys) == null)
    }else {
      return and__3941__auto____8508
    }
  }()) {
    return true
  }else {
    return false
  }
};
cljs.core.ObjMap.prototype.call = function() {
  var G__8530 = null;
  var G__8530__2 = function(this_sym8509, k) {
    var this__8511 = this;
    var this_sym8509__8512 = this;
    var coll__8513 = this_sym8509__8512;
    return coll__8513.cljs$core$ILookup$_lookup$arity$2(coll__8513, k)
  };
  var G__8530__3 = function(this_sym8510, k, not_found) {
    var this__8511 = this;
    var this_sym8510__8514 = this;
    var coll__8515 = this_sym8510__8514;
    return coll__8515.cljs$core$ILookup$_lookup$arity$3(coll__8515, k, not_found)
  };
  G__8530 = function(this_sym8510, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8530__2.call(this, this_sym8510, k);
      case 3:
        return G__8530__3.call(this, this_sym8510, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8530
}();
cljs.core.ObjMap.prototype.apply = function(this_sym8493, args8494) {
  var this__8516 = this;
  return this_sym8493.call.apply(this_sym8493, [this_sym8493].concat(args8494.slice()))
};
cljs.core.ObjMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__8517 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.ObjMap.prototype.toString = function() {
  var this__8518 = this;
  var this__8519 = this;
  return cljs.core.pr_str.call(null, this__8519)
};
cljs.core.ObjMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8520 = this;
  if(this__8520.keys.length > 0) {
    return cljs.core.map.call(null, function(p1__8483_SHARP_) {
      return cljs.core.vector.call(null, p1__8483_SHARP_, this__8520.strobj[p1__8483_SHARP_])
    }, this__8520.keys.sort(cljs.core.obj_map_compare_keys))
  }else {
    return null
  }
};
cljs.core.ObjMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8521 = this;
  return this__8521.keys.length
};
cljs.core.ObjMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8522 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.ObjMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8523 = this;
  return new cljs.core.ObjMap(meta, this__8523.keys, this__8523.strobj, this__8523.update_count, this__8523.__hash)
};
cljs.core.ObjMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8524 = this;
  return this__8524.meta
};
cljs.core.ObjMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8525 = this;
  return cljs.core.with_meta.call(null, cljs.core.ObjMap.EMPTY, this__8525.meta)
};
cljs.core.ObjMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__8526 = this;
  if(function() {
    var and__3941__auto____8527 = goog.isString(k);
    if(and__3941__auto____8527) {
      return!(cljs.core.scan_array.call(null, 1, k, this__8526.keys) == null)
    }else {
      return and__3941__auto____8527
    }
  }()) {
    var new_keys__8528 = this__8526.keys.slice();
    var new_strobj__8529 = cljs.core.obj_clone.call(null, this__8526.strobj, this__8526.keys);
    new_keys__8528.splice(cljs.core.scan_array.call(null, 1, k, new_keys__8528), 1);
    cljs.core.js_delete.call(null, new_strobj__8529, k);
    return new cljs.core.ObjMap(this__8526.meta, new_keys__8528, new_strobj__8529, this__8526.update_count + 1, null)
  }else {
    return coll
  }
};
cljs.core.ObjMap;
cljs.core.ObjMap.EMPTY = new cljs.core.ObjMap(null, [], {}, 0, 0);
cljs.core.ObjMap.HASHMAP_THRESHOLD = 32;
cljs.core.ObjMap.fromObject = function(ks, obj) {
  return new cljs.core.ObjMap(null, ks, obj, 0, null)
};
cljs.core.HashMap = function(meta, count, hashobj, __hash) {
  this.meta = meta;
  this.count = count;
  this.hashobj = hashobj;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 15075087
};
cljs.core.HashMap.cljs$lang$type = true;
cljs.core.HashMap.cljs$lang$ctorPrSeq = function(this__2250__auto__) {
  return cljs.core.list.call(null, "cljs.core/HashMap")
};
cljs.core.HashMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8534 = this;
  var h__2133__auto____8535 = this__8534.__hash;
  if(!(h__2133__auto____8535 == null)) {
    return h__2133__auto____8535
  }else {
    var h__2133__auto____8536 = cljs.core.hash_imap.call(null, coll);
    this__8534.__hash = h__2133__auto____8536;
    return h__2133__auto____8536
  }
};
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8537 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8538 = this;
  var bucket__8539 = this__8538.hashobj[cljs.core.hash.call(null, k)];
  var i__8540 = cljs.core.truth_(bucket__8539) ? cljs.core.scan_array.call(null, 2, k, bucket__8539) : null;
  if(cljs.core.truth_(i__8540)) {
    return bucket__8539[i__8540 + 1]
  }else {
    return not_found
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__8541 = this;
  var h__8542 = cljs.core.hash.call(null, k);
  var bucket__8543 = this__8541.hashobj[h__8542];
  if(cljs.core.truth_(bucket__8543)) {
    var new_bucket__8544 = bucket__8543.slice();
    var new_hashobj__8545 = goog.object.clone(this__8541.hashobj);
    new_hashobj__8545[h__8542] = new_bucket__8544;
    var temp__4090__auto____8546 = cljs.core.scan_array.call(null, 2, k, new_bucket__8544);
    if(cljs.core.truth_(temp__4090__auto____8546)) {
      var i__8547 = temp__4090__auto____8546;
      new_bucket__8544[i__8547 + 1] = v;
      return new cljs.core.HashMap(this__8541.meta, this__8541.count, new_hashobj__8545, null)
    }else {
      new_bucket__8544.push(k, v);
      return new cljs.core.HashMap(this__8541.meta, this__8541.count + 1, new_hashobj__8545, null)
    }
  }else {
    var new_hashobj__8548 = goog.object.clone(this__8541.hashobj);
    new_hashobj__8548[h__8542] = [k, v];
    return new cljs.core.HashMap(this__8541.meta, this__8541.count + 1, new_hashobj__8548, null)
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__8549 = this;
  var bucket__8550 = this__8549.hashobj[cljs.core.hash.call(null, k)];
  var i__8551 = cljs.core.truth_(bucket__8550) ? cljs.core.scan_array.call(null, 2, k, bucket__8550) : null;
  if(cljs.core.truth_(i__8551)) {
    return true
  }else {
    return false
  }
};
cljs.core.HashMap.prototype.call = function() {
  var G__8576 = null;
  var G__8576__2 = function(this_sym8552, k) {
    var this__8554 = this;
    var this_sym8552__8555 = this;
    var coll__8556 = this_sym8552__8555;
    return coll__8556.cljs$core$ILookup$_lookup$arity$2(coll__8556, k)
  };
  var G__8576__3 = function(this_sym8553, k, not_found) {
    var this__8554 = this;
    var this_sym8553__8557 = this;
    var coll__8558 = this_sym8553__8557;
    return coll__8558.cljs$core$ILookup$_lookup$arity$3(coll__8558, k, not_found)
  };
  G__8576 = function(this_sym8553, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8576__2.call(this, this_sym8553, k);
      case 3:
        return G__8576__3.call(this, this_sym8553, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8576
}();
cljs.core.HashMap.prototype.apply = function(this_sym8532, args8533) {
  var this__8559 = this;
  return this_sym8532.call.apply(this_sym8532, [this_sym8532].concat(args8533.slice()))
};
cljs.core.HashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__8560 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.HashMap.prototype.toString = function() {
  var this__8561 = this;
  var this__8562 = this;
  return cljs.core.pr_str.call(null, this__8562)
};
cljs.core.HashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8563 = this;
  if(this__8563.count > 0) {
    var hashes__8564 = cljs.core.js_keys.call(null, this__8563.hashobj).sort();
    return cljs.core.mapcat.call(null, function(p1__8531_SHARP_) {
      return cljs.core.map.call(null, cljs.core.vec, cljs.core.partition.call(null, 2, this__8563.hashobj[p1__8531_SHARP_]))
    }, hashes__8564)
  }else {
    return null
  }
};
cljs.core.HashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8565 = this;
  return this__8565.count
};
cljs.core.HashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8566 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.HashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8567 = this;
  return new cljs.core.HashMap(meta, this__8567.count, this__8567.hashobj, this__8567.__hash)
};
cljs.core.HashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8568 = this;
  return this__8568.meta
};
cljs.core.HashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8569 = this;
  return cljs.core.with_meta.call(null, cljs.core.HashMap.EMPTY, this__8569.meta)
};
cljs.core.HashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__8570 = this;
  var h__8571 = cljs.core.hash.call(null, k);
  var bucket__8572 = this__8570.hashobj[h__8571];
  var i__8573 = cljs.core.truth_(bucket__8572) ? cljs.core.scan_array.call(null, 2, k, bucket__8572) : null;
  if(cljs.core.not.call(null, i__8573)) {
    return coll
  }else {
    var new_hashobj__8574 = goog.object.clone(this__8570.hashobj);
    if(3 > bucket__8572.length) {
      cljs.core.js_delete.call(null, new_hashobj__8574, h__8571)
    }else {
      var new_bucket__8575 = bucket__8572.slice();
      new_bucket__8575.splice(i__8573, 2);
      new_hashobj__8574[h__8571] = new_bucket__8575
    }
    return new cljs.core.HashMap(this__8570.meta, this__8570.count - 1, new_hashobj__8574, null)
  }
};
cljs.core.HashMap;
cljs.core.HashMap.EMPTY = new cljs.core.HashMap(null, 0, {}, 0);
cljs.core.HashMap.fromArrays = function(ks, vs) {
  var len__8577 = ks.length;
  var i__8578 = 0;
  var out__8579 = cljs.core.HashMap.EMPTY;
  while(true) {
    if(i__8578 < len__8577) {
      var G__8580 = i__8578 + 1;
      var G__8581 = cljs.core.assoc.call(null, out__8579, ks[i__8578], vs[i__8578]);
      i__8578 = G__8580;
      out__8579 = G__8581;
      continue
    }else {
      return out__8579
    }
    break
  }
};
cljs.core.array_map_index_of = function array_map_index_of(m, k) {
  var arr__8585 = m.arr;
  var len__8586 = arr__8585.length;
  var i__8587 = 0;
  while(true) {
    if(len__8586 <= i__8587) {
      return-1
    }else {
      if(cljs.core._EQ_.call(null, arr__8585[i__8587], k)) {
        return i__8587
      }else {
        if("\ufdd0'else") {
          var G__8588 = i__8587 + 2;
          i__8587 = G__8588;
          continue
        }else {
          return null
        }
      }
    }
    break
  }
};
cljs.core.PersistentArrayMap = function(meta, cnt, arr, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.arr = arr;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 16123663
};
cljs.core.PersistentArrayMap.cljs$lang$type = true;
cljs.core.PersistentArrayMap.cljs$lang$ctorPrSeq = function(this__2250__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentArrayMap")
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__8591 = this;
  return new cljs.core.TransientArrayMap({}, this__8591.arr.length, this__8591.arr.slice())
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8592 = this;
  var h__2133__auto____8593 = this__8592.__hash;
  if(!(h__2133__auto____8593 == null)) {
    return h__2133__auto____8593
  }else {
    var h__2133__auto____8594 = cljs.core.hash_imap.call(null, coll);
    this__8592.__hash = h__2133__auto____8594;
    return h__2133__auto____8594
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8595 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8596 = this;
  var idx__8597 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__8597 === -1) {
    return not_found
  }else {
    return this__8596.arr[idx__8597 + 1]
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__8598 = this;
  var idx__8599 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__8599 === -1) {
    if(this__8598.cnt < cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
      return new cljs.core.PersistentArrayMap(this__8598.meta, this__8598.cnt + 1, function() {
        var G__8600__8601 = this__8598.arr.slice();
        G__8600__8601.push(k);
        G__8600__8601.push(v);
        return G__8600__8601
      }(), null)
    }else {
      return cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.PersistentHashMap.EMPTY, coll)), k, v))
    }
  }else {
    if(v === this__8598.arr[idx__8599 + 1]) {
      return coll
    }else {
      if("\ufdd0'else") {
        return new cljs.core.PersistentArrayMap(this__8598.meta, this__8598.cnt, function() {
          var G__8602__8603 = this__8598.arr.slice();
          G__8602__8603[idx__8599 + 1] = v;
          return G__8602__8603
        }(), null)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__8604 = this;
  return!(cljs.core.array_map_index_of.call(null, coll, k) === -1)
};
cljs.core.PersistentArrayMap.prototype.call = function() {
  var G__8636 = null;
  var G__8636__2 = function(this_sym8605, k) {
    var this__8607 = this;
    var this_sym8605__8608 = this;
    var coll__8609 = this_sym8605__8608;
    return coll__8609.cljs$core$ILookup$_lookup$arity$2(coll__8609, k)
  };
  var G__8636__3 = function(this_sym8606, k, not_found) {
    var this__8607 = this;
    var this_sym8606__8610 = this;
    var coll__8611 = this_sym8606__8610;
    return coll__8611.cljs$core$ILookup$_lookup$arity$3(coll__8611, k, not_found)
  };
  G__8636 = function(this_sym8606, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8636__2.call(this, this_sym8606, k);
      case 3:
        return G__8636__3.call(this, this_sym8606, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8636
}();
cljs.core.PersistentArrayMap.prototype.apply = function(this_sym8589, args8590) {
  var this__8612 = this;
  return this_sym8589.call.apply(this_sym8589, [this_sym8589].concat(args8590.slice()))
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__8613 = this;
  var len__8614 = this__8613.arr.length;
  var i__8615 = 0;
  var init__8616 = init;
  while(true) {
    if(i__8615 < len__8614) {
      var init__8617 = f.call(null, init__8616, this__8613.arr[i__8615], this__8613.arr[i__8615 + 1]);
      if(cljs.core.reduced_QMARK_.call(null, init__8617)) {
        return cljs.core.deref.call(null, init__8617)
      }else {
        var G__8637 = i__8615 + 2;
        var G__8638 = init__8617;
        i__8615 = G__8637;
        init__8616 = G__8638;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__8618 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentArrayMap.prototype.toString = function() {
  var this__8619 = this;
  var this__8620 = this;
  return cljs.core.pr_str.call(null, this__8620)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8621 = this;
  if(this__8621.cnt > 0) {
    var len__8622 = this__8621.arr.length;
    var array_map_seq__8623 = function array_map_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < len__8622) {
          return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([this__8621.arr[i], this__8621.arr[i + 1]], true), array_map_seq.call(null, i + 2))
        }else {
          return null
        }
      }, null)
    };
    return array_map_seq__8623.call(null, 0)
  }else {
    return null
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8624 = this;
  return this__8624.cnt
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8625 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8626 = this;
  return new cljs.core.PersistentArrayMap(meta, this__8626.cnt, this__8626.arr, this__8626.__hash)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8627 = this;
  return this__8627.meta
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8628 = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentArrayMap.EMPTY, this__8628.meta)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__8629 = this;
  var idx__8630 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__8630 >= 0) {
    var len__8631 = this__8629.arr.length;
    var new_len__8632 = len__8631 - 2;
    if(new_len__8632 === 0) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
    }else {
      var new_arr__8633 = cljs.core.make_array.call(null, new_len__8632);
      var s__8634 = 0;
      var d__8635 = 0;
      while(true) {
        if(s__8634 >= len__8631) {
          return new cljs.core.PersistentArrayMap(this__8629.meta, this__8629.cnt - 1, new_arr__8633, null)
        }else {
          if(cljs.core._EQ_.call(null, k, this__8629.arr[s__8634])) {
            var G__8639 = s__8634 + 2;
            var G__8640 = d__8635;
            s__8634 = G__8639;
            d__8635 = G__8640;
            continue
          }else {
            if("\ufdd0'else") {
              new_arr__8633[d__8635] = this__8629.arr[s__8634];
              new_arr__8633[d__8635 + 1] = this__8629.arr[s__8634 + 1];
              var G__8641 = s__8634 + 2;
              var G__8642 = d__8635 + 2;
              s__8634 = G__8641;
              d__8635 = G__8642;
              continue
            }else {
              return null
            }
          }
        }
        break
      }
    }
  }else {
    return coll
  }
};
cljs.core.PersistentArrayMap;
cljs.core.PersistentArrayMap.EMPTY = new cljs.core.PersistentArrayMap(null, 0, [], null);
cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD = 16;
cljs.core.PersistentArrayMap.fromArrays = function(ks, vs) {
  var len__8643 = cljs.core.count.call(null, ks);
  var i__8644 = 0;
  var out__8645 = cljs.core.transient$.call(null, cljs.core.PersistentArrayMap.EMPTY);
  while(true) {
    if(i__8644 < len__8643) {
      var G__8646 = i__8644 + 1;
      var G__8647 = cljs.core.assoc_BANG_.call(null, out__8645, ks[i__8644], vs[i__8644]);
      i__8644 = G__8646;
      out__8645 = G__8647;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__8645)
    }
    break
  }
};
cljs.core.TransientArrayMap = function(editable_QMARK_, len, arr) {
  this.editable_QMARK_ = editable_QMARK_;
  this.len = len;
  this.arr = arr;
  this.cljs$lang$protocol_mask$partition1$ = 14;
  this.cljs$lang$protocol_mask$partition0$ = 258
};
cljs.core.TransientArrayMap.cljs$lang$type = true;
cljs.core.TransientArrayMap.cljs$lang$ctorPrSeq = function(this__2250__auto__) {
  return cljs.core.list.call(null, "cljs.core/TransientArrayMap")
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientMap$_dissoc_BANG_$arity$2 = function(tcoll, key) {
  var this__8648 = this;
  if(cljs.core.truth_(this__8648.editable_QMARK_)) {
    var idx__8649 = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx__8649 >= 0) {
      this__8648.arr[idx__8649] = this__8648.arr[this__8648.len - 2];
      this__8648.arr[idx__8649 + 1] = this__8648.arr[this__8648.len - 1];
      var G__8650__8651 = this__8648.arr;
      G__8650__8651.pop();
      G__8650__8651.pop();
      G__8650__8651;
      this__8648.len = this__8648.len - 2
    }else {
    }
    return tcoll
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__8652 = this;
  if(cljs.core.truth_(this__8652.editable_QMARK_)) {
    var idx__8653 = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx__8653 === -1) {
      if(this__8652.len + 2 <= 2 * cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
        this__8652.len = this__8652.len + 2;
        this__8652.arr.push(key);
        this__8652.arr.push(val);
        return tcoll
      }else {
        return cljs.core.assoc_BANG_.call(null, cljs.core.array__GT_transient_hash_map.call(null, this__8652.len, this__8652.arr), key, val)
      }
    }else {
      if(val === this__8652.arr[idx__8653 + 1]) {
        return tcoll
      }else {
        this__8652.arr[idx__8653 + 1] = val;
        return tcoll
      }
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__8654 = this;
  if(cljs.core.truth_(this__8654.editable_QMARK_)) {
    if(function() {
      var G__8655__8656 = o;
      if(G__8655__8656) {
        if(function() {
          var or__3943__auto____8657 = G__8655__8656.cljs$lang$protocol_mask$partition0$ & 2048;
          if(or__3943__auto____8657) {
            return or__3943__auto____8657
          }else {
            return G__8655__8656.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__8655__8656.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__8655__8656)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__8655__8656)
      }
    }()) {
      return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll, cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es__8658 = cljs.core.seq.call(null, o);
      var tcoll__8659 = tcoll;
      while(true) {
        var temp__4090__auto____8660 = cljs.core.first.call(null, es__8658);
        if(cljs.core.truth_(temp__4090__auto____8660)) {
          var e__8661 = temp__4090__auto____8660;
          var G__8667 = cljs.core.next.call(null, es__8658);
          var G__8668 = tcoll__8659.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll__8659, cljs.core.key.call(null, e__8661), cljs.core.val.call(null, e__8661));
          es__8658 = G__8667;
          tcoll__8659 = G__8668;
          continue
        }else {
          return tcoll__8659
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__8662 = this;
  if(cljs.core.truth_(this__8662.editable_QMARK_)) {
    this__8662.editable_QMARK_ = false;
    return new cljs.core.PersistentArrayMap(null, cljs.core.quot.call(null, this__8662.len, 2), this__8662.arr, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__8663 = this;
  return tcoll.cljs$core$ILookup$_lookup$arity$3(tcoll, k, null)
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__8664 = this;
  if(cljs.core.truth_(this__8664.editable_QMARK_)) {
    var idx__8665 = cljs.core.array_map_index_of.call(null, tcoll, k);
    if(idx__8665 === -1) {
      return not_found
    }else {
      return this__8664.arr[idx__8665 + 1]
    }
  }else {
    throw new Error("lookup after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__8666 = this;
  if(cljs.core.truth_(this__8666.editable_QMARK_)) {
    return cljs.core.quot.call(null, this__8666.len, 2)
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientArrayMap;
cljs.core.array__GT_transient_hash_map = function array__GT_transient_hash_map(len, arr) {
  var out__8671 = cljs.core.transient$.call(null, cljs.core.ObjMap.EMPTY);
  var i__8672 = 0;
  while(true) {
    if(i__8672 < len) {
      var G__8673 = cljs.core.assoc_BANG_.call(null, out__8671, arr[i__8672], arr[i__8672 + 1]);
      var G__8674 = i__8672 + 2;
      out__8671 = G__8673;
      i__8672 = G__8674;
      continue
    }else {
      return out__8671
    }
    break
  }
};
cljs.core.Box = function(val) {
  this.val = val
};
cljs.core.Box.cljs$lang$type = true;
cljs.core.Box.cljs$lang$ctorPrSeq = function(this__2251__auto__) {
  return cljs.core.list.call(null, "cljs.core/Box")
};
cljs.core.Box;
cljs.core.key_test = function key_test(key, other) {
  if(goog.isString(key)) {
    return key === other
  }else {
    return cljs.core._EQ_.call(null, key, other)
  }
};
cljs.core.mask = function mask(hash, shift) {
  return hash >>> shift & 31
};
cljs.core.clone_and_set = function() {
  var clone_and_set = null;
  var clone_and_set__3 = function(arr, i, a) {
    var G__8679__8680 = arr.slice();
    G__8679__8680[i] = a;
    return G__8679__8680
  };
  var clone_and_set__5 = function(arr, i, a, j, b) {
    var G__8681__8682 = arr.slice();
    G__8681__8682[i] = a;
    G__8681__8682[j] = b;
    return G__8681__8682
  };
  clone_and_set = function(arr, i, a, j, b) {
    switch(arguments.length) {
      case 3:
        return clone_and_set__3.call(this, arr, i, a);
      case 5:
        return clone_and_set__5.call(this, arr, i, a, j, b)
    }
    throw"Invalid arity: " + arguments.length;
  };
  clone_and_set.cljs$lang$arity$3 = clone_and_set__3;
  clone_and_set.cljs$lang$arity$5 = clone_and_set__5;
  return clone_and_set
}();
cljs.core.remove_pair = function remove_pair(arr, i) {
  var new_arr__8684 = cljs.core.make_array.call(null, arr.length - 2);
  cljs.core.array_copy.call(null, arr, 0, new_arr__8684, 0, 2 * i);
  cljs.core.array_copy.call(null, arr, 2 * (i + 1), new_arr__8684, 2 * i, new_arr__8684.length - 2 * i);
  return new_arr__8684
};
cljs.core.bitmap_indexed_node_index = function bitmap_indexed_node_index(bitmap, bit) {
  return cljs.core.bit_count.call(null, bitmap & bit - 1)
};
cljs.core.bitpos = function bitpos(hash, shift) {
  return 1 << (hash >>> shift & 31)
};
cljs.core.edit_and_set = function() {
  var edit_and_set = null;
  var edit_and_set__4 = function(inode, edit, i, a) {
    var editable__8687 = inode.ensure_editable(edit);
    editable__8687.arr[i] = a;
    return editable__8687
  };
  var edit_and_set__6 = function(inode, edit, i, a, j, b) {
    var editable__8688 = inode.ensure_editable(edit);
    editable__8688.arr[i] = a;
    editable__8688.arr[j] = b;
    return editable__8688
  };
  edit_and_set = function(inode, edit, i, a, j, b) {
    switch(arguments.length) {
      case 4:
        return edit_and_set__4.call(this, inode, edit, i, a);
      case 6:
        return edit_and_set__6.call(this, inode, edit, i, a, j, b)
    }
    throw"Invalid arity: " + arguments.length;
  };
  edit_and_set.cljs$lang$arity$4 = edit_and_set__4;
  edit_and_set.cljs$lang$arity$6 = edit_and_set__6;
  return edit_and_set
}();
cljs.core.inode_kv_reduce = function inode_kv_reduce(arr, f, init) {
  var len__8695 = arr.length;
  var i__8696 = 0;
  var init__8697 = init;
  while(true) {
    if(i__8696 < len__8695) {
      var init__8700 = function() {
        var k__8698 = arr[i__8696];
        if(!(k__8698 == null)) {
          return f.call(null, init__8697, k__8698, arr[i__8696 + 1])
        }else {
          var node__8699 = arr[i__8696 + 1];
          if(!(node__8699 == null)) {
            return node__8699.kv_reduce(f, init__8697)
          }else {
            return init__8697
          }
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__8700)) {
        return cljs.core.deref.call(null, init__8700)
      }else {
        var G__8701 = i__8696 + 2;
        var G__8702 = init__8700;
        i__8696 = G__8701;
        init__8697 = G__8702;
        continue
      }
    }else {
      return init__8697
    }
    break
  }
};
cljs.core.BitmapIndexedNode = function(edit, bitmap, arr) {
  this.edit = edit;
  this.bitmap = bitmap;
  this.arr = arr
};
cljs.core.BitmapIndexedNode.cljs$lang$type = true;
cljs.core.BitmapIndexedNode.cljs$lang$ctorPrSeq = function(this__2250__auto__) {
  return cljs.core.list.call(null, "cljs.core/BitmapIndexedNode")
};
cljs.core.BitmapIndexedNode.prototype.edit_and_remove_pair = function(e, bit, i) {
  var this__8703 = this;
  var inode__8704 = this;
  if(this__8703.bitmap === bit) {
    return null
  }else {
    var editable__8705 = inode__8704.ensure_editable(e);
    var earr__8706 = editable__8705.arr;
    var len__8707 = earr__8706.length;
    editable__8705.bitmap = bit ^ editable__8705.bitmap;
    cljs.core.array_copy.call(null, earr__8706, 2 * (i + 1), earr__8706, 2 * i, len__8707 - 2 * (i + 1));
    earr__8706[len__8707 - 2] = null;
    earr__8706[len__8707 - 1] = null;
    return editable__8705
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__8708 = this;
  var inode__8709 = this;
  var bit__8710 = 1 << (hash >>> shift & 31);
  var idx__8711 = cljs.core.bitmap_indexed_node_index.call(null, this__8708.bitmap, bit__8710);
  if((this__8708.bitmap & bit__8710) === 0) {
    var n__8712 = cljs.core.bit_count.call(null, this__8708.bitmap);
    if(2 * n__8712 < this__8708.arr.length) {
      var editable__8713 = inode__8709.ensure_editable(edit);
      var earr__8714 = editable__8713.arr;
      added_leaf_QMARK_.val = true;
      cljs.core.array_copy_downward.call(null, earr__8714, 2 * idx__8711, earr__8714, 2 * (idx__8711 + 1), 2 * (n__8712 - idx__8711));
      earr__8714[2 * idx__8711] = key;
      earr__8714[2 * idx__8711 + 1] = val;
      editable__8713.bitmap = editable__8713.bitmap | bit__8710;
      return editable__8713
    }else {
      if(n__8712 >= 16) {
        var nodes__8715 = cljs.core.make_array.call(null, 32);
        var jdx__8716 = hash >>> shift & 31;
        nodes__8715[jdx__8716] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
        var i__8717 = 0;
        var j__8718 = 0;
        while(true) {
          if(i__8717 < 32) {
            if((this__8708.bitmap >>> i__8717 & 1) === 0) {
              var G__8771 = i__8717 + 1;
              var G__8772 = j__8718;
              i__8717 = G__8771;
              j__8718 = G__8772;
              continue
            }else {
              nodes__8715[i__8717] = !(this__8708.arr[j__8718] == null) ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, cljs.core.hash.call(null, this__8708.arr[j__8718]), this__8708.arr[j__8718], this__8708.arr[j__8718 + 1], added_leaf_QMARK_) : this__8708.arr[j__8718 + 1];
              var G__8773 = i__8717 + 1;
              var G__8774 = j__8718 + 2;
              i__8717 = G__8773;
              j__8718 = G__8774;
              continue
            }
          }else {
          }
          break
        }
        return new cljs.core.ArrayNode(edit, n__8712 + 1, nodes__8715)
      }else {
        if("\ufdd0'else") {
          var new_arr__8719 = cljs.core.make_array.call(null, 2 * (n__8712 + 4));
          cljs.core.array_copy.call(null, this__8708.arr, 0, new_arr__8719, 0, 2 * idx__8711);
          new_arr__8719[2 * idx__8711] = key;
          new_arr__8719[2 * idx__8711 + 1] = val;
          cljs.core.array_copy.call(null, this__8708.arr, 2 * idx__8711, new_arr__8719, 2 * (idx__8711 + 1), 2 * (n__8712 - idx__8711));
          added_leaf_QMARK_.val = true;
          var editable__8720 = inode__8709.ensure_editable(edit);
          editable__8720.arr = new_arr__8719;
          editable__8720.bitmap = editable__8720.bitmap | bit__8710;
          return editable__8720
        }else {
          return null
        }
      }
    }
  }else {
    var key_or_nil__8721 = this__8708.arr[2 * idx__8711];
    var val_or_node__8722 = this__8708.arr[2 * idx__8711 + 1];
    if(key_or_nil__8721 == null) {
      var n__8723 = val_or_node__8722.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__8723 === val_or_node__8722) {
        return inode__8709
      }else {
        return cljs.core.edit_and_set.call(null, inode__8709, edit, 2 * idx__8711 + 1, n__8723)
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__8721)) {
        if(val === val_or_node__8722) {
          return inode__8709
        }else {
          return cljs.core.edit_and_set.call(null, inode__8709, edit, 2 * idx__8711 + 1, val)
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_.val = true;
          return cljs.core.edit_and_set.call(null, inode__8709, edit, 2 * idx__8711, null, 2 * idx__8711 + 1, cljs.core.create_node.call(null, edit, shift + 5, key_or_nil__8721, val_or_node__8722, hash, key, val))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_seq = function() {
  var this__8724 = this;
  var inode__8725 = this;
  return cljs.core.create_inode_seq.call(null, this__8724.arr)
};
cljs.core.BitmapIndexedNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__8726 = this;
  var inode__8727 = this;
  var bit__8728 = 1 << (hash >>> shift & 31);
  if((this__8726.bitmap & bit__8728) === 0) {
    return inode__8727
  }else {
    var idx__8729 = cljs.core.bitmap_indexed_node_index.call(null, this__8726.bitmap, bit__8728);
    var key_or_nil__8730 = this__8726.arr[2 * idx__8729];
    var val_or_node__8731 = this__8726.arr[2 * idx__8729 + 1];
    if(key_or_nil__8730 == null) {
      var n__8732 = val_or_node__8731.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
      if(n__8732 === val_or_node__8731) {
        return inode__8727
      }else {
        if(!(n__8732 == null)) {
          return cljs.core.edit_and_set.call(null, inode__8727, edit, 2 * idx__8729 + 1, n__8732)
        }else {
          if(this__8726.bitmap === bit__8728) {
            return null
          }else {
            if("\ufdd0'else") {
              return inode__8727.edit_and_remove_pair(edit, bit__8728, idx__8729)
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__8730)) {
        removed_leaf_QMARK_[0] = true;
        return inode__8727.edit_and_remove_pair(edit, bit__8728, idx__8729)
      }else {
        if("\ufdd0'else") {
          return inode__8727
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.ensure_editable = function(e) {
  var this__8733 = this;
  var inode__8734 = this;
  if(e === this__8733.edit) {
    return inode__8734
  }else {
    var n__8735 = cljs.core.bit_count.call(null, this__8733.bitmap);
    var new_arr__8736 = cljs.core.make_array.call(null, n__8735 < 0 ? 4 : 2 * (n__8735 + 1));
    cljs.core.array_copy.call(null, this__8733.arr, 0, new_arr__8736, 0, 2 * n__8735);
    return new cljs.core.BitmapIndexedNode(e, this__8733.bitmap, new_arr__8736)
  }
};
cljs.core.BitmapIndexedNode.prototype.kv_reduce = function(f, init) {
  var this__8737 = this;
  var inode__8738 = this;
  return cljs.core.inode_kv_reduce.call(null, this__8737.arr, f, init)
};
cljs.core.BitmapIndexedNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__8739 = this;
  var inode__8740 = this;
  var bit__8741 = 1 << (hash >>> shift & 31);
  if((this__8739.bitmap & bit__8741) === 0) {
    return not_found
  }else {
    var idx__8742 = cljs.core.bitmap_indexed_node_index.call(null, this__8739.bitmap, bit__8741);
    var key_or_nil__8743 = this__8739.arr[2 * idx__8742];
    var val_or_node__8744 = this__8739.arr[2 * idx__8742 + 1];
    if(key_or_nil__8743 == null) {
      return val_or_node__8744.inode_find(shift + 5, hash, key, not_found)
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__8743)) {
        return cljs.core.PersistentVector.fromArray([key_or_nil__8743, val_or_node__8744], true)
      }else {
        if("\ufdd0'else") {
          return not_found
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_without = function(shift, hash, key) {
  var this__8745 = this;
  var inode__8746 = this;
  var bit__8747 = 1 << (hash >>> shift & 31);
  if((this__8745.bitmap & bit__8747) === 0) {
    return inode__8746
  }else {
    var idx__8748 = cljs.core.bitmap_indexed_node_index.call(null, this__8745.bitmap, bit__8747);
    var key_or_nil__8749 = this__8745.arr[2 * idx__8748];
    var val_or_node__8750 = this__8745.arr[2 * idx__8748 + 1];
    if(key_or_nil__8749 == null) {
      var n__8751 = val_or_node__8750.inode_without(shift + 5, hash, key);
      if(n__8751 === val_or_node__8750) {
        return inode__8746
      }else {
        if(!(n__8751 == null)) {
          return new cljs.core.BitmapIndexedNode(null, this__8745.bitmap, cljs.core.clone_and_set.call(null, this__8745.arr, 2 * idx__8748 + 1, n__8751))
        }else {
          if(this__8745.bitmap === bit__8747) {
            return null
          }else {
            if("\ufdd0'else") {
              return new cljs.core.BitmapIndexedNode(null, this__8745.bitmap ^ bit__8747, cljs.core.remove_pair.call(null, this__8745.arr, idx__8748))
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__8749)) {
        return new cljs.core.BitmapIndexedNode(null, this__8745.bitmap ^ bit__8747, cljs.core.remove_pair.call(null, this__8745.arr, idx__8748))
      }else {
        if("\ufdd0'else") {
          return inode__8746
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__8752 = this;
  var inode__8753 = this;
  var bit__8754 = 1 << (hash >>> shift & 31);
  var idx__8755 = cljs.core.bitmap_indexed_node_index.call(null, this__8752.bitmap, bit__8754);
  if((this__8752.bitmap & bit__8754) === 0) {
    var n__8756 = cljs.core.bit_count.call(null, this__8752.bitmap);
    if(n__8756 >= 16) {
      var nodes__8757 = cljs.core.make_array.call(null, 32);
      var jdx__8758 = hash >>> shift & 31;
      nodes__8757[jdx__8758] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      var i__8759 = 0;
      var j__8760 = 0;
      while(true) {
        if(i__8759 < 32) {
          if((this__8752.bitmap >>> i__8759 & 1) === 0) {
            var G__8775 = i__8759 + 1;
            var G__8776 = j__8760;
            i__8759 = G__8775;
            j__8760 = G__8776;
            continue
          }else {
            nodes__8757[i__8759] = !(this__8752.arr[j__8760] == null) ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, cljs.core.hash.call(null, this__8752.arr[j__8760]), this__8752.arr[j__8760], this__8752.arr[j__8760 + 1], added_leaf_QMARK_) : this__8752.arr[j__8760 + 1];
            var G__8777 = i__8759 + 1;
            var G__8778 = j__8760 + 2;
            i__8759 = G__8777;
            j__8760 = G__8778;
            continue
          }
        }else {
        }
        break
      }
      return new cljs.core.ArrayNode(null, n__8756 + 1, nodes__8757)
    }else {
      var new_arr__8761 = cljs.core.make_array.call(null, 2 * (n__8756 + 1));
      cljs.core.array_copy.call(null, this__8752.arr, 0, new_arr__8761, 0, 2 * idx__8755);
      new_arr__8761[2 * idx__8755] = key;
      new_arr__8761[2 * idx__8755 + 1] = val;
      cljs.core.array_copy.call(null, this__8752.arr, 2 * idx__8755, new_arr__8761, 2 * (idx__8755 + 1), 2 * (n__8756 - idx__8755));
      added_leaf_QMARK_.val = true;
      return new cljs.core.BitmapIndexedNode(null, this__8752.bitmap | bit__8754, new_arr__8761)
    }
  }else {
    var key_or_nil__8762 = this__8752.arr[2 * idx__8755];
    var val_or_node__8763 = this__8752.arr[2 * idx__8755 + 1];
    if(key_or_nil__8762 == null) {
      var n__8764 = val_or_node__8763.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__8764 === val_or_node__8763) {
        return inode__8753
      }else {
        return new cljs.core.BitmapIndexedNode(null, this__8752.bitmap, cljs.core.clone_and_set.call(null, this__8752.arr, 2 * idx__8755 + 1, n__8764))
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__8762)) {
        if(val === val_or_node__8763) {
          return inode__8753
        }else {
          return new cljs.core.BitmapIndexedNode(null, this__8752.bitmap, cljs.core.clone_and_set.call(null, this__8752.arr, 2 * idx__8755 + 1, val))
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_.val = true;
          return new cljs.core.BitmapIndexedNode(null, this__8752.bitmap, cljs.core.clone_and_set.call(null, this__8752.arr, 2 * idx__8755, null, 2 * idx__8755 + 1, cljs.core.create_node.call(null, shift + 5, key_or_nil__8762, val_or_node__8763, hash, key, val)))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__8765 = this;
  var inode__8766 = this;
  var bit__8767 = 1 << (hash >>> shift & 31);
  if((this__8765.bitmap & bit__8767) === 0) {
    return not_found
  }else {
    var idx__8768 = cljs.core.bitmap_indexed_node_index.call(null, this__8765.bitmap, bit__8767);
    var key_or_nil__8769 = this__8765.arr[2 * idx__8768];
    var val_or_node__8770 = this__8765.arr[2 * idx__8768 + 1];
    if(key_or_nil__8769 == null) {
      return val_or_node__8770.inode_lookup(shift + 5, hash, key, not_found)
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__8769)) {
        return val_or_node__8770
      }else {
        if("\ufdd0'else") {
          return not_found
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode;
cljs.core.BitmapIndexedNode.EMPTY = new cljs.core.BitmapIndexedNode(null, 0, cljs.core.make_array.call(null, 0));
cljs.core.pack_array_node = function pack_array_node(array_node, edit, idx) {
  var arr__8786 = array_node.arr;
  var len__8787 = 2 * (array_node.cnt - 1);
  var new_arr__8788 = cljs.core.make_array.call(null, len__8787);
  var i__8789 = 0;
  var j__8790 = 1;
  var bitmap__8791 = 0;
  while(true) {
    if(i__8789 < len__8787) {
      if(function() {
        var and__3941__auto____8792 = !(i__8789 === idx);
        if(and__3941__auto____8792) {
          return!(arr__8786[i__8789] == null)
        }else {
          return and__3941__auto____8792
        }
      }()) {
        new_arr__8788[j__8790] = arr__8786[i__8789];
        var G__8793 = i__8789 + 1;
        var G__8794 = j__8790 + 2;
        var G__8795 = bitmap__8791 | 1 << i__8789;
        i__8789 = G__8793;
        j__8790 = G__8794;
        bitmap__8791 = G__8795;
        continue
      }else {
        var G__8796 = i__8789 + 1;
        var G__8797 = j__8790;
        var G__8798 = bitmap__8791;
        i__8789 = G__8796;
        j__8790 = G__8797;
        bitmap__8791 = G__8798;
        continue
      }
    }else {
      return new cljs.core.BitmapIndexedNode(edit, bitmap__8791, new_arr__8788)
    }
    break
  }
};
cljs.core.ArrayNode = function(edit, cnt, arr) {
  this.edit = edit;
  this.cnt = cnt;
  this.arr = arr
};
cljs.core.ArrayNode.cljs$lang$type = true;
cljs.core.ArrayNode.cljs$lang$ctorPrSeq = function(this__2250__auto__) {
  return cljs.core.list.call(null, "cljs.core/ArrayNode")
};
cljs.core.ArrayNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__8799 = this;
  var inode__8800 = this;
  var idx__8801 = hash >>> shift & 31;
  var node__8802 = this__8799.arr[idx__8801];
  if(node__8802 == null) {
    var editable__8803 = cljs.core.edit_and_set.call(null, inode__8800, edit, idx__8801, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_));
    editable__8803.cnt = editable__8803.cnt + 1;
    return editable__8803
  }else {
    var n__8804 = node__8802.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__8804 === node__8802) {
      return inode__8800
    }else {
      return cljs.core.edit_and_set.call(null, inode__8800, edit, idx__8801, n__8804)
    }
  }
};
cljs.core.ArrayNode.prototype.inode_seq = function() {
  var this__8805 = this;
  var inode__8806 = this;
  return cljs.core.create_array_node_seq.call(null, this__8805.arr)
};
cljs.core.ArrayNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__8807 = this;
  var inode__8808 = this;
  var idx__8809 = hash >>> shift & 31;
  var node__8810 = this__8807.arr[idx__8809];
  if(node__8810 == null) {
    return inode__8808
  }else {
    var n__8811 = node__8810.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
    if(n__8811 === node__8810) {
      return inode__8808
    }else {
      if(n__8811 == null) {
        if(this__8807.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode__8808, edit, idx__8809)
        }else {
          var editable__8812 = cljs.core.edit_and_set.call(null, inode__8808, edit, idx__8809, n__8811);
          editable__8812.cnt = editable__8812.cnt - 1;
          return editable__8812
        }
      }else {
        if("\ufdd0'else") {
          return cljs.core.edit_and_set.call(null, inode__8808, edit, idx__8809, n__8811)
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.ArrayNode.prototype.ensure_editable = function(e) {
  var this__8813 = this;
  var inode__8814 = this;
  if(e === this__8813.edit) {
    return inode__8814
  }else {
    return new cljs.core.ArrayNode(e, this__8813.cnt, this__8813.arr.slice())
  }
};
cljs.core.ArrayNode.prototype.kv_reduce = function(f, init) {
  var this__8815 = this;
  var inode__8816 = this;
  var len__8817 = this__8815.arr.length;
  var i__8818 = 0;
  var init__8819 = init;
  while(true) {
    if(i__8818 < len__8817) {
      var node__8820 = this__8815.arr[i__8818];
      if(!(node__8820 == null)) {
        var init__8821 = node__8820.kv_reduce(f, init__8819);
        if(cljs.core.reduced_QMARK_.call(null, init__8821)) {
          return cljs.core.deref.call(null, init__8821)
        }else {
          var G__8840 = i__8818 + 1;
          var G__8841 = init__8821;
          i__8818 = G__8840;
          init__8819 = G__8841;
          continue
        }
      }else {
        return null
      }
    }else {
      return init__8819
    }
    break
  }
};
cljs.core.ArrayNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__8822 = this;
  var inode__8823 = this;
  var idx__8824 = hash >>> shift & 31;
  var node__8825 = this__8822.arr[idx__8824];
  if(!(node__8825 == null)) {
    return node__8825.inode_find(shift + 5, hash, key, not_found)
  }else {
    return not_found
  }
};
cljs.core.ArrayNode.prototype.inode_without = function(shift, hash, key) {
  var this__8826 = this;
  var inode__8827 = this;
  var idx__8828 = hash >>> shift & 31;
  var node__8829 = this__8826.arr[idx__8828];
  if(!(node__8829 == null)) {
    var n__8830 = node__8829.inode_without(shift + 5, hash, key);
    if(n__8830 === node__8829) {
      return inode__8827
    }else {
      if(n__8830 == null) {
        if(this__8826.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode__8827, null, idx__8828)
        }else {
          return new cljs.core.ArrayNode(null, this__8826.cnt - 1, cljs.core.clone_and_set.call(null, this__8826.arr, idx__8828, n__8830))
        }
      }else {
        if("\ufdd0'else") {
          return new cljs.core.ArrayNode(null, this__8826.cnt, cljs.core.clone_and_set.call(null, this__8826.arr, idx__8828, n__8830))
        }else {
          return null
        }
      }
    }
  }else {
    return inode__8827
  }
};
cljs.core.ArrayNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__8831 = this;
  var inode__8832 = this;
  var idx__8833 = hash >>> shift & 31;
  var node__8834 = this__8831.arr[idx__8833];
  if(node__8834 == null) {
    return new cljs.core.ArrayNode(null, this__8831.cnt + 1, cljs.core.clone_and_set.call(null, this__8831.arr, idx__8833, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_)))
  }else {
    var n__8835 = node__8834.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__8835 === node__8834) {
      return inode__8832
    }else {
      return new cljs.core.ArrayNode(null, this__8831.cnt, cljs.core.clone_and_set.call(null, this__8831.arr, idx__8833, n__8835))
    }
  }
};
cljs.core.ArrayNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__8836 = this;
  var inode__8837 = this;
  var idx__8838 = hash >>> shift & 31;
  var node__8839 = this__8836.arr[idx__8838];
  if(!(node__8839 == null)) {
    return node__8839.inode_lookup(shift + 5, hash, key, not_found)
  }else {
    return not_found
  }
};
cljs.core.ArrayNode;
cljs.core.hash_collision_node_find_index = function hash_collision_node_find_index(arr, cnt, key) {
  var lim__8844 = 2 * cnt;
  var i__8845 = 0;
  while(true) {
    if(i__8845 < lim__8844) {
      if(cljs.core.key_test.call(null, key, arr[i__8845])) {
        return i__8845
      }else {
        var G__8846 = i__8845 + 2;
        i__8845 = G__8846;
        continue
      }
    }else {
      return-1
    }
    break
  }
};
cljs.core.HashCollisionNode = function(edit, collision_hash, cnt, arr) {
  this.edit = edit;
  this.collision_hash = collision_hash;
  this.cnt = cnt;
  this.arr = arr
};
cljs.core.HashCollisionNode.cljs$lang$type = true;
cljs.core.HashCollisionNode.cljs$lang$ctorPrSeq = function(this__2250__auto__) {
  return cljs.core.list.call(null, "cljs.core/HashCollisionNode")
};
cljs.core.HashCollisionNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__8847 = this;
  var inode__8848 = this;
  if(hash === this__8847.collision_hash) {
    var idx__8849 = cljs.core.hash_collision_node_find_index.call(null, this__8847.arr, this__8847.cnt, key);
    if(idx__8849 === -1) {
      if(this__8847.arr.length > 2 * this__8847.cnt) {
        var editable__8850 = cljs.core.edit_and_set.call(null, inode__8848, edit, 2 * this__8847.cnt, key, 2 * this__8847.cnt + 1, val);
        added_leaf_QMARK_.val = true;
        editable__8850.cnt = editable__8850.cnt + 1;
        return editable__8850
      }else {
        var len__8851 = this__8847.arr.length;
        var new_arr__8852 = cljs.core.make_array.call(null, len__8851 + 2);
        cljs.core.array_copy.call(null, this__8847.arr, 0, new_arr__8852, 0, len__8851);
        new_arr__8852[len__8851] = key;
        new_arr__8852[len__8851 + 1] = val;
        added_leaf_QMARK_.val = true;
        return inode__8848.ensure_editable_array(edit, this__8847.cnt + 1, new_arr__8852)
      }
    }else {
      if(this__8847.arr[idx__8849 + 1] === val) {
        return inode__8848
      }else {
        return cljs.core.edit_and_set.call(null, inode__8848, edit, idx__8849 + 1, val)
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(edit, 1 << (this__8847.collision_hash >>> shift & 31), [null, inode__8848, null, null])).inode_assoc_BANG_(edit, shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_seq = function() {
  var this__8853 = this;
  var inode__8854 = this;
  return cljs.core.create_inode_seq.call(null, this__8853.arr)
};
cljs.core.HashCollisionNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__8855 = this;
  var inode__8856 = this;
  var idx__8857 = cljs.core.hash_collision_node_find_index.call(null, this__8855.arr, this__8855.cnt, key);
  if(idx__8857 === -1) {
    return inode__8856
  }else {
    removed_leaf_QMARK_[0] = true;
    if(this__8855.cnt === 1) {
      return null
    }else {
      var editable__8858 = inode__8856.ensure_editable(edit);
      var earr__8859 = editable__8858.arr;
      earr__8859[idx__8857] = earr__8859[2 * this__8855.cnt - 2];
      earr__8859[idx__8857 + 1] = earr__8859[2 * this__8855.cnt - 1];
      earr__8859[2 * this__8855.cnt - 1] = null;
      earr__8859[2 * this__8855.cnt - 2] = null;
      editable__8858.cnt = editable__8858.cnt - 1;
      return editable__8858
    }
  }
};
cljs.core.HashCollisionNode.prototype.ensure_editable = function(e) {
  var this__8860 = this;
  var inode__8861 = this;
  if(e === this__8860.edit) {
    return inode__8861
  }else {
    var new_arr__8862 = cljs.core.make_array.call(null, 2 * (this__8860.cnt + 1));
    cljs.core.array_copy.call(null, this__8860.arr, 0, new_arr__8862, 0, 2 * this__8860.cnt);
    return new cljs.core.HashCollisionNode(e, this__8860.collision_hash, this__8860.cnt, new_arr__8862)
  }
};
cljs.core.HashCollisionNode.prototype.kv_reduce = function(f, init) {
  var this__8863 = this;
  var inode__8864 = this;
  return cljs.core.inode_kv_reduce.call(null, this__8863.arr, f, init)
};
cljs.core.HashCollisionNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__8865 = this;
  var inode__8866 = this;
  var idx__8867 = cljs.core.hash_collision_node_find_index.call(null, this__8865.arr, this__8865.cnt, key);
  if(idx__8867 < 0) {
    return not_found
  }else {
    if(cljs.core.key_test.call(null, key, this__8865.arr[idx__8867])) {
      return cljs.core.PersistentVector.fromArray([this__8865.arr[idx__8867], this__8865.arr[idx__8867 + 1]], true)
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.inode_without = function(shift, hash, key) {
  var this__8868 = this;
  var inode__8869 = this;
  var idx__8870 = cljs.core.hash_collision_node_find_index.call(null, this__8868.arr, this__8868.cnt, key);
  if(idx__8870 === -1) {
    return inode__8869
  }else {
    if(this__8868.cnt === 1) {
      return null
    }else {
      if("\ufdd0'else") {
        return new cljs.core.HashCollisionNode(null, this__8868.collision_hash, this__8868.cnt - 1, cljs.core.remove_pair.call(null, this__8868.arr, cljs.core.quot.call(null, idx__8870, 2)))
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__8871 = this;
  var inode__8872 = this;
  if(hash === this__8871.collision_hash) {
    var idx__8873 = cljs.core.hash_collision_node_find_index.call(null, this__8871.arr, this__8871.cnt, key);
    if(idx__8873 === -1) {
      var len__8874 = this__8871.arr.length;
      var new_arr__8875 = cljs.core.make_array.call(null, len__8874 + 2);
      cljs.core.array_copy.call(null, this__8871.arr, 0, new_arr__8875, 0, len__8874);
      new_arr__8875[len__8874] = key;
      new_arr__8875[len__8874 + 1] = val;
      added_leaf_QMARK_.val = true;
      return new cljs.core.HashCollisionNode(null, this__8871.collision_hash, this__8871.cnt + 1, new_arr__8875)
    }else {
      if(cljs.core._EQ_.call(null, this__8871.arr[idx__8873], val)) {
        return inode__8872
      }else {
        return new cljs.core.HashCollisionNode(null, this__8871.collision_hash, this__8871.cnt, cljs.core.clone_and_set.call(null, this__8871.arr, idx__8873 + 1, val))
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(null, 1 << (this__8871.collision_hash >>> shift & 31), [null, inode__8872])).inode_assoc(shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__8876 = this;
  var inode__8877 = this;
  var idx__8878 = cljs.core.hash_collision_node_find_index.call(null, this__8876.arr, this__8876.cnt, key);
  if(idx__8878 < 0) {
    return not_found
  }else {
    if(cljs.core.key_test.call(null, key, this__8876.arr[idx__8878])) {
      return this__8876.arr[idx__8878 + 1]
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.ensure_editable_array = function(e, count, array) {
  var this__8879 = this;
  var inode__8880 = this;
  if(e === this__8879.edit) {
    this__8879.arr = array;
    this__8879.cnt = count;
    return inode__8880
  }else {
    return new cljs.core.HashCollisionNode(this__8879.edit, this__8879.collision_hash, count, array)
  }
};
cljs.core.HashCollisionNode;
cljs.core.create_node = function() {
  var create_node = null;
  var create_node__6 = function(shift, key1, val1, key2hash, key2, val2) {
    var key1hash__8885 = cljs.core.hash.call(null, key1);
    if(key1hash__8885 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__8885, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___8886 = new cljs.core.Box(false);
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift, key1hash__8885, key1, val1, added_leaf_QMARK___8886).inode_assoc(shift, key2hash, key2, val2, added_leaf_QMARK___8886)
    }
  };
  var create_node__7 = function(edit, shift, key1, val1, key2hash, key2, val2) {
    var key1hash__8887 = cljs.core.hash.call(null, key1);
    if(key1hash__8887 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__8887, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___8888 = new cljs.core.Box(false);
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift, key1hash__8887, key1, val1, added_leaf_QMARK___8888).inode_assoc_BANG_(edit, shift, key2hash, key2, val2, added_leaf_QMARK___8888)
    }
  };
  create_node = function(edit, shift, key1, val1, key2hash, key2, val2) {
    switch(arguments.length) {
      case 6:
        return create_node__6.call(this, edit, shift, key1, val1, key2hash, key2);
      case 7:
        return create_node__7.call(this, edit, shift, key1, val1, key2hash, key2, val2)
    }
    throw"Invalid arity: " + arguments.length;
  };
  create_node.cljs$lang$arity$6 = create_node__6;
  create_node.cljs$lang$arity$7 = create_node__7;
  return create_node
}();
cljs.core.NodeSeq = function(meta, nodes, i, s, __hash) {
  this.meta = meta;
  this.nodes = nodes;
  this.i = i;
  this.s = s;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850572
};
cljs.core.NodeSeq.cljs$lang$type = true;
cljs.core.NodeSeq.cljs$lang$ctorPrSeq = function(this__2250__auto__) {
  return cljs.core.list.call(null, "cljs.core/NodeSeq")
};
cljs.core.NodeSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8889 = this;
  var h__2133__auto____8890 = this__8889.__hash;
  if(!(h__2133__auto____8890 == null)) {
    return h__2133__auto____8890
  }else {
    var h__2133__auto____8891 = cljs.core.hash_coll.call(null, coll);
    this__8889.__hash = h__2133__auto____8891;
    return h__2133__auto____8891
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8892 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.NodeSeq.prototype.toString = function() {
  var this__8893 = this;
  var this__8894 = this;
  return cljs.core.pr_str.call(null, this__8894)
};
cljs.core.NodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__8895 = this;
  return this$
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__8896 = this;
  if(this__8896.s == null) {
    return cljs.core.PersistentVector.fromArray([this__8896.nodes[this__8896.i], this__8896.nodes[this__8896.i + 1]], true)
  }else {
    return cljs.core.first.call(null, this__8896.s)
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__8897 = this;
  if(this__8897.s == null) {
    return cljs.core.create_inode_seq.call(null, this__8897.nodes, this__8897.i + 2, null)
  }else {
    return cljs.core.create_inode_seq.call(null, this__8897.nodes, this__8897.i, cljs.core.next.call(null, this__8897.s))
  }
};
cljs.core.NodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8898 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.NodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8899 = this;
  return new cljs.core.NodeSeq(meta, this__8899.nodes, this__8899.i, this__8899.s, this__8899.__hash)
};
cljs.core.NodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8900 = this;
  return this__8900.meta
};
cljs.core.NodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8901 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__8901.meta)
};
cljs.core.NodeSeq;
cljs.core.create_inode_seq = function() {
  var create_inode_seq = null;
  var create_inode_seq__1 = function(nodes) {
    return create_inode_seq.call(null, nodes, 0, null)
  };
  var create_inode_seq__3 = function(nodes, i, s) {
    if(s == null) {
      var len__8908 = nodes.length;
      var j__8909 = i;
      while(true) {
        if(j__8909 < len__8908) {
          if(!(nodes[j__8909] == null)) {
            return new cljs.core.NodeSeq(null, nodes, j__8909, null, null)
          }else {
            var temp__4090__auto____8910 = nodes[j__8909 + 1];
            if(cljs.core.truth_(temp__4090__auto____8910)) {
              var node__8911 = temp__4090__auto____8910;
              var temp__4090__auto____8912 = node__8911.inode_seq();
              if(cljs.core.truth_(temp__4090__auto____8912)) {
                var node_seq__8913 = temp__4090__auto____8912;
                return new cljs.core.NodeSeq(null, nodes, j__8909 + 2, node_seq__8913, null)
              }else {
                var G__8914 = j__8909 + 2;
                j__8909 = G__8914;
                continue
              }
            }else {
              var G__8915 = j__8909 + 2;
              j__8909 = G__8915;
              continue
            }
          }
        }else {
          return null
        }
        break
      }
    }else {
      return new cljs.core.NodeSeq(null, nodes, i, s, null)
    }
  };
  create_inode_seq = function(nodes, i, s) {
    switch(arguments.length) {
      case 1:
        return create_inode_seq__1.call(this, nodes);
      case 3:
        return create_inode_seq__3.call(this, nodes, i, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  create_inode_seq.cljs$lang$arity$1 = create_inode_seq__1;
  create_inode_seq.cljs$lang$arity$3 = create_inode_seq__3;
  return create_inode_seq
}();
cljs.core.ArrayNodeSeq = function(meta, nodes, i, s, __hash) {
  this.meta = meta;
  this.nodes = nodes;
  this.i = i;
  this.s = s;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850572
};
cljs.core.ArrayNodeSeq.cljs$lang$type = true;
cljs.core.ArrayNodeSeq.cljs$lang$ctorPrSeq = function(this__2250__auto__) {
  return cljs.core.list.call(null, "cljs.core/ArrayNodeSeq")
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8916 = this;
  var h__2133__auto____8917 = this__8916.__hash;
  if(!(h__2133__auto____8917 == null)) {
    return h__2133__auto____8917
  }else {
    var h__2133__auto____8918 = cljs.core.hash_coll.call(null, coll);
    this__8916.__hash = h__2133__auto____8918;
    return h__2133__auto____8918
  }
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8919 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.ArrayNodeSeq.prototype.toString = function() {
  var this__8920 = this;
  var this__8921 = this;
  return cljs.core.pr_str.call(null, this__8921)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__8922 = this;
  return this$
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__8923 = this;
  return cljs.core.first.call(null, this__8923.s)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__8924 = this;
  return cljs.core.create_array_node_seq.call(null, null, this__8924.nodes, this__8924.i, cljs.core.next.call(null, this__8924.s))
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8925 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8926 = this;
  return new cljs.core.ArrayNodeSeq(meta, this__8926.nodes, this__8926.i, this__8926.s, this__8926.__hash)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8927 = this;
  return this__8927.meta
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8928 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__8928.meta)
};
cljs.core.ArrayNodeSeq;
cljs.core.create_array_node_seq = function() {
  var create_array_node_seq = null;
  var create_array_node_seq__1 = function(nodes) {
    return create_array_node_seq.call(null, null, nodes, 0, null)
  };
  var create_array_node_seq__4 = function(meta, nodes, i, s) {
    if(s == null) {
      var len__8935 = nodes.length;
      var j__8936 = i;
      while(true) {
        if(j__8936 < len__8935) {
          var temp__4090__auto____8937 = nodes[j__8936];
          if(cljs.core.truth_(temp__4090__auto____8937)) {
            var nj__8938 = temp__4090__auto____8937;
            var temp__4090__auto____8939 = nj__8938.inode_seq();
            if(cljs.core.truth_(temp__4090__auto____8939)) {
              var ns__8940 = temp__4090__auto____8939;
              return new cljs.core.ArrayNodeSeq(meta, nodes, j__8936 + 1, ns__8940, null)
            }else {
              var G__8941 = j__8936 + 1;
              j__8936 = G__8941;
              continue
            }
          }else {
            var G__8942 = j__8936 + 1;
            j__8936 = G__8942;
            continue
          }
        }else {
          return null
        }
        break
      }
    }else {
      return new cljs.core.ArrayNodeSeq(meta, nodes, i, s, null)
    }
  };
  create_array_node_seq = function(meta, nodes, i, s) {
    switch(arguments.length) {
      case 1:
        return create_array_node_seq__1.call(this, meta);
      case 4:
        return create_array_node_seq__4.call(this, meta, nodes, i, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  create_array_node_seq.cljs$lang$arity$1 = create_array_node_seq__1;
  create_array_node_seq.cljs$lang$arity$4 = create_array_node_seq__4;
  return create_array_node_seq
}();
cljs.core.PersistentHashMap = function(meta, cnt, root, has_nil_QMARK_, nil_val, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.root = root;
  this.has_nil_QMARK_ = has_nil_QMARK_;
  this.nil_val = nil_val;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 16123663
};
cljs.core.PersistentHashMap.cljs$lang$type = true;
cljs.core.PersistentHashMap.cljs$lang$ctorPrSeq = function(this__2250__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentHashMap")
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__8945 = this;
  return new cljs.core.TransientHashMap({}, this__8945.root, this__8945.cnt, this__8945.has_nil_QMARK_, this__8945.nil_val)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8946 = this;
  var h__2133__auto____8947 = this__8946.__hash;
  if(!(h__2133__auto____8947 == null)) {
    return h__2133__auto____8947
  }else {
    var h__2133__auto____8948 = cljs.core.hash_imap.call(null, coll);
    this__8946.__hash = h__2133__auto____8948;
    return h__2133__auto____8948
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8949 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8950 = this;
  if(k == null) {
    if(this__8950.has_nil_QMARK_) {
      return this__8950.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__8950.root == null) {
      return not_found
    }else {
      if("\ufdd0'else") {
        return this__8950.root.inode_lookup(0, cljs.core.hash.call(null, k), k, not_found)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__8951 = this;
  if(k == null) {
    if(function() {
      var and__3941__auto____8952 = this__8951.has_nil_QMARK_;
      if(and__3941__auto____8952) {
        return v === this__8951.nil_val
      }else {
        return and__3941__auto____8952
      }
    }()) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__8951.meta, this__8951.has_nil_QMARK_ ? this__8951.cnt : this__8951.cnt + 1, this__8951.root, true, v, null)
    }
  }else {
    var added_leaf_QMARK___8953 = new cljs.core.Box(false);
    var new_root__8954 = (this__8951.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__8951.root).inode_assoc(0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK___8953);
    if(new_root__8954 === this__8951.root) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__8951.meta, added_leaf_QMARK___8953.val ? this__8951.cnt + 1 : this__8951.cnt, new_root__8954, this__8951.has_nil_QMARK_, this__8951.nil_val, null)
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__8955 = this;
  if(k == null) {
    return this__8955.has_nil_QMARK_
  }else {
    if(this__8955.root == null) {
      return false
    }else {
      if("\ufdd0'else") {
        return!(this__8955.root.inode_lookup(0, cljs.core.hash.call(null, k), k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.call = function() {
  var G__8978 = null;
  var G__8978__2 = function(this_sym8956, k) {
    var this__8958 = this;
    var this_sym8956__8959 = this;
    var coll__8960 = this_sym8956__8959;
    return coll__8960.cljs$core$ILookup$_lookup$arity$2(coll__8960, k)
  };
  var G__8978__3 = function(this_sym8957, k, not_found) {
    var this__8958 = this;
    var this_sym8957__8961 = this;
    var coll__8962 = this_sym8957__8961;
    return coll__8962.cljs$core$ILookup$_lookup$arity$3(coll__8962, k, not_found)
  };
  G__8978 = function(this_sym8957, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8978__2.call(this, this_sym8957, k);
      case 3:
        return G__8978__3.call(this, this_sym8957, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8978
}();
cljs.core.PersistentHashMap.prototype.apply = function(this_sym8943, args8944) {
  var this__8963 = this;
  return this_sym8943.call.apply(this_sym8943, [this_sym8943].concat(args8944.slice()))
};
cljs.core.PersistentHashMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__8964 = this;
  var init__8965 = this__8964.has_nil_QMARK_ ? f.call(null, init, null, this__8964.nil_val) : init;
  if(cljs.core.reduced_QMARK_.call(null, init__8965)) {
    return cljs.core.deref.call(null, init__8965)
  }else {
    if(!(this__8964.root == null)) {
      return this__8964.root.kv_reduce(f, init__8965)
    }else {
      if("\ufdd0'else") {
        return init__8965
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__8966 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentHashMap.prototype.toString = function() {
  var this__8967 = this;
  var this__8968 = this;
  return cljs.core.pr_str.call(null, this__8968)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8969 = this;
  if(this__8969.cnt > 0) {
    var s__8970 = !(this__8969.root == null) ? this__8969.root.inode_seq() : null;
    if(this__8969.has_nil_QMARK_) {
      return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([null, this__8969.nil_val], true), s__8970)
    }else {
      return s__8970
    }
  }else {
    return null
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8971 = this;
  return this__8971.cnt
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8972 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8973 = this;
  return new cljs.core.PersistentHashMap(meta, this__8973.cnt, this__8973.root, this__8973.has_nil_QMARK_, this__8973.nil_val, this__8973.__hash)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8974 = this;
  return this__8974.meta
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8975 = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, this__8975.meta)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__8976 = this;
  if(k == null) {
    if(this__8976.has_nil_QMARK_) {
      return new cljs.core.PersistentHashMap(this__8976.meta, this__8976.cnt - 1, this__8976.root, false, null, null)
    }else {
      return coll
    }
  }else {
    if(this__8976.root == null) {
      return coll
    }else {
      if("\ufdd0'else") {
        var new_root__8977 = this__8976.root.inode_without(0, cljs.core.hash.call(null, k), k);
        if(new_root__8977 === this__8976.root) {
          return coll
        }else {
          return new cljs.core.PersistentHashMap(this__8976.meta, this__8976.cnt - 1, new_root__8977, this__8976.has_nil_QMARK_, this__8976.nil_val, null)
        }
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap;
cljs.core.PersistentHashMap.EMPTY = new cljs.core.PersistentHashMap(null, 0, null, false, null, 0);
cljs.core.PersistentHashMap.fromArrays = function(ks, vs) {
  var len__8979 = ks.length;
  var i__8980 = 0;
  var out__8981 = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
  while(true) {
    if(i__8980 < len__8979) {
      var G__8982 = i__8980 + 1;
      var G__8983 = cljs.core.assoc_BANG_.call(null, out__8981, ks[i__8980], vs[i__8980]);
      i__8980 = G__8982;
      out__8981 = G__8983;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__8981)
    }
    break
  }
};
cljs.core.TransientHashMap = function(edit, root, count, has_nil_QMARK_, nil_val) {
  this.edit = edit;
  this.root = root;
  this.count = count;
  this.has_nil_QMARK_ = has_nil_QMARK_;
  this.nil_val = nil_val;
  this.cljs$lang$protocol_mask$partition1$ = 14;
  this.cljs$lang$protocol_mask$partition0$ = 258
};
cljs.core.TransientHashMap.cljs$lang$type = true;
cljs.core.TransientHashMap.cljs$lang$ctorPrSeq = function(this__2250__auto__) {
  return cljs.core.list.call(null, "cljs.core/TransientHashMap")
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientMap$_dissoc_BANG_$arity$2 = function(tcoll, key) {
  var this__8984 = this;
  return tcoll.without_BANG_(key)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__8985 = this;
  return tcoll.assoc_BANG_(key, val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, val) {
  var this__8986 = this;
  return tcoll.conj_BANG_(val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__8987 = this;
  return tcoll.persistent_BANG_()
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__8988 = this;
  if(k == null) {
    if(this__8988.has_nil_QMARK_) {
      return this__8988.nil_val
    }else {
      return null
    }
  }else {
    if(this__8988.root == null) {
      return null
    }else {
      return this__8988.root.inode_lookup(0, cljs.core.hash.call(null, k), k)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__8989 = this;
  if(k == null) {
    if(this__8989.has_nil_QMARK_) {
      return this__8989.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__8989.root == null) {
      return not_found
    }else {
      return this__8989.root.inode_lookup(0, cljs.core.hash.call(null, k), k, not_found)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8990 = this;
  if(this__8990.edit) {
    return this__8990.count
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.conj_BANG_ = function(o) {
  var this__8991 = this;
  var tcoll__8992 = this;
  if(this__8991.edit) {
    if(function() {
      var G__8993__8994 = o;
      if(G__8993__8994) {
        if(function() {
          var or__3943__auto____8995 = G__8993__8994.cljs$lang$protocol_mask$partition0$ & 2048;
          if(or__3943__auto____8995) {
            return or__3943__auto____8995
          }else {
            return G__8993__8994.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__8993__8994.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__8993__8994)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__8993__8994)
      }
    }()) {
      return tcoll__8992.assoc_BANG_(cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es__8996 = cljs.core.seq.call(null, o);
      var tcoll__8997 = tcoll__8992;
      while(true) {
        var temp__4090__auto____8998 = cljs.core.first.call(null, es__8996);
        if(cljs.core.truth_(temp__4090__auto____8998)) {
          var e__8999 = temp__4090__auto____8998;
          var G__9010 = cljs.core.next.call(null, es__8996);
          var G__9011 = tcoll__8997.assoc_BANG_(cljs.core.key.call(null, e__8999), cljs.core.val.call(null, e__8999));
          es__8996 = G__9010;
          tcoll__8997 = G__9011;
          continue
        }else {
          return tcoll__8997
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent");
  }
};
cljs.core.TransientHashMap.prototype.assoc_BANG_ = function(k, v) {
  var this__9000 = this;
  var tcoll__9001 = this;
  if(this__9000.edit) {
    if(k == null) {
      if(this__9000.nil_val === v) {
      }else {
        this__9000.nil_val = v
      }
      if(this__9000.has_nil_QMARK_) {
      }else {
        this__9000.count = this__9000.count + 1;
        this__9000.has_nil_QMARK_ = true
      }
      return tcoll__9001
    }else {
      var added_leaf_QMARK___9002 = new cljs.core.Box(false);
      var node__9003 = (this__9000.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__9000.root).inode_assoc_BANG_(this__9000.edit, 0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK___9002);
      if(node__9003 === this__9000.root) {
      }else {
        this__9000.root = node__9003
      }
      if(added_leaf_QMARK___9002.val) {
        this__9000.count = this__9000.count + 1
      }else {
      }
      return tcoll__9001
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.without_BANG_ = function(k) {
  var this__9004 = this;
  var tcoll__9005 = this;
  if(this__9004.edit) {
    if(k == null) {
      if(this__9004.has_nil_QMARK_) {
        this__9004.has_nil_QMARK_ = false;
        this__9004.nil_val = null;
        this__9004.count = this__9004.count - 1;
        return tcoll__9005
      }else {
        return tcoll__9005
      }
    }else {
      if(this__9004.root == null) {
        return tcoll__9005
      }else {
        var removed_leaf_QMARK___9006 = new cljs.core.Box(false);
        var node__9007 = this__9004.root.inode_without_BANG_(this__9004.edit, 0, cljs.core.hash.call(null, k), k, removed_leaf_QMARK___9006);
        if(node__9007 === this__9004.root) {
        }else {
          this__9004.root = node__9007
        }
        if(cljs.core.truth_(removed_leaf_QMARK___9006[0])) {
          this__9004.count = this__9004.count - 1
        }else {
        }
        return tcoll__9005
      }
    }
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.persistent_BANG_ = function() {
  var this__9008 = this;
  var tcoll__9009 = this;
  if(this__9008.edit) {
    this__9008.edit = null;
    return new cljs.core.PersistentHashMap(null, this__9008.count, this__9008.root, this__9008.has_nil_QMARK_, this__9008.nil_val, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientHashMap;
cljs.core.tree_map_seq_push = function tree_map_seq_push(node, stack, ascending_QMARK_) {
  var t__9014 = node;
  var stack__9015 = stack;
  while(true) {
    if(!(t__9014 == null)) {
      var G__9016 = ascending_QMARK_ ? t__9014.left : t__9014.right;
      var G__9017 = cljs.core.conj.call(null, stack__9015, t__9014);
      t__9014 = G__9016;
      stack__9015 = G__9017;
      continue
    }else {
      return stack__9015
    }
    break
  }
};
cljs.core.PersistentTreeMapSeq = function(meta, stack, ascending_QMARK_, cnt, __hash) {
  this.meta = meta;
  this.stack = stack;
  this.ascending_QMARK_ = ascending_QMARK_;
  this.cnt = cnt;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850570
};
cljs.core.PersistentTreeMapSeq.cljs$lang$type = true;
cljs.core.PersistentTreeMapSeq.cljs$lang$ctorPrSeq = function(this__2250__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentTreeMapSeq")
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9018 = this;
  var h__2133__auto____9019 = this__9018.__hash;
  if(!(h__2133__auto____9019 == null)) {
    return h__2133__auto____9019
  }else {
    var h__2133__auto____9020 = cljs.core.hash_coll.call(null, coll);
    this__9018.__hash = h__2133__auto____9020;
    return h__2133__auto____9020
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9021 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentTreeMapSeq.prototype.toString = function() {
  var this__9022 = this;
  var this__9023 = this;
  return cljs.core.pr_str.call(null, this__9023)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__9024 = this;
  return this$
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9025 = this;
  if(this__9025.cnt < 0) {
    return cljs.core.count.call(null, cljs.core.next.call(null, coll)) + 1
  }else {
    return this__9025.cnt
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(this$) {
  var this__9026 = this;
  return cljs.core.peek.call(null, this__9026.stack)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(this$) {
  var this__9027 = this;
  var t__9028 = cljs.core.first.call(null, this__9027.stack);
  var next_stack__9029 = cljs.core.tree_map_seq_push.call(null, this__9027.ascending_QMARK_ ? t__9028.right : t__9028.left, cljs.core.next.call(null, this__9027.stack), this__9027.ascending_QMARK_);
  if(!(next_stack__9029 == null)) {
    return new cljs.core.PersistentTreeMapSeq(null, next_stack__9029, this__9027.ascending_QMARK_, this__9027.cnt - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9030 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9031 = this;
  return new cljs.core.PersistentTreeMapSeq(meta, this__9031.stack, this__9031.ascending_QMARK_, this__9031.cnt, this__9031.__hash)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9032 = this;
  return this__9032.meta
};
cljs.core.PersistentTreeMapSeq;
cljs.core.create_tree_map_seq = function create_tree_map_seq(tree, ascending_QMARK_, cnt) {
  return new cljs.core.PersistentTreeMapSeq(null, cljs.core.tree_map_seq_push.call(null, tree, null, ascending_QMARK_), ascending_QMARK_, cnt, null)
};
cljs.core.balance_left = function balance_left(key, val, ins, right) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins)) {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.left)) {
      return new cljs.core.RedNode(ins.key, ins.val, ins.left.blacken(), new cljs.core.BlackNode(key, val, ins.right, right, null), null)
    }else {
      if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.right)) {
        return new cljs.core.RedNode(ins.right.key, ins.right.val, new cljs.core.BlackNode(ins.key, ins.val, ins.left, ins.right.left, null), new cljs.core.BlackNode(key, val, ins.right.right, right, null), null)
      }else {
        if("\ufdd0'else") {
          return new cljs.core.BlackNode(key, val, ins, right, null)
        }else {
          return null
        }
      }
    }
  }else {
    return new cljs.core.BlackNode(key, val, ins, right, null)
  }
};
cljs.core.balance_right = function balance_right(key, val, left, ins) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins)) {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.right)) {
      return new cljs.core.RedNode(ins.key, ins.val, new cljs.core.BlackNode(key, val, left, ins.left, null), ins.right.blacken(), null)
    }else {
      if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.left)) {
        return new cljs.core.RedNode(ins.left.key, ins.left.val, new cljs.core.BlackNode(key, val, left, ins.left.left, null), new cljs.core.BlackNode(ins.key, ins.val, ins.left.right, ins.right, null), null)
      }else {
        if("\ufdd0'else") {
          return new cljs.core.BlackNode(key, val, left, ins, null)
        }else {
          return null
        }
      }
    }
  }else {
    return new cljs.core.BlackNode(key, val, left, ins, null)
  }
};
cljs.core.balance_left_del = function balance_left_del(key, val, del, right) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, del)) {
    return new cljs.core.RedNode(key, val, del.blacken(), right, null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, right)) {
      return cljs.core.balance_right.call(null, key, val, del, right.redden())
    }else {
      if(function() {
        var and__3941__auto____9034 = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right);
        if(and__3941__auto____9034) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, right.left)
        }else {
          return and__3941__auto____9034
        }
      }()) {
        return new cljs.core.RedNode(right.left.key, right.left.val, new cljs.core.BlackNode(key, val, del, right.left.left, null), cljs.core.balance_right.call(null, right.key, right.val, right.left.right, right.right.redden()), null)
      }else {
        if("\ufdd0'else") {
          throw new Error("red-black tree invariant violation");
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.balance_right_del = function balance_right_del(key, val, left, del) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, del)) {
    return new cljs.core.RedNode(key, val, left, del.blacken(), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, left)) {
      return cljs.core.balance_left.call(null, key, val, left.redden(), del)
    }else {
      if(function() {
        var and__3941__auto____9036 = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, left);
        if(and__3941__auto____9036) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, left.right)
        }else {
          return and__3941__auto____9036
        }
      }()) {
        return new cljs.core.RedNode(left.right.key, left.right.val, cljs.core.balance_left.call(null, left.key, left.val, left.left.redden(), left.right.left), new cljs.core.BlackNode(key, val, left.right.right, del, null), null)
      }else {
        if("\ufdd0'else") {
          throw new Error("red-black tree invariant violation");
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.tree_map_kv_reduce = function tree_map_kv_reduce(node, f, init) {
  var init__9040 = f.call(null, init, node.key, node.val);
  if(cljs.core.reduced_QMARK_.call(null, init__9040)) {
    return cljs.core.deref.call(null, init__9040)
  }else {
    var init__9041 = !(node.left == null) ? tree_map_kv_reduce.call(null, node.left, f, init__9040) : init__9040;
    if(cljs.core.reduced_QMARK_.call(null, init__9041)) {
      return cljs.core.deref.call(null, init__9041)
    }else {
      var init__9042 = !(node.right == null) ? tree_map_kv_reduce.call(null, node.right, f, init__9041) : init__9041;
      if(cljs.core.reduced_QMARK_.call(null, init__9042)) {
        return cljs.core.deref.call(null, init__9042)
      }else {
        return init__9042
      }
    }
  }
};
cljs.core.BlackNode = function(key, val, left, right, __hash) {
  this.key = key;
  this.val = val;
  this.left = left;
  this.right = right;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32402207
};
cljs.core.BlackNode.cljs$lang$type = true;
cljs.core.BlackNode.cljs$lang$ctorPrSeq = function(this__2250__auto__) {
  return cljs.core.list.call(null, "cljs.core/BlackNode")
};
cljs.core.BlackNode.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9045 = this;
  var h__2133__auto____9046 = this__9045.__hash;
  if(!(h__2133__auto____9046 == null)) {
    return h__2133__auto____9046
  }else {
    var h__2133__auto____9047 = cljs.core.hash_coll.call(null, coll);
    this__9045.__hash = h__2133__auto____9047;
    return h__2133__auto____9047
  }
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__9048 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, null)
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__9049 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, not_found)
};
cljs.core.BlackNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__9050 = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([this__9050.key, this__9050.val], true), k, v)
};
cljs.core.BlackNode.prototype.call = function() {
  var G__9098 = null;
  var G__9098__2 = function(this_sym9051, k) {
    var this__9053 = this;
    var this_sym9051__9054 = this;
    var node__9055 = this_sym9051__9054;
    return node__9055.cljs$core$ILookup$_lookup$arity$2(node__9055, k)
  };
  var G__9098__3 = function(this_sym9052, k, not_found) {
    var this__9053 = this;
    var this_sym9052__9056 = this;
    var node__9057 = this_sym9052__9056;
    return node__9057.cljs$core$ILookup$_lookup$arity$3(node__9057, k, not_found)
  };
  G__9098 = function(this_sym9052, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9098__2.call(this, this_sym9052, k);
      case 3:
        return G__9098__3.call(this, this_sym9052, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9098
}();
cljs.core.BlackNode.prototype.apply = function(this_sym9043, args9044) {
  var this__9058 = this;
  return this_sym9043.call.apply(this_sym9043, [this_sym9043].concat(args9044.slice()))
};
cljs.core.BlackNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__9059 = this;
  return cljs.core.PersistentVector.fromArray([this__9059.key, this__9059.val, o], true)
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__9060 = this;
  return this__9060.key
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__9061 = this;
  return this__9061.val
};
cljs.core.BlackNode.prototype.add_right = function(ins) {
  var this__9062 = this;
  var node__9063 = this;
  return ins.balance_right(node__9063)
};
cljs.core.BlackNode.prototype.redden = function() {
  var this__9064 = this;
  var node__9065 = this;
  return new cljs.core.RedNode(this__9064.key, this__9064.val, this__9064.left, this__9064.right, null)
};
cljs.core.BlackNode.prototype.remove_right = function(del) {
  var this__9066 = this;
  var node__9067 = this;
  return cljs.core.balance_right_del.call(null, this__9066.key, this__9066.val, this__9066.left, del)
};
cljs.core.BlackNode.prototype.replace = function(key, val, left, right) {
  var this__9068 = this;
  var node__9069 = this;
  return new cljs.core.BlackNode(key, val, left, right, null)
};
cljs.core.BlackNode.prototype.kv_reduce = function(f, init) {
  var this__9070 = this;
  var node__9071 = this;
  return cljs.core.tree_map_kv_reduce.call(null, node__9071, f, init)
};
cljs.core.BlackNode.prototype.remove_left = function(del) {
  var this__9072 = this;
  var node__9073 = this;
  return cljs.core.balance_left_del.call(null, this__9072.key, this__9072.val, del, this__9072.right)
};
cljs.core.BlackNode.prototype.add_left = function(ins) {
  var this__9074 = this;
  var node__9075 = this;
  return ins.balance_left(node__9075)
};
cljs.core.BlackNode.prototype.balance_left = function(parent) {
  var this__9076 = this;
  var node__9077 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, node__9077, parent.right, null)
};
cljs.core.BlackNode.prototype.toString = function() {
  var G__9099 = null;
  var G__9099__0 = function() {
    var this__9078 = this;
    var this__9080 = this;
    return cljs.core.pr_str.call(null, this__9080)
  };
  G__9099 = function() {
    switch(arguments.length) {
      case 0:
        return G__9099__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9099
}();
cljs.core.BlackNode.prototype.balance_right = function(parent) {
  var this__9081 = this;
  var node__9082 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__9082, null)
};
cljs.core.BlackNode.prototype.blacken = function() {
  var this__9083 = this;
  var node__9084 = this;
  return node__9084
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__9085 = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__9086 = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.BlackNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__9087 = this;
  return cljs.core.list.call(null, this__9087.key, this__9087.val)
};
cljs.core.BlackNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__9088 = this;
  return 2
};
cljs.core.BlackNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__9089 = this;
  return this__9089.val
};
cljs.core.BlackNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__9090 = this;
  return cljs.core.PersistentVector.fromArray([this__9090.key], true)
};
cljs.core.BlackNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__9091 = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([this__9091.key, this__9091.val], true), n, v)
};
cljs.core.BlackNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9092 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.BlackNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__9093 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([this__9093.key, this__9093.val], true), meta)
};
cljs.core.BlackNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__9094 = this;
  return null
};
cljs.core.BlackNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__9095 = this;
  if(n === 0) {
    return this__9095.key
  }else {
    if(n === 1) {
      return this__9095.val
    }else {
      if("\ufdd0'else") {
        return null
      }else {
        return null
      }
    }
  }
};
cljs.core.BlackNode.prototype.cljs$core$IIndexed$_nth$arity$3 = function(node, n, not_found) {
  var this__9096 = this;
  if(n === 0) {
    return this__9096.key
  }else {
    if(n === 1) {
      return this__9096.val
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.BlackNode.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(node) {
  var this__9097 = this;
  return cljs.core.PersistentVector.EMPTY
};
cljs.core.BlackNode;
cljs.core.RedNode = function(key, val, left, right, __hash) {
  this.key = key;
  this.val = val;
  this.left = left;
  this.right = right;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32402207
};
cljs.core.RedNode.cljs$lang$type = true;
cljs.core.RedNode.cljs$lang$ctorPrSeq = function(this__2250__auto__) {
  return cljs.core.list.call(null, "cljs.core/RedNode")
};
cljs.core.RedNode.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9102 = this;
  var h__2133__auto____9103 = this__9102.__hash;
  if(!(h__2133__auto____9103 == null)) {
    return h__2133__auto____9103
  }else {
    var h__2133__auto____9104 = cljs.core.hash_coll.call(null, coll);
    this__9102.__hash = h__2133__auto____9104;
    return h__2133__auto____9104
  }
};
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__9105 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, null)
};
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__9106 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, not_found)
};
cljs.core.RedNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__9107 = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([this__9107.key, this__9107.val], true), k, v)
};
cljs.core.RedNode.prototype.call = function() {
  var G__9155 = null;
  var G__9155__2 = function(this_sym9108, k) {
    var this__9110 = this;
    var this_sym9108__9111 = this;
    var node__9112 = this_sym9108__9111;
    return node__9112.cljs$core$ILookup$_lookup$arity$2(node__9112, k)
  };
  var G__9155__3 = function(this_sym9109, k, not_found) {
    var this__9110 = this;
    var this_sym9109__9113 = this;
    var node__9114 = this_sym9109__9113;
    return node__9114.cljs$core$ILookup$_lookup$arity$3(node__9114, k, not_found)
  };
  G__9155 = function(this_sym9109, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9155__2.call(this, this_sym9109, k);
      case 3:
        return G__9155__3.call(this, this_sym9109, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9155
}();
cljs.core.RedNode.prototype.apply = function(this_sym9100, args9101) {
  var this__9115 = this;
  return this_sym9100.call.apply(this_sym9100, [this_sym9100].concat(args9101.slice()))
};
cljs.core.RedNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__9116 = this;
  return cljs.core.PersistentVector.fromArray([this__9116.key, this__9116.val, o], true)
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__9117 = this;
  return this__9117.key
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__9118 = this;
  return this__9118.val
};
cljs.core.RedNode.prototype.add_right = function(ins) {
  var this__9119 = this;
  var node__9120 = this;
  return new cljs.core.RedNode(this__9119.key, this__9119.val, this__9119.left, ins, null)
};
cljs.core.RedNode.prototype.redden = function() {
  var this__9121 = this;
  var node__9122 = this;
  throw new Error("red-black tree invariant violation");
};
cljs.core.RedNode.prototype.remove_right = function(del) {
  var this__9123 = this;
  var node__9124 = this;
  return new cljs.core.RedNode(this__9123.key, this__9123.val, this__9123.left, del, null)
};
cljs.core.RedNode.prototype.replace = function(key, val, left, right) {
  var this__9125 = this;
  var node__9126 = this;
  return new cljs.core.RedNode(key, val, left, right, null)
};
cljs.core.RedNode.prototype.kv_reduce = function(f, init) {
  var this__9127 = this;
  var node__9128 = this;
  return cljs.core.tree_map_kv_reduce.call(null, node__9128, f, init)
};
cljs.core.RedNode.prototype.remove_left = function(del) {
  var this__9129 = this;
  var node__9130 = this;
  return new cljs.core.RedNode(this__9129.key, this__9129.val, del, this__9129.right, null)
};
cljs.core.RedNode.prototype.add_left = function(ins) {
  var this__9131 = this;
  var node__9132 = this;
  return new cljs.core.RedNode(this__9131.key, this__9131.val, ins, this__9131.right, null)
};
cljs.core.RedNode.prototype.balance_left = function(parent) {
  var this__9133 = this;
  var node__9134 = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__9133.left)) {
    return new cljs.core.RedNode(this__9133.key, this__9133.val, this__9133.left.blacken(), new cljs.core.BlackNode(parent.key, parent.val, this__9133.right, parent.right, null), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__9133.right)) {
      return new cljs.core.RedNode(this__9133.right.key, this__9133.right.val, new cljs.core.BlackNode(this__9133.key, this__9133.val, this__9133.left, this__9133.right.left, null), new cljs.core.BlackNode(parent.key, parent.val, this__9133.right.right, parent.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, node__9134, parent.right, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.toString = function() {
  var G__9156 = null;
  var G__9156__0 = function() {
    var this__9135 = this;
    var this__9137 = this;
    return cljs.core.pr_str.call(null, this__9137)
  };
  G__9156 = function() {
    switch(arguments.length) {
      case 0:
        return G__9156__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9156
}();
cljs.core.RedNode.prototype.balance_right = function(parent) {
  var this__9138 = this;
  var node__9139 = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__9138.right)) {
    return new cljs.core.RedNode(this__9138.key, this__9138.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__9138.left, null), this__9138.right.blacken(), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__9138.left)) {
      return new cljs.core.RedNode(this__9138.left.key, this__9138.left.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__9138.left.left, null), new cljs.core.BlackNode(this__9138.key, this__9138.val, this__9138.left.right, this__9138.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__9139, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.blacken = function() {
  var this__9140 = this;
  var node__9141 = this;
  return new cljs.core.BlackNode(this__9140.key, this__9140.val, this__9140.left, this__9140.right, null)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__9142 = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__9143 = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.RedNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__9144 = this;
  return cljs.core.list.call(null, this__9144.key, this__9144.val)
};
cljs.core.RedNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__9145 = this;
  return 2
};
cljs.core.RedNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__9146 = this;
  return this__9146.val
};
cljs.core.RedNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__9147 = this;
  return cljs.core.PersistentVector.fromArray([this__9147.key], true)
};
cljs.core.RedNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__9148 = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([this__9148.key, this__9148.val], true), n, v)
};
cljs.core.RedNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9149 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.RedNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__9150 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([this__9150.key, this__9150.val], true), meta)
};
cljs.core.RedNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__9151 = this;
  return null
};
cljs.core.RedNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__9152 = this;
  if(n === 0) {
    return this__9152.key
  }else {
    if(n === 1) {
      return this__9152.val
    }else {
      if("\ufdd0'else") {
        return null
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.cljs$core$IIndexed$_nth$arity$3 = function(node, n, not_found) {
  var this__9153 = this;
  if(n === 0) {
    return this__9153.key
  }else {
    if(n === 1) {
      return this__9153.val
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(node) {
  var this__9154 = this;
  return cljs.core.PersistentVector.EMPTY
};
cljs.core.RedNode;
cljs.core.tree_map_add = function tree_map_add(comp, tree, k, v, found) {
  if(tree == null) {
    return new cljs.core.RedNode(k, v, null, null, null)
  }else {
    var c__9160 = comp.call(null, k, tree.key);
    if(c__9160 === 0) {
      found[0] = tree;
      return null
    }else {
      if(c__9160 < 0) {
        var ins__9161 = tree_map_add.call(null, comp, tree.left, k, v, found);
        if(!(ins__9161 == null)) {
          return tree.add_left(ins__9161)
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var ins__9162 = tree_map_add.call(null, comp, tree.right, k, v, found);
          if(!(ins__9162 == null)) {
            return tree.add_right(ins__9162)
          }else {
            return null
          }
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.tree_map_append = function tree_map_append(left, right) {
  if(left == null) {
    return right
  }else {
    if(right == null) {
      return left
    }else {
      if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, left)) {
        if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right)) {
          var app__9165 = tree_map_append.call(null, left.right, right.left);
          if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app__9165)) {
            return new cljs.core.RedNode(app__9165.key, app__9165.val, new cljs.core.RedNode(left.key, left.val, left.left, app__9165.left, null), new cljs.core.RedNode(right.key, right.val, app__9165.right, right.right, null), null)
          }else {
            return new cljs.core.RedNode(left.key, left.val, left.left, new cljs.core.RedNode(right.key, right.val, app__9165, right.right, null), null)
          }
        }else {
          return new cljs.core.RedNode(left.key, left.val, left.left, tree_map_append.call(null, left.right, right), null)
        }
      }else {
        if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right)) {
          return new cljs.core.RedNode(right.key, right.val, tree_map_append.call(null, left, right.left), right.right, null)
        }else {
          if("\ufdd0'else") {
            var app__9166 = tree_map_append.call(null, left.right, right.left);
            if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app__9166)) {
              return new cljs.core.RedNode(app__9166.key, app__9166.val, new cljs.core.BlackNode(left.key, left.val, left.left, app__9166.left, null), new cljs.core.BlackNode(right.key, right.val, app__9166.right, right.right, null), null)
            }else {
              return cljs.core.balance_left_del.call(null, left.key, left.val, left.left, new cljs.core.BlackNode(right.key, right.val, app__9166, right.right, null))
            }
          }else {
            return null
          }
        }
      }
    }
  }
};
cljs.core.tree_map_remove = function tree_map_remove(comp, tree, k, found) {
  if(!(tree == null)) {
    var c__9172 = comp.call(null, k, tree.key);
    if(c__9172 === 0) {
      found[0] = tree;
      return cljs.core.tree_map_append.call(null, tree.left, tree.right)
    }else {
      if(c__9172 < 0) {
        var del__9173 = tree_map_remove.call(null, comp, tree.left, k, found);
        if(function() {
          var or__3943__auto____9174 = !(del__9173 == null);
          if(or__3943__auto____9174) {
            return or__3943__auto____9174
          }else {
            return!(found[0] == null)
          }
        }()) {
          if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.left)) {
            return cljs.core.balance_left_del.call(null, tree.key, tree.val, del__9173, tree.right)
          }else {
            return new cljs.core.RedNode(tree.key, tree.val, del__9173, tree.right, null)
          }
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var del__9175 = tree_map_remove.call(null, comp, tree.right, k, found);
          if(function() {
            var or__3943__auto____9176 = !(del__9175 == null);
            if(or__3943__auto____9176) {
              return or__3943__auto____9176
            }else {
              return!(found[0] == null)
            }
          }()) {
            if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.right)) {
              return cljs.core.balance_right_del.call(null, tree.key, tree.val, tree.left, del__9175)
            }else {
              return new cljs.core.RedNode(tree.key, tree.val, tree.left, del__9175, null)
            }
          }else {
            return null
          }
        }else {
          return null
        }
      }
    }
  }else {
    return null
  }
};
cljs.core.tree_map_replace = function tree_map_replace(comp, tree, k, v) {
  var tk__9179 = tree.key;
  var c__9180 = comp.call(null, k, tk__9179);
  if(c__9180 === 0) {
    return tree.replace(tk__9179, v, tree.left, tree.right)
  }else {
    if(c__9180 < 0) {
      return tree.replace(tk__9179, tree.val, tree_map_replace.call(null, comp, tree.left, k, v), tree.right)
    }else {
      if("\ufdd0'else") {
        return tree.replace(tk__9179, tree.val, tree.left, tree_map_replace.call(null, comp, tree.right, k, v))
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentTreeMap = function(comp, tree, cnt, meta, __hash) {
  this.comp = comp;
  this.tree = tree;
  this.cnt = cnt;
  this.meta = meta;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 418776847
};
cljs.core.PersistentTreeMap.cljs$lang$type = true;
cljs.core.PersistentTreeMap.cljs$lang$ctorPrSeq = function(this__2250__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentTreeMap")
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9183 = this;
  var h__2133__auto____9184 = this__9183.__hash;
  if(!(h__2133__auto____9184 == null)) {
    return h__2133__auto____9184
  }else {
    var h__2133__auto____9185 = cljs.core.hash_imap.call(null, coll);
    this__9183.__hash = h__2133__auto____9185;
    return h__2133__auto____9185
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__9186 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__9187 = this;
  var n__9188 = coll.entry_at(k);
  if(!(n__9188 == null)) {
    return n__9188.val
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__9189 = this;
  var found__9190 = [null];
  var t__9191 = cljs.core.tree_map_add.call(null, this__9189.comp, this__9189.tree, k, v, found__9190);
  if(t__9191 == null) {
    var found_node__9192 = cljs.core.nth.call(null, found__9190, 0);
    if(cljs.core._EQ_.call(null, v, found_node__9192.val)) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__9189.comp, cljs.core.tree_map_replace.call(null, this__9189.comp, this__9189.tree, k, v), this__9189.cnt, this__9189.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__9189.comp, t__9191.blacken(), this__9189.cnt + 1, this__9189.meta, null)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__9193 = this;
  return!(coll.entry_at(k) == null)
};
cljs.core.PersistentTreeMap.prototype.call = function() {
  var G__9227 = null;
  var G__9227__2 = function(this_sym9194, k) {
    var this__9196 = this;
    var this_sym9194__9197 = this;
    var coll__9198 = this_sym9194__9197;
    return coll__9198.cljs$core$ILookup$_lookup$arity$2(coll__9198, k)
  };
  var G__9227__3 = function(this_sym9195, k, not_found) {
    var this__9196 = this;
    var this_sym9195__9199 = this;
    var coll__9200 = this_sym9195__9199;
    return coll__9200.cljs$core$ILookup$_lookup$arity$3(coll__9200, k, not_found)
  };
  G__9227 = function(this_sym9195, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9227__2.call(this, this_sym9195, k);
      case 3:
        return G__9227__3.call(this, this_sym9195, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9227
}();
cljs.core.PersistentTreeMap.prototype.apply = function(this_sym9181, args9182) {
  var this__9201 = this;
  return this_sym9181.call.apply(this_sym9181, [this_sym9181].concat(args9182.slice()))
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__9202 = this;
  if(!(this__9202.tree == null)) {
    return cljs.core.tree_map_kv_reduce.call(null, this__9202.tree, f, init)
  }else {
    return init
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__9203 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__9204 = this;
  if(this__9204.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__9204.tree, false, this__9204.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.toString = function() {
  var this__9205 = this;
  var this__9206 = this;
  return cljs.core.pr_str.call(null, this__9206)
};
cljs.core.PersistentTreeMap.prototype.entry_at = function(k) {
  var this__9207 = this;
  var coll__9208 = this;
  var t__9209 = this__9207.tree;
  while(true) {
    if(!(t__9209 == null)) {
      var c__9210 = this__9207.comp.call(null, k, t__9209.key);
      if(c__9210 === 0) {
        return t__9209
      }else {
        if(c__9210 < 0) {
          var G__9228 = t__9209.left;
          t__9209 = G__9228;
          continue
        }else {
          if("\ufdd0'else") {
            var G__9229 = t__9209.right;
            t__9209 = G__9229;
            continue
          }else {
            return null
          }
        }
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_sorted_seq$arity$2 = function(coll, ascending_QMARK_) {
  var this__9211 = this;
  if(this__9211.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__9211.tree, ascending_QMARK_, this__9211.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__9212 = this;
  if(this__9212.cnt > 0) {
    var stack__9213 = null;
    var t__9214 = this__9212.tree;
    while(true) {
      if(!(t__9214 == null)) {
        var c__9215 = this__9212.comp.call(null, k, t__9214.key);
        if(c__9215 === 0) {
          return new cljs.core.PersistentTreeMapSeq(null, cljs.core.conj.call(null, stack__9213, t__9214), ascending_QMARK_, -1, null)
        }else {
          if(cljs.core.truth_(ascending_QMARK_)) {
            if(c__9215 < 0) {
              var G__9230 = cljs.core.conj.call(null, stack__9213, t__9214);
              var G__9231 = t__9214.left;
              stack__9213 = G__9230;
              t__9214 = G__9231;
              continue
            }else {
              var G__9232 = stack__9213;
              var G__9233 = t__9214.right;
              stack__9213 = G__9232;
              t__9214 = G__9233;
              continue
            }
          }else {
            if("\ufdd0'else") {
              if(c__9215 > 0) {
                var G__9234 = cljs.core.conj.call(null, stack__9213, t__9214);
                var G__9235 = t__9214.right;
                stack__9213 = G__9234;
                t__9214 = G__9235;
                continue
              }else {
                var G__9236 = stack__9213;
                var G__9237 = t__9214.left;
                stack__9213 = G__9236;
                t__9214 = G__9237;
                continue
              }
            }else {
              return null
            }
          }
        }
      }else {
        if(stack__9213 == null) {
          return new cljs.core.PersistentTreeMapSeq(null, stack__9213, ascending_QMARK_, -1, null)
        }else {
          return null
        }
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_entry_key$arity$2 = function(coll, entry) {
  var this__9216 = this;
  return cljs.core.key.call(null, entry)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__9217 = this;
  return this__9217.comp
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9218 = this;
  if(this__9218.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__9218.tree, true, this__9218.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9219 = this;
  return this__9219.cnt
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9220 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9221 = this;
  return new cljs.core.PersistentTreeMap(this__9221.comp, this__9221.tree, this__9221.cnt, meta, this__9221.__hash)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9222 = this;
  return this__9222.meta
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9223 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeMap.EMPTY, this__9223.meta)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__9224 = this;
  var found__9225 = [null];
  var t__9226 = cljs.core.tree_map_remove.call(null, this__9224.comp, this__9224.tree, k, found__9225);
  if(t__9226 == null) {
    if(cljs.core.nth.call(null, found__9225, 0) == null) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__9224.comp, null, 0, this__9224.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__9224.comp, t__9226.blacken(), this__9224.cnt - 1, this__9224.meta, null)
  }
};
cljs.core.PersistentTreeMap;
cljs.core.PersistentTreeMap.EMPTY = new cljs.core.PersistentTreeMap(cljs.core.compare, null, 0, null, 0);
cljs.core.hash_map = function() {
  var hash_map__delegate = function(keyvals) {
    var in__9240 = cljs.core.seq.call(null, keyvals);
    var out__9241 = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
    while(true) {
      if(in__9240) {
        var G__9242 = cljs.core.nnext.call(null, in__9240);
        var G__9243 = cljs.core.assoc_BANG_.call(null, out__9241, cljs.core.first.call(null, in__9240), cljs.core.second.call(null, in__9240));
        in__9240 = G__9242;
        out__9241 = G__9243;
        continue
      }else {
        return cljs.core.persistent_BANG_.call(null, out__9241)
      }
      break
    }
  };
  var hash_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return hash_map__delegate.call(this, keyvals)
  };
  hash_map.cljs$lang$maxFixedArity = 0;
  hash_map.cljs$lang$applyTo = function(arglist__9244) {
    var keyvals = cljs.core.seq(arglist__9244);
    return hash_map__delegate(keyvals)
  };
  hash_map.cljs$lang$arity$variadic = hash_map__delegate;
  return hash_map
}();
cljs.core.array_map = function() {
  var array_map__delegate = function(keyvals) {
    return new cljs.core.PersistentArrayMap(null, cljs.core.quot.call(null, cljs.core.count.call(null, keyvals), 2), cljs.core.apply.call(null, cljs.core.array, keyvals), null)
  };
  var array_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return array_map__delegate.call(this, keyvals)
  };
  array_map.cljs$lang$maxFixedArity = 0;
  array_map.cljs$lang$applyTo = function(arglist__9245) {
    var keyvals = cljs.core.seq(arglist__9245);
    return array_map__delegate(keyvals)
  };
  array_map.cljs$lang$arity$variadic = array_map__delegate;
  return array_map
}();
cljs.core.obj_map = function() {
  var obj_map__delegate = function(keyvals) {
    var ks__9249 = [];
    var obj__9250 = {};
    var kvs__9251 = cljs.core.seq.call(null, keyvals);
    while(true) {
      if(kvs__9251) {
        ks__9249.push(cljs.core.first.call(null, kvs__9251));
        obj__9250[cljs.core.first.call(null, kvs__9251)] = cljs.core.second.call(null, kvs__9251);
        var G__9252 = cljs.core.nnext.call(null, kvs__9251);
        kvs__9251 = G__9252;
        continue
      }else {
        return cljs.core.ObjMap.fromObject.call(null, ks__9249, obj__9250)
      }
      break
    }
  };
  var obj_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return obj_map__delegate.call(this, keyvals)
  };
  obj_map.cljs$lang$maxFixedArity = 0;
  obj_map.cljs$lang$applyTo = function(arglist__9253) {
    var keyvals = cljs.core.seq(arglist__9253);
    return obj_map__delegate(keyvals)
  };
  obj_map.cljs$lang$arity$variadic = obj_map__delegate;
  return obj_map
}();
cljs.core.sorted_map = function() {
  var sorted_map__delegate = function(keyvals) {
    var in__9256 = cljs.core.seq.call(null, keyvals);
    var out__9257 = cljs.core.PersistentTreeMap.EMPTY;
    while(true) {
      if(in__9256) {
        var G__9258 = cljs.core.nnext.call(null, in__9256);
        var G__9259 = cljs.core.assoc.call(null, out__9257, cljs.core.first.call(null, in__9256), cljs.core.second.call(null, in__9256));
        in__9256 = G__9258;
        out__9257 = G__9259;
        continue
      }else {
        return out__9257
      }
      break
    }
  };
  var sorted_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return sorted_map__delegate.call(this, keyvals)
  };
  sorted_map.cljs$lang$maxFixedArity = 0;
  sorted_map.cljs$lang$applyTo = function(arglist__9260) {
    var keyvals = cljs.core.seq(arglist__9260);
    return sorted_map__delegate(keyvals)
  };
  sorted_map.cljs$lang$arity$variadic = sorted_map__delegate;
  return sorted_map
}();
cljs.core.sorted_map_by = function() {
  var sorted_map_by__delegate = function(comparator, keyvals) {
    var in__9263 = cljs.core.seq.call(null, keyvals);
    var out__9264 = new cljs.core.PersistentTreeMap(comparator, null, 0, null, 0);
    while(true) {
      if(in__9263) {
        var G__9265 = cljs.core.nnext.call(null, in__9263);
        var G__9266 = cljs.core.assoc.call(null, out__9264, cljs.core.first.call(null, in__9263), cljs.core.second.call(null, in__9263));
        in__9263 = G__9265;
        out__9264 = G__9266;
        continue
      }else {
        return out__9264
      }
      break
    }
  };
  var sorted_map_by = function(comparator, var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return sorted_map_by__delegate.call(this, comparator, keyvals)
  };
  sorted_map_by.cljs$lang$maxFixedArity = 1;
  sorted_map_by.cljs$lang$applyTo = function(arglist__9267) {
    var comparator = cljs.core.first(arglist__9267);
    var keyvals = cljs.core.rest(arglist__9267);
    return sorted_map_by__delegate(comparator, keyvals)
  };
  sorted_map_by.cljs$lang$arity$variadic = sorted_map_by__delegate;
  return sorted_map_by
}();
cljs.core.keys = function keys(hash_map) {
  return cljs.core.seq.call(null, cljs.core.map.call(null, cljs.core.first, hash_map))
};
cljs.core.key = function key(map_entry) {
  return cljs.core._key.call(null, map_entry)
};
cljs.core.vals = function vals(hash_map) {
  return cljs.core.seq.call(null, cljs.core.map.call(null, cljs.core.second, hash_map))
};
cljs.core.val = function val(map_entry) {
  return cljs.core._val.call(null, map_entry)
};
cljs.core.merge = function() {
  var merge__delegate = function(maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      return cljs.core.reduce.call(null, function(p1__9268_SHARP_, p2__9269_SHARP_) {
        return cljs.core.conj.call(null, function() {
          var or__3943__auto____9271 = p1__9268_SHARP_;
          if(cljs.core.truth_(or__3943__auto____9271)) {
            return or__3943__auto____9271
          }else {
            return cljs.core.ObjMap.EMPTY
          }
        }(), p2__9269_SHARP_)
      }, maps)
    }else {
      return null
    }
  };
  var merge = function(var_args) {
    var maps = null;
    if(goog.isDef(var_args)) {
      maps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return merge__delegate.call(this, maps)
  };
  merge.cljs$lang$maxFixedArity = 0;
  merge.cljs$lang$applyTo = function(arglist__9272) {
    var maps = cljs.core.seq(arglist__9272);
    return merge__delegate(maps)
  };
  merge.cljs$lang$arity$variadic = merge__delegate;
  return merge
}();
cljs.core.merge_with = function() {
  var merge_with__delegate = function(f, maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      var merge_entry__9280 = function(m, e) {
        var k__9278 = cljs.core.first.call(null, e);
        var v__9279 = cljs.core.second.call(null, e);
        if(cljs.core.contains_QMARK_.call(null, m, k__9278)) {
          return cljs.core.assoc.call(null, m, k__9278, f.call(null, cljs.core._lookup.call(null, m, k__9278, null), v__9279))
        }else {
          return cljs.core.assoc.call(null, m, k__9278, v__9279)
        }
      };
      var merge2__9282 = function(m1, m2) {
        return cljs.core.reduce.call(null, merge_entry__9280, function() {
          var or__3943__auto____9281 = m1;
          if(cljs.core.truth_(or__3943__auto____9281)) {
            return or__3943__auto____9281
          }else {
            return cljs.core.ObjMap.EMPTY
          }
        }(), cljs.core.seq.call(null, m2))
      };
      return cljs.core.reduce.call(null, merge2__9282, maps)
    }else {
      return null
    }
  };
  var merge_with = function(f, var_args) {
    var maps = null;
    if(goog.isDef(var_args)) {
      maps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return merge_with__delegate.call(this, f, maps)
  };
  merge_with.cljs$lang$maxFixedArity = 1;
  merge_with.cljs$lang$applyTo = function(arglist__9283) {
    var f = cljs.core.first(arglist__9283);
    var maps = cljs.core.rest(arglist__9283);
    return merge_with__delegate(f, maps)
  };
  merge_with.cljs$lang$arity$variadic = merge_with__delegate;
  return merge_with
}();
cljs.core.select_keys = function select_keys(map, keyseq) {
  var ret__9288 = cljs.core.ObjMap.EMPTY;
  var keys__9289 = cljs.core.seq.call(null, keyseq);
  while(true) {
    if(keys__9289) {
      var key__9290 = cljs.core.first.call(null, keys__9289);
      var entry__9291 = cljs.core._lookup.call(null, map, key__9290, "\ufdd0'cljs.core/not-found");
      var G__9292 = cljs.core.not_EQ_.call(null, entry__9291, "\ufdd0'cljs.core/not-found") ? cljs.core.assoc.call(null, ret__9288, key__9290, entry__9291) : ret__9288;
      var G__9293 = cljs.core.next.call(null, keys__9289);
      ret__9288 = G__9292;
      keys__9289 = G__9293;
      continue
    }else {
      return ret__9288
    }
    break
  }
};
cljs.core.PersistentHashSet = function(meta, hash_map, __hash) {
  this.meta = meta;
  this.hash_map = hash_map;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 15077647
};
cljs.core.PersistentHashSet.cljs$lang$type = true;
cljs.core.PersistentHashSet.cljs$lang$ctorPrSeq = function(this__2250__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentHashSet")
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__9297 = this;
  return new cljs.core.TransientHashSet(cljs.core.transient$.call(null, this__9297.hash_map))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9298 = this;
  var h__2133__auto____9299 = this__9298.__hash;
  if(!(h__2133__auto____9299 == null)) {
    return h__2133__auto____9299
  }else {
    var h__2133__auto____9300 = cljs.core.hash_iset.call(null, coll);
    this__9298.__hash = h__2133__auto____9300;
    return h__2133__auto____9300
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__9301 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, v, null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__9302 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__9302.hash_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentHashSet.prototype.call = function() {
  var G__9323 = null;
  var G__9323__2 = function(this_sym9303, k) {
    var this__9305 = this;
    var this_sym9303__9306 = this;
    var coll__9307 = this_sym9303__9306;
    return coll__9307.cljs$core$ILookup$_lookup$arity$2(coll__9307, k)
  };
  var G__9323__3 = function(this_sym9304, k, not_found) {
    var this__9305 = this;
    var this_sym9304__9308 = this;
    var coll__9309 = this_sym9304__9308;
    return coll__9309.cljs$core$ILookup$_lookup$arity$3(coll__9309, k, not_found)
  };
  G__9323 = function(this_sym9304, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9323__2.call(this, this_sym9304, k);
      case 3:
        return G__9323__3.call(this, this_sym9304, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9323
}();
cljs.core.PersistentHashSet.prototype.apply = function(this_sym9295, args9296) {
  var this__9310 = this;
  return this_sym9295.call.apply(this_sym9295, [this_sym9295].concat(args9296.slice()))
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9311 = this;
  return new cljs.core.PersistentHashSet(this__9311.meta, cljs.core.assoc.call(null, this__9311.hash_map, o, null), null)
};
cljs.core.PersistentHashSet.prototype.toString = function() {
  var this__9312 = this;
  var this__9313 = this;
  return cljs.core.pr_str.call(null, this__9313)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9314 = this;
  return cljs.core.keys.call(null, this__9314.hash_map)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__9315 = this;
  return new cljs.core.PersistentHashSet(this__9315.meta, cljs.core.dissoc.call(null, this__9315.hash_map, v), null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9316 = this;
  return cljs.core.count.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9317 = this;
  var and__3941__auto____9318 = cljs.core.set_QMARK_.call(null, other);
  if(and__3941__auto____9318) {
    var and__3941__auto____9319 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3941__auto____9319) {
      return cljs.core.every_QMARK_.call(null, function(p1__9294_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__9294_SHARP_)
      }, other)
    }else {
      return and__3941__auto____9319
    }
  }else {
    return and__3941__auto____9318
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9320 = this;
  return new cljs.core.PersistentHashSet(meta, this__9320.hash_map, this__9320.__hash)
};
cljs.core.PersistentHashSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9321 = this;
  return this__9321.meta
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9322 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentHashSet.EMPTY, this__9322.meta)
};
cljs.core.PersistentHashSet;
cljs.core.PersistentHashSet.EMPTY = new cljs.core.PersistentHashSet(null, cljs.core.hash_map.call(null), 0);
cljs.core.PersistentHashSet.fromArray = function(items) {
  var len__9324 = cljs.core.count.call(null, items);
  var i__9325 = 0;
  var out__9326 = cljs.core.transient$.call(null, cljs.core.PersistentHashSet.EMPTY);
  while(true) {
    if(i__9325 < len__9324) {
      var G__9327 = i__9325 + 1;
      var G__9328 = cljs.core.conj_BANG_.call(null, out__9326, items[i__9325]);
      i__9325 = G__9327;
      out__9326 = G__9328;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__9326)
    }
    break
  }
};
cljs.core.TransientHashSet = function(transient_map) {
  this.transient_map = transient_map;
  this.cljs$lang$protocol_mask$partition0$ = 259;
  this.cljs$lang$protocol_mask$partition1$ = 34
};
cljs.core.TransientHashSet.cljs$lang$type = true;
cljs.core.TransientHashSet.cljs$lang$ctorPrSeq = function(this__2250__auto__) {
  return cljs.core.list.call(null, "cljs.core/TransientHashSet")
};
cljs.core.TransientHashSet.prototype.call = function() {
  var G__9346 = null;
  var G__9346__2 = function(this_sym9332, k) {
    var this__9334 = this;
    var this_sym9332__9335 = this;
    var tcoll__9336 = this_sym9332__9335;
    if(cljs.core._lookup.call(null, this__9334.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return null
    }else {
      return k
    }
  };
  var G__9346__3 = function(this_sym9333, k, not_found) {
    var this__9334 = this;
    var this_sym9333__9337 = this;
    var tcoll__9338 = this_sym9333__9337;
    if(cljs.core._lookup.call(null, this__9334.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return not_found
    }else {
      return k
    }
  };
  G__9346 = function(this_sym9333, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9346__2.call(this, this_sym9333, k);
      case 3:
        return G__9346__3.call(this, this_sym9333, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9346
}();
cljs.core.TransientHashSet.prototype.apply = function(this_sym9330, args9331) {
  var this__9339 = this;
  return this_sym9330.call.apply(this_sym9330, [this_sym9330].concat(args9331.slice()))
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, v) {
  var this__9340 = this;
  return tcoll.cljs$core$ILookup$_lookup$arity$3(tcoll, v, null)
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, v, not_found) {
  var this__9341 = this;
  if(cljs.core._lookup.call(null, this__9341.transient_map, v, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
    return not_found
  }else {
    return v
  }
};
cljs.core.TransientHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__9342 = this;
  return cljs.core.count.call(null, this__9342.transient_map)
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientSet$_disjoin_BANG_$arity$2 = function(tcoll, v) {
  var this__9343 = this;
  this__9343.transient_map = cljs.core.dissoc_BANG_.call(null, this__9343.transient_map, v);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__9344 = this;
  this__9344.transient_map = cljs.core.assoc_BANG_.call(null, this__9344.transient_map, o, null);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__9345 = this;
  return new cljs.core.PersistentHashSet(null, cljs.core.persistent_BANG_.call(null, this__9345.transient_map), null)
};
cljs.core.TransientHashSet;
cljs.core.PersistentTreeSet = function(meta, tree_map, __hash) {
  this.meta = meta;
  this.tree_map = tree_map;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 417730831
};
cljs.core.PersistentTreeSet.cljs$lang$type = true;
cljs.core.PersistentTreeSet.cljs$lang$ctorPrSeq = function(this__2250__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentTreeSet")
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9349 = this;
  var h__2133__auto____9350 = this__9349.__hash;
  if(!(h__2133__auto____9350 == null)) {
    return h__2133__auto____9350
  }else {
    var h__2133__auto____9351 = cljs.core.hash_iset.call(null, coll);
    this__9349.__hash = h__2133__auto____9351;
    return h__2133__auto____9351
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__9352 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, v, null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__9353 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__9353.tree_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeSet.prototype.call = function() {
  var G__9379 = null;
  var G__9379__2 = function(this_sym9354, k) {
    var this__9356 = this;
    var this_sym9354__9357 = this;
    var coll__9358 = this_sym9354__9357;
    return coll__9358.cljs$core$ILookup$_lookup$arity$2(coll__9358, k)
  };
  var G__9379__3 = function(this_sym9355, k, not_found) {
    var this__9356 = this;
    var this_sym9355__9359 = this;
    var coll__9360 = this_sym9355__9359;
    return coll__9360.cljs$core$ILookup$_lookup$arity$3(coll__9360, k, not_found)
  };
  G__9379 = function(this_sym9355, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9379__2.call(this, this_sym9355, k);
      case 3:
        return G__9379__3.call(this, this_sym9355, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9379
}();
cljs.core.PersistentTreeSet.prototype.apply = function(this_sym9347, args9348) {
  var this__9361 = this;
  return this_sym9347.call.apply(this_sym9347, [this_sym9347].concat(args9348.slice()))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9362 = this;
  return new cljs.core.PersistentTreeSet(this__9362.meta, cljs.core.assoc.call(null, this__9362.tree_map, o, null), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__9363 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core.rseq.call(null, this__9363.tree_map))
};
cljs.core.PersistentTreeSet.prototype.toString = function() {
  var this__9364 = this;
  var this__9365 = this;
  return cljs.core.pr_str.call(null, this__9365)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq$arity$2 = function(coll, ascending_QMARK_) {
  var this__9366 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq.call(null, this__9366.tree_map, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__9367 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq_from.call(null, this__9367.tree_map, k, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_entry_key$arity$2 = function(coll, entry) {
  var this__9368 = this;
  return entry
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__9369 = this;
  return cljs.core._comparator.call(null, this__9369.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9370 = this;
  return cljs.core.keys.call(null, this__9370.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__9371 = this;
  return new cljs.core.PersistentTreeSet(this__9371.meta, cljs.core.dissoc.call(null, this__9371.tree_map, v), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9372 = this;
  return cljs.core.count.call(null, this__9372.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9373 = this;
  var and__3941__auto____9374 = cljs.core.set_QMARK_.call(null, other);
  if(and__3941__auto____9374) {
    var and__3941__auto____9375 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3941__auto____9375) {
      return cljs.core.every_QMARK_.call(null, function(p1__9329_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__9329_SHARP_)
      }, other)
    }else {
      return and__3941__auto____9375
    }
  }else {
    return and__3941__auto____9374
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9376 = this;
  return new cljs.core.PersistentTreeSet(meta, this__9376.tree_map, this__9376.__hash)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9377 = this;
  return this__9377.meta
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9378 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeSet.EMPTY, this__9378.meta)
};
cljs.core.PersistentTreeSet;
cljs.core.PersistentTreeSet.EMPTY = new cljs.core.PersistentTreeSet(null, cljs.core.sorted_map.call(null), 0);
cljs.core.hash_set = function() {
  var hash_set = null;
  var hash_set__0 = function() {
    return cljs.core.PersistentHashSet.EMPTY
  };
  var hash_set__1 = function() {
    var G__9384__delegate = function(keys) {
      var in__9382 = cljs.core.seq.call(null, keys);
      var out__9383 = cljs.core.transient$.call(null, cljs.core.PersistentHashSet.EMPTY);
      while(true) {
        if(cljs.core.seq.call(null, in__9382)) {
          var G__9385 = cljs.core.next.call(null, in__9382);
          var G__9386 = cljs.core.conj_BANG_.call(null, out__9383, cljs.core.first.call(null, in__9382));
          in__9382 = G__9385;
          out__9383 = G__9386;
          continue
        }else {
          return cljs.core.persistent_BANG_.call(null, out__9383)
        }
        break
      }
    };
    var G__9384 = function(var_args) {
      var keys = null;
      if(goog.isDef(var_args)) {
        keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__9384__delegate.call(this, keys)
    };
    G__9384.cljs$lang$maxFixedArity = 0;
    G__9384.cljs$lang$applyTo = function(arglist__9387) {
      var keys = cljs.core.seq(arglist__9387);
      return G__9384__delegate(keys)
    };
    G__9384.cljs$lang$arity$variadic = G__9384__delegate;
    return G__9384
  }();
  hash_set = function(var_args) {
    var keys = var_args;
    switch(arguments.length) {
      case 0:
        return hash_set__0.call(this);
      default:
        return hash_set__1.cljs$lang$arity$variadic(cljs.core.array_seq(arguments, 0))
    }
    throw"Invalid arity: " + arguments.length;
  };
  hash_set.cljs$lang$maxFixedArity = 0;
  hash_set.cljs$lang$applyTo = hash_set__1.cljs$lang$applyTo;
  hash_set.cljs$lang$arity$0 = hash_set__0;
  hash_set.cljs$lang$arity$variadic = hash_set__1.cljs$lang$arity$variadic;
  return hash_set
}();
cljs.core.set = function set(coll) {
  return cljs.core.apply.call(null, cljs.core.hash_set, coll)
};
cljs.core.sorted_set = function() {
  var sorted_set__delegate = function(keys) {
    return cljs.core.reduce.call(null, cljs.core._conj, cljs.core.PersistentTreeSet.EMPTY, keys)
  };
  var sorted_set = function(var_args) {
    var keys = null;
    if(goog.isDef(var_args)) {
      keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return sorted_set__delegate.call(this, keys)
  };
  sorted_set.cljs$lang$maxFixedArity = 0;
  sorted_set.cljs$lang$applyTo = function(arglist__9388) {
    var keys = cljs.core.seq(arglist__9388);
    return sorted_set__delegate(keys)
  };
  sorted_set.cljs$lang$arity$variadic = sorted_set__delegate;
  return sorted_set
}();
cljs.core.sorted_set_by = function() {
  var sorted_set_by__delegate = function(comparator, keys) {
    return cljs.core.reduce.call(null, cljs.core._conj, new cljs.core.PersistentTreeSet(null, cljs.core.sorted_map_by.call(null, comparator), 0), keys)
  };
  var sorted_set_by = function(comparator, var_args) {
    var keys = null;
    if(goog.isDef(var_args)) {
      keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return sorted_set_by__delegate.call(this, comparator, keys)
  };
  sorted_set_by.cljs$lang$maxFixedArity = 1;
  sorted_set_by.cljs$lang$applyTo = function(arglist__9390) {
    var comparator = cljs.core.first(arglist__9390);
    var keys = cljs.core.rest(arglist__9390);
    return sorted_set_by__delegate(comparator, keys)
  };
  sorted_set_by.cljs$lang$arity$variadic = sorted_set_by__delegate;
  return sorted_set_by
}();
cljs.core.replace = function replace(smap, coll) {
  if(cljs.core.vector_QMARK_.call(null, coll)) {
    var n__9396 = cljs.core.count.call(null, coll);
    return cljs.core.reduce.call(null, function(v, i) {
      var temp__4090__auto____9397 = cljs.core.find.call(null, smap, cljs.core.nth.call(null, v, i));
      if(cljs.core.truth_(temp__4090__auto____9397)) {
        var e__9398 = temp__4090__auto____9397;
        return cljs.core.assoc.call(null, v, i, cljs.core.second.call(null, e__9398))
      }else {
        return v
      }
    }, coll, cljs.core.take.call(null, n__9396, cljs.core.iterate.call(null, cljs.core.inc, 0)))
  }else {
    return cljs.core.map.call(null, function(p1__9389_SHARP_) {
      var temp__4090__auto____9399 = cljs.core.find.call(null, smap, p1__9389_SHARP_);
      if(cljs.core.truth_(temp__4090__auto____9399)) {
        var e__9400 = temp__4090__auto____9399;
        return cljs.core.second.call(null, e__9400)
      }else {
        return p1__9389_SHARP_
      }
    }, coll)
  }
};
cljs.core.distinct = function distinct(coll) {
  var step__9430 = function step(xs, seen) {
    return new cljs.core.LazySeq(null, false, function() {
      return function(p__9423, seen) {
        while(true) {
          var vec__9424__9425 = p__9423;
          var f__9426 = cljs.core.nth.call(null, vec__9424__9425, 0, null);
          var xs__9427 = vec__9424__9425;
          var temp__4092__auto____9428 = cljs.core.seq.call(null, xs__9427);
          if(temp__4092__auto____9428) {
            var s__9429 = temp__4092__auto____9428;
            if(cljs.core.contains_QMARK_.call(null, seen, f__9426)) {
              var G__9431 = cljs.core.rest.call(null, s__9429);
              var G__9432 = seen;
              p__9423 = G__9431;
              seen = G__9432;
              continue
            }else {
              return cljs.core.cons.call(null, f__9426, step.call(null, cljs.core.rest.call(null, s__9429), cljs.core.conj.call(null, seen, f__9426)))
            }
          }else {
            return null
          }
          break
        }
      }.call(null, xs, seen)
    }, null)
  };
  return step__9430.call(null, coll, cljs.core.PersistentHashSet.EMPTY)
};
cljs.core.butlast = function butlast(s) {
  var ret__9435 = cljs.core.PersistentVector.EMPTY;
  var s__9436 = s;
  while(true) {
    if(cljs.core.next.call(null, s__9436)) {
      var G__9437 = cljs.core.conj.call(null, ret__9435, cljs.core.first.call(null, s__9436));
      var G__9438 = cljs.core.next.call(null, s__9436);
      ret__9435 = G__9437;
      s__9436 = G__9438;
      continue
    }else {
      return cljs.core.seq.call(null, ret__9435)
    }
    break
  }
};
cljs.core.name = function name(x) {
  if(cljs.core.string_QMARK_.call(null, x)) {
    return x
  }else {
    if(function() {
      var or__3943__auto____9441 = cljs.core.keyword_QMARK_.call(null, x);
      if(or__3943__auto____9441) {
        return or__3943__auto____9441
      }else {
        return cljs.core.symbol_QMARK_.call(null, x)
      }
    }()) {
      var i__9442 = x.lastIndexOf("/");
      if(i__9442 < 0) {
        return cljs.core.subs.call(null, x, 2)
      }else {
        return cljs.core.subs.call(null, x, i__9442 + 1)
      }
    }else {
      if("\ufdd0'else") {
        throw new Error([cljs.core.str("Doesn't support name: "), cljs.core.str(x)].join(""));
      }else {
        return null
      }
    }
  }
};
cljs.core.namespace = function namespace(x) {
  if(function() {
    var or__3943__auto____9445 = cljs.core.keyword_QMARK_.call(null, x);
    if(or__3943__auto____9445) {
      return or__3943__auto____9445
    }else {
      return cljs.core.symbol_QMARK_.call(null, x)
    }
  }()) {
    var i__9446 = x.lastIndexOf("/");
    if(i__9446 > -1) {
      return cljs.core.subs.call(null, x, 2, i__9446)
    }else {
      return null
    }
  }else {
    throw new Error([cljs.core.str("Doesn't support namespace: "), cljs.core.str(x)].join(""));
  }
};
cljs.core.zipmap = function zipmap(keys, vals) {
  var map__9453 = cljs.core.ObjMap.EMPTY;
  var ks__9454 = cljs.core.seq.call(null, keys);
  var vs__9455 = cljs.core.seq.call(null, vals);
  while(true) {
    if(function() {
      var and__3941__auto____9456 = ks__9454;
      if(and__3941__auto____9456) {
        return vs__9455
      }else {
        return and__3941__auto____9456
      }
    }()) {
      var G__9457 = cljs.core.assoc.call(null, map__9453, cljs.core.first.call(null, ks__9454), cljs.core.first.call(null, vs__9455));
      var G__9458 = cljs.core.next.call(null, ks__9454);
      var G__9459 = cljs.core.next.call(null, vs__9455);
      map__9453 = G__9457;
      ks__9454 = G__9458;
      vs__9455 = G__9459;
      continue
    }else {
      return map__9453
    }
    break
  }
};
cljs.core.max_key = function() {
  var max_key = null;
  var max_key__2 = function(k, x) {
    return x
  };
  var max_key__3 = function(k, x, y) {
    if(k.call(null, x) > k.call(null, y)) {
      return x
    }else {
      return y
    }
  };
  var max_key__4 = function() {
    var G__9462__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__9447_SHARP_, p2__9448_SHARP_) {
        return max_key.call(null, k, p1__9447_SHARP_, p2__9448_SHARP_)
      }, max_key.call(null, k, x, y), more)
    };
    var G__9462 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__9462__delegate.call(this, k, x, y, more)
    };
    G__9462.cljs$lang$maxFixedArity = 3;
    G__9462.cljs$lang$applyTo = function(arglist__9463) {
      var k = cljs.core.first(arglist__9463);
      var x = cljs.core.first(cljs.core.next(arglist__9463));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9463)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9463)));
      return G__9462__delegate(k, x, y, more)
    };
    G__9462.cljs$lang$arity$variadic = G__9462__delegate;
    return G__9462
  }();
  max_key = function(k, x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return max_key__2.call(this, k, x);
      case 3:
        return max_key__3.call(this, k, x, y);
      default:
        return max_key__4.cljs$lang$arity$variadic(k, x, y, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  max_key.cljs$lang$maxFixedArity = 3;
  max_key.cljs$lang$applyTo = max_key__4.cljs$lang$applyTo;
  max_key.cljs$lang$arity$2 = max_key__2;
  max_key.cljs$lang$arity$3 = max_key__3;
  max_key.cljs$lang$arity$variadic = max_key__4.cljs$lang$arity$variadic;
  return max_key
}();
cljs.core.min_key = function() {
  var min_key = null;
  var min_key__2 = function(k, x) {
    return x
  };
  var min_key__3 = function(k, x, y) {
    if(k.call(null, x) < k.call(null, y)) {
      return x
    }else {
      return y
    }
  };
  var min_key__4 = function() {
    var G__9464__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__9460_SHARP_, p2__9461_SHARP_) {
        return min_key.call(null, k, p1__9460_SHARP_, p2__9461_SHARP_)
      }, min_key.call(null, k, x, y), more)
    };
    var G__9464 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__9464__delegate.call(this, k, x, y, more)
    };
    G__9464.cljs$lang$maxFixedArity = 3;
    G__9464.cljs$lang$applyTo = function(arglist__9465) {
      var k = cljs.core.first(arglist__9465);
      var x = cljs.core.first(cljs.core.next(arglist__9465));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9465)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9465)));
      return G__9464__delegate(k, x, y, more)
    };
    G__9464.cljs$lang$arity$variadic = G__9464__delegate;
    return G__9464
  }();
  min_key = function(k, x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return min_key__2.call(this, k, x);
      case 3:
        return min_key__3.call(this, k, x, y);
      default:
        return min_key__4.cljs$lang$arity$variadic(k, x, y, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  min_key.cljs$lang$maxFixedArity = 3;
  min_key.cljs$lang$applyTo = min_key__4.cljs$lang$applyTo;
  min_key.cljs$lang$arity$2 = min_key__2;
  min_key.cljs$lang$arity$3 = min_key__3;
  min_key.cljs$lang$arity$variadic = min_key__4.cljs$lang$arity$variadic;
  return min_key
}();
cljs.core.partition_all = function() {
  var partition_all = null;
  var partition_all__2 = function(n, coll) {
    return partition_all.call(null, n, n, coll)
  };
  var partition_all__3 = function(n, step, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__4092__auto____9468 = cljs.core.seq.call(null, coll);
      if(temp__4092__auto____9468) {
        var s__9469 = temp__4092__auto____9468;
        return cljs.core.cons.call(null, cljs.core.take.call(null, n, s__9469), partition_all.call(null, n, step, cljs.core.drop.call(null, step, s__9469)))
      }else {
        return null
      }
    }, null)
  };
  partition_all = function(n, step, coll) {
    switch(arguments.length) {
      case 2:
        return partition_all__2.call(this, n, step);
      case 3:
        return partition_all__3.call(this, n, step, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  partition_all.cljs$lang$arity$2 = partition_all__2;
  partition_all.cljs$lang$arity$3 = partition_all__3;
  return partition_all
}();
cljs.core.take_while = function take_while(pred, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__4092__auto____9472 = cljs.core.seq.call(null, coll);
    if(temp__4092__auto____9472) {
      var s__9473 = temp__4092__auto____9472;
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, s__9473)))) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__9473), take_while.call(null, pred, cljs.core.rest.call(null, s__9473)))
      }else {
        return null
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.mk_bound_fn = function mk_bound_fn(sc, test, key) {
  return function(e) {
    var comp__9475 = cljs.core._comparator.call(null, sc);
    return test.call(null, comp__9475.call(null, cljs.core._entry_key.call(null, sc, e), key), 0)
  }
};
cljs.core.subseq = function() {
  var subseq = null;
  var subseq__3 = function(sc, test, key) {
    var include__9487 = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.PersistentHashSet.fromArray([cljs.core._GT_, cljs.core._GT__EQ_]).call(null, test))) {
      var temp__4092__auto____9488 = cljs.core._sorted_seq_from.call(null, sc, key, true);
      if(cljs.core.truth_(temp__4092__auto____9488)) {
        var vec__9489__9490 = temp__4092__auto____9488;
        var e__9491 = cljs.core.nth.call(null, vec__9489__9490, 0, null);
        var s__9492 = vec__9489__9490;
        if(cljs.core.truth_(include__9487.call(null, e__9491))) {
          return s__9492
        }else {
          return cljs.core.next.call(null, s__9492)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include__9487, cljs.core._sorted_seq.call(null, sc, true))
    }
  };
  var subseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__4092__auto____9493 = cljs.core._sorted_seq_from.call(null, sc, start_key, true);
    if(cljs.core.truth_(temp__4092__auto____9493)) {
      var vec__9494__9495 = temp__4092__auto____9493;
      var e__9496 = cljs.core.nth.call(null, vec__9494__9495, 0, null);
      var s__9497 = vec__9494__9495;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, end_test, end_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, start_test, start_key).call(null, e__9496)) ? s__9497 : cljs.core.next.call(null, s__9497))
    }else {
      return null
    }
  };
  subseq = function(sc, start_test, start_key, end_test, end_key) {
    switch(arguments.length) {
      case 3:
        return subseq__3.call(this, sc, start_test, start_key);
      case 5:
        return subseq__5.call(this, sc, start_test, start_key, end_test, end_key)
    }
    throw"Invalid arity: " + arguments.length;
  };
  subseq.cljs$lang$arity$3 = subseq__3;
  subseq.cljs$lang$arity$5 = subseq__5;
  return subseq
}();
cljs.core.rsubseq = function() {
  var rsubseq = null;
  var rsubseq__3 = function(sc, test, key) {
    var include__9509 = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.PersistentHashSet.fromArray([cljs.core._LT_, cljs.core._LT__EQ_]).call(null, test))) {
      var temp__4092__auto____9510 = cljs.core._sorted_seq_from.call(null, sc, key, false);
      if(cljs.core.truth_(temp__4092__auto____9510)) {
        var vec__9511__9512 = temp__4092__auto____9510;
        var e__9513 = cljs.core.nth.call(null, vec__9511__9512, 0, null);
        var s__9514 = vec__9511__9512;
        if(cljs.core.truth_(include__9509.call(null, e__9513))) {
          return s__9514
        }else {
          return cljs.core.next.call(null, s__9514)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include__9509, cljs.core._sorted_seq.call(null, sc, false))
    }
  };
  var rsubseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__4092__auto____9515 = cljs.core._sorted_seq_from.call(null, sc, end_key, false);
    if(cljs.core.truth_(temp__4092__auto____9515)) {
      var vec__9516__9517 = temp__4092__auto____9515;
      var e__9518 = cljs.core.nth.call(null, vec__9516__9517, 0, null);
      var s__9519 = vec__9516__9517;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, start_test, start_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, end_test, end_key).call(null, e__9518)) ? s__9519 : cljs.core.next.call(null, s__9519))
    }else {
      return null
    }
  };
  rsubseq = function(sc, start_test, start_key, end_test, end_key) {
    switch(arguments.length) {
      case 3:
        return rsubseq__3.call(this, sc, start_test, start_key);
      case 5:
        return rsubseq__5.call(this, sc, start_test, start_key, end_test, end_key)
    }
    throw"Invalid arity: " + arguments.length;
  };
  rsubseq.cljs$lang$arity$3 = rsubseq__3;
  rsubseq.cljs$lang$arity$5 = rsubseq__5;
  return rsubseq
}();
cljs.core.Range = function(meta, start, end, step, __hash) {
  this.meta = meta;
  this.start = start;
  this.end = end;
  this.step = step;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32375006
};
cljs.core.Range.cljs$lang$type = true;
cljs.core.Range.cljs$lang$ctorPrSeq = function(this__2250__auto__) {
  return cljs.core.list.call(null, "cljs.core/Range")
};
cljs.core.Range.prototype.cljs$core$IHash$_hash$arity$1 = function(rng) {
  var this__9520 = this;
  var h__2133__auto____9521 = this__9520.__hash;
  if(!(h__2133__auto____9521 == null)) {
    return h__2133__auto____9521
  }else {
    var h__2133__auto____9522 = cljs.core.hash_coll.call(null, rng);
    this__9520.__hash = h__2133__auto____9522;
    return h__2133__auto____9522
  }
};
cljs.core.Range.prototype.cljs$core$INext$_next$arity$1 = function(rng) {
  var this__9523 = this;
  if(this__9523.step > 0) {
    if(this__9523.start + this__9523.step < this__9523.end) {
      return new cljs.core.Range(this__9523.meta, this__9523.start + this__9523.step, this__9523.end, this__9523.step, null)
    }else {
      return null
    }
  }else {
    if(this__9523.start + this__9523.step > this__9523.end) {
      return new cljs.core.Range(this__9523.meta, this__9523.start + this__9523.step, this__9523.end, this__9523.step, null)
    }else {
      return null
    }
  }
};
cljs.core.Range.prototype.cljs$core$ICollection$_conj$arity$2 = function(rng, o) {
  var this__9524 = this;
  return cljs.core.cons.call(null, o, rng)
};
cljs.core.Range.prototype.toString = function() {
  var this__9525 = this;
  var this__9526 = this;
  return cljs.core.pr_str.call(null, this__9526)
};
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$2 = function(rng, f) {
  var this__9527 = this;
  return cljs.core.ci_reduce.call(null, rng, f)
};
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$3 = function(rng, f, s) {
  var this__9528 = this;
  return cljs.core.ci_reduce.call(null, rng, f, s)
};
cljs.core.Range.prototype.cljs$core$ISeqable$_seq$arity$1 = function(rng) {
  var this__9529 = this;
  if(this__9529.step > 0) {
    if(this__9529.start < this__9529.end) {
      return rng
    }else {
      return null
    }
  }else {
    if(this__9529.start > this__9529.end) {
      return rng
    }else {
      return null
    }
  }
};
cljs.core.Range.prototype.cljs$core$ICounted$_count$arity$1 = function(rng) {
  var this__9530 = this;
  if(cljs.core.not.call(null, rng.cljs$core$ISeqable$_seq$arity$1(rng))) {
    return 0
  }else {
    return Math.ceil((this__9530.end - this__9530.start) / this__9530.step)
  }
};
cljs.core.Range.prototype.cljs$core$ISeq$_first$arity$1 = function(rng) {
  var this__9531 = this;
  return this__9531.start
};
cljs.core.Range.prototype.cljs$core$ISeq$_rest$arity$1 = function(rng) {
  var this__9532 = this;
  if(!(rng.cljs$core$ISeqable$_seq$arity$1(rng) == null)) {
    return new cljs.core.Range(this__9532.meta, this__9532.start + this__9532.step, this__9532.end, this__9532.step, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.Range.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(rng, other) {
  var this__9533 = this;
  return cljs.core.equiv_sequential.call(null, rng, other)
};
cljs.core.Range.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(rng, meta) {
  var this__9534 = this;
  return new cljs.core.Range(meta, this__9534.start, this__9534.end, this__9534.step, this__9534.__hash)
};
cljs.core.Range.prototype.cljs$core$IMeta$_meta$arity$1 = function(rng) {
  var this__9535 = this;
  return this__9535.meta
};
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$2 = function(rng, n) {
  var this__9536 = this;
  if(n < rng.cljs$core$ICounted$_count$arity$1(rng)) {
    return this__9536.start + n * this__9536.step
  }else {
    if(function() {
      var and__3941__auto____9537 = this__9536.start > this__9536.end;
      if(and__3941__auto____9537) {
        return this__9536.step === 0
      }else {
        return and__3941__auto____9537
      }
    }()) {
      return this__9536.start
    }else {
      throw new Error("Index out of bounds");
    }
  }
};
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$3 = function(rng, n, not_found) {
  var this__9538 = this;
  if(n < rng.cljs$core$ICounted$_count$arity$1(rng)) {
    return this__9538.start + n * this__9538.step
  }else {
    if(function() {
      var and__3941__auto____9539 = this__9538.start > this__9538.end;
      if(and__3941__auto____9539) {
        return this__9538.step === 0
      }else {
        return and__3941__auto____9539
      }
    }()) {
      return this__9538.start
    }else {
      return not_found
    }
  }
};
cljs.core.Range.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(rng) {
  var this__9540 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__9540.meta)
};
cljs.core.Range;
cljs.core.range = function() {
  var range = null;
  var range__0 = function() {
    return range.call(null, 0, Number.MAX_VALUE, 1)
  };
  var range__1 = function(end) {
    return range.call(null, 0, end, 1)
  };
  var range__2 = function(start, end) {
    return range.call(null, start, end, 1)
  };
  var range__3 = function(start, end, step) {
    return new cljs.core.Range(null, start, end, step, null)
  };
  range = function(start, end, step) {
    switch(arguments.length) {
      case 0:
        return range__0.call(this);
      case 1:
        return range__1.call(this, start);
      case 2:
        return range__2.call(this, start, end);
      case 3:
        return range__3.call(this, start, end, step)
    }
    throw"Invalid arity: " + arguments.length;
  };
  range.cljs$lang$arity$0 = range__0;
  range.cljs$lang$arity$1 = range__1;
  range.cljs$lang$arity$2 = range__2;
  range.cljs$lang$arity$3 = range__3;
  return range
}();
cljs.core.take_nth = function take_nth(n, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__4092__auto____9543 = cljs.core.seq.call(null, coll);
    if(temp__4092__auto____9543) {
      var s__9544 = temp__4092__auto____9543;
      return cljs.core.cons.call(null, cljs.core.first.call(null, s__9544), take_nth.call(null, n, cljs.core.drop.call(null, n, s__9544)))
    }else {
      return null
    }
  }, null)
};
cljs.core.split_with = function split_with(pred, coll) {
  return cljs.core.PersistentVector.fromArray([cljs.core.take_while.call(null, pred, coll), cljs.core.drop_while.call(null, pred, coll)], true)
};
cljs.core.partition_by = function partition_by(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__4092__auto____9551 = cljs.core.seq.call(null, coll);
    if(temp__4092__auto____9551) {
      var s__9552 = temp__4092__auto____9551;
      var fst__9553 = cljs.core.first.call(null, s__9552);
      var fv__9554 = f.call(null, fst__9553);
      var run__9555 = cljs.core.cons.call(null, fst__9553, cljs.core.take_while.call(null, function(p1__9545_SHARP_) {
        return cljs.core._EQ_.call(null, fv__9554, f.call(null, p1__9545_SHARP_))
      }, cljs.core.next.call(null, s__9552)));
      return cljs.core.cons.call(null, run__9555, partition_by.call(null, f, cljs.core.seq.call(null, cljs.core.drop.call(null, cljs.core.count.call(null, run__9555), s__9552))))
    }else {
      return null
    }
  }, null)
};
cljs.core.frequencies = function frequencies(coll) {
  return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, function(counts, x) {
    return cljs.core.assoc_BANG_.call(null, counts, x, cljs.core._lookup.call(null, counts, x, 0) + 1)
  }, cljs.core.transient$.call(null, cljs.core.ObjMap.EMPTY), coll))
};
cljs.core.reductions = function() {
  var reductions = null;
  var reductions__2 = function(f, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__4090__auto____9570 = cljs.core.seq.call(null, coll);
      if(temp__4090__auto____9570) {
        var s__9571 = temp__4090__auto____9570;
        return reductions.call(null, f, cljs.core.first.call(null, s__9571), cljs.core.rest.call(null, s__9571))
      }else {
        return cljs.core.list.call(null, f.call(null))
      }
    }, null)
  };
  var reductions__3 = function(f, init, coll) {
    return cljs.core.cons.call(null, init, new cljs.core.LazySeq(null, false, function() {
      var temp__4092__auto____9572 = cljs.core.seq.call(null, coll);
      if(temp__4092__auto____9572) {
        var s__9573 = temp__4092__auto____9572;
        return reductions.call(null, f, f.call(null, init, cljs.core.first.call(null, s__9573)), cljs.core.rest.call(null, s__9573))
      }else {
        return null
      }
    }, null))
  };
  reductions = function(f, init, coll) {
    switch(arguments.length) {
      case 2:
        return reductions__2.call(this, f, init);
      case 3:
        return reductions__3.call(this, f, init, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  reductions.cljs$lang$arity$2 = reductions__2;
  reductions.cljs$lang$arity$3 = reductions__3;
  return reductions
}();
cljs.core.juxt = function() {
  var juxt = null;
  var juxt__1 = function(f) {
    return function() {
      var G__9576 = null;
      var G__9576__0 = function() {
        return cljs.core.vector.call(null, f.call(null))
      };
      var G__9576__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x))
      };
      var G__9576__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y))
      };
      var G__9576__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z))
      };
      var G__9576__4 = function() {
        var G__9577__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args))
        };
        var G__9577 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__9577__delegate.call(this, x, y, z, args)
        };
        G__9577.cljs$lang$maxFixedArity = 3;
        G__9577.cljs$lang$applyTo = function(arglist__9578) {
          var x = cljs.core.first(arglist__9578);
          var y = cljs.core.first(cljs.core.next(arglist__9578));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9578)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9578)));
          return G__9577__delegate(x, y, z, args)
        };
        G__9577.cljs$lang$arity$variadic = G__9577__delegate;
        return G__9577
      }();
      G__9576 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__9576__0.call(this);
          case 1:
            return G__9576__1.call(this, x);
          case 2:
            return G__9576__2.call(this, x, y);
          case 3:
            return G__9576__3.call(this, x, y, z);
          default:
            return G__9576__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__9576.cljs$lang$maxFixedArity = 3;
      G__9576.cljs$lang$applyTo = G__9576__4.cljs$lang$applyTo;
      return G__9576
    }()
  };
  var juxt__2 = function(f, g) {
    return function() {
      var G__9579 = null;
      var G__9579__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null))
      };
      var G__9579__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x))
      };
      var G__9579__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y))
      };
      var G__9579__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z))
      };
      var G__9579__4 = function() {
        var G__9580__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__9580 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__9580__delegate.call(this, x, y, z, args)
        };
        G__9580.cljs$lang$maxFixedArity = 3;
        G__9580.cljs$lang$applyTo = function(arglist__9581) {
          var x = cljs.core.first(arglist__9581);
          var y = cljs.core.first(cljs.core.next(arglist__9581));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9581)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9581)));
          return G__9580__delegate(x, y, z, args)
        };
        G__9580.cljs$lang$arity$variadic = G__9580__delegate;
        return G__9580
      }();
      G__9579 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__9579__0.call(this);
          case 1:
            return G__9579__1.call(this, x);
          case 2:
            return G__9579__2.call(this, x, y);
          case 3:
            return G__9579__3.call(this, x, y, z);
          default:
            return G__9579__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__9579.cljs$lang$maxFixedArity = 3;
      G__9579.cljs$lang$applyTo = G__9579__4.cljs$lang$applyTo;
      return G__9579
    }()
  };
  var juxt__3 = function(f, g, h) {
    return function() {
      var G__9582 = null;
      var G__9582__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null), h.call(null))
      };
      var G__9582__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x), h.call(null, x))
      };
      var G__9582__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y), h.call(null, x, y))
      };
      var G__9582__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z), h.call(null, x, y, z))
      };
      var G__9582__4 = function() {
        var G__9583__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args), cljs.core.apply.call(null, h, x, y, z, args))
        };
        var G__9583 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__9583__delegate.call(this, x, y, z, args)
        };
        G__9583.cljs$lang$maxFixedArity = 3;
        G__9583.cljs$lang$applyTo = function(arglist__9584) {
          var x = cljs.core.first(arglist__9584);
          var y = cljs.core.first(cljs.core.next(arglist__9584));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9584)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9584)));
          return G__9583__delegate(x, y, z, args)
        };
        G__9583.cljs$lang$arity$variadic = G__9583__delegate;
        return G__9583
      }();
      G__9582 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__9582__0.call(this);
          case 1:
            return G__9582__1.call(this, x);
          case 2:
            return G__9582__2.call(this, x, y);
          case 3:
            return G__9582__3.call(this, x, y, z);
          default:
            return G__9582__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__9582.cljs$lang$maxFixedArity = 3;
      G__9582.cljs$lang$applyTo = G__9582__4.cljs$lang$applyTo;
      return G__9582
    }()
  };
  var juxt__4 = function() {
    var G__9585__delegate = function(f, g, h, fs) {
      var fs__9575 = cljs.core.list_STAR_.call(null, f, g, h, fs);
      return function() {
        var G__9586 = null;
        var G__9586__0 = function() {
          return cljs.core.reduce.call(null, function(p1__9556_SHARP_, p2__9557_SHARP_) {
            return cljs.core.conj.call(null, p1__9556_SHARP_, p2__9557_SHARP_.call(null))
          }, cljs.core.PersistentVector.EMPTY, fs__9575)
        };
        var G__9586__1 = function(x) {
          return cljs.core.reduce.call(null, function(p1__9558_SHARP_, p2__9559_SHARP_) {
            return cljs.core.conj.call(null, p1__9558_SHARP_, p2__9559_SHARP_.call(null, x))
          }, cljs.core.PersistentVector.EMPTY, fs__9575)
        };
        var G__9586__2 = function(x, y) {
          return cljs.core.reduce.call(null, function(p1__9560_SHARP_, p2__9561_SHARP_) {
            return cljs.core.conj.call(null, p1__9560_SHARP_, p2__9561_SHARP_.call(null, x, y))
          }, cljs.core.PersistentVector.EMPTY, fs__9575)
        };
        var G__9586__3 = function(x, y, z) {
          return cljs.core.reduce.call(null, function(p1__9562_SHARP_, p2__9563_SHARP_) {
            return cljs.core.conj.call(null, p1__9562_SHARP_, p2__9563_SHARP_.call(null, x, y, z))
          }, cljs.core.PersistentVector.EMPTY, fs__9575)
        };
        var G__9586__4 = function() {
          var G__9587__delegate = function(x, y, z, args) {
            return cljs.core.reduce.call(null, function(p1__9564_SHARP_, p2__9565_SHARP_) {
              return cljs.core.conj.call(null, p1__9564_SHARP_, cljs.core.apply.call(null, p2__9565_SHARP_, x, y, z, args))
            }, cljs.core.PersistentVector.EMPTY, fs__9575)
          };
          var G__9587 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__9587__delegate.call(this, x, y, z, args)
          };
          G__9587.cljs$lang$maxFixedArity = 3;
          G__9587.cljs$lang$applyTo = function(arglist__9588) {
            var x = cljs.core.first(arglist__9588);
            var y = cljs.core.first(cljs.core.next(arglist__9588));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9588)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9588)));
            return G__9587__delegate(x, y, z, args)
          };
          G__9587.cljs$lang$arity$variadic = G__9587__delegate;
          return G__9587
        }();
        G__9586 = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return G__9586__0.call(this);
            case 1:
              return G__9586__1.call(this, x);
            case 2:
              return G__9586__2.call(this, x, y);
            case 3:
              return G__9586__3.call(this, x, y, z);
            default:
              return G__9586__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        G__9586.cljs$lang$maxFixedArity = 3;
        G__9586.cljs$lang$applyTo = G__9586__4.cljs$lang$applyTo;
        return G__9586
      }()
    };
    var G__9585 = function(f, g, h, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__9585__delegate.call(this, f, g, h, fs)
    };
    G__9585.cljs$lang$maxFixedArity = 3;
    G__9585.cljs$lang$applyTo = function(arglist__9589) {
      var f = cljs.core.first(arglist__9589);
      var g = cljs.core.first(cljs.core.next(arglist__9589));
      var h = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9589)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9589)));
      return G__9585__delegate(f, g, h, fs)
    };
    G__9585.cljs$lang$arity$variadic = G__9585__delegate;
    return G__9585
  }();
  juxt = function(f, g, h, var_args) {
    var fs = var_args;
    switch(arguments.length) {
      case 1:
        return juxt__1.call(this, f);
      case 2:
        return juxt__2.call(this, f, g);
      case 3:
        return juxt__3.call(this, f, g, h);
      default:
        return juxt__4.cljs$lang$arity$variadic(f, g, h, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  juxt.cljs$lang$maxFixedArity = 3;
  juxt.cljs$lang$applyTo = juxt__4.cljs$lang$applyTo;
  juxt.cljs$lang$arity$1 = juxt__1;
  juxt.cljs$lang$arity$2 = juxt__2;
  juxt.cljs$lang$arity$3 = juxt__3;
  juxt.cljs$lang$arity$variadic = juxt__4.cljs$lang$arity$variadic;
  return juxt
}();
cljs.core.dorun = function() {
  var dorun = null;
  var dorun__1 = function(coll) {
    while(true) {
      if(cljs.core.seq.call(null, coll)) {
        var G__9592 = cljs.core.next.call(null, coll);
        coll = G__9592;
        continue
      }else {
        return null
      }
      break
    }
  };
  var dorun__2 = function(n, coll) {
    while(true) {
      if(cljs.core.truth_(function() {
        var and__3941__auto____9591 = cljs.core.seq.call(null, coll);
        if(and__3941__auto____9591) {
          return n > 0
        }else {
          return and__3941__auto____9591
        }
      }())) {
        var G__9593 = n - 1;
        var G__9594 = cljs.core.next.call(null, coll);
        n = G__9593;
        coll = G__9594;
        continue
      }else {
        return null
      }
      break
    }
  };
  dorun = function(n, coll) {
    switch(arguments.length) {
      case 1:
        return dorun__1.call(this, n);
      case 2:
        return dorun__2.call(this, n, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  dorun.cljs$lang$arity$1 = dorun__1;
  dorun.cljs$lang$arity$2 = dorun__2;
  return dorun
}();
cljs.core.doall = function() {
  var doall = null;
  var doall__1 = function(coll) {
    cljs.core.dorun.call(null, coll);
    return coll
  };
  var doall__2 = function(n, coll) {
    cljs.core.dorun.call(null, n, coll);
    return coll
  };
  doall = function(n, coll) {
    switch(arguments.length) {
      case 1:
        return doall__1.call(this, n);
      case 2:
        return doall__2.call(this, n, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  doall.cljs$lang$arity$1 = doall__1;
  doall.cljs$lang$arity$2 = doall__2;
  return doall
}();
cljs.core.regexp_QMARK_ = function regexp_QMARK_(o) {
  return o instanceof RegExp
};
cljs.core.re_matches = function re_matches(re, s) {
  var matches__9596 = re.exec(s);
  if(cljs.core._EQ_.call(null, cljs.core.first.call(null, matches__9596), s)) {
    if(cljs.core.count.call(null, matches__9596) === 1) {
      return cljs.core.first.call(null, matches__9596)
    }else {
      return cljs.core.vec.call(null, matches__9596)
    }
  }else {
    return null
  }
};
cljs.core.re_find = function re_find(re, s) {
  var matches__9598 = re.exec(s);
  if(matches__9598 == null) {
    return null
  }else {
    if(cljs.core.count.call(null, matches__9598) === 1) {
      return cljs.core.first.call(null, matches__9598)
    }else {
      return cljs.core.vec.call(null, matches__9598)
    }
  }
};
cljs.core.re_seq = function re_seq(re, s) {
  var match_data__9603 = cljs.core.re_find.call(null, re, s);
  var match_idx__9604 = s.search(re);
  var match_str__9605 = cljs.core.coll_QMARK_.call(null, match_data__9603) ? cljs.core.first.call(null, match_data__9603) : match_data__9603;
  var post_match__9606 = cljs.core.subs.call(null, s, match_idx__9604 + cljs.core.count.call(null, match_str__9605));
  if(cljs.core.truth_(match_data__9603)) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, match_data__9603, re_seq.call(null, re, post_match__9606))
    }, null)
  }else {
    return null
  }
};
cljs.core.re_pattern = function re_pattern(s) {
  var vec__9613__9614 = cljs.core.re_find.call(null, /^(?:\(\?([idmsux]*)\))?(.*)/, s);
  var ___9615 = cljs.core.nth.call(null, vec__9613__9614, 0, null);
  var flags__9616 = cljs.core.nth.call(null, vec__9613__9614, 1, null);
  var pattern__9617 = cljs.core.nth.call(null, vec__9613__9614, 2, null);
  return new RegExp(pattern__9617, flags__9616)
};
cljs.core.pr_sequential = function pr_sequential(print_one, begin, sep, end, opts, coll) {
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray([begin], true), cljs.core.flatten1.call(null, cljs.core.interpose.call(null, cljs.core.PersistentVector.fromArray([sep], true), cljs.core.map.call(null, function(p1__9607_SHARP_) {
    return print_one.call(null, p1__9607_SHARP_, opts)
  }, coll))), cljs.core.PersistentVector.fromArray([end], true))
};
cljs.core.string_print = function string_print(x) {
  cljs.core._STAR_print_fn_STAR_.call(null, x);
  return null
};
cljs.core.flush = function flush() {
  return null
};
cljs.core.pr_seq = function pr_seq(obj, opts) {
  if(obj == null) {
    return cljs.core.list.call(null, "nil")
  }else {
    if(void 0 === obj) {
      return cljs.core.list.call(null, "#\x3cundefined\x3e")
    }else {
      if("\ufdd0'else") {
        return cljs.core.concat.call(null, cljs.core.truth_(function() {
          var and__3941__auto____9627 = cljs.core._lookup.call(null, opts, "\ufdd0'meta", null);
          if(cljs.core.truth_(and__3941__auto____9627)) {
            var and__3941__auto____9631 = function() {
              var G__9628__9629 = obj;
              if(G__9628__9629) {
                if(function() {
                  var or__3943__auto____9630 = G__9628__9629.cljs$lang$protocol_mask$partition0$ & 131072;
                  if(or__3943__auto____9630) {
                    return or__3943__auto____9630
                  }else {
                    return G__9628__9629.cljs$core$IMeta$
                  }
                }()) {
                  return true
                }else {
                  if(!G__9628__9629.cljs$lang$protocol_mask$partition0$) {
                    return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__9628__9629)
                  }else {
                    return false
                  }
                }
              }else {
                return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__9628__9629)
              }
            }();
            if(cljs.core.truth_(and__3941__auto____9631)) {
              return cljs.core.meta.call(null, obj)
            }else {
              return and__3941__auto____9631
            }
          }else {
            return and__3941__auto____9627
          }
        }()) ? cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["^"], true), pr_seq.call(null, cljs.core.meta.call(null, obj), opts), cljs.core.PersistentVector.fromArray([" "], true)) : null, function() {
          var and__3941__auto____9632 = !(obj == null);
          if(and__3941__auto____9632) {
            return obj.cljs$lang$type
          }else {
            return and__3941__auto____9632
          }
        }() ? obj.cljs$lang$ctorPrSeq(obj) : function() {
          var G__9633__9634 = obj;
          if(G__9633__9634) {
            if(function() {
              var or__3943__auto____9635 = G__9633__9634.cljs$lang$protocol_mask$partition0$ & 536870912;
              if(or__3943__auto____9635) {
                return or__3943__auto____9635
              }else {
                return G__9633__9634.cljs$core$IPrintable$
              }
            }()) {
              return true
            }else {
              if(!G__9633__9634.cljs$lang$protocol_mask$partition0$) {
                return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__9633__9634)
              }else {
                return false
              }
            }
          }else {
            return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__9633__9634)
          }
        }() ? cljs.core._pr_seq.call(null, obj, opts) : cljs.core.truth_(cljs.core.regexp_QMARK_.call(null, obj)) ? cljs.core.list.call(null, '#"', obj.source, '"') : "\ufdd0'else" ? cljs.core.list.call(null, "#\x3c", [cljs.core.str(obj)].join(""), "\x3e") : null)
      }else {
        return null
      }
    }
  }
};
cljs.core.pr_sb = function pr_sb(objs, opts) {
  var sb__9655 = new goog.string.StringBuffer;
  var G__9656__9657 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, cljs.core.first.call(null, objs), opts));
  if(G__9656__9657) {
    var string__9658 = cljs.core.first.call(null, G__9656__9657);
    var G__9656__9659 = G__9656__9657;
    while(true) {
      sb__9655.append(string__9658);
      var temp__4092__auto____9660 = cljs.core.next.call(null, G__9656__9659);
      if(temp__4092__auto____9660) {
        var G__9656__9661 = temp__4092__auto____9660;
        var G__9674 = cljs.core.first.call(null, G__9656__9661);
        var G__9675 = G__9656__9661;
        string__9658 = G__9674;
        G__9656__9659 = G__9675;
        continue
      }else {
      }
      break
    }
  }else {
  }
  var G__9662__9663 = cljs.core.seq.call(null, cljs.core.next.call(null, objs));
  if(G__9662__9663) {
    var obj__9664 = cljs.core.first.call(null, G__9662__9663);
    var G__9662__9665 = G__9662__9663;
    while(true) {
      sb__9655.append(" ");
      var G__9666__9667 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__9664, opts));
      if(G__9666__9667) {
        var string__9668 = cljs.core.first.call(null, G__9666__9667);
        var G__9666__9669 = G__9666__9667;
        while(true) {
          sb__9655.append(string__9668);
          var temp__4092__auto____9670 = cljs.core.next.call(null, G__9666__9669);
          if(temp__4092__auto____9670) {
            var G__9666__9671 = temp__4092__auto____9670;
            var G__9676 = cljs.core.first.call(null, G__9666__9671);
            var G__9677 = G__9666__9671;
            string__9668 = G__9676;
            G__9666__9669 = G__9677;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__4092__auto____9672 = cljs.core.next.call(null, G__9662__9665);
      if(temp__4092__auto____9672) {
        var G__9662__9673 = temp__4092__auto____9672;
        var G__9678 = cljs.core.first.call(null, G__9662__9673);
        var G__9679 = G__9662__9673;
        obj__9664 = G__9678;
        G__9662__9665 = G__9679;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return sb__9655
};
cljs.core.pr_str_with_opts = function pr_str_with_opts(objs, opts) {
  return[cljs.core.str(cljs.core.pr_sb.call(null, objs, opts))].join("")
};
cljs.core.prn_str_with_opts = function prn_str_with_opts(objs, opts) {
  var sb__9681 = cljs.core.pr_sb.call(null, objs, opts);
  sb__9681.append("\n");
  return[cljs.core.str(sb__9681)].join("")
};
cljs.core.pr_with_opts = function pr_with_opts(objs, opts) {
  var G__9700__9701 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, cljs.core.first.call(null, objs), opts));
  if(G__9700__9701) {
    var string__9702 = cljs.core.first.call(null, G__9700__9701);
    var G__9700__9703 = G__9700__9701;
    while(true) {
      cljs.core.string_print.call(null, string__9702);
      var temp__4092__auto____9704 = cljs.core.next.call(null, G__9700__9703);
      if(temp__4092__auto____9704) {
        var G__9700__9705 = temp__4092__auto____9704;
        var G__9718 = cljs.core.first.call(null, G__9700__9705);
        var G__9719 = G__9700__9705;
        string__9702 = G__9718;
        G__9700__9703 = G__9719;
        continue
      }else {
      }
      break
    }
  }else {
  }
  var G__9706__9707 = cljs.core.seq.call(null, cljs.core.next.call(null, objs));
  if(G__9706__9707) {
    var obj__9708 = cljs.core.first.call(null, G__9706__9707);
    var G__9706__9709 = G__9706__9707;
    while(true) {
      cljs.core.string_print.call(null, " ");
      var G__9710__9711 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__9708, opts));
      if(G__9710__9711) {
        var string__9712 = cljs.core.first.call(null, G__9710__9711);
        var G__9710__9713 = G__9710__9711;
        while(true) {
          cljs.core.string_print.call(null, string__9712);
          var temp__4092__auto____9714 = cljs.core.next.call(null, G__9710__9713);
          if(temp__4092__auto____9714) {
            var G__9710__9715 = temp__4092__auto____9714;
            var G__9720 = cljs.core.first.call(null, G__9710__9715);
            var G__9721 = G__9710__9715;
            string__9712 = G__9720;
            G__9710__9713 = G__9721;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__4092__auto____9716 = cljs.core.next.call(null, G__9706__9709);
      if(temp__4092__auto____9716) {
        var G__9706__9717 = temp__4092__auto____9716;
        var G__9722 = cljs.core.first.call(null, G__9706__9717);
        var G__9723 = G__9706__9717;
        obj__9708 = G__9722;
        G__9706__9709 = G__9723;
        continue
      }else {
        return null
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.newline = function newline(opts) {
  cljs.core.string_print.call(null, "\n");
  if(cljs.core.truth_(cljs.core._lookup.call(null, opts, "\ufdd0'flush-on-newline", null))) {
    return cljs.core.flush.call(null)
  }else {
    return null
  }
};
cljs.core._STAR_flush_on_newline_STAR_ = true;
cljs.core._STAR_print_readably_STAR_ = true;
cljs.core._STAR_print_meta_STAR_ = false;
cljs.core._STAR_print_dup_STAR_ = false;
cljs.core.pr_opts = function pr_opts() {
  return cljs.core.ObjMap.fromObject(["\ufdd0'flush-on-newline", "\ufdd0'readably", "\ufdd0'meta", "\ufdd0'dup"], {"\ufdd0'flush-on-newline":cljs.core._STAR_flush_on_newline_STAR_, "\ufdd0'readably":cljs.core._STAR_print_readably_STAR_, "\ufdd0'meta":cljs.core._STAR_print_meta_STAR_, "\ufdd0'dup":cljs.core._STAR_print_dup_STAR_})
};
cljs.core.pr_str = function() {
  var pr_str__delegate = function(objs) {
    return cljs.core.pr_str_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var pr_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return pr_str__delegate.call(this, objs)
  };
  pr_str.cljs$lang$maxFixedArity = 0;
  pr_str.cljs$lang$applyTo = function(arglist__9724) {
    var objs = cljs.core.seq(arglist__9724);
    return pr_str__delegate(objs)
  };
  pr_str.cljs$lang$arity$variadic = pr_str__delegate;
  return pr_str
}();
cljs.core.prn_str = function() {
  var prn_str__delegate = function(objs) {
    return cljs.core.prn_str_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var prn_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return prn_str__delegate.call(this, objs)
  };
  prn_str.cljs$lang$maxFixedArity = 0;
  prn_str.cljs$lang$applyTo = function(arglist__9725) {
    var objs = cljs.core.seq(arglist__9725);
    return prn_str__delegate(objs)
  };
  prn_str.cljs$lang$arity$variadic = prn_str__delegate;
  return prn_str
}();
cljs.core.pr = function() {
  var pr__delegate = function(objs) {
    return cljs.core.pr_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var pr = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return pr__delegate.call(this, objs)
  };
  pr.cljs$lang$maxFixedArity = 0;
  pr.cljs$lang$applyTo = function(arglist__9726) {
    var objs = cljs.core.seq(arglist__9726);
    return pr__delegate(objs)
  };
  pr.cljs$lang$arity$variadic = pr__delegate;
  return pr
}();
cljs.core.print = function() {
  var cljs_core_print__delegate = function(objs) {
    return cljs.core.pr_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var cljs_core_print = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return cljs_core_print__delegate.call(this, objs)
  };
  cljs_core_print.cljs$lang$maxFixedArity = 0;
  cljs_core_print.cljs$lang$applyTo = function(arglist__9727) {
    var objs = cljs.core.seq(arglist__9727);
    return cljs_core_print__delegate(objs)
  };
  cljs_core_print.cljs$lang$arity$variadic = cljs_core_print__delegate;
  return cljs_core_print
}();
cljs.core.print_str = function() {
  var print_str__delegate = function(objs) {
    return cljs.core.pr_str_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var print_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return print_str__delegate.call(this, objs)
  };
  print_str.cljs$lang$maxFixedArity = 0;
  print_str.cljs$lang$applyTo = function(arglist__9728) {
    var objs = cljs.core.seq(arglist__9728);
    return print_str__delegate(objs)
  };
  print_str.cljs$lang$arity$variadic = print_str__delegate;
  return print_str
}();
cljs.core.println = function() {
  var println__delegate = function(objs) {
    cljs.core.pr_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false));
    return cljs.core.newline.call(null, cljs.core.pr_opts.call(null))
  };
  var println = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return println__delegate.call(this, objs)
  };
  println.cljs$lang$maxFixedArity = 0;
  println.cljs$lang$applyTo = function(arglist__9729) {
    var objs = cljs.core.seq(arglist__9729);
    return println__delegate(objs)
  };
  println.cljs$lang$arity$variadic = println__delegate;
  return println
}();
cljs.core.println_str = function() {
  var println_str__delegate = function(objs) {
    return cljs.core.prn_str_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var println_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return println_str__delegate.call(this, objs)
  };
  println_str.cljs$lang$maxFixedArity = 0;
  println_str.cljs$lang$applyTo = function(arglist__9730) {
    var objs = cljs.core.seq(arglist__9730);
    return println_str__delegate(objs)
  };
  println_str.cljs$lang$arity$variadic = println_str__delegate;
  return println_str
}();
cljs.core.prn = function() {
  var prn__delegate = function(objs) {
    cljs.core.pr_with_opts.call(null, objs, cljs.core.pr_opts.call(null));
    return cljs.core.newline.call(null, cljs.core.pr_opts.call(null))
  };
  var prn = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return prn__delegate.call(this, objs)
  };
  prn.cljs$lang$maxFixedArity = 0;
  prn.cljs$lang$applyTo = function(arglist__9731) {
    var objs = cljs.core.seq(arglist__9731);
    return prn__delegate(objs)
  };
  prn.cljs$lang$arity$variadic = prn__delegate;
  return prn
}();
cljs.core.printf = function() {
  var printf__delegate = function(fmt, args) {
    return cljs.core.print.call(null, cljs.core.apply.call(null, cljs.core.format, fmt, args))
  };
  var printf = function(fmt, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return printf__delegate.call(this, fmt, args)
  };
  printf.cljs$lang$maxFixedArity = 1;
  printf.cljs$lang$applyTo = function(arglist__9732) {
    var fmt = cljs.core.first(arglist__9732);
    var args = cljs.core.rest(arglist__9732);
    return printf__delegate(fmt, args)
  };
  printf.cljs$lang$arity$variadic = printf__delegate;
  return printf
}();
cljs.core.HashMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.HashMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__9733 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__9733, "{", ", ", "}", opts, coll)
};
cljs.core.IPrintable["number"] = true;
cljs.core._pr_seq["number"] = function(n, opts) {
  return cljs.core.list.call(null, [cljs.core.str(n)].join(""))
};
cljs.core.IndexedSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.Subvec.prototype.cljs$core$IPrintable$ = true;
cljs.core.Subvec.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.ChunkedCons.prototype.cljs$core$IPrintable$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__9734 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__9734, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__9735 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__9735, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentQueue.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#queue [", " ", "]", opts, cljs.core.seq.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.LazySeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.RSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.RSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#{", " ", "}", opts, coll)
};
cljs.core.IPrintable["boolean"] = true;
cljs.core._pr_seq["boolean"] = function(bool, opts) {
  return cljs.core.list.call(null, [cljs.core.str(bool)].join(""))
};
cljs.core.IPrintable["string"] = true;
cljs.core._pr_seq["string"] = function(obj, opts) {
  if(cljs.core.keyword_QMARK_.call(null, obj)) {
    return cljs.core.list.call(null, [cljs.core.str(":"), cljs.core.str(function() {
      var temp__4092__auto____9736 = cljs.core.namespace.call(null, obj);
      if(cljs.core.truth_(temp__4092__auto____9736)) {
        var nspc__9737 = temp__4092__auto____9736;
        return[cljs.core.str(nspc__9737), cljs.core.str("/")].join("")
      }else {
        return null
      }
    }()), cljs.core.str(cljs.core.name.call(null, obj))].join(""))
  }else {
    if(cljs.core.symbol_QMARK_.call(null, obj)) {
      return cljs.core.list.call(null, [cljs.core.str(function() {
        var temp__4092__auto____9738 = cljs.core.namespace.call(null, obj);
        if(cljs.core.truth_(temp__4092__auto____9738)) {
          var nspc__9739 = temp__4092__auto____9738;
          return[cljs.core.str(nspc__9739), cljs.core.str("/")].join("")
        }else {
          return null
        }
      }()), cljs.core.str(cljs.core.name.call(null, obj))].join(""))
    }else {
      if("\ufdd0'else") {
        return cljs.core.list.call(null, cljs.core.truth_((new cljs.core.Keyword("\ufdd0'readably")).call(null, opts)) ? goog.string.quote(obj) : obj)
      }else {
        return null
      }
    }
  }
};
cljs.core.NodeSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.RedNode.prototype.cljs$core$IPrintable$ = true;
cljs.core.RedNode.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__9740 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__9740, "{", ", ", "}", opts, coll)
};
cljs.core.Vector.prototype.cljs$core$IPrintable$ = true;
cljs.core.Vector.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.PersistentHashSet.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#{", " ", "}", opts, coll)
};
cljs.core.PersistentVector.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.List.prototype.cljs$core$IPrintable$ = true;
cljs.core.List.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.IPrintable["array"] = true;
cljs.core._pr_seq["array"] = function(a, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#\x3cArray [", ", ", "]\x3e", opts, a)
};
cljs.core.IPrintable["function"] = true;
cljs.core._pr_seq["function"] = function(this$) {
  return cljs.core.list.call(null, "#\x3c", [cljs.core.str(this$)].join(""), "\x3e")
};
cljs.core.EmptyList.prototype.cljs$core$IPrintable$ = true;
cljs.core.EmptyList.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.list.call(null, "()")
};
cljs.core.BlackNode.prototype.cljs$core$IPrintable$ = true;
cljs.core.BlackNode.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
Date.prototype.cljs$core$IPrintable$ = true;
Date.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(d, _) {
  var normalize__9742 = function(n, len) {
    var ns__9741 = [cljs.core.str(n)].join("");
    while(true) {
      if(cljs.core.count.call(null, ns__9741) < len) {
        var G__9744 = [cljs.core.str("0"), cljs.core.str(ns__9741)].join("");
        ns__9741 = G__9744;
        continue
      }else {
        return ns__9741
      }
      break
    }
  };
  return cljs.core.list.call(null, [cljs.core.str('#inst "'), cljs.core.str(d.getUTCFullYear()), cljs.core.str("-"), cljs.core.str(normalize__9742.call(null, d.getUTCMonth() + 1, 2)), cljs.core.str("-"), cljs.core.str(normalize__9742.call(null, d.getUTCDate(), 2)), cljs.core.str("T"), cljs.core.str(normalize__9742.call(null, d.getUTCHours(), 2)), cljs.core.str(":"), cljs.core.str(normalize__9742.call(null, d.getUTCMinutes(), 2)), cljs.core.str(":"), cljs.core.str(normalize__9742.call(null, d.getUTCSeconds(), 
  2)), cljs.core.str("."), cljs.core.str(normalize__9742.call(null, d.getUTCMilliseconds(), 3)), cljs.core.str("-"), cljs.core.str('00:00"')].join(""))
};
cljs.core.Cons.prototype.cljs$core$IPrintable$ = true;
cljs.core.Cons.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.Range.prototype.cljs$core$IPrintable$ = true;
cljs.core.Range.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.ObjMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.ObjMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__9743 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__9743, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentVector.prototype.cljs$core$IComparable$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IComparable$_compare$arity$2 = function(x, y) {
  return cljs.core.compare_indexed.call(null, x, y)
};
cljs.core.Atom = function(state, meta, validator, watches) {
  this.state = state;
  this.meta = meta;
  this.validator = validator;
  this.watches = watches;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2690809856
};
cljs.core.Atom.cljs$lang$type = true;
cljs.core.Atom.cljs$lang$ctorPrSeq = function(this__2250__auto__) {
  return cljs.core.list.call(null, "cljs.core/Atom")
};
cljs.core.Atom.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var this__9745 = this;
  return goog.getUid(this$)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_notify_watches$arity$3 = function(this$, oldval, newval) {
  var this__9746 = this;
  var G__9747__9748 = cljs.core.seq.call(null, this__9746.watches);
  if(G__9747__9748) {
    var G__9750__9752 = cljs.core.first.call(null, G__9747__9748);
    var vec__9751__9753 = G__9750__9752;
    var key__9754 = cljs.core.nth.call(null, vec__9751__9753, 0, null);
    var f__9755 = cljs.core.nth.call(null, vec__9751__9753, 1, null);
    var G__9747__9756 = G__9747__9748;
    var G__9750__9757 = G__9750__9752;
    var G__9747__9758 = G__9747__9756;
    while(true) {
      var vec__9759__9760 = G__9750__9757;
      var key__9761 = cljs.core.nth.call(null, vec__9759__9760, 0, null);
      var f__9762 = cljs.core.nth.call(null, vec__9759__9760, 1, null);
      var G__9747__9763 = G__9747__9758;
      f__9762.call(null, key__9761, this$, oldval, newval);
      var temp__4092__auto____9764 = cljs.core.next.call(null, G__9747__9763);
      if(temp__4092__auto____9764) {
        var G__9747__9765 = temp__4092__auto____9764;
        var G__9772 = cljs.core.first.call(null, G__9747__9765);
        var G__9773 = G__9747__9765;
        G__9750__9757 = G__9772;
        G__9747__9758 = G__9773;
        continue
      }else {
        return null
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_add_watch$arity$3 = function(this$, key, f) {
  var this__9766 = this;
  return this$.watches = cljs.core.assoc.call(null, this__9766.watches, key, f)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_remove_watch$arity$2 = function(this$, key) {
  var this__9767 = this;
  return this$.watches = cljs.core.dissoc.call(null, this__9767.watches, key)
};
cljs.core.Atom.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(a, opts) {
  var this__9768 = this;
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["#\x3cAtom: "], true), cljs.core._pr_seq.call(null, this__9768.state, opts), "\x3e")
};
cljs.core.Atom.prototype.cljs$core$IMeta$_meta$arity$1 = function(_) {
  var this__9769 = this;
  return this__9769.meta
};
cljs.core.Atom.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__9770 = this;
  return this__9770.state
};
cljs.core.Atom.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var this__9771 = this;
  return o === other
};
cljs.core.Atom;
cljs.core.atom = function() {
  var atom = null;
  var atom__1 = function(x) {
    return new cljs.core.Atom(x, null, null, null)
  };
  var atom__2 = function() {
    var G__9785__delegate = function(x, p__9774) {
      var map__9780__9781 = p__9774;
      var map__9780__9782 = cljs.core.seq_QMARK_.call(null, map__9780__9781) ? cljs.core.apply.call(null, cljs.core.hash_map, map__9780__9781) : map__9780__9781;
      var validator__9783 = cljs.core._lookup.call(null, map__9780__9782, "\ufdd0'validator", null);
      var meta__9784 = cljs.core._lookup.call(null, map__9780__9782, "\ufdd0'meta", null);
      return new cljs.core.Atom(x, meta__9784, validator__9783, null)
    };
    var G__9785 = function(x, var_args) {
      var p__9774 = null;
      if(goog.isDef(var_args)) {
        p__9774 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__9785__delegate.call(this, x, p__9774)
    };
    G__9785.cljs$lang$maxFixedArity = 1;
    G__9785.cljs$lang$applyTo = function(arglist__9786) {
      var x = cljs.core.first(arglist__9786);
      var p__9774 = cljs.core.rest(arglist__9786);
      return G__9785__delegate(x, p__9774)
    };
    G__9785.cljs$lang$arity$variadic = G__9785__delegate;
    return G__9785
  }();
  atom = function(x, var_args) {
    var p__9774 = var_args;
    switch(arguments.length) {
      case 1:
        return atom__1.call(this, x);
      default:
        return atom__2.cljs$lang$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  atom.cljs$lang$maxFixedArity = 1;
  atom.cljs$lang$applyTo = atom__2.cljs$lang$applyTo;
  atom.cljs$lang$arity$1 = atom__1;
  atom.cljs$lang$arity$variadic = atom__2.cljs$lang$arity$variadic;
  return atom
}();
cljs.core.reset_BANG_ = function reset_BANG_(a, new_value) {
  var temp__4092__auto____9790 = a.validator;
  if(cljs.core.truth_(temp__4092__auto____9790)) {
    var validate__9791 = temp__4092__auto____9790;
    if(cljs.core.truth_(validate__9791.call(null, new_value))) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str("Validator rejected reference state"), cljs.core.str("\n"), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'validate", "\ufdd1'new-value"), cljs.core.hash_map("\ufdd0'line", 6440, "\ufdd0'column", 13))))].join(""));
    }
  }else {
  }
  var old_value__9792 = a.state;
  a.state = new_value;
  cljs.core._notify_watches.call(null, a, old_value__9792, new_value);
  return new_value
};
cljs.core.swap_BANG_ = function() {
  var swap_BANG_ = null;
  var swap_BANG___2 = function(a, f) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state))
  };
  var swap_BANG___3 = function(a, f, x) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x))
  };
  var swap_BANG___4 = function(a, f, x, y) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x, y))
  };
  var swap_BANG___5 = function(a, f, x, y, z) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x, y, z))
  };
  var swap_BANG___6 = function() {
    var G__9793__delegate = function(a, f, x, y, z, more) {
      return cljs.core.reset_BANG_.call(null, a, cljs.core.apply.call(null, f, a.state, x, y, z, more))
    };
    var G__9793 = function(a, f, x, y, z, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__9793__delegate.call(this, a, f, x, y, z, more)
    };
    G__9793.cljs$lang$maxFixedArity = 5;
    G__9793.cljs$lang$applyTo = function(arglist__9794) {
      var a = cljs.core.first(arglist__9794);
      var f = cljs.core.first(cljs.core.next(arglist__9794));
      var x = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9794)));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__9794))));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__9794)))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__9794)))));
      return G__9793__delegate(a, f, x, y, z, more)
    };
    G__9793.cljs$lang$arity$variadic = G__9793__delegate;
    return G__9793
  }();
  swap_BANG_ = function(a, f, x, y, z, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return swap_BANG___2.call(this, a, f);
      case 3:
        return swap_BANG___3.call(this, a, f, x);
      case 4:
        return swap_BANG___4.call(this, a, f, x, y);
      case 5:
        return swap_BANG___5.call(this, a, f, x, y, z);
      default:
        return swap_BANG___6.cljs$lang$arity$variadic(a, f, x, y, z, cljs.core.array_seq(arguments, 5))
    }
    throw"Invalid arity: " + arguments.length;
  };
  swap_BANG_.cljs$lang$maxFixedArity = 5;
  swap_BANG_.cljs$lang$applyTo = swap_BANG___6.cljs$lang$applyTo;
  swap_BANG_.cljs$lang$arity$2 = swap_BANG___2;
  swap_BANG_.cljs$lang$arity$3 = swap_BANG___3;
  swap_BANG_.cljs$lang$arity$4 = swap_BANG___4;
  swap_BANG_.cljs$lang$arity$5 = swap_BANG___5;
  swap_BANG_.cljs$lang$arity$variadic = swap_BANG___6.cljs$lang$arity$variadic;
  return swap_BANG_
}();
cljs.core.compare_and_set_BANG_ = function compare_and_set_BANG_(a, oldval, newval) {
  if(cljs.core._EQ_.call(null, a.state, oldval)) {
    cljs.core.reset_BANG_.call(null, a, newval);
    return true
  }else {
    return false
  }
};
cljs.core.deref = function deref(o) {
  return cljs.core._deref.call(null, o)
};
cljs.core.set_validator_BANG_ = function set_validator_BANG_(iref, val) {
  return iref.validator = val
};
cljs.core.get_validator = function get_validator(iref) {
  return iref.validator
};
cljs.core.alter_meta_BANG_ = function() {
  var alter_meta_BANG___delegate = function(iref, f, args) {
    return iref.meta = cljs.core.apply.call(null, f, iref.meta, args)
  };
  var alter_meta_BANG_ = function(iref, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return alter_meta_BANG___delegate.call(this, iref, f, args)
  };
  alter_meta_BANG_.cljs$lang$maxFixedArity = 2;
  alter_meta_BANG_.cljs$lang$applyTo = function(arglist__9795) {
    var iref = cljs.core.first(arglist__9795);
    var f = cljs.core.first(cljs.core.next(arglist__9795));
    var args = cljs.core.rest(cljs.core.next(arglist__9795));
    return alter_meta_BANG___delegate(iref, f, args)
  };
  alter_meta_BANG_.cljs$lang$arity$variadic = alter_meta_BANG___delegate;
  return alter_meta_BANG_
}();
cljs.core.reset_meta_BANG_ = function reset_meta_BANG_(iref, m) {
  return iref.meta = m
};
cljs.core.add_watch = function add_watch(iref, key, f) {
  return cljs.core._add_watch.call(null, iref, key, f)
};
cljs.core.remove_watch = function remove_watch(iref, key) {
  return cljs.core._remove_watch.call(null, iref, key)
};
cljs.core.gensym_counter = null;
cljs.core.gensym = function() {
  var gensym = null;
  var gensym__0 = function() {
    return gensym.call(null, "G__")
  };
  var gensym__1 = function(prefix_string) {
    if(cljs.core.gensym_counter == null) {
      cljs.core.gensym_counter = cljs.core.atom.call(null, 0)
    }else {
    }
    return cljs.core.symbol.call(null, [cljs.core.str(prefix_string), cljs.core.str(cljs.core.swap_BANG_.call(null, cljs.core.gensym_counter, cljs.core.inc))].join(""))
  };
  gensym = function(prefix_string) {
    switch(arguments.length) {
      case 0:
        return gensym__0.call(this);
      case 1:
        return gensym__1.call(this, prefix_string)
    }
    throw"Invalid arity: " + arguments.length;
  };
  gensym.cljs$lang$arity$0 = gensym__0;
  gensym.cljs$lang$arity$1 = gensym__1;
  return gensym
}();
cljs.core.fixture1 = 1;
cljs.core.fixture2 = 2;
cljs.core.Delay = function(state, f) {
  this.state = state;
  this.f = f;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 1073774592
};
cljs.core.Delay.cljs$lang$type = true;
cljs.core.Delay.cljs$lang$ctorPrSeq = function(this__2250__auto__) {
  return cljs.core.list.call(null, "cljs.core/Delay")
};
cljs.core.Delay.prototype.cljs$core$IPending$_realized_QMARK_$arity$1 = function(d) {
  var this__9796 = this;
  return(new cljs.core.Keyword("\ufdd0'done")).call(null, cljs.core.deref.call(null, this__9796.state))
};
cljs.core.Delay.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__9797 = this;
  return(new cljs.core.Keyword("\ufdd0'value")).call(null, cljs.core.swap_BANG_.call(null, this__9797.state, function(p__9798) {
    var map__9799__9800 = p__9798;
    var map__9799__9801 = cljs.core.seq_QMARK_.call(null, map__9799__9800) ? cljs.core.apply.call(null, cljs.core.hash_map, map__9799__9800) : map__9799__9800;
    var curr_state__9802 = map__9799__9801;
    var done__9803 = cljs.core._lookup.call(null, map__9799__9801, "\ufdd0'done", null);
    if(cljs.core.truth_(done__9803)) {
      return curr_state__9802
    }else {
      return cljs.core.ObjMap.fromObject(["\ufdd0'done", "\ufdd0'value"], {"\ufdd0'done":true, "\ufdd0'value":this__9797.f.call(null)})
    }
  }))
};
cljs.core.Delay;
cljs.core.delay_QMARK_ = function delay_QMARK_(x) {
  return cljs.core.instance_QMARK_.call(null, cljs.core.Delay, x)
};
cljs.core.force = function force(x) {
  if(cljs.core.delay_QMARK_.call(null, x)) {
    return cljs.core.deref.call(null, x)
  }else {
    return x
  }
};
cljs.core.realized_QMARK_ = function realized_QMARK_(d) {
  return cljs.core._realized_QMARK_.call(null, d)
};
cljs.core.js__GT_clj = function() {
  var js__GT_clj__delegate = function(x, options) {
    var map__9832__9833 = options;
    var map__9832__9834 = cljs.core.seq_QMARK_.call(null, map__9832__9833) ? cljs.core.apply.call(null, cljs.core.hash_map, map__9832__9833) : map__9832__9833;
    var keywordize_keys__9835 = cljs.core._lookup.call(null, map__9832__9834, "\ufdd0'keywordize-keys", null);
    var keyfn__9836 = cljs.core.truth_(keywordize_keys__9835) ? cljs.core.keyword : cljs.core.str;
    var f__9859 = function thisfn(x) {
      if(cljs.core.seq_QMARK_.call(null, x)) {
        return cljs.core.doall.call(null, cljs.core.map.call(null, thisfn, x))
      }else {
        if(cljs.core.coll_QMARK_.call(null, x)) {
          return cljs.core.into.call(null, cljs.core.empty.call(null, x), cljs.core.map.call(null, thisfn, x))
        }else {
          if(cljs.core.truth_(goog.isArray(x))) {
            return cljs.core.vec.call(null, cljs.core.map.call(null, thisfn, x))
          }else {
            if(cljs.core.type.call(null, x) === Object) {
              return cljs.core.into.call(null, cljs.core.ObjMap.EMPTY, function() {
                var iter__2403__auto____9858 = function iter__9848(s__9849) {
                  return new cljs.core.LazySeq(null, false, function() {
                    var s__9849__9854 = s__9849;
                    while(true) {
                      var temp__4092__auto____9855 = cljs.core.seq.call(null, s__9849__9854);
                      if(temp__4092__auto____9855) {
                        var xs__4579__auto____9856 = temp__4092__auto____9855;
                        var k__9857 = cljs.core.first.call(null, xs__4579__auto____9856);
                        return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([keyfn__9836.call(null, k__9857), thisfn.call(null, x[k__9857])], true), iter__9848.call(null, cljs.core.rest.call(null, s__9849__9854)))
                      }else {
                        return null
                      }
                      break
                    }
                  }, null)
                };
                return iter__2403__auto____9858.call(null, cljs.core.js_keys.call(null, x))
              }())
            }else {
              if("\ufdd0'else") {
                return x
              }else {
                return null
              }
            }
          }
        }
      }
    };
    return f__9859.call(null, x)
  };
  var js__GT_clj = function(x, var_args) {
    var options = null;
    if(goog.isDef(var_args)) {
      options = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return js__GT_clj__delegate.call(this, x, options)
  };
  js__GT_clj.cljs$lang$maxFixedArity = 1;
  js__GT_clj.cljs$lang$applyTo = function(arglist__9860) {
    var x = cljs.core.first(arglist__9860);
    var options = cljs.core.rest(arglist__9860);
    return js__GT_clj__delegate(x, options)
  };
  js__GT_clj.cljs$lang$arity$variadic = js__GT_clj__delegate;
  return js__GT_clj
}();
cljs.core.memoize = function memoize(f) {
  var mem__9865 = cljs.core.atom.call(null, cljs.core.ObjMap.EMPTY);
  return function() {
    var G__9869__delegate = function(args) {
      var temp__4090__auto____9866 = cljs.core._lookup.call(null, cljs.core.deref.call(null, mem__9865), args, null);
      if(cljs.core.truth_(temp__4090__auto____9866)) {
        var v__9867 = temp__4090__auto____9866;
        return v__9867
      }else {
        var ret__9868 = cljs.core.apply.call(null, f, args);
        cljs.core.swap_BANG_.call(null, mem__9865, cljs.core.assoc, args, ret__9868);
        return ret__9868
      }
    };
    var G__9869 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__9869__delegate.call(this, args)
    };
    G__9869.cljs$lang$maxFixedArity = 0;
    G__9869.cljs$lang$applyTo = function(arglist__9870) {
      var args = cljs.core.seq(arglist__9870);
      return G__9869__delegate(args)
    };
    G__9869.cljs$lang$arity$variadic = G__9869__delegate;
    return G__9869
  }()
};
cljs.core.trampoline = function() {
  var trampoline = null;
  var trampoline__1 = function(f) {
    while(true) {
      var ret__9872 = f.call(null);
      if(cljs.core.fn_QMARK_.call(null, ret__9872)) {
        var G__9873 = ret__9872;
        f = G__9873;
        continue
      }else {
        return ret__9872
      }
      break
    }
  };
  var trampoline__2 = function() {
    var G__9874__delegate = function(f, args) {
      return trampoline.call(null, function() {
        return cljs.core.apply.call(null, f, args)
      })
    };
    var G__9874 = function(f, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__9874__delegate.call(this, f, args)
    };
    G__9874.cljs$lang$maxFixedArity = 1;
    G__9874.cljs$lang$applyTo = function(arglist__9875) {
      var f = cljs.core.first(arglist__9875);
      var args = cljs.core.rest(arglist__9875);
      return G__9874__delegate(f, args)
    };
    G__9874.cljs$lang$arity$variadic = G__9874__delegate;
    return G__9874
  }();
  trampoline = function(f, var_args) {
    var args = var_args;
    switch(arguments.length) {
      case 1:
        return trampoline__1.call(this, f);
      default:
        return trampoline__2.cljs$lang$arity$variadic(f, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  trampoline.cljs$lang$maxFixedArity = 1;
  trampoline.cljs$lang$applyTo = trampoline__2.cljs$lang$applyTo;
  trampoline.cljs$lang$arity$1 = trampoline__1;
  trampoline.cljs$lang$arity$variadic = trampoline__2.cljs$lang$arity$variadic;
  return trampoline
}();
cljs.core.rand = function() {
  var rand = null;
  var rand__0 = function() {
    return rand.call(null, 1)
  };
  var rand__1 = function(n) {
    return Math.random.call(null) * n
  };
  rand = function(n) {
    switch(arguments.length) {
      case 0:
        return rand__0.call(this);
      case 1:
        return rand__1.call(this, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  rand.cljs$lang$arity$0 = rand__0;
  rand.cljs$lang$arity$1 = rand__1;
  return rand
}();
cljs.core.rand_int = function rand_int(n) {
  return Math.floor.call(null, Math.random.call(null) * n)
};
cljs.core.rand_nth = function rand_nth(coll) {
  return cljs.core.nth.call(null, coll, cljs.core.rand_int.call(null, cljs.core.count.call(null, coll)))
};
cljs.core.group_by = function group_by(f, coll) {
  return cljs.core.reduce.call(null, function(ret, x) {
    var k__9877 = f.call(null, x);
    return cljs.core.assoc.call(null, ret, k__9877, cljs.core.conj.call(null, cljs.core._lookup.call(null, ret, k__9877, cljs.core.PersistentVector.EMPTY), x))
  }, cljs.core.ObjMap.EMPTY, coll)
};
cljs.core.make_hierarchy = function make_hierarchy() {
  return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'descendants", "\ufdd0'ancestors"], {"\ufdd0'parents":cljs.core.ObjMap.EMPTY, "\ufdd0'descendants":cljs.core.ObjMap.EMPTY, "\ufdd0'ancestors":cljs.core.ObjMap.EMPTY})
};
cljs.core.global_hierarchy = cljs.core.atom.call(null, cljs.core.make_hierarchy.call(null));
cljs.core.isa_QMARK_ = function() {
  var isa_QMARK_ = null;
  var isa_QMARK___2 = function(child, parent) {
    return isa_QMARK_.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), child, parent)
  };
  var isa_QMARK___3 = function(h, child, parent) {
    var or__3943__auto____9886 = cljs.core._EQ_.call(null, child, parent);
    if(or__3943__auto____9886) {
      return or__3943__auto____9886
    }else {
      var or__3943__auto____9887 = cljs.core.contains_QMARK_.call(null, (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h).call(null, child), parent);
      if(or__3943__auto____9887) {
        return or__3943__auto____9887
      }else {
        var and__3941__auto____9888 = cljs.core.vector_QMARK_.call(null, parent);
        if(and__3941__auto____9888) {
          var and__3941__auto____9889 = cljs.core.vector_QMARK_.call(null, child);
          if(and__3941__auto____9889) {
            var and__3941__auto____9890 = cljs.core.count.call(null, parent) === cljs.core.count.call(null, child);
            if(and__3941__auto____9890) {
              var ret__9891 = true;
              var i__9892 = 0;
              while(true) {
                if(function() {
                  var or__3943__auto____9893 = cljs.core.not.call(null, ret__9891);
                  if(or__3943__auto____9893) {
                    return or__3943__auto____9893
                  }else {
                    return i__9892 === cljs.core.count.call(null, parent)
                  }
                }()) {
                  return ret__9891
                }else {
                  var G__9894 = isa_QMARK_.call(null, h, child.call(null, i__9892), parent.call(null, i__9892));
                  var G__9895 = i__9892 + 1;
                  ret__9891 = G__9894;
                  i__9892 = G__9895;
                  continue
                }
                break
              }
            }else {
              return and__3941__auto____9890
            }
          }else {
            return and__3941__auto____9889
          }
        }else {
          return and__3941__auto____9888
        }
      }
    }
  };
  isa_QMARK_ = function(h, child, parent) {
    switch(arguments.length) {
      case 2:
        return isa_QMARK___2.call(this, h, child);
      case 3:
        return isa_QMARK___3.call(this, h, child, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  isa_QMARK_.cljs$lang$arity$2 = isa_QMARK___2;
  isa_QMARK_.cljs$lang$arity$3 = isa_QMARK___3;
  return isa_QMARK_
}();
cljs.core.parents = function() {
  var parents = null;
  var parents__1 = function(tag) {
    return parents.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var parents__2 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core._lookup.call(null, (new cljs.core.Keyword("\ufdd0'parents")).call(null, h), tag, null))
  };
  parents = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return parents__1.call(this, h);
      case 2:
        return parents__2.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  parents.cljs$lang$arity$1 = parents__1;
  parents.cljs$lang$arity$2 = parents__2;
  return parents
}();
cljs.core.ancestors = function() {
  var ancestors = null;
  var ancestors__1 = function(tag) {
    return ancestors.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var ancestors__2 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core._lookup.call(null, (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h), tag, null))
  };
  ancestors = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return ancestors__1.call(this, h);
      case 2:
        return ancestors__2.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  ancestors.cljs$lang$arity$1 = ancestors__1;
  ancestors.cljs$lang$arity$2 = ancestors__2;
  return ancestors
}();
cljs.core.descendants = function() {
  var descendants = null;
  var descendants__1 = function(tag) {
    return descendants.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var descendants__2 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core._lookup.call(null, (new cljs.core.Keyword("\ufdd0'descendants")).call(null, h), tag, null))
  };
  descendants = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return descendants__1.call(this, h);
      case 2:
        return descendants__2.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  descendants.cljs$lang$arity$1 = descendants__1;
  descendants.cljs$lang$arity$2 = descendants__2;
  return descendants
}();
cljs.core.derive = function() {
  var derive = null;
  var derive__2 = function(tag, parent) {
    if(cljs.core.truth_(cljs.core.namespace.call(null, parent))) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'namespace", "\ufdd1'parent"), cljs.core.hash_map("\ufdd0'line", 6724, "\ufdd0'column", 12))))].join(""));
    }
    cljs.core.swap_BANG_.call(null, cljs.core.global_hierarchy, derive, tag, parent);
    return null
  };
  var derive__3 = function(h, tag, parent) {
    if(cljs.core.not_EQ_.call(null, tag, parent)) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'not\x3d", "\ufdd1'tag", "\ufdd1'parent"), cljs.core.hash_map("\ufdd0'line", 6728, "\ufdd0'column", 12))))].join(""));
    }
    var tp__9904 = (new cljs.core.Keyword("\ufdd0'parents")).call(null, h);
    var td__9905 = (new cljs.core.Keyword("\ufdd0'descendants")).call(null, h);
    var ta__9906 = (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h);
    var tf__9907 = function(m, source, sources, target, targets) {
      return cljs.core.reduce.call(null, function(ret, k) {
        return cljs.core.assoc.call(null, ret, k, cljs.core.reduce.call(null, cljs.core.conj, cljs.core._lookup.call(null, targets, k, cljs.core.PersistentHashSet.EMPTY), cljs.core.cons.call(null, target, targets.call(null, target))))
      }, m, cljs.core.cons.call(null, source, sources.call(null, source)))
    };
    var or__3943__auto____9908 = cljs.core.contains_QMARK_.call(null, tp__9904.call(null, tag), parent) ? null : function() {
      if(cljs.core.contains_QMARK_.call(null, ta__9906.call(null, tag), parent)) {
        throw new Error([cljs.core.str(tag), cljs.core.str("already has"), cljs.core.str(parent), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      if(cljs.core.contains_QMARK_.call(null, ta__9906.call(null, parent), tag)) {
        throw new Error([cljs.core.str("Cyclic derivation:"), cljs.core.str(parent), cljs.core.str("has"), cljs.core.str(tag), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'ancestors", "\ufdd0'descendants"], {"\ufdd0'parents":cljs.core.assoc.call(null, (new cljs.core.Keyword("\ufdd0'parents")).call(null, h), tag, cljs.core.conj.call(null, cljs.core._lookup.call(null, tp__9904, tag, cljs.core.PersistentHashSet.EMPTY), parent)), "\ufdd0'ancestors":tf__9907.call(null, (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h), tag, td__9905, parent, ta__9906), "\ufdd0'descendants":tf__9907.call(null, (new cljs.core.Keyword("\ufdd0'descendants")).call(null, 
      h), parent, ta__9906, tag, td__9905)})
    }();
    if(cljs.core.truth_(or__3943__auto____9908)) {
      return or__3943__auto____9908
    }else {
      return h
    }
  };
  derive = function(h, tag, parent) {
    switch(arguments.length) {
      case 2:
        return derive__2.call(this, h, tag);
      case 3:
        return derive__3.call(this, h, tag, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  derive.cljs$lang$arity$2 = derive__2;
  derive.cljs$lang$arity$3 = derive__3;
  return derive
}();
cljs.core.underive = function() {
  var underive = null;
  var underive__2 = function(tag, parent) {
    cljs.core.swap_BANG_.call(null, cljs.core.global_hierarchy, underive, tag, parent);
    return null
  };
  var underive__3 = function(h, tag, parent) {
    var parentMap__9913 = (new cljs.core.Keyword("\ufdd0'parents")).call(null, h);
    var childsParents__9914 = cljs.core.truth_(parentMap__9913.call(null, tag)) ? cljs.core.disj.call(null, parentMap__9913.call(null, tag), parent) : cljs.core.PersistentHashSet.EMPTY;
    var newParents__9915 = cljs.core.truth_(cljs.core.not_empty.call(null, childsParents__9914)) ? cljs.core.assoc.call(null, parentMap__9913, tag, childsParents__9914) : cljs.core.dissoc.call(null, parentMap__9913, tag);
    var deriv_seq__9916 = cljs.core.flatten.call(null, cljs.core.map.call(null, function(p1__9896_SHARP_) {
      return cljs.core.cons.call(null, cljs.core.first.call(null, p1__9896_SHARP_), cljs.core.interpose.call(null, cljs.core.first.call(null, p1__9896_SHARP_), cljs.core.second.call(null, p1__9896_SHARP_)))
    }, cljs.core.seq.call(null, newParents__9915)));
    if(cljs.core.contains_QMARK_.call(null, parentMap__9913.call(null, tag), parent)) {
      return cljs.core.reduce.call(null, function(p1__9897_SHARP_, p2__9898_SHARP_) {
        return cljs.core.apply.call(null, cljs.core.derive, p1__9897_SHARP_, p2__9898_SHARP_)
      }, cljs.core.make_hierarchy.call(null), cljs.core.partition.call(null, 2, deriv_seq__9916))
    }else {
      return h
    }
  };
  underive = function(h, tag, parent) {
    switch(arguments.length) {
      case 2:
        return underive__2.call(this, h, tag);
      case 3:
        return underive__3.call(this, h, tag, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  underive.cljs$lang$arity$2 = underive__2;
  underive.cljs$lang$arity$3 = underive__3;
  return underive
}();
cljs.core.reset_cache = function reset_cache(method_cache, method_table, cached_hierarchy, hierarchy) {
  cljs.core.swap_BANG_.call(null, method_cache, function(_) {
    return cljs.core.deref.call(null, method_table)
  });
  return cljs.core.swap_BANG_.call(null, cached_hierarchy, function(_) {
    return cljs.core.deref.call(null, hierarchy)
  })
};
cljs.core.prefers_STAR_ = function prefers_STAR_(x, y, prefer_table) {
  var xprefs__9924 = cljs.core.deref.call(null, prefer_table).call(null, x);
  var or__3943__auto____9926 = cljs.core.truth_(function() {
    var and__3941__auto____9925 = xprefs__9924;
    if(cljs.core.truth_(and__3941__auto____9925)) {
      return xprefs__9924.call(null, y)
    }else {
      return and__3941__auto____9925
    }
  }()) ? true : null;
  if(cljs.core.truth_(or__3943__auto____9926)) {
    return or__3943__auto____9926
  }else {
    var or__3943__auto____9928 = function() {
      var ps__9927 = cljs.core.parents.call(null, y);
      while(true) {
        if(cljs.core.count.call(null, ps__9927) > 0) {
          if(cljs.core.truth_(prefers_STAR_.call(null, x, cljs.core.first.call(null, ps__9927), prefer_table))) {
          }else {
          }
          var G__9931 = cljs.core.rest.call(null, ps__9927);
          ps__9927 = G__9931;
          continue
        }else {
          return null
        }
        break
      }
    }();
    if(cljs.core.truth_(or__3943__auto____9928)) {
      return or__3943__auto____9928
    }else {
      var or__3943__auto____9930 = function() {
        var ps__9929 = cljs.core.parents.call(null, x);
        while(true) {
          if(cljs.core.count.call(null, ps__9929) > 0) {
            if(cljs.core.truth_(prefers_STAR_.call(null, cljs.core.first.call(null, ps__9929), y, prefer_table))) {
            }else {
            }
            var G__9932 = cljs.core.rest.call(null, ps__9929);
            ps__9929 = G__9932;
            continue
          }else {
            return null
          }
          break
        }
      }();
      if(cljs.core.truth_(or__3943__auto____9930)) {
        return or__3943__auto____9930
      }else {
        return false
      }
    }
  }
};
cljs.core.dominates = function dominates(x, y, prefer_table) {
  var or__3943__auto____9934 = cljs.core.prefers_STAR_.call(null, x, y, prefer_table);
  if(cljs.core.truth_(or__3943__auto____9934)) {
    return or__3943__auto____9934
  }else {
    return cljs.core.isa_QMARK_.call(null, x, y)
  }
};
cljs.core.find_and_cache_best_method = function find_and_cache_best_method(name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  var best_entry__9952 = cljs.core.reduce.call(null, function(be, p__9944) {
    var vec__9945__9946 = p__9944;
    var k__9947 = cljs.core.nth.call(null, vec__9945__9946, 0, null);
    var ___9948 = cljs.core.nth.call(null, vec__9945__9946, 1, null);
    var e__9949 = vec__9945__9946;
    if(cljs.core.isa_QMARK_.call(null, dispatch_val, k__9947)) {
      var be2__9951 = cljs.core.truth_(function() {
        var or__3943__auto____9950 = be == null;
        if(or__3943__auto____9950) {
          return or__3943__auto____9950
        }else {
          return cljs.core.dominates.call(null, k__9947, cljs.core.first.call(null, be), prefer_table)
        }
      }()) ? e__9949 : be;
      if(cljs.core.truth_(cljs.core.dominates.call(null, cljs.core.first.call(null, be2__9951), k__9947, prefer_table))) {
      }else {
        throw new Error([cljs.core.str("Multiple methods in multimethod '"), cljs.core.str(name), cljs.core.str("' match dispatch value: "), cljs.core.str(dispatch_val), cljs.core.str(" -\x3e "), cljs.core.str(k__9947), cljs.core.str(" and "), cljs.core.str(cljs.core.first.call(null, be2__9951)), cljs.core.str(", and neither is preferred")].join(""));
      }
      return be2__9951
    }else {
      return be
    }
  }, null, cljs.core.deref.call(null, method_table));
  if(cljs.core.truth_(best_entry__9952)) {
    if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, cached_hierarchy), cljs.core.deref.call(null, hierarchy))) {
      cljs.core.swap_BANG_.call(null, method_cache, cljs.core.assoc, dispatch_val, cljs.core.second.call(null, best_entry__9952));
      return cljs.core.second.call(null, best_entry__9952)
    }else {
      cljs.core.reset_cache.call(null, method_cache, method_table, cached_hierarchy, hierarchy);
      return find_and_cache_best_method.call(null, name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy)
    }
  }else {
    return null
  }
};
cljs.core.IMultiFn = {};
cljs.core._reset = function _reset(mf) {
  if(function() {
    var and__3941__auto____9957 = mf;
    if(and__3941__auto____9957) {
      return mf.cljs$core$IMultiFn$_reset$arity$1
    }else {
      return and__3941__auto____9957
    }
  }()) {
    return mf.cljs$core$IMultiFn$_reset$arity$1(mf)
  }else {
    var x__2304__auto____9958 = mf == null ? null : mf;
    return function() {
      var or__3943__auto____9959 = cljs.core._reset[goog.typeOf(x__2304__auto____9958)];
      if(or__3943__auto____9959) {
        return or__3943__auto____9959
      }else {
        var or__3943__auto____9960 = cljs.core._reset["_"];
        if(or__3943__auto____9960) {
          return or__3943__auto____9960
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-reset", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._add_method = function _add_method(mf, dispatch_val, method) {
  if(function() {
    var and__3941__auto____9965 = mf;
    if(and__3941__auto____9965) {
      return mf.cljs$core$IMultiFn$_add_method$arity$3
    }else {
      return and__3941__auto____9965
    }
  }()) {
    return mf.cljs$core$IMultiFn$_add_method$arity$3(mf, dispatch_val, method)
  }else {
    var x__2304__auto____9966 = mf == null ? null : mf;
    return function() {
      var or__3943__auto____9967 = cljs.core._add_method[goog.typeOf(x__2304__auto____9966)];
      if(or__3943__auto____9967) {
        return or__3943__auto____9967
      }else {
        var or__3943__auto____9968 = cljs.core._add_method["_"];
        if(or__3943__auto____9968) {
          return or__3943__auto____9968
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-add-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, method)
  }
};
cljs.core._remove_method = function _remove_method(mf, dispatch_val) {
  if(function() {
    var and__3941__auto____9973 = mf;
    if(and__3941__auto____9973) {
      return mf.cljs$core$IMultiFn$_remove_method$arity$2
    }else {
      return and__3941__auto____9973
    }
  }()) {
    return mf.cljs$core$IMultiFn$_remove_method$arity$2(mf, dispatch_val)
  }else {
    var x__2304__auto____9974 = mf == null ? null : mf;
    return function() {
      var or__3943__auto____9975 = cljs.core._remove_method[goog.typeOf(x__2304__auto____9974)];
      if(or__3943__auto____9975) {
        return or__3943__auto____9975
      }else {
        var or__3943__auto____9976 = cljs.core._remove_method["_"];
        if(or__3943__auto____9976) {
          return or__3943__auto____9976
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-remove-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._prefer_method = function _prefer_method(mf, dispatch_val, dispatch_val_y) {
  if(function() {
    var and__3941__auto____9981 = mf;
    if(and__3941__auto____9981) {
      return mf.cljs$core$IMultiFn$_prefer_method$arity$3
    }else {
      return and__3941__auto____9981
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefer_method$arity$3(mf, dispatch_val, dispatch_val_y)
  }else {
    var x__2304__auto____9982 = mf == null ? null : mf;
    return function() {
      var or__3943__auto____9983 = cljs.core._prefer_method[goog.typeOf(x__2304__auto____9982)];
      if(or__3943__auto____9983) {
        return or__3943__auto____9983
      }else {
        var or__3943__auto____9984 = cljs.core._prefer_method["_"];
        if(or__3943__auto____9984) {
          return or__3943__auto____9984
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefer-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, dispatch_val_y)
  }
};
cljs.core._get_method = function _get_method(mf, dispatch_val) {
  if(function() {
    var and__3941__auto____9989 = mf;
    if(and__3941__auto____9989) {
      return mf.cljs$core$IMultiFn$_get_method$arity$2
    }else {
      return and__3941__auto____9989
    }
  }()) {
    return mf.cljs$core$IMultiFn$_get_method$arity$2(mf, dispatch_val)
  }else {
    var x__2304__auto____9990 = mf == null ? null : mf;
    return function() {
      var or__3943__auto____9991 = cljs.core._get_method[goog.typeOf(x__2304__auto____9990)];
      if(or__3943__auto____9991) {
        return or__3943__auto____9991
      }else {
        var or__3943__auto____9992 = cljs.core._get_method["_"];
        if(or__3943__auto____9992) {
          return or__3943__auto____9992
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-get-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._methods = function _methods(mf) {
  if(function() {
    var and__3941__auto____9997 = mf;
    if(and__3941__auto____9997) {
      return mf.cljs$core$IMultiFn$_methods$arity$1
    }else {
      return and__3941__auto____9997
    }
  }()) {
    return mf.cljs$core$IMultiFn$_methods$arity$1(mf)
  }else {
    var x__2304__auto____9998 = mf == null ? null : mf;
    return function() {
      var or__3943__auto____9999 = cljs.core._methods[goog.typeOf(x__2304__auto____9998)];
      if(or__3943__auto____9999) {
        return or__3943__auto____9999
      }else {
        var or__3943__auto____10000 = cljs.core._methods["_"];
        if(or__3943__auto____10000) {
          return or__3943__auto____10000
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-methods", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._prefers = function _prefers(mf) {
  if(function() {
    var and__3941__auto____10005 = mf;
    if(and__3941__auto____10005) {
      return mf.cljs$core$IMultiFn$_prefers$arity$1
    }else {
      return and__3941__auto____10005
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefers$arity$1(mf)
  }else {
    var x__2304__auto____10006 = mf == null ? null : mf;
    return function() {
      var or__3943__auto____10007 = cljs.core._prefers[goog.typeOf(x__2304__auto____10006)];
      if(or__3943__auto____10007) {
        return or__3943__auto____10007
      }else {
        var or__3943__auto____10008 = cljs.core._prefers["_"];
        if(or__3943__auto____10008) {
          return or__3943__auto____10008
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefers", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._dispatch = function _dispatch(mf, args) {
  if(function() {
    var and__3941__auto____10013 = mf;
    if(and__3941__auto____10013) {
      return mf.cljs$core$IMultiFn$_dispatch$arity$2
    }else {
      return and__3941__auto____10013
    }
  }()) {
    return mf.cljs$core$IMultiFn$_dispatch$arity$2(mf, args)
  }else {
    var x__2304__auto____10014 = mf == null ? null : mf;
    return function() {
      var or__3943__auto____10015 = cljs.core._dispatch[goog.typeOf(x__2304__auto____10014)];
      if(or__3943__auto____10015) {
        return or__3943__auto____10015
      }else {
        var or__3943__auto____10016 = cljs.core._dispatch["_"];
        if(or__3943__auto____10016) {
          return or__3943__auto____10016
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-dispatch", mf);
        }
      }
    }().call(null, mf, args)
  }
};
cljs.core.do_dispatch = function do_dispatch(mf, dispatch_fn, args) {
  var dispatch_val__10019 = cljs.core.apply.call(null, dispatch_fn, args);
  var target_fn__10020 = cljs.core._get_method.call(null, mf, dispatch_val__10019);
  if(cljs.core.truth_(target_fn__10020)) {
  }else {
    throw new Error([cljs.core.str("No method in multimethod '"), cljs.core.str(cljs.core.name), cljs.core.str("' for dispatch value: "), cljs.core.str(dispatch_val__10019)].join(""));
  }
  return cljs.core.apply.call(null, target_fn__10020, args)
};
cljs.core.MultiFn = function(name, dispatch_fn, default_dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  this.name = name;
  this.dispatch_fn = dispatch_fn;
  this.default_dispatch_val = default_dispatch_val;
  this.hierarchy = hierarchy;
  this.method_table = method_table;
  this.prefer_table = prefer_table;
  this.method_cache = method_cache;
  this.cached_hierarchy = cached_hierarchy;
  this.cljs$lang$protocol_mask$partition0$ = 4194304;
  this.cljs$lang$protocol_mask$partition1$ = 64
};
cljs.core.MultiFn.cljs$lang$type = true;
cljs.core.MultiFn.cljs$lang$ctorPrSeq = function(this__2250__auto__) {
  return cljs.core.list.call(null, "cljs.core/MultiFn")
};
cljs.core.MultiFn.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var this__10021 = this;
  return goog.getUid(this$)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_reset$arity$1 = function(mf) {
  var this__10022 = this;
  cljs.core.swap_BANG_.call(null, this__10022.method_table, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__10022.method_cache, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__10022.prefer_table, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__10022.cached_hierarchy, function(mf) {
    return null
  });
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_add_method$arity$3 = function(mf, dispatch_val, method) {
  var this__10023 = this;
  cljs.core.swap_BANG_.call(null, this__10023.method_table, cljs.core.assoc, dispatch_val, method);
  cljs.core.reset_cache.call(null, this__10023.method_cache, this__10023.method_table, this__10023.cached_hierarchy, this__10023.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_remove_method$arity$2 = function(mf, dispatch_val) {
  var this__10024 = this;
  cljs.core.swap_BANG_.call(null, this__10024.method_table, cljs.core.dissoc, dispatch_val);
  cljs.core.reset_cache.call(null, this__10024.method_cache, this__10024.method_table, this__10024.cached_hierarchy, this__10024.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_get_method$arity$2 = function(mf, dispatch_val) {
  var this__10025 = this;
  if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, this__10025.cached_hierarchy), cljs.core.deref.call(null, this__10025.hierarchy))) {
  }else {
    cljs.core.reset_cache.call(null, this__10025.method_cache, this__10025.method_table, this__10025.cached_hierarchy, this__10025.hierarchy)
  }
  var temp__4090__auto____10026 = cljs.core.deref.call(null, this__10025.method_cache).call(null, dispatch_val);
  if(cljs.core.truth_(temp__4090__auto____10026)) {
    var target_fn__10027 = temp__4090__auto____10026;
    return target_fn__10027
  }else {
    var temp__4090__auto____10028 = cljs.core.find_and_cache_best_method.call(null, this__10025.name, dispatch_val, this__10025.hierarchy, this__10025.method_table, this__10025.prefer_table, this__10025.method_cache, this__10025.cached_hierarchy);
    if(cljs.core.truth_(temp__4090__auto____10028)) {
      var target_fn__10029 = temp__4090__auto____10028;
      return target_fn__10029
    }else {
      return cljs.core.deref.call(null, this__10025.method_table).call(null, this__10025.default_dispatch_val)
    }
  }
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefer_method$arity$3 = function(mf, dispatch_val_x, dispatch_val_y) {
  var this__10030 = this;
  if(cljs.core.truth_(cljs.core.prefers_STAR_.call(null, dispatch_val_x, dispatch_val_y, this__10030.prefer_table))) {
    throw new Error([cljs.core.str("Preference conflict in multimethod '"), cljs.core.str(this__10030.name), cljs.core.str("': "), cljs.core.str(dispatch_val_y), cljs.core.str(" is already preferred to "), cljs.core.str(dispatch_val_x)].join(""));
  }else {
  }
  cljs.core.swap_BANG_.call(null, this__10030.prefer_table, function(old) {
    return cljs.core.assoc.call(null, old, dispatch_val_x, cljs.core.conj.call(null, cljs.core._lookup.call(null, old, dispatch_val_x, cljs.core.PersistentHashSet.EMPTY), dispatch_val_y))
  });
  return cljs.core.reset_cache.call(null, this__10030.method_cache, this__10030.method_table, this__10030.cached_hierarchy, this__10030.hierarchy)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_methods$arity$1 = function(mf) {
  var this__10031 = this;
  return cljs.core.deref.call(null, this__10031.method_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefers$arity$1 = function(mf) {
  var this__10032 = this;
  return cljs.core.deref.call(null, this__10032.prefer_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_dispatch$arity$2 = function(mf, args) {
  var this__10033 = this;
  return cljs.core.do_dispatch.call(null, mf, this__10033.dispatch_fn, args)
};
cljs.core.MultiFn;
cljs.core.MultiFn.prototype.call = function() {
  var G__10035__delegate = function(_, args) {
    var self__10034 = this;
    return cljs.core._dispatch.call(null, self__10034, args)
  };
  var G__10035 = function(_, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return G__10035__delegate.call(this, _, args)
  };
  G__10035.cljs$lang$maxFixedArity = 1;
  G__10035.cljs$lang$applyTo = function(arglist__10036) {
    var _ = cljs.core.first(arglist__10036);
    var args = cljs.core.rest(arglist__10036);
    return G__10035__delegate(_, args)
  };
  G__10035.cljs$lang$arity$variadic = G__10035__delegate;
  return G__10035
}();
cljs.core.MultiFn.prototype.apply = function(_, args) {
  var self__10037 = this;
  return cljs.core._dispatch.call(null, self__10037, args)
};
cljs.core.remove_all_methods = function remove_all_methods(multifn) {
  return cljs.core._reset.call(null, multifn)
};
cljs.core.remove_method = function remove_method(multifn, dispatch_val) {
  return cljs.core._remove_method.call(null, multifn, dispatch_val)
};
cljs.core.prefer_method = function prefer_method(multifn, dispatch_val_x, dispatch_val_y) {
  return cljs.core._prefer_method.call(null, multifn, dispatch_val_x, dispatch_val_y)
};
cljs.core.methods$ = function methods$(multifn) {
  return cljs.core._methods.call(null, multifn)
};
cljs.core.get_method = function get_method(multifn, dispatch_val) {
  return cljs.core._get_method.call(null, multifn, dispatch_val)
};
cljs.core.prefers = function prefers(multifn) {
  return cljs.core._prefers.call(null, multifn)
};
cljs.core.UUID = function(uuid) {
  this.uuid = uuid;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 543162368
};
cljs.core.UUID.cljs$lang$type = true;
cljs.core.UUID.cljs$lang$ctorPrSeq = function(this__2250__auto__) {
  return cljs.core.list.call(null, "cljs.core/UUID")
};
cljs.core.UUID.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var this__10038 = this;
  return goog.string.hashCode(cljs.core.pr_str.call(null, this$))
};
cljs.core.UUID.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(_10040, _) {
  var this__10039 = this;
  return cljs.core.list.call(null, [cljs.core.str('#uuid "'), cljs.core.str(this__10039.uuid), cljs.core.str('"')].join(""))
};
cljs.core.UUID.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(_, other) {
  var this__10041 = this;
  var and__3941__auto____10042 = cljs.core.instance_QMARK_.call(null, cljs.core.UUID, other);
  if(and__3941__auto____10042) {
    return this__10041.uuid === other.uuid
  }else {
    return and__3941__auto____10042
  }
};
cljs.core.UUID.prototype.toString = function() {
  var this__10043 = this;
  var this__10044 = this;
  return cljs.core.pr_str.call(null, this__10044)
};
cljs.core.UUID;
goog.provide("cube.webgl_cube");
goog.require("cljs.core");
if(cljs.core.not.call(null, Detector.webgl)) {
  Detector.addGetWebGLMessage.call(null)
}else {
}
cube.webgl_cube.init = function init() {
  var camera = function() {
    var c = new THREE.PerspectiveCamera;
    c.fov = 75;
    c.aspect = window.innerWidth / window.innerHeight;
    c.near = 1;
    c.far = 1E4;
    c.position = new THREE.Vector3(0, 0, 1E3);
    return c
  }();
  var geometry = new THREE.CubeGeometry(200, 200, 200);
  var material = new THREE.MeshBasicMaterial({color:16711680, wireframe:true});
  var mesh = new THREE.Mesh(geometry, material);
  var scene = function() {
    var s = new THREE.Scene;
    s.add(mesh);
    return s
  }();
  var renderer = function() {
    var r = new THREE.WebGLRenderer;
    r.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(r.domElement);
    return r
  }();
  return cljs.core.vector.call(null, renderer, scene, camera, mesh)
};
cube.webgl_cube.animate = function animate(p__12098) {
  var vec__12100 = p__12098;
  var renderer = cljs.core.nth.call(null, vec__12100, 0, null);
  var scene = cljs.core.nth.call(null, vec__12100, 1, null);
  var camera = cljs.core.nth.call(null, vec__12100, 2, null);
  var mesh = cljs.core.nth.call(null, vec__12100, 3, null);
  window.requestAnimationFrame.call(null, cube.webgl_cube.animate);
  return renderer.render(scene, camera)
};
cube.webgl_cube.main = function main() {
  cube.webgl_cube.animate.call(null, cube.webgl_cube.init.call(null));
  return document.write("\x3cp\x3eWebGL Cube\x3c/p\x3e")
};
goog.exportSymbol("cube.webgl_cube.main", cube.webgl_cube.main);
goog.provide("cube.simple_cube");
goog.require("cljs.core");
cube.simple_cube.init = function init() {
  var camera__6068 = function() {
    var c__6067 = new THREE.PerspectiveCamera;
    c__6067.fov = 75;
    c__6067.aspect = window.innerWidth / window.innerHeight;
    c__6067.near = 1;
    c__6067.far = 1E4;
    c__6067.position = new THREE.Vector3(0, 0, 1E3);
    return c__6067
  }();
  var geometry__6069 = new THREE.CubeGeometry(200, 200, 200);
  var material__6070 = new THREE.MeshBasicMaterial({color:16711680, wireframe:true});
  var mesh__6071 = new THREE.Mesh(geometry__6069, material__6070);
  var scene__6073 = function() {
    var s__6072 = new THREE.Scene;
    s__6072.add(mesh__6071);
    return s__6072
  }();
  var renderer__6075 = function() {
    var r__6074 = new THREE.CanvasRenderer;
    r__6074.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(r__6074.domElement);
    return r__6074
  }();
  return cljs.core.PersistentVector.fromArray([renderer__6075, scene__6073, camera__6068, mesh__6071], true)
};
cube.simple_cube.animate = function animate(p__6076) {
  var vec__6083__6084 = p__6076;
  var renderer__6085 = cljs.core.nth.call(null, vec__6083__6084, 0, null);
  var scene__6086 = cljs.core.nth.call(null, vec__6083__6084, 1, null);
  var camera__6087 = cljs.core.nth.call(null, vec__6083__6084, 2, null);
  var mesh__6088 = cljs.core.nth.call(null, vec__6083__6084, 3, null);
  window.requestAnimationFrame.call(null, cube.simple_cube.animate);
  mesh__6088.rotation.x = 0.01 + mesh__6088.rotation.x;
  mesh__6088.rotation.y = 0.02 + mesh__6088.rotation.y;
  return renderer__6085.render(scene__6086, camera__6087)
};
cube.simple_cube.main = function main() {
  cube.simple_cube.animate.call(null, cube.simple_cube.init.call(null));
  return document.write("\x3cp\x3eSimple Cube\x3c/p\x3e")
};
goog.exportSymbol("cube.simple_cube.main", cube.simple_cube.main);
