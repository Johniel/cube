var COMPILED = false;
var goog = goog || {};
goog.global = this;
goog.DEBUG = true;
goog.LOCALE = "en";
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
goog.identityFunction = function(var_args) {
  return arguments[0]
};
goog.abstractMethod = function() {
  throw Error("unimplemented abstract method");
};
goog.addSingletonGetter = function(ctor) {
  ctor.getInstance = function() {
    return ctor.instance_ || (ctor.instance_ = new ctor)
  }
};
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
      doc.write('<script type="text/javascript" src="' + src + '"></' + "script>");
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
      var className = Object.prototype.toString.call(value);
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
goog.propertyIsEnumerableCustom_ = function(object, propName) {
  if(propName in object) {
    for(var key in object) {
      if(key == propName && Object.prototype.hasOwnProperty.call(object, propName)) {
        return true
      }
    }
  }
  return false
};
goog.propertyIsEnumerable_ = function(object, propName) {
  if(object instanceof Object) {
    return Object.prototype.propertyIsEnumerable.call(object, propName)
  }else {
    return goog.propertyIsEnumerableCustom_(object, propName)
  }
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
  var type = goog.typeOf(val);
  return type == "object" || type == "array" || type == "function"
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
goog.UID_PROPERTY_ = "closure_uid_" + Math.floor(Math.random() * 2147483648).toString(36);
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
Object.prototype.clone;
goog.bindNative_ = function(fn, selfObj, var_args) {
  return fn.call.apply(fn.bind, arguments)
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
goog.now = Date.now || function() {
  return+new Date
};
goog.globalEval = function(script) {
  if(goog.global.execScript) {
    goog.global.execScript(script, "JavaScript")
  }else {
    if(goog.global.eval) {
      if(goog.evalWorksForGlobals_ == null) {
        goog.global.eval("var _et_ = 1;");
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
  this.stack = (new Error).stack || "";
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
goog.string.encodeUriRegExp_ = /^[a-zA-Z0-9\-_.!~*'()]*$/;
goog.string.urlEncode = function(str) {
  str = String(str);
  if(!goog.string.encodeUriRegExp_.test(str)) {
    return encodeURIComponent(str)
  }
  return str
};
goog.string.urlDecode = function(str) {
  return decodeURIComponent(str.replace(/\+/g, " "))
};
goog.string.newLineToBr = function(str, opt_xml) {
  return str.replace(/(\r\n|\r|\n)/g, opt_xml ? "<br />" : "<br>")
};
goog.string.htmlEscape = function(str, opt_isLikelyToContainHtmlChars) {
  if(opt_isLikelyToContainHtmlChars) {
    return str.replace(goog.string.amperRe_, "&amp;").replace(goog.string.ltRe_, "&lt;").replace(goog.string.gtRe_, "&gt;").replace(goog.string.quotRe_, "&quot;")
  }else {
    if(!goog.string.allRe_.test(str)) {
      return str
    }
    if(str.indexOf("&") != -1) {
      str = str.replace(goog.string.amperRe_, "&amp;")
    }
    if(str.indexOf("<") != -1) {
      str = str.replace(goog.string.ltRe_, "&lt;")
    }
    if(str.indexOf(">") != -1) {
      str = str.replace(goog.string.gtRe_, "&gt;")
    }
    if(str.indexOf('"') != -1) {
      str = str.replace(goog.string.quotRe_, "&quot;")
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
  if(goog.string.contains(str, "&")) {
    if("document" in goog.global) {
      return goog.string.unescapeEntitiesUsingDom_(str)
    }else {
      return goog.string.unescapePureXmlEntities_(str)
    }
  }
  return str
};
goog.string.unescapeEntitiesUsingDom_ = function(str) {
  var seen = {"&amp;":"&", "&lt;":"<", "&gt;":">", "&quot;":'"'};
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
        return"&";
      case "lt":
        return"<";
      case "gt":
        return">";
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
  return goog.string.newLineToBr(str.replace(/  /g, " &#160;"), opt_xml)
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
goog.string.specialEscapeChars_ = {"\x00":"\\0", "\u0008":"\\b", "\u000c":"\\f", "\n":"\\n", "\r":"\\r", "\t":"\\t", "\x0B":"\\x0B", '"':'\\"', "\\":"\\\\"};
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
goog.string.toCamelCaseCache_ = {};
goog.string.toCamelCase = function(str) {
  return goog.string.toCamelCaseCache_[str] || (goog.string.toCamelCaseCache_[str] = String(str).replace(/\-([a-z])/g, function(all, match) {
    return match.toUpperCase()
  }))
};
goog.string.toSelectorCaseCache_ = {};
goog.string.toSelectorCase = function(str) {
  return goog.string.toSelectorCaseCache_[str] || (goog.string.toSelectorCaseCache_[str] = String(str).replace(/([A-Z])/g, "-$1").toLowerCase())
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
  return value
};
goog.asserts.assertString = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isString(value)) {
    goog.asserts.doAssertFailure_("Expected string but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertFunction = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isFunction(value)) {
    goog.asserts.doAssertFailure_("Expected function but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertObject = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isObject(value)) {
    goog.asserts.doAssertFailure_("Expected object but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertArray = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isArray(value)) {
    goog.asserts.doAssertFailure_("Expected array but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertBoolean = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isBoolean(value)) {
    goog.asserts.doAssertFailure_("Expected boolean but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertInstanceof = function(value, type, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !(value instanceof type)) {
    goog.asserts.doAssertFailure_("instanceof check failed.", null, opt_message, Array.prototype.slice.call(arguments, 3))
  }
};
goog.provide("goog.array");
goog.provide("goog.array.ArrayLike");
goog.require("goog.asserts");
goog.NATIVE_ARRAY_PROTOTYPES = true;
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
goog.array.clone = function(arr) {
  if(goog.isArray(arr)) {
    return goog.array.concat(arr)
  }else {
    var rv = [];
    for(var i = 0, len = arr.length;i < len;i++) {
      rv[i] = arr[i]
    }
    return rv
  }
};
goog.array.toArray = function(object) {
  if(goog.isArray(object)) {
    return goog.array.concat(object)
  }
  return goog.array.clone(object)
};
goog.array.extend = function(arr1, var_args) {
  for(var i = 1;i < arguments.length;i++) {
    var arr2 = arguments[i];
    var isArrayLike;
    if(goog.isArray(arr2) || (isArrayLike = goog.isArrayLike(arr2)) && arr2.hasOwnProperty("callee")) {
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
goog.provide("goog.userAgent.jscript");
goog.require("goog.string");
goog.userAgent.jscript.ASSUME_NO_JSCRIPT = false;
goog.userAgent.jscript.init_ = function() {
  var hasScriptEngine = "ScriptEngine" in goog.global;
  goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_ = hasScriptEngine && goog.global["ScriptEngine"]() == "JScript";
  goog.userAgent.jscript.DETECTED_VERSION_ = goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_ ? goog.global["ScriptEngineMajorVersion"]() + "." + goog.global["ScriptEngineMinorVersion"]() + "." + goog.global["ScriptEngineBuildVersion"]() : "0"
};
if(!goog.userAgent.jscript.ASSUME_NO_JSCRIPT) {
  goog.userAgent.jscript.init_()
}
goog.userAgent.jscript.HAS_JSCRIPT = goog.userAgent.jscript.ASSUME_NO_JSCRIPT ? false : goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_;
goog.userAgent.jscript.VERSION = goog.userAgent.jscript.ASSUME_NO_JSCRIPT ? "0" : goog.userAgent.jscript.DETECTED_VERSION_;
goog.userAgent.jscript.isVersion = function(version) {
  return goog.string.compareVersions(goog.userAgent.jscript.VERSION, version) >= 0
};
goog.provide("goog.string.StringBuffer");
goog.require("goog.userAgent.jscript");
goog.string.StringBuffer = function(opt_a1, var_args) {
  this.buffer_ = goog.userAgent.jscript.HAS_JSCRIPT ? [] : "";
  if(opt_a1 != null) {
    this.append.apply(this, arguments)
  }
};
goog.string.StringBuffer.prototype.set = function(s) {
  this.clear();
  this.append(s)
};
if(goog.userAgent.jscript.HAS_JSCRIPT) {
  goog.string.StringBuffer.prototype.bufferLength_ = 0;
  goog.string.StringBuffer.prototype.append = function(a1, opt_a2, var_args) {
    if(opt_a2 == null) {
      this.buffer_[this.bufferLength_++] = a1
    }else {
      this.buffer_.push.apply(this.buffer_, arguments);
      this.bufferLength_ = this.buffer_.length
    }
    return this
  }
}else {
  goog.string.StringBuffer.prototype.append = function(a1, opt_a2, var_args) {
    this.buffer_ += a1;
    if(opt_a2 != null) {
      for(var i = 1;i < arguments.length;i++) {
        this.buffer_ += arguments[i]
      }
    }
    return this
  }
}
goog.string.StringBuffer.prototype.clear = function() {
  if(goog.userAgent.jscript.HAS_JSCRIPT) {
    this.buffer_.length = 0;
    this.bufferLength_ = 0
  }else {
    this.buffer_ = ""
  }
};
goog.string.StringBuffer.prototype.getLength = function() {
  return this.toString().length
};
goog.string.StringBuffer.prototype.toString = function() {
  if(goog.userAgent.jscript.HAS_JSCRIPT) {
    var str = this.buffer_.join("");
    this.clear();
    if(str) {
      this.append(str)
    }
    return str
  }else {
    return this.buffer_
  }
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
  var x__9599 = x == null ? null : x;
  if(p[goog.typeOf(x__9599)]) {
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
    var G__9600__delegate = function(array, i, idxs) {
      return cljs.core.apply.call(null, aget, aget.call(null, array, i), idxs)
    };
    var G__9600 = function(array, i, var_args) {
      var idxs = null;
      if(goog.isDef(var_args)) {
        idxs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__9600__delegate.call(this, array, i, idxs)
    };
    G__9600.cljs$lang$maxFixedArity = 2;
    G__9600.cljs$lang$applyTo = function(arglist__9601) {
      var array = cljs.core.first(arglist__9601);
      var i = cljs.core.first(cljs.core.next(arglist__9601));
      var idxs = cljs.core.rest(cljs.core.next(arglist__9601));
      return G__9600__delegate(array, i, idxs)
    };
    G__9600.cljs$lang$arity$variadic = G__9600__delegate;
    return G__9600
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
      var and__3941__auto____9686 = this$;
      if(and__3941__auto____9686) {
        return this$.cljs$core$IFn$_invoke$arity$1
      }else {
        return and__3941__auto____9686
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$1(this$)
    }else {
      var x__2304__auto____9687 = this$ == null ? null : this$;
      return function() {
        var or__3943__auto____9688 = cljs.core._invoke[goog.typeOf(x__2304__auto____9687)];
        if(or__3943__auto____9688) {
          return or__3943__auto____9688
        }else {
          var or__3943__auto____9689 = cljs.core._invoke["_"];
          if(or__3943__auto____9689) {
            return or__3943__auto____9689
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$)
    }
  };
  var _invoke__2 = function(this$, a) {
    if(function() {
      var and__3941__auto____9690 = this$;
      if(and__3941__auto____9690) {
        return this$.cljs$core$IFn$_invoke$arity$2
      }else {
        return and__3941__auto____9690
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$2(this$, a)
    }else {
      var x__2304__auto____9691 = this$ == null ? null : this$;
      return function() {
        var or__3943__auto____9692 = cljs.core._invoke[goog.typeOf(x__2304__auto____9691)];
        if(or__3943__auto____9692) {
          return or__3943__auto____9692
        }else {
          var or__3943__auto____9693 = cljs.core._invoke["_"];
          if(or__3943__auto____9693) {
            return or__3943__auto____9693
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a)
    }
  };
  var _invoke__3 = function(this$, a, b) {
    if(function() {
      var and__3941__auto____9694 = this$;
      if(and__3941__auto____9694) {
        return this$.cljs$core$IFn$_invoke$arity$3
      }else {
        return and__3941__auto____9694
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$3(this$, a, b)
    }else {
      var x__2304__auto____9695 = this$ == null ? null : this$;
      return function() {
        var or__3943__auto____9696 = cljs.core._invoke[goog.typeOf(x__2304__auto____9695)];
        if(or__3943__auto____9696) {
          return or__3943__auto____9696
        }else {
          var or__3943__auto____9697 = cljs.core._invoke["_"];
          if(or__3943__auto____9697) {
            return or__3943__auto____9697
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b)
    }
  };
  var _invoke__4 = function(this$, a, b, c) {
    if(function() {
      var and__3941__auto____9698 = this$;
      if(and__3941__auto____9698) {
        return this$.cljs$core$IFn$_invoke$arity$4
      }else {
        return and__3941__auto____9698
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$4(this$, a, b, c)
    }else {
      var x__2304__auto____9699 = this$ == null ? null : this$;
      return function() {
        var or__3943__auto____9700 = cljs.core._invoke[goog.typeOf(x__2304__auto____9699)];
        if(or__3943__auto____9700) {
          return or__3943__auto____9700
        }else {
          var or__3943__auto____9701 = cljs.core._invoke["_"];
          if(or__3943__auto____9701) {
            return or__3943__auto____9701
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c)
    }
  };
  var _invoke__5 = function(this$, a, b, c, d) {
    if(function() {
      var and__3941__auto____9702 = this$;
      if(and__3941__auto____9702) {
        return this$.cljs$core$IFn$_invoke$arity$5
      }else {
        return and__3941__auto____9702
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$5(this$, a, b, c, d)
    }else {
      var x__2304__auto____9703 = this$ == null ? null : this$;
      return function() {
        var or__3943__auto____9704 = cljs.core._invoke[goog.typeOf(x__2304__auto____9703)];
        if(or__3943__auto____9704) {
          return or__3943__auto____9704
        }else {
          var or__3943__auto____9705 = cljs.core._invoke["_"];
          if(or__3943__auto____9705) {
            return or__3943__auto____9705
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d)
    }
  };
  var _invoke__6 = function(this$, a, b, c, d, e) {
    if(function() {
      var and__3941__auto____9706 = this$;
      if(and__3941__auto____9706) {
        return this$.cljs$core$IFn$_invoke$arity$6
      }else {
        return and__3941__auto____9706
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$6(this$, a, b, c, d, e)
    }else {
      var x__2304__auto____9707 = this$ == null ? null : this$;
      return function() {
        var or__3943__auto____9708 = cljs.core._invoke[goog.typeOf(x__2304__auto____9707)];
        if(or__3943__auto____9708) {
          return or__3943__auto____9708
        }else {
          var or__3943__auto____9709 = cljs.core._invoke["_"];
          if(or__3943__auto____9709) {
            return or__3943__auto____9709
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e)
    }
  };
  var _invoke__7 = function(this$, a, b, c, d, e, f) {
    if(function() {
      var and__3941__auto____9710 = this$;
      if(and__3941__auto____9710) {
        return this$.cljs$core$IFn$_invoke$arity$7
      }else {
        return and__3941__auto____9710
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$7(this$, a, b, c, d, e, f)
    }else {
      var x__2304__auto____9711 = this$ == null ? null : this$;
      return function() {
        var or__3943__auto____9712 = cljs.core._invoke[goog.typeOf(x__2304__auto____9711)];
        if(or__3943__auto____9712) {
          return or__3943__auto____9712
        }else {
          var or__3943__auto____9713 = cljs.core._invoke["_"];
          if(or__3943__auto____9713) {
            return or__3943__auto____9713
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f)
    }
  };
  var _invoke__8 = function(this$, a, b, c, d, e, f, g) {
    if(function() {
      var and__3941__auto____9714 = this$;
      if(and__3941__auto____9714) {
        return this$.cljs$core$IFn$_invoke$arity$8
      }else {
        return and__3941__auto____9714
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$8(this$, a, b, c, d, e, f, g)
    }else {
      var x__2304__auto____9715 = this$ == null ? null : this$;
      return function() {
        var or__3943__auto____9716 = cljs.core._invoke[goog.typeOf(x__2304__auto____9715)];
        if(or__3943__auto____9716) {
          return or__3943__auto____9716
        }else {
          var or__3943__auto____9717 = cljs.core._invoke["_"];
          if(or__3943__auto____9717) {
            return or__3943__auto____9717
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g)
    }
  };
  var _invoke__9 = function(this$, a, b, c, d, e, f, g, h) {
    if(function() {
      var and__3941__auto____9718 = this$;
      if(and__3941__auto____9718) {
        return this$.cljs$core$IFn$_invoke$arity$9
      }else {
        return and__3941__auto____9718
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$9(this$, a, b, c, d, e, f, g, h)
    }else {
      var x__2304__auto____9719 = this$ == null ? null : this$;
      return function() {
        var or__3943__auto____9720 = cljs.core._invoke[goog.typeOf(x__2304__auto____9719)];
        if(or__3943__auto____9720) {
          return or__3943__auto____9720
        }else {
          var or__3943__auto____9721 = cljs.core._invoke["_"];
          if(or__3943__auto____9721) {
            return or__3943__auto____9721
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h)
    }
  };
  var _invoke__10 = function(this$, a, b, c, d, e, f, g, h, i) {
    if(function() {
      var and__3941__auto____9722 = this$;
      if(and__3941__auto____9722) {
        return this$.cljs$core$IFn$_invoke$arity$10
      }else {
        return and__3941__auto____9722
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$10(this$, a, b, c, d, e, f, g, h, i)
    }else {
      var x__2304__auto____9723 = this$ == null ? null : this$;
      return function() {
        var or__3943__auto____9724 = cljs.core._invoke[goog.typeOf(x__2304__auto____9723)];
        if(or__3943__auto____9724) {
          return or__3943__auto____9724
        }else {
          var or__3943__auto____9725 = cljs.core._invoke["_"];
          if(or__3943__auto____9725) {
            return or__3943__auto____9725
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i)
    }
  };
  var _invoke__11 = function(this$, a, b, c, d, e, f, g, h, i, j) {
    if(function() {
      var and__3941__auto____9726 = this$;
      if(and__3941__auto____9726) {
        return this$.cljs$core$IFn$_invoke$arity$11
      }else {
        return and__3941__auto____9726
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$11(this$, a, b, c, d, e, f, g, h, i, j)
    }else {
      var x__2304__auto____9727 = this$ == null ? null : this$;
      return function() {
        var or__3943__auto____9728 = cljs.core._invoke[goog.typeOf(x__2304__auto____9727)];
        if(or__3943__auto____9728) {
          return or__3943__auto____9728
        }else {
          var or__3943__auto____9729 = cljs.core._invoke["_"];
          if(or__3943__auto____9729) {
            return or__3943__auto____9729
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j)
    }
  };
  var _invoke__12 = function(this$, a, b, c, d, e, f, g, h, i, j, k) {
    if(function() {
      var and__3941__auto____9730 = this$;
      if(and__3941__auto____9730) {
        return this$.cljs$core$IFn$_invoke$arity$12
      }else {
        return and__3941__auto____9730
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$12(this$, a, b, c, d, e, f, g, h, i, j, k)
    }else {
      var x__2304__auto____9731 = this$ == null ? null : this$;
      return function() {
        var or__3943__auto____9732 = cljs.core._invoke[goog.typeOf(x__2304__auto____9731)];
        if(or__3943__auto____9732) {
          return or__3943__auto____9732
        }else {
          var or__3943__auto____9733 = cljs.core._invoke["_"];
          if(or__3943__auto____9733) {
            return or__3943__auto____9733
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k)
    }
  };
  var _invoke__13 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l) {
    if(function() {
      var and__3941__auto____9734 = this$;
      if(and__3941__auto____9734) {
        return this$.cljs$core$IFn$_invoke$arity$13
      }else {
        return and__3941__auto____9734
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$13(this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }else {
      var x__2304__auto____9735 = this$ == null ? null : this$;
      return function() {
        var or__3943__auto____9736 = cljs.core._invoke[goog.typeOf(x__2304__auto____9735)];
        if(or__3943__auto____9736) {
          return or__3943__auto____9736
        }else {
          var or__3943__auto____9737 = cljs.core._invoke["_"];
          if(or__3943__auto____9737) {
            return or__3943__auto____9737
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }
  };
  var _invoke__14 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m) {
    if(function() {
      var and__3941__auto____9738 = this$;
      if(and__3941__auto____9738) {
        return this$.cljs$core$IFn$_invoke$arity$14
      }else {
        return and__3941__auto____9738
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$14(this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }else {
      var x__2304__auto____9739 = this$ == null ? null : this$;
      return function() {
        var or__3943__auto____9740 = cljs.core._invoke[goog.typeOf(x__2304__auto____9739)];
        if(or__3943__auto____9740) {
          return or__3943__auto____9740
        }else {
          var or__3943__auto____9741 = cljs.core._invoke["_"];
          if(or__3943__auto____9741) {
            return or__3943__auto____9741
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }
  };
  var _invoke__15 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n) {
    if(function() {
      var and__3941__auto____9742 = this$;
      if(and__3941__auto____9742) {
        return this$.cljs$core$IFn$_invoke$arity$15
      }else {
        return and__3941__auto____9742
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$15(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }else {
      var x__2304__auto____9743 = this$ == null ? null : this$;
      return function() {
        var or__3943__auto____9744 = cljs.core._invoke[goog.typeOf(x__2304__auto____9743)];
        if(or__3943__auto____9744) {
          return or__3943__auto____9744
        }else {
          var or__3943__auto____9745 = cljs.core._invoke["_"];
          if(or__3943__auto____9745) {
            return or__3943__auto____9745
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }
  };
  var _invoke__16 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o) {
    if(function() {
      var and__3941__auto____9746 = this$;
      if(and__3941__auto____9746) {
        return this$.cljs$core$IFn$_invoke$arity$16
      }else {
        return and__3941__auto____9746
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$16(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }else {
      var x__2304__auto____9747 = this$ == null ? null : this$;
      return function() {
        var or__3943__auto____9748 = cljs.core._invoke[goog.typeOf(x__2304__auto____9747)];
        if(or__3943__auto____9748) {
          return or__3943__auto____9748
        }else {
          var or__3943__auto____9749 = cljs.core._invoke["_"];
          if(or__3943__auto____9749) {
            return or__3943__auto____9749
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }
  };
  var _invoke__17 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p) {
    if(function() {
      var and__3941__auto____9750 = this$;
      if(and__3941__auto____9750) {
        return this$.cljs$core$IFn$_invoke$arity$17
      }else {
        return and__3941__auto____9750
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$17(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }else {
      var x__2304__auto____9751 = this$ == null ? null : this$;
      return function() {
        var or__3943__auto____9752 = cljs.core._invoke[goog.typeOf(x__2304__auto____9751)];
        if(or__3943__auto____9752) {
          return or__3943__auto____9752
        }else {
          var or__3943__auto____9753 = cljs.core._invoke["_"];
          if(or__3943__auto____9753) {
            return or__3943__auto____9753
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }
  };
  var _invoke__18 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q) {
    if(function() {
      var and__3941__auto____9754 = this$;
      if(and__3941__auto____9754) {
        return this$.cljs$core$IFn$_invoke$arity$18
      }else {
        return and__3941__auto____9754
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$18(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }else {
      var x__2304__auto____9755 = this$ == null ? null : this$;
      return function() {
        var or__3943__auto____9756 = cljs.core._invoke[goog.typeOf(x__2304__auto____9755)];
        if(or__3943__auto____9756) {
          return or__3943__auto____9756
        }else {
          var or__3943__auto____9757 = cljs.core._invoke["_"];
          if(or__3943__auto____9757) {
            return or__3943__auto____9757
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }
  };
  var _invoke__19 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s) {
    if(function() {
      var and__3941__auto____9758 = this$;
      if(and__3941__auto____9758) {
        return this$.cljs$core$IFn$_invoke$arity$19
      }else {
        return and__3941__auto____9758
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$19(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }else {
      var x__2304__auto____9759 = this$ == null ? null : this$;
      return function() {
        var or__3943__auto____9760 = cljs.core._invoke[goog.typeOf(x__2304__auto____9759)];
        if(or__3943__auto____9760) {
          return or__3943__auto____9760
        }else {
          var or__3943__auto____9761 = cljs.core._invoke["_"];
          if(or__3943__auto____9761) {
            return or__3943__auto____9761
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }
  };
  var _invoke__20 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t) {
    if(function() {
      var and__3941__auto____9762 = this$;
      if(and__3941__auto____9762) {
        return this$.cljs$core$IFn$_invoke$arity$20
      }else {
        return and__3941__auto____9762
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$20(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }else {
      var x__2304__auto____9763 = this$ == null ? null : this$;
      return function() {
        var or__3943__auto____9764 = cljs.core._invoke[goog.typeOf(x__2304__auto____9763)];
        if(or__3943__auto____9764) {
          return or__3943__auto____9764
        }else {
          var or__3943__auto____9765 = cljs.core._invoke["_"];
          if(or__3943__auto____9765) {
            return or__3943__auto____9765
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }
  };
  var _invoke__21 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    if(function() {
      var and__3941__auto____9766 = this$;
      if(and__3941__auto____9766) {
        return this$.cljs$core$IFn$_invoke$arity$21
      }else {
        return and__3941__auto____9766
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$21(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }else {
      var x__2304__auto____9767 = this$ == null ? null : this$;
      return function() {
        var or__3943__auto____9768 = cljs.core._invoke[goog.typeOf(x__2304__auto____9767)];
        if(or__3943__auto____9768) {
          return or__3943__auto____9768
        }else {
          var or__3943__auto____9769 = cljs.core._invoke["_"];
          if(or__3943__auto____9769) {
            return or__3943__auto____9769
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
    var and__3941__auto____9774 = coll;
    if(and__3941__auto____9774) {
      return coll.cljs$core$ICounted$_count$arity$1
    }else {
      return and__3941__auto____9774
    }
  }()) {
    return coll.cljs$core$ICounted$_count$arity$1(coll)
  }else {
    var x__2304__auto____9775 = coll == null ? null : coll;
    return function() {
      var or__3943__auto____9776 = cljs.core._count[goog.typeOf(x__2304__auto____9775)];
      if(or__3943__auto____9776) {
        return or__3943__auto____9776
      }else {
        var or__3943__auto____9777 = cljs.core._count["_"];
        if(or__3943__auto____9777) {
          return or__3943__auto____9777
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
    var and__3941__auto____9782 = coll;
    if(and__3941__auto____9782) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1
    }else {
      return and__3941__auto____9782
    }
  }()) {
    return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
  }else {
    var x__2304__auto____9783 = coll == null ? null : coll;
    return function() {
      var or__3943__auto____9784 = cljs.core._empty[goog.typeOf(x__2304__auto____9783)];
      if(or__3943__auto____9784) {
        return or__3943__auto____9784
      }else {
        var or__3943__auto____9785 = cljs.core._empty["_"];
        if(or__3943__auto____9785) {
          return or__3943__auto____9785
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
    var and__3941__auto____9790 = coll;
    if(and__3941__auto____9790) {
      return coll.cljs$core$ICollection$_conj$arity$2
    }else {
      return and__3941__auto____9790
    }
  }()) {
    return coll.cljs$core$ICollection$_conj$arity$2(coll, o)
  }else {
    var x__2304__auto____9791 = coll == null ? null : coll;
    return function() {
      var or__3943__auto____9792 = cljs.core._conj[goog.typeOf(x__2304__auto____9791)];
      if(or__3943__auto____9792) {
        return or__3943__auto____9792
      }else {
        var or__3943__auto____9793 = cljs.core._conj["_"];
        if(or__3943__auto____9793) {
          return or__3943__auto____9793
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
      var and__3941__auto____9802 = coll;
      if(and__3941__auto____9802) {
        return coll.cljs$core$IIndexed$_nth$arity$2
      }else {
        return and__3941__auto____9802
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
    }else {
      var x__2304__auto____9803 = coll == null ? null : coll;
      return function() {
        var or__3943__auto____9804 = cljs.core._nth[goog.typeOf(x__2304__auto____9803)];
        if(or__3943__auto____9804) {
          return or__3943__auto____9804
        }else {
          var or__3943__auto____9805 = cljs.core._nth["_"];
          if(or__3943__auto____9805) {
            return or__3943__auto____9805
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n)
    }
  };
  var _nth__3 = function(coll, n, not_found) {
    if(function() {
      var and__3941__auto____9806 = coll;
      if(and__3941__auto____9806) {
        return coll.cljs$core$IIndexed$_nth$arity$3
      }else {
        return and__3941__auto____9806
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$3(coll, n, not_found)
    }else {
      var x__2304__auto____9807 = coll == null ? null : coll;
      return function() {
        var or__3943__auto____9808 = cljs.core._nth[goog.typeOf(x__2304__auto____9807)];
        if(or__3943__auto____9808) {
          return or__3943__auto____9808
        }else {
          var or__3943__auto____9809 = cljs.core._nth["_"];
          if(or__3943__auto____9809) {
            return or__3943__auto____9809
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
    var and__3941__auto____9814 = coll;
    if(and__3941__auto____9814) {
      return coll.cljs$core$ISeq$_first$arity$1
    }else {
      return and__3941__auto____9814
    }
  }()) {
    return coll.cljs$core$ISeq$_first$arity$1(coll)
  }else {
    var x__2304__auto____9815 = coll == null ? null : coll;
    return function() {
      var or__3943__auto____9816 = cljs.core._first[goog.typeOf(x__2304__auto____9815)];
      if(or__3943__auto____9816) {
        return or__3943__auto____9816
      }else {
        var or__3943__auto____9817 = cljs.core._first["_"];
        if(or__3943__auto____9817) {
          return or__3943__auto____9817
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._rest = function _rest(coll) {
  if(function() {
    var and__3941__auto____9822 = coll;
    if(and__3941__auto____9822) {
      return coll.cljs$core$ISeq$_rest$arity$1
    }else {
      return and__3941__auto____9822
    }
  }()) {
    return coll.cljs$core$ISeq$_rest$arity$1(coll)
  }else {
    var x__2304__auto____9823 = coll == null ? null : coll;
    return function() {
      var or__3943__auto____9824 = cljs.core._rest[goog.typeOf(x__2304__auto____9823)];
      if(or__3943__auto____9824) {
        return or__3943__auto____9824
      }else {
        var or__3943__auto____9825 = cljs.core._rest["_"];
        if(or__3943__auto____9825) {
          return or__3943__auto____9825
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
    var and__3941__auto____9830 = coll;
    if(and__3941__auto____9830) {
      return coll.cljs$core$INext$_next$arity$1
    }else {
      return and__3941__auto____9830
    }
  }()) {
    return coll.cljs$core$INext$_next$arity$1(coll)
  }else {
    var x__2304__auto____9831 = coll == null ? null : coll;
    return function() {
      var or__3943__auto____9832 = cljs.core._next[goog.typeOf(x__2304__auto____9831)];
      if(or__3943__auto____9832) {
        return or__3943__auto____9832
      }else {
        var or__3943__auto____9833 = cljs.core._next["_"];
        if(or__3943__auto____9833) {
          return or__3943__auto____9833
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
      var and__3941__auto____9842 = o;
      if(and__3941__auto____9842) {
        return o.cljs$core$ILookup$_lookup$arity$2
      }else {
        return and__3941__auto____9842
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$2(o, k)
    }else {
      var x__2304__auto____9843 = o == null ? null : o;
      return function() {
        var or__3943__auto____9844 = cljs.core._lookup[goog.typeOf(x__2304__auto____9843)];
        if(or__3943__auto____9844) {
          return or__3943__auto____9844
        }else {
          var or__3943__auto____9845 = cljs.core._lookup["_"];
          if(or__3943__auto____9845) {
            return or__3943__auto____9845
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k)
    }
  };
  var _lookup__3 = function(o, k, not_found) {
    if(function() {
      var and__3941__auto____9846 = o;
      if(and__3941__auto____9846) {
        return o.cljs$core$ILookup$_lookup$arity$3
      }else {
        return and__3941__auto____9846
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$3(o, k, not_found)
    }else {
      var x__2304__auto____9847 = o == null ? null : o;
      return function() {
        var or__3943__auto____9848 = cljs.core._lookup[goog.typeOf(x__2304__auto____9847)];
        if(or__3943__auto____9848) {
          return or__3943__auto____9848
        }else {
          var or__3943__auto____9849 = cljs.core._lookup["_"];
          if(or__3943__auto____9849) {
            return or__3943__auto____9849
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
    var and__3941__auto____9854 = coll;
    if(and__3941__auto____9854) {
      return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2
    }else {
      return and__3941__auto____9854
    }
  }()) {
    return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2(coll, k)
  }else {
    var x__2304__auto____9855 = coll == null ? null : coll;
    return function() {
      var or__3943__auto____9856 = cljs.core._contains_key_QMARK_[goog.typeOf(x__2304__auto____9855)];
      if(or__3943__auto____9856) {
        return or__3943__auto____9856
      }else {
        var or__3943__auto____9857 = cljs.core._contains_key_QMARK_["_"];
        if(or__3943__auto____9857) {
          return or__3943__auto____9857
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-contains-key?", coll);
        }
      }
    }().call(null, coll, k)
  }
};
cljs.core._assoc = function _assoc(coll, k, v) {
  if(function() {
    var and__3941__auto____9862 = coll;
    if(and__3941__auto____9862) {
      return coll.cljs$core$IAssociative$_assoc$arity$3
    }else {
      return and__3941__auto____9862
    }
  }()) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, k, v)
  }else {
    var x__2304__auto____9863 = coll == null ? null : coll;
    return function() {
      var or__3943__auto____9864 = cljs.core._assoc[goog.typeOf(x__2304__auto____9863)];
      if(or__3943__auto____9864) {
        return or__3943__auto____9864
      }else {
        var or__3943__auto____9865 = cljs.core._assoc["_"];
        if(or__3943__auto____9865) {
          return or__3943__auto____9865
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
    var and__3941__auto____9870 = coll;
    if(and__3941__auto____9870) {
      return coll.cljs$core$IMap$_dissoc$arity$2
    }else {
      return and__3941__auto____9870
    }
  }()) {
    return coll.cljs$core$IMap$_dissoc$arity$2(coll, k)
  }else {
    var x__2304__auto____9871 = coll == null ? null : coll;
    return function() {
      var or__3943__auto____9872 = cljs.core._dissoc[goog.typeOf(x__2304__auto____9871)];
      if(or__3943__auto____9872) {
        return or__3943__auto____9872
      }else {
        var or__3943__auto____9873 = cljs.core._dissoc["_"];
        if(or__3943__auto____9873) {
          return or__3943__auto____9873
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
    var and__3941__auto____9878 = coll;
    if(and__3941__auto____9878) {
      return coll.cljs$core$IMapEntry$_key$arity$1
    }else {
      return and__3941__auto____9878
    }
  }()) {
    return coll.cljs$core$IMapEntry$_key$arity$1(coll)
  }else {
    var x__2304__auto____9879 = coll == null ? null : coll;
    return function() {
      var or__3943__auto____9880 = cljs.core._key[goog.typeOf(x__2304__auto____9879)];
      if(or__3943__auto____9880) {
        return or__3943__auto____9880
      }else {
        var or__3943__auto____9881 = cljs.core._key["_"];
        if(or__3943__auto____9881) {
          return or__3943__auto____9881
        }else {
          throw cljs.core.missing_protocol.call(null, "IMapEntry.-key", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._val = function _val(coll) {
  if(function() {
    var and__3941__auto____9886 = coll;
    if(and__3941__auto____9886) {
      return coll.cljs$core$IMapEntry$_val$arity$1
    }else {
      return and__3941__auto____9886
    }
  }()) {
    return coll.cljs$core$IMapEntry$_val$arity$1(coll)
  }else {
    var x__2304__auto____9887 = coll == null ? null : coll;
    return function() {
      var or__3943__auto____9888 = cljs.core._val[goog.typeOf(x__2304__auto____9887)];
      if(or__3943__auto____9888) {
        return or__3943__auto____9888
      }else {
        var or__3943__auto____9889 = cljs.core._val["_"];
        if(or__3943__auto____9889) {
          return or__3943__auto____9889
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
    var and__3941__auto____9894 = coll;
    if(and__3941__auto____9894) {
      return coll.cljs$core$ISet$_disjoin$arity$2
    }else {
      return and__3941__auto____9894
    }
  }()) {
    return coll.cljs$core$ISet$_disjoin$arity$2(coll, v)
  }else {
    var x__2304__auto____9895 = coll == null ? null : coll;
    return function() {
      var or__3943__auto____9896 = cljs.core._disjoin[goog.typeOf(x__2304__auto____9895)];
      if(or__3943__auto____9896) {
        return or__3943__auto____9896
      }else {
        var or__3943__auto____9897 = cljs.core._disjoin["_"];
        if(or__3943__auto____9897) {
          return or__3943__auto____9897
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
    var and__3941__auto____9902 = coll;
    if(and__3941__auto____9902) {
      return coll.cljs$core$IStack$_peek$arity$1
    }else {
      return and__3941__auto____9902
    }
  }()) {
    return coll.cljs$core$IStack$_peek$arity$1(coll)
  }else {
    var x__2304__auto____9903 = coll == null ? null : coll;
    return function() {
      var or__3943__auto____9904 = cljs.core._peek[goog.typeOf(x__2304__auto____9903)];
      if(or__3943__auto____9904) {
        return or__3943__auto____9904
      }else {
        var or__3943__auto____9905 = cljs.core._peek["_"];
        if(or__3943__auto____9905) {
          return or__3943__auto____9905
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-peek", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._pop = function _pop(coll) {
  if(function() {
    var and__3941__auto____9910 = coll;
    if(and__3941__auto____9910) {
      return coll.cljs$core$IStack$_pop$arity$1
    }else {
      return and__3941__auto____9910
    }
  }()) {
    return coll.cljs$core$IStack$_pop$arity$1(coll)
  }else {
    var x__2304__auto____9911 = coll == null ? null : coll;
    return function() {
      var or__3943__auto____9912 = cljs.core._pop[goog.typeOf(x__2304__auto____9911)];
      if(or__3943__auto____9912) {
        return or__3943__auto____9912
      }else {
        var or__3943__auto____9913 = cljs.core._pop["_"];
        if(or__3943__auto____9913) {
          return or__3943__auto____9913
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
    var and__3941__auto____9918 = coll;
    if(and__3941__auto____9918) {
      return coll.cljs$core$IVector$_assoc_n$arity$3
    }else {
      return and__3941__auto____9918
    }
  }()) {
    return coll.cljs$core$IVector$_assoc_n$arity$3(coll, n, val)
  }else {
    var x__2304__auto____9919 = coll == null ? null : coll;
    return function() {
      var or__3943__auto____9920 = cljs.core._assoc_n[goog.typeOf(x__2304__auto____9919)];
      if(or__3943__auto____9920) {
        return or__3943__auto____9920
      }else {
        var or__3943__auto____9921 = cljs.core._assoc_n["_"];
        if(or__3943__auto____9921) {
          return or__3943__auto____9921
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
    var and__3941__auto____9926 = o;
    if(and__3941__auto____9926) {
      return o.cljs$core$IDeref$_deref$arity$1
    }else {
      return and__3941__auto____9926
    }
  }()) {
    return o.cljs$core$IDeref$_deref$arity$1(o)
  }else {
    var x__2304__auto____9927 = o == null ? null : o;
    return function() {
      var or__3943__auto____9928 = cljs.core._deref[goog.typeOf(x__2304__auto____9927)];
      if(or__3943__auto____9928) {
        return or__3943__auto____9928
      }else {
        var or__3943__auto____9929 = cljs.core._deref["_"];
        if(or__3943__auto____9929) {
          return or__3943__auto____9929
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
    var and__3941__auto____9934 = o;
    if(and__3941__auto____9934) {
      return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3
    }else {
      return and__3941__auto____9934
    }
  }()) {
    return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3(o, msec, timeout_val)
  }else {
    var x__2304__auto____9935 = o == null ? null : o;
    return function() {
      var or__3943__auto____9936 = cljs.core._deref_with_timeout[goog.typeOf(x__2304__auto____9935)];
      if(or__3943__auto____9936) {
        return or__3943__auto____9936
      }else {
        var or__3943__auto____9937 = cljs.core._deref_with_timeout["_"];
        if(or__3943__auto____9937) {
          return or__3943__auto____9937
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
    var and__3941__auto____9942 = o;
    if(and__3941__auto____9942) {
      return o.cljs$core$IMeta$_meta$arity$1
    }else {
      return and__3941__auto____9942
    }
  }()) {
    return o.cljs$core$IMeta$_meta$arity$1(o)
  }else {
    var x__2304__auto____9943 = o == null ? null : o;
    return function() {
      var or__3943__auto____9944 = cljs.core._meta[goog.typeOf(x__2304__auto____9943)];
      if(or__3943__auto____9944) {
        return or__3943__auto____9944
      }else {
        var or__3943__auto____9945 = cljs.core._meta["_"];
        if(or__3943__auto____9945) {
          return or__3943__auto____9945
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
    var and__3941__auto____9950 = o;
    if(and__3941__auto____9950) {
      return o.cljs$core$IWithMeta$_with_meta$arity$2
    }else {
      return and__3941__auto____9950
    }
  }()) {
    return o.cljs$core$IWithMeta$_with_meta$arity$2(o, meta)
  }else {
    var x__2304__auto____9951 = o == null ? null : o;
    return function() {
      var or__3943__auto____9952 = cljs.core._with_meta[goog.typeOf(x__2304__auto____9951)];
      if(or__3943__auto____9952) {
        return or__3943__auto____9952
      }else {
        var or__3943__auto____9953 = cljs.core._with_meta["_"];
        if(or__3943__auto____9953) {
          return or__3943__auto____9953
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
      var and__3941__auto____9962 = coll;
      if(and__3941__auto____9962) {
        return coll.cljs$core$IReduce$_reduce$arity$2
      }else {
        return and__3941__auto____9962
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$2(coll, f)
    }else {
      var x__2304__auto____9963 = coll == null ? null : coll;
      return function() {
        var or__3943__auto____9964 = cljs.core._reduce[goog.typeOf(x__2304__auto____9963)];
        if(or__3943__auto____9964) {
          return or__3943__auto____9964
        }else {
          var or__3943__auto____9965 = cljs.core._reduce["_"];
          if(or__3943__auto____9965) {
            return or__3943__auto____9965
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f)
    }
  };
  var _reduce__3 = function(coll, f, start) {
    if(function() {
      var and__3941__auto____9966 = coll;
      if(and__3941__auto____9966) {
        return coll.cljs$core$IReduce$_reduce$arity$3
      }else {
        return and__3941__auto____9966
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$3(coll, f, start)
    }else {
      var x__2304__auto____9967 = coll == null ? null : coll;
      return function() {
        var or__3943__auto____9968 = cljs.core._reduce[goog.typeOf(x__2304__auto____9967)];
        if(or__3943__auto____9968) {
          return or__3943__auto____9968
        }else {
          var or__3943__auto____9969 = cljs.core._reduce["_"];
          if(or__3943__auto____9969) {
            return or__3943__auto____9969
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
    var and__3941__auto____9974 = coll;
    if(and__3941__auto____9974) {
      return coll.cljs$core$IKVReduce$_kv_reduce$arity$3
    }else {
      return and__3941__auto____9974
    }
  }()) {
    return coll.cljs$core$IKVReduce$_kv_reduce$arity$3(coll, f, init)
  }else {
    var x__2304__auto____9975 = coll == null ? null : coll;
    return function() {
      var or__3943__auto____9976 = cljs.core._kv_reduce[goog.typeOf(x__2304__auto____9975)];
      if(or__3943__auto____9976) {
        return or__3943__auto____9976
      }else {
        var or__3943__auto____9977 = cljs.core._kv_reduce["_"];
        if(or__3943__auto____9977) {
          return or__3943__auto____9977
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
    var and__3941__auto____9982 = o;
    if(and__3941__auto____9982) {
      return o.cljs$core$IEquiv$_equiv$arity$2
    }else {
      return and__3941__auto____9982
    }
  }()) {
    return o.cljs$core$IEquiv$_equiv$arity$2(o, other)
  }else {
    var x__2304__auto____9983 = o == null ? null : o;
    return function() {
      var or__3943__auto____9984 = cljs.core._equiv[goog.typeOf(x__2304__auto____9983)];
      if(or__3943__auto____9984) {
        return or__3943__auto____9984
      }else {
        var or__3943__auto____9985 = cljs.core._equiv["_"];
        if(or__3943__auto____9985) {
          return or__3943__auto____9985
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
    var and__3941__auto____9990 = o;
    if(and__3941__auto____9990) {
      return o.cljs$core$IHash$_hash$arity$1
    }else {
      return and__3941__auto____9990
    }
  }()) {
    return o.cljs$core$IHash$_hash$arity$1(o)
  }else {
    var x__2304__auto____9991 = o == null ? null : o;
    return function() {
      var or__3943__auto____9992 = cljs.core._hash[goog.typeOf(x__2304__auto____9991)];
      if(or__3943__auto____9992) {
        return or__3943__auto____9992
      }else {
        var or__3943__auto____9993 = cljs.core._hash["_"];
        if(or__3943__auto____9993) {
          return or__3943__auto____9993
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
    var and__3941__auto____9998 = o;
    if(and__3941__auto____9998) {
      return o.cljs$core$ISeqable$_seq$arity$1
    }else {
      return and__3941__auto____9998
    }
  }()) {
    return o.cljs$core$ISeqable$_seq$arity$1(o)
  }else {
    var x__2304__auto____9999 = o == null ? null : o;
    return function() {
      var or__3943__auto____10000 = cljs.core._seq[goog.typeOf(x__2304__auto____9999)];
      if(or__3943__auto____10000) {
        return or__3943__auto____10000
      }else {
        var or__3943__auto____10001 = cljs.core._seq["_"];
        if(or__3943__auto____10001) {
          return or__3943__auto____10001
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
    var and__3941__auto____10006 = coll;
    if(and__3941__auto____10006) {
      return coll.cljs$core$IReversible$_rseq$arity$1
    }else {
      return and__3941__auto____10006
    }
  }()) {
    return coll.cljs$core$IReversible$_rseq$arity$1(coll)
  }else {
    var x__2304__auto____10007 = coll == null ? null : coll;
    return function() {
      var or__3943__auto____10008 = cljs.core._rseq[goog.typeOf(x__2304__auto____10007)];
      if(or__3943__auto____10008) {
        return or__3943__auto____10008
      }else {
        var or__3943__auto____10009 = cljs.core._rseq["_"];
        if(or__3943__auto____10009) {
          return or__3943__auto____10009
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
    var and__3941__auto____10014 = coll;
    if(and__3941__auto____10014) {
      return coll.cljs$core$ISorted$_sorted_seq$arity$2
    }else {
      return and__3941__auto____10014
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq$arity$2(coll, ascending_QMARK_)
  }else {
    var x__2304__auto____10015 = coll == null ? null : coll;
    return function() {
      var or__3943__auto____10016 = cljs.core._sorted_seq[goog.typeOf(x__2304__auto____10015)];
      if(or__3943__auto____10016) {
        return or__3943__auto____10016
      }else {
        var or__3943__auto____10017 = cljs.core._sorted_seq["_"];
        if(or__3943__auto____10017) {
          return or__3943__auto____10017
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq", coll);
        }
      }
    }().call(null, coll, ascending_QMARK_)
  }
};
cljs.core._sorted_seq_from = function _sorted_seq_from(coll, k, ascending_QMARK_) {
  if(function() {
    var and__3941__auto____10022 = coll;
    if(and__3941__auto____10022) {
      return coll.cljs$core$ISorted$_sorted_seq_from$arity$3
    }else {
      return and__3941__auto____10022
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq_from$arity$3(coll, k, ascending_QMARK_)
  }else {
    var x__2304__auto____10023 = coll == null ? null : coll;
    return function() {
      var or__3943__auto____10024 = cljs.core._sorted_seq_from[goog.typeOf(x__2304__auto____10023)];
      if(or__3943__auto____10024) {
        return or__3943__auto____10024
      }else {
        var or__3943__auto____10025 = cljs.core._sorted_seq_from["_"];
        if(or__3943__auto____10025) {
          return or__3943__auto____10025
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq-from", coll);
        }
      }
    }().call(null, coll, k, ascending_QMARK_)
  }
};
cljs.core._entry_key = function _entry_key(coll, entry) {
  if(function() {
    var and__3941__auto____10030 = coll;
    if(and__3941__auto____10030) {
      return coll.cljs$core$ISorted$_entry_key$arity$2
    }else {
      return and__3941__auto____10030
    }
  }()) {
    return coll.cljs$core$ISorted$_entry_key$arity$2(coll, entry)
  }else {
    var x__2304__auto____10031 = coll == null ? null : coll;
    return function() {
      var or__3943__auto____10032 = cljs.core._entry_key[goog.typeOf(x__2304__auto____10031)];
      if(or__3943__auto____10032) {
        return or__3943__auto____10032
      }else {
        var or__3943__auto____10033 = cljs.core._entry_key["_"];
        if(or__3943__auto____10033) {
          return or__3943__auto____10033
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-entry-key", coll);
        }
      }
    }().call(null, coll, entry)
  }
};
cljs.core._comparator = function _comparator(coll) {
  if(function() {
    var and__3941__auto____10038 = coll;
    if(and__3941__auto____10038) {
      return coll.cljs$core$ISorted$_comparator$arity$1
    }else {
      return and__3941__auto____10038
    }
  }()) {
    return coll.cljs$core$ISorted$_comparator$arity$1(coll)
  }else {
    var x__2304__auto____10039 = coll == null ? null : coll;
    return function() {
      var or__3943__auto____10040 = cljs.core._comparator[goog.typeOf(x__2304__auto____10039)];
      if(or__3943__auto____10040) {
        return or__3943__auto____10040
      }else {
        var or__3943__auto____10041 = cljs.core._comparator["_"];
        if(or__3943__auto____10041) {
          return or__3943__auto____10041
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
    var and__3941__auto____10046 = o;
    if(and__3941__auto____10046) {
      return o.cljs$core$IPrintable$_pr_seq$arity$2
    }else {
      return and__3941__auto____10046
    }
  }()) {
    return o.cljs$core$IPrintable$_pr_seq$arity$2(o, opts)
  }else {
    var x__2304__auto____10047 = o == null ? null : o;
    return function() {
      var or__3943__auto____10048 = cljs.core._pr_seq[goog.typeOf(x__2304__auto____10047)];
      if(or__3943__auto____10048) {
        return or__3943__auto____10048
      }else {
        var or__3943__auto____10049 = cljs.core._pr_seq["_"];
        if(or__3943__auto____10049) {
          return or__3943__auto____10049
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
    var and__3941__auto____10054 = d;
    if(and__3941__auto____10054) {
      return d.cljs$core$IPending$_realized_QMARK_$arity$1
    }else {
      return and__3941__auto____10054
    }
  }()) {
    return d.cljs$core$IPending$_realized_QMARK_$arity$1(d)
  }else {
    var x__2304__auto____10055 = d == null ? null : d;
    return function() {
      var or__3943__auto____10056 = cljs.core._realized_QMARK_[goog.typeOf(x__2304__auto____10055)];
      if(or__3943__auto____10056) {
        return or__3943__auto____10056
      }else {
        var or__3943__auto____10057 = cljs.core._realized_QMARK_["_"];
        if(or__3943__auto____10057) {
          return or__3943__auto____10057
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
    var and__3941__auto____10062 = this$;
    if(and__3941__auto____10062) {
      return this$.cljs$core$IWatchable$_notify_watches$arity$3
    }else {
      return and__3941__auto____10062
    }
  }()) {
    return this$.cljs$core$IWatchable$_notify_watches$arity$3(this$, oldval, newval)
  }else {
    var x__2304__auto____10063 = this$ == null ? null : this$;
    return function() {
      var or__3943__auto____10064 = cljs.core._notify_watches[goog.typeOf(x__2304__auto____10063)];
      if(or__3943__auto____10064) {
        return or__3943__auto____10064
      }else {
        var or__3943__auto____10065 = cljs.core._notify_watches["_"];
        if(or__3943__auto____10065) {
          return or__3943__auto____10065
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-notify-watches", this$);
        }
      }
    }().call(null, this$, oldval, newval)
  }
};
cljs.core._add_watch = function _add_watch(this$, key, f) {
  if(function() {
    var and__3941__auto____10070 = this$;
    if(and__3941__auto____10070) {
      return this$.cljs$core$IWatchable$_add_watch$arity$3
    }else {
      return and__3941__auto____10070
    }
  }()) {
    return this$.cljs$core$IWatchable$_add_watch$arity$3(this$, key, f)
  }else {
    var x__2304__auto____10071 = this$ == null ? null : this$;
    return function() {
      var or__3943__auto____10072 = cljs.core._add_watch[goog.typeOf(x__2304__auto____10071)];
      if(or__3943__auto____10072) {
        return or__3943__auto____10072
      }else {
        var or__3943__auto____10073 = cljs.core._add_watch["_"];
        if(or__3943__auto____10073) {
          return or__3943__auto____10073
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-add-watch", this$);
        }
      }
    }().call(null, this$, key, f)
  }
};
cljs.core._remove_watch = function _remove_watch(this$, key) {
  if(function() {
    var and__3941__auto____10078 = this$;
    if(and__3941__auto____10078) {
      return this$.cljs$core$IWatchable$_remove_watch$arity$2
    }else {
      return and__3941__auto____10078
    }
  }()) {
    return this$.cljs$core$IWatchable$_remove_watch$arity$2(this$, key)
  }else {
    var x__2304__auto____10079 = this$ == null ? null : this$;
    return function() {
      var or__3943__auto____10080 = cljs.core._remove_watch[goog.typeOf(x__2304__auto____10079)];
      if(or__3943__auto____10080) {
        return or__3943__auto____10080
      }else {
        var or__3943__auto____10081 = cljs.core._remove_watch["_"];
        if(or__3943__auto____10081) {
          return or__3943__auto____10081
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
    var and__3941__auto____10086 = coll;
    if(and__3941__auto____10086) {
      return coll.cljs$core$IEditableCollection$_as_transient$arity$1
    }else {
      return and__3941__auto____10086
    }
  }()) {
    return coll.cljs$core$IEditableCollection$_as_transient$arity$1(coll)
  }else {
    var x__2304__auto____10087 = coll == null ? null : coll;
    return function() {
      var or__3943__auto____10088 = cljs.core._as_transient[goog.typeOf(x__2304__auto____10087)];
      if(or__3943__auto____10088) {
        return or__3943__auto____10088
      }else {
        var or__3943__auto____10089 = cljs.core._as_transient["_"];
        if(or__3943__auto____10089) {
          return or__3943__auto____10089
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
    var and__3941__auto____10094 = tcoll;
    if(and__3941__auto____10094) {
      return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2
    }else {
      return and__3941__auto____10094
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2(tcoll, val)
  }else {
    var x__2304__auto____10095 = tcoll == null ? null : tcoll;
    return function() {
      var or__3943__auto____10096 = cljs.core._conj_BANG_[goog.typeOf(x__2304__auto____10095)];
      if(or__3943__auto____10096) {
        return or__3943__auto____10096
      }else {
        var or__3943__auto____10097 = cljs.core._conj_BANG_["_"];
        if(or__3943__auto____10097) {
          return or__3943__auto____10097
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientCollection.-conj!", tcoll);
        }
      }
    }().call(null, tcoll, val)
  }
};
cljs.core._persistent_BANG_ = function _persistent_BANG_(tcoll) {
  if(function() {
    var and__3941__auto____10102 = tcoll;
    if(and__3941__auto____10102) {
      return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1
    }else {
      return and__3941__auto____10102
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1(tcoll)
  }else {
    var x__2304__auto____10103 = tcoll == null ? null : tcoll;
    return function() {
      var or__3943__auto____10104 = cljs.core._persistent_BANG_[goog.typeOf(x__2304__auto____10103)];
      if(or__3943__auto____10104) {
        return or__3943__auto____10104
      }else {
        var or__3943__auto____10105 = cljs.core._persistent_BANG_["_"];
        if(or__3943__auto____10105) {
          return or__3943__auto____10105
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
    var and__3941__auto____10110 = tcoll;
    if(and__3941__auto____10110) {
      return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3
    }else {
      return and__3941__auto____10110
    }
  }()) {
    return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll, key, val)
  }else {
    var x__2304__auto____10111 = tcoll == null ? null : tcoll;
    return function() {
      var or__3943__auto____10112 = cljs.core._assoc_BANG_[goog.typeOf(x__2304__auto____10111)];
      if(or__3943__auto____10112) {
        return or__3943__auto____10112
      }else {
        var or__3943__auto____10113 = cljs.core._assoc_BANG_["_"];
        if(or__3943__auto____10113) {
          return or__3943__auto____10113
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
    var and__3941__auto____10118 = tcoll;
    if(and__3941__auto____10118) {
      return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2
    }else {
      return and__3941__auto____10118
    }
  }()) {
    return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2(tcoll, key)
  }else {
    var x__2304__auto____10119 = tcoll == null ? null : tcoll;
    return function() {
      var or__3943__auto____10120 = cljs.core._dissoc_BANG_[goog.typeOf(x__2304__auto____10119)];
      if(or__3943__auto____10120) {
        return or__3943__auto____10120
      }else {
        var or__3943__auto____10121 = cljs.core._dissoc_BANG_["_"];
        if(or__3943__auto____10121) {
          return or__3943__auto____10121
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
    var and__3941__auto____10126 = tcoll;
    if(and__3941__auto____10126) {
      return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3
    }else {
      return and__3941__auto____10126
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3(tcoll, n, val)
  }else {
    var x__2304__auto____10127 = tcoll == null ? null : tcoll;
    return function() {
      var or__3943__auto____10128 = cljs.core._assoc_n_BANG_[goog.typeOf(x__2304__auto____10127)];
      if(or__3943__auto____10128) {
        return or__3943__auto____10128
      }else {
        var or__3943__auto____10129 = cljs.core._assoc_n_BANG_["_"];
        if(or__3943__auto____10129) {
          return or__3943__auto____10129
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientVector.-assoc-n!", tcoll);
        }
      }
    }().call(null, tcoll, n, val)
  }
};
cljs.core._pop_BANG_ = function _pop_BANG_(tcoll) {
  if(function() {
    var and__3941__auto____10134 = tcoll;
    if(and__3941__auto____10134) {
      return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1
    }else {
      return and__3941__auto____10134
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1(tcoll)
  }else {
    var x__2304__auto____10135 = tcoll == null ? null : tcoll;
    return function() {
      var or__3943__auto____10136 = cljs.core._pop_BANG_[goog.typeOf(x__2304__auto____10135)];
      if(or__3943__auto____10136) {
        return or__3943__auto____10136
      }else {
        var or__3943__auto____10137 = cljs.core._pop_BANG_["_"];
        if(or__3943__auto____10137) {
          return or__3943__auto____10137
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
    var and__3941__auto____10142 = tcoll;
    if(and__3941__auto____10142) {
      return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2
    }else {
      return and__3941__auto____10142
    }
  }()) {
    return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2(tcoll, v)
  }else {
    var x__2304__auto____10143 = tcoll == null ? null : tcoll;
    return function() {
      var or__3943__auto____10144 = cljs.core._disjoin_BANG_[goog.typeOf(x__2304__auto____10143)];
      if(or__3943__auto____10144) {
        return or__3943__auto____10144
      }else {
        var or__3943__auto____10145 = cljs.core._disjoin_BANG_["_"];
        if(or__3943__auto____10145) {
          return or__3943__auto____10145
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
    var and__3941__auto____10150 = x;
    if(and__3941__auto____10150) {
      return x.cljs$core$IComparable$_compare$arity$2
    }else {
      return and__3941__auto____10150
    }
  }()) {
    return x.cljs$core$IComparable$_compare$arity$2(x, y)
  }else {
    var x__2304__auto____10151 = x == null ? null : x;
    return function() {
      var or__3943__auto____10152 = cljs.core._compare[goog.typeOf(x__2304__auto____10151)];
      if(or__3943__auto____10152) {
        return or__3943__auto____10152
      }else {
        var or__3943__auto____10153 = cljs.core._compare["_"];
        if(or__3943__auto____10153) {
          return or__3943__auto____10153
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
    var and__3941__auto____10158 = coll;
    if(and__3941__auto____10158) {
      return coll.cljs$core$IChunk$_drop_first$arity$1
    }else {
      return and__3941__auto____10158
    }
  }()) {
    return coll.cljs$core$IChunk$_drop_first$arity$1(coll)
  }else {
    var x__2304__auto____10159 = coll == null ? null : coll;
    return function() {
      var or__3943__auto____10160 = cljs.core._drop_first[goog.typeOf(x__2304__auto____10159)];
      if(or__3943__auto____10160) {
        return or__3943__auto____10160
      }else {
        var or__3943__auto____10161 = cljs.core._drop_first["_"];
        if(or__3943__auto____10161) {
          return or__3943__auto____10161
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
    var and__3941__auto____10166 = coll;
    if(and__3941__auto____10166) {
      return coll.cljs$core$IChunkedSeq$_chunked_first$arity$1
    }else {
      return and__3941__auto____10166
    }
  }()) {
    return coll.cljs$core$IChunkedSeq$_chunked_first$arity$1(coll)
  }else {
    var x__2304__auto____10167 = coll == null ? null : coll;
    return function() {
      var or__3943__auto____10168 = cljs.core._chunked_first[goog.typeOf(x__2304__auto____10167)];
      if(or__3943__auto____10168) {
        return or__3943__auto____10168
      }else {
        var or__3943__auto____10169 = cljs.core._chunked_first["_"];
        if(or__3943__auto____10169) {
          return or__3943__auto____10169
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunkedSeq.-chunked-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._chunked_rest = function _chunked_rest(coll) {
  if(function() {
    var and__3941__auto____10174 = coll;
    if(and__3941__auto____10174) {
      return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1
    }else {
      return and__3941__auto____10174
    }
  }()) {
    return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1(coll)
  }else {
    var x__2304__auto____10175 = coll == null ? null : coll;
    return function() {
      var or__3943__auto____10176 = cljs.core._chunked_rest[goog.typeOf(x__2304__auto____10175)];
      if(or__3943__auto____10176) {
        return or__3943__auto____10176
      }else {
        var or__3943__auto____10177 = cljs.core._chunked_rest["_"];
        if(or__3943__auto____10177) {
          return or__3943__auto____10177
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
    var and__3941__auto____10182 = coll;
    if(and__3941__auto____10182) {
      return coll.cljs$core$IChunkedNext$_chunked_next$arity$1
    }else {
      return and__3941__auto____10182
    }
  }()) {
    return coll.cljs$core$IChunkedNext$_chunked_next$arity$1(coll)
  }else {
    var x__2304__auto____10183 = coll == null ? null : coll;
    return function() {
      var or__3943__auto____10184 = cljs.core._chunked_next[goog.typeOf(x__2304__auto____10183)];
      if(or__3943__auto____10184) {
        return or__3943__auto____10184
      }else {
        var or__3943__auto____10185 = cljs.core._chunked_next["_"];
        if(or__3943__auto____10185) {
          return or__3943__auto____10185
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
    var or__3943__auto____10187 = x === y;
    if(or__3943__auto____10187) {
      return or__3943__auto____10187
    }else {
      return cljs.core._equiv.call(null, x, y)
    }
  };
  var _EQ___3 = function() {
    var G__10188__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ_.call(null, x, y))) {
          if(cljs.core.next.call(null, more)) {
            var G__10189 = y;
            var G__10190 = cljs.core.first.call(null, more);
            var G__10191 = cljs.core.next.call(null, more);
            x = G__10189;
            y = G__10190;
            more = G__10191;
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
    var G__10188 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__10188__delegate.call(this, x, y, more)
    };
    G__10188.cljs$lang$maxFixedArity = 2;
    G__10188.cljs$lang$applyTo = function(arglist__10192) {
      var x = cljs.core.first(arglist__10192);
      var y = cljs.core.first(cljs.core.next(arglist__10192));
      var more = cljs.core.rest(cljs.core.next(arglist__10192));
      return G__10188__delegate(x, y, more)
    };
    G__10188.cljs$lang$arity$variadic = G__10188__delegate;
    return G__10188
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
  var G__10193 = null;
  var G__10193__2 = function(o, k) {
    return null
  };
  var G__10193__3 = function(o, k, not_found) {
    return not_found
  };
  G__10193 = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__10193__2.call(this, o, k);
      case 3:
        return G__10193__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10193
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
  var G__10194 = null;
  var G__10194__2 = function(_, f) {
    return f.call(null)
  };
  var G__10194__3 = function(_, f, start) {
    return start
  };
  G__10194 = function(_, f, start) {
    switch(arguments.length) {
      case 2:
        return G__10194__2.call(this, _, f);
      case 3:
        return G__10194__3.call(this, _, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10194
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
  var G__10195 = null;
  var G__10195__2 = function(_, n) {
    return null
  };
  var G__10195__3 = function(_, n, not_found) {
    return not_found
  };
  G__10195 = function(_, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__10195__2.call(this, _, n);
      case 3:
        return G__10195__3.call(this, _, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10195
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
  var and__3941__auto____10196 = cljs.core.instance_QMARK_.call(null, Date, other);
  if(and__3941__auto____10196) {
    return o.toString() === other.toString()
  }else {
    return and__3941__auto____10196
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
    var cnt__10209 = cljs.core._count.call(null, cicoll);
    if(cnt__10209 === 0) {
      return f.call(null)
    }else {
      var val__10210 = cljs.core._nth.call(null, cicoll, 0);
      var n__10211 = 1;
      while(true) {
        if(n__10211 < cnt__10209) {
          var nval__10212 = f.call(null, val__10210, cljs.core._nth.call(null, cicoll, n__10211));
          if(cljs.core.reduced_QMARK_.call(null, nval__10212)) {
            return cljs.core.deref.call(null, nval__10212)
          }else {
            var G__10221 = nval__10212;
            var G__10222 = n__10211 + 1;
            val__10210 = G__10221;
            n__10211 = G__10222;
            continue
          }
        }else {
          return val__10210
        }
        break
      }
    }
  };
  var ci_reduce__3 = function(cicoll, f, val) {
    var cnt__10213 = cljs.core._count.call(null, cicoll);
    var val__10214 = val;
    var n__10215 = 0;
    while(true) {
      if(n__10215 < cnt__10213) {
        var nval__10216 = f.call(null, val__10214, cljs.core._nth.call(null, cicoll, n__10215));
        if(cljs.core.reduced_QMARK_.call(null, nval__10216)) {
          return cljs.core.deref.call(null, nval__10216)
        }else {
          var G__10223 = nval__10216;
          var G__10224 = n__10215 + 1;
          val__10214 = G__10223;
          n__10215 = G__10224;
          continue
        }
      }else {
        return val__10214
      }
      break
    }
  };
  var ci_reduce__4 = function(cicoll, f, val, idx) {
    var cnt__10217 = cljs.core._count.call(null, cicoll);
    var val__10218 = val;
    var n__10219 = idx;
    while(true) {
      if(n__10219 < cnt__10217) {
        var nval__10220 = f.call(null, val__10218, cljs.core._nth.call(null, cicoll, n__10219));
        if(cljs.core.reduced_QMARK_.call(null, nval__10220)) {
          return cljs.core.deref.call(null, nval__10220)
        }else {
          var G__10225 = nval__10220;
          var G__10226 = n__10219 + 1;
          val__10218 = G__10225;
          n__10219 = G__10226;
          continue
        }
      }else {
        return val__10218
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
    var cnt__10239 = arr.length;
    if(arr.length === 0) {
      return f.call(null)
    }else {
      var val__10240 = arr[0];
      var n__10241 = 1;
      while(true) {
        if(n__10241 < cnt__10239) {
          var nval__10242 = f.call(null, val__10240, arr[n__10241]);
          if(cljs.core.reduced_QMARK_.call(null, nval__10242)) {
            return cljs.core.deref.call(null, nval__10242)
          }else {
            var G__10251 = nval__10242;
            var G__10252 = n__10241 + 1;
            val__10240 = G__10251;
            n__10241 = G__10252;
            continue
          }
        }else {
          return val__10240
        }
        break
      }
    }
  };
  var array_reduce__3 = function(arr, f, val) {
    var cnt__10243 = arr.length;
    var val__10244 = val;
    var n__10245 = 0;
    while(true) {
      if(n__10245 < cnt__10243) {
        var nval__10246 = f.call(null, val__10244, arr[n__10245]);
        if(cljs.core.reduced_QMARK_.call(null, nval__10246)) {
          return cljs.core.deref.call(null, nval__10246)
        }else {
          var G__10253 = nval__10246;
          var G__10254 = n__10245 + 1;
          val__10244 = G__10253;
          n__10245 = G__10254;
          continue
        }
      }else {
        return val__10244
      }
      break
    }
  };
  var array_reduce__4 = function(arr, f, val, idx) {
    var cnt__10247 = arr.length;
    var val__10248 = val;
    var n__10249 = idx;
    while(true) {
      if(n__10249 < cnt__10247) {
        var nval__10250 = f.call(null, val__10248, arr[n__10249]);
        if(cljs.core.reduced_QMARK_.call(null, nval__10250)) {
          return cljs.core.deref.call(null, nval__10250)
        }else {
          var G__10255 = nval__10250;
          var G__10256 = n__10249 + 1;
          val__10248 = G__10255;
          n__10249 = G__10256;
          continue
        }
      }else {
        return val__10248
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
  var this__10257 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$INext$_next$arity$1 = function(_) {
  var this__10258 = this;
  if(this__10258.i + 1 < this__10258.a.length) {
    return new cljs.core.IndexedSeq(this__10258.a, this__10258.i + 1)
  }else {
    return null
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__10259 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__10260 = this;
  var c__10261 = coll.cljs$core$ICounted$_count$arity$1(coll);
  if(c__10261 > 0) {
    return new cljs.core.RSeq(coll, c__10261 - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.IndexedSeq.prototype.toString = function() {
  var this__10262 = this;
  var this__10263 = this;
  return cljs.core.pr_str.call(null, this__10263)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__10264 = this;
  if(cljs.core.counted_QMARK_.call(null, this__10264.a)) {
    return cljs.core.ci_reduce.call(null, this__10264.a, f, this__10264.a[this__10264.i], this__10264.i + 1)
  }else {
    return cljs.core.ci_reduce.call(null, coll, f, this__10264.a[this__10264.i], 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__10265 = this;
  if(cljs.core.counted_QMARK_.call(null, this__10265.a)) {
    return cljs.core.ci_reduce.call(null, this__10265.a, f, start, this__10265.i)
  }else {
    return cljs.core.ci_reduce.call(null, coll, f, start, 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__10266 = this;
  return this$
};
cljs.core.IndexedSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__10267 = this;
  return this__10267.a.length - this__10267.i
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(_) {
  var this__10268 = this;
  return this__10268.a[this__10268.i]
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(_) {
  var this__10269 = this;
  if(this__10269.i + 1 < this__10269.a.length) {
    return new cljs.core.IndexedSeq(this__10269.a, this__10269.i + 1)
  }else {
    return cljs.core.list.call(null)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__10270 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__10271 = this;
  var i__10272 = n + this__10271.i;
  if(i__10272 < this__10271.a.length) {
    return this__10271.a[i__10272]
  }else {
    return null
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__10273 = this;
  var i__10274 = n + this__10273.i;
  if(i__10274 < this__10273.a.length) {
    return this__10273.a[i__10274]
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
  var G__10275 = null;
  var G__10275__2 = function(array, f) {
    return cljs.core.ci_reduce.call(null, array, f)
  };
  var G__10275__3 = function(array, f, start) {
    return cljs.core.ci_reduce.call(null, array, f, start)
  };
  G__10275 = function(array, f, start) {
    switch(arguments.length) {
      case 2:
        return G__10275__2.call(this, array, f);
      case 3:
        return G__10275__3.call(this, array, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10275
}();
cljs.core.ILookup["array"] = true;
cljs.core._lookup["array"] = function() {
  var G__10276 = null;
  var G__10276__2 = function(array, k) {
    return array[k]
  };
  var G__10276__3 = function(array, k, not_found) {
    return cljs.core._nth.call(null, array, k, not_found)
  };
  G__10276 = function(array, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__10276__2.call(this, array, k);
      case 3:
        return G__10276__3.call(this, array, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10276
}();
cljs.core.IIndexed["array"] = true;
cljs.core._nth["array"] = function() {
  var G__10277 = null;
  var G__10277__2 = function(array, n) {
    if(n < array.length) {
      return array[n]
    }else {
      return null
    }
  };
  var G__10277__3 = function(array, n, not_found) {
    if(n < array.length) {
      return array[n]
    }else {
      return not_found
    }
  };
  G__10277 = function(array, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__10277__2.call(this, array, n);
      case 3:
        return G__10277__3.call(this, array, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10277
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
  var this__10278 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.RSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__10279 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.RSeq.prototype.toString = function() {
  var this__10280 = this;
  var this__10281 = this;
  return cljs.core.pr_str.call(null, this__10281)
};
cljs.core.RSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__10282 = this;
  return coll
};
cljs.core.RSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__10283 = this;
  return this__10283.i + 1
};
cljs.core.RSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__10284 = this;
  return cljs.core._nth.call(null, this__10284.ci, this__10284.i)
};
cljs.core.RSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__10285 = this;
  if(this__10285.i > 0) {
    return new cljs.core.RSeq(this__10285.ci, this__10285.i - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.RSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__10286 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.RSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, new_meta) {
  var this__10287 = this;
  return new cljs.core.RSeq(this__10287.ci, this__10287.i, new_meta)
};
cljs.core.RSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__10288 = this;
  return this__10288.meta
};
cljs.core.RSeq;
cljs.core.seq = function seq(coll) {
  if(coll == null) {
    return null
  }else {
    if(function() {
      var G__10292__10293 = coll;
      if(G__10292__10293) {
        if(function() {
          var or__3943__auto____10294 = G__10292__10293.cljs$lang$protocol_mask$partition0$ & 32;
          if(or__3943__auto____10294) {
            return or__3943__auto____10294
          }else {
            return G__10292__10293.cljs$core$ASeq$
          }
        }()) {
          return true
        }else {
          if(!G__10292__10293.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__10292__10293)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__10292__10293)
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
      var G__10299__10300 = coll;
      if(G__10299__10300) {
        if(function() {
          var or__3943__auto____10301 = G__10299__10300.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3943__auto____10301) {
            return or__3943__auto____10301
          }else {
            return G__10299__10300.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__10299__10300.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__10299__10300)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__10299__10300)
      }
    }()) {
      return cljs.core._first.call(null, coll)
    }else {
      var s__10302 = cljs.core.seq.call(null, coll);
      if(s__10302 == null) {
        return null
      }else {
        return cljs.core._first.call(null, s__10302)
      }
    }
  }
};
cljs.core.rest = function rest(coll) {
  if(!(coll == null)) {
    if(function() {
      var G__10307__10308 = coll;
      if(G__10307__10308) {
        if(function() {
          var or__3943__auto____10309 = G__10307__10308.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3943__auto____10309) {
            return or__3943__auto____10309
          }else {
            return G__10307__10308.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__10307__10308.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__10307__10308)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__10307__10308)
      }
    }()) {
      return cljs.core._rest.call(null, coll)
    }else {
      var s__10310 = cljs.core.seq.call(null, coll);
      if(!(s__10310 == null)) {
        return cljs.core._rest.call(null, s__10310)
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
      var G__10314__10315 = coll;
      if(G__10314__10315) {
        if(function() {
          var or__3943__auto____10316 = G__10314__10315.cljs$lang$protocol_mask$partition0$ & 128;
          if(or__3943__auto____10316) {
            return or__3943__auto____10316
          }else {
            return G__10314__10315.cljs$core$INext$
          }
        }()) {
          return true
        }else {
          if(!G__10314__10315.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.INext, G__10314__10315)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.INext, G__10314__10315)
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
    var sn__10318 = cljs.core.next.call(null, s);
    if(!(sn__10318 == null)) {
      var G__10319 = sn__10318;
      s = G__10319;
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
    var G__10320__delegate = function(coll, x, xs) {
      while(true) {
        if(cljs.core.truth_(xs)) {
          var G__10321 = conj.call(null, coll, x);
          var G__10322 = cljs.core.first.call(null, xs);
          var G__10323 = cljs.core.next.call(null, xs);
          coll = G__10321;
          x = G__10322;
          xs = G__10323;
          continue
        }else {
          return conj.call(null, coll, x)
        }
        break
      }
    };
    var G__10320 = function(coll, x, var_args) {
      var xs = null;
      if(goog.isDef(var_args)) {
        xs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__10320__delegate.call(this, coll, x, xs)
    };
    G__10320.cljs$lang$maxFixedArity = 2;
    G__10320.cljs$lang$applyTo = function(arglist__10324) {
      var coll = cljs.core.first(arglist__10324);
      var x = cljs.core.first(cljs.core.next(arglist__10324));
      var xs = cljs.core.rest(cljs.core.next(arglist__10324));
      return G__10320__delegate(coll, x, xs)
    };
    G__10320.cljs$lang$arity$variadic = G__10320__delegate;
    return G__10320
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
  var s__10327 = cljs.core.seq.call(null, coll);
  var acc__10328 = 0;
  while(true) {
    if(cljs.core.counted_QMARK_.call(null, s__10327)) {
      return acc__10328 + cljs.core._count.call(null, s__10327)
    }else {
      var G__10329 = cljs.core.next.call(null, s__10327);
      var G__10330 = acc__10328 + 1;
      s__10327 = G__10329;
      acc__10328 = G__10330;
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
        var G__10337__10338 = coll;
        if(G__10337__10338) {
          if(function() {
            var or__3943__auto____10339 = G__10337__10338.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3943__auto____10339) {
              return or__3943__auto____10339
            }else {
              return G__10337__10338.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            if(!G__10337__10338.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__10337__10338)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__10337__10338)
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
        var G__10340__10341 = coll;
        if(G__10340__10341) {
          if(function() {
            var or__3943__auto____10342 = G__10340__10341.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3943__auto____10342) {
              return or__3943__auto____10342
            }else {
              return G__10340__10341.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            if(!G__10340__10341.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__10340__10341)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__10340__10341)
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
    var G__10345__delegate = function(coll, k, v, kvs) {
      while(true) {
        var ret__10344 = assoc.call(null, coll, k, v);
        if(cljs.core.truth_(kvs)) {
          var G__10346 = ret__10344;
          var G__10347 = cljs.core.first.call(null, kvs);
          var G__10348 = cljs.core.second.call(null, kvs);
          var G__10349 = cljs.core.nnext.call(null, kvs);
          coll = G__10346;
          k = G__10347;
          v = G__10348;
          kvs = G__10349;
          continue
        }else {
          return ret__10344
        }
        break
      }
    };
    var G__10345 = function(coll, k, v, var_args) {
      var kvs = null;
      if(goog.isDef(var_args)) {
        kvs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__10345__delegate.call(this, coll, k, v, kvs)
    };
    G__10345.cljs$lang$maxFixedArity = 3;
    G__10345.cljs$lang$applyTo = function(arglist__10350) {
      var coll = cljs.core.first(arglist__10350);
      var k = cljs.core.first(cljs.core.next(arglist__10350));
      var v = cljs.core.first(cljs.core.next(cljs.core.next(arglist__10350)));
      var kvs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__10350)));
      return G__10345__delegate(coll, k, v, kvs)
    };
    G__10345.cljs$lang$arity$variadic = G__10345__delegate;
    return G__10345
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
    var G__10353__delegate = function(coll, k, ks) {
      while(true) {
        var ret__10352 = dissoc.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__10354 = ret__10352;
          var G__10355 = cljs.core.first.call(null, ks);
          var G__10356 = cljs.core.next.call(null, ks);
          coll = G__10354;
          k = G__10355;
          ks = G__10356;
          continue
        }else {
          return ret__10352
        }
        break
      }
    };
    var G__10353 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__10353__delegate.call(this, coll, k, ks)
    };
    G__10353.cljs$lang$maxFixedArity = 2;
    G__10353.cljs$lang$applyTo = function(arglist__10357) {
      var coll = cljs.core.first(arglist__10357);
      var k = cljs.core.first(cljs.core.next(arglist__10357));
      var ks = cljs.core.rest(cljs.core.next(arglist__10357));
      return G__10353__delegate(coll, k, ks)
    };
    G__10353.cljs$lang$arity$variadic = G__10353__delegate;
    return G__10353
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
    var G__10361__10362 = o;
    if(G__10361__10362) {
      if(function() {
        var or__3943__auto____10363 = G__10361__10362.cljs$lang$protocol_mask$partition0$ & 131072;
        if(or__3943__auto____10363) {
          return or__3943__auto____10363
        }else {
          return G__10361__10362.cljs$core$IMeta$
        }
      }()) {
        return true
      }else {
        if(!G__10361__10362.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__10361__10362)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__10361__10362)
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
    var G__10366__delegate = function(coll, k, ks) {
      while(true) {
        var ret__10365 = disj.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__10367 = ret__10365;
          var G__10368 = cljs.core.first.call(null, ks);
          var G__10369 = cljs.core.next.call(null, ks);
          coll = G__10367;
          k = G__10368;
          ks = G__10369;
          continue
        }else {
          return ret__10365
        }
        break
      }
    };
    var G__10366 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__10366__delegate.call(this, coll, k, ks)
    };
    G__10366.cljs$lang$maxFixedArity = 2;
    G__10366.cljs$lang$applyTo = function(arglist__10370) {
      var coll = cljs.core.first(arglist__10370);
      var k = cljs.core.first(cljs.core.next(arglist__10370));
      var ks = cljs.core.rest(cljs.core.next(arglist__10370));
      return G__10366__delegate(coll, k, ks)
    };
    G__10366.cljs$lang$arity$variadic = G__10366__delegate;
    return G__10366
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
  var h__10372 = goog.string.hashCode(k);
  cljs.core.string_hash_cache[k] = h__10372;
  cljs.core.string_hash_cache_count = cljs.core.string_hash_cache_count + 1;
  return h__10372
};
cljs.core.check_string_hash_cache = function check_string_hash_cache(k) {
  if(cljs.core.string_hash_cache_count > 255) {
    cljs.core.string_hash_cache = {};
    cljs.core.string_hash_cache_count = 0
  }else {
  }
  var h__10374 = cljs.core.string_hash_cache[k];
  if(!(h__10374 == null)) {
    return h__10374
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
      var and__3941__auto____10376 = goog.isString(o);
      if(and__3941__auto____10376) {
        return check_cache
      }else {
        return and__3941__auto____10376
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
    var G__10380__10381 = x;
    if(G__10380__10381) {
      if(function() {
        var or__3943__auto____10382 = G__10380__10381.cljs$lang$protocol_mask$partition0$ & 8;
        if(or__3943__auto____10382) {
          return or__3943__auto____10382
        }else {
          return G__10380__10381.cljs$core$ICollection$
        }
      }()) {
        return true
      }else {
        if(!G__10380__10381.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__10380__10381)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__10380__10381)
    }
  }
};
cljs.core.set_QMARK_ = function set_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__10386__10387 = x;
    if(G__10386__10387) {
      if(function() {
        var or__3943__auto____10388 = G__10386__10387.cljs$lang$protocol_mask$partition0$ & 4096;
        if(or__3943__auto____10388) {
          return or__3943__auto____10388
        }else {
          return G__10386__10387.cljs$core$ISet$
        }
      }()) {
        return true
      }else {
        if(!G__10386__10387.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__10386__10387)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__10386__10387)
    }
  }
};
cljs.core.associative_QMARK_ = function associative_QMARK_(x) {
  var G__10392__10393 = x;
  if(G__10392__10393) {
    if(function() {
      var or__3943__auto____10394 = G__10392__10393.cljs$lang$protocol_mask$partition0$ & 512;
      if(or__3943__auto____10394) {
        return or__3943__auto____10394
      }else {
        return G__10392__10393.cljs$core$IAssociative$
      }
    }()) {
      return true
    }else {
      if(!G__10392__10393.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__10392__10393)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__10392__10393)
  }
};
cljs.core.sequential_QMARK_ = function sequential_QMARK_(x) {
  var G__10398__10399 = x;
  if(G__10398__10399) {
    if(function() {
      var or__3943__auto____10400 = G__10398__10399.cljs$lang$protocol_mask$partition0$ & 16777216;
      if(or__3943__auto____10400) {
        return or__3943__auto____10400
      }else {
        return G__10398__10399.cljs$core$ISequential$
      }
    }()) {
      return true
    }else {
      if(!G__10398__10399.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__10398__10399)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__10398__10399)
  }
};
cljs.core.counted_QMARK_ = function counted_QMARK_(x) {
  var G__10404__10405 = x;
  if(G__10404__10405) {
    if(function() {
      var or__3943__auto____10406 = G__10404__10405.cljs$lang$protocol_mask$partition0$ & 2;
      if(or__3943__auto____10406) {
        return or__3943__auto____10406
      }else {
        return G__10404__10405.cljs$core$ICounted$
      }
    }()) {
      return true
    }else {
      if(!G__10404__10405.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__10404__10405)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__10404__10405)
  }
};
cljs.core.indexed_QMARK_ = function indexed_QMARK_(x) {
  var G__10410__10411 = x;
  if(G__10410__10411) {
    if(function() {
      var or__3943__auto____10412 = G__10410__10411.cljs$lang$protocol_mask$partition0$ & 16;
      if(or__3943__auto____10412) {
        return or__3943__auto____10412
      }else {
        return G__10410__10411.cljs$core$IIndexed$
      }
    }()) {
      return true
    }else {
      if(!G__10410__10411.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__10410__10411)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__10410__10411)
  }
};
cljs.core.reduceable_QMARK_ = function reduceable_QMARK_(x) {
  var G__10416__10417 = x;
  if(G__10416__10417) {
    if(function() {
      var or__3943__auto____10418 = G__10416__10417.cljs$lang$protocol_mask$partition0$ & 524288;
      if(or__3943__auto____10418) {
        return or__3943__auto____10418
      }else {
        return G__10416__10417.cljs$core$IReduce$
      }
    }()) {
      return true
    }else {
      if(!G__10416__10417.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__10416__10417)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__10416__10417)
  }
};
cljs.core.map_QMARK_ = function map_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__10422__10423 = x;
    if(G__10422__10423) {
      if(function() {
        var or__3943__auto____10424 = G__10422__10423.cljs$lang$protocol_mask$partition0$ & 1024;
        if(or__3943__auto____10424) {
          return or__3943__auto____10424
        }else {
          return G__10422__10423.cljs$core$IMap$
        }
      }()) {
        return true
      }else {
        if(!G__10422__10423.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__10422__10423)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__10422__10423)
    }
  }
};
cljs.core.vector_QMARK_ = function vector_QMARK_(x) {
  var G__10428__10429 = x;
  if(G__10428__10429) {
    if(function() {
      var or__3943__auto____10430 = G__10428__10429.cljs$lang$protocol_mask$partition0$ & 16384;
      if(or__3943__auto____10430) {
        return or__3943__auto____10430
      }else {
        return G__10428__10429.cljs$core$IVector$
      }
    }()) {
      return true
    }else {
      if(!G__10428__10429.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__10428__10429)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__10428__10429)
  }
};
cljs.core.chunked_seq_QMARK_ = function chunked_seq_QMARK_(x) {
  var G__10434__10435 = x;
  if(G__10434__10435) {
    if(cljs.core.truth_(function() {
      var or__3943__auto____10436 = null;
      if(cljs.core.truth_(or__3943__auto____10436)) {
        return or__3943__auto____10436
      }else {
        return G__10434__10435.cljs$core$IChunkedSeq$
      }
    }())) {
      return true
    }else {
      if(!G__10434__10435.cljs$lang$protocol_mask$partition$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedSeq, G__10434__10435)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedSeq, G__10434__10435)
  }
};
cljs.core.js_obj = function() {
  var js_obj = null;
  var js_obj__0 = function() {
    return{}
  };
  var js_obj__1 = function() {
    var G__10437__delegate = function(keyvals) {
      return cljs.core.apply.call(null, goog.object.create, keyvals)
    };
    var G__10437 = function(var_args) {
      var keyvals = null;
      if(goog.isDef(var_args)) {
        keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__10437__delegate.call(this, keyvals)
    };
    G__10437.cljs$lang$maxFixedArity = 0;
    G__10437.cljs$lang$applyTo = function(arglist__10438) {
      var keyvals = cljs.core.seq(arglist__10438);
      return G__10437__delegate(keyvals)
    };
    G__10437.cljs$lang$arity$variadic = G__10437__delegate;
    return G__10437
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
  var keys__10440 = [];
  goog.object.forEach(obj, function(val, key, obj) {
    return keys__10440.push(key)
  });
  return keys__10440
};
cljs.core.js_delete = function js_delete(obj, key) {
  return delete obj[key]
};
cljs.core.array_copy = function array_copy(from, i, to, j, len) {
  var i__10444 = i;
  var j__10445 = j;
  var len__10446 = len;
  while(true) {
    if(len__10446 === 0) {
      return to
    }else {
      to[j__10445] = from[i__10444];
      var G__10447 = i__10444 + 1;
      var G__10448 = j__10445 + 1;
      var G__10449 = len__10446 - 1;
      i__10444 = G__10447;
      j__10445 = G__10448;
      len__10446 = G__10449;
      continue
    }
    break
  }
};
cljs.core.array_copy_downward = function array_copy_downward(from, i, to, j, len) {
  var i__10453 = i + (len - 1);
  var j__10454 = j + (len - 1);
  var len__10455 = len;
  while(true) {
    if(len__10455 === 0) {
      return to
    }else {
      to[j__10454] = from[i__10453];
      var G__10456 = i__10453 - 1;
      var G__10457 = j__10454 - 1;
      var G__10458 = len__10455 - 1;
      i__10453 = G__10456;
      j__10454 = G__10457;
      len__10455 = G__10458;
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
    var G__10462__10463 = s;
    if(G__10462__10463) {
      if(function() {
        var or__3943__auto____10464 = G__10462__10463.cljs$lang$protocol_mask$partition0$ & 64;
        if(or__3943__auto____10464) {
          return or__3943__auto____10464
        }else {
          return G__10462__10463.cljs$core$ISeq$
        }
      }()) {
        return true
      }else {
        if(!G__10462__10463.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__10462__10463)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__10462__10463)
    }
  }
};
cljs.core.seqable_QMARK_ = function seqable_QMARK_(s) {
  var G__10468__10469 = s;
  if(G__10468__10469) {
    if(function() {
      var or__3943__auto____10470 = G__10468__10469.cljs$lang$protocol_mask$partition0$ & 8388608;
      if(or__3943__auto____10470) {
        return or__3943__auto____10470
      }else {
        return G__10468__10469.cljs$core$ISeqable$
      }
    }()) {
      return true
    }else {
      if(!G__10468__10469.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__10468__10469)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__10468__10469)
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
  var and__3941__auto____10473 = goog.isString(x);
  if(and__3941__auto____10473) {
    return!function() {
      var or__3943__auto____10474 = x.charAt(0) === "\ufdd0";
      if(or__3943__auto____10474) {
        return or__3943__auto____10474
      }else {
        return x.charAt(0) === "\ufdd1"
      }
    }()
  }else {
    return and__3941__auto____10473
  }
};
cljs.core.keyword_QMARK_ = function keyword_QMARK_(x) {
  var and__3941__auto____10476 = goog.isString(x);
  if(and__3941__auto____10476) {
    return x.charAt(0) === "\ufdd0"
  }else {
    return and__3941__auto____10476
  }
};
cljs.core.symbol_QMARK_ = function symbol_QMARK_(x) {
  var and__3941__auto____10478 = goog.isString(x);
  if(and__3941__auto____10478) {
    return x.charAt(0) === "\ufdd1"
  }else {
    return and__3941__auto____10478
  }
};
cljs.core.number_QMARK_ = function number_QMARK_(n) {
  return goog.isNumber(n)
};
cljs.core.fn_QMARK_ = function fn_QMARK_(f) {
  return goog.isFunction(f)
};
cljs.core.ifn_QMARK_ = function ifn_QMARK_(f) {
  var or__3943__auto____10483 = cljs.core.fn_QMARK_.call(null, f);
  if(or__3943__auto____10483) {
    return or__3943__auto____10483
  }else {
    var G__10484__10485 = f;
    if(G__10484__10485) {
      if(function() {
        var or__3943__auto____10486 = G__10484__10485.cljs$lang$protocol_mask$partition0$ & 1;
        if(or__3943__auto____10486) {
          return or__3943__auto____10486
        }else {
          return G__10484__10485.cljs$core$IFn$
        }
      }()) {
        return true
      }else {
        if(!G__10484__10485.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__10484__10485)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__10484__10485)
    }
  }
};
cljs.core.integer_QMARK_ = function integer_QMARK_(n) {
  var and__3941__auto____10488 = cljs.core.number_QMARK_.call(null, n);
  if(and__3941__auto____10488) {
    return n == n.toFixed()
  }else {
    return and__3941__auto____10488
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
    var and__3941__auto____10491 = coll;
    if(cljs.core.truth_(and__3941__auto____10491)) {
      var and__3941__auto____10492 = cljs.core.associative_QMARK_.call(null, coll);
      if(and__3941__auto____10492) {
        return cljs.core.contains_QMARK_.call(null, coll, k)
      }else {
        return and__3941__auto____10492
      }
    }else {
      return and__3941__auto____10491
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
    var G__10501__delegate = function(x, y, more) {
      if(!cljs.core._EQ_.call(null, x, y)) {
        var s__10497 = cljs.core.PersistentHashSet.fromArray([y, x]);
        var xs__10498 = more;
        while(true) {
          var x__10499 = cljs.core.first.call(null, xs__10498);
          var etc__10500 = cljs.core.next.call(null, xs__10498);
          if(cljs.core.truth_(xs__10498)) {
            if(cljs.core.contains_QMARK_.call(null, s__10497, x__10499)) {
              return false
            }else {
              var G__10502 = cljs.core.conj.call(null, s__10497, x__10499);
              var G__10503 = etc__10500;
              s__10497 = G__10502;
              xs__10498 = G__10503;
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
    var G__10501 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__10501__delegate.call(this, x, y, more)
    };
    G__10501.cljs$lang$maxFixedArity = 2;
    G__10501.cljs$lang$applyTo = function(arglist__10504) {
      var x = cljs.core.first(arglist__10504);
      var y = cljs.core.first(cljs.core.next(arglist__10504));
      var more = cljs.core.rest(cljs.core.next(arglist__10504));
      return G__10501__delegate(x, y, more)
    };
    G__10501.cljs$lang$arity$variadic = G__10501__delegate;
    return G__10501
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
            var G__10508__10509 = x;
            if(G__10508__10509) {
              if(cljs.core.truth_(function() {
                var or__3943__auto____10510 = null;
                if(cljs.core.truth_(or__3943__auto____10510)) {
                  return or__3943__auto____10510
                }else {
                  return G__10508__10509.cljs$core$IComparable$
                }
              }())) {
                return true
              }else {
                if(!G__10508__10509.cljs$lang$protocol_mask$partition$) {
                  return cljs.core.type_satisfies_.call(null, cljs.core.IComparable, G__10508__10509)
                }else {
                  return false
                }
              }
            }else {
              return cljs.core.type_satisfies_.call(null, cljs.core.IComparable, G__10508__10509)
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
    var xl__10515 = cljs.core.count.call(null, xs);
    var yl__10516 = cljs.core.count.call(null, ys);
    if(xl__10515 < yl__10516) {
      return-1
    }else {
      if(xl__10515 > yl__10516) {
        return 1
      }else {
        if("\ufdd0'else") {
          return compare_indexed.call(null, xs, ys, xl__10515, 0)
        }else {
          return null
        }
      }
    }
  };
  var compare_indexed__4 = function(xs, ys, len, n) {
    while(true) {
      var d__10517 = cljs.core.compare.call(null, cljs.core.nth.call(null, xs, n), cljs.core.nth.call(null, ys, n));
      if(function() {
        var and__3941__auto____10518 = d__10517 === 0;
        if(and__3941__auto____10518) {
          return n + 1 < len
        }else {
          return and__3941__auto____10518
        }
      }()) {
        var G__10519 = xs;
        var G__10520 = ys;
        var G__10521 = len;
        var G__10522 = n + 1;
        xs = G__10519;
        ys = G__10520;
        len = G__10521;
        n = G__10522;
        continue
      }else {
        return d__10517
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
      var r__10524 = f.call(null, x, y);
      if(cljs.core.number_QMARK_.call(null, r__10524)) {
        return r__10524
      }else {
        if(cljs.core.truth_(r__10524)) {
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
      var a__10526 = cljs.core.to_array.call(null, coll);
      goog.array.stableSort(a__10526, cljs.core.fn__GT_comparator.call(null, comp));
      return cljs.core.seq.call(null, a__10526)
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
    var temp__4090__auto____10532 = cljs.core.seq.call(null, coll);
    if(temp__4090__auto____10532) {
      var s__10533 = temp__4090__auto____10532;
      return cljs.core.reduce.call(null, f, cljs.core.first.call(null, s__10533), cljs.core.next.call(null, s__10533))
    }else {
      return f.call(null)
    }
  };
  var seq_reduce__3 = function(f, val, coll) {
    var val__10534 = val;
    var coll__10535 = cljs.core.seq.call(null, coll);
    while(true) {
      if(coll__10535) {
        var nval__10536 = f.call(null, val__10534, cljs.core.first.call(null, coll__10535));
        if(cljs.core.reduced_QMARK_.call(null, nval__10536)) {
          return cljs.core.deref.call(null, nval__10536)
        }else {
          var G__10537 = nval__10536;
          var G__10538 = cljs.core.next.call(null, coll__10535);
          val__10534 = G__10537;
          coll__10535 = G__10538;
          continue
        }
      }else {
        return val__10534
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
  var a__10540 = cljs.core.to_array.call(null, coll);
  goog.array.shuffle(a__10540);
  return cljs.core.vec.call(null, a__10540)
};
cljs.core.reduce = function() {
  var reduce = null;
  var reduce__2 = function(f, coll) {
    if(function() {
      var G__10547__10548 = coll;
      if(G__10547__10548) {
        if(function() {
          var or__3943__auto____10549 = G__10547__10548.cljs$lang$protocol_mask$partition0$ & 524288;
          if(or__3943__auto____10549) {
            return or__3943__auto____10549
          }else {
            return G__10547__10548.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__10547__10548.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__10547__10548)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__10547__10548)
      }
    }()) {
      return cljs.core._reduce.call(null, coll, f)
    }else {
      return cljs.core.seq_reduce.call(null, f, coll)
    }
  };
  var reduce__3 = function(f, val, coll) {
    if(function() {
      var G__10550__10551 = coll;
      if(G__10550__10551) {
        if(function() {
          var or__3943__auto____10552 = G__10550__10551.cljs$lang$protocol_mask$partition0$ & 524288;
          if(or__3943__auto____10552) {
            return or__3943__auto____10552
          }else {
            return G__10550__10551.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__10550__10551.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__10550__10551)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__10550__10551)
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
  var this__10553 = this;
  return this__10553.val
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
    var G__10554__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _PLUS_, x + y, more)
    };
    var G__10554 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__10554__delegate.call(this, x, y, more)
    };
    G__10554.cljs$lang$maxFixedArity = 2;
    G__10554.cljs$lang$applyTo = function(arglist__10555) {
      var x = cljs.core.first(arglist__10555);
      var y = cljs.core.first(cljs.core.next(arglist__10555));
      var more = cljs.core.rest(cljs.core.next(arglist__10555));
      return G__10554__delegate(x, y, more)
    };
    G__10554.cljs$lang$arity$variadic = G__10554__delegate;
    return G__10554
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
    var G__10556__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _, x - y, more)
    };
    var G__10556 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__10556__delegate.call(this, x, y, more)
    };
    G__10556.cljs$lang$maxFixedArity = 2;
    G__10556.cljs$lang$applyTo = function(arglist__10557) {
      var x = cljs.core.first(arglist__10557);
      var y = cljs.core.first(cljs.core.next(arglist__10557));
      var more = cljs.core.rest(cljs.core.next(arglist__10557));
      return G__10556__delegate(x, y, more)
    };
    G__10556.cljs$lang$arity$variadic = G__10556__delegate;
    return G__10556
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
    var G__10558__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _STAR_, x * y, more)
    };
    var G__10558 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__10558__delegate.call(this, x, y, more)
    };
    G__10558.cljs$lang$maxFixedArity = 2;
    G__10558.cljs$lang$applyTo = function(arglist__10559) {
      var x = cljs.core.first(arglist__10559);
      var y = cljs.core.first(cljs.core.next(arglist__10559));
      var more = cljs.core.rest(cljs.core.next(arglist__10559));
      return G__10558__delegate(x, y, more)
    };
    G__10558.cljs$lang$arity$variadic = G__10558__delegate;
    return G__10558
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
    var G__10560__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _SLASH_, _SLASH_.call(null, x, y), more)
    };
    var G__10560 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__10560__delegate.call(this, x, y, more)
    };
    G__10560.cljs$lang$maxFixedArity = 2;
    G__10560.cljs$lang$applyTo = function(arglist__10561) {
      var x = cljs.core.first(arglist__10561);
      var y = cljs.core.first(cljs.core.next(arglist__10561));
      var more = cljs.core.rest(cljs.core.next(arglist__10561));
      return G__10560__delegate(x, y, more)
    };
    G__10560.cljs$lang$arity$variadic = G__10560__delegate;
    return G__10560
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
    var G__10562__delegate = function(x, y, more) {
      while(true) {
        if(x < y) {
          if(cljs.core.next.call(null, more)) {
            var G__10563 = y;
            var G__10564 = cljs.core.first.call(null, more);
            var G__10565 = cljs.core.next.call(null, more);
            x = G__10563;
            y = G__10564;
            more = G__10565;
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
    var G__10562 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__10562__delegate.call(this, x, y, more)
    };
    G__10562.cljs$lang$maxFixedArity = 2;
    G__10562.cljs$lang$applyTo = function(arglist__10566) {
      var x = cljs.core.first(arglist__10566);
      var y = cljs.core.first(cljs.core.next(arglist__10566));
      var more = cljs.core.rest(cljs.core.next(arglist__10566));
      return G__10562__delegate(x, y, more)
    };
    G__10562.cljs$lang$arity$variadic = G__10562__delegate;
    return G__10562
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
    var G__10567__delegate = function(x, y, more) {
      while(true) {
        if(x <= y) {
          if(cljs.core.next.call(null, more)) {
            var G__10568 = y;
            var G__10569 = cljs.core.first.call(null, more);
            var G__10570 = cljs.core.next.call(null, more);
            x = G__10568;
            y = G__10569;
            more = G__10570;
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
    var G__10567 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__10567__delegate.call(this, x, y, more)
    };
    G__10567.cljs$lang$maxFixedArity = 2;
    G__10567.cljs$lang$applyTo = function(arglist__10571) {
      var x = cljs.core.first(arglist__10571);
      var y = cljs.core.first(cljs.core.next(arglist__10571));
      var more = cljs.core.rest(cljs.core.next(arglist__10571));
      return G__10567__delegate(x, y, more)
    };
    G__10567.cljs$lang$arity$variadic = G__10567__delegate;
    return G__10567
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
    var G__10572__delegate = function(x, y, more) {
      while(true) {
        if(x > y) {
          if(cljs.core.next.call(null, more)) {
            var G__10573 = y;
            var G__10574 = cljs.core.first.call(null, more);
            var G__10575 = cljs.core.next.call(null, more);
            x = G__10573;
            y = G__10574;
            more = G__10575;
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
    var G__10572 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__10572__delegate.call(this, x, y, more)
    };
    G__10572.cljs$lang$maxFixedArity = 2;
    G__10572.cljs$lang$applyTo = function(arglist__10576) {
      var x = cljs.core.first(arglist__10576);
      var y = cljs.core.first(cljs.core.next(arglist__10576));
      var more = cljs.core.rest(cljs.core.next(arglist__10576));
      return G__10572__delegate(x, y, more)
    };
    G__10572.cljs$lang$arity$variadic = G__10572__delegate;
    return G__10572
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
    var G__10577__delegate = function(x, y, more) {
      while(true) {
        if(x >= y) {
          if(cljs.core.next.call(null, more)) {
            var G__10578 = y;
            var G__10579 = cljs.core.first.call(null, more);
            var G__10580 = cljs.core.next.call(null, more);
            x = G__10578;
            y = G__10579;
            more = G__10580;
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
    var G__10577 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__10577__delegate.call(this, x, y, more)
    };
    G__10577.cljs$lang$maxFixedArity = 2;
    G__10577.cljs$lang$applyTo = function(arglist__10581) {
      var x = cljs.core.first(arglist__10581);
      var y = cljs.core.first(cljs.core.next(arglist__10581));
      var more = cljs.core.rest(cljs.core.next(arglist__10581));
      return G__10577__delegate(x, y, more)
    };
    G__10577.cljs$lang$arity$variadic = G__10577__delegate;
    return G__10577
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
    var G__10582__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, max, x > y ? x : y, more)
    };
    var G__10582 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__10582__delegate.call(this, x, y, more)
    };
    G__10582.cljs$lang$maxFixedArity = 2;
    G__10582.cljs$lang$applyTo = function(arglist__10583) {
      var x = cljs.core.first(arglist__10583);
      var y = cljs.core.first(cljs.core.next(arglist__10583));
      var more = cljs.core.rest(cljs.core.next(arglist__10583));
      return G__10582__delegate(x, y, more)
    };
    G__10582.cljs$lang$arity$variadic = G__10582__delegate;
    return G__10582
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
    var G__10584__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, min, x < y ? x : y, more)
    };
    var G__10584 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__10584__delegate.call(this, x, y, more)
    };
    G__10584.cljs$lang$maxFixedArity = 2;
    G__10584.cljs$lang$applyTo = function(arglist__10585) {
      var x = cljs.core.first(arglist__10585);
      var y = cljs.core.first(cljs.core.next(arglist__10585));
      var more = cljs.core.rest(cljs.core.next(arglist__10585));
      return G__10584__delegate(x, y, more)
    };
    G__10584.cljs$lang$arity$variadic = G__10584__delegate;
    return G__10584
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
  var rem__10587 = n % d;
  return cljs.core.fix.call(null, (n - rem__10587) / d)
};
cljs.core.rem = function rem(n, d) {
  var q__10589 = cljs.core.quot.call(null, n, d);
  return n - d * q__10589
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
  var v__10592 = v - (v >> 1 & 1431655765);
  var v__10593 = (v__10592 & 858993459) + (v__10592 >> 2 & 858993459);
  return(v__10593 + (v__10593 >> 4) & 252645135) * 16843009 >> 24
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
    var G__10594__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ__EQ_.call(null, x, y))) {
          if(cljs.core.next.call(null, more)) {
            var G__10595 = y;
            var G__10596 = cljs.core.first.call(null, more);
            var G__10597 = cljs.core.next.call(null, more);
            x = G__10595;
            y = G__10596;
            more = G__10597;
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
    var G__10594 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__10594__delegate.call(this, x, y, more)
    };
    G__10594.cljs$lang$maxFixedArity = 2;
    G__10594.cljs$lang$applyTo = function(arglist__10598) {
      var x = cljs.core.first(arglist__10598);
      var y = cljs.core.first(cljs.core.next(arglist__10598));
      var more = cljs.core.rest(cljs.core.next(arglist__10598));
      return G__10594__delegate(x, y, more)
    };
    G__10594.cljs$lang$arity$variadic = G__10594__delegate;
    return G__10594
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
  var n__10602 = n;
  var xs__10603 = cljs.core.seq.call(null, coll);
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3941__auto____10604 = xs__10603;
      if(and__3941__auto____10604) {
        return n__10602 > 0
      }else {
        return and__3941__auto____10604
      }
    }())) {
      var G__10605 = n__10602 - 1;
      var G__10606 = cljs.core.next.call(null, xs__10603);
      n__10602 = G__10605;
      xs__10603 = G__10606;
      continue
    }else {
      return xs__10603
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
    var G__10607__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__10608 = sb.append(str_STAR_.call(null, cljs.core.first.call(null, more)));
            var G__10609 = cljs.core.next.call(null, more);
            sb = G__10608;
            more = G__10609;
            continue
          }else {
            return str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str_STAR_.call(null, x)), ys)
    };
    var G__10607 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__10607__delegate.call(this, x, ys)
    };
    G__10607.cljs$lang$maxFixedArity = 1;
    G__10607.cljs$lang$applyTo = function(arglist__10610) {
      var x = cljs.core.first(arglist__10610);
      var ys = cljs.core.rest(arglist__10610);
      return G__10607__delegate(x, ys)
    };
    G__10607.cljs$lang$arity$variadic = G__10607__delegate;
    return G__10607
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
    var G__10611__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__10612 = sb.append(str.call(null, cljs.core.first.call(null, more)));
            var G__10613 = cljs.core.next.call(null, more);
            sb = G__10612;
            more = G__10613;
            continue
          }else {
            return cljs.core.str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str.call(null, x)), ys)
    };
    var G__10611 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__10611__delegate.call(this, x, ys)
    };
    G__10611.cljs$lang$maxFixedArity = 1;
    G__10611.cljs$lang$applyTo = function(arglist__10614) {
      var x = cljs.core.first(arglist__10614);
      var ys = cljs.core.rest(arglist__10614);
      return G__10611__delegate(x, ys)
    };
    G__10611.cljs$lang$arity$variadic = G__10611__delegate;
    return G__10611
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
  format.cljs$lang$applyTo = function(arglist__10615) {
    var fmt = cljs.core.first(arglist__10615);
    var args = cljs.core.rest(arglist__10615);
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
    var xs__10618 = cljs.core.seq.call(null, x);
    var ys__10619 = cljs.core.seq.call(null, y);
    while(true) {
      if(xs__10618 == null) {
        return ys__10619 == null
      }else {
        if(ys__10619 == null) {
          return false
        }else {
          if(cljs.core._EQ_.call(null, cljs.core.first.call(null, xs__10618), cljs.core.first.call(null, ys__10619))) {
            var G__10620 = cljs.core.next.call(null, xs__10618);
            var G__10621 = cljs.core.next.call(null, ys__10619);
            xs__10618 = G__10620;
            ys__10619 = G__10621;
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
  return cljs.core.reduce.call(null, function(p1__10622_SHARP_, p2__10623_SHARP_) {
    return cljs.core.hash_combine.call(null, p1__10622_SHARP_, cljs.core.hash.call(null, p2__10623_SHARP_, false))
  }, cljs.core.hash.call(null, cljs.core.first.call(null, coll), false), cljs.core.next.call(null, coll))
};
cljs.core.hash_imap = function hash_imap(m) {
  var h__10627 = 0;
  var s__10628 = cljs.core.seq.call(null, m);
  while(true) {
    if(s__10628) {
      var e__10629 = cljs.core.first.call(null, s__10628);
      var G__10630 = (h__10627 + (cljs.core.hash.call(null, cljs.core.key.call(null, e__10629)) ^ cljs.core.hash.call(null, cljs.core.val.call(null, e__10629)))) % 4503599627370496;
      var G__10631 = cljs.core.next.call(null, s__10628);
      h__10627 = G__10630;
      s__10628 = G__10631;
      continue
    }else {
      return h__10627
    }
    break
  }
};
cljs.core.hash_iset = function hash_iset(s) {
  var h__10635 = 0;
  var s__10636 = cljs.core.seq.call(null, s);
  while(true) {
    if(s__10636) {
      var e__10637 = cljs.core.first.call(null, s__10636);
      var G__10638 = (h__10635 + cljs.core.hash.call(null, e__10637)) % 4503599627370496;
      var G__10639 = cljs.core.next.call(null, s__10636);
      h__10635 = G__10638;
      s__10636 = G__10639;
      continue
    }else {
      return h__10635
    }
    break
  }
};
cljs.core.extend_object_BANG_ = function extend_object_BANG_(obj, fn_map) {
  var G__10660__10661 = cljs.core.seq.call(null, fn_map);
  if(G__10660__10661) {
    var G__10663__10665 = cljs.core.first.call(null, G__10660__10661);
    var vec__10664__10666 = G__10663__10665;
    var key_name__10667 = cljs.core.nth.call(null, vec__10664__10666, 0, null);
    var f__10668 = cljs.core.nth.call(null, vec__10664__10666, 1, null);
    var G__10660__10669 = G__10660__10661;
    var G__10663__10670 = G__10663__10665;
    var G__10660__10671 = G__10660__10669;
    while(true) {
      var vec__10672__10673 = G__10663__10670;
      var key_name__10674 = cljs.core.nth.call(null, vec__10672__10673, 0, null);
      var f__10675 = cljs.core.nth.call(null, vec__10672__10673, 1, null);
      var G__10660__10676 = G__10660__10671;
      var str_name__10677 = cljs.core.name.call(null, key_name__10674);
      obj[str_name__10677] = f__10675;
      var temp__4092__auto____10678 = cljs.core.next.call(null, G__10660__10676);
      if(temp__4092__auto____10678) {
        var G__10660__10679 = temp__4092__auto____10678;
        var G__10680 = cljs.core.first.call(null, G__10660__10679);
        var G__10681 = G__10660__10679;
        G__10663__10670 = G__10680;
        G__10660__10671 = G__10681;
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
  var this__10682 = this;
  var h__2133__auto____10683 = this__10682.__hash;
  if(!(h__2133__auto____10683 == null)) {
    return h__2133__auto____10683
  }else {
    var h__2133__auto____10684 = cljs.core.hash_coll.call(null, coll);
    this__10682.__hash = h__2133__auto____10684;
    return h__2133__auto____10684
  }
};
cljs.core.List.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__10685 = this;
  if(this__10685.count === 1) {
    return null
  }else {
    return this__10685.rest
  }
};
cljs.core.List.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__10686 = this;
  return new cljs.core.List(this__10686.meta, o, coll, this__10686.count + 1, null)
};
cljs.core.List.prototype.toString = function() {
  var this__10687 = this;
  var this__10688 = this;
  return cljs.core.pr_str.call(null, this__10688)
};
cljs.core.List.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__10689 = this;
  return coll
};
cljs.core.List.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__10690 = this;
  return this__10690.count
};
cljs.core.List.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__10691 = this;
  return this__10691.first
};
cljs.core.List.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__10692 = this;
  return coll.cljs$core$ISeq$_rest$arity$1(coll)
};
cljs.core.List.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__10693 = this;
  return this__10693.first
};
cljs.core.List.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__10694 = this;
  if(this__10694.count === 1) {
    return cljs.core.List.EMPTY
  }else {
    return this__10694.rest
  }
};
cljs.core.List.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__10695 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.List.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__10696 = this;
  return new cljs.core.List(meta, this__10696.first, this__10696.rest, this__10696.count, this__10696.__hash)
};
cljs.core.List.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__10697 = this;
  return this__10697.meta
};
cljs.core.List.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__10698 = this;
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
  var this__10699 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__10700 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__10701 = this;
  return new cljs.core.List(this__10701.meta, o, null, 1, null)
};
cljs.core.EmptyList.prototype.toString = function() {
  var this__10702 = this;
  var this__10703 = this;
  return cljs.core.pr_str.call(null, this__10703)
};
cljs.core.EmptyList.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__10704 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__10705 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__10706 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__10707 = this;
  throw new Error("Can't pop empty list");
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__10708 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__10709 = this;
  return cljs.core.List.EMPTY
};
cljs.core.EmptyList.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__10710 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.EmptyList.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__10711 = this;
  return new cljs.core.EmptyList(meta)
};
cljs.core.EmptyList.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__10712 = this;
  return this__10712.meta
};
cljs.core.EmptyList.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__10713 = this;
  return coll
};
cljs.core.EmptyList;
cljs.core.List.EMPTY = new cljs.core.EmptyList(null);
cljs.core.reversible_QMARK_ = function reversible_QMARK_(coll) {
  var G__10717__10718 = coll;
  if(G__10717__10718) {
    if(function() {
      var or__3943__auto____10719 = G__10717__10718.cljs$lang$protocol_mask$partition0$ & 134217728;
      if(or__3943__auto____10719) {
        return or__3943__auto____10719
      }else {
        return G__10717__10718.cljs$core$IReversible$
      }
    }()) {
      return true
    }else {
      if(!G__10717__10718.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__10717__10718)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__10717__10718)
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
    var G__10720__delegate = function(x, y, z, items) {
      return cljs.core.conj.call(null, cljs.core.conj.call(null, cljs.core.conj.call(null, cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, cljs.core.reverse.call(null, items)), z), y), x)
    };
    var G__10720 = function(x, y, z, var_args) {
      var items = null;
      if(goog.isDef(var_args)) {
        items = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__10720__delegate.call(this, x, y, z, items)
    };
    G__10720.cljs$lang$maxFixedArity = 3;
    G__10720.cljs$lang$applyTo = function(arglist__10721) {
      var x = cljs.core.first(arglist__10721);
      var y = cljs.core.first(cljs.core.next(arglist__10721));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__10721)));
      var items = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__10721)));
      return G__10720__delegate(x, y, z, items)
    };
    G__10720.cljs$lang$arity$variadic = G__10720__delegate;
    return G__10720
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
  var this__10722 = this;
  var h__2133__auto____10723 = this__10722.__hash;
  if(!(h__2133__auto____10723 == null)) {
    return h__2133__auto____10723
  }else {
    var h__2133__auto____10724 = cljs.core.hash_coll.call(null, coll);
    this__10722.__hash = h__2133__auto____10724;
    return h__2133__auto____10724
  }
};
cljs.core.Cons.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__10725 = this;
  if(this__10725.rest == null) {
    return null
  }else {
    return cljs.core._seq.call(null, this__10725.rest)
  }
};
cljs.core.Cons.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__10726 = this;
  return new cljs.core.Cons(null, o, coll, this__10726.__hash)
};
cljs.core.Cons.prototype.toString = function() {
  var this__10727 = this;
  var this__10728 = this;
  return cljs.core.pr_str.call(null, this__10728)
};
cljs.core.Cons.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__10729 = this;
  return coll
};
cljs.core.Cons.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__10730 = this;
  return this__10730.first
};
cljs.core.Cons.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__10731 = this;
  if(this__10731.rest == null) {
    return cljs.core.List.EMPTY
  }else {
    return this__10731.rest
  }
};
cljs.core.Cons.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__10732 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Cons.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__10733 = this;
  return new cljs.core.Cons(meta, this__10733.first, this__10733.rest, this__10733.__hash)
};
cljs.core.Cons.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__10734 = this;
  return this__10734.meta
};
cljs.core.Cons.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__10735 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__10735.meta)
};
cljs.core.Cons;
cljs.core.cons = function cons(x, coll) {
  if(function() {
    var or__3943__auto____10740 = coll == null;
    if(or__3943__auto____10740) {
      return or__3943__auto____10740
    }else {
      var G__10741__10742 = coll;
      if(G__10741__10742) {
        if(function() {
          var or__3943__auto____10743 = G__10741__10742.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3943__auto____10743) {
            return or__3943__auto____10743
          }else {
            return G__10741__10742.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__10741__10742.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__10741__10742)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__10741__10742)
      }
    }
  }()) {
    return new cljs.core.Cons(null, x, coll, null)
  }else {
    return new cljs.core.Cons(null, x, cljs.core.seq.call(null, coll), null)
  }
};
cljs.core.list_QMARK_ = function list_QMARK_(x) {
  var G__10747__10748 = x;
  if(G__10747__10748) {
    if(function() {
      var or__3943__auto____10749 = G__10747__10748.cljs$lang$protocol_mask$partition0$ & 33554432;
      if(or__3943__auto____10749) {
        return or__3943__auto____10749
      }else {
        return G__10747__10748.cljs$core$IList$
      }
    }()) {
      return true
    }else {
      if(!G__10747__10748.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__10747__10748)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__10747__10748)
  }
};
cljs.core.IReduce["string"] = true;
cljs.core._reduce["string"] = function() {
  var G__10750 = null;
  var G__10750__2 = function(string, f) {
    return cljs.core.ci_reduce.call(null, string, f)
  };
  var G__10750__3 = function(string, f, start) {
    return cljs.core.ci_reduce.call(null, string, f, start)
  };
  G__10750 = function(string, f, start) {
    switch(arguments.length) {
      case 2:
        return G__10750__2.call(this, string, f);
      case 3:
        return G__10750__3.call(this, string, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10750
}();
cljs.core.ILookup["string"] = true;
cljs.core._lookup["string"] = function() {
  var G__10751 = null;
  var G__10751__2 = function(string, k) {
    return cljs.core._nth.call(null, string, k)
  };
  var G__10751__3 = function(string, k, not_found) {
    return cljs.core._nth.call(null, string, k, not_found)
  };
  G__10751 = function(string, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__10751__2.call(this, string, k);
      case 3:
        return G__10751__3.call(this, string, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10751
}();
cljs.core.IIndexed["string"] = true;
cljs.core._nth["string"] = function() {
  var G__10752 = null;
  var G__10752__2 = function(string, n) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return null
    }
  };
  var G__10752__3 = function(string, n, not_found) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return not_found
    }
  };
  G__10752 = function(string, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__10752__2.call(this, string, n);
      case 3:
        return G__10752__3.call(this, string, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10752
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
  var G__10764 = null;
  var G__10764__2 = function(this_sym10755, coll) {
    var this__10757 = this;
    var this_sym10755__10758 = this;
    var ___10759 = this_sym10755__10758;
    if(coll == null) {
      return null
    }else {
      var strobj__10760 = coll.strobj;
      if(strobj__10760 == null) {
        return cljs.core._lookup.call(null, coll, this__10757.k, null)
      }else {
        return strobj__10760[this__10757.k]
      }
    }
  };
  var G__10764__3 = function(this_sym10756, coll, not_found) {
    var this__10757 = this;
    var this_sym10756__10761 = this;
    var ___10762 = this_sym10756__10761;
    if(coll == null) {
      return not_found
    }else {
      return cljs.core._lookup.call(null, coll, this__10757.k, not_found)
    }
  };
  G__10764 = function(this_sym10756, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__10764__2.call(this, this_sym10756, coll);
      case 3:
        return G__10764__3.call(this, this_sym10756, coll, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10764
}();
cljs.core.Keyword.prototype.apply = function(this_sym10753, args10754) {
  var this__10763 = this;
  return this_sym10753.call.apply(this_sym10753, [this_sym10753].concat(args10754.slice()))
};
cljs.core.Keyword;
String.prototype.cljs$core$IFn$ = true;
String.prototype.call = function() {
  var G__10773 = null;
  var G__10773__2 = function(this_sym10767, coll) {
    var this_sym10767__10769 = this;
    var this__10770 = this_sym10767__10769;
    return cljs.core._lookup.call(null, coll, this__10770.toString(), null)
  };
  var G__10773__3 = function(this_sym10768, coll, not_found) {
    var this_sym10768__10771 = this;
    var this__10772 = this_sym10768__10771;
    return cljs.core._lookup.call(null, coll, this__10772.toString(), not_found)
  };
  G__10773 = function(this_sym10768, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__10773__2.call(this, this_sym10768, coll);
      case 3:
        return G__10773__3.call(this, this_sym10768, coll, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10773
}();
String.prototype.apply = function(this_sym10765, args10766) {
  return this_sym10765.call.apply(this_sym10765, [this_sym10765].concat(args10766.slice()))
};
String.prototype.apply = function(s, args) {
  if(cljs.core.count.call(null, args) < 2) {
    return cljs.core._lookup.call(null, args[0], s, null)
  }else {
    return cljs.core._lookup.call(null, args[0], s, args[1])
  }
};
cljs.core.lazy_seq_value = function lazy_seq_value(lazy_seq) {
  var x__10775 = lazy_seq.x;
  if(lazy_seq.realized) {
    return x__10775
  }else {
    lazy_seq.x = x__10775.call(null);
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
  var this__10776 = this;
  var h__2133__auto____10777 = this__10776.__hash;
  if(!(h__2133__auto____10777 == null)) {
    return h__2133__auto____10777
  }else {
    var h__2133__auto____10778 = cljs.core.hash_coll.call(null, coll);
    this__10776.__hash = h__2133__auto____10778;
    return h__2133__auto____10778
  }
};
cljs.core.LazySeq.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__10779 = this;
  return cljs.core._seq.call(null, coll.cljs$core$ISeq$_rest$arity$1(coll))
};
cljs.core.LazySeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__10780 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.LazySeq.prototype.toString = function() {
  var this__10781 = this;
  var this__10782 = this;
  return cljs.core.pr_str.call(null, this__10782)
};
cljs.core.LazySeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__10783 = this;
  return cljs.core.seq.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__10784 = this;
  return cljs.core.first.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__10785 = this;
  return cljs.core.rest.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__10786 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.LazySeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__10787 = this;
  return new cljs.core.LazySeq(meta, this__10787.realized, this__10787.x, this__10787.__hash)
};
cljs.core.LazySeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__10788 = this;
  return this__10788.meta
};
cljs.core.LazySeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__10789 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__10789.meta)
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
  var this__10790 = this;
  return this__10790.end
};
cljs.core.ChunkBuffer.prototype.add = function(o) {
  var this__10791 = this;
  var ___10792 = this;
  this__10791.buf[this__10791.end] = o;
  return this__10791.end = this__10791.end + 1
};
cljs.core.ChunkBuffer.prototype.chunk = function(o) {
  var this__10793 = this;
  var ___10794 = this;
  var ret__10795 = new cljs.core.ArrayChunk(this__10793.buf, 0, this__10793.end);
  this__10793.buf = null;
  return ret__10795
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
  var this__10796 = this;
  return cljs.core.ci_reduce.call(null, coll, f, this__10796.arr[this__10796.off], this__10796.off + 1)
};
cljs.core.ArrayChunk.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__10797 = this;
  return cljs.core.ci_reduce.call(null, coll, f, start, this__10797.off)
};
cljs.core.ArrayChunk.prototype.cljs$core$IChunk$ = true;
cljs.core.ArrayChunk.prototype.cljs$core$IChunk$_drop_first$arity$1 = function(coll) {
  var this__10798 = this;
  if(this__10798.off === this__10798.end) {
    throw new Error("-drop-first of empty chunk");
  }else {
    return new cljs.core.ArrayChunk(this__10798.arr, this__10798.off + 1, this__10798.end)
  }
};
cljs.core.ArrayChunk.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, i) {
  var this__10799 = this;
  return this__10799.arr[this__10799.off + i]
};
cljs.core.ArrayChunk.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, i, not_found) {
  var this__10800 = this;
  if(function() {
    var and__3941__auto____10801 = i >= 0;
    if(and__3941__auto____10801) {
      return i < this__10800.end - this__10800.off
    }else {
      return and__3941__auto____10801
    }
  }()) {
    return this__10800.arr[this__10800.off + i]
  }else {
    return not_found
  }
};
cljs.core.ArrayChunk.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__10802 = this;
  return this__10802.end - this__10802.off
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
  var this__10803 = this;
  return cljs.core.cons.call(null, o, this$)
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__10804 = this;
  return coll
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__10805 = this;
  return cljs.core._nth.call(null, this__10805.chunk, 0)
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__10806 = this;
  if(cljs.core._count.call(null, this__10806.chunk) > 1) {
    return new cljs.core.ChunkedCons(cljs.core._drop_first.call(null, this__10806.chunk), this__10806.more, this__10806.meta)
  }else {
    if(this__10806.more == null) {
      return cljs.core.List.EMPTY
    }else {
      return this__10806.more
    }
  }
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedNext$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedNext$_chunked_next$arity$1 = function(coll) {
  var this__10807 = this;
  if(this__10807.more == null) {
    return null
  }else {
    return this__10807.more
  }
};
cljs.core.ChunkedCons.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__10808 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ChunkedCons.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, m) {
  var this__10809 = this;
  return new cljs.core.ChunkedCons(this__10809.chunk, this__10809.more, m)
};
cljs.core.ChunkedCons.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__10810 = this;
  return this__10810.meta
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$_chunked_first$arity$1 = function(coll) {
  var this__10811 = this;
  return this__10811.chunk
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$_chunked_rest$arity$1 = function(coll) {
  var this__10812 = this;
  if(this__10812.more == null) {
    return cljs.core.List.EMPTY
  }else {
    return this__10812.more
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
    var G__10816__10817 = s;
    if(G__10816__10817) {
      if(cljs.core.truth_(function() {
        var or__3943__auto____10818 = null;
        if(cljs.core.truth_(or__3943__auto____10818)) {
          return or__3943__auto____10818
        }else {
          return G__10816__10817.cljs$core$IChunkedNext$
        }
      }())) {
        return true
      }else {
        if(!G__10816__10817.cljs$lang$protocol_mask$partition$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedNext, G__10816__10817)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedNext, G__10816__10817)
    }
  }()) {
    return cljs.core._chunked_next.call(null, s)
  }else {
    return cljs.core.seq.call(null, cljs.core._chunked_rest.call(null, s))
  }
};
cljs.core.to_array = function to_array(s) {
  var ary__10821 = [];
  var s__10822 = s;
  while(true) {
    if(cljs.core.seq.call(null, s__10822)) {
      ary__10821.push(cljs.core.first.call(null, s__10822));
      var G__10823 = cljs.core.next.call(null, s__10822);
      s__10822 = G__10823;
      continue
    }else {
      return ary__10821
    }
    break
  }
};
cljs.core.to_array_2d = function to_array_2d(coll) {
  var ret__10827 = cljs.core.make_array.call(null, cljs.core.count.call(null, coll));
  var i__10828 = 0;
  var xs__10829 = cljs.core.seq.call(null, coll);
  while(true) {
    if(xs__10829) {
      ret__10827[i__10828] = cljs.core.to_array.call(null, cljs.core.first.call(null, xs__10829));
      var G__10830 = i__10828 + 1;
      var G__10831 = cljs.core.next.call(null, xs__10829);
      i__10828 = G__10830;
      xs__10829 = G__10831;
      continue
    }else {
    }
    break
  }
  return ret__10827
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
    var a__10839 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__10840 = cljs.core.seq.call(null, init_val_or_seq);
      var i__10841 = 0;
      var s__10842 = s__10840;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3941__auto____10843 = s__10842;
          if(and__3941__auto____10843) {
            return i__10841 < size
          }else {
            return and__3941__auto____10843
          }
        }())) {
          a__10839[i__10841] = cljs.core.first.call(null, s__10842);
          var G__10846 = i__10841 + 1;
          var G__10847 = cljs.core.next.call(null, s__10842);
          i__10841 = G__10846;
          s__10842 = G__10847;
          continue
        }else {
          return a__10839
        }
        break
      }
    }else {
      var n__2468__auto____10844 = size;
      var i__10845 = 0;
      while(true) {
        if(i__10845 < n__2468__auto____10844) {
          a__10839[i__10845] = init_val_or_seq;
          var G__10848 = i__10845 + 1;
          i__10845 = G__10848;
          continue
        }else {
        }
        break
      }
      return a__10839
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
    var a__10856 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__10857 = cljs.core.seq.call(null, init_val_or_seq);
      var i__10858 = 0;
      var s__10859 = s__10857;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3941__auto____10860 = s__10859;
          if(and__3941__auto____10860) {
            return i__10858 < size
          }else {
            return and__3941__auto____10860
          }
        }())) {
          a__10856[i__10858] = cljs.core.first.call(null, s__10859);
          var G__10863 = i__10858 + 1;
          var G__10864 = cljs.core.next.call(null, s__10859);
          i__10858 = G__10863;
          s__10859 = G__10864;
          continue
        }else {
          return a__10856
        }
        break
      }
    }else {
      var n__2468__auto____10861 = size;
      var i__10862 = 0;
      while(true) {
        if(i__10862 < n__2468__auto____10861) {
          a__10856[i__10862] = init_val_or_seq;
          var G__10865 = i__10862 + 1;
          i__10862 = G__10865;
          continue
        }else {
        }
        break
      }
      return a__10856
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
    var a__10873 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__10874 = cljs.core.seq.call(null, init_val_or_seq);
      var i__10875 = 0;
      var s__10876 = s__10874;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3941__auto____10877 = s__10876;
          if(and__3941__auto____10877) {
            return i__10875 < size
          }else {
            return and__3941__auto____10877
          }
        }())) {
          a__10873[i__10875] = cljs.core.first.call(null, s__10876);
          var G__10880 = i__10875 + 1;
          var G__10881 = cljs.core.next.call(null, s__10876);
          i__10875 = G__10880;
          s__10876 = G__10881;
          continue
        }else {
          return a__10873
        }
        break
      }
    }else {
      var n__2468__auto____10878 = size;
      var i__10879 = 0;
      while(true) {
        if(i__10879 < n__2468__auto____10878) {
          a__10873[i__10879] = init_val_or_seq;
          var G__10882 = i__10879 + 1;
          i__10879 = G__10882;
          continue
        }else {
        }
        break
      }
      return a__10873
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
    var s__10887 = s;
    var i__10888 = n;
    var sum__10889 = 0;
    while(true) {
      if(cljs.core.truth_(function() {
        var and__3941__auto____10890 = i__10888 > 0;
        if(and__3941__auto____10890) {
          return cljs.core.seq.call(null, s__10887)
        }else {
          return and__3941__auto____10890
        }
      }())) {
        var G__10891 = cljs.core.next.call(null, s__10887);
        var G__10892 = i__10888 - 1;
        var G__10893 = sum__10889 + 1;
        s__10887 = G__10891;
        i__10888 = G__10892;
        sum__10889 = G__10893;
        continue
      }else {
        return sum__10889
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
      var s__10898 = cljs.core.seq.call(null, x);
      if(s__10898) {
        if(cljs.core.chunked_seq_QMARK_.call(null, s__10898)) {
          return cljs.core.chunk_cons.call(null, cljs.core.chunk_first.call(null, s__10898), concat.call(null, cljs.core.chunk_rest.call(null, s__10898), y))
        }else {
          return cljs.core.cons.call(null, cljs.core.first.call(null, s__10898), concat.call(null, cljs.core.rest.call(null, s__10898), y))
        }
      }else {
        return y
      }
    }, null)
  };
  var concat__3 = function() {
    var G__10902__delegate = function(x, y, zs) {
      var cat__10901 = function cat(xys, zs) {
        return new cljs.core.LazySeq(null, false, function() {
          var xys__10900 = cljs.core.seq.call(null, xys);
          if(xys__10900) {
            if(cljs.core.chunked_seq_QMARK_.call(null, xys__10900)) {
              return cljs.core.chunk_cons.call(null, cljs.core.chunk_first.call(null, xys__10900), cat.call(null, cljs.core.chunk_rest.call(null, xys__10900), zs))
            }else {
              return cljs.core.cons.call(null, cljs.core.first.call(null, xys__10900), cat.call(null, cljs.core.rest.call(null, xys__10900), zs))
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
      return cat__10901.call(null, concat.call(null, x, y), zs)
    };
    var G__10902 = function(x, y, var_args) {
      var zs = null;
      if(goog.isDef(var_args)) {
        zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__10902__delegate.call(this, x, y, zs)
    };
    G__10902.cljs$lang$maxFixedArity = 2;
    G__10902.cljs$lang$applyTo = function(arglist__10903) {
      var x = cljs.core.first(arglist__10903);
      var y = cljs.core.first(cljs.core.next(arglist__10903));
      var zs = cljs.core.rest(cljs.core.next(arglist__10903));
      return G__10902__delegate(x, y, zs)
    };
    G__10902.cljs$lang$arity$variadic = G__10902__delegate;
    return G__10902
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
    var G__10904__delegate = function(a, b, c, d, more) {
      return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, more)))))
    };
    var G__10904 = function(a, b, c, d, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__10904__delegate.call(this, a, b, c, d, more)
    };
    G__10904.cljs$lang$maxFixedArity = 4;
    G__10904.cljs$lang$applyTo = function(arglist__10905) {
      var a = cljs.core.first(arglist__10905);
      var b = cljs.core.first(cljs.core.next(arglist__10905));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__10905)));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__10905))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__10905))));
      return G__10904__delegate(a, b, c, d, more)
    };
    G__10904.cljs$lang$arity$variadic = G__10904__delegate;
    return G__10904
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
  var args__10947 = cljs.core.seq.call(null, args);
  if(argc === 0) {
    return f.call(null)
  }else {
    var a__10948 = cljs.core._first.call(null, args__10947);
    var args__10949 = cljs.core._rest.call(null, args__10947);
    if(argc === 1) {
      if(f.cljs$lang$arity$1) {
        return f.cljs$lang$arity$1(a__10948)
      }else {
        return f.call(null, a__10948)
      }
    }else {
      var b__10950 = cljs.core._first.call(null, args__10949);
      var args__10951 = cljs.core._rest.call(null, args__10949);
      if(argc === 2) {
        if(f.cljs$lang$arity$2) {
          return f.cljs$lang$arity$2(a__10948, b__10950)
        }else {
          return f.call(null, a__10948, b__10950)
        }
      }else {
        var c__10952 = cljs.core._first.call(null, args__10951);
        var args__10953 = cljs.core._rest.call(null, args__10951);
        if(argc === 3) {
          if(f.cljs$lang$arity$3) {
            return f.cljs$lang$arity$3(a__10948, b__10950, c__10952)
          }else {
            return f.call(null, a__10948, b__10950, c__10952)
          }
        }else {
          var d__10954 = cljs.core._first.call(null, args__10953);
          var args__10955 = cljs.core._rest.call(null, args__10953);
          if(argc === 4) {
            if(f.cljs$lang$arity$4) {
              return f.cljs$lang$arity$4(a__10948, b__10950, c__10952, d__10954)
            }else {
              return f.call(null, a__10948, b__10950, c__10952, d__10954)
            }
          }else {
            var e__10956 = cljs.core._first.call(null, args__10955);
            var args__10957 = cljs.core._rest.call(null, args__10955);
            if(argc === 5) {
              if(f.cljs$lang$arity$5) {
                return f.cljs$lang$arity$5(a__10948, b__10950, c__10952, d__10954, e__10956)
              }else {
                return f.call(null, a__10948, b__10950, c__10952, d__10954, e__10956)
              }
            }else {
              var f__10958 = cljs.core._first.call(null, args__10957);
              var args__10959 = cljs.core._rest.call(null, args__10957);
              if(argc === 6) {
                if(f__10958.cljs$lang$arity$6) {
                  return f__10958.cljs$lang$arity$6(a__10948, b__10950, c__10952, d__10954, e__10956, f__10958)
                }else {
                  return f__10958.call(null, a__10948, b__10950, c__10952, d__10954, e__10956, f__10958)
                }
              }else {
                var g__10960 = cljs.core._first.call(null, args__10959);
                var args__10961 = cljs.core._rest.call(null, args__10959);
                if(argc === 7) {
                  if(f__10958.cljs$lang$arity$7) {
                    return f__10958.cljs$lang$arity$7(a__10948, b__10950, c__10952, d__10954, e__10956, f__10958, g__10960)
                  }else {
                    return f__10958.call(null, a__10948, b__10950, c__10952, d__10954, e__10956, f__10958, g__10960)
                  }
                }else {
                  var h__10962 = cljs.core._first.call(null, args__10961);
                  var args__10963 = cljs.core._rest.call(null, args__10961);
                  if(argc === 8) {
                    if(f__10958.cljs$lang$arity$8) {
                      return f__10958.cljs$lang$arity$8(a__10948, b__10950, c__10952, d__10954, e__10956, f__10958, g__10960, h__10962)
                    }else {
                      return f__10958.call(null, a__10948, b__10950, c__10952, d__10954, e__10956, f__10958, g__10960, h__10962)
                    }
                  }else {
                    var i__10964 = cljs.core._first.call(null, args__10963);
                    var args__10965 = cljs.core._rest.call(null, args__10963);
                    if(argc === 9) {
                      if(f__10958.cljs$lang$arity$9) {
                        return f__10958.cljs$lang$arity$9(a__10948, b__10950, c__10952, d__10954, e__10956, f__10958, g__10960, h__10962, i__10964)
                      }else {
                        return f__10958.call(null, a__10948, b__10950, c__10952, d__10954, e__10956, f__10958, g__10960, h__10962, i__10964)
                      }
                    }else {
                      var j__10966 = cljs.core._first.call(null, args__10965);
                      var args__10967 = cljs.core._rest.call(null, args__10965);
                      if(argc === 10) {
                        if(f__10958.cljs$lang$arity$10) {
                          return f__10958.cljs$lang$arity$10(a__10948, b__10950, c__10952, d__10954, e__10956, f__10958, g__10960, h__10962, i__10964, j__10966)
                        }else {
                          return f__10958.call(null, a__10948, b__10950, c__10952, d__10954, e__10956, f__10958, g__10960, h__10962, i__10964, j__10966)
                        }
                      }else {
                        var k__10968 = cljs.core._first.call(null, args__10967);
                        var args__10969 = cljs.core._rest.call(null, args__10967);
                        if(argc === 11) {
                          if(f__10958.cljs$lang$arity$11) {
                            return f__10958.cljs$lang$arity$11(a__10948, b__10950, c__10952, d__10954, e__10956, f__10958, g__10960, h__10962, i__10964, j__10966, k__10968)
                          }else {
                            return f__10958.call(null, a__10948, b__10950, c__10952, d__10954, e__10956, f__10958, g__10960, h__10962, i__10964, j__10966, k__10968)
                          }
                        }else {
                          var l__10970 = cljs.core._first.call(null, args__10969);
                          var args__10971 = cljs.core._rest.call(null, args__10969);
                          if(argc === 12) {
                            if(f__10958.cljs$lang$arity$12) {
                              return f__10958.cljs$lang$arity$12(a__10948, b__10950, c__10952, d__10954, e__10956, f__10958, g__10960, h__10962, i__10964, j__10966, k__10968, l__10970)
                            }else {
                              return f__10958.call(null, a__10948, b__10950, c__10952, d__10954, e__10956, f__10958, g__10960, h__10962, i__10964, j__10966, k__10968, l__10970)
                            }
                          }else {
                            var m__10972 = cljs.core._first.call(null, args__10971);
                            var args__10973 = cljs.core._rest.call(null, args__10971);
                            if(argc === 13) {
                              if(f__10958.cljs$lang$arity$13) {
                                return f__10958.cljs$lang$arity$13(a__10948, b__10950, c__10952, d__10954, e__10956, f__10958, g__10960, h__10962, i__10964, j__10966, k__10968, l__10970, m__10972)
                              }else {
                                return f__10958.call(null, a__10948, b__10950, c__10952, d__10954, e__10956, f__10958, g__10960, h__10962, i__10964, j__10966, k__10968, l__10970, m__10972)
                              }
                            }else {
                              var n__10974 = cljs.core._first.call(null, args__10973);
                              var args__10975 = cljs.core._rest.call(null, args__10973);
                              if(argc === 14) {
                                if(f__10958.cljs$lang$arity$14) {
                                  return f__10958.cljs$lang$arity$14(a__10948, b__10950, c__10952, d__10954, e__10956, f__10958, g__10960, h__10962, i__10964, j__10966, k__10968, l__10970, m__10972, n__10974)
                                }else {
                                  return f__10958.call(null, a__10948, b__10950, c__10952, d__10954, e__10956, f__10958, g__10960, h__10962, i__10964, j__10966, k__10968, l__10970, m__10972, n__10974)
                                }
                              }else {
                                var o__10976 = cljs.core._first.call(null, args__10975);
                                var args__10977 = cljs.core._rest.call(null, args__10975);
                                if(argc === 15) {
                                  if(f__10958.cljs$lang$arity$15) {
                                    return f__10958.cljs$lang$arity$15(a__10948, b__10950, c__10952, d__10954, e__10956, f__10958, g__10960, h__10962, i__10964, j__10966, k__10968, l__10970, m__10972, n__10974, o__10976)
                                  }else {
                                    return f__10958.call(null, a__10948, b__10950, c__10952, d__10954, e__10956, f__10958, g__10960, h__10962, i__10964, j__10966, k__10968, l__10970, m__10972, n__10974, o__10976)
                                  }
                                }else {
                                  var p__10978 = cljs.core._first.call(null, args__10977);
                                  var args__10979 = cljs.core._rest.call(null, args__10977);
                                  if(argc === 16) {
                                    if(f__10958.cljs$lang$arity$16) {
                                      return f__10958.cljs$lang$arity$16(a__10948, b__10950, c__10952, d__10954, e__10956, f__10958, g__10960, h__10962, i__10964, j__10966, k__10968, l__10970, m__10972, n__10974, o__10976, p__10978)
                                    }else {
                                      return f__10958.call(null, a__10948, b__10950, c__10952, d__10954, e__10956, f__10958, g__10960, h__10962, i__10964, j__10966, k__10968, l__10970, m__10972, n__10974, o__10976, p__10978)
                                    }
                                  }else {
                                    var q__10980 = cljs.core._first.call(null, args__10979);
                                    var args__10981 = cljs.core._rest.call(null, args__10979);
                                    if(argc === 17) {
                                      if(f__10958.cljs$lang$arity$17) {
                                        return f__10958.cljs$lang$arity$17(a__10948, b__10950, c__10952, d__10954, e__10956, f__10958, g__10960, h__10962, i__10964, j__10966, k__10968, l__10970, m__10972, n__10974, o__10976, p__10978, q__10980)
                                      }else {
                                        return f__10958.call(null, a__10948, b__10950, c__10952, d__10954, e__10956, f__10958, g__10960, h__10962, i__10964, j__10966, k__10968, l__10970, m__10972, n__10974, o__10976, p__10978, q__10980)
                                      }
                                    }else {
                                      var r__10982 = cljs.core._first.call(null, args__10981);
                                      var args__10983 = cljs.core._rest.call(null, args__10981);
                                      if(argc === 18) {
                                        if(f__10958.cljs$lang$arity$18) {
                                          return f__10958.cljs$lang$arity$18(a__10948, b__10950, c__10952, d__10954, e__10956, f__10958, g__10960, h__10962, i__10964, j__10966, k__10968, l__10970, m__10972, n__10974, o__10976, p__10978, q__10980, r__10982)
                                        }else {
                                          return f__10958.call(null, a__10948, b__10950, c__10952, d__10954, e__10956, f__10958, g__10960, h__10962, i__10964, j__10966, k__10968, l__10970, m__10972, n__10974, o__10976, p__10978, q__10980, r__10982)
                                        }
                                      }else {
                                        var s__10984 = cljs.core._first.call(null, args__10983);
                                        var args__10985 = cljs.core._rest.call(null, args__10983);
                                        if(argc === 19) {
                                          if(f__10958.cljs$lang$arity$19) {
                                            return f__10958.cljs$lang$arity$19(a__10948, b__10950, c__10952, d__10954, e__10956, f__10958, g__10960, h__10962, i__10964, j__10966, k__10968, l__10970, m__10972, n__10974, o__10976, p__10978, q__10980, r__10982, s__10984)
                                          }else {
                                            return f__10958.call(null, a__10948, b__10950, c__10952, d__10954, e__10956, f__10958, g__10960, h__10962, i__10964, j__10966, k__10968, l__10970, m__10972, n__10974, o__10976, p__10978, q__10980, r__10982, s__10984)
                                          }
                                        }else {
                                          var t__10986 = cljs.core._first.call(null, args__10985);
                                          var args__10987 = cljs.core._rest.call(null, args__10985);
                                          if(argc === 20) {
                                            if(f__10958.cljs$lang$arity$20) {
                                              return f__10958.cljs$lang$arity$20(a__10948, b__10950, c__10952, d__10954, e__10956, f__10958, g__10960, h__10962, i__10964, j__10966, k__10968, l__10970, m__10972, n__10974, o__10976, p__10978, q__10980, r__10982, s__10984, t__10986)
                                            }else {
                                              return f__10958.call(null, a__10948, b__10950, c__10952, d__10954, e__10956, f__10958, g__10960, h__10962, i__10964, j__10966, k__10968, l__10970, m__10972, n__10974, o__10976, p__10978, q__10980, r__10982, s__10984, t__10986)
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
    var fixed_arity__11002 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__11003 = cljs.core.bounded_count.call(null, args, fixed_arity__11002 + 1);
      if(bc__11003 <= fixed_arity__11002) {
        return cljs.core.apply_to.call(null, f, bc__11003, args)
      }else {
        return f.cljs$lang$applyTo(args)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, args))
    }
  };
  var apply__3 = function(f, x, args) {
    var arglist__11004 = cljs.core.list_STAR_.call(null, x, args);
    var fixed_arity__11005 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__11006 = cljs.core.bounded_count.call(null, arglist__11004, fixed_arity__11005 + 1);
      if(bc__11006 <= fixed_arity__11005) {
        return cljs.core.apply_to.call(null, f, bc__11006, arglist__11004)
      }else {
        return f.cljs$lang$applyTo(arglist__11004)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__11004))
    }
  };
  var apply__4 = function(f, x, y, args) {
    var arglist__11007 = cljs.core.list_STAR_.call(null, x, y, args);
    var fixed_arity__11008 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__11009 = cljs.core.bounded_count.call(null, arglist__11007, fixed_arity__11008 + 1);
      if(bc__11009 <= fixed_arity__11008) {
        return cljs.core.apply_to.call(null, f, bc__11009, arglist__11007)
      }else {
        return f.cljs$lang$applyTo(arglist__11007)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__11007))
    }
  };
  var apply__5 = function(f, x, y, z, args) {
    var arglist__11010 = cljs.core.list_STAR_.call(null, x, y, z, args);
    var fixed_arity__11011 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__11012 = cljs.core.bounded_count.call(null, arglist__11010, fixed_arity__11011 + 1);
      if(bc__11012 <= fixed_arity__11011) {
        return cljs.core.apply_to.call(null, f, bc__11012, arglist__11010)
      }else {
        return f.cljs$lang$applyTo(arglist__11010)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__11010))
    }
  };
  var apply__6 = function() {
    var G__11016__delegate = function(f, a, b, c, d, args) {
      var arglist__11013 = cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, args)))));
      var fixed_arity__11014 = f.cljs$lang$maxFixedArity;
      if(cljs.core.truth_(f.cljs$lang$applyTo)) {
        var bc__11015 = cljs.core.bounded_count.call(null, arglist__11013, fixed_arity__11014 + 1);
        if(bc__11015 <= fixed_arity__11014) {
          return cljs.core.apply_to.call(null, f, bc__11015, arglist__11013)
        }else {
          return f.cljs$lang$applyTo(arglist__11013)
        }
      }else {
        return f.apply(f, cljs.core.to_array.call(null, arglist__11013))
      }
    };
    var G__11016 = function(f, a, b, c, d, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__11016__delegate.call(this, f, a, b, c, d, args)
    };
    G__11016.cljs$lang$maxFixedArity = 5;
    G__11016.cljs$lang$applyTo = function(arglist__11017) {
      var f = cljs.core.first(arglist__11017);
      var a = cljs.core.first(cljs.core.next(arglist__11017));
      var b = cljs.core.first(cljs.core.next(cljs.core.next(arglist__11017)));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__11017))));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__11017)))));
      var args = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__11017)))));
      return G__11016__delegate(f, a, b, c, d, args)
    };
    G__11016.cljs$lang$arity$variadic = G__11016__delegate;
    return G__11016
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
  vary_meta.cljs$lang$applyTo = function(arglist__11018) {
    var obj = cljs.core.first(arglist__11018);
    var f = cljs.core.first(cljs.core.next(arglist__11018));
    var args = cljs.core.rest(cljs.core.next(arglist__11018));
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
    var G__11019__delegate = function(x, y, more) {
      return cljs.core.not.call(null, cljs.core.apply.call(null, cljs.core._EQ_, x, y, more))
    };
    var G__11019 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__11019__delegate.call(this, x, y, more)
    };
    G__11019.cljs$lang$maxFixedArity = 2;
    G__11019.cljs$lang$applyTo = function(arglist__11020) {
      var x = cljs.core.first(arglist__11020);
      var y = cljs.core.first(cljs.core.next(arglist__11020));
      var more = cljs.core.rest(cljs.core.next(arglist__11020));
      return G__11019__delegate(x, y, more)
    };
    G__11019.cljs$lang$arity$variadic = G__11019__delegate;
    return G__11019
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
        var G__11021 = pred;
        var G__11022 = cljs.core.next.call(null, coll);
        pred = G__11021;
        coll = G__11022;
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
      var or__3943__auto____11024 = pred.call(null, cljs.core.first.call(null, coll));
      if(cljs.core.truth_(or__3943__auto____11024)) {
        return or__3943__auto____11024
      }else {
        var G__11025 = pred;
        var G__11026 = cljs.core.next.call(null, coll);
        pred = G__11025;
        coll = G__11026;
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
    var G__11027 = null;
    var G__11027__0 = function() {
      return cljs.core.not.call(null, f.call(null))
    };
    var G__11027__1 = function(x) {
      return cljs.core.not.call(null, f.call(null, x))
    };
    var G__11027__2 = function(x, y) {
      return cljs.core.not.call(null, f.call(null, x, y))
    };
    var G__11027__3 = function() {
      var G__11028__delegate = function(x, y, zs) {
        return cljs.core.not.call(null, cljs.core.apply.call(null, f, x, y, zs))
      };
      var G__11028 = function(x, y, var_args) {
        var zs = null;
        if(goog.isDef(var_args)) {
          zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
        }
        return G__11028__delegate.call(this, x, y, zs)
      };
      G__11028.cljs$lang$maxFixedArity = 2;
      G__11028.cljs$lang$applyTo = function(arglist__11029) {
        var x = cljs.core.first(arglist__11029);
        var y = cljs.core.first(cljs.core.next(arglist__11029));
        var zs = cljs.core.rest(cljs.core.next(arglist__11029));
        return G__11028__delegate(x, y, zs)
      };
      G__11028.cljs$lang$arity$variadic = G__11028__delegate;
      return G__11028
    }();
    G__11027 = function(x, y, var_args) {
      var zs = var_args;
      switch(arguments.length) {
        case 0:
          return G__11027__0.call(this);
        case 1:
          return G__11027__1.call(this, x);
        case 2:
          return G__11027__2.call(this, x, y);
        default:
          return G__11027__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
      }
      throw"Invalid arity: " + arguments.length;
    };
    G__11027.cljs$lang$maxFixedArity = 2;
    G__11027.cljs$lang$applyTo = G__11027__3.cljs$lang$applyTo;
    return G__11027
  }()
};
cljs.core.constantly = function constantly(x) {
  return function() {
    var G__11030__delegate = function(args) {
      return x
    };
    var G__11030 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__11030__delegate.call(this, args)
    };
    G__11030.cljs$lang$maxFixedArity = 0;
    G__11030.cljs$lang$applyTo = function(arglist__11031) {
      var args = cljs.core.seq(arglist__11031);
      return G__11030__delegate(args)
    };
    G__11030.cljs$lang$arity$variadic = G__11030__delegate;
    return G__11030
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
      var G__11038 = null;
      var G__11038__0 = function() {
        return f.call(null, g.call(null))
      };
      var G__11038__1 = function(x) {
        return f.call(null, g.call(null, x))
      };
      var G__11038__2 = function(x, y) {
        return f.call(null, g.call(null, x, y))
      };
      var G__11038__3 = function(x, y, z) {
        return f.call(null, g.call(null, x, y, z))
      };
      var G__11038__4 = function() {
        var G__11039__delegate = function(x, y, z, args) {
          return f.call(null, cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__11039 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__11039__delegate.call(this, x, y, z, args)
        };
        G__11039.cljs$lang$maxFixedArity = 3;
        G__11039.cljs$lang$applyTo = function(arglist__11040) {
          var x = cljs.core.first(arglist__11040);
          var y = cljs.core.first(cljs.core.next(arglist__11040));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__11040)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__11040)));
          return G__11039__delegate(x, y, z, args)
        };
        G__11039.cljs$lang$arity$variadic = G__11039__delegate;
        return G__11039
      }();
      G__11038 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__11038__0.call(this);
          case 1:
            return G__11038__1.call(this, x);
          case 2:
            return G__11038__2.call(this, x, y);
          case 3:
            return G__11038__3.call(this, x, y, z);
          default:
            return G__11038__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__11038.cljs$lang$maxFixedArity = 3;
      G__11038.cljs$lang$applyTo = G__11038__4.cljs$lang$applyTo;
      return G__11038
    }()
  };
  var comp__3 = function(f, g, h) {
    return function() {
      var G__11041 = null;
      var G__11041__0 = function() {
        return f.call(null, g.call(null, h.call(null)))
      };
      var G__11041__1 = function(x) {
        return f.call(null, g.call(null, h.call(null, x)))
      };
      var G__11041__2 = function(x, y) {
        return f.call(null, g.call(null, h.call(null, x, y)))
      };
      var G__11041__3 = function(x, y, z) {
        return f.call(null, g.call(null, h.call(null, x, y, z)))
      };
      var G__11041__4 = function() {
        var G__11042__delegate = function(x, y, z, args) {
          return f.call(null, g.call(null, cljs.core.apply.call(null, h, x, y, z, args)))
        };
        var G__11042 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__11042__delegate.call(this, x, y, z, args)
        };
        G__11042.cljs$lang$maxFixedArity = 3;
        G__11042.cljs$lang$applyTo = function(arglist__11043) {
          var x = cljs.core.first(arglist__11043);
          var y = cljs.core.first(cljs.core.next(arglist__11043));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__11043)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__11043)));
          return G__11042__delegate(x, y, z, args)
        };
        G__11042.cljs$lang$arity$variadic = G__11042__delegate;
        return G__11042
      }();
      G__11041 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__11041__0.call(this);
          case 1:
            return G__11041__1.call(this, x);
          case 2:
            return G__11041__2.call(this, x, y);
          case 3:
            return G__11041__3.call(this, x, y, z);
          default:
            return G__11041__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__11041.cljs$lang$maxFixedArity = 3;
      G__11041.cljs$lang$applyTo = G__11041__4.cljs$lang$applyTo;
      return G__11041
    }()
  };
  var comp__4 = function() {
    var G__11044__delegate = function(f1, f2, f3, fs) {
      var fs__11035 = cljs.core.reverse.call(null, cljs.core.list_STAR_.call(null, f1, f2, f3, fs));
      return function() {
        var G__11045__delegate = function(args) {
          var ret__11036 = cljs.core.apply.call(null, cljs.core.first.call(null, fs__11035), args);
          var fs__11037 = cljs.core.next.call(null, fs__11035);
          while(true) {
            if(fs__11037) {
              var G__11046 = cljs.core.first.call(null, fs__11037).call(null, ret__11036);
              var G__11047 = cljs.core.next.call(null, fs__11037);
              ret__11036 = G__11046;
              fs__11037 = G__11047;
              continue
            }else {
              return ret__11036
            }
            break
          }
        };
        var G__11045 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__11045__delegate.call(this, args)
        };
        G__11045.cljs$lang$maxFixedArity = 0;
        G__11045.cljs$lang$applyTo = function(arglist__11048) {
          var args = cljs.core.seq(arglist__11048);
          return G__11045__delegate(args)
        };
        G__11045.cljs$lang$arity$variadic = G__11045__delegate;
        return G__11045
      }()
    };
    var G__11044 = function(f1, f2, f3, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__11044__delegate.call(this, f1, f2, f3, fs)
    };
    G__11044.cljs$lang$maxFixedArity = 3;
    G__11044.cljs$lang$applyTo = function(arglist__11049) {
      var f1 = cljs.core.first(arglist__11049);
      var f2 = cljs.core.first(cljs.core.next(arglist__11049));
      var f3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__11049)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__11049)));
      return G__11044__delegate(f1, f2, f3, fs)
    };
    G__11044.cljs$lang$arity$variadic = G__11044__delegate;
    return G__11044
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
      var G__11050__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, args)
      };
      var G__11050 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__11050__delegate.call(this, args)
      };
      G__11050.cljs$lang$maxFixedArity = 0;
      G__11050.cljs$lang$applyTo = function(arglist__11051) {
        var args = cljs.core.seq(arglist__11051);
        return G__11050__delegate(args)
      };
      G__11050.cljs$lang$arity$variadic = G__11050__delegate;
      return G__11050
    }()
  };
  var partial__3 = function(f, arg1, arg2) {
    return function() {
      var G__11052__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, args)
      };
      var G__11052 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__11052__delegate.call(this, args)
      };
      G__11052.cljs$lang$maxFixedArity = 0;
      G__11052.cljs$lang$applyTo = function(arglist__11053) {
        var args = cljs.core.seq(arglist__11053);
        return G__11052__delegate(args)
      };
      G__11052.cljs$lang$arity$variadic = G__11052__delegate;
      return G__11052
    }()
  };
  var partial__4 = function(f, arg1, arg2, arg3) {
    return function() {
      var G__11054__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, arg3, args)
      };
      var G__11054 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__11054__delegate.call(this, args)
      };
      G__11054.cljs$lang$maxFixedArity = 0;
      G__11054.cljs$lang$applyTo = function(arglist__11055) {
        var args = cljs.core.seq(arglist__11055);
        return G__11054__delegate(args)
      };
      G__11054.cljs$lang$arity$variadic = G__11054__delegate;
      return G__11054
    }()
  };
  var partial__5 = function() {
    var G__11056__delegate = function(f, arg1, arg2, arg3, more) {
      return function() {
        var G__11057__delegate = function(args) {
          return cljs.core.apply.call(null, f, arg1, arg2, arg3, cljs.core.concat.call(null, more, args))
        };
        var G__11057 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__11057__delegate.call(this, args)
        };
        G__11057.cljs$lang$maxFixedArity = 0;
        G__11057.cljs$lang$applyTo = function(arglist__11058) {
          var args = cljs.core.seq(arglist__11058);
          return G__11057__delegate(args)
        };
        G__11057.cljs$lang$arity$variadic = G__11057__delegate;
        return G__11057
      }()
    };
    var G__11056 = function(f, arg1, arg2, arg3, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__11056__delegate.call(this, f, arg1, arg2, arg3, more)
    };
    G__11056.cljs$lang$maxFixedArity = 4;
    G__11056.cljs$lang$applyTo = function(arglist__11059) {
      var f = cljs.core.first(arglist__11059);
      var arg1 = cljs.core.first(cljs.core.next(arglist__11059));
      var arg2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__11059)));
      var arg3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__11059))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__11059))));
      return G__11056__delegate(f, arg1, arg2, arg3, more)
    };
    G__11056.cljs$lang$arity$variadic = G__11056__delegate;
    return G__11056
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
      var G__11060 = null;
      var G__11060__1 = function(a) {
        return f.call(null, a == null ? x : a)
      };
      var G__11060__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b)
      };
      var G__11060__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b, c)
      };
      var G__11060__4 = function() {
        var G__11061__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b, c, ds)
        };
        var G__11061 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__11061__delegate.call(this, a, b, c, ds)
        };
        G__11061.cljs$lang$maxFixedArity = 3;
        G__11061.cljs$lang$applyTo = function(arglist__11062) {
          var a = cljs.core.first(arglist__11062);
          var b = cljs.core.first(cljs.core.next(arglist__11062));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__11062)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__11062)));
          return G__11061__delegate(a, b, c, ds)
        };
        G__11061.cljs$lang$arity$variadic = G__11061__delegate;
        return G__11061
      }();
      G__11060 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 1:
            return G__11060__1.call(this, a);
          case 2:
            return G__11060__2.call(this, a, b);
          case 3:
            return G__11060__3.call(this, a, b, c);
          default:
            return G__11060__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__11060.cljs$lang$maxFixedArity = 3;
      G__11060.cljs$lang$applyTo = G__11060__4.cljs$lang$applyTo;
      return G__11060
    }()
  };
  var fnil__3 = function(f, x, y) {
    return function() {
      var G__11063 = null;
      var G__11063__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__11063__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c)
      };
      var G__11063__4 = function() {
        var G__11064__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c, ds)
        };
        var G__11064 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__11064__delegate.call(this, a, b, c, ds)
        };
        G__11064.cljs$lang$maxFixedArity = 3;
        G__11064.cljs$lang$applyTo = function(arglist__11065) {
          var a = cljs.core.first(arglist__11065);
          var b = cljs.core.first(cljs.core.next(arglist__11065));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__11065)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__11065)));
          return G__11064__delegate(a, b, c, ds)
        };
        G__11064.cljs$lang$arity$variadic = G__11064__delegate;
        return G__11064
      }();
      G__11063 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__11063__2.call(this, a, b);
          case 3:
            return G__11063__3.call(this, a, b, c);
          default:
            return G__11063__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__11063.cljs$lang$maxFixedArity = 3;
      G__11063.cljs$lang$applyTo = G__11063__4.cljs$lang$applyTo;
      return G__11063
    }()
  };
  var fnil__4 = function(f, x, y, z) {
    return function() {
      var G__11066 = null;
      var G__11066__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__11066__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c == null ? z : c)
      };
      var G__11066__4 = function() {
        var G__11067__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c == null ? z : c, ds)
        };
        var G__11067 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__11067__delegate.call(this, a, b, c, ds)
        };
        G__11067.cljs$lang$maxFixedArity = 3;
        G__11067.cljs$lang$applyTo = function(arglist__11068) {
          var a = cljs.core.first(arglist__11068);
          var b = cljs.core.first(cljs.core.next(arglist__11068));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__11068)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__11068)));
          return G__11067__delegate(a, b, c, ds)
        };
        G__11067.cljs$lang$arity$variadic = G__11067__delegate;
        return G__11067
      }();
      G__11066 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__11066__2.call(this, a, b);
          case 3:
            return G__11066__3.call(this, a, b, c);
          default:
            return G__11066__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__11066.cljs$lang$maxFixedArity = 3;
      G__11066.cljs$lang$applyTo = G__11066__4.cljs$lang$applyTo;
      return G__11066
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
  var mapi__11084 = function mapi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__4092__auto____11092 = cljs.core.seq.call(null, coll);
      if(temp__4092__auto____11092) {
        var s__11093 = temp__4092__auto____11092;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__11093)) {
          var c__11094 = cljs.core.chunk_first.call(null, s__11093);
          var size__11095 = cljs.core.count.call(null, c__11094);
          var b__11096 = cljs.core.chunk_buffer.call(null, size__11095);
          var n__2468__auto____11097 = size__11095;
          var i__11098 = 0;
          while(true) {
            if(i__11098 < n__2468__auto____11097) {
              cljs.core.chunk_append.call(null, b__11096, f.call(null, idx + i__11098, cljs.core._nth.call(null, c__11094, i__11098)));
              var G__11099 = i__11098 + 1;
              i__11098 = G__11099;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__11096), mapi.call(null, idx + size__11095, cljs.core.chunk_rest.call(null, s__11093)))
        }else {
          return cljs.core.cons.call(null, f.call(null, idx, cljs.core.first.call(null, s__11093)), mapi.call(null, idx + 1, cljs.core.rest.call(null, s__11093)))
        }
      }else {
        return null
      }
    }, null)
  };
  return mapi__11084.call(null, 0, coll)
};
cljs.core.keep = function keep(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__4092__auto____11109 = cljs.core.seq.call(null, coll);
    if(temp__4092__auto____11109) {
      var s__11110 = temp__4092__auto____11109;
      if(cljs.core.chunked_seq_QMARK_.call(null, s__11110)) {
        var c__11111 = cljs.core.chunk_first.call(null, s__11110);
        var size__11112 = cljs.core.count.call(null, c__11111);
        var b__11113 = cljs.core.chunk_buffer.call(null, size__11112);
        var n__2468__auto____11114 = size__11112;
        var i__11115 = 0;
        while(true) {
          if(i__11115 < n__2468__auto____11114) {
            var x__11116 = f.call(null, cljs.core._nth.call(null, c__11111, i__11115));
            if(x__11116 == null) {
            }else {
              cljs.core.chunk_append.call(null, b__11113, x__11116)
            }
            var G__11118 = i__11115 + 1;
            i__11115 = G__11118;
            continue
          }else {
          }
          break
        }
        return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__11113), keep.call(null, f, cljs.core.chunk_rest.call(null, s__11110)))
      }else {
        var x__11117 = f.call(null, cljs.core.first.call(null, s__11110));
        if(x__11117 == null) {
          return keep.call(null, f, cljs.core.rest.call(null, s__11110))
        }else {
          return cljs.core.cons.call(null, x__11117, keep.call(null, f, cljs.core.rest.call(null, s__11110)))
        }
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.keep_indexed = function keep_indexed(f, coll) {
  var keepi__11144 = function keepi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__4092__auto____11154 = cljs.core.seq.call(null, coll);
      if(temp__4092__auto____11154) {
        var s__11155 = temp__4092__auto____11154;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__11155)) {
          var c__11156 = cljs.core.chunk_first.call(null, s__11155);
          var size__11157 = cljs.core.count.call(null, c__11156);
          var b__11158 = cljs.core.chunk_buffer.call(null, size__11157);
          var n__2468__auto____11159 = size__11157;
          var i__11160 = 0;
          while(true) {
            if(i__11160 < n__2468__auto____11159) {
              var x__11161 = f.call(null, idx + i__11160, cljs.core._nth.call(null, c__11156, i__11160));
              if(x__11161 == null) {
              }else {
                cljs.core.chunk_append.call(null, b__11158, x__11161)
              }
              var G__11163 = i__11160 + 1;
              i__11160 = G__11163;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__11158), keepi.call(null, idx + size__11157, cljs.core.chunk_rest.call(null, s__11155)))
        }else {
          var x__11162 = f.call(null, idx, cljs.core.first.call(null, s__11155));
          if(x__11162 == null) {
            return keepi.call(null, idx + 1, cljs.core.rest.call(null, s__11155))
          }else {
            return cljs.core.cons.call(null, x__11162, keepi.call(null, idx + 1, cljs.core.rest.call(null, s__11155)))
          }
        }
      }else {
        return null
      }
    }, null)
  };
  return keepi__11144.call(null, 0, coll)
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
          var and__3941__auto____11249 = p.call(null, x);
          if(cljs.core.truth_(and__3941__auto____11249)) {
            return p.call(null, y)
          }else {
            return and__3941__auto____11249
          }
        }())
      };
      var ep1__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3941__auto____11250 = p.call(null, x);
          if(cljs.core.truth_(and__3941__auto____11250)) {
            var and__3941__auto____11251 = p.call(null, y);
            if(cljs.core.truth_(and__3941__auto____11251)) {
              return p.call(null, z)
            }else {
              return and__3941__auto____11251
            }
          }else {
            return and__3941__auto____11250
          }
        }())
      };
      var ep1__4 = function() {
        var G__11320__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3941__auto____11252 = ep1.call(null, x, y, z);
            if(cljs.core.truth_(and__3941__auto____11252)) {
              return cljs.core.every_QMARK_.call(null, p, args)
            }else {
              return and__3941__auto____11252
            }
          }())
        };
        var G__11320 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__11320__delegate.call(this, x, y, z, args)
        };
        G__11320.cljs$lang$maxFixedArity = 3;
        G__11320.cljs$lang$applyTo = function(arglist__11321) {
          var x = cljs.core.first(arglist__11321);
          var y = cljs.core.first(cljs.core.next(arglist__11321));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__11321)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__11321)));
          return G__11320__delegate(x, y, z, args)
        };
        G__11320.cljs$lang$arity$variadic = G__11320__delegate;
        return G__11320
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
          var and__3941__auto____11264 = p1.call(null, x);
          if(cljs.core.truth_(and__3941__auto____11264)) {
            return p2.call(null, x)
          }else {
            return and__3941__auto____11264
          }
        }())
      };
      var ep2__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3941__auto____11265 = p1.call(null, x);
          if(cljs.core.truth_(and__3941__auto____11265)) {
            var and__3941__auto____11266 = p1.call(null, y);
            if(cljs.core.truth_(and__3941__auto____11266)) {
              var and__3941__auto____11267 = p2.call(null, x);
              if(cljs.core.truth_(and__3941__auto____11267)) {
                return p2.call(null, y)
              }else {
                return and__3941__auto____11267
              }
            }else {
              return and__3941__auto____11266
            }
          }else {
            return and__3941__auto____11265
          }
        }())
      };
      var ep2__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3941__auto____11268 = p1.call(null, x);
          if(cljs.core.truth_(and__3941__auto____11268)) {
            var and__3941__auto____11269 = p1.call(null, y);
            if(cljs.core.truth_(and__3941__auto____11269)) {
              var and__3941__auto____11270 = p1.call(null, z);
              if(cljs.core.truth_(and__3941__auto____11270)) {
                var and__3941__auto____11271 = p2.call(null, x);
                if(cljs.core.truth_(and__3941__auto____11271)) {
                  var and__3941__auto____11272 = p2.call(null, y);
                  if(cljs.core.truth_(and__3941__auto____11272)) {
                    return p2.call(null, z)
                  }else {
                    return and__3941__auto____11272
                  }
                }else {
                  return and__3941__auto____11271
                }
              }else {
                return and__3941__auto____11270
              }
            }else {
              return and__3941__auto____11269
            }
          }else {
            return and__3941__auto____11268
          }
        }())
      };
      var ep2__4 = function() {
        var G__11322__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3941__auto____11273 = ep2.call(null, x, y, z);
            if(cljs.core.truth_(and__3941__auto____11273)) {
              return cljs.core.every_QMARK_.call(null, function(p1__11119_SHARP_) {
                var and__3941__auto____11274 = p1.call(null, p1__11119_SHARP_);
                if(cljs.core.truth_(and__3941__auto____11274)) {
                  return p2.call(null, p1__11119_SHARP_)
                }else {
                  return and__3941__auto____11274
                }
              }, args)
            }else {
              return and__3941__auto____11273
            }
          }())
        };
        var G__11322 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__11322__delegate.call(this, x, y, z, args)
        };
        G__11322.cljs$lang$maxFixedArity = 3;
        G__11322.cljs$lang$applyTo = function(arglist__11323) {
          var x = cljs.core.first(arglist__11323);
          var y = cljs.core.first(cljs.core.next(arglist__11323));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__11323)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__11323)));
          return G__11322__delegate(x, y, z, args)
        };
        G__11322.cljs$lang$arity$variadic = G__11322__delegate;
        return G__11322
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
          var and__3941__auto____11293 = p1.call(null, x);
          if(cljs.core.truth_(and__3941__auto____11293)) {
            var and__3941__auto____11294 = p2.call(null, x);
            if(cljs.core.truth_(and__3941__auto____11294)) {
              return p3.call(null, x)
            }else {
              return and__3941__auto____11294
            }
          }else {
            return and__3941__auto____11293
          }
        }())
      };
      var ep3__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3941__auto____11295 = p1.call(null, x);
          if(cljs.core.truth_(and__3941__auto____11295)) {
            var and__3941__auto____11296 = p2.call(null, x);
            if(cljs.core.truth_(and__3941__auto____11296)) {
              var and__3941__auto____11297 = p3.call(null, x);
              if(cljs.core.truth_(and__3941__auto____11297)) {
                var and__3941__auto____11298 = p1.call(null, y);
                if(cljs.core.truth_(and__3941__auto____11298)) {
                  var and__3941__auto____11299 = p2.call(null, y);
                  if(cljs.core.truth_(and__3941__auto____11299)) {
                    return p3.call(null, y)
                  }else {
                    return and__3941__auto____11299
                  }
                }else {
                  return and__3941__auto____11298
                }
              }else {
                return and__3941__auto____11297
              }
            }else {
              return and__3941__auto____11296
            }
          }else {
            return and__3941__auto____11295
          }
        }())
      };
      var ep3__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3941__auto____11300 = p1.call(null, x);
          if(cljs.core.truth_(and__3941__auto____11300)) {
            var and__3941__auto____11301 = p2.call(null, x);
            if(cljs.core.truth_(and__3941__auto____11301)) {
              var and__3941__auto____11302 = p3.call(null, x);
              if(cljs.core.truth_(and__3941__auto____11302)) {
                var and__3941__auto____11303 = p1.call(null, y);
                if(cljs.core.truth_(and__3941__auto____11303)) {
                  var and__3941__auto____11304 = p2.call(null, y);
                  if(cljs.core.truth_(and__3941__auto____11304)) {
                    var and__3941__auto____11305 = p3.call(null, y);
                    if(cljs.core.truth_(and__3941__auto____11305)) {
                      var and__3941__auto____11306 = p1.call(null, z);
                      if(cljs.core.truth_(and__3941__auto____11306)) {
                        var and__3941__auto____11307 = p2.call(null, z);
                        if(cljs.core.truth_(and__3941__auto____11307)) {
                          return p3.call(null, z)
                        }else {
                          return and__3941__auto____11307
                        }
                      }else {
                        return and__3941__auto____11306
                      }
                    }else {
                      return and__3941__auto____11305
                    }
                  }else {
                    return and__3941__auto____11304
                  }
                }else {
                  return and__3941__auto____11303
                }
              }else {
                return and__3941__auto____11302
              }
            }else {
              return and__3941__auto____11301
            }
          }else {
            return and__3941__auto____11300
          }
        }())
      };
      var ep3__4 = function() {
        var G__11324__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3941__auto____11308 = ep3.call(null, x, y, z);
            if(cljs.core.truth_(and__3941__auto____11308)) {
              return cljs.core.every_QMARK_.call(null, function(p1__11120_SHARP_) {
                var and__3941__auto____11309 = p1.call(null, p1__11120_SHARP_);
                if(cljs.core.truth_(and__3941__auto____11309)) {
                  var and__3941__auto____11310 = p2.call(null, p1__11120_SHARP_);
                  if(cljs.core.truth_(and__3941__auto____11310)) {
                    return p3.call(null, p1__11120_SHARP_)
                  }else {
                    return and__3941__auto____11310
                  }
                }else {
                  return and__3941__auto____11309
                }
              }, args)
            }else {
              return and__3941__auto____11308
            }
          }())
        };
        var G__11324 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__11324__delegate.call(this, x, y, z, args)
        };
        G__11324.cljs$lang$maxFixedArity = 3;
        G__11324.cljs$lang$applyTo = function(arglist__11325) {
          var x = cljs.core.first(arglist__11325);
          var y = cljs.core.first(cljs.core.next(arglist__11325));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__11325)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__11325)));
          return G__11324__delegate(x, y, z, args)
        };
        G__11324.cljs$lang$arity$variadic = G__11324__delegate;
        return G__11324
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
    var G__11326__delegate = function(p1, p2, p3, ps) {
      var ps__11311 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var epn = null;
        var epn__0 = function() {
          return true
        };
        var epn__1 = function(x) {
          return cljs.core.every_QMARK_.call(null, function(p1__11121_SHARP_) {
            return p1__11121_SHARP_.call(null, x)
          }, ps__11311)
        };
        var epn__2 = function(x, y) {
          return cljs.core.every_QMARK_.call(null, function(p1__11122_SHARP_) {
            var and__3941__auto____11316 = p1__11122_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3941__auto____11316)) {
              return p1__11122_SHARP_.call(null, y)
            }else {
              return and__3941__auto____11316
            }
          }, ps__11311)
        };
        var epn__3 = function(x, y, z) {
          return cljs.core.every_QMARK_.call(null, function(p1__11123_SHARP_) {
            var and__3941__auto____11317 = p1__11123_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3941__auto____11317)) {
              var and__3941__auto____11318 = p1__11123_SHARP_.call(null, y);
              if(cljs.core.truth_(and__3941__auto____11318)) {
                return p1__11123_SHARP_.call(null, z)
              }else {
                return and__3941__auto____11318
              }
            }else {
              return and__3941__auto____11317
            }
          }, ps__11311)
        };
        var epn__4 = function() {
          var G__11327__delegate = function(x, y, z, args) {
            return cljs.core.boolean$.call(null, function() {
              var and__3941__auto____11319 = epn.call(null, x, y, z);
              if(cljs.core.truth_(and__3941__auto____11319)) {
                return cljs.core.every_QMARK_.call(null, function(p1__11124_SHARP_) {
                  return cljs.core.every_QMARK_.call(null, p1__11124_SHARP_, args)
                }, ps__11311)
              }else {
                return and__3941__auto____11319
              }
            }())
          };
          var G__11327 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__11327__delegate.call(this, x, y, z, args)
          };
          G__11327.cljs$lang$maxFixedArity = 3;
          G__11327.cljs$lang$applyTo = function(arglist__11328) {
            var x = cljs.core.first(arglist__11328);
            var y = cljs.core.first(cljs.core.next(arglist__11328));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__11328)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__11328)));
            return G__11327__delegate(x, y, z, args)
          };
          G__11327.cljs$lang$arity$variadic = G__11327__delegate;
          return G__11327
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
    var G__11326 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__11326__delegate.call(this, p1, p2, p3, ps)
    };
    G__11326.cljs$lang$maxFixedArity = 3;
    G__11326.cljs$lang$applyTo = function(arglist__11329) {
      var p1 = cljs.core.first(arglist__11329);
      var p2 = cljs.core.first(cljs.core.next(arglist__11329));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__11329)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__11329)));
      return G__11326__delegate(p1, p2, p3, ps)
    };
    G__11326.cljs$lang$arity$variadic = G__11326__delegate;
    return G__11326
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
        var or__3943__auto____11410 = p.call(null, x);
        if(cljs.core.truth_(or__3943__auto____11410)) {
          return or__3943__auto____11410
        }else {
          return p.call(null, y)
        }
      };
      var sp1__3 = function(x, y, z) {
        var or__3943__auto____11411 = p.call(null, x);
        if(cljs.core.truth_(or__3943__auto____11411)) {
          return or__3943__auto____11411
        }else {
          var or__3943__auto____11412 = p.call(null, y);
          if(cljs.core.truth_(or__3943__auto____11412)) {
            return or__3943__auto____11412
          }else {
            return p.call(null, z)
          }
        }
      };
      var sp1__4 = function() {
        var G__11481__delegate = function(x, y, z, args) {
          var or__3943__auto____11413 = sp1.call(null, x, y, z);
          if(cljs.core.truth_(or__3943__auto____11413)) {
            return or__3943__auto____11413
          }else {
            return cljs.core.some.call(null, p, args)
          }
        };
        var G__11481 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__11481__delegate.call(this, x, y, z, args)
        };
        G__11481.cljs$lang$maxFixedArity = 3;
        G__11481.cljs$lang$applyTo = function(arglist__11482) {
          var x = cljs.core.first(arglist__11482);
          var y = cljs.core.first(cljs.core.next(arglist__11482));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__11482)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__11482)));
          return G__11481__delegate(x, y, z, args)
        };
        G__11481.cljs$lang$arity$variadic = G__11481__delegate;
        return G__11481
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
        var or__3943__auto____11425 = p1.call(null, x);
        if(cljs.core.truth_(or__3943__auto____11425)) {
          return or__3943__auto____11425
        }else {
          return p2.call(null, x)
        }
      };
      var sp2__2 = function(x, y) {
        var or__3943__auto____11426 = p1.call(null, x);
        if(cljs.core.truth_(or__3943__auto____11426)) {
          return or__3943__auto____11426
        }else {
          var or__3943__auto____11427 = p1.call(null, y);
          if(cljs.core.truth_(or__3943__auto____11427)) {
            return or__3943__auto____11427
          }else {
            var or__3943__auto____11428 = p2.call(null, x);
            if(cljs.core.truth_(or__3943__auto____11428)) {
              return or__3943__auto____11428
            }else {
              return p2.call(null, y)
            }
          }
        }
      };
      var sp2__3 = function(x, y, z) {
        var or__3943__auto____11429 = p1.call(null, x);
        if(cljs.core.truth_(or__3943__auto____11429)) {
          return or__3943__auto____11429
        }else {
          var or__3943__auto____11430 = p1.call(null, y);
          if(cljs.core.truth_(or__3943__auto____11430)) {
            return or__3943__auto____11430
          }else {
            var or__3943__auto____11431 = p1.call(null, z);
            if(cljs.core.truth_(or__3943__auto____11431)) {
              return or__3943__auto____11431
            }else {
              var or__3943__auto____11432 = p2.call(null, x);
              if(cljs.core.truth_(or__3943__auto____11432)) {
                return or__3943__auto____11432
              }else {
                var or__3943__auto____11433 = p2.call(null, y);
                if(cljs.core.truth_(or__3943__auto____11433)) {
                  return or__3943__auto____11433
                }else {
                  return p2.call(null, z)
                }
              }
            }
          }
        }
      };
      var sp2__4 = function() {
        var G__11483__delegate = function(x, y, z, args) {
          var or__3943__auto____11434 = sp2.call(null, x, y, z);
          if(cljs.core.truth_(or__3943__auto____11434)) {
            return or__3943__auto____11434
          }else {
            return cljs.core.some.call(null, function(p1__11164_SHARP_) {
              var or__3943__auto____11435 = p1.call(null, p1__11164_SHARP_);
              if(cljs.core.truth_(or__3943__auto____11435)) {
                return or__3943__auto____11435
              }else {
                return p2.call(null, p1__11164_SHARP_)
              }
            }, args)
          }
        };
        var G__11483 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__11483__delegate.call(this, x, y, z, args)
        };
        G__11483.cljs$lang$maxFixedArity = 3;
        G__11483.cljs$lang$applyTo = function(arglist__11484) {
          var x = cljs.core.first(arglist__11484);
          var y = cljs.core.first(cljs.core.next(arglist__11484));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__11484)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__11484)));
          return G__11483__delegate(x, y, z, args)
        };
        G__11483.cljs$lang$arity$variadic = G__11483__delegate;
        return G__11483
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
        var or__3943__auto____11454 = p1.call(null, x);
        if(cljs.core.truth_(or__3943__auto____11454)) {
          return or__3943__auto____11454
        }else {
          var or__3943__auto____11455 = p2.call(null, x);
          if(cljs.core.truth_(or__3943__auto____11455)) {
            return or__3943__auto____11455
          }else {
            return p3.call(null, x)
          }
        }
      };
      var sp3__2 = function(x, y) {
        var or__3943__auto____11456 = p1.call(null, x);
        if(cljs.core.truth_(or__3943__auto____11456)) {
          return or__3943__auto____11456
        }else {
          var or__3943__auto____11457 = p2.call(null, x);
          if(cljs.core.truth_(or__3943__auto____11457)) {
            return or__3943__auto____11457
          }else {
            var or__3943__auto____11458 = p3.call(null, x);
            if(cljs.core.truth_(or__3943__auto____11458)) {
              return or__3943__auto____11458
            }else {
              var or__3943__auto____11459 = p1.call(null, y);
              if(cljs.core.truth_(or__3943__auto____11459)) {
                return or__3943__auto____11459
              }else {
                var or__3943__auto____11460 = p2.call(null, y);
                if(cljs.core.truth_(or__3943__auto____11460)) {
                  return or__3943__auto____11460
                }else {
                  return p3.call(null, y)
                }
              }
            }
          }
        }
      };
      var sp3__3 = function(x, y, z) {
        var or__3943__auto____11461 = p1.call(null, x);
        if(cljs.core.truth_(or__3943__auto____11461)) {
          return or__3943__auto____11461
        }else {
          var or__3943__auto____11462 = p2.call(null, x);
          if(cljs.core.truth_(or__3943__auto____11462)) {
            return or__3943__auto____11462
          }else {
            var or__3943__auto____11463 = p3.call(null, x);
            if(cljs.core.truth_(or__3943__auto____11463)) {
              return or__3943__auto____11463
            }else {
              var or__3943__auto____11464 = p1.call(null, y);
              if(cljs.core.truth_(or__3943__auto____11464)) {
                return or__3943__auto____11464
              }else {
                var or__3943__auto____11465 = p2.call(null, y);
                if(cljs.core.truth_(or__3943__auto____11465)) {
                  return or__3943__auto____11465
                }else {
                  var or__3943__auto____11466 = p3.call(null, y);
                  if(cljs.core.truth_(or__3943__auto____11466)) {
                    return or__3943__auto____11466
                  }else {
                    var or__3943__auto____11467 = p1.call(null, z);
                    if(cljs.core.truth_(or__3943__auto____11467)) {
                      return or__3943__auto____11467
                    }else {
                      var or__3943__auto____11468 = p2.call(null, z);
                      if(cljs.core.truth_(or__3943__auto____11468)) {
                        return or__3943__auto____11468
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
        var G__11485__delegate = function(x, y, z, args) {
          var or__3943__auto____11469 = sp3.call(null, x, y, z);
          if(cljs.core.truth_(or__3943__auto____11469)) {
            return or__3943__auto____11469
          }else {
            return cljs.core.some.call(null, function(p1__11165_SHARP_) {
              var or__3943__auto____11470 = p1.call(null, p1__11165_SHARP_);
              if(cljs.core.truth_(or__3943__auto____11470)) {
                return or__3943__auto____11470
              }else {
                var or__3943__auto____11471 = p2.call(null, p1__11165_SHARP_);
                if(cljs.core.truth_(or__3943__auto____11471)) {
                  return or__3943__auto____11471
                }else {
                  return p3.call(null, p1__11165_SHARP_)
                }
              }
            }, args)
          }
        };
        var G__11485 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__11485__delegate.call(this, x, y, z, args)
        };
        G__11485.cljs$lang$maxFixedArity = 3;
        G__11485.cljs$lang$applyTo = function(arglist__11486) {
          var x = cljs.core.first(arglist__11486);
          var y = cljs.core.first(cljs.core.next(arglist__11486));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__11486)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__11486)));
          return G__11485__delegate(x, y, z, args)
        };
        G__11485.cljs$lang$arity$variadic = G__11485__delegate;
        return G__11485
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
    var G__11487__delegate = function(p1, p2, p3, ps) {
      var ps__11472 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var spn = null;
        var spn__0 = function() {
          return null
        };
        var spn__1 = function(x) {
          return cljs.core.some.call(null, function(p1__11166_SHARP_) {
            return p1__11166_SHARP_.call(null, x)
          }, ps__11472)
        };
        var spn__2 = function(x, y) {
          return cljs.core.some.call(null, function(p1__11167_SHARP_) {
            var or__3943__auto____11477 = p1__11167_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3943__auto____11477)) {
              return or__3943__auto____11477
            }else {
              return p1__11167_SHARP_.call(null, y)
            }
          }, ps__11472)
        };
        var spn__3 = function(x, y, z) {
          return cljs.core.some.call(null, function(p1__11168_SHARP_) {
            var or__3943__auto____11478 = p1__11168_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3943__auto____11478)) {
              return or__3943__auto____11478
            }else {
              var or__3943__auto____11479 = p1__11168_SHARP_.call(null, y);
              if(cljs.core.truth_(or__3943__auto____11479)) {
                return or__3943__auto____11479
              }else {
                return p1__11168_SHARP_.call(null, z)
              }
            }
          }, ps__11472)
        };
        var spn__4 = function() {
          var G__11488__delegate = function(x, y, z, args) {
            var or__3943__auto____11480 = spn.call(null, x, y, z);
            if(cljs.core.truth_(or__3943__auto____11480)) {
              return or__3943__auto____11480
            }else {
              return cljs.core.some.call(null, function(p1__11169_SHARP_) {
                return cljs.core.some.call(null, p1__11169_SHARP_, args)
              }, ps__11472)
            }
          };
          var G__11488 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__11488__delegate.call(this, x, y, z, args)
          };
          G__11488.cljs$lang$maxFixedArity = 3;
          G__11488.cljs$lang$applyTo = function(arglist__11489) {
            var x = cljs.core.first(arglist__11489);
            var y = cljs.core.first(cljs.core.next(arglist__11489));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__11489)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__11489)));
            return G__11488__delegate(x, y, z, args)
          };
          G__11488.cljs$lang$arity$variadic = G__11488__delegate;
          return G__11488
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
    var G__11487 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__11487__delegate.call(this, p1, p2, p3, ps)
    };
    G__11487.cljs$lang$maxFixedArity = 3;
    G__11487.cljs$lang$applyTo = function(arglist__11490) {
      var p1 = cljs.core.first(arglist__11490);
      var p2 = cljs.core.first(cljs.core.next(arglist__11490));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__11490)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__11490)));
      return G__11487__delegate(p1, p2, p3, ps)
    };
    G__11487.cljs$lang$arity$variadic = G__11487__delegate;
    return G__11487
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
      var temp__4092__auto____11509 = cljs.core.seq.call(null, coll);
      if(temp__4092__auto____11509) {
        var s__11510 = temp__4092__auto____11509;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__11510)) {
          var c__11511 = cljs.core.chunk_first.call(null, s__11510);
          var size__11512 = cljs.core.count.call(null, c__11511);
          var b__11513 = cljs.core.chunk_buffer.call(null, size__11512);
          var n__2468__auto____11514 = size__11512;
          var i__11515 = 0;
          while(true) {
            if(i__11515 < n__2468__auto____11514) {
              cljs.core.chunk_append.call(null, b__11513, f.call(null, cljs.core._nth.call(null, c__11511, i__11515)));
              var G__11527 = i__11515 + 1;
              i__11515 = G__11527;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__11513), map.call(null, f, cljs.core.chunk_rest.call(null, s__11510)))
        }else {
          return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s__11510)), map.call(null, f, cljs.core.rest.call(null, s__11510)))
        }
      }else {
        return null
      }
    }, null)
  };
  var map__3 = function(f, c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__11516 = cljs.core.seq.call(null, c1);
      var s2__11517 = cljs.core.seq.call(null, c2);
      if(function() {
        var and__3941__auto____11518 = s1__11516;
        if(and__3941__auto____11518) {
          return s2__11517
        }else {
          return and__3941__auto____11518
        }
      }()) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__11516), cljs.core.first.call(null, s2__11517)), map.call(null, f, cljs.core.rest.call(null, s1__11516), cljs.core.rest.call(null, s2__11517)))
      }else {
        return null
      }
    }, null)
  };
  var map__4 = function(f, c1, c2, c3) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__11519 = cljs.core.seq.call(null, c1);
      var s2__11520 = cljs.core.seq.call(null, c2);
      var s3__11521 = cljs.core.seq.call(null, c3);
      if(function() {
        var and__3941__auto____11522 = s1__11519;
        if(and__3941__auto____11522) {
          var and__3941__auto____11523 = s2__11520;
          if(and__3941__auto____11523) {
            return s3__11521
          }else {
            return and__3941__auto____11523
          }
        }else {
          return and__3941__auto____11522
        }
      }()) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__11519), cljs.core.first.call(null, s2__11520), cljs.core.first.call(null, s3__11521)), map.call(null, f, cljs.core.rest.call(null, s1__11519), cljs.core.rest.call(null, s2__11520), cljs.core.rest.call(null, s3__11521)))
      }else {
        return null
      }
    }, null)
  };
  var map__5 = function() {
    var G__11528__delegate = function(f, c1, c2, c3, colls) {
      var step__11526 = function step(cs) {
        return new cljs.core.LazySeq(null, false, function() {
          var ss__11525 = map.call(null, cljs.core.seq, cs);
          if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__11525)) {
            return cljs.core.cons.call(null, map.call(null, cljs.core.first, ss__11525), step.call(null, map.call(null, cljs.core.rest, ss__11525)))
          }else {
            return null
          }
        }, null)
      };
      return map.call(null, function(p1__11330_SHARP_) {
        return cljs.core.apply.call(null, f, p1__11330_SHARP_)
      }, step__11526.call(null, cljs.core.conj.call(null, colls, c3, c2, c1)))
    };
    var G__11528 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__11528__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__11528.cljs$lang$maxFixedArity = 4;
    G__11528.cljs$lang$applyTo = function(arglist__11529) {
      var f = cljs.core.first(arglist__11529);
      var c1 = cljs.core.first(cljs.core.next(arglist__11529));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__11529)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__11529))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__11529))));
      return G__11528__delegate(f, c1, c2, c3, colls)
    };
    G__11528.cljs$lang$arity$variadic = G__11528__delegate;
    return G__11528
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
      var temp__4092__auto____11532 = cljs.core.seq.call(null, coll);
      if(temp__4092__auto____11532) {
        var s__11533 = temp__4092__auto____11532;
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__11533), take.call(null, n - 1, cljs.core.rest.call(null, s__11533)))
      }else {
        return null
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.drop = function drop(n, coll) {
  var step__11539 = function(n, coll) {
    while(true) {
      var s__11537 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3941__auto____11538 = n > 0;
        if(and__3941__auto____11538) {
          return s__11537
        }else {
          return and__3941__auto____11538
        }
      }())) {
        var G__11540 = n - 1;
        var G__11541 = cljs.core.rest.call(null, s__11537);
        n = G__11540;
        coll = G__11541;
        continue
      }else {
        return s__11537
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__11539.call(null, n, coll)
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
  var s__11544 = cljs.core.seq.call(null, coll);
  var lead__11545 = cljs.core.seq.call(null, cljs.core.drop.call(null, n, coll));
  while(true) {
    if(lead__11545) {
      var G__11546 = cljs.core.next.call(null, s__11544);
      var G__11547 = cljs.core.next.call(null, lead__11545);
      s__11544 = G__11546;
      lead__11545 = G__11547;
      continue
    }else {
      return s__11544
    }
    break
  }
};
cljs.core.drop_while = function drop_while(pred, coll) {
  var step__11553 = function(pred, coll) {
    while(true) {
      var s__11551 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3941__auto____11552 = s__11551;
        if(and__3941__auto____11552) {
          return pred.call(null, cljs.core.first.call(null, s__11551))
        }else {
          return and__3941__auto____11552
        }
      }())) {
        var G__11554 = pred;
        var G__11555 = cljs.core.rest.call(null, s__11551);
        pred = G__11554;
        coll = G__11555;
        continue
      }else {
        return s__11551
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__11553.call(null, pred, coll)
  }, null)
};
cljs.core.cycle = function cycle(coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__4092__auto____11558 = cljs.core.seq.call(null, coll);
    if(temp__4092__auto____11558) {
      var s__11559 = temp__4092__auto____11558;
      return cljs.core.concat.call(null, s__11559, cycle.call(null, s__11559))
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
      var s1__11564 = cljs.core.seq.call(null, c1);
      var s2__11565 = cljs.core.seq.call(null, c2);
      if(function() {
        var and__3941__auto____11566 = s1__11564;
        if(and__3941__auto____11566) {
          return s2__11565
        }else {
          return and__3941__auto____11566
        }
      }()) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s1__11564), cljs.core.cons.call(null, cljs.core.first.call(null, s2__11565), interleave.call(null, cljs.core.rest.call(null, s1__11564), cljs.core.rest.call(null, s2__11565))))
      }else {
        return null
      }
    }, null)
  };
  var interleave__3 = function() {
    var G__11568__delegate = function(c1, c2, colls) {
      return new cljs.core.LazySeq(null, false, function() {
        var ss__11567 = cljs.core.map.call(null, cljs.core.seq, cljs.core.conj.call(null, colls, c2, c1));
        if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__11567)) {
          return cljs.core.concat.call(null, cljs.core.map.call(null, cljs.core.first, ss__11567), cljs.core.apply.call(null, interleave, cljs.core.map.call(null, cljs.core.rest, ss__11567)))
        }else {
          return null
        }
      }, null)
    };
    var G__11568 = function(c1, c2, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__11568__delegate.call(this, c1, c2, colls)
    };
    G__11568.cljs$lang$maxFixedArity = 2;
    G__11568.cljs$lang$applyTo = function(arglist__11569) {
      var c1 = cljs.core.first(arglist__11569);
      var c2 = cljs.core.first(cljs.core.next(arglist__11569));
      var colls = cljs.core.rest(cljs.core.next(arglist__11569));
      return G__11568__delegate(c1, c2, colls)
    };
    G__11568.cljs$lang$arity$variadic = G__11568__delegate;
    return G__11568
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
  var cat__11579 = function cat(coll, colls) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__4090__auto____11577 = cljs.core.seq.call(null, coll);
      if(temp__4090__auto____11577) {
        var coll__11578 = temp__4090__auto____11577;
        return cljs.core.cons.call(null, cljs.core.first.call(null, coll__11578), cat.call(null, cljs.core.rest.call(null, coll__11578), colls))
      }else {
        if(cljs.core.seq.call(null, colls)) {
          return cat.call(null, cljs.core.first.call(null, colls), cljs.core.rest.call(null, colls))
        }else {
          return null
        }
      }
    }, null)
  };
  return cat__11579.call(null, null, colls)
};
cljs.core.mapcat = function() {
  var mapcat = null;
  var mapcat__2 = function(f, coll) {
    return cljs.core.flatten1.call(null, cljs.core.map.call(null, f, coll))
  };
  var mapcat__3 = function() {
    var G__11580__delegate = function(f, coll, colls) {
      return cljs.core.flatten1.call(null, cljs.core.apply.call(null, cljs.core.map, f, coll, colls))
    };
    var G__11580 = function(f, coll, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__11580__delegate.call(this, f, coll, colls)
    };
    G__11580.cljs$lang$maxFixedArity = 2;
    G__11580.cljs$lang$applyTo = function(arglist__11581) {
      var f = cljs.core.first(arglist__11581);
      var coll = cljs.core.first(cljs.core.next(arglist__11581));
      var colls = cljs.core.rest(cljs.core.next(arglist__11581));
      return G__11580__delegate(f, coll, colls)
    };
    G__11580.cljs$lang$arity$variadic = G__11580__delegate;
    return G__11580
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
    var temp__4092__auto____11591 = cljs.core.seq.call(null, coll);
    if(temp__4092__auto____11591) {
      var s__11592 = temp__4092__auto____11591;
      if(cljs.core.chunked_seq_QMARK_.call(null, s__11592)) {
        var c__11593 = cljs.core.chunk_first.call(null, s__11592);
        var size__11594 = cljs.core.count.call(null, c__11593);
        var b__11595 = cljs.core.chunk_buffer.call(null, size__11594);
        var n__2468__auto____11596 = size__11594;
        var i__11597 = 0;
        while(true) {
          if(i__11597 < n__2468__auto____11596) {
            if(cljs.core.truth_(pred.call(null, cljs.core._nth.call(null, c__11593, i__11597)))) {
              cljs.core.chunk_append.call(null, b__11595, cljs.core._nth.call(null, c__11593, i__11597))
            }else {
            }
            var G__11600 = i__11597 + 1;
            i__11597 = G__11600;
            continue
          }else {
          }
          break
        }
        return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__11595), filter.call(null, pred, cljs.core.chunk_rest.call(null, s__11592)))
      }else {
        var f__11598 = cljs.core.first.call(null, s__11592);
        var r__11599 = cljs.core.rest.call(null, s__11592);
        if(cljs.core.truth_(pred.call(null, f__11598))) {
          return cljs.core.cons.call(null, f__11598, filter.call(null, pred, r__11599))
        }else {
          return filter.call(null, pred, r__11599)
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
  var walk__11603 = function walk(node) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, node, cljs.core.truth_(branch_QMARK_.call(null, node)) ? cljs.core.mapcat.call(null, walk, children.call(null, node)) : null)
    }, null)
  };
  return walk__11603.call(null, root)
};
cljs.core.flatten = function flatten(x) {
  return cljs.core.filter.call(null, function(p1__11601_SHARP_) {
    return!cljs.core.sequential_QMARK_.call(null, p1__11601_SHARP_)
  }, cljs.core.rest.call(null, cljs.core.tree_seq.call(null, cljs.core.sequential_QMARK_, cljs.core.seq, x)))
};
cljs.core.into = function into(to, from) {
  if(function() {
    var G__11607__11608 = to;
    if(G__11607__11608) {
      if(function() {
        var or__3943__auto____11609 = G__11607__11608.cljs$lang$protocol_mask$partition1$ & 1;
        if(or__3943__auto____11609) {
          return or__3943__auto____11609
        }else {
          return G__11607__11608.cljs$core$IEditableCollection$
        }
      }()) {
        return true
      }else {
        if(!G__11607__11608.cljs$lang$protocol_mask$partition1$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__11607__11608)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__11607__11608)
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
    var G__11610__delegate = function(f, c1, c2, c3, colls) {
      return cljs.core.into.call(null, cljs.core.PersistentVector.EMPTY, cljs.core.apply.call(null, cljs.core.map, f, c1, c2, c3, colls))
    };
    var G__11610 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__11610__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__11610.cljs$lang$maxFixedArity = 4;
    G__11610.cljs$lang$applyTo = function(arglist__11611) {
      var f = cljs.core.first(arglist__11611);
      var c1 = cljs.core.first(cljs.core.next(arglist__11611));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__11611)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__11611))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__11611))));
      return G__11610__delegate(f, c1, c2, c3, colls)
    };
    G__11610.cljs$lang$arity$variadic = G__11610__delegate;
    return G__11610
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
      var temp__4092__auto____11618 = cljs.core.seq.call(null, coll);
      if(temp__4092__auto____11618) {
        var s__11619 = temp__4092__auto____11618;
        var p__11620 = cljs.core.take.call(null, n, s__11619);
        if(n === cljs.core.count.call(null, p__11620)) {
          return cljs.core.cons.call(null, p__11620, partition.call(null, n, step, cljs.core.drop.call(null, step, s__11619)))
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
      var temp__4092__auto____11621 = cljs.core.seq.call(null, coll);
      if(temp__4092__auto____11621) {
        var s__11622 = temp__4092__auto____11621;
        var p__11623 = cljs.core.take.call(null, n, s__11622);
        if(n === cljs.core.count.call(null, p__11623)) {
          return cljs.core.cons.call(null, p__11623, partition.call(null, n, step, pad, cljs.core.drop.call(null, step, s__11622)))
        }else {
          return cljs.core.list.call(null, cljs.core.take.call(null, n, cljs.core.concat.call(null, p__11623, pad)))
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
    var sentinel__11628 = cljs.core.lookup_sentinel;
    var m__11629 = m;
    var ks__11630 = cljs.core.seq.call(null, ks);
    while(true) {
      if(ks__11630) {
        var m__11631 = cljs.core._lookup.call(null, m__11629, cljs.core.first.call(null, ks__11630), sentinel__11628);
        if(sentinel__11628 === m__11631) {
          return not_found
        }else {
          var G__11632 = sentinel__11628;
          var G__11633 = m__11631;
          var G__11634 = cljs.core.next.call(null, ks__11630);
          sentinel__11628 = G__11632;
          m__11629 = G__11633;
          ks__11630 = G__11634;
          continue
        }
      }else {
        return m__11629
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
cljs.core.assoc_in = function assoc_in(m, p__11635, v) {
  var vec__11640__11641 = p__11635;
  var k__11642 = cljs.core.nth.call(null, vec__11640__11641, 0, null);
  var ks__11643 = cljs.core.nthnext.call(null, vec__11640__11641, 1);
  if(cljs.core.truth_(ks__11643)) {
    return cljs.core.assoc.call(null, m, k__11642, assoc_in.call(null, cljs.core._lookup.call(null, m, k__11642, null), ks__11643, v))
  }else {
    return cljs.core.assoc.call(null, m, k__11642, v)
  }
};
cljs.core.update_in = function() {
  var update_in__delegate = function(m, p__11644, f, args) {
    var vec__11649__11650 = p__11644;
    var k__11651 = cljs.core.nth.call(null, vec__11649__11650, 0, null);
    var ks__11652 = cljs.core.nthnext.call(null, vec__11649__11650, 1);
    if(cljs.core.truth_(ks__11652)) {
      return cljs.core.assoc.call(null, m, k__11651, cljs.core.apply.call(null, update_in, cljs.core._lookup.call(null, m, k__11651, null), ks__11652, f, args))
    }else {
      return cljs.core.assoc.call(null, m, k__11651, cljs.core.apply.call(null, f, cljs.core._lookup.call(null, m, k__11651, null), args))
    }
  };
  var update_in = function(m, p__11644, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
    }
    return update_in__delegate.call(this, m, p__11644, f, args)
  };
  update_in.cljs$lang$maxFixedArity = 3;
  update_in.cljs$lang$applyTo = function(arglist__11653) {
    var m = cljs.core.first(arglist__11653);
    var p__11644 = cljs.core.first(cljs.core.next(arglist__11653));
    var f = cljs.core.first(cljs.core.next(cljs.core.next(arglist__11653)));
    var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__11653)));
    return update_in__delegate(m, p__11644, f, args)
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
  var this__11656 = this;
  var h__2133__auto____11657 = this__11656.__hash;
  if(!(h__2133__auto____11657 == null)) {
    return h__2133__auto____11657
  }else {
    var h__2133__auto____11658 = cljs.core.hash_coll.call(null, coll);
    this__11656.__hash = h__2133__auto____11658;
    return h__2133__auto____11658
  }
};
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__11659 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__11660 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.Vector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__11661 = this;
  var new_array__11662 = this__11661.array.slice();
  new_array__11662[k] = v;
  return new cljs.core.Vector(this__11661.meta, new_array__11662, null)
};
cljs.core.Vector.prototype.call = function() {
  var G__11693 = null;
  var G__11693__2 = function(this_sym11663, k) {
    var this__11665 = this;
    var this_sym11663__11666 = this;
    var coll__11667 = this_sym11663__11666;
    return coll__11667.cljs$core$ILookup$_lookup$arity$2(coll__11667, k)
  };
  var G__11693__3 = function(this_sym11664, k, not_found) {
    var this__11665 = this;
    var this_sym11664__11668 = this;
    var coll__11669 = this_sym11664__11668;
    return coll__11669.cljs$core$ILookup$_lookup$arity$3(coll__11669, k, not_found)
  };
  G__11693 = function(this_sym11664, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__11693__2.call(this, this_sym11664, k);
      case 3:
        return G__11693__3.call(this, this_sym11664, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__11693
}();
cljs.core.Vector.prototype.apply = function(this_sym11654, args11655) {
  var this__11670 = this;
  return this_sym11654.call.apply(this_sym11654, [this_sym11654].concat(args11655.slice()))
};
cljs.core.Vector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__11671 = this;
  var new_array__11672 = this__11671.array.slice();
  new_array__11672.push(o);
  return new cljs.core.Vector(this__11671.meta, new_array__11672, null)
};
cljs.core.Vector.prototype.toString = function() {
  var this__11673 = this;
  var this__11674 = this;
  return cljs.core.pr_str.call(null, this__11674)
};
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__11675 = this;
  return cljs.core.ci_reduce.call(null, this__11675.array, f)
};
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__11676 = this;
  return cljs.core.ci_reduce.call(null, this__11676.array, f, start)
};
cljs.core.Vector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__11677 = this;
  if(this__11677.array.length > 0) {
    var vector_seq__11678 = function vector_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < this__11677.array.length) {
          return cljs.core.cons.call(null, this__11677.array[i], vector_seq.call(null, i + 1))
        }else {
          return null
        }
      }, null)
    };
    return vector_seq__11678.call(null, 0)
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__11679 = this;
  return this__11679.array.length
};
cljs.core.Vector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__11680 = this;
  var count__11681 = this__11680.array.length;
  if(count__11681 > 0) {
    return this__11680.array[count__11681 - 1]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__11682 = this;
  if(this__11682.array.length > 0) {
    var new_array__11683 = this__11682.array.slice();
    new_array__11683.pop();
    return new cljs.core.Vector(this__11682.meta, new_array__11683, null)
  }else {
    throw new Error("Can't pop empty vector");
  }
};
cljs.core.Vector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__11684 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.Vector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__11685 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Vector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__11686 = this;
  return new cljs.core.Vector(meta, this__11686.array, this__11686.__hash)
};
cljs.core.Vector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__11687 = this;
  return this__11687.meta
};
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__11688 = this;
  if(function() {
    var and__3941__auto____11689 = 0 <= n;
    if(and__3941__auto____11689) {
      return n < this__11688.array.length
    }else {
      return and__3941__auto____11689
    }
  }()) {
    return this__11688.array[n]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__11690 = this;
  if(function() {
    var and__3941__auto____11691 = 0 <= n;
    if(and__3941__auto____11691) {
      return n < this__11690.array.length
    }else {
      return and__3941__auto____11691
    }
  }()) {
    return this__11690.array[n]
  }else {
    return not_found
  }
};
cljs.core.Vector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__11692 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__11692.meta)
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
  var cnt__11695 = pv.cnt;
  if(cnt__11695 < 32) {
    return 0
  }else {
    return cnt__11695 - 1 >>> 5 << 5
  }
};
cljs.core.new_path = function new_path(edit, level, node) {
  var ll__11701 = level;
  var ret__11702 = node;
  while(true) {
    if(ll__11701 === 0) {
      return ret__11702
    }else {
      var embed__11703 = ret__11702;
      var r__11704 = cljs.core.pv_fresh_node.call(null, edit);
      var ___11705 = cljs.core.pv_aset.call(null, r__11704, 0, embed__11703);
      var G__11706 = ll__11701 - 5;
      var G__11707 = r__11704;
      ll__11701 = G__11706;
      ret__11702 = G__11707;
      continue
    }
    break
  }
};
cljs.core.push_tail = function push_tail(pv, level, parent, tailnode) {
  var ret__11713 = cljs.core.pv_clone_node.call(null, parent);
  var subidx__11714 = pv.cnt - 1 >>> level & 31;
  if(5 === level) {
    cljs.core.pv_aset.call(null, ret__11713, subidx__11714, tailnode);
    return ret__11713
  }else {
    var child__11715 = cljs.core.pv_aget.call(null, parent, subidx__11714);
    if(!(child__11715 == null)) {
      var node_to_insert__11716 = push_tail.call(null, pv, level - 5, child__11715, tailnode);
      cljs.core.pv_aset.call(null, ret__11713, subidx__11714, node_to_insert__11716);
      return ret__11713
    }else {
      var node_to_insert__11717 = cljs.core.new_path.call(null, null, level - 5, tailnode);
      cljs.core.pv_aset.call(null, ret__11713, subidx__11714, node_to_insert__11717);
      return ret__11713
    }
  }
};
cljs.core.array_for = function array_for(pv, i) {
  if(function() {
    var and__3941__auto____11721 = 0 <= i;
    if(and__3941__auto____11721) {
      return i < pv.cnt
    }else {
      return and__3941__auto____11721
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, pv)) {
      return pv.tail
    }else {
      var node__11722 = pv.root;
      var level__11723 = pv.shift;
      while(true) {
        if(level__11723 > 0) {
          var G__11724 = cljs.core.pv_aget.call(null, node__11722, i >>> level__11723 & 31);
          var G__11725 = level__11723 - 5;
          node__11722 = G__11724;
          level__11723 = G__11725;
          continue
        }else {
          return node__11722.arr
        }
        break
      }
    }
  }else {
    throw new Error([cljs.core.str("No item "), cljs.core.str(i), cljs.core.str(" in vector of length "), cljs.core.str(pv.cnt)].join(""));
  }
};
cljs.core.do_assoc = function do_assoc(pv, level, node, i, val) {
  var ret__11728 = cljs.core.pv_clone_node.call(null, node);
  if(level === 0) {
    cljs.core.pv_aset.call(null, ret__11728, i & 31, val);
    return ret__11728
  }else {
    var subidx__11729 = i >>> level & 31;
    cljs.core.pv_aset.call(null, ret__11728, subidx__11729, do_assoc.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx__11729), i, val));
    return ret__11728
  }
};
cljs.core.pop_tail = function pop_tail(pv, level, node) {
  var subidx__11735 = pv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__11736 = pop_tail.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx__11735));
    if(function() {
      var and__3941__auto____11737 = new_child__11736 == null;
      if(and__3941__auto____11737) {
        return subidx__11735 === 0
      }else {
        return and__3941__auto____11737
      }
    }()) {
      return null
    }else {
      var ret__11738 = cljs.core.pv_clone_node.call(null, node);
      cljs.core.pv_aset.call(null, ret__11738, subidx__11735, new_child__11736);
      return ret__11738
    }
  }else {
    if(subidx__11735 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        var ret__11739 = cljs.core.pv_clone_node.call(null, node);
        cljs.core.pv_aset.call(null, ret__11739, subidx__11735, null);
        return ret__11739
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
  var this__11742 = this;
  return new cljs.core.TransientVector(this__11742.cnt, this__11742.shift, cljs.core.tv_editable_root.call(null, this__11742.root), cljs.core.tv_editable_tail.call(null, this__11742.tail))
};
cljs.core.PersistentVector.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__11743 = this;
  var h__2133__auto____11744 = this__11743.__hash;
  if(!(h__2133__auto____11744 == null)) {
    return h__2133__auto____11744
  }else {
    var h__2133__auto____11745 = cljs.core.hash_coll.call(null, coll);
    this__11743.__hash = h__2133__auto____11745;
    return h__2133__auto____11745
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__11746 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__11747 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.PersistentVector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__11748 = this;
  if(function() {
    var and__3941__auto____11749 = 0 <= k;
    if(and__3941__auto____11749) {
      return k < this__11748.cnt
    }else {
      return and__3941__auto____11749
    }
  }()) {
    if(cljs.core.tail_off.call(null, coll) <= k) {
      var new_tail__11750 = this__11748.tail.slice();
      new_tail__11750[k & 31] = v;
      return new cljs.core.PersistentVector(this__11748.meta, this__11748.cnt, this__11748.shift, this__11748.root, new_tail__11750, null)
    }else {
      return new cljs.core.PersistentVector(this__11748.meta, this__11748.cnt, this__11748.shift, cljs.core.do_assoc.call(null, coll, this__11748.shift, this__11748.root, k, v), this__11748.tail, null)
    }
  }else {
    if(k === this__11748.cnt) {
      return coll.cljs$core$ICollection$_conj$arity$2(coll, v)
    }else {
      if("\ufdd0'else") {
        throw new Error([cljs.core.str("Index "), cljs.core.str(k), cljs.core.str(" out of bounds  [0,"), cljs.core.str(this__11748.cnt), cljs.core.str("]")].join(""));
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentVector.prototype.call = function() {
  var G__11798 = null;
  var G__11798__2 = function(this_sym11751, k) {
    var this__11753 = this;
    var this_sym11751__11754 = this;
    var coll__11755 = this_sym11751__11754;
    return coll__11755.cljs$core$ILookup$_lookup$arity$2(coll__11755, k)
  };
  var G__11798__3 = function(this_sym11752, k, not_found) {
    var this__11753 = this;
    var this_sym11752__11756 = this;
    var coll__11757 = this_sym11752__11756;
    return coll__11757.cljs$core$ILookup$_lookup$arity$3(coll__11757, k, not_found)
  };
  G__11798 = function(this_sym11752, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__11798__2.call(this, this_sym11752, k);
      case 3:
        return G__11798__3.call(this, this_sym11752, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__11798
}();
cljs.core.PersistentVector.prototype.apply = function(this_sym11740, args11741) {
  var this__11758 = this;
  return this_sym11740.call.apply(this_sym11740, [this_sym11740].concat(args11741.slice()))
};
cljs.core.PersistentVector.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(v, f, init) {
  var this__11759 = this;
  var step_init__11760 = [0, init];
  var i__11761 = 0;
  while(true) {
    if(i__11761 < this__11759.cnt) {
      var arr__11762 = cljs.core.array_for.call(null, v, i__11761);
      var len__11763 = arr__11762.length;
      var init__11767 = function() {
        var j__11764 = 0;
        var init__11765 = step_init__11760[1];
        while(true) {
          if(j__11764 < len__11763) {
            var init__11766 = f.call(null, init__11765, j__11764 + i__11761, arr__11762[j__11764]);
            if(cljs.core.reduced_QMARK_.call(null, init__11766)) {
              return init__11766
            }else {
              var G__11799 = j__11764 + 1;
              var G__11800 = init__11766;
              j__11764 = G__11799;
              init__11765 = G__11800;
              continue
            }
          }else {
            step_init__11760[0] = len__11763;
            step_init__11760[1] = init__11765;
            return init__11765
          }
          break
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__11767)) {
        return cljs.core.deref.call(null, init__11767)
      }else {
        var G__11801 = i__11761 + step_init__11760[0];
        i__11761 = G__11801;
        continue
      }
    }else {
      return step_init__11760[1]
    }
    break
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__11768 = this;
  if(this__11768.cnt - cljs.core.tail_off.call(null, coll) < 32) {
    var new_tail__11769 = this__11768.tail.slice();
    new_tail__11769.push(o);
    return new cljs.core.PersistentVector(this__11768.meta, this__11768.cnt + 1, this__11768.shift, this__11768.root, new_tail__11769, null)
  }else {
    var root_overflow_QMARK___11770 = this__11768.cnt >>> 5 > 1 << this__11768.shift;
    var new_shift__11771 = root_overflow_QMARK___11770 ? this__11768.shift + 5 : this__11768.shift;
    var new_root__11773 = root_overflow_QMARK___11770 ? function() {
      var n_r__11772 = cljs.core.pv_fresh_node.call(null, null);
      cljs.core.pv_aset.call(null, n_r__11772, 0, this__11768.root);
      cljs.core.pv_aset.call(null, n_r__11772, 1, cljs.core.new_path.call(null, null, this__11768.shift, new cljs.core.VectorNode(null, this__11768.tail)));
      return n_r__11772
    }() : cljs.core.push_tail.call(null, coll, this__11768.shift, this__11768.root, new cljs.core.VectorNode(null, this__11768.tail));
    return new cljs.core.PersistentVector(this__11768.meta, this__11768.cnt + 1, new_shift__11771, new_root__11773, [o], null)
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__11774 = this;
  if(this__11774.cnt > 0) {
    return new cljs.core.RSeq(coll, this__11774.cnt - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_key$arity$1 = function(coll) {
  var this__11775 = this;
  return coll.cljs$core$IIndexed$_nth$arity$2(coll, 0)
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_val$arity$1 = function(coll) {
  var this__11776 = this;
  return coll.cljs$core$IIndexed$_nth$arity$2(coll, 1)
};
cljs.core.PersistentVector.prototype.toString = function() {
  var this__11777 = this;
  var this__11778 = this;
  return cljs.core.pr_str.call(null, this__11778)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__11779 = this;
  return cljs.core.ci_reduce.call(null, v, f)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__11780 = this;
  return cljs.core.ci_reduce.call(null, v, f, start)
};
cljs.core.PersistentVector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__11781 = this;
  if(this__11781.cnt === 0) {
    return null
  }else {
    return cljs.core.chunked_seq.call(null, coll, 0, 0)
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__11782 = this;
  return this__11782.cnt
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__11783 = this;
  if(this__11783.cnt > 0) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, this__11783.cnt - 1)
  }else {
    return null
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__11784 = this;
  if(this__11784.cnt === 0) {
    throw new Error("Can't pop empty vector");
  }else {
    if(1 === this__11784.cnt) {
      return cljs.core._with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__11784.meta)
    }else {
      if(1 < this__11784.cnt - cljs.core.tail_off.call(null, coll)) {
        return new cljs.core.PersistentVector(this__11784.meta, this__11784.cnt - 1, this__11784.shift, this__11784.root, this__11784.tail.slice(0, -1), null)
      }else {
        if("\ufdd0'else") {
          var new_tail__11785 = cljs.core.array_for.call(null, coll, this__11784.cnt - 2);
          var nr__11786 = cljs.core.pop_tail.call(null, coll, this__11784.shift, this__11784.root);
          var new_root__11787 = nr__11786 == null ? cljs.core.PersistentVector.EMPTY_NODE : nr__11786;
          var cnt_1__11788 = this__11784.cnt - 1;
          if(function() {
            var and__3941__auto____11789 = 5 < this__11784.shift;
            if(and__3941__auto____11789) {
              return cljs.core.pv_aget.call(null, new_root__11787, 1) == null
            }else {
              return and__3941__auto____11789
            }
          }()) {
            return new cljs.core.PersistentVector(this__11784.meta, cnt_1__11788, this__11784.shift - 5, cljs.core.pv_aget.call(null, new_root__11787, 0), new_tail__11785, null)
          }else {
            return new cljs.core.PersistentVector(this__11784.meta, cnt_1__11788, this__11784.shift, new_root__11787, new_tail__11785, null)
          }
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__11790 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.PersistentVector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__11791 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentVector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__11792 = this;
  return new cljs.core.PersistentVector(meta, this__11792.cnt, this__11792.shift, this__11792.root, this__11792.tail, this__11792.__hash)
};
cljs.core.PersistentVector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__11793 = this;
  return this__11793.meta
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__11794 = this;
  return cljs.core.array_for.call(null, coll, n)[n & 31]
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__11795 = this;
  if(function() {
    var and__3941__auto____11796 = 0 <= n;
    if(and__3941__auto____11796) {
      return n < this__11795.cnt
    }else {
      return and__3941__auto____11796
    }
  }()) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
  }else {
    return not_found
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__11797 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__11797.meta)
};
cljs.core.PersistentVector;
cljs.core.PersistentVector.EMPTY_NODE = cljs.core.pv_fresh_node.call(null, null);
cljs.core.PersistentVector.EMPTY = new cljs.core.PersistentVector(null, 0, 5, cljs.core.PersistentVector.EMPTY_NODE, [], 0);
cljs.core.PersistentVector.fromArray = function(xs, no_clone) {
  var l__11802 = xs.length;
  var xs__11803 = no_clone === true ? xs : xs.slice();
  if(l__11802 < 32) {
    return new cljs.core.PersistentVector(null, l__11802, 5, cljs.core.PersistentVector.EMPTY_NODE, xs__11803, null)
  }else {
    var node__11804 = xs__11803.slice(0, 32);
    var v__11805 = new cljs.core.PersistentVector(null, 32, 5, cljs.core.PersistentVector.EMPTY_NODE, node__11804, null);
    var i__11806 = 32;
    var out__11807 = cljs.core._as_transient.call(null, v__11805);
    while(true) {
      if(i__11806 < l__11802) {
        var G__11808 = i__11806 + 1;
        var G__11809 = cljs.core.conj_BANG_.call(null, out__11807, xs__11803[i__11806]);
        i__11806 = G__11808;
        out__11807 = G__11809;
        continue
      }else {
        return cljs.core.persistent_BANG_.call(null, out__11807)
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
  vector.cljs$lang$applyTo = function(arglist__11810) {
    var args = cljs.core.seq(arglist__11810);
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
  var this__11811 = this;
  if(this__11811.off + 1 < this__11811.node.length) {
    var s__11812 = cljs.core.chunked_seq.call(null, this__11811.vec, this__11811.node, this__11811.i, this__11811.off + 1);
    if(s__11812 == null) {
      return null
    }else {
      return s__11812
    }
  }else {
    return coll.cljs$core$IChunkedNext$_chunked_next$arity$1(coll)
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__11813 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__11814 = this;
  return coll
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__11815 = this;
  return this__11815.node[this__11815.off]
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__11816 = this;
  if(this__11816.off + 1 < this__11816.node.length) {
    var s__11817 = cljs.core.chunked_seq.call(null, this__11816.vec, this__11816.node, this__11816.i, this__11816.off + 1);
    if(s__11817 == null) {
      return cljs.core.List.EMPTY
    }else {
      return s__11817
    }
  }else {
    return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1(coll)
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedNext$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedNext$_chunked_next$arity$1 = function(coll) {
  var this__11818 = this;
  var l__11819 = this__11818.node.length;
  var s__11820 = this__11818.i + l__11819 < cljs.core._count.call(null, this__11818.vec) ? cljs.core.chunked_seq.call(null, this__11818.vec, this__11818.i + l__11819, 0) : null;
  if(s__11820 == null) {
    return null
  }else {
    return s__11820
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__11821 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, m) {
  var this__11822 = this;
  return cljs.core.chunked_seq.call(null, this__11822.vec, this__11822.node, this__11822.i, this__11822.off, m)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IWithMeta$_meta$arity$1 = function(coll) {
  var this__11823 = this;
  return this__11823.meta
};
cljs.core.ChunkedSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__11824 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__11824.meta)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$_chunked_first$arity$1 = function(coll) {
  var this__11825 = this;
  return cljs.core.array_chunk.call(null, this__11825.node, this__11825.off)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$_chunked_rest$arity$1 = function(coll) {
  var this__11826 = this;
  var l__11827 = this__11826.node.length;
  var s__11828 = this__11826.i + l__11827 < cljs.core._count.call(null, this__11826.vec) ? cljs.core.chunked_seq.call(null, this__11826.vec, this__11826.i + l__11827, 0) : null;
  if(s__11828 == null) {
    return cljs.core.List.EMPTY
  }else {
    return s__11828
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
  var this__11831 = this;
  var h__2133__auto____11832 = this__11831.__hash;
  if(!(h__2133__auto____11832 == null)) {
    return h__2133__auto____11832
  }else {
    var h__2133__auto____11833 = cljs.core.hash_coll.call(null, coll);
    this__11831.__hash = h__2133__auto____11833;
    return h__2133__auto____11833
  }
};
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__11834 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__11835 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, key, val) {
  var this__11836 = this;
  var v_pos__11837 = this__11836.start + key;
  return new cljs.core.Subvec(this__11836.meta, cljs.core._assoc.call(null, this__11836.v, v_pos__11837, val), this__11836.start, this__11836.end > v_pos__11837 + 1 ? this__11836.end : v_pos__11837 + 1, null)
};
cljs.core.Subvec.prototype.call = function() {
  var G__11863 = null;
  var G__11863__2 = function(this_sym11838, k) {
    var this__11840 = this;
    var this_sym11838__11841 = this;
    var coll__11842 = this_sym11838__11841;
    return coll__11842.cljs$core$ILookup$_lookup$arity$2(coll__11842, k)
  };
  var G__11863__3 = function(this_sym11839, k, not_found) {
    var this__11840 = this;
    var this_sym11839__11843 = this;
    var coll__11844 = this_sym11839__11843;
    return coll__11844.cljs$core$ILookup$_lookup$arity$3(coll__11844, k, not_found)
  };
  G__11863 = function(this_sym11839, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__11863__2.call(this, this_sym11839, k);
      case 3:
        return G__11863__3.call(this, this_sym11839, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__11863
}();
cljs.core.Subvec.prototype.apply = function(this_sym11829, args11830) {
  var this__11845 = this;
  return this_sym11829.call.apply(this_sym11829, [this_sym11829].concat(args11830.slice()))
};
cljs.core.Subvec.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__11846 = this;
  return new cljs.core.Subvec(this__11846.meta, cljs.core._assoc_n.call(null, this__11846.v, this__11846.end, o), this__11846.start, this__11846.end + 1, null)
};
cljs.core.Subvec.prototype.toString = function() {
  var this__11847 = this;
  var this__11848 = this;
  return cljs.core.pr_str.call(null, this__11848)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__11849 = this;
  return cljs.core.ci_reduce.call(null, coll, f)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__11850 = this;
  return cljs.core.ci_reduce.call(null, coll, f, start)
};
cljs.core.Subvec.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__11851 = this;
  var subvec_seq__11852 = function subvec_seq(i) {
    if(i === this__11851.end) {
      return null
    }else {
      return cljs.core.cons.call(null, cljs.core._nth.call(null, this__11851.v, i), new cljs.core.LazySeq(null, false, function() {
        return subvec_seq.call(null, i + 1)
      }, null))
    }
  };
  return subvec_seq__11852.call(null, this__11851.start)
};
cljs.core.Subvec.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__11853 = this;
  return this__11853.end - this__11853.start
};
cljs.core.Subvec.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__11854 = this;
  return cljs.core._nth.call(null, this__11854.v, this__11854.end - 1)
};
cljs.core.Subvec.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__11855 = this;
  if(this__11855.start === this__11855.end) {
    throw new Error("Can't pop empty vector");
  }else {
    return new cljs.core.Subvec(this__11855.meta, this__11855.v, this__11855.start, this__11855.end - 1, null)
  }
};
cljs.core.Subvec.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__11856 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.Subvec.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__11857 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Subvec.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__11858 = this;
  return new cljs.core.Subvec(meta, this__11858.v, this__11858.start, this__11858.end, this__11858.__hash)
};
cljs.core.Subvec.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__11859 = this;
  return this__11859.meta
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__11860 = this;
  return cljs.core._nth.call(null, this__11860.v, this__11860.start + n)
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__11861 = this;
  return cljs.core._nth.call(null, this__11861.v, this__11861.start + n, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__11862 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__11862.meta)
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
  var ret__11865 = cljs.core.make_array.call(null, 32);
  cljs.core.array_copy.call(null, tl, 0, ret__11865, 0, tl.length);
  return ret__11865
};
cljs.core.tv_push_tail = function tv_push_tail(tv, level, parent, tail_node) {
  var ret__11869 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, parent);
  var subidx__11870 = tv.cnt - 1 >>> level & 31;
  cljs.core.pv_aset.call(null, ret__11869, subidx__11870, level === 5 ? tail_node : function() {
    var child__11871 = cljs.core.pv_aget.call(null, ret__11869, subidx__11870);
    if(!(child__11871 == null)) {
      return tv_push_tail.call(null, tv, level - 5, child__11871, tail_node)
    }else {
      return cljs.core.new_path.call(null, tv.root.edit, level - 5, tail_node)
    }
  }());
  return ret__11869
};
cljs.core.tv_pop_tail = function tv_pop_tail(tv, level, node) {
  var node__11876 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, node);
  var subidx__11877 = tv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__11878 = tv_pop_tail.call(null, tv, level - 5, cljs.core.pv_aget.call(null, node__11876, subidx__11877));
    if(function() {
      var and__3941__auto____11879 = new_child__11878 == null;
      if(and__3941__auto____11879) {
        return subidx__11877 === 0
      }else {
        return and__3941__auto____11879
      }
    }()) {
      return null
    }else {
      cljs.core.pv_aset.call(null, node__11876, subidx__11877, new_child__11878);
      return node__11876
    }
  }else {
    if(subidx__11877 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        cljs.core.pv_aset.call(null, node__11876, subidx__11877, null);
        return node__11876
      }else {
        return null
      }
    }
  }
};
cljs.core.editable_array_for = function editable_array_for(tv, i) {
  if(function() {
    var and__3941__auto____11884 = 0 <= i;
    if(and__3941__auto____11884) {
      return i < tv.cnt
    }else {
      return and__3941__auto____11884
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, tv)) {
      return tv.tail
    }else {
      var root__11885 = tv.root;
      var node__11886 = root__11885;
      var level__11887 = tv.shift;
      while(true) {
        if(level__11887 > 0) {
          var G__11888 = cljs.core.tv_ensure_editable.call(null, root__11885.edit, cljs.core.pv_aget.call(null, node__11886, i >>> level__11887 & 31));
          var G__11889 = level__11887 - 5;
          node__11886 = G__11888;
          level__11887 = G__11889;
          continue
        }else {
          return node__11886.arr
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
  var G__11929 = null;
  var G__11929__2 = function(this_sym11892, k) {
    var this__11894 = this;
    var this_sym11892__11895 = this;
    var coll__11896 = this_sym11892__11895;
    return coll__11896.cljs$core$ILookup$_lookup$arity$2(coll__11896, k)
  };
  var G__11929__3 = function(this_sym11893, k, not_found) {
    var this__11894 = this;
    var this_sym11893__11897 = this;
    var coll__11898 = this_sym11893__11897;
    return coll__11898.cljs$core$ILookup$_lookup$arity$3(coll__11898, k, not_found)
  };
  G__11929 = function(this_sym11893, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__11929__2.call(this, this_sym11893, k);
      case 3:
        return G__11929__3.call(this, this_sym11893, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__11929
}();
cljs.core.TransientVector.prototype.apply = function(this_sym11890, args11891) {
  var this__11899 = this;
  return this_sym11890.call.apply(this_sym11890, [this_sym11890].concat(args11891.slice()))
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__11900 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__11901 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__11902 = this;
  if(this__11902.root.edit) {
    return cljs.core.array_for.call(null, coll, n)[n & 31]
  }else {
    throw new Error("nth after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__11903 = this;
  if(function() {
    var and__3941__auto____11904 = 0 <= n;
    if(and__3941__auto____11904) {
      return n < this__11903.cnt
    }else {
      return and__3941__auto____11904
    }
  }()) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
  }else {
    return not_found
  }
};
cljs.core.TransientVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__11905 = this;
  if(this__11905.root.edit) {
    return this__11905.cnt
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3 = function(tcoll, n, val) {
  var this__11906 = this;
  if(this__11906.root.edit) {
    if(function() {
      var and__3941__auto____11907 = 0 <= n;
      if(and__3941__auto____11907) {
        return n < this__11906.cnt
      }else {
        return and__3941__auto____11907
      }
    }()) {
      if(cljs.core.tail_off.call(null, tcoll) <= n) {
        this__11906.tail[n & 31] = val;
        return tcoll
      }else {
        var new_root__11912 = function go(level, node) {
          var node__11910 = cljs.core.tv_ensure_editable.call(null, this__11906.root.edit, node);
          if(level === 0) {
            cljs.core.pv_aset.call(null, node__11910, n & 31, val);
            return node__11910
          }else {
            var subidx__11911 = n >>> level & 31;
            cljs.core.pv_aset.call(null, node__11910, subidx__11911, go.call(null, level - 5, cljs.core.pv_aget.call(null, node__11910, subidx__11911)));
            return node__11910
          }
        }.call(null, this__11906.shift, this__11906.root);
        this__11906.root = new_root__11912;
        return tcoll
      }
    }else {
      if(n === this__11906.cnt) {
        return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2(tcoll, val)
      }else {
        if("\ufdd0'else") {
          throw new Error([cljs.core.str("Index "), cljs.core.str(n), cljs.core.str(" out of bounds for TransientVector of length"), cljs.core.str(this__11906.cnt)].join(""));
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
  var this__11913 = this;
  if(this__11913.root.edit) {
    if(this__11913.cnt === 0) {
      throw new Error("Can't pop empty vector");
    }else {
      if(1 === this__11913.cnt) {
        this__11913.cnt = 0;
        return tcoll
      }else {
        if((this__11913.cnt - 1 & 31) > 0) {
          this__11913.cnt = this__11913.cnt - 1;
          return tcoll
        }else {
          if("\ufdd0'else") {
            var new_tail__11914 = cljs.core.editable_array_for.call(null, tcoll, this__11913.cnt - 2);
            var new_root__11916 = function() {
              var nr__11915 = cljs.core.tv_pop_tail.call(null, tcoll, this__11913.shift, this__11913.root);
              if(!(nr__11915 == null)) {
                return nr__11915
              }else {
                return new cljs.core.VectorNode(this__11913.root.edit, cljs.core.make_array.call(null, 32))
              }
            }();
            if(function() {
              var and__3941__auto____11917 = 5 < this__11913.shift;
              if(and__3941__auto____11917) {
                return cljs.core.pv_aget.call(null, new_root__11916, 1) == null
              }else {
                return and__3941__auto____11917
              }
            }()) {
              var new_root__11918 = cljs.core.tv_ensure_editable.call(null, this__11913.root.edit, cljs.core.pv_aget.call(null, new_root__11916, 0));
              this__11913.root = new_root__11918;
              this__11913.shift = this__11913.shift - 5;
              this__11913.cnt = this__11913.cnt - 1;
              this__11913.tail = new_tail__11914;
              return tcoll
            }else {
              this__11913.root = new_root__11916;
              this__11913.cnt = this__11913.cnt - 1;
              this__11913.tail = new_tail__11914;
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
  var this__11919 = this;
  return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3(tcoll, key, val)
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__11920 = this;
  if(this__11920.root.edit) {
    if(this__11920.cnt - cljs.core.tail_off.call(null, tcoll) < 32) {
      this__11920.tail[this__11920.cnt & 31] = o;
      this__11920.cnt = this__11920.cnt + 1;
      return tcoll
    }else {
      var tail_node__11921 = new cljs.core.VectorNode(this__11920.root.edit, this__11920.tail);
      var new_tail__11922 = cljs.core.make_array.call(null, 32);
      new_tail__11922[0] = o;
      this__11920.tail = new_tail__11922;
      if(this__11920.cnt >>> 5 > 1 << this__11920.shift) {
        var new_root_array__11923 = cljs.core.make_array.call(null, 32);
        var new_shift__11924 = this__11920.shift + 5;
        new_root_array__11923[0] = this__11920.root;
        new_root_array__11923[1] = cljs.core.new_path.call(null, this__11920.root.edit, this__11920.shift, tail_node__11921);
        this__11920.root = new cljs.core.VectorNode(this__11920.root.edit, new_root_array__11923);
        this__11920.shift = new_shift__11924;
        this__11920.cnt = this__11920.cnt + 1;
        return tcoll
      }else {
        var new_root__11925 = cljs.core.tv_push_tail.call(null, tcoll, this__11920.shift, this__11920.root, tail_node__11921);
        this__11920.root = new_root__11925;
        this__11920.cnt = this__11920.cnt + 1;
        return tcoll
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__11926 = this;
  if(this__11926.root.edit) {
    this__11926.root.edit = null;
    var len__11927 = this__11926.cnt - cljs.core.tail_off.call(null, tcoll);
    var trimmed_tail__11928 = cljs.core.make_array.call(null, len__11927);
    cljs.core.array_copy.call(null, this__11926.tail, 0, trimmed_tail__11928, 0, len__11927);
    return new cljs.core.PersistentVector(null, this__11926.cnt, this__11926.shift, this__11926.root, trimmed_tail__11928, null)
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
  var this__11930 = this;
  var h__2133__auto____11931 = this__11930.__hash;
  if(!(h__2133__auto____11931 == null)) {
    return h__2133__auto____11931
  }else {
    var h__2133__auto____11932 = cljs.core.hash_coll.call(null, coll);
    this__11930.__hash = h__2133__auto____11932;
    return h__2133__auto____11932
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__11933 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentQueueSeq.prototype.toString = function() {
  var this__11934 = this;
  var this__11935 = this;
  return cljs.core.pr_str.call(null, this__11935)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__11936 = this;
  return coll
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__11937 = this;
  return cljs.core._first.call(null, this__11937.front)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__11938 = this;
  var temp__4090__auto____11939 = cljs.core.next.call(null, this__11938.front);
  if(temp__4090__auto____11939) {
    var f1__11940 = temp__4090__auto____11939;
    return new cljs.core.PersistentQueueSeq(this__11938.meta, f1__11940, this__11938.rear, null)
  }else {
    if(this__11938.rear == null) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
    }else {
      return new cljs.core.PersistentQueueSeq(this__11938.meta, this__11938.rear, null, null)
    }
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__11941 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__11942 = this;
  return new cljs.core.PersistentQueueSeq(meta, this__11942.front, this__11942.rear, this__11942.__hash)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__11943 = this;
  return this__11943.meta
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__11944 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__11944.meta)
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
  var this__11945 = this;
  var h__2133__auto____11946 = this__11945.__hash;
  if(!(h__2133__auto____11946 == null)) {
    return h__2133__auto____11946
  }else {
    var h__2133__auto____11947 = cljs.core.hash_coll.call(null, coll);
    this__11945.__hash = h__2133__auto____11947;
    return h__2133__auto____11947
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__11948 = this;
  if(cljs.core.truth_(this__11948.front)) {
    return new cljs.core.PersistentQueue(this__11948.meta, this__11948.count + 1, this__11948.front, cljs.core.conj.call(null, function() {
      var or__3943__auto____11949 = this__11948.rear;
      if(cljs.core.truth_(or__3943__auto____11949)) {
        return or__3943__auto____11949
      }else {
        return cljs.core.PersistentVector.EMPTY
      }
    }(), o), null)
  }else {
    return new cljs.core.PersistentQueue(this__11948.meta, this__11948.count + 1, cljs.core.conj.call(null, this__11948.front, o), cljs.core.PersistentVector.EMPTY, null)
  }
};
cljs.core.PersistentQueue.prototype.toString = function() {
  var this__11950 = this;
  var this__11951 = this;
  return cljs.core.pr_str.call(null, this__11951)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__11952 = this;
  var rear__11953 = cljs.core.seq.call(null, this__11952.rear);
  if(cljs.core.truth_(function() {
    var or__3943__auto____11954 = this__11952.front;
    if(cljs.core.truth_(or__3943__auto____11954)) {
      return or__3943__auto____11954
    }else {
      return rear__11953
    }
  }())) {
    return new cljs.core.PersistentQueueSeq(null, this__11952.front, cljs.core.seq.call(null, rear__11953), null)
  }else {
    return null
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__11955 = this;
  return this__11955.count
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__11956 = this;
  return cljs.core._first.call(null, this__11956.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__11957 = this;
  if(cljs.core.truth_(this__11957.front)) {
    var temp__4090__auto____11958 = cljs.core.next.call(null, this__11957.front);
    if(temp__4090__auto____11958) {
      var f1__11959 = temp__4090__auto____11958;
      return new cljs.core.PersistentQueue(this__11957.meta, this__11957.count - 1, f1__11959, this__11957.rear, null)
    }else {
      return new cljs.core.PersistentQueue(this__11957.meta, this__11957.count - 1, cljs.core.seq.call(null, this__11957.rear), cljs.core.PersistentVector.EMPTY, null)
    }
  }else {
    return coll
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__11960 = this;
  return cljs.core.first.call(null, this__11960.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__11961 = this;
  return cljs.core.rest.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentQueue.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__11962 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueue.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__11963 = this;
  return new cljs.core.PersistentQueue(meta, this__11963.count, this__11963.front, this__11963.rear, this__11963.__hash)
};
cljs.core.PersistentQueue.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__11964 = this;
  return this__11964.meta
};
cljs.core.PersistentQueue.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__11965 = this;
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
  var this__11966 = this;
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
  var len__11969 = array.length;
  var i__11970 = 0;
  while(true) {
    if(i__11970 < len__11969) {
      if(k === array[i__11970]) {
        return i__11970
      }else {
        var G__11971 = i__11970 + incr;
        i__11970 = G__11971;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.obj_map_compare_keys = function obj_map_compare_keys(a, b) {
  var a__11974 = cljs.core.hash.call(null, a);
  var b__11975 = cljs.core.hash.call(null, b);
  if(a__11974 < b__11975) {
    return-1
  }else {
    if(a__11974 > b__11975) {
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
  var ks__11983 = m.keys;
  var len__11984 = ks__11983.length;
  var so__11985 = m.strobj;
  var out__11986 = cljs.core.with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, cljs.core.meta.call(null, m));
  var i__11987 = 0;
  var out__11988 = cljs.core.transient$.call(null, out__11986);
  while(true) {
    if(i__11987 < len__11984) {
      var k__11989 = ks__11983[i__11987];
      var G__11990 = i__11987 + 1;
      var G__11991 = cljs.core.assoc_BANG_.call(null, out__11988, k__11989, so__11985[k__11989]);
      i__11987 = G__11990;
      out__11988 = G__11991;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, out__11988, k, v))
    }
    break
  }
};
cljs.core.obj_clone = function obj_clone(obj, ks) {
  var new_obj__11997 = {};
  var l__11998 = ks.length;
  var i__11999 = 0;
  while(true) {
    if(i__11999 < l__11998) {
      var k__12000 = ks[i__11999];
      new_obj__11997[k__12000] = obj[k__12000];
      var G__12001 = i__11999 + 1;
      i__11999 = G__12001;
      continue
    }else {
    }
    break
  }
  return new_obj__11997
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
  var this__12004 = this;
  return cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.hash_map.call(null), coll))
};
cljs.core.ObjMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__12005 = this;
  var h__2133__auto____12006 = this__12005.__hash;
  if(!(h__2133__auto____12006 == null)) {
    return h__2133__auto____12006
  }else {
    var h__2133__auto____12007 = cljs.core.hash_imap.call(null, coll);
    this__12005.__hash = h__2133__auto____12007;
    return h__2133__auto____12007
  }
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__12008 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__12009 = this;
  if(function() {
    var and__3941__auto____12010 = goog.isString(k);
    if(and__3941__auto____12010) {
      return!(cljs.core.scan_array.call(null, 1, k, this__12009.keys) == null)
    }else {
      return and__3941__auto____12010
    }
  }()) {
    return this__12009.strobj[k]
  }else {
    return not_found
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__12011 = this;
  if(goog.isString(k)) {
    if(function() {
      var or__3943__auto____12012 = this__12011.update_count > cljs.core.ObjMap.HASHMAP_THRESHOLD;
      if(or__3943__auto____12012) {
        return or__3943__auto____12012
      }else {
        return this__12011.keys.length >= cljs.core.ObjMap.HASHMAP_THRESHOLD
      }
    }()) {
      return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
    }else {
      if(!(cljs.core.scan_array.call(null, 1, k, this__12011.keys) == null)) {
        var new_strobj__12013 = cljs.core.obj_clone.call(null, this__12011.strobj, this__12011.keys);
        new_strobj__12013[k] = v;
        return new cljs.core.ObjMap(this__12011.meta, this__12011.keys, new_strobj__12013, this__12011.update_count + 1, null)
      }else {
        var new_strobj__12014 = cljs.core.obj_clone.call(null, this__12011.strobj, this__12011.keys);
        var new_keys__12015 = this__12011.keys.slice();
        new_strobj__12014[k] = v;
        new_keys__12015.push(k);
        return new cljs.core.ObjMap(this__12011.meta, new_keys__12015, new_strobj__12014, this__12011.update_count + 1, null)
      }
    }
  }else {
    return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__12016 = this;
  if(function() {
    var and__3941__auto____12017 = goog.isString(k);
    if(and__3941__auto____12017) {
      return!(cljs.core.scan_array.call(null, 1, k, this__12016.keys) == null)
    }else {
      return and__3941__auto____12017
    }
  }()) {
    return true
  }else {
    return false
  }
};
cljs.core.ObjMap.prototype.call = function() {
  var G__12039 = null;
  var G__12039__2 = function(this_sym12018, k) {
    var this__12020 = this;
    var this_sym12018__12021 = this;
    var coll__12022 = this_sym12018__12021;
    return coll__12022.cljs$core$ILookup$_lookup$arity$2(coll__12022, k)
  };
  var G__12039__3 = function(this_sym12019, k, not_found) {
    var this__12020 = this;
    var this_sym12019__12023 = this;
    var coll__12024 = this_sym12019__12023;
    return coll__12024.cljs$core$ILookup$_lookup$arity$3(coll__12024, k, not_found)
  };
  G__12039 = function(this_sym12019, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__12039__2.call(this, this_sym12019, k);
      case 3:
        return G__12039__3.call(this, this_sym12019, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__12039
}();
cljs.core.ObjMap.prototype.apply = function(this_sym12002, args12003) {
  var this__12025 = this;
  return this_sym12002.call.apply(this_sym12002, [this_sym12002].concat(args12003.slice()))
};
cljs.core.ObjMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__12026 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.ObjMap.prototype.toString = function() {
  var this__12027 = this;
  var this__12028 = this;
  return cljs.core.pr_str.call(null, this__12028)
};
cljs.core.ObjMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__12029 = this;
  if(this__12029.keys.length > 0) {
    return cljs.core.map.call(null, function(p1__11992_SHARP_) {
      return cljs.core.vector.call(null, p1__11992_SHARP_, this__12029.strobj[p1__11992_SHARP_])
    }, this__12029.keys.sort(cljs.core.obj_map_compare_keys))
  }else {
    return null
  }
};
cljs.core.ObjMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__12030 = this;
  return this__12030.keys.length
};
cljs.core.ObjMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__12031 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.ObjMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__12032 = this;
  return new cljs.core.ObjMap(meta, this__12032.keys, this__12032.strobj, this__12032.update_count, this__12032.__hash)
};
cljs.core.ObjMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__12033 = this;
  return this__12033.meta
};
cljs.core.ObjMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__12034 = this;
  return cljs.core.with_meta.call(null, cljs.core.ObjMap.EMPTY, this__12034.meta)
};
cljs.core.ObjMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__12035 = this;
  if(function() {
    var and__3941__auto____12036 = goog.isString(k);
    if(and__3941__auto____12036) {
      return!(cljs.core.scan_array.call(null, 1, k, this__12035.keys) == null)
    }else {
      return and__3941__auto____12036
    }
  }()) {
    var new_keys__12037 = this__12035.keys.slice();
    var new_strobj__12038 = cljs.core.obj_clone.call(null, this__12035.strobj, this__12035.keys);
    new_keys__12037.splice(cljs.core.scan_array.call(null, 1, k, new_keys__12037), 1);
    cljs.core.js_delete.call(null, new_strobj__12038, k);
    return new cljs.core.ObjMap(this__12035.meta, new_keys__12037, new_strobj__12038, this__12035.update_count + 1, null)
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
  var this__12043 = this;
  var h__2133__auto____12044 = this__12043.__hash;
  if(!(h__2133__auto____12044 == null)) {
    return h__2133__auto____12044
  }else {
    var h__2133__auto____12045 = cljs.core.hash_imap.call(null, coll);
    this__12043.__hash = h__2133__auto____12045;
    return h__2133__auto____12045
  }
};
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__12046 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__12047 = this;
  var bucket__12048 = this__12047.hashobj[cljs.core.hash.call(null, k)];
  var i__12049 = cljs.core.truth_(bucket__12048) ? cljs.core.scan_array.call(null, 2, k, bucket__12048) : null;
  if(cljs.core.truth_(i__12049)) {
    return bucket__12048[i__12049 + 1]
  }else {
    return not_found
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__12050 = this;
  var h__12051 = cljs.core.hash.call(null, k);
  var bucket__12052 = this__12050.hashobj[h__12051];
  if(cljs.core.truth_(bucket__12052)) {
    var new_bucket__12053 = bucket__12052.slice();
    var new_hashobj__12054 = goog.object.clone(this__12050.hashobj);
    new_hashobj__12054[h__12051] = new_bucket__12053;
    var temp__4090__auto____12055 = cljs.core.scan_array.call(null, 2, k, new_bucket__12053);
    if(cljs.core.truth_(temp__4090__auto____12055)) {
      var i__12056 = temp__4090__auto____12055;
      new_bucket__12053[i__12056 + 1] = v;
      return new cljs.core.HashMap(this__12050.meta, this__12050.count, new_hashobj__12054, null)
    }else {
      new_bucket__12053.push(k, v);
      return new cljs.core.HashMap(this__12050.meta, this__12050.count + 1, new_hashobj__12054, null)
    }
  }else {
    var new_hashobj__12057 = goog.object.clone(this__12050.hashobj);
    new_hashobj__12057[h__12051] = [k, v];
    return new cljs.core.HashMap(this__12050.meta, this__12050.count + 1, new_hashobj__12057, null)
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__12058 = this;
  var bucket__12059 = this__12058.hashobj[cljs.core.hash.call(null, k)];
  var i__12060 = cljs.core.truth_(bucket__12059) ? cljs.core.scan_array.call(null, 2, k, bucket__12059) : null;
  if(cljs.core.truth_(i__12060)) {
    return true
  }else {
    return false
  }
};
cljs.core.HashMap.prototype.call = function() {
  var G__12085 = null;
  var G__12085__2 = function(this_sym12061, k) {
    var this__12063 = this;
    var this_sym12061__12064 = this;
    var coll__12065 = this_sym12061__12064;
    return coll__12065.cljs$core$ILookup$_lookup$arity$2(coll__12065, k)
  };
  var G__12085__3 = function(this_sym12062, k, not_found) {
    var this__12063 = this;
    var this_sym12062__12066 = this;
    var coll__12067 = this_sym12062__12066;
    return coll__12067.cljs$core$ILookup$_lookup$arity$3(coll__12067, k, not_found)
  };
  G__12085 = function(this_sym12062, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__12085__2.call(this, this_sym12062, k);
      case 3:
        return G__12085__3.call(this, this_sym12062, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__12085
}();
cljs.core.HashMap.prototype.apply = function(this_sym12041, args12042) {
  var this__12068 = this;
  return this_sym12041.call.apply(this_sym12041, [this_sym12041].concat(args12042.slice()))
};
cljs.core.HashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__12069 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.HashMap.prototype.toString = function() {
  var this__12070 = this;
  var this__12071 = this;
  return cljs.core.pr_str.call(null, this__12071)
};
cljs.core.HashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__12072 = this;
  if(this__12072.count > 0) {
    var hashes__12073 = cljs.core.js_keys.call(null, this__12072.hashobj).sort();
    return cljs.core.mapcat.call(null, function(p1__12040_SHARP_) {
      return cljs.core.map.call(null, cljs.core.vec, cljs.core.partition.call(null, 2, this__12072.hashobj[p1__12040_SHARP_]))
    }, hashes__12073)
  }else {
    return null
  }
};
cljs.core.HashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__12074 = this;
  return this__12074.count
};
cljs.core.HashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__12075 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.HashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__12076 = this;
  return new cljs.core.HashMap(meta, this__12076.count, this__12076.hashobj, this__12076.__hash)
};
cljs.core.HashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__12077 = this;
  return this__12077.meta
};
cljs.core.HashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__12078 = this;
  return cljs.core.with_meta.call(null, cljs.core.HashMap.EMPTY, this__12078.meta)
};
cljs.core.HashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__12079 = this;
  var h__12080 = cljs.core.hash.call(null, k);
  var bucket__12081 = this__12079.hashobj[h__12080];
  var i__12082 = cljs.core.truth_(bucket__12081) ? cljs.core.scan_array.call(null, 2, k, bucket__12081) : null;
  if(cljs.core.not.call(null, i__12082)) {
    return coll
  }else {
    var new_hashobj__12083 = goog.object.clone(this__12079.hashobj);
    if(3 > bucket__12081.length) {
      cljs.core.js_delete.call(null, new_hashobj__12083, h__12080)
    }else {
      var new_bucket__12084 = bucket__12081.slice();
      new_bucket__12084.splice(i__12082, 2);
      new_hashobj__12083[h__12080] = new_bucket__12084
    }
    return new cljs.core.HashMap(this__12079.meta, this__12079.count - 1, new_hashobj__12083, null)
  }
};
cljs.core.HashMap;
cljs.core.HashMap.EMPTY = new cljs.core.HashMap(null, 0, {}, 0);
cljs.core.HashMap.fromArrays = function(ks, vs) {
  var len__12086 = ks.length;
  var i__12087 = 0;
  var out__12088 = cljs.core.HashMap.EMPTY;
  while(true) {
    if(i__12087 < len__12086) {
      var G__12089 = i__12087 + 1;
      var G__12090 = cljs.core.assoc.call(null, out__12088, ks[i__12087], vs[i__12087]);
      i__12087 = G__12089;
      out__12088 = G__12090;
      continue
    }else {
      return out__12088
    }
    break
  }
};
cljs.core.array_map_index_of = function array_map_index_of(m, k) {
  var arr__12094 = m.arr;
  var len__12095 = arr__12094.length;
  var i__12096 = 0;
  while(true) {
    if(len__12095 <= i__12096) {
      return-1
    }else {
      if(cljs.core._EQ_.call(null, arr__12094[i__12096], k)) {
        return i__12096
      }else {
        if("\ufdd0'else") {
          var G__12097 = i__12096 + 2;
          i__12096 = G__12097;
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
  var this__12100 = this;
  return new cljs.core.TransientArrayMap({}, this__12100.arr.length, this__12100.arr.slice())
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__12101 = this;
  var h__2133__auto____12102 = this__12101.__hash;
  if(!(h__2133__auto____12102 == null)) {
    return h__2133__auto____12102
  }else {
    var h__2133__auto____12103 = cljs.core.hash_imap.call(null, coll);
    this__12101.__hash = h__2133__auto____12103;
    return h__2133__auto____12103
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__12104 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__12105 = this;
  var idx__12106 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__12106 === -1) {
    return not_found
  }else {
    return this__12105.arr[idx__12106 + 1]
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__12107 = this;
  var idx__12108 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__12108 === -1) {
    if(this__12107.cnt < cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
      return new cljs.core.PersistentArrayMap(this__12107.meta, this__12107.cnt + 1, function() {
        var G__12109__12110 = this__12107.arr.slice();
        G__12109__12110.push(k);
        G__12109__12110.push(v);
        return G__12109__12110
      }(), null)
    }else {
      return cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.PersistentHashMap.EMPTY, coll)), k, v))
    }
  }else {
    if(v === this__12107.arr[idx__12108 + 1]) {
      return coll
    }else {
      if("\ufdd0'else") {
        return new cljs.core.PersistentArrayMap(this__12107.meta, this__12107.cnt, function() {
          var G__12111__12112 = this__12107.arr.slice();
          G__12111__12112[idx__12108 + 1] = v;
          return G__12111__12112
        }(), null)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__12113 = this;
  return!(cljs.core.array_map_index_of.call(null, coll, k) === -1)
};
cljs.core.PersistentArrayMap.prototype.call = function() {
  var G__12145 = null;
  var G__12145__2 = function(this_sym12114, k) {
    var this__12116 = this;
    var this_sym12114__12117 = this;
    var coll__12118 = this_sym12114__12117;
    return coll__12118.cljs$core$ILookup$_lookup$arity$2(coll__12118, k)
  };
  var G__12145__3 = function(this_sym12115, k, not_found) {
    var this__12116 = this;
    var this_sym12115__12119 = this;
    var coll__12120 = this_sym12115__12119;
    return coll__12120.cljs$core$ILookup$_lookup$arity$3(coll__12120, k, not_found)
  };
  G__12145 = function(this_sym12115, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__12145__2.call(this, this_sym12115, k);
      case 3:
        return G__12145__3.call(this, this_sym12115, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__12145
}();
cljs.core.PersistentArrayMap.prototype.apply = function(this_sym12098, args12099) {
  var this__12121 = this;
  return this_sym12098.call.apply(this_sym12098, [this_sym12098].concat(args12099.slice()))
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__12122 = this;
  var len__12123 = this__12122.arr.length;
  var i__12124 = 0;
  var init__12125 = init;
  while(true) {
    if(i__12124 < len__12123) {
      var init__12126 = f.call(null, init__12125, this__12122.arr[i__12124], this__12122.arr[i__12124 + 1]);
      if(cljs.core.reduced_QMARK_.call(null, init__12126)) {
        return cljs.core.deref.call(null, init__12126)
      }else {
        var G__12146 = i__12124 + 2;
        var G__12147 = init__12126;
        i__12124 = G__12146;
        init__12125 = G__12147;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__12127 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentArrayMap.prototype.toString = function() {
  var this__12128 = this;
  var this__12129 = this;
  return cljs.core.pr_str.call(null, this__12129)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__12130 = this;
  if(this__12130.cnt > 0) {
    var len__12131 = this__12130.arr.length;
    var array_map_seq__12132 = function array_map_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < len__12131) {
          return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([this__12130.arr[i], this__12130.arr[i + 1]], true), array_map_seq.call(null, i + 2))
        }else {
          return null
        }
      }, null)
    };
    return array_map_seq__12132.call(null, 0)
  }else {
    return null
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__12133 = this;
  return this__12133.cnt
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__12134 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__12135 = this;
  return new cljs.core.PersistentArrayMap(meta, this__12135.cnt, this__12135.arr, this__12135.__hash)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__12136 = this;
  return this__12136.meta
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__12137 = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentArrayMap.EMPTY, this__12137.meta)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__12138 = this;
  var idx__12139 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__12139 >= 0) {
    var len__12140 = this__12138.arr.length;
    var new_len__12141 = len__12140 - 2;
    if(new_len__12141 === 0) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
    }else {
      var new_arr__12142 = cljs.core.make_array.call(null, new_len__12141);
      var s__12143 = 0;
      var d__12144 = 0;
      while(true) {
        if(s__12143 >= len__12140) {
          return new cljs.core.PersistentArrayMap(this__12138.meta, this__12138.cnt - 1, new_arr__12142, null)
        }else {
          if(cljs.core._EQ_.call(null, k, this__12138.arr[s__12143])) {
            var G__12148 = s__12143 + 2;
            var G__12149 = d__12144;
            s__12143 = G__12148;
            d__12144 = G__12149;
            continue
          }else {
            if("\ufdd0'else") {
              new_arr__12142[d__12144] = this__12138.arr[s__12143];
              new_arr__12142[d__12144 + 1] = this__12138.arr[s__12143 + 1];
              var G__12150 = s__12143 + 2;
              var G__12151 = d__12144 + 2;
              s__12143 = G__12150;
              d__12144 = G__12151;
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
  var len__12152 = cljs.core.count.call(null, ks);
  var i__12153 = 0;
  var out__12154 = cljs.core.transient$.call(null, cljs.core.PersistentArrayMap.EMPTY);
  while(true) {
    if(i__12153 < len__12152) {
      var G__12155 = i__12153 + 1;
      var G__12156 = cljs.core.assoc_BANG_.call(null, out__12154, ks[i__12153], vs[i__12153]);
      i__12153 = G__12155;
      out__12154 = G__12156;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__12154)
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
  var this__12157 = this;
  if(cljs.core.truth_(this__12157.editable_QMARK_)) {
    var idx__12158 = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx__12158 >= 0) {
      this__12157.arr[idx__12158] = this__12157.arr[this__12157.len - 2];
      this__12157.arr[idx__12158 + 1] = this__12157.arr[this__12157.len - 1];
      var G__12159__12160 = this__12157.arr;
      G__12159__12160.pop();
      G__12159__12160.pop();
      G__12159__12160;
      this__12157.len = this__12157.len - 2
    }else {
    }
    return tcoll
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__12161 = this;
  if(cljs.core.truth_(this__12161.editable_QMARK_)) {
    var idx__12162 = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx__12162 === -1) {
      if(this__12161.len + 2 <= 2 * cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
        this__12161.len = this__12161.len + 2;
        this__12161.arr.push(key);
        this__12161.arr.push(val);
        return tcoll
      }else {
        return cljs.core.assoc_BANG_.call(null, cljs.core.array__GT_transient_hash_map.call(null, this__12161.len, this__12161.arr), key, val)
      }
    }else {
      if(val === this__12161.arr[idx__12162 + 1]) {
        return tcoll
      }else {
        this__12161.arr[idx__12162 + 1] = val;
        return tcoll
      }
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__12163 = this;
  if(cljs.core.truth_(this__12163.editable_QMARK_)) {
    if(function() {
      var G__12164__12165 = o;
      if(G__12164__12165) {
        if(function() {
          var or__3943__auto____12166 = G__12164__12165.cljs$lang$protocol_mask$partition0$ & 2048;
          if(or__3943__auto____12166) {
            return or__3943__auto____12166
          }else {
            return G__12164__12165.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__12164__12165.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__12164__12165)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__12164__12165)
      }
    }()) {
      return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll, cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es__12167 = cljs.core.seq.call(null, o);
      var tcoll__12168 = tcoll;
      while(true) {
        var temp__4090__auto____12169 = cljs.core.first.call(null, es__12167);
        if(cljs.core.truth_(temp__4090__auto____12169)) {
          var e__12170 = temp__4090__auto____12169;
          var G__12176 = cljs.core.next.call(null, es__12167);
          var G__12177 = tcoll__12168.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll__12168, cljs.core.key.call(null, e__12170), cljs.core.val.call(null, e__12170));
          es__12167 = G__12176;
          tcoll__12168 = G__12177;
          continue
        }else {
          return tcoll__12168
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__12171 = this;
  if(cljs.core.truth_(this__12171.editable_QMARK_)) {
    this__12171.editable_QMARK_ = false;
    return new cljs.core.PersistentArrayMap(null, cljs.core.quot.call(null, this__12171.len, 2), this__12171.arr, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__12172 = this;
  return tcoll.cljs$core$ILookup$_lookup$arity$3(tcoll, k, null)
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__12173 = this;
  if(cljs.core.truth_(this__12173.editable_QMARK_)) {
    var idx__12174 = cljs.core.array_map_index_of.call(null, tcoll, k);
    if(idx__12174 === -1) {
      return not_found
    }else {
      return this__12173.arr[idx__12174 + 1]
    }
  }else {
    throw new Error("lookup after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__12175 = this;
  if(cljs.core.truth_(this__12175.editable_QMARK_)) {
    return cljs.core.quot.call(null, this__12175.len, 2)
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientArrayMap;
cljs.core.array__GT_transient_hash_map = function array__GT_transient_hash_map(len, arr) {
  var out__12180 = cljs.core.transient$.call(null, cljs.core.ObjMap.EMPTY);
  var i__12181 = 0;
  while(true) {
    if(i__12181 < len) {
      var G__12182 = cljs.core.assoc_BANG_.call(null, out__12180, arr[i__12181], arr[i__12181 + 1]);
      var G__12183 = i__12181 + 2;
      out__12180 = G__12182;
      i__12181 = G__12183;
      continue
    }else {
      return out__12180
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
    var G__12188__12189 = arr.slice();
    G__12188__12189[i] = a;
    return G__12188__12189
  };
  var clone_and_set__5 = function(arr, i, a, j, b) {
    var G__12190__12191 = arr.slice();
    G__12190__12191[i] = a;
    G__12190__12191[j] = b;
    return G__12190__12191
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
  var new_arr__12193 = cljs.core.make_array.call(null, arr.length - 2);
  cljs.core.array_copy.call(null, arr, 0, new_arr__12193, 0, 2 * i);
  cljs.core.array_copy.call(null, arr, 2 * (i + 1), new_arr__12193, 2 * i, new_arr__12193.length - 2 * i);
  return new_arr__12193
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
    var editable__12196 = inode.ensure_editable(edit);
    editable__12196.arr[i] = a;
    return editable__12196
  };
  var edit_and_set__6 = function(inode, edit, i, a, j, b) {
    var editable__12197 = inode.ensure_editable(edit);
    editable__12197.arr[i] = a;
    editable__12197.arr[j] = b;
    return editable__12197
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
  var len__12204 = arr.length;
  var i__12205 = 0;
  var init__12206 = init;
  while(true) {
    if(i__12205 < len__12204) {
      var init__12209 = function() {
        var k__12207 = arr[i__12205];
        if(!(k__12207 == null)) {
          return f.call(null, init__12206, k__12207, arr[i__12205 + 1])
        }else {
          var node__12208 = arr[i__12205 + 1];
          if(!(node__12208 == null)) {
            return node__12208.kv_reduce(f, init__12206)
          }else {
            return init__12206
          }
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__12209)) {
        return cljs.core.deref.call(null, init__12209)
      }else {
        var G__12210 = i__12205 + 2;
        var G__12211 = init__12209;
        i__12205 = G__12210;
        init__12206 = G__12211;
        continue
      }
    }else {
      return init__12206
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
  var this__12212 = this;
  var inode__12213 = this;
  if(this__12212.bitmap === bit) {
    return null
  }else {
    var editable__12214 = inode__12213.ensure_editable(e);
    var earr__12215 = editable__12214.arr;
    var len__12216 = earr__12215.length;
    editable__12214.bitmap = bit ^ editable__12214.bitmap;
    cljs.core.array_copy.call(null, earr__12215, 2 * (i + 1), earr__12215, 2 * i, len__12216 - 2 * (i + 1));
    earr__12215[len__12216 - 2] = null;
    earr__12215[len__12216 - 1] = null;
    return editable__12214
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__12217 = this;
  var inode__12218 = this;
  var bit__12219 = 1 << (hash >>> shift & 31);
  var idx__12220 = cljs.core.bitmap_indexed_node_index.call(null, this__12217.bitmap, bit__12219);
  if((this__12217.bitmap & bit__12219) === 0) {
    var n__12221 = cljs.core.bit_count.call(null, this__12217.bitmap);
    if(2 * n__12221 < this__12217.arr.length) {
      var editable__12222 = inode__12218.ensure_editable(edit);
      var earr__12223 = editable__12222.arr;
      added_leaf_QMARK_.val = true;
      cljs.core.array_copy_downward.call(null, earr__12223, 2 * idx__12220, earr__12223, 2 * (idx__12220 + 1), 2 * (n__12221 - idx__12220));
      earr__12223[2 * idx__12220] = key;
      earr__12223[2 * idx__12220 + 1] = val;
      editable__12222.bitmap = editable__12222.bitmap | bit__12219;
      return editable__12222
    }else {
      if(n__12221 >= 16) {
        var nodes__12224 = cljs.core.make_array.call(null, 32);
        var jdx__12225 = hash >>> shift & 31;
        nodes__12224[jdx__12225] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
        var i__12226 = 0;
        var j__12227 = 0;
        while(true) {
          if(i__12226 < 32) {
            if((this__12217.bitmap >>> i__12226 & 1) === 0) {
              var G__12280 = i__12226 + 1;
              var G__12281 = j__12227;
              i__12226 = G__12280;
              j__12227 = G__12281;
              continue
            }else {
              nodes__12224[i__12226] = !(this__12217.arr[j__12227] == null) ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, cljs.core.hash.call(null, this__12217.arr[j__12227]), this__12217.arr[j__12227], this__12217.arr[j__12227 + 1], added_leaf_QMARK_) : this__12217.arr[j__12227 + 1];
              var G__12282 = i__12226 + 1;
              var G__12283 = j__12227 + 2;
              i__12226 = G__12282;
              j__12227 = G__12283;
              continue
            }
          }else {
          }
          break
        }
        return new cljs.core.ArrayNode(edit, n__12221 + 1, nodes__12224)
      }else {
        if("\ufdd0'else") {
          var new_arr__12228 = cljs.core.make_array.call(null, 2 * (n__12221 + 4));
          cljs.core.array_copy.call(null, this__12217.arr, 0, new_arr__12228, 0, 2 * idx__12220);
          new_arr__12228[2 * idx__12220] = key;
          new_arr__12228[2 * idx__12220 + 1] = val;
          cljs.core.array_copy.call(null, this__12217.arr, 2 * idx__12220, new_arr__12228, 2 * (idx__12220 + 1), 2 * (n__12221 - idx__12220));
          added_leaf_QMARK_.val = true;
          var editable__12229 = inode__12218.ensure_editable(edit);
          editable__12229.arr = new_arr__12228;
          editable__12229.bitmap = editable__12229.bitmap | bit__12219;
          return editable__12229
        }else {
          return null
        }
      }
    }
  }else {
    var key_or_nil__12230 = this__12217.arr[2 * idx__12220];
    var val_or_node__12231 = this__12217.arr[2 * idx__12220 + 1];
    if(key_or_nil__12230 == null) {
      var n__12232 = val_or_node__12231.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__12232 === val_or_node__12231) {
        return inode__12218
      }else {
        return cljs.core.edit_and_set.call(null, inode__12218, edit, 2 * idx__12220 + 1, n__12232)
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__12230)) {
        if(val === val_or_node__12231) {
          return inode__12218
        }else {
          return cljs.core.edit_and_set.call(null, inode__12218, edit, 2 * idx__12220 + 1, val)
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_.val = true;
          return cljs.core.edit_and_set.call(null, inode__12218, edit, 2 * idx__12220, null, 2 * idx__12220 + 1, cljs.core.create_node.call(null, edit, shift + 5, key_or_nil__12230, val_or_node__12231, hash, key, val))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_seq = function() {
  var this__12233 = this;
  var inode__12234 = this;
  return cljs.core.create_inode_seq.call(null, this__12233.arr)
};
cljs.core.BitmapIndexedNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__12235 = this;
  var inode__12236 = this;
  var bit__12237 = 1 << (hash >>> shift & 31);
  if((this__12235.bitmap & bit__12237) === 0) {
    return inode__12236
  }else {
    var idx__12238 = cljs.core.bitmap_indexed_node_index.call(null, this__12235.bitmap, bit__12237);
    var key_or_nil__12239 = this__12235.arr[2 * idx__12238];
    var val_or_node__12240 = this__12235.arr[2 * idx__12238 + 1];
    if(key_or_nil__12239 == null) {
      var n__12241 = val_or_node__12240.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
      if(n__12241 === val_or_node__12240) {
        return inode__12236
      }else {
        if(!(n__12241 == null)) {
          return cljs.core.edit_and_set.call(null, inode__12236, edit, 2 * idx__12238 + 1, n__12241)
        }else {
          if(this__12235.bitmap === bit__12237) {
            return null
          }else {
            if("\ufdd0'else") {
              return inode__12236.edit_and_remove_pair(edit, bit__12237, idx__12238)
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__12239)) {
        removed_leaf_QMARK_[0] = true;
        return inode__12236.edit_and_remove_pair(edit, bit__12237, idx__12238)
      }else {
        if("\ufdd0'else") {
          return inode__12236
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.ensure_editable = function(e) {
  var this__12242 = this;
  var inode__12243 = this;
  if(e === this__12242.edit) {
    return inode__12243
  }else {
    var n__12244 = cljs.core.bit_count.call(null, this__12242.bitmap);
    var new_arr__12245 = cljs.core.make_array.call(null, n__12244 < 0 ? 4 : 2 * (n__12244 + 1));
    cljs.core.array_copy.call(null, this__12242.arr, 0, new_arr__12245, 0, 2 * n__12244);
    return new cljs.core.BitmapIndexedNode(e, this__12242.bitmap, new_arr__12245)
  }
};
cljs.core.BitmapIndexedNode.prototype.kv_reduce = function(f, init) {
  var this__12246 = this;
  var inode__12247 = this;
  return cljs.core.inode_kv_reduce.call(null, this__12246.arr, f, init)
};
cljs.core.BitmapIndexedNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__12248 = this;
  var inode__12249 = this;
  var bit__12250 = 1 << (hash >>> shift & 31);
  if((this__12248.bitmap & bit__12250) === 0) {
    return not_found
  }else {
    var idx__12251 = cljs.core.bitmap_indexed_node_index.call(null, this__12248.bitmap, bit__12250);
    var key_or_nil__12252 = this__12248.arr[2 * idx__12251];
    var val_or_node__12253 = this__12248.arr[2 * idx__12251 + 1];
    if(key_or_nil__12252 == null) {
      return val_or_node__12253.inode_find(shift + 5, hash, key, not_found)
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__12252)) {
        return cljs.core.PersistentVector.fromArray([key_or_nil__12252, val_or_node__12253], true)
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
  var this__12254 = this;
  var inode__12255 = this;
  var bit__12256 = 1 << (hash >>> shift & 31);
  if((this__12254.bitmap & bit__12256) === 0) {
    return inode__12255
  }else {
    var idx__12257 = cljs.core.bitmap_indexed_node_index.call(null, this__12254.bitmap, bit__12256);
    var key_or_nil__12258 = this__12254.arr[2 * idx__12257];
    var val_or_node__12259 = this__12254.arr[2 * idx__12257 + 1];
    if(key_or_nil__12258 == null) {
      var n__12260 = val_or_node__12259.inode_without(shift + 5, hash, key);
      if(n__12260 === val_or_node__12259) {
        return inode__12255
      }else {
        if(!(n__12260 == null)) {
          return new cljs.core.BitmapIndexedNode(null, this__12254.bitmap, cljs.core.clone_and_set.call(null, this__12254.arr, 2 * idx__12257 + 1, n__12260))
        }else {
          if(this__12254.bitmap === bit__12256) {
            return null
          }else {
            if("\ufdd0'else") {
              return new cljs.core.BitmapIndexedNode(null, this__12254.bitmap ^ bit__12256, cljs.core.remove_pair.call(null, this__12254.arr, idx__12257))
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__12258)) {
        return new cljs.core.BitmapIndexedNode(null, this__12254.bitmap ^ bit__12256, cljs.core.remove_pair.call(null, this__12254.arr, idx__12257))
      }else {
        if("\ufdd0'else") {
          return inode__12255
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__12261 = this;
  var inode__12262 = this;
  var bit__12263 = 1 << (hash >>> shift & 31);
  var idx__12264 = cljs.core.bitmap_indexed_node_index.call(null, this__12261.bitmap, bit__12263);
  if((this__12261.bitmap & bit__12263) === 0) {
    var n__12265 = cljs.core.bit_count.call(null, this__12261.bitmap);
    if(n__12265 >= 16) {
      var nodes__12266 = cljs.core.make_array.call(null, 32);
      var jdx__12267 = hash >>> shift & 31;
      nodes__12266[jdx__12267] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      var i__12268 = 0;
      var j__12269 = 0;
      while(true) {
        if(i__12268 < 32) {
          if((this__12261.bitmap >>> i__12268 & 1) === 0) {
            var G__12284 = i__12268 + 1;
            var G__12285 = j__12269;
            i__12268 = G__12284;
            j__12269 = G__12285;
            continue
          }else {
            nodes__12266[i__12268] = !(this__12261.arr[j__12269] == null) ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, cljs.core.hash.call(null, this__12261.arr[j__12269]), this__12261.arr[j__12269], this__12261.arr[j__12269 + 1], added_leaf_QMARK_) : this__12261.arr[j__12269 + 1];
            var G__12286 = i__12268 + 1;
            var G__12287 = j__12269 + 2;
            i__12268 = G__12286;
            j__12269 = G__12287;
            continue
          }
        }else {
        }
        break
      }
      return new cljs.core.ArrayNode(null, n__12265 + 1, nodes__12266)
    }else {
      var new_arr__12270 = cljs.core.make_array.call(null, 2 * (n__12265 + 1));
      cljs.core.array_copy.call(null, this__12261.arr, 0, new_arr__12270, 0, 2 * idx__12264);
      new_arr__12270[2 * idx__12264] = key;
      new_arr__12270[2 * idx__12264 + 1] = val;
      cljs.core.array_copy.call(null, this__12261.arr, 2 * idx__12264, new_arr__12270, 2 * (idx__12264 + 1), 2 * (n__12265 - idx__12264));
      added_leaf_QMARK_.val = true;
      return new cljs.core.BitmapIndexedNode(null, this__12261.bitmap | bit__12263, new_arr__12270)
    }
  }else {
    var key_or_nil__12271 = this__12261.arr[2 * idx__12264];
    var val_or_node__12272 = this__12261.arr[2 * idx__12264 + 1];
    if(key_or_nil__12271 == null) {
      var n__12273 = val_or_node__12272.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__12273 === val_or_node__12272) {
        return inode__12262
      }else {
        return new cljs.core.BitmapIndexedNode(null, this__12261.bitmap, cljs.core.clone_and_set.call(null, this__12261.arr, 2 * idx__12264 + 1, n__12273))
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__12271)) {
        if(val === val_or_node__12272) {
          return inode__12262
        }else {
          return new cljs.core.BitmapIndexedNode(null, this__12261.bitmap, cljs.core.clone_and_set.call(null, this__12261.arr, 2 * idx__12264 + 1, val))
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_.val = true;
          return new cljs.core.BitmapIndexedNode(null, this__12261.bitmap, cljs.core.clone_and_set.call(null, this__12261.arr, 2 * idx__12264, null, 2 * idx__12264 + 1, cljs.core.create_node.call(null, shift + 5, key_or_nil__12271, val_or_node__12272, hash, key, val)))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__12274 = this;
  var inode__12275 = this;
  var bit__12276 = 1 << (hash >>> shift & 31);
  if((this__12274.bitmap & bit__12276) === 0) {
    return not_found
  }else {
    var idx__12277 = cljs.core.bitmap_indexed_node_index.call(null, this__12274.bitmap, bit__12276);
    var key_or_nil__12278 = this__12274.arr[2 * idx__12277];
    var val_or_node__12279 = this__12274.arr[2 * idx__12277 + 1];
    if(key_or_nil__12278 == null) {
      return val_or_node__12279.inode_lookup(shift + 5, hash, key, not_found)
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__12278)) {
        return val_or_node__12279
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
  var arr__12295 = array_node.arr;
  var len__12296 = 2 * (array_node.cnt - 1);
  var new_arr__12297 = cljs.core.make_array.call(null, len__12296);
  var i__12298 = 0;
  var j__12299 = 1;
  var bitmap__12300 = 0;
  while(true) {
    if(i__12298 < len__12296) {
      if(function() {
        var and__3941__auto____12301 = !(i__12298 === idx);
        if(and__3941__auto____12301) {
          return!(arr__12295[i__12298] == null)
        }else {
          return and__3941__auto____12301
        }
      }()) {
        new_arr__12297[j__12299] = arr__12295[i__12298];
        var G__12302 = i__12298 + 1;
        var G__12303 = j__12299 + 2;
        var G__12304 = bitmap__12300 | 1 << i__12298;
        i__12298 = G__12302;
        j__12299 = G__12303;
        bitmap__12300 = G__12304;
        continue
      }else {
        var G__12305 = i__12298 + 1;
        var G__12306 = j__12299;
        var G__12307 = bitmap__12300;
        i__12298 = G__12305;
        j__12299 = G__12306;
        bitmap__12300 = G__12307;
        continue
      }
    }else {
      return new cljs.core.BitmapIndexedNode(edit, bitmap__12300, new_arr__12297)
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
  var this__12308 = this;
  var inode__12309 = this;
  var idx__12310 = hash >>> shift & 31;
  var node__12311 = this__12308.arr[idx__12310];
  if(node__12311 == null) {
    var editable__12312 = cljs.core.edit_and_set.call(null, inode__12309, edit, idx__12310, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_));
    editable__12312.cnt = editable__12312.cnt + 1;
    return editable__12312
  }else {
    var n__12313 = node__12311.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__12313 === node__12311) {
      return inode__12309
    }else {
      return cljs.core.edit_and_set.call(null, inode__12309, edit, idx__12310, n__12313)
    }
  }
};
cljs.core.ArrayNode.prototype.inode_seq = function() {
  var this__12314 = this;
  var inode__12315 = this;
  return cljs.core.create_array_node_seq.call(null, this__12314.arr)
};
cljs.core.ArrayNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__12316 = this;
  var inode__12317 = this;
  var idx__12318 = hash >>> shift & 31;
  var node__12319 = this__12316.arr[idx__12318];
  if(node__12319 == null) {
    return inode__12317
  }else {
    var n__12320 = node__12319.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
    if(n__12320 === node__12319) {
      return inode__12317
    }else {
      if(n__12320 == null) {
        if(this__12316.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode__12317, edit, idx__12318)
        }else {
          var editable__12321 = cljs.core.edit_and_set.call(null, inode__12317, edit, idx__12318, n__12320);
          editable__12321.cnt = editable__12321.cnt - 1;
          return editable__12321
        }
      }else {
        if("\ufdd0'else") {
          return cljs.core.edit_and_set.call(null, inode__12317, edit, idx__12318, n__12320)
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.ArrayNode.prototype.ensure_editable = function(e) {
  var this__12322 = this;
  var inode__12323 = this;
  if(e === this__12322.edit) {
    return inode__12323
  }else {
    return new cljs.core.ArrayNode(e, this__12322.cnt, this__12322.arr.slice())
  }
};
cljs.core.ArrayNode.prototype.kv_reduce = function(f, init) {
  var this__12324 = this;
  var inode__12325 = this;
  var len__12326 = this__12324.arr.length;
  var i__12327 = 0;
  var init__12328 = init;
  while(true) {
    if(i__12327 < len__12326) {
      var node__12329 = this__12324.arr[i__12327];
      if(!(node__12329 == null)) {
        var init__12330 = node__12329.kv_reduce(f, init__12328);
        if(cljs.core.reduced_QMARK_.call(null, init__12330)) {
          return cljs.core.deref.call(null, init__12330)
        }else {
          var G__12349 = i__12327 + 1;
          var G__12350 = init__12330;
          i__12327 = G__12349;
          init__12328 = G__12350;
          continue
        }
      }else {
        return null
      }
    }else {
      return init__12328
    }
    break
  }
};
cljs.core.ArrayNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__12331 = this;
  var inode__12332 = this;
  var idx__12333 = hash >>> shift & 31;
  var node__12334 = this__12331.arr[idx__12333];
  if(!(node__12334 == null)) {
    return node__12334.inode_find(shift + 5, hash, key, not_found)
  }else {
    return not_found
  }
};
cljs.core.ArrayNode.prototype.inode_without = function(shift, hash, key) {
  var this__12335 = this;
  var inode__12336 = this;
  var idx__12337 = hash >>> shift & 31;
  var node__12338 = this__12335.arr[idx__12337];
  if(!(node__12338 == null)) {
    var n__12339 = node__12338.inode_without(shift + 5, hash, key);
    if(n__12339 === node__12338) {
      return inode__12336
    }else {
      if(n__12339 == null) {
        if(this__12335.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode__12336, null, idx__12337)
        }else {
          return new cljs.core.ArrayNode(null, this__12335.cnt - 1, cljs.core.clone_and_set.call(null, this__12335.arr, idx__12337, n__12339))
        }
      }else {
        if("\ufdd0'else") {
          return new cljs.core.ArrayNode(null, this__12335.cnt, cljs.core.clone_and_set.call(null, this__12335.arr, idx__12337, n__12339))
        }else {
          return null
        }
      }
    }
  }else {
    return inode__12336
  }
};
cljs.core.ArrayNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__12340 = this;
  var inode__12341 = this;
  var idx__12342 = hash >>> shift & 31;
  var node__12343 = this__12340.arr[idx__12342];
  if(node__12343 == null) {
    return new cljs.core.ArrayNode(null, this__12340.cnt + 1, cljs.core.clone_and_set.call(null, this__12340.arr, idx__12342, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_)))
  }else {
    var n__12344 = node__12343.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__12344 === node__12343) {
      return inode__12341
    }else {
      return new cljs.core.ArrayNode(null, this__12340.cnt, cljs.core.clone_and_set.call(null, this__12340.arr, idx__12342, n__12344))
    }
  }
};
cljs.core.ArrayNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__12345 = this;
  var inode__12346 = this;
  var idx__12347 = hash >>> shift & 31;
  var node__12348 = this__12345.arr[idx__12347];
  if(!(node__12348 == null)) {
    return node__12348.inode_lookup(shift + 5, hash, key, not_found)
  }else {
    return not_found
  }
};
cljs.core.ArrayNode;
cljs.core.hash_collision_node_find_index = function hash_collision_node_find_index(arr, cnt, key) {
  var lim__12353 = 2 * cnt;
  var i__12354 = 0;
  while(true) {
    if(i__12354 < lim__12353) {
      if(cljs.core.key_test.call(null, key, arr[i__12354])) {
        return i__12354
      }else {
        var G__12355 = i__12354 + 2;
        i__12354 = G__12355;
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
  var this__12356 = this;
  var inode__12357 = this;
  if(hash === this__12356.collision_hash) {
    var idx__12358 = cljs.core.hash_collision_node_find_index.call(null, this__12356.arr, this__12356.cnt, key);
    if(idx__12358 === -1) {
      if(this__12356.arr.length > 2 * this__12356.cnt) {
        var editable__12359 = cljs.core.edit_and_set.call(null, inode__12357, edit, 2 * this__12356.cnt, key, 2 * this__12356.cnt + 1, val);
        added_leaf_QMARK_.val = true;
        editable__12359.cnt = editable__12359.cnt + 1;
        return editable__12359
      }else {
        var len__12360 = this__12356.arr.length;
        var new_arr__12361 = cljs.core.make_array.call(null, len__12360 + 2);
        cljs.core.array_copy.call(null, this__12356.arr, 0, new_arr__12361, 0, len__12360);
        new_arr__12361[len__12360] = key;
        new_arr__12361[len__12360 + 1] = val;
        added_leaf_QMARK_.val = true;
        return inode__12357.ensure_editable_array(edit, this__12356.cnt + 1, new_arr__12361)
      }
    }else {
      if(this__12356.arr[idx__12358 + 1] === val) {
        return inode__12357
      }else {
        return cljs.core.edit_and_set.call(null, inode__12357, edit, idx__12358 + 1, val)
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(edit, 1 << (this__12356.collision_hash >>> shift & 31), [null, inode__12357, null, null])).inode_assoc_BANG_(edit, shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_seq = function() {
  var this__12362 = this;
  var inode__12363 = this;
  return cljs.core.create_inode_seq.call(null, this__12362.arr)
};
cljs.core.HashCollisionNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__12364 = this;
  var inode__12365 = this;
  var idx__12366 = cljs.core.hash_collision_node_find_index.call(null, this__12364.arr, this__12364.cnt, key);
  if(idx__12366 === -1) {
    return inode__12365
  }else {
    removed_leaf_QMARK_[0] = true;
    if(this__12364.cnt === 1) {
      return null
    }else {
      var editable__12367 = inode__12365.ensure_editable(edit);
      var earr__12368 = editable__12367.arr;
      earr__12368[idx__12366] = earr__12368[2 * this__12364.cnt - 2];
      earr__12368[idx__12366 + 1] = earr__12368[2 * this__12364.cnt - 1];
      earr__12368[2 * this__12364.cnt - 1] = null;
      earr__12368[2 * this__12364.cnt - 2] = null;
      editable__12367.cnt = editable__12367.cnt - 1;
      return editable__12367
    }
  }
};
cljs.core.HashCollisionNode.prototype.ensure_editable = function(e) {
  var this__12369 = this;
  var inode__12370 = this;
  if(e === this__12369.edit) {
    return inode__12370
  }else {
    var new_arr__12371 = cljs.core.make_array.call(null, 2 * (this__12369.cnt + 1));
    cljs.core.array_copy.call(null, this__12369.arr, 0, new_arr__12371, 0, 2 * this__12369.cnt);
    return new cljs.core.HashCollisionNode(e, this__12369.collision_hash, this__12369.cnt, new_arr__12371)
  }
};
cljs.core.HashCollisionNode.prototype.kv_reduce = function(f, init) {
  var this__12372 = this;
  var inode__12373 = this;
  return cljs.core.inode_kv_reduce.call(null, this__12372.arr, f, init)
};
cljs.core.HashCollisionNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__12374 = this;
  var inode__12375 = this;
  var idx__12376 = cljs.core.hash_collision_node_find_index.call(null, this__12374.arr, this__12374.cnt, key);
  if(idx__12376 < 0) {
    return not_found
  }else {
    if(cljs.core.key_test.call(null, key, this__12374.arr[idx__12376])) {
      return cljs.core.PersistentVector.fromArray([this__12374.arr[idx__12376], this__12374.arr[idx__12376 + 1]], true)
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
  var this__12377 = this;
  var inode__12378 = this;
  var idx__12379 = cljs.core.hash_collision_node_find_index.call(null, this__12377.arr, this__12377.cnt, key);
  if(idx__12379 === -1) {
    return inode__12378
  }else {
    if(this__12377.cnt === 1) {
      return null
    }else {
      if("\ufdd0'else") {
        return new cljs.core.HashCollisionNode(null, this__12377.collision_hash, this__12377.cnt - 1, cljs.core.remove_pair.call(null, this__12377.arr, cljs.core.quot.call(null, idx__12379, 2)))
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__12380 = this;
  var inode__12381 = this;
  if(hash === this__12380.collision_hash) {
    var idx__12382 = cljs.core.hash_collision_node_find_index.call(null, this__12380.arr, this__12380.cnt, key);
    if(idx__12382 === -1) {
      var len__12383 = this__12380.arr.length;
      var new_arr__12384 = cljs.core.make_array.call(null, len__12383 + 2);
      cljs.core.array_copy.call(null, this__12380.arr, 0, new_arr__12384, 0, len__12383);
      new_arr__12384[len__12383] = key;
      new_arr__12384[len__12383 + 1] = val;
      added_leaf_QMARK_.val = true;
      return new cljs.core.HashCollisionNode(null, this__12380.collision_hash, this__12380.cnt + 1, new_arr__12384)
    }else {
      if(cljs.core._EQ_.call(null, this__12380.arr[idx__12382], val)) {
        return inode__12381
      }else {
        return new cljs.core.HashCollisionNode(null, this__12380.collision_hash, this__12380.cnt, cljs.core.clone_and_set.call(null, this__12380.arr, idx__12382 + 1, val))
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(null, 1 << (this__12380.collision_hash >>> shift & 31), [null, inode__12381])).inode_assoc(shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__12385 = this;
  var inode__12386 = this;
  var idx__12387 = cljs.core.hash_collision_node_find_index.call(null, this__12385.arr, this__12385.cnt, key);
  if(idx__12387 < 0) {
    return not_found
  }else {
    if(cljs.core.key_test.call(null, key, this__12385.arr[idx__12387])) {
      return this__12385.arr[idx__12387 + 1]
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
  var this__12388 = this;
  var inode__12389 = this;
  if(e === this__12388.edit) {
    this__12388.arr = array;
    this__12388.cnt = count;
    return inode__12389
  }else {
    return new cljs.core.HashCollisionNode(this__12388.edit, this__12388.collision_hash, count, array)
  }
};
cljs.core.HashCollisionNode;
cljs.core.create_node = function() {
  var create_node = null;
  var create_node__6 = function(shift, key1, val1, key2hash, key2, val2) {
    var key1hash__12394 = cljs.core.hash.call(null, key1);
    if(key1hash__12394 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__12394, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___12395 = new cljs.core.Box(false);
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift, key1hash__12394, key1, val1, added_leaf_QMARK___12395).inode_assoc(shift, key2hash, key2, val2, added_leaf_QMARK___12395)
    }
  };
  var create_node__7 = function(edit, shift, key1, val1, key2hash, key2, val2) {
    var key1hash__12396 = cljs.core.hash.call(null, key1);
    if(key1hash__12396 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__12396, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___12397 = new cljs.core.Box(false);
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift, key1hash__12396, key1, val1, added_leaf_QMARK___12397).inode_assoc_BANG_(edit, shift, key2hash, key2, val2, added_leaf_QMARK___12397)
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
  var this__12398 = this;
  var h__2133__auto____12399 = this__12398.__hash;
  if(!(h__2133__auto____12399 == null)) {
    return h__2133__auto____12399
  }else {
    var h__2133__auto____12400 = cljs.core.hash_coll.call(null, coll);
    this__12398.__hash = h__2133__auto____12400;
    return h__2133__auto____12400
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__12401 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.NodeSeq.prototype.toString = function() {
  var this__12402 = this;
  var this__12403 = this;
  return cljs.core.pr_str.call(null, this__12403)
};
cljs.core.NodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__12404 = this;
  return this$
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__12405 = this;
  if(this__12405.s == null) {
    return cljs.core.PersistentVector.fromArray([this__12405.nodes[this__12405.i], this__12405.nodes[this__12405.i + 1]], true)
  }else {
    return cljs.core.first.call(null, this__12405.s)
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__12406 = this;
  if(this__12406.s == null) {
    return cljs.core.create_inode_seq.call(null, this__12406.nodes, this__12406.i + 2, null)
  }else {
    return cljs.core.create_inode_seq.call(null, this__12406.nodes, this__12406.i, cljs.core.next.call(null, this__12406.s))
  }
};
cljs.core.NodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__12407 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.NodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__12408 = this;
  return new cljs.core.NodeSeq(meta, this__12408.nodes, this__12408.i, this__12408.s, this__12408.__hash)
};
cljs.core.NodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__12409 = this;
  return this__12409.meta
};
cljs.core.NodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__12410 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__12410.meta)
};
cljs.core.NodeSeq;
cljs.core.create_inode_seq = function() {
  var create_inode_seq = null;
  var create_inode_seq__1 = function(nodes) {
    return create_inode_seq.call(null, nodes, 0, null)
  };
  var create_inode_seq__3 = function(nodes, i, s) {
    if(s == null) {
      var len__12417 = nodes.length;
      var j__12418 = i;
      while(true) {
        if(j__12418 < len__12417) {
          if(!(nodes[j__12418] == null)) {
            return new cljs.core.NodeSeq(null, nodes, j__12418, null, null)
          }else {
            var temp__4090__auto____12419 = nodes[j__12418 + 1];
            if(cljs.core.truth_(temp__4090__auto____12419)) {
              var node__12420 = temp__4090__auto____12419;
              var temp__4090__auto____12421 = node__12420.inode_seq();
              if(cljs.core.truth_(temp__4090__auto____12421)) {
                var node_seq__12422 = temp__4090__auto____12421;
                return new cljs.core.NodeSeq(null, nodes, j__12418 + 2, node_seq__12422, null)
              }else {
                var G__12423 = j__12418 + 2;
                j__12418 = G__12423;
                continue
              }
            }else {
              var G__12424 = j__12418 + 2;
              j__12418 = G__12424;
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
  var this__12425 = this;
  var h__2133__auto____12426 = this__12425.__hash;
  if(!(h__2133__auto____12426 == null)) {
    return h__2133__auto____12426
  }else {
    var h__2133__auto____12427 = cljs.core.hash_coll.call(null, coll);
    this__12425.__hash = h__2133__auto____12427;
    return h__2133__auto____12427
  }
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__12428 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.ArrayNodeSeq.prototype.toString = function() {
  var this__12429 = this;
  var this__12430 = this;
  return cljs.core.pr_str.call(null, this__12430)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__12431 = this;
  return this$
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__12432 = this;
  return cljs.core.first.call(null, this__12432.s)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__12433 = this;
  return cljs.core.create_array_node_seq.call(null, null, this__12433.nodes, this__12433.i, cljs.core.next.call(null, this__12433.s))
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__12434 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__12435 = this;
  return new cljs.core.ArrayNodeSeq(meta, this__12435.nodes, this__12435.i, this__12435.s, this__12435.__hash)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__12436 = this;
  return this__12436.meta
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__12437 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__12437.meta)
};
cljs.core.ArrayNodeSeq;
cljs.core.create_array_node_seq = function() {
  var create_array_node_seq = null;
  var create_array_node_seq__1 = function(nodes) {
    return create_array_node_seq.call(null, null, nodes, 0, null)
  };
  var create_array_node_seq__4 = function(meta, nodes, i, s) {
    if(s == null) {
      var len__12444 = nodes.length;
      var j__12445 = i;
      while(true) {
        if(j__12445 < len__12444) {
          var temp__4090__auto____12446 = nodes[j__12445];
          if(cljs.core.truth_(temp__4090__auto____12446)) {
            var nj__12447 = temp__4090__auto____12446;
            var temp__4090__auto____12448 = nj__12447.inode_seq();
            if(cljs.core.truth_(temp__4090__auto____12448)) {
              var ns__12449 = temp__4090__auto____12448;
              return new cljs.core.ArrayNodeSeq(meta, nodes, j__12445 + 1, ns__12449, null)
            }else {
              var G__12450 = j__12445 + 1;
              j__12445 = G__12450;
              continue
            }
          }else {
            var G__12451 = j__12445 + 1;
            j__12445 = G__12451;
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
  var this__12454 = this;
  return new cljs.core.TransientHashMap({}, this__12454.root, this__12454.cnt, this__12454.has_nil_QMARK_, this__12454.nil_val)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__12455 = this;
  var h__2133__auto____12456 = this__12455.__hash;
  if(!(h__2133__auto____12456 == null)) {
    return h__2133__auto____12456
  }else {
    var h__2133__auto____12457 = cljs.core.hash_imap.call(null, coll);
    this__12455.__hash = h__2133__auto____12457;
    return h__2133__auto____12457
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__12458 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__12459 = this;
  if(k == null) {
    if(this__12459.has_nil_QMARK_) {
      return this__12459.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__12459.root == null) {
      return not_found
    }else {
      if("\ufdd0'else") {
        return this__12459.root.inode_lookup(0, cljs.core.hash.call(null, k), k, not_found)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__12460 = this;
  if(k == null) {
    if(function() {
      var and__3941__auto____12461 = this__12460.has_nil_QMARK_;
      if(and__3941__auto____12461) {
        return v === this__12460.nil_val
      }else {
        return and__3941__auto____12461
      }
    }()) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__12460.meta, this__12460.has_nil_QMARK_ ? this__12460.cnt : this__12460.cnt + 1, this__12460.root, true, v, null)
    }
  }else {
    var added_leaf_QMARK___12462 = new cljs.core.Box(false);
    var new_root__12463 = (this__12460.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__12460.root).inode_assoc(0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK___12462);
    if(new_root__12463 === this__12460.root) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__12460.meta, added_leaf_QMARK___12462.val ? this__12460.cnt + 1 : this__12460.cnt, new_root__12463, this__12460.has_nil_QMARK_, this__12460.nil_val, null)
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__12464 = this;
  if(k == null) {
    return this__12464.has_nil_QMARK_
  }else {
    if(this__12464.root == null) {
      return false
    }else {
      if("\ufdd0'else") {
        return!(this__12464.root.inode_lookup(0, cljs.core.hash.call(null, k), k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.call = function() {
  var G__12487 = null;
  var G__12487__2 = function(this_sym12465, k) {
    var this__12467 = this;
    var this_sym12465__12468 = this;
    var coll__12469 = this_sym12465__12468;
    return coll__12469.cljs$core$ILookup$_lookup$arity$2(coll__12469, k)
  };
  var G__12487__3 = function(this_sym12466, k, not_found) {
    var this__12467 = this;
    var this_sym12466__12470 = this;
    var coll__12471 = this_sym12466__12470;
    return coll__12471.cljs$core$ILookup$_lookup$arity$3(coll__12471, k, not_found)
  };
  G__12487 = function(this_sym12466, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__12487__2.call(this, this_sym12466, k);
      case 3:
        return G__12487__3.call(this, this_sym12466, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__12487
}();
cljs.core.PersistentHashMap.prototype.apply = function(this_sym12452, args12453) {
  var this__12472 = this;
  return this_sym12452.call.apply(this_sym12452, [this_sym12452].concat(args12453.slice()))
};
cljs.core.PersistentHashMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__12473 = this;
  var init__12474 = this__12473.has_nil_QMARK_ ? f.call(null, init, null, this__12473.nil_val) : init;
  if(cljs.core.reduced_QMARK_.call(null, init__12474)) {
    return cljs.core.deref.call(null, init__12474)
  }else {
    if(!(this__12473.root == null)) {
      return this__12473.root.kv_reduce(f, init__12474)
    }else {
      if("\ufdd0'else") {
        return init__12474
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__12475 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentHashMap.prototype.toString = function() {
  var this__12476 = this;
  var this__12477 = this;
  return cljs.core.pr_str.call(null, this__12477)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__12478 = this;
  if(this__12478.cnt > 0) {
    var s__12479 = !(this__12478.root == null) ? this__12478.root.inode_seq() : null;
    if(this__12478.has_nil_QMARK_) {
      return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([null, this__12478.nil_val], true), s__12479)
    }else {
      return s__12479
    }
  }else {
    return null
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__12480 = this;
  return this__12480.cnt
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__12481 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__12482 = this;
  return new cljs.core.PersistentHashMap(meta, this__12482.cnt, this__12482.root, this__12482.has_nil_QMARK_, this__12482.nil_val, this__12482.__hash)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__12483 = this;
  return this__12483.meta
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__12484 = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, this__12484.meta)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__12485 = this;
  if(k == null) {
    if(this__12485.has_nil_QMARK_) {
      return new cljs.core.PersistentHashMap(this__12485.meta, this__12485.cnt - 1, this__12485.root, false, null, null)
    }else {
      return coll
    }
  }else {
    if(this__12485.root == null) {
      return coll
    }else {
      if("\ufdd0'else") {
        var new_root__12486 = this__12485.root.inode_without(0, cljs.core.hash.call(null, k), k);
        if(new_root__12486 === this__12485.root) {
          return coll
        }else {
          return new cljs.core.PersistentHashMap(this__12485.meta, this__12485.cnt - 1, new_root__12486, this__12485.has_nil_QMARK_, this__12485.nil_val, null)
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
  var len__12488 = ks.length;
  var i__12489 = 0;
  var out__12490 = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
  while(true) {
    if(i__12489 < len__12488) {
      var G__12491 = i__12489 + 1;
      var G__12492 = cljs.core.assoc_BANG_.call(null, out__12490, ks[i__12489], vs[i__12489]);
      i__12489 = G__12491;
      out__12490 = G__12492;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__12490)
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
  var this__12493 = this;
  return tcoll.without_BANG_(key)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__12494 = this;
  return tcoll.assoc_BANG_(key, val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, val) {
  var this__12495 = this;
  return tcoll.conj_BANG_(val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__12496 = this;
  return tcoll.persistent_BANG_()
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__12497 = this;
  if(k == null) {
    if(this__12497.has_nil_QMARK_) {
      return this__12497.nil_val
    }else {
      return null
    }
  }else {
    if(this__12497.root == null) {
      return null
    }else {
      return this__12497.root.inode_lookup(0, cljs.core.hash.call(null, k), k)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__12498 = this;
  if(k == null) {
    if(this__12498.has_nil_QMARK_) {
      return this__12498.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__12498.root == null) {
      return not_found
    }else {
      return this__12498.root.inode_lookup(0, cljs.core.hash.call(null, k), k, not_found)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__12499 = this;
  if(this__12499.edit) {
    return this__12499.count
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.conj_BANG_ = function(o) {
  var this__12500 = this;
  var tcoll__12501 = this;
  if(this__12500.edit) {
    if(function() {
      var G__12502__12503 = o;
      if(G__12502__12503) {
        if(function() {
          var or__3943__auto____12504 = G__12502__12503.cljs$lang$protocol_mask$partition0$ & 2048;
          if(or__3943__auto____12504) {
            return or__3943__auto____12504
          }else {
            return G__12502__12503.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__12502__12503.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__12502__12503)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__12502__12503)
      }
    }()) {
      return tcoll__12501.assoc_BANG_(cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es__12505 = cljs.core.seq.call(null, o);
      var tcoll__12506 = tcoll__12501;
      while(true) {
        var temp__4090__auto____12507 = cljs.core.first.call(null, es__12505);
        if(cljs.core.truth_(temp__4090__auto____12507)) {
          var e__12508 = temp__4090__auto____12507;
          var G__12519 = cljs.core.next.call(null, es__12505);
          var G__12520 = tcoll__12506.assoc_BANG_(cljs.core.key.call(null, e__12508), cljs.core.val.call(null, e__12508));
          es__12505 = G__12519;
          tcoll__12506 = G__12520;
          continue
        }else {
          return tcoll__12506
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent");
  }
};
cljs.core.TransientHashMap.prototype.assoc_BANG_ = function(k, v) {
  var this__12509 = this;
  var tcoll__12510 = this;
  if(this__12509.edit) {
    if(k == null) {
      if(this__12509.nil_val === v) {
      }else {
        this__12509.nil_val = v
      }
      if(this__12509.has_nil_QMARK_) {
      }else {
        this__12509.count = this__12509.count + 1;
        this__12509.has_nil_QMARK_ = true
      }
      return tcoll__12510
    }else {
      var added_leaf_QMARK___12511 = new cljs.core.Box(false);
      var node__12512 = (this__12509.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__12509.root).inode_assoc_BANG_(this__12509.edit, 0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK___12511);
      if(node__12512 === this__12509.root) {
      }else {
        this__12509.root = node__12512
      }
      if(added_leaf_QMARK___12511.val) {
        this__12509.count = this__12509.count + 1
      }else {
      }
      return tcoll__12510
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.without_BANG_ = function(k) {
  var this__12513 = this;
  var tcoll__12514 = this;
  if(this__12513.edit) {
    if(k == null) {
      if(this__12513.has_nil_QMARK_) {
        this__12513.has_nil_QMARK_ = false;
        this__12513.nil_val = null;
        this__12513.count = this__12513.count - 1;
        return tcoll__12514
      }else {
        return tcoll__12514
      }
    }else {
      if(this__12513.root == null) {
        return tcoll__12514
      }else {
        var removed_leaf_QMARK___12515 = new cljs.core.Box(false);
        var node__12516 = this__12513.root.inode_without_BANG_(this__12513.edit, 0, cljs.core.hash.call(null, k), k, removed_leaf_QMARK___12515);
        if(node__12516 === this__12513.root) {
        }else {
          this__12513.root = node__12516
        }
        if(cljs.core.truth_(removed_leaf_QMARK___12515[0])) {
          this__12513.count = this__12513.count - 1
        }else {
        }
        return tcoll__12514
      }
    }
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.persistent_BANG_ = function() {
  var this__12517 = this;
  var tcoll__12518 = this;
  if(this__12517.edit) {
    this__12517.edit = null;
    return new cljs.core.PersistentHashMap(null, this__12517.count, this__12517.root, this__12517.has_nil_QMARK_, this__12517.nil_val, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientHashMap;
cljs.core.tree_map_seq_push = function tree_map_seq_push(node, stack, ascending_QMARK_) {
  var t__12523 = node;
  var stack__12524 = stack;
  while(true) {
    if(!(t__12523 == null)) {
      var G__12525 = ascending_QMARK_ ? t__12523.left : t__12523.right;
      var G__12526 = cljs.core.conj.call(null, stack__12524, t__12523);
      t__12523 = G__12525;
      stack__12524 = G__12526;
      continue
    }else {
      return stack__12524
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
  var this__12527 = this;
  var h__2133__auto____12528 = this__12527.__hash;
  if(!(h__2133__auto____12528 == null)) {
    return h__2133__auto____12528
  }else {
    var h__2133__auto____12529 = cljs.core.hash_coll.call(null, coll);
    this__12527.__hash = h__2133__auto____12529;
    return h__2133__auto____12529
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__12530 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentTreeMapSeq.prototype.toString = function() {
  var this__12531 = this;
  var this__12532 = this;
  return cljs.core.pr_str.call(null, this__12532)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__12533 = this;
  return this$
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__12534 = this;
  if(this__12534.cnt < 0) {
    return cljs.core.count.call(null, cljs.core.next.call(null, coll)) + 1
  }else {
    return this__12534.cnt
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(this$) {
  var this__12535 = this;
  return cljs.core.peek.call(null, this__12535.stack)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(this$) {
  var this__12536 = this;
  var t__12537 = cljs.core.first.call(null, this__12536.stack);
  var next_stack__12538 = cljs.core.tree_map_seq_push.call(null, this__12536.ascending_QMARK_ ? t__12537.right : t__12537.left, cljs.core.next.call(null, this__12536.stack), this__12536.ascending_QMARK_);
  if(!(next_stack__12538 == null)) {
    return new cljs.core.PersistentTreeMapSeq(null, next_stack__12538, this__12536.ascending_QMARK_, this__12536.cnt - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__12539 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__12540 = this;
  return new cljs.core.PersistentTreeMapSeq(meta, this__12540.stack, this__12540.ascending_QMARK_, this__12540.cnt, this__12540.__hash)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__12541 = this;
  return this__12541.meta
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
        var and__3941__auto____12543 = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right);
        if(and__3941__auto____12543) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, right.left)
        }else {
          return and__3941__auto____12543
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
        var and__3941__auto____12545 = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, left);
        if(and__3941__auto____12545) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, left.right)
        }else {
          return and__3941__auto____12545
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
  var init__12549 = f.call(null, init, node.key, node.val);
  if(cljs.core.reduced_QMARK_.call(null, init__12549)) {
    return cljs.core.deref.call(null, init__12549)
  }else {
    var init__12550 = !(node.left == null) ? tree_map_kv_reduce.call(null, node.left, f, init__12549) : init__12549;
    if(cljs.core.reduced_QMARK_.call(null, init__12550)) {
      return cljs.core.deref.call(null, init__12550)
    }else {
      var init__12551 = !(node.right == null) ? tree_map_kv_reduce.call(null, node.right, f, init__12550) : init__12550;
      if(cljs.core.reduced_QMARK_.call(null, init__12551)) {
        return cljs.core.deref.call(null, init__12551)
      }else {
        return init__12551
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
  var this__12554 = this;
  var h__2133__auto____12555 = this__12554.__hash;
  if(!(h__2133__auto____12555 == null)) {
    return h__2133__auto____12555
  }else {
    var h__2133__auto____12556 = cljs.core.hash_coll.call(null, coll);
    this__12554.__hash = h__2133__auto____12556;
    return h__2133__auto____12556
  }
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__12557 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, null)
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__12558 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, not_found)
};
cljs.core.BlackNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__12559 = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([this__12559.key, this__12559.val], true), k, v)
};
cljs.core.BlackNode.prototype.call = function() {
  var G__12607 = null;
  var G__12607__2 = function(this_sym12560, k) {
    var this__12562 = this;
    var this_sym12560__12563 = this;
    var node__12564 = this_sym12560__12563;
    return node__12564.cljs$core$ILookup$_lookup$arity$2(node__12564, k)
  };
  var G__12607__3 = function(this_sym12561, k, not_found) {
    var this__12562 = this;
    var this_sym12561__12565 = this;
    var node__12566 = this_sym12561__12565;
    return node__12566.cljs$core$ILookup$_lookup$arity$3(node__12566, k, not_found)
  };
  G__12607 = function(this_sym12561, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__12607__2.call(this, this_sym12561, k);
      case 3:
        return G__12607__3.call(this, this_sym12561, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__12607
}();
cljs.core.BlackNode.prototype.apply = function(this_sym12552, args12553) {
  var this__12567 = this;
  return this_sym12552.call.apply(this_sym12552, [this_sym12552].concat(args12553.slice()))
};
cljs.core.BlackNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__12568 = this;
  return cljs.core.PersistentVector.fromArray([this__12568.key, this__12568.val, o], true)
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__12569 = this;
  return this__12569.key
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__12570 = this;
  return this__12570.val
};
cljs.core.BlackNode.prototype.add_right = function(ins) {
  var this__12571 = this;
  var node__12572 = this;
  return ins.balance_right(node__12572)
};
cljs.core.BlackNode.prototype.redden = function() {
  var this__12573 = this;
  var node__12574 = this;
  return new cljs.core.RedNode(this__12573.key, this__12573.val, this__12573.left, this__12573.right, null)
};
cljs.core.BlackNode.prototype.remove_right = function(del) {
  var this__12575 = this;
  var node__12576 = this;
  return cljs.core.balance_right_del.call(null, this__12575.key, this__12575.val, this__12575.left, del)
};
cljs.core.BlackNode.prototype.replace = function(key, val, left, right) {
  var this__12577 = this;
  var node__12578 = this;
  return new cljs.core.BlackNode(key, val, left, right, null)
};
cljs.core.BlackNode.prototype.kv_reduce = function(f, init) {
  var this__12579 = this;
  var node__12580 = this;
  return cljs.core.tree_map_kv_reduce.call(null, node__12580, f, init)
};
cljs.core.BlackNode.prototype.remove_left = function(del) {
  var this__12581 = this;
  var node__12582 = this;
  return cljs.core.balance_left_del.call(null, this__12581.key, this__12581.val, del, this__12581.right)
};
cljs.core.BlackNode.prototype.add_left = function(ins) {
  var this__12583 = this;
  var node__12584 = this;
  return ins.balance_left(node__12584)
};
cljs.core.BlackNode.prototype.balance_left = function(parent) {
  var this__12585 = this;
  var node__12586 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, node__12586, parent.right, null)
};
cljs.core.BlackNode.prototype.toString = function() {
  var G__12608 = null;
  var G__12608__0 = function() {
    var this__12587 = this;
    var this__12589 = this;
    return cljs.core.pr_str.call(null, this__12589)
  };
  G__12608 = function() {
    switch(arguments.length) {
      case 0:
        return G__12608__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__12608
}();
cljs.core.BlackNode.prototype.balance_right = function(parent) {
  var this__12590 = this;
  var node__12591 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__12591, null)
};
cljs.core.BlackNode.prototype.blacken = function() {
  var this__12592 = this;
  var node__12593 = this;
  return node__12593
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__12594 = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__12595 = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.BlackNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__12596 = this;
  return cljs.core.list.call(null, this__12596.key, this__12596.val)
};
cljs.core.BlackNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__12597 = this;
  return 2
};
cljs.core.BlackNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__12598 = this;
  return this__12598.val
};
cljs.core.BlackNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__12599 = this;
  return cljs.core.PersistentVector.fromArray([this__12599.key], true)
};
cljs.core.BlackNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__12600 = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([this__12600.key, this__12600.val], true), n, v)
};
cljs.core.BlackNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__12601 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.BlackNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__12602 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([this__12602.key, this__12602.val], true), meta)
};
cljs.core.BlackNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__12603 = this;
  return null
};
cljs.core.BlackNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__12604 = this;
  if(n === 0) {
    return this__12604.key
  }else {
    if(n === 1) {
      return this__12604.val
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
  var this__12605 = this;
  if(n === 0) {
    return this__12605.key
  }else {
    if(n === 1) {
      return this__12605.val
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
  var this__12606 = this;
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
  var this__12611 = this;
  var h__2133__auto____12612 = this__12611.__hash;
  if(!(h__2133__auto____12612 == null)) {
    return h__2133__auto____12612
  }else {
    var h__2133__auto____12613 = cljs.core.hash_coll.call(null, coll);
    this__12611.__hash = h__2133__auto____12613;
    return h__2133__auto____12613
  }
};
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__12614 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, null)
};
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__12615 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, not_found)
};
cljs.core.RedNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__12616 = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([this__12616.key, this__12616.val], true), k, v)
};
cljs.core.RedNode.prototype.call = function() {
  var G__12664 = null;
  var G__12664__2 = function(this_sym12617, k) {
    var this__12619 = this;
    var this_sym12617__12620 = this;
    var node__12621 = this_sym12617__12620;
    return node__12621.cljs$core$ILookup$_lookup$arity$2(node__12621, k)
  };
  var G__12664__3 = function(this_sym12618, k, not_found) {
    var this__12619 = this;
    var this_sym12618__12622 = this;
    var node__12623 = this_sym12618__12622;
    return node__12623.cljs$core$ILookup$_lookup$arity$3(node__12623, k, not_found)
  };
  G__12664 = function(this_sym12618, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__12664__2.call(this, this_sym12618, k);
      case 3:
        return G__12664__3.call(this, this_sym12618, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__12664
}();
cljs.core.RedNode.prototype.apply = function(this_sym12609, args12610) {
  var this__12624 = this;
  return this_sym12609.call.apply(this_sym12609, [this_sym12609].concat(args12610.slice()))
};
cljs.core.RedNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__12625 = this;
  return cljs.core.PersistentVector.fromArray([this__12625.key, this__12625.val, o], true)
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__12626 = this;
  return this__12626.key
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__12627 = this;
  return this__12627.val
};
cljs.core.RedNode.prototype.add_right = function(ins) {
  var this__12628 = this;
  var node__12629 = this;
  return new cljs.core.RedNode(this__12628.key, this__12628.val, this__12628.left, ins, null)
};
cljs.core.RedNode.prototype.redden = function() {
  var this__12630 = this;
  var node__12631 = this;
  throw new Error("red-black tree invariant violation");
};
cljs.core.RedNode.prototype.remove_right = function(del) {
  var this__12632 = this;
  var node__12633 = this;
  return new cljs.core.RedNode(this__12632.key, this__12632.val, this__12632.left, del, null)
};
cljs.core.RedNode.prototype.replace = function(key, val, left, right) {
  var this__12634 = this;
  var node__12635 = this;
  return new cljs.core.RedNode(key, val, left, right, null)
};
cljs.core.RedNode.prototype.kv_reduce = function(f, init) {
  var this__12636 = this;
  var node__12637 = this;
  return cljs.core.tree_map_kv_reduce.call(null, node__12637, f, init)
};
cljs.core.RedNode.prototype.remove_left = function(del) {
  var this__12638 = this;
  var node__12639 = this;
  return new cljs.core.RedNode(this__12638.key, this__12638.val, del, this__12638.right, null)
};
cljs.core.RedNode.prototype.add_left = function(ins) {
  var this__12640 = this;
  var node__12641 = this;
  return new cljs.core.RedNode(this__12640.key, this__12640.val, ins, this__12640.right, null)
};
cljs.core.RedNode.prototype.balance_left = function(parent) {
  var this__12642 = this;
  var node__12643 = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__12642.left)) {
    return new cljs.core.RedNode(this__12642.key, this__12642.val, this__12642.left.blacken(), new cljs.core.BlackNode(parent.key, parent.val, this__12642.right, parent.right, null), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__12642.right)) {
      return new cljs.core.RedNode(this__12642.right.key, this__12642.right.val, new cljs.core.BlackNode(this__12642.key, this__12642.val, this__12642.left, this__12642.right.left, null), new cljs.core.BlackNode(parent.key, parent.val, this__12642.right.right, parent.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, node__12643, parent.right, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.toString = function() {
  var G__12665 = null;
  var G__12665__0 = function() {
    var this__12644 = this;
    var this__12646 = this;
    return cljs.core.pr_str.call(null, this__12646)
  };
  G__12665 = function() {
    switch(arguments.length) {
      case 0:
        return G__12665__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__12665
}();
cljs.core.RedNode.prototype.balance_right = function(parent) {
  var this__12647 = this;
  var node__12648 = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__12647.right)) {
    return new cljs.core.RedNode(this__12647.key, this__12647.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__12647.left, null), this__12647.right.blacken(), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__12647.left)) {
      return new cljs.core.RedNode(this__12647.left.key, this__12647.left.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__12647.left.left, null), new cljs.core.BlackNode(this__12647.key, this__12647.val, this__12647.left.right, this__12647.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__12648, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.blacken = function() {
  var this__12649 = this;
  var node__12650 = this;
  return new cljs.core.BlackNode(this__12649.key, this__12649.val, this__12649.left, this__12649.right, null)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__12651 = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__12652 = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.RedNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__12653 = this;
  return cljs.core.list.call(null, this__12653.key, this__12653.val)
};
cljs.core.RedNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__12654 = this;
  return 2
};
cljs.core.RedNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__12655 = this;
  return this__12655.val
};
cljs.core.RedNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__12656 = this;
  return cljs.core.PersistentVector.fromArray([this__12656.key], true)
};
cljs.core.RedNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__12657 = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([this__12657.key, this__12657.val], true), n, v)
};
cljs.core.RedNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__12658 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.RedNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__12659 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([this__12659.key, this__12659.val], true), meta)
};
cljs.core.RedNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__12660 = this;
  return null
};
cljs.core.RedNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__12661 = this;
  if(n === 0) {
    return this__12661.key
  }else {
    if(n === 1) {
      return this__12661.val
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
  var this__12662 = this;
  if(n === 0) {
    return this__12662.key
  }else {
    if(n === 1) {
      return this__12662.val
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
  var this__12663 = this;
  return cljs.core.PersistentVector.EMPTY
};
cljs.core.RedNode;
cljs.core.tree_map_add = function tree_map_add(comp, tree, k, v, found) {
  if(tree == null) {
    return new cljs.core.RedNode(k, v, null, null, null)
  }else {
    var c__12669 = comp.call(null, k, tree.key);
    if(c__12669 === 0) {
      found[0] = tree;
      return null
    }else {
      if(c__12669 < 0) {
        var ins__12670 = tree_map_add.call(null, comp, tree.left, k, v, found);
        if(!(ins__12670 == null)) {
          return tree.add_left(ins__12670)
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var ins__12671 = tree_map_add.call(null, comp, tree.right, k, v, found);
          if(!(ins__12671 == null)) {
            return tree.add_right(ins__12671)
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
          var app__12674 = tree_map_append.call(null, left.right, right.left);
          if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app__12674)) {
            return new cljs.core.RedNode(app__12674.key, app__12674.val, new cljs.core.RedNode(left.key, left.val, left.left, app__12674.left, null), new cljs.core.RedNode(right.key, right.val, app__12674.right, right.right, null), null)
          }else {
            return new cljs.core.RedNode(left.key, left.val, left.left, new cljs.core.RedNode(right.key, right.val, app__12674, right.right, null), null)
          }
        }else {
          return new cljs.core.RedNode(left.key, left.val, left.left, tree_map_append.call(null, left.right, right), null)
        }
      }else {
        if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right)) {
          return new cljs.core.RedNode(right.key, right.val, tree_map_append.call(null, left, right.left), right.right, null)
        }else {
          if("\ufdd0'else") {
            var app__12675 = tree_map_append.call(null, left.right, right.left);
            if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app__12675)) {
              return new cljs.core.RedNode(app__12675.key, app__12675.val, new cljs.core.BlackNode(left.key, left.val, left.left, app__12675.left, null), new cljs.core.BlackNode(right.key, right.val, app__12675.right, right.right, null), null)
            }else {
              return cljs.core.balance_left_del.call(null, left.key, left.val, left.left, new cljs.core.BlackNode(right.key, right.val, app__12675, right.right, null))
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
    var c__12681 = comp.call(null, k, tree.key);
    if(c__12681 === 0) {
      found[0] = tree;
      return cljs.core.tree_map_append.call(null, tree.left, tree.right)
    }else {
      if(c__12681 < 0) {
        var del__12682 = tree_map_remove.call(null, comp, tree.left, k, found);
        if(function() {
          var or__3943__auto____12683 = !(del__12682 == null);
          if(or__3943__auto____12683) {
            return or__3943__auto____12683
          }else {
            return!(found[0] == null)
          }
        }()) {
          if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.left)) {
            return cljs.core.balance_left_del.call(null, tree.key, tree.val, del__12682, tree.right)
          }else {
            return new cljs.core.RedNode(tree.key, tree.val, del__12682, tree.right, null)
          }
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var del__12684 = tree_map_remove.call(null, comp, tree.right, k, found);
          if(function() {
            var or__3943__auto____12685 = !(del__12684 == null);
            if(or__3943__auto____12685) {
              return or__3943__auto____12685
            }else {
              return!(found[0] == null)
            }
          }()) {
            if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.right)) {
              return cljs.core.balance_right_del.call(null, tree.key, tree.val, tree.left, del__12684)
            }else {
              return new cljs.core.RedNode(tree.key, tree.val, tree.left, del__12684, null)
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
  var tk__12688 = tree.key;
  var c__12689 = comp.call(null, k, tk__12688);
  if(c__12689 === 0) {
    return tree.replace(tk__12688, v, tree.left, tree.right)
  }else {
    if(c__12689 < 0) {
      return tree.replace(tk__12688, tree.val, tree_map_replace.call(null, comp, tree.left, k, v), tree.right)
    }else {
      if("\ufdd0'else") {
        return tree.replace(tk__12688, tree.val, tree.left, tree_map_replace.call(null, comp, tree.right, k, v))
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
  var this__12692 = this;
  var h__2133__auto____12693 = this__12692.__hash;
  if(!(h__2133__auto____12693 == null)) {
    return h__2133__auto____12693
  }else {
    var h__2133__auto____12694 = cljs.core.hash_imap.call(null, coll);
    this__12692.__hash = h__2133__auto____12694;
    return h__2133__auto____12694
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__12695 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__12696 = this;
  var n__12697 = coll.entry_at(k);
  if(!(n__12697 == null)) {
    return n__12697.val
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__12698 = this;
  var found__12699 = [null];
  var t__12700 = cljs.core.tree_map_add.call(null, this__12698.comp, this__12698.tree, k, v, found__12699);
  if(t__12700 == null) {
    var found_node__12701 = cljs.core.nth.call(null, found__12699, 0);
    if(cljs.core._EQ_.call(null, v, found_node__12701.val)) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__12698.comp, cljs.core.tree_map_replace.call(null, this__12698.comp, this__12698.tree, k, v), this__12698.cnt, this__12698.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__12698.comp, t__12700.blacken(), this__12698.cnt + 1, this__12698.meta, null)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__12702 = this;
  return!(coll.entry_at(k) == null)
};
cljs.core.PersistentTreeMap.prototype.call = function() {
  var G__12736 = null;
  var G__12736__2 = function(this_sym12703, k) {
    var this__12705 = this;
    var this_sym12703__12706 = this;
    var coll__12707 = this_sym12703__12706;
    return coll__12707.cljs$core$ILookup$_lookup$arity$2(coll__12707, k)
  };
  var G__12736__3 = function(this_sym12704, k, not_found) {
    var this__12705 = this;
    var this_sym12704__12708 = this;
    var coll__12709 = this_sym12704__12708;
    return coll__12709.cljs$core$ILookup$_lookup$arity$3(coll__12709, k, not_found)
  };
  G__12736 = function(this_sym12704, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__12736__2.call(this, this_sym12704, k);
      case 3:
        return G__12736__3.call(this, this_sym12704, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__12736
}();
cljs.core.PersistentTreeMap.prototype.apply = function(this_sym12690, args12691) {
  var this__12710 = this;
  return this_sym12690.call.apply(this_sym12690, [this_sym12690].concat(args12691.slice()))
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__12711 = this;
  if(!(this__12711.tree == null)) {
    return cljs.core.tree_map_kv_reduce.call(null, this__12711.tree, f, init)
  }else {
    return init
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__12712 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__12713 = this;
  if(this__12713.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__12713.tree, false, this__12713.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.toString = function() {
  var this__12714 = this;
  var this__12715 = this;
  return cljs.core.pr_str.call(null, this__12715)
};
cljs.core.PersistentTreeMap.prototype.entry_at = function(k) {
  var this__12716 = this;
  var coll__12717 = this;
  var t__12718 = this__12716.tree;
  while(true) {
    if(!(t__12718 == null)) {
      var c__12719 = this__12716.comp.call(null, k, t__12718.key);
      if(c__12719 === 0) {
        return t__12718
      }else {
        if(c__12719 < 0) {
          var G__12737 = t__12718.left;
          t__12718 = G__12737;
          continue
        }else {
          if("\ufdd0'else") {
            var G__12738 = t__12718.right;
            t__12718 = G__12738;
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
  var this__12720 = this;
  if(this__12720.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__12720.tree, ascending_QMARK_, this__12720.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__12721 = this;
  if(this__12721.cnt > 0) {
    var stack__12722 = null;
    var t__12723 = this__12721.tree;
    while(true) {
      if(!(t__12723 == null)) {
        var c__12724 = this__12721.comp.call(null, k, t__12723.key);
        if(c__12724 === 0) {
          return new cljs.core.PersistentTreeMapSeq(null, cljs.core.conj.call(null, stack__12722, t__12723), ascending_QMARK_, -1, null)
        }else {
          if(cljs.core.truth_(ascending_QMARK_)) {
            if(c__12724 < 0) {
              var G__12739 = cljs.core.conj.call(null, stack__12722, t__12723);
              var G__12740 = t__12723.left;
              stack__12722 = G__12739;
              t__12723 = G__12740;
              continue
            }else {
              var G__12741 = stack__12722;
              var G__12742 = t__12723.right;
              stack__12722 = G__12741;
              t__12723 = G__12742;
              continue
            }
          }else {
            if("\ufdd0'else") {
              if(c__12724 > 0) {
                var G__12743 = cljs.core.conj.call(null, stack__12722, t__12723);
                var G__12744 = t__12723.right;
                stack__12722 = G__12743;
                t__12723 = G__12744;
                continue
              }else {
                var G__12745 = stack__12722;
                var G__12746 = t__12723.left;
                stack__12722 = G__12745;
                t__12723 = G__12746;
                continue
              }
            }else {
              return null
            }
          }
        }
      }else {
        if(stack__12722 == null) {
          return new cljs.core.PersistentTreeMapSeq(null, stack__12722, ascending_QMARK_, -1, null)
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
  var this__12725 = this;
  return cljs.core.key.call(null, entry)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__12726 = this;
  return this__12726.comp
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__12727 = this;
  if(this__12727.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__12727.tree, true, this__12727.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__12728 = this;
  return this__12728.cnt
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__12729 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__12730 = this;
  return new cljs.core.PersistentTreeMap(this__12730.comp, this__12730.tree, this__12730.cnt, meta, this__12730.__hash)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__12731 = this;
  return this__12731.meta
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__12732 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeMap.EMPTY, this__12732.meta)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__12733 = this;
  var found__12734 = [null];
  var t__12735 = cljs.core.tree_map_remove.call(null, this__12733.comp, this__12733.tree, k, found__12734);
  if(t__12735 == null) {
    if(cljs.core.nth.call(null, found__12734, 0) == null) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__12733.comp, null, 0, this__12733.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__12733.comp, t__12735.blacken(), this__12733.cnt - 1, this__12733.meta, null)
  }
};
cljs.core.PersistentTreeMap;
cljs.core.PersistentTreeMap.EMPTY = new cljs.core.PersistentTreeMap(cljs.core.compare, null, 0, null, 0);
cljs.core.hash_map = function() {
  var hash_map__delegate = function(keyvals) {
    var in__12749 = cljs.core.seq.call(null, keyvals);
    var out__12750 = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
    while(true) {
      if(in__12749) {
        var G__12751 = cljs.core.nnext.call(null, in__12749);
        var G__12752 = cljs.core.assoc_BANG_.call(null, out__12750, cljs.core.first.call(null, in__12749), cljs.core.second.call(null, in__12749));
        in__12749 = G__12751;
        out__12750 = G__12752;
        continue
      }else {
        return cljs.core.persistent_BANG_.call(null, out__12750)
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
  hash_map.cljs$lang$applyTo = function(arglist__12753) {
    var keyvals = cljs.core.seq(arglist__12753);
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
  array_map.cljs$lang$applyTo = function(arglist__12754) {
    var keyvals = cljs.core.seq(arglist__12754);
    return array_map__delegate(keyvals)
  };
  array_map.cljs$lang$arity$variadic = array_map__delegate;
  return array_map
}();
cljs.core.obj_map = function() {
  var obj_map__delegate = function(keyvals) {
    var ks__12758 = [];
    var obj__12759 = {};
    var kvs__12760 = cljs.core.seq.call(null, keyvals);
    while(true) {
      if(kvs__12760) {
        ks__12758.push(cljs.core.first.call(null, kvs__12760));
        obj__12759[cljs.core.first.call(null, kvs__12760)] = cljs.core.second.call(null, kvs__12760);
        var G__12761 = cljs.core.nnext.call(null, kvs__12760);
        kvs__12760 = G__12761;
        continue
      }else {
        return cljs.core.ObjMap.fromObject.call(null, ks__12758, obj__12759)
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
  obj_map.cljs$lang$applyTo = function(arglist__12762) {
    var keyvals = cljs.core.seq(arglist__12762);
    return obj_map__delegate(keyvals)
  };
  obj_map.cljs$lang$arity$variadic = obj_map__delegate;
  return obj_map
}();
cljs.core.sorted_map = function() {
  var sorted_map__delegate = function(keyvals) {
    var in__12765 = cljs.core.seq.call(null, keyvals);
    var out__12766 = cljs.core.PersistentTreeMap.EMPTY;
    while(true) {
      if(in__12765) {
        var G__12767 = cljs.core.nnext.call(null, in__12765);
        var G__12768 = cljs.core.assoc.call(null, out__12766, cljs.core.first.call(null, in__12765), cljs.core.second.call(null, in__12765));
        in__12765 = G__12767;
        out__12766 = G__12768;
        continue
      }else {
        return out__12766
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
  sorted_map.cljs$lang$applyTo = function(arglist__12769) {
    var keyvals = cljs.core.seq(arglist__12769);
    return sorted_map__delegate(keyvals)
  };
  sorted_map.cljs$lang$arity$variadic = sorted_map__delegate;
  return sorted_map
}();
cljs.core.sorted_map_by = function() {
  var sorted_map_by__delegate = function(comparator, keyvals) {
    var in__12772 = cljs.core.seq.call(null, keyvals);
    var out__12773 = new cljs.core.PersistentTreeMap(comparator, null, 0, null, 0);
    while(true) {
      if(in__12772) {
        var G__12774 = cljs.core.nnext.call(null, in__12772);
        var G__12775 = cljs.core.assoc.call(null, out__12773, cljs.core.first.call(null, in__12772), cljs.core.second.call(null, in__12772));
        in__12772 = G__12774;
        out__12773 = G__12775;
        continue
      }else {
        return out__12773
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
  sorted_map_by.cljs$lang$applyTo = function(arglist__12776) {
    var comparator = cljs.core.first(arglist__12776);
    var keyvals = cljs.core.rest(arglist__12776);
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
      return cljs.core.reduce.call(null, function(p1__12777_SHARP_, p2__12778_SHARP_) {
        return cljs.core.conj.call(null, function() {
          var or__3943__auto____12780 = p1__12777_SHARP_;
          if(cljs.core.truth_(or__3943__auto____12780)) {
            return or__3943__auto____12780
          }else {
            return cljs.core.ObjMap.EMPTY
          }
        }(), p2__12778_SHARP_)
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
  merge.cljs$lang$applyTo = function(arglist__12781) {
    var maps = cljs.core.seq(arglist__12781);
    return merge__delegate(maps)
  };
  merge.cljs$lang$arity$variadic = merge__delegate;
  return merge
}();
cljs.core.merge_with = function() {
  var merge_with__delegate = function(f, maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      var merge_entry__12789 = function(m, e) {
        var k__12787 = cljs.core.first.call(null, e);
        var v__12788 = cljs.core.second.call(null, e);
        if(cljs.core.contains_QMARK_.call(null, m, k__12787)) {
          return cljs.core.assoc.call(null, m, k__12787, f.call(null, cljs.core._lookup.call(null, m, k__12787, null), v__12788))
        }else {
          return cljs.core.assoc.call(null, m, k__12787, v__12788)
        }
      };
      var merge2__12791 = function(m1, m2) {
        return cljs.core.reduce.call(null, merge_entry__12789, function() {
          var or__3943__auto____12790 = m1;
          if(cljs.core.truth_(or__3943__auto____12790)) {
            return or__3943__auto____12790
          }else {
            return cljs.core.ObjMap.EMPTY
          }
        }(), cljs.core.seq.call(null, m2))
      };
      return cljs.core.reduce.call(null, merge2__12791, maps)
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
  merge_with.cljs$lang$applyTo = function(arglist__12792) {
    var f = cljs.core.first(arglist__12792);
    var maps = cljs.core.rest(arglist__12792);
    return merge_with__delegate(f, maps)
  };
  merge_with.cljs$lang$arity$variadic = merge_with__delegate;
  return merge_with
}();
cljs.core.select_keys = function select_keys(map, keyseq) {
  var ret__12797 = cljs.core.ObjMap.EMPTY;
  var keys__12798 = cljs.core.seq.call(null, keyseq);
  while(true) {
    if(keys__12798) {
      var key__12799 = cljs.core.first.call(null, keys__12798);
      var entry__12800 = cljs.core._lookup.call(null, map, key__12799, "\ufdd0'cljs.core/not-found");
      var G__12801 = cljs.core.not_EQ_.call(null, entry__12800, "\ufdd0'cljs.core/not-found") ? cljs.core.assoc.call(null, ret__12797, key__12799, entry__12800) : ret__12797;
      var G__12802 = cljs.core.next.call(null, keys__12798);
      ret__12797 = G__12801;
      keys__12798 = G__12802;
      continue
    }else {
      return ret__12797
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
  var this__12806 = this;
  return new cljs.core.TransientHashSet(cljs.core.transient$.call(null, this__12806.hash_map))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__12807 = this;
  var h__2133__auto____12808 = this__12807.__hash;
  if(!(h__2133__auto____12808 == null)) {
    return h__2133__auto____12808
  }else {
    var h__2133__auto____12809 = cljs.core.hash_iset.call(null, coll);
    this__12807.__hash = h__2133__auto____12809;
    return h__2133__auto____12809
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__12810 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, v, null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__12811 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__12811.hash_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentHashSet.prototype.call = function() {
  var G__12832 = null;
  var G__12832__2 = function(this_sym12812, k) {
    var this__12814 = this;
    var this_sym12812__12815 = this;
    var coll__12816 = this_sym12812__12815;
    return coll__12816.cljs$core$ILookup$_lookup$arity$2(coll__12816, k)
  };
  var G__12832__3 = function(this_sym12813, k, not_found) {
    var this__12814 = this;
    var this_sym12813__12817 = this;
    var coll__12818 = this_sym12813__12817;
    return coll__12818.cljs$core$ILookup$_lookup$arity$3(coll__12818, k, not_found)
  };
  G__12832 = function(this_sym12813, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__12832__2.call(this, this_sym12813, k);
      case 3:
        return G__12832__3.call(this, this_sym12813, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__12832
}();
cljs.core.PersistentHashSet.prototype.apply = function(this_sym12804, args12805) {
  var this__12819 = this;
  return this_sym12804.call.apply(this_sym12804, [this_sym12804].concat(args12805.slice()))
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__12820 = this;
  return new cljs.core.PersistentHashSet(this__12820.meta, cljs.core.assoc.call(null, this__12820.hash_map, o, null), null)
};
cljs.core.PersistentHashSet.prototype.toString = function() {
  var this__12821 = this;
  var this__12822 = this;
  return cljs.core.pr_str.call(null, this__12822)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__12823 = this;
  return cljs.core.keys.call(null, this__12823.hash_map)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__12824 = this;
  return new cljs.core.PersistentHashSet(this__12824.meta, cljs.core.dissoc.call(null, this__12824.hash_map, v), null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__12825 = this;
  return cljs.core.count.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__12826 = this;
  var and__3941__auto____12827 = cljs.core.set_QMARK_.call(null, other);
  if(and__3941__auto____12827) {
    var and__3941__auto____12828 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3941__auto____12828) {
      return cljs.core.every_QMARK_.call(null, function(p1__12803_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__12803_SHARP_)
      }, other)
    }else {
      return and__3941__auto____12828
    }
  }else {
    return and__3941__auto____12827
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__12829 = this;
  return new cljs.core.PersistentHashSet(meta, this__12829.hash_map, this__12829.__hash)
};
cljs.core.PersistentHashSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__12830 = this;
  return this__12830.meta
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__12831 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentHashSet.EMPTY, this__12831.meta)
};
cljs.core.PersistentHashSet;
cljs.core.PersistentHashSet.EMPTY = new cljs.core.PersistentHashSet(null, cljs.core.hash_map.call(null), 0);
cljs.core.PersistentHashSet.fromArray = function(items) {
  var len__12833 = cljs.core.count.call(null, items);
  var i__12834 = 0;
  var out__12835 = cljs.core.transient$.call(null, cljs.core.PersistentHashSet.EMPTY);
  while(true) {
    if(i__12834 < len__12833) {
      var G__12836 = i__12834 + 1;
      var G__12837 = cljs.core.conj_BANG_.call(null, out__12835, items[i__12834]);
      i__12834 = G__12836;
      out__12835 = G__12837;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__12835)
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
  var G__12855 = null;
  var G__12855__2 = function(this_sym12841, k) {
    var this__12843 = this;
    var this_sym12841__12844 = this;
    var tcoll__12845 = this_sym12841__12844;
    if(cljs.core._lookup.call(null, this__12843.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return null
    }else {
      return k
    }
  };
  var G__12855__3 = function(this_sym12842, k, not_found) {
    var this__12843 = this;
    var this_sym12842__12846 = this;
    var tcoll__12847 = this_sym12842__12846;
    if(cljs.core._lookup.call(null, this__12843.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return not_found
    }else {
      return k
    }
  };
  G__12855 = function(this_sym12842, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__12855__2.call(this, this_sym12842, k);
      case 3:
        return G__12855__3.call(this, this_sym12842, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__12855
}();
cljs.core.TransientHashSet.prototype.apply = function(this_sym12839, args12840) {
  var this__12848 = this;
  return this_sym12839.call.apply(this_sym12839, [this_sym12839].concat(args12840.slice()))
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, v) {
  var this__12849 = this;
  return tcoll.cljs$core$ILookup$_lookup$arity$3(tcoll, v, null)
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, v, not_found) {
  var this__12850 = this;
  if(cljs.core._lookup.call(null, this__12850.transient_map, v, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
    return not_found
  }else {
    return v
  }
};
cljs.core.TransientHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__12851 = this;
  return cljs.core.count.call(null, this__12851.transient_map)
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientSet$_disjoin_BANG_$arity$2 = function(tcoll, v) {
  var this__12852 = this;
  this__12852.transient_map = cljs.core.dissoc_BANG_.call(null, this__12852.transient_map, v);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__12853 = this;
  this__12853.transient_map = cljs.core.assoc_BANG_.call(null, this__12853.transient_map, o, null);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__12854 = this;
  return new cljs.core.PersistentHashSet(null, cljs.core.persistent_BANG_.call(null, this__12854.transient_map), null)
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
  var this__12858 = this;
  var h__2133__auto____12859 = this__12858.__hash;
  if(!(h__2133__auto____12859 == null)) {
    return h__2133__auto____12859
  }else {
    var h__2133__auto____12860 = cljs.core.hash_iset.call(null, coll);
    this__12858.__hash = h__2133__auto____12860;
    return h__2133__auto____12860
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__12861 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, v, null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__12862 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__12862.tree_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeSet.prototype.call = function() {
  var G__12888 = null;
  var G__12888__2 = function(this_sym12863, k) {
    var this__12865 = this;
    var this_sym12863__12866 = this;
    var coll__12867 = this_sym12863__12866;
    return coll__12867.cljs$core$ILookup$_lookup$arity$2(coll__12867, k)
  };
  var G__12888__3 = function(this_sym12864, k, not_found) {
    var this__12865 = this;
    var this_sym12864__12868 = this;
    var coll__12869 = this_sym12864__12868;
    return coll__12869.cljs$core$ILookup$_lookup$arity$3(coll__12869, k, not_found)
  };
  G__12888 = function(this_sym12864, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__12888__2.call(this, this_sym12864, k);
      case 3:
        return G__12888__3.call(this, this_sym12864, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__12888
}();
cljs.core.PersistentTreeSet.prototype.apply = function(this_sym12856, args12857) {
  var this__12870 = this;
  return this_sym12856.call.apply(this_sym12856, [this_sym12856].concat(args12857.slice()))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__12871 = this;
  return new cljs.core.PersistentTreeSet(this__12871.meta, cljs.core.assoc.call(null, this__12871.tree_map, o, null), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__12872 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core.rseq.call(null, this__12872.tree_map))
};
cljs.core.PersistentTreeSet.prototype.toString = function() {
  var this__12873 = this;
  var this__12874 = this;
  return cljs.core.pr_str.call(null, this__12874)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq$arity$2 = function(coll, ascending_QMARK_) {
  var this__12875 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq.call(null, this__12875.tree_map, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__12876 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq_from.call(null, this__12876.tree_map, k, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_entry_key$arity$2 = function(coll, entry) {
  var this__12877 = this;
  return entry
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__12878 = this;
  return cljs.core._comparator.call(null, this__12878.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__12879 = this;
  return cljs.core.keys.call(null, this__12879.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__12880 = this;
  return new cljs.core.PersistentTreeSet(this__12880.meta, cljs.core.dissoc.call(null, this__12880.tree_map, v), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__12881 = this;
  return cljs.core.count.call(null, this__12881.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__12882 = this;
  var and__3941__auto____12883 = cljs.core.set_QMARK_.call(null, other);
  if(and__3941__auto____12883) {
    var and__3941__auto____12884 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3941__auto____12884) {
      return cljs.core.every_QMARK_.call(null, function(p1__12838_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__12838_SHARP_)
      }, other)
    }else {
      return and__3941__auto____12884
    }
  }else {
    return and__3941__auto____12883
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__12885 = this;
  return new cljs.core.PersistentTreeSet(meta, this__12885.tree_map, this__12885.__hash)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__12886 = this;
  return this__12886.meta
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__12887 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeSet.EMPTY, this__12887.meta)
};
cljs.core.PersistentTreeSet;
cljs.core.PersistentTreeSet.EMPTY = new cljs.core.PersistentTreeSet(null, cljs.core.sorted_map.call(null), 0);
cljs.core.hash_set = function() {
  var hash_set = null;
  var hash_set__0 = function() {
    return cljs.core.PersistentHashSet.EMPTY
  };
  var hash_set__1 = function() {
    var G__12893__delegate = function(keys) {
      var in__12891 = cljs.core.seq.call(null, keys);
      var out__12892 = cljs.core.transient$.call(null, cljs.core.PersistentHashSet.EMPTY);
      while(true) {
        if(cljs.core.seq.call(null, in__12891)) {
          var G__12894 = cljs.core.next.call(null, in__12891);
          var G__12895 = cljs.core.conj_BANG_.call(null, out__12892, cljs.core.first.call(null, in__12891));
          in__12891 = G__12894;
          out__12892 = G__12895;
          continue
        }else {
          return cljs.core.persistent_BANG_.call(null, out__12892)
        }
        break
      }
    };
    var G__12893 = function(var_args) {
      var keys = null;
      if(goog.isDef(var_args)) {
        keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__12893__delegate.call(this, keys)
    };
    G__12893.cljs$lang$maxFixedArity = 0;
    G__12893.cljs$lang$applyTo = function(arglist__12896) {
      var keys = cljs.core.seq(arglist__12896);
      return G__12893__delegate(keys)
    };
    G__12893.cljs$lang$arity$variadic = G__12893__delegate;
    return G__12893
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
  sorted_set.cljs$lang$applyTo = function(arglist__12897) {
    var keys = cljs.core.seq(arglist__12897);
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
  sorted_set_by.cljs$lang$applyTo = function(arglist__12899) {
    var comparator = cljs.core.first(arglist__12899);
    var keys = cljs.core.rest(arglist__12899);
    return sorted_set_by__delegate(comparator, keys)
  };
  sorted_set_by.cljs$lang$arity$variadic = sorted_set_by__delegate;
  return sorted_set_by
}();
cljs.core.replace = function replace(smap, coll) {
  if(cljs.core.vector_QMARK_.call(null, coll)) {
    var n__12905 = cljs.core.count.call(null, coll);
    return cljs.core.reduce.call(null, function(v, i) {
      var temp__4090__auto____12906 = cljs.core.find.call(null, smap, cljs.core.nth.call(null, v, i));
      if(cljs.core.truth_(temp__4090__auto____12906)) {
        var e__12907 = temp__4090__auto____12906;
        return cljs.core.assoc.call(null, v, i, cljs.core.second.call(null, e__12907))
      }else {
        return v
      }
    }, coll, cljs.core.take.call(null, n__12905, cljs.core.iterate.call(null, cljs.core.inc, 0)))
  }else {
    return cljs.core.map.call(null, function(p1__12898_SHARP_) {
      var temp__4090__auto____12908 = cljs.core.find.call(null, smap, p1__12898_SHARP_);
      if(cljs.core.truth_(temp__4090__auto____12908)) {
        var e__12909 = temp__4090__auto____12908;
        return cljs.core.second.call(null, e__12909)
      }else {
        return p1__12898_SHARP_
      }
    }, coll)
  }
};
cljs.core.distinct = function distinct(coll) {
  var step__12939 = function step(xs, seen) {
    return new cljs.core.LazySeq(null, false, function() {
      return function(p__12932, seen) {
        while(true) {
          var vec__12933__12934 = p__12932;
          var f__12935 = cljs.core.nth.call(null, vec__12933__12934, 0, null);
          var xs__12936 = vec__12933__12934;
          var temp__4092__auto____12937 = cljs.core.seq.call(null, xs__12936);
          if(temp__4092__auto____12937) {
            var s__12938 = temp__4092__auto____12937;
            if(cljs.core.contains_QMARK_.call(null, seen, f__12935)) {
              var G__12940 = cljs.core.rest.call(null, s__12938);
              var G__12941 = seen;
              p__12932 = G__12940;
              seen = G__12941;
              continue
            }else {
              return cljs.core.cons.call(null, f__12935, step.call(null, cljs.core.rest.call(null, s__12938), cljs.core.conj.call(null, seen, f__12935)))
            }
          }else {
            return null
          }
          break
        }
      }.call(null, xs, seen)
    }, null)
  };
  return step__12939.call(null, coll, cljs.core.PersistentHashSet.EMPTY)
};
cljs.core.butlast = function butlast(s) {
  var ret__12944 = cljs.core.PersistentVector.EMPTY;
  var s__12945 = s;
  while(true) {
    if(cljs.core.next.call(null, s__12945)) {
      var G__12946 = cljs.core.conj.call(null, ret__12944, cljs.core.first.call(null, s__12945));
      var G__12947 = cljs.core.next.call(null, s__12945);
      ret__12944 = G__12946;
      s__12945 = G__12947;
      continue
    }else {
      return cljs.core.seq.call(null, ret__12944)
    }
    break
  }
};
cljs.core.name = function name(x) {
  if(cljs.core.string_QMARK_.call(null, x)) {
    return x
  }else {
    if(function() {
      var or__3943__auto____12950 = cljs.core.keyword_QMARK_.call(null, x);
      if(or__3943__auto____12950) {
        return or__3943__auto____12950
      }else {
        return cljs.core.symbol_QMARK_.call(null, x)
      }
    }()) {
      var i__12951 = x.lastIndexOf("/");
      if(i__12951 < 0) {
        return cljs.core.subs.call(null, x, 2)
      }else {
        return cljs.core.subs.call(null, x, i__12951 + 1)
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
    var or__3943__auto____12954 = cljs.core.keyword_QMARK_.call(null, x);
    if(or__3943__auto____12954) {
      return or__3943__auto____12954
    }else {
      return cljs.core.symbol_QMARK_.call(null, x)
    }
  }()) {
    var i__12955 = x.lastIndexOf("/");
    if(i__12955 > -1) {
      return cljs.core.subs.call(null, x, 2, i__12955)
    }else {
      return null
    }
  }else {
    throw new Error([cljs.core.str("Doesn't support namespace: "), cljs.core.str(x)].join(""));
  }
};
cljs.core.zipmap = function zipmap(keys, vals) {
  var map__12962 = cljs.core.ObjMap.EMPTY;
  var ks__12963 = cljs.core.seq.call(null, keys);
  var vs__12964 = cljs.core.seq.call(null, vals);
  while(true) {
    if(function() {
      var and__3941__auto____12965 = ks__12963;
      if(and__3941__auto____12965) {
        return vs__12964
      }else {
        return and__3941__auto____12965
      }
    }()) {
      var G__12966 = cljs.core.assoc.call(null, map__12962, cljs.core.first.call(null, ks__12963), cljs.core.first.call(null, vs__12964));
      var G__12967 = cljs.core.next.call(null, ks__12963);
      var G__12968 = cljs.core.next.call(null, vs__12964);
      map__12962 = G__12966;
      ks__12963 = G__12967;
      vs__12964 = G__12968;
      continue
    }else {
      return map__12962
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
    var G__12971__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__12956_SHARP_, p2__12957_SHARP_) {
        return max_key.call(null, k, p1__12956_SHARP_, p2__12957_SHARP_)
      }, max_key.call(null, k, x, y), more)
    };
    var G__12971 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__12971__delegate.call(this, k, x, y, more)
    };
    G__12971.cljs$lang$maxFixedArity = 3;
    G__12971.cljs$lang$applyTo = function(arglist__12972) {
      var k = cljs.core.first(arglist__12972);
      var x = cljs.core.first(cljs.core.next(arglist__12972));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__12972)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__12972)));
      return G__12971__delegate(k, x, y, more)
    };
    G__12971.cljs$lang$arity$variadic = G__12971__delegate;
    return G__12971
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
    var G__12973__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__12969_SHARP_, p2__12970_SHARP_) {
        return min_key.call(null, k, p1__12969_SHARP_, p2__12970_SHARP_)
      }, min_key.call(null, k, x, y), more)
    };
    var G__12973 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__12973__delegate.call(this, k, x, y, more)
    };
    G__12973.cljs$lang$maxFixedArity = 3;
    G__12973.cljs$lang$applyTo = function(arglist__12974) {
      var k = cljs.core.first(arglist__12974);
      var x = cljs.core.first(cljs.core.next(arglist__12974));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__12974)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__12974)));
      return G__12973__delegate(k, x, y, more)
    };
    G__12973.cljs$lang$arity$variadic = G__12973__delegate;
    return G__12973
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
      var temp__4092__auto____12977 = cljs.core.seq.call(null, coll);
      if(temp__4092__auto____12977) {
        var s__12978 = temp__4092__auto____12977;
        return cljs.core.cons.call(null, cljs.core.take.call(null, n, s__12978), partition_all.call(null, n, step, cljs.core.drop.call(null, step, s__12978)))
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
    var temp__4092__auto____12981 = cljs.core.seq.call(null, coll);
    if(temp__4092__auto____12981) {
      var s__12982 = temp__4092__auto____12981;
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, s__12982)))) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__12982), take_while.call(null, pred, cljs.core.rest.call(null, s__12982)))
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
    var comp__12984 = cljs.core._comparator.call(null, sc);
    return test.call(null, comp__12984.call(null, cljs.core._entry_key.call(null, sc, e), key), 0)
  }
};
cljs.core.subseq = function() {
  var subseq = null;
  var subseq__3 = function(sc, test, key) {
    var include__12996 = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.PersistentHashSet.fromArray([cljs.core._GT_, cljs.core._GT__EQ_]).call(null, test))) {
      var temp__4092__auto____12997 = cljs.core._sorted_seq_from.call(null, sc, key, true);
      if(cljs.core.truth_(temp__4092__auto____12997)) {
        var vec__12998__12999 = temp__4092__auto____12997;
        var e__13000 = cljs.core.nth.call(null, vec__12998__12999, 0, null);
        var s__13001 = vec__12998__12999;
        if(cljs.core.truth_(include__12996.call(null, e__13000))) {
          return s__13001
        }else {
          return cljs.core.next.call(null, s__13001)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include__12996, cljs.core._sorted_seq.call(null, sc, true))
    }
  };
  var subseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__4092__auto____13002 = cljs.core._sorted_seq_from.call(null, sc, start_key, true);
    if(cljs.core.truth_(temp__4092__auto____13002)) {
      var vec__13003__13004 = temp__4092__auto____13002;
      var e__13005 = cljs.core.nth.call(null, vec__13003__13004, 0, null);
      var s__13006 = vec__13003__13004;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, end_test, end_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, start_test, start_key).call(null, e__13005)) ? s__13006 : cljs.core.next.call(null, s__13006))
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
    var include__13018 = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.PersistentHashSet.fromArray([cljs.core._LT_, cljs.core._LT__EQ_]).call(null, test))) {
      var temp__4092__auto____13019 = cljs.core._sorted_seq_from.call(null, sc, key, false);
      if(cljs.core.truth_(temp__4092__auto____13019)) {
        var vec__13020__13021 = temp__4092__auto____13019;
        var e__13022 = cljs.core.nth.call(null, vec__13020__13021, 0, null);
        var s__13023 = vec__13020__13021;
        if(cljs.core.truth_(include__13018.call(null, e__13022))) {
          return s__13023
        }else {
          return cljs.core.next.call(null, s__13023)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include__13018, cljs.core._sorted_seq.call(null, sc, false))
    }
  };
  var rsubseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__4092__auto____13024 = cljs.core._sorted_seq_from.call(null, sc, end_key, false);
    if(cljs.core.truth_(temp__4092__auto____13024)) {
      var vec__13025__13026 = temp__4092__auto____13024;
      var e__13027 = cljs.core.nth.call(null, vec__13025__13026, 0, null);
      var s__13028 = vec__13025__13026;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, start_test, start_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, end_test, end_key).call(null, e__13027)) ? s__13028 : cljs.core.next.call(null, s__13028))
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
  var this__13029 = this;
  var h__2133__auto____13030 = this__13029.__hash;
  if(!(h__2133__auto____13030 == null)) {
    return h__2133__auto____13030
  }else {
    var h__2133__auto____13031 = cljs.core.hash_coll.call(null, rng);
    this__13029.__hash = h__2133__auto____13031;
    return h__2133__auto____13031
  }
};
cljs.core.Range.prototype.cljs$core$INext$_next$arity$1 = function(rng) {
  var this__13032 = this;
  if(this__13032.step > 0) {
    if(this__13032.start + this__13032.step < this__13032.end) {
      return new cljs.core.Range(this__13032.meta, this__13032.start + this__13032.step, this__13032.end, this__13032.step, null)
    }else {
      return null
    }
  }else {
    if(this__13032.start + this__13032.step > this__13032.end) {
      return new cljs.core.Range(this__13032.meta, this__13032.start + this__13032.step, this__13032.end, this__13032.step, null)
    }else {
      return null
    }
  }
};
cljs.core.Range.prototype.cljs$core$ICollection$_conj$arity$2 = function(rng, o) {
  var this__13033 = this;
  return cljs.core.cons.call(null, o, rng)
};
cljs.core.Range.prototype.toString = function() {
  var this__13034 = this;
  var this__13035 = this;
  return cljs.core.pr_str.call(null, this__13035)
};
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$2 = function(rng, f) {
  var this__13036 = this;
  return cljs.core.ci_reduce.call(null, rng, f)
};
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$3 = function(rng, f, s) {
  var this__13037 = this;
  return cljs.core.ci_reduce.call(null, rng, f, s)
};
cljs.core.Range.prototype.cljs$core$ISeqable$_seq$arity$1 = function(rng) {
  var this__13038 = this;
  if(this__13038.step > 0) {
    if(this__13038.start < this__13038.end) {
      return rng
    }else {
      return null
    }
  }else {
    if(this__13038.start > this__13038.end) {
      return rng
    }else {
      return null
    }
  }
};
cljs.core.Range.prototype.cljs$core$ICounted$_count$arity$1 = function(rng) {
  var this__13039 = this;
  if(cljs.core.not.call(null, rng.cljs$core$ISeqable$_seq$arity$1(rng))) {
    return 0
  }else {
    return Math.ceil((this__13039.end - this__13039.start) / this__13039.step)
  }
};
cljs.core.Range.prototype.cljs$core$ISeq$_first$arity$1 = function(rng) {
  var this__13040 = this;
  return this__13040.start
};
cljs.core.Range.prototype.cljs$core$ISeq$_rest$arity$1 = function(rng) {
  var this__13041 = this;
  if(!(rng.cljs$core$ISeqable$_seq$arity$1(rng) == null)) {
    return new cljs.core.Range(this__13041.meta, this__13041.start + this__13041.step, this__13041.end, this__13041.step, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.Range.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(rng, other) {
  var this__13042 = this;
  return cljs.core.equiv_sequential.call(null, rng, other)
};
cljs.core.Range.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(rng, meta) {
  var this__13043 = this;
  return new cljs.core.Range(meta, this__13043.start, this__13043.end, this__13043.step, this__13043.__hash)
};
cljs.core.Range.prototype.cljs$core$IMeta$_meta$arity$1 = function(rng) {
  var this__13044 = this;
  return this__13044.meta
};
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$2 = function(rng, n) {
  var this__13045 = this;
  if(n < rng.cljs$core$ICounted$_count$arity$1(rng)) {
    return this__13045.start + n * this__13045.step
  }else {
    if(function() {
      var and__3941__auto____13046 = this__13045.start > this__13045.end;
      if(and__3941__auto____13046) {
        return this__13045.step === 0
      }else {
        return and__3941__auto____13046
      }
    }()) {
      return this__13045.start
    }else {
      throw new Error("Index out of bounds");
    }
  }
};
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$3 = function(rng, n, not_found) {
  var this__13047 = this;
  if(n < rng.cljs$core$ICounted$_count$arity$1(rng)) {
    return this__13047.start + n * this__13047.step
  }else {
    if(function() {
      var and__3941__auto____13048 = this__13047.start > this__13047.end;
      if(and__3941__auto____13048) {
        return this__13047.step === 0
      }else {
        return and__3941__auto____13048
      }
    }()) {
      return this__13047.start
    }else {
      return not_found
    }
  }
};
cljs.core.Range.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(rng) {
  var this__13049 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__13049.meta)
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
    var temp__4092__auto____13052 = cljs.core.seq.call(null, coll);
    if(temp__4092__auto____13052) {
      var s__13053 = temp__4092__auto____13052;
      return cljs.core.cons.call(null, cljs.core.first.call(null, s__13053), take_nth.call(null, n, cljs.core.drop.call(null, n, s__13053)))
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
    var temp__4092__auto____13060 = cljs.core.seq.call(null, coll);
    if(temp__4092__auto____13060) {
      var s__13061 = temp__4092__auto____13060;
      var fst__13062 = cljs.core.first.call(null, s__13061);
      var fv__13063 = f.call(null, fst__13062);
      var run__13064 = cljs.core.cons.call(null, fst__13062, cljs.core.take_while.call(null, function(p1__13054_SHARP_) {
        return cljs.core._EQ_.call(null, fv__13063, f.call(null, p1__13054_SHARP_))
      }, cljs.core.next.call(null, s__13061)));
      return cljs.core.cons.call(null, run__13064, partition_by.call(null, f, cljs.core.seq.call(null, cljs.core.drop.call(null, cljs.core.count.call(null, run__13064), s__13061))))
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
      var temp__4090__auto____13079 = cljs.core.seq.call(null, coll);
      if(temp__4090__auto____13079) {
        var s__13080 = temp__4090__auto____13079;
        return reductions.call(null, f, cljs.core.first.call(null, s__13080), cljs.core.rest.call(null, s__13080))
      }else {
        return cljs.core.list.call(null, f.call(null))
      }
    }, null)
  };
  var reductions__3 = function(f, init, coll) {
    return cljs.core.cons.call(null, init, new cljs.core.LazySeq(null, false, function() {
      var temp__4092__auto____13081 = cljs.core.seq.call(null, coll);
      if(temp__4092__auto____13081) {
        var s__13082 = temp__4092__auto____13081;
        return reductions.call(null, f, f.call(null, init, cljs.core.first.call(null, s__13082)), cljs.core.rest.call(null, s__13082))
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
      var G__13085 = null;
      var G__13085__0 = function() {
        return cljs.core.vector.call(null, f.call(null))
      };
      var G__13085__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x))
      };
      var G__13085__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y))
      };
      var G__13085__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z))
      };
      var G__13085__4 = function() {
        var G__13086__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args))
        };
        var G__13086 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__13086__delegate.call(this, x, y, z, args)
        };
        G__13086.cljs$lang$maxFixedArity = 3;
        G__13086.cljs$lang$applyTo = function(arglist__13087) {
          var x = cljs.core.first(arglist__13087);
          var y = cljs.core.first(cljs.core.next(arglist__13087));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__13087)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__13087)));
          return G__13086__delegate(x, y, z, args)
        };
        G__13086.cljs$lang$arity$variadic = G__13086__delegate;
        return G__13086
      }();
      G__13085 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__13085__0.call(this);
          case 1:
            return G__13085__1.call(this, x);
          case 2:
            return G__13085__2.call(this, x, y);
          case 3:
            return G__13085__3.call(this, x, y, z);
          default:
            return G__13085__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__13085.cljs$lang$maxFixedArity = 3;
      G__13085.cljs$lang$applyTo = G__13085__4.cljs$lang$applyTo;
      return G__13085
    }()
  };
  var juxt__2 = function(f, g) {
    return function() {
      var G__13088 = null;
      var G__13088__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null))
      };
      var G__13088__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x))
      };
      var G__13088__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y))
      };
      var G__13088__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z))
      };
      var G__13088__4 = function() {
        var G__13089__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__13089 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__13089__delegate.call(this, x, y, z, args)
        };
        G__13089.cljs$lang$maxFixedArity = 3;
        G__13089.cljs$lang$applyTo = function(arglist__13090) {
          var x = cljs.core.first(arglist__13090);
          var y = cljs.core.first(cljs.core.next(arglist__13090));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__13090)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__13090)));
          return G__13089__delegate(x, y, z, args)
        };
        G__13089.cljs$lang$arity$variadic = G__13089__delegate;
        return G__13089
      }();
      G__13088 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__13088__0.call(this);
          case 1:
            return G__13088__1.call(this, x);
          case 2:
            return G__13088__2.call(this, x, y);
          case 3:
            return G__13088__3.call(this, x, y, z);
          default:
            return G__13088__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__13088.cljs$lang$maxFixedArity = 3;
      G__13088.cljs$lang$applyTo = G__13088__4.cljs$lang$applyTo;
      return G__13088
    }()
  };
  var juxt__3 = function(f, g, h) {
    return function() {
      var G__13091 = null;
      var G__13091__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null), h.call(null))
      };
      var G__13091__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x), h.call(null, x))
      };
      var G__13091__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y), h.call(null, x, y))
      };
      var G__13091__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z), h.call(null, x, y, z))
      };
      var G__13091__4 = function() {
        var G__13092__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args), cljs.core.apply.call(null, h, x, y, z, args))
        };
        var G__13092 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__13092__delegate.call(this, x, y, z, args)
        };
        G__13092.cljs$lang$maxFixedArity = 3;
        G__13092.cljs$lang$applyTo = function(arglist__13093) {
          var x = cljs.core.first(arglist__13093);
          var y = cljs.core.first(cljs.core.next(arglist__13093));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__13093)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__13093)));
          return G__13092__delegate(x, y, z, args)
        };
        G__13092.cljs$lang$arity$variadic = G__13092__delegate;
        return G__13092
      }();
      G__13091 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__13091__0.call(this);
          case 1:
            return G__13091__1.call(this, x);
          case 2:
            return G__13091__2.call(this, x, y);
          case 3:
            return G__13091__3.call(this, x, y, z);
          default:
            return G__13091__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__13091.cljs$lang$maxFixedArity = 3;
      G__13091.cljs$lang$applyTo = G__13091__4.cljs$lang$applyTo;
      return G__13091
    }()
  };
  var juxt__4 = function() {
    var G__13094__delegate = function(f, g, h, fs) {
      var fs__13084 = cljs.core.list_STAR_.call(null, f, g, h, fs);
      return function() {
        var G__13095 = null;
        var G__13095__0 = function() {
          return cljs.core.reduce.call(null, function(p1__13065_SHARP_, p2__13066_SHARP_) {
            return cljs.core.conj.call(null, p1__13065_SHARP_, p2__13066_SHARP_.call(null))
          }, cljs.core.PersistentVector.EMPTY, fs__13084)
        };
        var G__13095__1 = function(x) {
          return cljs.core.reduce.call(null, function(p1__13067_SHARP_, p2__13068_SHARP_) {
            return cljs.core.conj.call(null, p1__13067_SHARP_, p2__13068_SHARP_.call(null, x))
          }, cljs.core.PersistentVector.EMPTY, fs__13084)
        };
        var G__13095__2 = function(x, y) {
          return cljs.core.reduce.call(null, function(p1__13069_SHARP_, p2__13070_SHARP_) {
            return cljs.core.conj.call(null, p1__13069_SHARP_, p2__13070_SHARP_.call(null, x, y))
          }, cljs.core.PersistentVector.EMPTY, fs__13084)
        };
        var G__13095__3 = function(x, y, z) {
          return cljs.core.reduce.call(null, function(p1__13071_SHARP_, p2__13072_SHARP_) {
            return cljs.core.conj.call(null, p1__13071_SHARP_, p2__13072_SHARP_.call(null, x, y, z))
          }, cljs.core.PersistentVector.EMPTY, fs__13084)
        };
        var G__13095__4 = function() {
          var G__13096__delegate = function(x, y, z, args) {
            return cljs.core.reduce.call(null, function(p1__13073_SHARP_, p2__13074_SHARP_) {
              return cljs.core.conj.call(null, p1__13073_SHARP_, cljs.core.apply.call(null, p2__13074_SHARP_, x, y, z, args))
            }, cljs.core.PersistentVector.EMPTY, fs__13084)
          };
          var G__13096 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__13096__delegate.call(this, x, y, z, args)
          };
          G__13096.cljs$lang$maxFixedArity = 3;
          G__13096.cljs$lang$applyTo = function(arglist__13097) {
            var x = cljs.core.first(arglist__13097);
            var y = cljs.core.first(cljs.core.next(arglist__13097));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__13097)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__13097)));
            return G__13096__delegate(x, y, z, args)
          };
          G__13096.cljs$lang$arity$variadic = G__13096__delegate;
          return G__13096
        }();
        G__13095 = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return G__13095__0.call(this);
            case 1:
              return G__13095__1.call(this, x);
            case 2:
              return G__13095__2.call(this, x, y);
            case 3:
              return G__13095__3.call(this, x, y, z);
            default:
              return G__13095__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        G__13095.cljs$lang$maxFixedArity = 3;
        G__13095.cljs$lang$applyTo = G__13095__4.cljs$lang$applyTo;
        return G__13095
      }()
    };
    var G__13094 = function(f, g, h, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__13094__delegate.call(this, f, g, h, fs)
    };
    G__13094.cljs$lang$maxFixedArity = 3;
    G__13094.cljs$lang$applyTo = function(arglist__13098) {
      var f = cljs.core.first(arglist__13098);
      var g = cljs.core.first(cljs.core.next(arglist__13098));
      var h = cljs.core.first(cljs.core.next(cljs.core.next(arglist__13098)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__13098)));
      return G__13094__delegate(f, g, h, fs)
    };
    G__13094.cljs$lang$arity$variadic = G__13094__delegate;
    return G__13094
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
        var G__13101 = cljs.core.next.call(null, coll);
        coll = G__13101;
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
        var and__3941__auto____13100 = cljs.core.seq.call(null, coll);
        if(and__3941__auto____13100) {
          return n > 0
        }else {
          return and__3941__auto____13100
        }
      }())) {
        var G__13102 = n - 1;
        var G__13103 = cljs.core.next.call(null, coll);
        n = G__13102;
        coll = G__13103;
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
  var matches__13105 = re.exec(s);
  if(cljs.core._EQ_.call(null, cljs.core.first.call(null, matches__13105), s)) {
    if(cljs.core.count.call(null, matches__13105) === 1) {
      return cljs.core.first.call(null, matches__13105)
    }else {
      return cljs.core.vec.call(null, matches__13105)
    }
  }else {
    return null
  }
};
cljs.core.re_find = function re_find(re, s) {
  var matches__13107 = re.exec(s);
  if(matches__13107 == null) {
    return null
  }else {
    if(cljs.core.count.call(null, matches__13107) === 1) {
      return cljs.core.first.call(null, matches__13107)
    }else {
      return cljs.core.vec.call(null, matches__13107)
    }
  }
};
cljs.core.re_seq = function re_seq(re, s) {
  var match_data__13112 = cljs.core.re_find.call(null, re, s);
  var match_idx__13113 = s.search(re);
  var match_str__13114 = cljs.core.coll_QMARK_.call(null, match_data__13112) ? cljs.core.first.call(null, match_data__13112) : match_data__13112;
  var post_match__13115 = cljs.core.subs.call(null, s, match_idx__13113 + cljs.core.count.call(null, match_str__13114));
  if(cljs.core.truth_(match_data__13112)) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, match_data__13112, re_seq.call(null, re, post_match__13115))
    }, null)
  }else {
    return null
  }
};
cljs.core.re_pattern = function re_pattern(s) {
  var vec__13122__13123 = cljs.core.re_find.call(null, /^(?:\(\?([idmsux]*)\))?(.*)/, s);
  var ___13124 = cljs.core.nth.call(null, vec__13122__13123, 0, null);
  var flags__13125 = cljs.core.nth.call(null, vec__13122__13123, 1, null);
  var pattern__13126 = cljs.core.nth.call(null, vec__13122__13123, 2, null);
  return new RegExp(pattern__13126, flags__13125)
};
cljs.core.pr_sequential = function pr_sequential(print_one, begin, sep, end, opts, coll) {
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray([begin], true), cljs.core.flatten1.call(null, cljs.core.interpose.call(null, cljs.core.PersistentVector.fromArray([sep], true), cljs.core.map.call(null, function(p1__13116_SHARP_) {
    return print_one.call(null, p1__13116_SHARP_, opts)
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
      return cljs.core.list.call(null, "#<undefined>")
    }else {
      if("\ufdd0'else") {
        return cljs.core.concat.call(null, cljs.core.truth_(function() {
          var and__3941__auto____13136 = cljs.core._lookup.call(null, opts, "\ufdd0'meta", null);
          if(cljs.core.truth_(and__3941__auto____13136)) {
            var and__3941__auto____13140 = function() {
              var G__13137__13138 = obj;
              if(G__13137__13138) {
                if(function() {
                  var or__3943__auto____13139 = G__13137__13138.cljs$lang$protocol_mask$partition0$ & 131072;
                  if(or__3943__auto____13139) {
                    return or__3943__auto____13139
                  }else {
                    return G__13137__13138.cljs$core$IMeta$
                  }
                }()) {
                  return true
                }else {
                  if(!G__13137__13138.cljs$lang$protocol_mask$partition0$) {
                    return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__13137__13138)
                  }else {
                    return false
                  }
                }
              }else {
                return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__13137__13138)
              }
            }();
            if(cljs.core.truth_(and__3941__auto____13140)) {
              return cljs.core.meta.call(null, obj)
            }else {
              return and__3941__auto____13140
            }
          }else {
            return and__3941__auto____13136
          }
        }()) ? cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["^"], true), pr_seq.call(null, cljs.core.meta.call(null, obj), opts), cljs.core.PersistentVector.fromArray([" "], true)) : null, function() {
          var and__3941__auto____13141 = !(obj == null);
          if(and__3941__auto____13141) {
            return obj.cljs$lang$type
          }else {
            return and__3941__auto____13141
          }
        }() ? obj.cljs$lang$ctorPrSeq(obj) : function() {
          var G__13142__13143 = obj;
          if(G__13142__13143) {
            if(function() {
              var or__3943__auto____13144 = G__13142__13143.cljs$lang$protocol_mask$partition0$ & 536870912;
              if(or__3943__auto____13144) {
                return or__3943__auto____13144
              }else {
                return G__13142__13143.cljs$core$IPrintable$
              }
            }()) {
              return true
            }else {
              if(!G__13142__13143.cljs$lang$protocol_mask$partition0$) {
                return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__13142__13143)
              }else {
                return false
              }
            }
          }else {
            return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__13142__13143)
          }
        }() ? cljs.core._pr_seq.call(null, obj, opts) : cljs.core.truth_(cljs.core.regexp_QMARK_.call(null, obj)) ? cljs.core.list.call(null, '#"', obj.source, '"') : "\ufdd0'else" ? cljs.core.list.call(null, "#<", [cljs.core.str(obj)].join(""), ">") : null)
      }else {
        return null
      }
    }
  }
};
cljs.core.pr_sb = function pr_sb(objs, opts) {
  var sb__13164 = new goog.string.StringBuffer;
  var G__13165__13166 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, cljs.core.first.call(null, objs), opts));
  if(G__13165__13166) {
    var string__13167 = cljs.core.first.call(null, G__13165__13166);
    var G__13165__13168 = G__13165__13166;
    while(true) {
      sb__13164.append(string__13167);
      var temp__4092__auto____13169 = cljs.core.next.call(null, G__13165__13168);
      if(temp__4092__auto____13169) {
        var G__13165__13170 = temp__4092__auto____13169;
        var G__13183 = cljs.core.first.call(null, G__13165__13170);
        var G__13184 = G__13165__13170;
        string__13167 = G__13183;
        G__13165__13168 = G__13184;
        continue
      }else {
      }
      break
    }
  }else {
  }
  var G__13171__13172 = cljs.core.seq.call(null, cljs.core.next.call(null, objs));
  if(G__13171__13172) {
    var obj__13173 = cljs.core.first.call(null, G__13171__13172);
    var G__13171__13174 = G__13171__13172;
    while(true) {
      sb__13164.append(" ");
      var G__13175__13176 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__13173, opts));
      if(G__13175__13176) {
        var string__13177 = cljs.core.first.call(null, G__13175__13176);
        var G__13175__13178 = G__13175__13176;
        while(true) {
          sb__13164.append(string__13177);
          var temp__4092__auto____13179 = cljs.core.next.call(null, G__13175__13178);
          if(temp__4092__auto____13179) {
            var G__13175__13180 = temp__4092__auto____13179;
            var G__13185 = cljs.core.first.call(null, G__13175__13180);
            var G__13186 = G__13175__13180;
            string__13177 = G__13185;
            G__13175__13178 = G__13186;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__4092__auto____13181 = cljs.core.next.call(null, G__13171__13174);
      if(temp__4092__auto____13181) {
        var G__13171__13182 = temp__4092__auto____13181;
        var G__13187 = cljs.core.first.call(null, G__13171__13182);
        var G__13188 = G__13171__13182;
        obj__13173 = G__13187;
        G__13171__13174 = G__13188;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return sb__13164
};
cljs.core.pr_str_with_opts = function pr_str_with_opts(objs, opts) {
  return[cljs.core.str(cljs.core.pr_sb.call(null, objs, opts))].join("")
};
cljs.core.prn_str_with_opts = function prn_str_with_opts(objs, opts) {
  var sb__13190 = cljs.core.pr_sb.call(null, objs, opts);
  sb__13190.append("\n");
  return[cljs.core.str(sb__13190)].join("")
};
cljs.core.pr_with_opts = function pr_with_opts(objs, opts) {
  var G__13209__13210 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, cljs.core.first.call(null, objs), opts));
  if(G__13209__13210) {
    var string__13211 = cljs.core.first.call(null, G__13209__13210);
    var G__13209__13212 = G__13209__13210;
    while(true) {
      cljs.core.string_print.call(null, string__13211);
      var temp__4092__auto____13213 = cljs.core.next.call(null, G__13209__13212);
      if(temp__4092__auto____13213) {
        var G__13209__13214 = temp__4092__auto____13213;
        var G__13227 = cljs.core.first.call(null, G__13209__13214);
        var G__13228 = G__13209__13214;
        string__13211 = G__13227;
        G__13209__13212 = G__13228;
        continue
      }else {
      }
      break
    }
  }else {
  }
  var G__13215__13216 = cljs.core.seq.call(null, cljs.core.next.call(null, objs));
  if(G__13215__13216) {
    var obj__13217 = cljs.core.first.call(null, G__13215__13216);
    var G__13215__13218 = G__13215__13216;
    while(true) {
      cljs.core.string_print.call(null, " ");
      var G__13219__13220 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__13217, opts));
      if(G__13219__13220) {
        var string__13221 = cljs.core.first.call(null, G__13219__13220);
        var G__13219__13222 = G__13219__13220;
        while(true) {
          cljs.core.string_print.call(null, string__13221);
          var temp__4092__auto____13223 = cljs.core.next.call(null, G__13219__13222);
          if(temp__4092__auto____13223) {
            var G__13219__13224 = temp__4092__auto____13223;
            var G__13229 = cljs.core.first.call(null, G__13219__13224);
            var G__13230 = G__13219__13224;
            string__13221 = G__13229;
            G__13219__13222 = G__13230;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__4092__auto____13225 = cljs.core.next.call(null, G__13215__13218);
      if(temp__4092__auto____13225) {
        var G__13215__13226 = temp__4092__auto____13225;
        var G__13231 = cljs.core.first.call(null, G__13215__13226);
        var G__13232 = G__13215__13226;
        obj__13217 = G__13231;
        G__13215__13218 = G__13232;
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
  pr_str.cljs$lang$applyTo = function(arglist__13233) {
    var objs = cljs.core.seq(arglist__13233);
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
  prn_str.cljs$lang$applyTo = function(arglist__13234) {
    var objs = cljs.core.seq(arglist__13234);
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
  pr.cljs$lang$applyTo = function(arglist__13235) {
    var objs = cljs.core.seq(arglist__13235);
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
  cljs_core_print.cljs$lang$applyTo = function(arglist__13236) {
    var objs = cljs.core.seq(arglist__13236);
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
  print_str.cljs$lang$applyTo = function(arglist__13237) {
    var objs = cljs.core.seq(arglist__13237);
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
  println.cljs$lang$applyTo = function(arglist__13238) {
    var objs = cljs.core.seq(arglist__13238);
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
  println_str.cljs$lang$applyTo = function(arglist__13239) {
    var objs = cljs.core.seq(arglist__13239);
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
  prn.cljs$lang$applyTo = function(arglist__13240) {
    var objs = cljs.core.seq(arglist__13240);
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
  printf.cljs$lang$applyTo = function(arglist__13241) {
    var fmt = cljs.core.first(arglist__13241);
    var args = cljs.core.rest(arglist__13241);
    return printf__delegate(fmt, args)
  };
  printf.cljs$lang$arity$variadic = printf__delegate;
  return printf
}();
cljs.core.HashMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.HashMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__13242 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__13242, "{", ", ", "}", opts, coll)
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
  var pr_pair__13243 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__13243, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__13244 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__13244, "{", ", ", "}", opts, coll)
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
      var temp__4092__auto____13245 = cljs.core.namespace.call(null, obj);
      if(cljs.core.truth_(temp__4092__auto____13245)) {
        var nspc__13246 = temp__4092__auto____13245;
        return[cljs.core.str(nspc__13246), cljs.core.str("/")].join("")
      }else {
        return null
      }
    }()), cljs.core.str(cljs.core.name.call(null, obj))].join(""))
  }else {
    if(cljs.core.symbol_QMARK_.call(null, obj)) {
      return cljs.core.list.call(null, [cljs.core.str(function() {
        var temp__4092__auto____13247 = cljs.core.namespace.call(null, obj);
        if(cljs.core.truth_(temp__4092__auto____13247)) {
          var nspc__13248 = temp__4092__auto____13247;
          return[cljs.core.str(nspc__13248), cljs.core.str("/")].join("")
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
  var pr_pair__13249 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__13249, "{", ", ", "}", opts, coll)
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
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#<Array [", ", ", "]>", opts, a)
};
cljs.core.IPrintable["function"] = true;
cljs.core._pr_seq["function"] = function(this$) {
  return cljs.core.list.call(null, "#<", [cljs.core.str(this$)].join(""), ">")
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
  var normalize__13251 = function(n, len) {
    var ns__13250 = [cljs.core.str(n)].join("");
    while(true) {
      if(cljs.core.count.call(null, ns__13250) < len) {
        var G__13253 = [cljs.core.str("0"), cljs.core.str(ns__13250)].join("");
        ns__13250 = G__13253;
        continue
      }else {
        return ns__13250
      }
      break
    }
  };
  return cljs.core.list.call(null, [cljs.core.str('#inst "'), cljs.core.str(d.getUTCFullYear()), cljs.core.str("-"), cljs.core.str(normalize__13251.call(null, d.getUTCMonth() + 1, 2)), cljs.core.str("-"), cljs.core.str(normalize__13251.call(null, d.getUTCDate(), 2)), cljs.core.str("T"), cljs.core.str(normalize__13251.call(null, d.getUTCHours(), 2)), cljs.core.str(":"), cljs.core.str(normalize__13251.call(null, d.getUTCMinutes(), 2)), cljs.core.str(":"), cljs.core.str(normalize__13251.call(null, d.getUTCSeconds(), 
  2)), cljs.core.str("."), cljs.core.str(normalize__13251.call(null, d.getUTCMilliseconds(), 3)), cljs.core.str("-"), cljs.core.str('00:00"')].join(""))
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
  var pr_pair__13252 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__13252, "{", ", ", "}", opts, coll)
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
  var this__13254 = this;
  return goog.getUid(this$)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_notify_watches$arity$3 = function(this$, oldval, newval) {
  var this__13255 = this;
  var G__13256__13257 = cljs.core.seq.call(null, this__13255.watches);
  if(G__13256__13257) {
    var G__13259__13261 = cljs.core.first.call(null, G__13256__13257);
    var vec__13260__13262 = G__13259__13261;
    var key__13263 = cljs.core.nth.call(null, vec__13260__13262, 0, null);
    var f__13264 = cljs.core.nth.call(null, vec__13260__13262, 1, null);
    var G__13256__13265 = G__13256__13257;
    var G__13259__13266 = G__13259__13261;
    var G__13256__13267 = G__13256__13265;
    while(true) {
      var vec__13268__13269 = G__13259__13266;
      var key__13270 = cljs.core.nth.call(null, vec__13268__13269, 0, null);
      var f__13271 = cljs.core.nth.call(null, vec__13268__13269, 1, null);
      var G__13256__13272 = G__13256__13267;
      f__13271.call(null, key__13270, this$, oldval, newval);
      var temp__4092__auto____13273 = cljs.core.next.call(null, G__13256__13272);
      if(temp__4092__auto____13273) {
        var G__13256__13274 = temp__4092__auto____13273;
        var G__13281 = cljs.core.first.call(null, G__13256__13274);
        var G__13282 = G__13256__13274;
        G__13259__13266 = G__13281;
        G__13256__13267 = G__13282;
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
  var this__13275 = this;
  return this$.watches = cljs.core.assoc.call(null, this__13275.watches, key, f)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_remove_watch$arity$2 = function(this$, key) {
  var this__13276 = this;
  return this$.watches = cljs.core.dissoc.call(null, this__13276.watches, key)
};
cljs.core.Atom.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(a, opts) {
  var this__13277 = this;
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["#<Atom: "], true), cljs.core._pr_seq.call(null, this__13277.state, opts), ">")
};
cljs.core.Atom.prototype.cljs$core$IMeta$_meta$arity$1 = function(_) {
  var this__13278 = this;
  return this__13278.meta
};
cljs.core.Atom.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__13279 = this;
  return this__13279.state
};
cljs.core.Atom.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var this__13280 = this;
  return o === other
};
cljs.core.Atom;
cljs.core.atom = function() {
  var atom = null;
  var atom__1 = function(x) {
    return new cljs.core.Atom(x, null, null, null)
  };
  var atom__2 = function() {
    var G__13294__delegate = function(x, p__13283) {
      var map__13289__13290 = p__13283;
      var map__13289__13291 = cljs.core.seq_QMARK_.call(null, map__13289__13290) ? cljs.core.apply.call(null, cljs.core.hash_map, map__13289__13290) : map__13289__13290;
      var validator__13292 = cljs.core._lookup.call(null, map__13289__13291, "\ufdd0'validator", null);
      var meta__13293 = cljs.core._lookup.call(null, map__13289__13291, "\ufdd0'meta", null);
      return new cljs.core.Atom(x, meta__13293, validator__13292, null)
    };
    var G__13294 = function(x, var_args) {
      var p__13283 = null;
      if(goog.isDef(var_args)) {
        p__13283 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__13294__delegate.call(this, x, p__13283)
    };
    G__13294.cljs$lang$maxFixedArity = 1;
    G__13294.cljs$lang$applyTo = function(arglist__13295) {
      var x = cljs.core.first(arglist__13295);
      var p__13283 = cljs.core.rest(arglist__13295);
      return G__13294__delegate(x, p__13283)
    };
    G__13294.cljs$lang$arity$variadic = G__13294__delegate;
    return G__13294
  }();
  atom = function(x, var_args) {
    var p__13283 = var_args;
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
  var temp__4092__auto____13299 = a.validator;
  if(cljs.core.truth_(temp__4092__auto____13299)) {
    var validate__13300 = temp__4092__auto____13299;
    if(cljs.core.truth_(validate__13300.call(null, new_value))) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str("Validator rejected reference state"), cljs.core.str("\n"), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'validate", "\ufdd1'new-value"), cljs.core.hash_map("\ufdd0'line", 6440, "\ufdd0'column", 13))))].join(""));
    }
  }else {
  }
  var old_value__13301 = a.state;
  a.state = new_value;
  cljs.core._notify_watches.call(null, a, old_value__13301, new_value);
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
    var G__13302__delegate = function(a, f, x, y, z, more) {
      return cljs.core.reset_BANG_.call(null, a, cljs.core.apply.call(null, f, a.state, x, y, z, more))
    };
    var G__13302 = function(a, f, x, y, z, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__13302__delegate.call(this, a, f, x, y, z, more)
    };
    G__13302.cljs$lang$maxFixedArity = 5;
    G__13302.cljs$lang$applyTo = function(arglist__13303) {
      var a = cljs.core.first(arglist__13303);
      var f = cljs.core.first(cljs.core.next(arglist__13303));
      var x = cljs.core.first(cljs.core.next(cljs.core.next(arglist__13303)));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__13303))));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__13303)))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__13303)))));
      return G__13302__delegate(a, f, x, y, z, more)
    };
    G__13302.cljs$lang$arity$variadic = G__13302__delegate;
    return G__13302
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
  alter_meta_BANG_.cljs$lang$applyTo = function(arglist__13304) {
    var iref = cljs.core.first(arglist__13304);
    var f = cljs.core.first(cljs.core.next(arglist__13304));
    var args = cljs.core.rest(cljs.core.next(arglist__13304));
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
  var this__13305 = this;
  return(new cljs.core.Keyword("\ufdd0'done")).call(null, cljs.core.deref.call(null, this__13305.state))
};
cljs.core.Delay.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__13306 = this;
  return(new cljs.core.Keyword("\ufdd0'value")).call(null, cljs.core.swap_BANG_.call(null, this__13306.state, function(p__13307) {
    var map__13308__13309 = p__13307;
    var map__13308__13310 = cljs.core.seq_QMARK_.call(null, map__13308__13309) ? cljs.core.apply.call(null, cljs.core.hash_map, map__13308__13309) : map__13308__13309;
    var curr_state__13311 = map__13308__13310;
    var done__13312 = cljs.core._lookup.call(null, map__13308__13310, "\ufdd0'done", null);
    if(cljs.core.truth_(done__13312)) {
      return curr_state__13311
    }else {
      return cljs.core.ObjMap.fromObject(["\ufdd0'done", "\ufdd0'value"], {"\ufdd0'done":true, "\ufdd0'value":this__13306.f.call(null)})
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
    var map__13341__13342 = options;
    var map__13341__13343 = cljs.core.seq_QMARK_.call(null, map__13341__13342) ? cljs.core.apply.call(null, cljs.core.hash_map, map__13341__13342) : map__13341__13342;
    var keywordize_keys__13344 = cljs.core._lookup.call(null, map__13341__13343, "\ufdd0'keywordize-keys", null);
    var keyfn__13345 = cljs.core.truth_(keywordize_keys__13344) ? cljs.core.keyword : cljs.core.str;
    var f__13368 = function thisfn(x) {
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
                var iter__2403__auto____13367 = function iter__13357(s__13358) {
                  return new cljs.core.LazySeq(null, false, function() {
                    var s__13358__13363 = s__13358;
                    while(true) {
                      var temp__4092__auto____13364 = cljs.core.seq.call(null, s__13358__13363);
                      if(temp__4092__auto____13364) {
                        var xs__4579__auto____13365 = temp__4092__auto____13364;
                        var k__13366 = cljs.core.first.call(null, xs__4579__auto____13365);
                        return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([keyfn__13345.call(null, k__13366), thisfn.call(null, x[k__13366])], true), iter__13357.call(null, cljs.core.rest.call(null, s__13358__13363)))
                      }else {
                        return null
                      }
                      break
                    }
                  }, null)
                };
                return iter__2403__auto____13367.call(null, cljs.core.js_keys.call(null, x))
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
    return f__13368.call(null, x)
  };
  var js__GT_clj = function(x, var_args) {
    var options = null;
    if(goog.isDef(var_args)) {
      options = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return js__GT_clj__delegate.call(this, x, options)
  };
  js__GT_clj.cljs$lang$maxFixedArity = 1;
  js__GT_clj.cljs$lang$applyTo = function(arglist__13369) {
    var x = cljs.core.first(arglist__13369);
    var options = cljs.core.rest(arglist__13369);
    return js__GT_clj__delegate(x, options)
  };
  js__GT_clj.cljs$lang$arity$variadic = js__GT_clj__delegate;
  return js__GT_clj
}();
cljs.core.memoize = function memoize(f) {
  var mem__13374 = cljs.core.atom.call(null, cljs.core.ObjMap.EMPTY);
  return function() {
    var G__13378__delegate = function(args) {
      var temp__4090__auto____13375 = cljs.core._lookup.call(null, cljs.core.deref.call(null, mem__13374), args, null);
      if(cljs.core.truth_(temp__4090__auto____13375)) {
        var v__13376 = temp__4090__auto____13375;
        return v__13376
      }else {
        var ret__13377 = cljs.core.apply.call(null, f, args);
        cljs.core.swap_BANG_.call(null, mem__13374, cljs.core.assoc, args, ret__13377);
        return ret__13377
      }
    };
    var G__13378 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__13378__delegate.call(this, args)
    };
    G__13378.cljs$lang$maxFixedArity = 0;
    G__13378.cljs$lang$applyTo = function(arglist__13379) {
      var args = cljs.core.seq(arglist__13379);
      return G__13378__delegate(args)
    };
    G__13378.cljs$lang$arity$variadic = G__13378__delegate;
    return G__13378
  }()
};
cljs.core.trampoline = function() {
  var trampoline = null;
  var trampoline__1 = function(f) {
    while(true) {
      var ret__13381 = f.call(null);
      if(cljs.core.fn_QMARK_.call(null, ret__13381)) {
        var G__13382 = ret__13381;
        f = G__13382;
        continue
      }else {
        return ret__13381
      }
      break
    }
  };
  var trampoline__2 = function() {
    var G__13383__delegate = function(f, args) {
      return trampoline.call(null, function() {
        return cljs.core.apply.call(null, f, args)
      })
    };
    var G__13383 = function(f, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__13383__delegate.call(this, f, args)
    };
    G__13383.cljs$lang$maxFixedArity = 1;
    G__13383.cljs$lang$applyTo = function(arglist__13384) {
      var f = cljs.core.first(arglist__13384);
      var args = cljs.core.rest(arglist__13384);
      return G__13383__delegate(f, args)
    };
    G__13383.cljs$lang$arity$variadic = G__13383__delegate;
    return G__13383
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
    var k__13386 = f.call(null, x);
    return cljs.core.assoc.call(null, ret, k__13386, cljs.core.conj.call(null, cljs.core._lookup.call(null, ret, k__13386, cljs.core.PersistentVector.EMPTY), x))
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
    var or__3943__auto____13395 = cljs.core._EQ_.call(null, child, parent);
    if(or__3943__auto____13395) {
      return or__3943__auto____13395
    }else {
      var or__3943__auto____13396 = cljs.core.contains_QMARK_.call(null, (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h).call(null, child), parent);
      if(or__3943__auto____13396) {
        return or__3943__auto____13396
      }else {
        var and__3941__auto____13397 = cljs.core.vector_QMARK_.call(null, parent);
        if(and__3941__auto____13397) {
          var and__3941__auto____13398 = cljs.core.vector_QMARK_.call(null, child);
          if(and__3941__auto____13398) {
            var and__3941__auto____13399 = cljs.core.count.call(null, parent) === cljs.core.count.call(null, child);
            if(and__3941__auto____13399) {
              var ret__13400 = true;
              var i__13401 = 0;
              while(true) {
                if(function() {
                  var or__3943__auto____13402 = cljs.core.not.call(null, ret__13400);
                  if(or__3943__auto____13402) {
                    return or__3943__auto____13402
                  }else {
                    return i__13401 === cljs.core.count.call(null, parent)
                  }
                }()) {
                  return ret__13400
                }else {
                  var G__13403 = isa_QMARK_.call(null, h, child.call(null, i__13401), parent.call(null, i__13401));
                  var G__13404 = i__13401 + 1;
                  ret__13400 = G__13403;
                  i__13401 = G__13404;
                  continue
                }
                break
              }
            }else {
              return and__3941__auto____13399
            }
          }else {
            return and__3941__auto____13398
          }
        }else {
          return and__3941__auto____13397
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
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'not=", "\ufdd1'tag", "\ufdd1'parent"), cljs.core.hash_map("\ufdd0'line", 6728, "\ufdd0'column", 12))))].join(""));
    }
    var tp__13413 = (new cljs.core.Keyword("\ufdd0'parents")).call(null, h);
    var td__13414 = (new cljs.core.Keyword("\ufdd0'descendants")).call(null, h);
    var ta__13415 = (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h);
    var tf__13416 = function(m, source, sources, target, targets) {
      return cljs.core.reduce.call(null, function(ret, k) {
        return cljs.core.assoc.call(null, ret, k, cljs.core.reduce.call(null, cljs.core.conj, cljs.core._lookup.call(null, targets, k, cljs.core.PersistentHashSet.EMPTY), cljs.core.cons.call(null, target, targets.call(null, target))))
      }, m, cljs.core.cons.call(null, source, sources.call(null, source)))
    };
    var or__3943__auto____13417 = cljs.core.contains_QMARK_.call(null, tp__13413.call(null, tag), parent) ? null : function() {
      if(cljs.core.contains_QMARK_.call(null, ta__13415.call(null, tag), parent)) {
        throw new Error([cljs.core.str(tag), cljs.core.str("already has"), cljs.core.str(parent), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      if(cljs.core.contains_QMARK_.call(null, ta__13415.call(null, parent), tag)) {
        throw new Error([cljs.core.str("Cyclic derivation:"), cljs.core.str(parent), cljs.core.str("has"), cljs.core.str(tag), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'ancestors", "\ufdd0'descendants"], {"\ufdd0'parents":cljs.core.assoc.call(null, (new cljs.core.Keyword("\ufdd0'parents")).call(null, h), tag, cljs.core.conj.call(null, cljs.core._lookup.call(null, tp__13413, tag, cljs.core.PersistentHashSet.EMPTY), parent)), "\ufdd0'ancestors":tf__13416.call(null, (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h), tag, td__13414, parent, ta__13415), "\ufdd0'descendants":tf__13416.call(null, 
      (new cljs.core.Keyword("\ufdd0'descendants")).call(null, h), parent, ta__13415, tag, td__13414)})
    }();
    if(cljs.core.truth_(or__3943__auto____13417)) {
      return or__3943__auto____13417
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
    var parentMap__13422 = (new cljs.core.Keyword("\ufdd0'parents")).call(null, h);
    var childsParents__13423 = cljs.core.truth_(parentMap__13422.call(null, tag)) ? cljs.core.disj.call(null, parentMap__13422.call(null, tag), parent) : cljs.core.PersistentHashSet.EMPTY;
    var newParents__13424 = cljs.core.truth_(cljs.core.not_empty.call(null, childsParents__13423)) ? cljs.core.assoc.call(null, parentMap__13422, tag, childsParents__13423) : cljs.core.dissoc.call(null, parentMap__13422, tag);
    var deriv_seq__13425 = cljs.core.flatten.call(null, cljs.core.map.call(null, function(p1__13405_SHARP_) {
      return cljs.core.cons.call(null, cljs.core.first.call(null, p1__13405_SHARP_), cljs.core.interpose.call(null, cljs.core.first.call(null, p1__13405_SHARP_), cljs.core.second.call(null, p1__13405_SHARP_)))
    }, cljs.core.seq.call(null, newParents__13424)));
    if(cljs.core.contains_QMARK_.call(null, parentMap__13422.call(null, tag), parent)) {
      return cljs.core.reduce.call(null, function(p1__13406_SHARP_, p2__13407_SHARP_) {
        return cljs.core.apply.call(null, cljs.core.derive, p1__13406_SHARP_, p2__13407_SHARP_)
      }, cljs.core.make_hierarchy.call(null), cljs.core.partition.call(null, 2, deriv_seq__13425))
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
  var xprefs__13433 = cljs.core.deref.call(null, prefer_table).call(null, x);
  var or__3943__auto____13435 = cljs.core.truth_(function() {
    var and__3941__auto____13434 = xprefs__13433;
    if(cljs.core.truth_(and__3941__auto____13434)) {
      return xprefs__13433.call(null, y)
    }else {
      return and__3941__auto____13434
    }
  }()) ? true : null;
  if(cljs.core.truth_(or__3943__auto____13435)) {
    return or__3943__auto____13435
  }else {
    var or__3943__auto____13437 = function() {
      var ps__13436 = cljs.core.parents.call(null, y);
      while(true) {
        if(cljs.core.count.call(null, ps__13436) > 0) {
          if(cljs.core.truth_(prefers_STAR_.call(null, x, cljs.core.first.call(null, ps__13436), prefer_table))) {
          }else {
          }
          var G__13440 = cljs.core.rest.call(null, ps__13436);
          ps__13436 = G__13440;
          continue
        }else {
          return null
        }
        break
      }
    }();
    if(cljs.core.truth_(or__3943__auto____13437)) {
      return or__3943__auto____13437
    }else {
      var or__3943__auto____13439 = function() {
        var ps__13438 = cljs.core.parents.call(null, x);
        while(true) {
          if(cljs.core.count.call(null, ps__13438) > 0) {
            if(cljs.core.truth_(prefers_STAR_.call(null, cljs.core.first.call(null, ps__13438), y, prefer_table))) {
            }else {
            }
            var G__13441 = cljs.core.rest.call(null, ps__13438);
            ps__13438 = G__13441;
            continue
          }else {
            return null
          }
          break
        }
      }();
      if(cljs.core.truth_(or__3943__auto____13439)) {
        return or__3943__auto____13439
      }else {
        return false
      }
    }
  }
};
cljs.core.dominates = function dominates(x, y, prefer_table) {
  var or__3943__auto____13443 = cljs.core.prefers_STAR_.call(null, x, y, prefer_table);
  if(cljs.core.truth_(or__3943__auto____13443)) {
    return or__3943__auto____13443
  }else {
    return cljs.core.isa_QMARK_.call(null, x, y)
  }
};
cljs.core.find_and_cache_best_method = function find_and_cache_best_method(name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  var best_entry__13461 = cljs.core.reduce.call(null, function(be, p__13453) {
    var vec__13454__13455 = p__13453;
    var k__13456 = cljs.core.nth.call(null, vec__13454__13455, 0, null);
    var ___13457 = cljs.core.nth.call(null, vec__13454__13455, 1, null);
    var e__13458 = vec__13454__13455;
    if(cljs.core.isa_QMARK_.call(null, dispatch_val, k__13456)) {
      var be2__13460 = cljs.core.truth_(function() {
        var or__3943__auto____13459 = be == null;
        if(or__3943__auto____13459) {
          return or__3943__auto____13459
        }else {
          return cljs.core.dominates.call(null, k__13456, cljs.core.first.call(null, be), prefer_table)
        }
      }()) ? e__13458 : be;
      if(cljs.core.truth_(cljs.core.dominates.call(null, cljs.core.first.call(null, be2__13460), k__13456, prefer_table))) {
      }else {
        throw new Error([cljs.core.str("Multiple methods in multimethod '"), cljs.core.str(name), cljs.core.str("' match dispatch value: "), cljs.core.str(dispatch_val), cljs.core.str(" -> "), cljs.core.str(k__13456), cljs.core.str(" and "), cljs.core.str(cljs.core.first.call(null, be2__13460)), cljs.core.str(", and neither is preferred")].join(""));
      }
      return be2__13460
    }else {
      return be
    }
  }, null, cljs.core.deref.call(null, method_table));
  if(cljs.core.truth_(best_entry__13461)) {
    if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, cached_hierarchy), cljs.core.deref.call(null, hierarchy))) {
      cljs.core.swap_BANG_.call(null, method_cache, cljs.core.assoc, dispatch_val, cljs.core.second.call(null, best_entry__13461));
      return cljs.core.second.call(null, best_entry__13461)
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
    var and__3941__auto____13466 = mf;
    if(and__3941__auto____13466) {
      return mf.cljs$core$IMultiFn$_reset$arity$1
    }else {
      return and__3941__auto____13466
    }
  }()) {
    return mf.cljs$core$IMultiFn$_reset$arity$1(mf)
  }else {
    var x__2304__auto____13467 = mf == null ? null : mf;
    return function() {
      var or__3943__auto____13468 = cljs.core._reset[goog.typeOf(x__2304__auto____13467)];
      if(or__3943__auto____13468) {
        return or__3943__auto____13468
      }else {
        var or__3943__auto____13469 = cljs.core._reset["_"];
        if(or__3943__auto____13469) {
          return or__3943__auto____13469
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-reset", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._add_method = function _add_method(mf, dispatch_val, method) {
  if(function() {
    var and__3941__auto____13474 = mf;
    if(and__3941__auto____13474) {
      return mf.cljs$core$IMultiFn$_add_method$arity$3
    }else {
      return and__3941__auto____13474
    }
  }()) {
    return mf.cljs$core$IMultiFn$_add_method$arity$3(mf, dispatch_val, method)
  }else {
    var x__2304__auto____13475 = mf == null ? null : mf;
    return function() {
      var or__3943__auto____13476 = cljs.core._add_method[goog.typeOf(x__2304__auto____13475)];
      if(or__3943__auto____13476) {
        return or__3943__auto____13476
      }else {
        var or__3943__auto____13477 = cljs.core._add_method["_"];
        if(or__3943__auto____13477) {
          return or__3943__auto____13477
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-add-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, method)
  }
};
cljs.core._remove_method = function _remove_method(mf, dispatch_val) {
  if(function() {
    var and__3941__auto____13482 = mf;
    if(and__3941__auto____13482) {
      return mf.cljs$core$IMultiFn$_remove_method$arity$2
    }else {
      return and__3941__auto____13482
    }
  }()) {
    return mf.cljs$core$IMultiFn$_remove_method$arity$2(mf, dispatch_val)
  }else {
    var x__2304__auto____13483 = mf == null ? null : mf;
    return function() {
      var or__3943__auto____13484 = cljs.core._remove_method[goog.typeOf(x__2304__auto____13483)];
      if(or__3943__auto____13484) {
        return or__3943__auto____13484
      }else {
        var or__3943__auto____13485 = cljs.core._remove_method["_"];
        if(or__3943__auto____13485) {
          return or__3943__auto____13485
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-remove-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._prefer_method = function _prefer_method(mf, dispatch_val, dispatch_val_y) {
  if(function() {
    var and__3941__auto____13490 = mf;
    if(and__3941__auto____13490) {
      return mf.cljs$core$IMultiFn$_prefer_method$arity$3
    }else {
      return and__3941__auto____13490
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefer_method$arity$3(mf, dispatch_val, dispatch_val_y)
  }else {
    var x__2304__auto____13491 = mf == null ? null : mf;
    return function() {
      var or__3943__auto____13492 = cljs.core._prefer_method[goog.typeOf(x__2304__auto____13491)];
      if(or__3943__auto____13492) {
        return or__3943__auto____13492
      }else {
        var or__3943__auto____13493 = cljs.core._prefer_method["_"];
        if(or__3943__auto____13493) {
          return or__3943__auto____13493
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefer-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, dispatch_val_y)
  }
};
cljs.core._get_method = function _get_method(mf, dispatch_val) {
  if(function() {
    var and__3941__auto____13498 = mf;
    if(and__3941__auto____13498) {
      return mf.cljs$core$IMultiFn$_get_method$arity$2
    }else {
      return and__3941__auto____13498
    }
  }()) {
    return mf.cljs$core$IMultiFn$_get_method$arity$2(mf, dispatch_val)
  }else {
    var x__2304__auto____13499 = mf == null ? null : mf;
    return function() {
      var or__3943__auto____13500 = cljs.core._get_method[goog.typeOf(x__2304__auto____13499)];
      if(or__3943__auto____13500) {
        return or__3943__auto____13500
      }else {
        var or__3943__auto____13501 = cljs.core._get_method["_"];
        if(or__3943__auto____13501) {
          return or__3943__auto____13501
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-get-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._methods = function _methods(mf) {
  if(function() {
    var and__3941__auto____13506 = mf;
    if(and__3941__auto____13506) {
      return mf.cljs$core$IMultiFn$_methods$arity$1
    }else {
      return and__3941__auto____13506
    }
  }()) {
    return mf.cljs$core$IMultiFn$_methods$arity$1(mf)
  }else {
    var x__2304__auto____13507 = mf == null ? null : mf;
    return function() {
      var or__3943__auto____13508 = cljs.core._methods[goog.typeOf(x__2304__auto____13507)];
      if(or__3943__auto____13508) {
        return or__3943__auto____13508
      }else {
        var or__3943__auto____13509 = cljs.core._methods["_"];
        if(or__3943__auto____13509) {
          return or__3943__auto____13509
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-methods", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._prefers = function _prefers(mf) {
  if(function() {
    var and__3941__auto____13514 = mf;
    if(and__3941__auto____13514) {
      return mf.cljs$core$IMultiFn$_prefers$arity$1
    }else {
      return and__3941__auto____13514
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefers$arity$1(mf)
  }else {
    var x__2304__auto____13515 = mf == null ? null : mf;
    return function() {
      var or__3943__auto____13516 = cljs.core._prefers[goog.typeOf(x__2304__auto____13515)];
      if(or__3943__auto____13516) {
        return or__3943__auto____13516
      }else {
        var or__3943__auto____13517 = cljs.core._prefers["_"];
        if(or__3943__auto____13517) {
          return or__3943__auto____13517
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefers", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._dispatch = function _dispatch(mf, args) {
  if(function() {
    var and__3941__auto____13522 = mf;
    if(and__3941__auto____13522) {
      return mf.cljs$core$IMultiFn$_dispatch$arity$2
    }else {
      return and__3941__auto____13522
    }
  }()) {
    return mf.cljs$core$IMultiFn$_dispatch$arity$2(mf, args)
  }else {
    var x__2304__auto____13523 = mf == null ? null : mf;
    return function() {
      var or__3943__auto____13524 = cljs.core._dispatch[goog.typeOf(x__2304__auto____13523)];
      if(or__3943__auto____13524) {
        return or__3943__auto____13524
      }else {
        var or__3943__auto____13525 = cljs.core._dispatch["_"];
        if(or__3943__auto____13525) {
          return or__3943__auto____13525
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-dispatch", mf);
        }
      }
    }().call(null, mf, args)
  }
};
cljs.core.do_dispatch = function do_dispatch(mf, dispatch_fn, args) {
  var dispatch_val__13528 = cljs.core.apply.call(null, dispatch_fn, args);
  var target_fn__13529 = cljs.core._get_method.call(null, mf, dispatch_val__13528);
  if(cljs.core.truth_(target_fn__13529)) {
  }else {
    throw new Error([cljs.core.str("No method in multimethod '"), cljs.core.str(cljs.core.name), cljs.core.str("' for dispatch value: "), cljs.core.str(dispatch_val__13528)].join(""));
  }
  return cljs.core.apply.call(null, target_fn__13529, args)
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
  var this__13530 = this;
  return goog.getUid(this$)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_reset$arity$1 = function(mf) {
  var this__13531 = this;
  cljs.core.swap_BANG_.call(null, this__13531.method_table, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__13531.method_cache, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__13531.prefer_table, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__13531.cached_hierarchy, function(mf) {
    return null
  });
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_add_method$arity$3 = function(mf, dispatch_val, method) {
  var this__13532 = this;
  cljs.core.swap_BANG_.call(null, this__13532.method_table, cljs.core.assoc, dispatch_val, method);
  cljs.core.reset_cache.call(null, this__13532.method_cache, this__13532.method_table, this__13532.cached_hierarchy, this__13532.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_remove_method$arity$2 = function(mf, dispatch_val) {
  var this__13533 = this;
  cljs.core.swap_BANG_.call(null, this__13533.method_table, cljs.core.dissoc, dispatch_val);
  cljs.core.reset_cache.call(null, this__13533.method_cache, this__13533.method_table, this__13533.cached_hierarchy, this__13533.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_get_method$arity$2 = function(mf, dispatch_val) {
  var this__13534 = this;
  if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, this__13534.cached_hierarchy), cljs.core.deref.call(null, this__13534.hierarchy))) {
  }else {
    cljs.core.reset_cache.call(null, this__13534.method_cache, this__13534.method_table, this__13534.cached_hierarchy, this__13534.hierarchy)
  }
  var temp__4090__auto____13535 = cljs.core.deref.call(null, this__13534.method_cache).call(null, dispatch_val);
  if(cljs.core.truth_(temp__4090__auto____13535)) {
    var target_fn__13536 = temp__4090__auto____13535;
    return target_fn__13536
  }else {
    var temp__4090__auto____13537 = cljs.core.find_and_cache_best_method.call(null, this__13534.name, dispatch_val, this__13534.hierarchy, this__13534.method_table, this__13534.prefer_table, this__13534.method_cache, this__13534.cached_hierarchy);
    if(cljs.core.truth_(temp__4090__auto____13537)) {
      var target_fn__13538 = temp__4090__auto____13537;
      return target_fn__13538
    }else {
      return cljs.core.deref.call(null, this__13534.method_table).call(null, this__13534.default_dispatch_val)
    }
  }
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefer_method$arity$3 = function(mf, dispatch_val_x, dispatch_val_y) {
  var this__13539 = this;
  if(cljs.core.truth_(cljs.core.prefers_STAR_.call(null, dispatch_val_x, dispatch_val_y, this__13539.prefer_table))) {
    throw new Error([cljs.core.str("Preference conflict in multimethod '"), cljs.core.str(this__13539.name), cljs.core.str("': "), cljs.core.str(dispatch_val_y), cljs.core.str(" is already preferred to "), cljs.core.str(dispatch_val_x)].join(""));
  }else {
  }
  cljs.core.swap_BANG_.call(null, this__13539.prefer_table, function(old) {
    return cljs.core.assoc.call(null, old, dispatch_val_x, cljs.core.conj.call(null, cljs.core._lookup.call(null, old, dispatch_val_x, cljs.core.PersistentHashSet.EMPTY), dispatch_val_y))
  });
  return cljs.core.reset_cache.call(null, this__13539.method_cache, this__13539.method_table, this__13539.cached_hierarchy, this__13539.hierarchy)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_methods$arity$1 = function(mf) {
  var this__13540 = this;
  return cljs.core.deref.call(null, this__13540.method_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefers$arity$1 = function(mf) {
  var this__13541 = this;
  return cljs.core.deref.call(null, this__13541.prefer_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_dispatch$arity$2 = function(mf, args) {
  var this__13542 = this;
  return cljs.core.do_dispatch.call(null, mf, this__13542.dispatch_fn, args)
};
cljs.core.MultiFn;
cljs.core.MultiFn.prototype.call = function() {
  var G__13544__delegate = function(_, args) {
    var self__13543 = this;
    return cljs.core._dispatch.call(null, self__13543, args)
  };
  var G__13544 = function(_, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return G__13544__delegate.call(this, _, args)
  };
  G__13544.cljs$lang$maxFixedArity = 1;
  G__13544.cljs$lang$applyTo = function(arglist__13545) {
    var _ = cljs.core.first(arglist__13545);
    var args = cljs.core.rest(arglist__13545);
    return G__13544__delegate(_, args)
  };
  G__13544.cljs$lang$arity$variadic = G__13544__delegate;
  return G__13544
}();
cljs.core.MultiFn.prototype.apply = function(_, args) {
  var self__13546 = this;
  return cljs.core._dispatch.call(null, self__13546, args)
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
  var this__13547 = this;
  return goog.string.hashCode(cljs.core.pr_str.call(null, this$))
};
cljs.core.UUID.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(_13549, _) {
  var this__13548 = this;
  return cljs.core.list.call(null, [cljs.core.str('#uuid "'), cljs.core.str(this__13548.uuid), cljs.core.str('"')].join(""))
};
cljs.core.UUID.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(_, other) {
  var this__13550 = this;
  var and__3941__auto____13551 = cljs.core.instance_QMARK_.call(null, cljs.core.UUID, other);
  if(and__3941__auto____13551) {
    return this__13550.uuid === other.uuid
  }else {
    return and__3941__auto____13551
  }
};
cljs.core.UUID.prototype.toString = function() {
  var this__13552 = this;
  var this__13553 = this;
  return cljs.core.pr_str.call(null, this__13553)
};
cljs.core.UUID;
goog.provide("cube.cube");
goog.require("cljs.core");
cube.cube.clj__GT_js = function clj__GT_js(x) {
  if(cljs.core.string_QMARK_.call(null, x)) {
    return x
  }else {
    if(cljs.core.keyword_QMARK_.call(null, x)) {
      return cljs.core.name.call(null, x)
    }else {
      if(cljs.core.map_QMARK_.call(null, x)) {
        return cljs.core.reduce.call(null, function(m, p__81853) {
          var vec__81854__81855 = p__81853;
          var k__81856 = cljs.core.nth.call(null, vec__81854__81855, 0, null);
          var v__81857 = cljs.core.nth.call(null, vec__81854__81855, 1, null);
          return cljs.core.assoc.call(null, m, clj__GT_js.call(null, k__81856), clj__GT_js.call(null, v__81857))
        }, cljs.core.ObjMap.EMPTY, x).strobj
      }else {
        if(cljs.core.coll_QMARK_.call(null, x)) {
          return cljs.core.apply.call(null, cljs.core.array, cljs.core.map.call(null, clj__GT_js, x))
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
if(cljs.core.not.call(null, Detector.webgl)) {
  Detector.addGetWebGLMessage.call(null)
}else {
}
cube.cube.calc_aspect = function calc_aspect() {
  return window.innerWidth / window.innerHeight
};
cube.cube.camera = function() {
  var c__81858 = new THREE.PerspectiveCamera;
  c__81858.fav = 27;
  c__81858.aspect = cube.cube.calc_aspect.call(null);
  c__81858.near = 1;
  c__81858.far = 3500;
  c__81858.position.set(new THREE.Vector3(0, 0, 2750));
  return c__81858
}();
cube.cube.light1 = function() {
  var l__81859 = new THREE.DirectionalLight(16777215, 0.5);
  l__81859.position.set(1, 1, 1);
  return l__81859
}();
cube.cube.light2 = function() {
  var l__81860 = new THREE.DirectionalLight(16777215, 1.5);
  l__81860.position.set(0, -1, 0);
  return l__81860
}();
cube.cube.triangles = 16E3;
cube.cube.chunk_size = 21845;
cube.cube.n = 400;
cube.cube.n2 = cube.cube.n / 2;
cube.cube.d = 24;
cube.cube.d2 = cube.cube.d / 2;
cube.cube.make_random_triangle = function make_random_triangle() {
  var x__81886 = cube.cube.n * Math.random() - cube.cube.n2;
  var y__81887 = cube.cube.n * Math.random() - cube.cube.n2;
  var z__81888 = cube.cube.n * Math.random() - cube.cube.n2;
  var ax__81889 = cube.cube.d * Math.random() - cube.cube.d2;
  var ay__81890 = cube.cube.d * Math.random() - cube.cube.d2;
  var az__81891 = cube.cube.d * Math.random() - cube.cube.d2;
  var bx__81892 = cube.cube.d * Math.random() - cube.cube.d2;
  var by__81893 = cube.cube.d * Math.random() - cube.cube.d2;
  var bz__81894 = cube.cube.d * Math.random() - cube.cube.d2;
  var cx__81895 = cube.cube.d * Math.random() - cube.cube.d2;
  var cy__81896 = cube.cube.d * Math.random() - cube.cube.d2;
  var cz__81897 = cube.cube.d * Math.random() - cube.cube.d2;
  var pa__81898 = new THREE.Vector3(ax__81889, ay__81890, az__81891);
  var pb__81899 = new THREE.Vector3(bx__81892, by__81893, bz__81894);
  var pc__81900 = new THREE.Vector3(cx__81895, cy__81896, cz__81897);
  var a__GT_b__81901 = new THREE.Vector3;
  var c__GT_b__81902 = new THREE.Vector3;
  a__GT_b__81901.subVectors(pa__81898, pb__81899);
  c__GT_b__81902.subVectors(pc__81900, pb__81899);
  c__GT_b__81902.normalize();
  var nx__81903 = c__GT_b__81902.x;
  var ny__81904 = c__GT_b__81902.y;
  var nz__81905 = c__GT_b__81902.z;
  var vx__81906 = 0.5 + x__81886 / cube.cube.n;
  var vy__81907 = 0.5 + y__81887 / cube.cube.n;
  var vz__81908 = 0.5 + z__81888 / cube.cube.n;
  var c__81909 = new THREE.Color(vx__81906, vy__81907, vz__81908);
  return cljs.core.ObjMap.fromObject(["position", "normal", "color"], {"position":cljs.core.PersistentVector.fromArray([ax__81889, ay__81890, az__81891, bx__81892, by__81893, bz__81894, cx__81895, cy__81896, cz__81897], true), "normal":cljs.core.PersistentVector.fromArray([nx__81903, ny__81904, nz__81905, nx__81903, ny__81904, nz__81905, nx__81903, ny__81904, nz__81905], true), "color":cljs.core.PersistentVector.fromArray([c__81909.r, c__81909.g, c__81909.b, c__81909.r, c__81909.g, c__81909.b, c__81909.r, 
  c__81909.g, c__81909.b], true)})
};
cube.cube.make_indecies = function make_indecies() {
  var len__81911 = cube.cube.triangles * 3;
  return cljs.core.map.call(null, function(p1__81861_SHARP_) {
    return p1__81861_SHARP_ % (3 * cube.cube.chunk_size)
  }, cljs.core.range.call(null, 0, len__81911))
};
cube.cube.make_attr = function make_attr() {
  return function(m) {
    return cljs.core.ObjMap.fromObject(["index", "position", "normal", "color"], {"index":cljs.core.ObjMap.fromObject(["itemSize", "numItems", "array"], {"itemSize":3, "numItems":cube.cube.triangles * 3, "array":new Uint16Array(cljs.core.apply.call(null, cljs.core.array, cube.cube.make_indecies.call(null)))}), "position":cljs.core.ObjMap.fromObject(["itemSize", "numItems", "array"], {"itemSize":3, "numItems":cube.cube.triangles * 3 * 3, "array":new Float32Array(cljs.core.apply.call(null, cljs.core.array, 
    cljs.core._lookup.call(null, m, "position", null)))}), "normal":cljs.core.ObjMap.fromObject(["itemSize", "numItems", "array"], {"itemSize":3, "numItems":cube.cube.triangles * 3 * 3, "array":new Float32Array(cljs.core.apply.call(null, cljs.core.array, cljs.core._lookup.call(null, m, "normal", null)))}), "color":cljs.core.ObjMap.fromObject(["itemSize", "numItems", "array"], {"itemSize":3, "numItems":cube.cube.triangles * 3 * 3, "array":new Float32Array(cljs.core.apply.call(null, cljs.core.array, 
    cljs.core._lookup.call(null, m, "color", null)))})})
  }.call(null, cljs.core.reduce.call(null, function(a, b) {
    return cljs.core.ObjMap.fromObject(["position", "normal", "color"], {"position":cljs.core.concat.call(null, cljs.core._lookup.call(null, a, "position", null), cljs.core._lookup.call(null, b, "position", null)), "normal":cljs.core.concat.call(null, cljs.core._lookup.call(null, a, "normal", null), cljs.core._lookup.call(null, b, "normal", null)), "color":cljs.core.concat.call(null, cljs.core._lookup.call(null, a, "color", null), cljs.core._lookup.call(null, b, "color", null))})
  }, cljs.core.map.call(null, function(_) {
    return cube.cube.make_random_triangle.call(null)
  }, cljs.core.range.call(null, 0, 10))))
};
cube.cube.make_offsets = function make_offsets() {
  return cljs.core.map.call(null, function(n) {
    return cljs.core.ObjMap.fromObject(["start", "index", "count"], {"start":n * 3 * cube.cube.chunk_size, "index":n * 3 * cube.cube.chunk_size, "count":3 * Math.min(cube.cube.chunk_size, cube.cube.triangles - n * cube.cube.chunk_size)})
  }, cljs.core.range.call(null, 0, cube.cube.triangles / cube.cube.chunk_size))
};
cube.cube.geometry = function() {
  var g__81912 = new THREE.BufferGeometry;
  g__81912.attributes = cube.cube.clj__GT_js.call(null, cube.cube.make_attr.call(null));
  g__81912.offset = cube.cube.clj__GT_js.call(null, cube.cube.make_offsets);
  g__81912.computeBoundingSphere();
  return g__81912
}();
cube.cube.scene = function() {
  var s__81913 = new THREE.Scene;
  s__81913.fog = new THREE.Fog(328965, 2E3, 3500);
  s__81913.add(cube.cube.light1);
  s__81913.add(cube.cube.light2);
  s__81913.add(cube.cube.mesh);
  s__81913.add(new THREE.AmbientLight(4473924));
  return s__81913
}();
cube.cube.renderer = function() {
  var r__81914 = new THREE.WebGLRenderer(cube.cube.clj__GT_js.call(null, cljs.core.ObjMap.fromObject(["antialias", "clearColor", "clearAlpha", "alpha"], {"antialias":false, "clearColor":3355443, "clearAlpha":1, "alpha":false})));
  r__81914.setSize(window.innerWidth, window.innerHeight);
  r__81914.setClearColor(cube.cube.scene.fog.color, 1);
  r__81914.gammaInput = true;
  r__81914.gammaOutput = true;
  r__81914.physicallyBasedShading = true;
  return r__81914
}();
cube.cube.material = new THREE.MeshPhongMaterial(cube.cube.clj__GT_js.call(null, cljs.core.ObjMap.fromObject(["color", "ambient", "specular", "shininess", "side", "vertexColors"], {"color":11184810, "ambient":11184810, "specular":16777215, "shininess":250, "side":THREE.DoubleSide, "vertexColors":THREE.VertexColors})));
cube.cube.mesh = new THREE.Mesh(cube.cube.geometry, cube.cube.material);
cube.cube.container = function() {
  var c__81915 = document.getElementById("container");
  c__81915.appendChild(cube.cube.renderer.domElement);
  return c__81915
}();
cube.cube.render = function render() {
  var time__81917 = 0.001 * Date.now.call(null);
  return null
};
cube.cube.onWindowResize = function onWindowResize() {
  cube.cube.camera.aspect = cube.cube.calc_aspect.call(null);
  cube.cube.camera.updateProjectionMatrix();
  return cube.cube.renderer.setSize(window.innerWidth, window.innerHeight)
};
cube.cube.animate = function animate() {
  window.requestAnimationFrame.call(null, animate);
  return cube.cube.render.call(null)
};
cube.cube.main = function main() {
  cube.cube.animate.call(null);
  return document.write("<p>Hello, ClojureScript Compiler!</p>")
};
goog.exportSymbol("cube.cube.main", cube.cube.main);
