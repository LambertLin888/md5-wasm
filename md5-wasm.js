/*!
 * MD5 WebAssembly
 * https://github.com/briantbutton/md5-wasm
 * (c) 2020 Brian Todd Button
 * Released under the MIT license
 */


// *-*=*  *=*-* *-*=*  *=*-* *-*=*  *=*-* *-*=*  *=*-* *-*=*  *=*-* *-*=*  *=*-*
// This is two functions designed to achieve the same thing
// A highly tuned WebAssembly function for larger files 
// A JavaScript function for the others
// 

(function() {

  const md5JS           = makeMD5JS(),
        md5WA           = makeMD5WA(),
        atob            = require("atob"),
        crypt           = makeCrypt(),
        biteSize        = 240*16*16,
        bounder         = Math.floor(biteSize*16*1.066606667),
        returnObj       = {};
  const wasmB64         = "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";
  var   js              = false,
        onResult        = false,
        onError         = false;
  var   buff,mem,memView,importObj,wasm,js=false,thenFun,catchFun;
  var   loops,loop,loopA,loopB,loopC,loopD,getA,getB,getC,getD,getX,setA,setB,setC,setD,setX,loopA1;
  returnObj["then"]     = function(fun){thenFun=fun;getThen();return returnObj};
  returnObj["catch"]    = function(fun){catchFun=fun;getCatch();return returnObj};

  if ( typeof module === 'object' && module.exports ) {
    module.exports      = md5;
  }
  if ( typeof define === 'function' && define.amd ) {
    define ( 'md5' , [], function() { return md5 } )
  }

  return md5;

  function md5(data){
    var md5String       = false;
    if ( typeof Buffer === "function" ) {
      if ( data && typeof data === "object" ) {
        if ( data.constructor !== Buffer ) {
          if ( data.constructor === Uint8Array ) {
            buff        = Buffer.from(data);
          }
        }else{
          buff          = data;
        }
      }

      if ( buff && typeof buff === "object" && buff.constructor === Buffer ) {
        if ( WebAssembly && !js && buff.length > bounder ) {
          mem           = new WebAssembly.Memory({initial:(buff.length>32000000?buff.length>64000000?2048:1024:512)});
          mem           = new WebAssembly.Memory({initial:1024});
          memView       = new Uint32Array(mem.buffer);
          importObj     = {imports:{}};
          importObj.imports.mem  = mem;
          importObj.imports.log  = console.log;
          WebAssembly.instantiate(str2ab(atob(wasmB64)).buffer,importObj).then(giterdone)
        }else{
          md5String     = md5JS(buff);
          getThen(md5String)
        }
      }
    }
    return returnObj
  }

  function giterdone(obj){
    var md5String       = false;
    wasm                = obj;
    loops               = obj.instance.exports.loops;
    loop                = obj.instance.exports.loop;
    loopA               = obj.instance.exports.loopA;
    loopA1              = obj.instance.exports.loopA1;
    loopB               = obj.instance.exports.loopB;
    loopC               = obj.instance.exports.loopC;
    loopD               = obj.instance.exports.loopD;
    getA                = obj.instance.exports.getA;
    getB                = obj.instance.exports.getB;
    getC                = obj.instance.exports.getC;
    getD                = obj.instance.exports.getD;
    getX                = obj.instance.exports.getX;
    setA                = obj.instance.exports.setA;
    setB                = obj.instance.exports.setB;
    setC                = obj.instance.exports.setC;
    setD                = obj.instance.exports.setD;
    setX                = obj.instance.exports.setX;
    md5String     = md5WA(buff);
    getThen(md5String)
  }

  function makeMD5WA(){

    var md5WA           = function (message, options) {
      var m00,m01,m02,m03,m04,m05,m06,m07,m08,m09,m10,m11,m12,m13,m14,m15,aa,bb,cc,dd,m,k;
      var qwerty        = new Date().getTime();
      var md5Used       = 0;
      var legacy        = false;

      // console.log("md5 start");

      var a             =  1732584193,
          b             = -271733879,
          c             = -1732584194,
          d             =  271733878,
          i             =  0,
          l             = message.length*8,len;

      if(legacy){
        m               = crypt.bytesToWords(message);
        for (var j = 0; j < m.length; j++) {
          m[j]          = ((m[j] <<  8) | (m[j] >>> 24)) & 0x00FF00FF | ((m[j] << 24) | (m[j] >>>  8)) & 0xFF00FF00;
        }
        // console.log("m.length = "+(m.length));
        m[l >>> 5]     |= 0x80 << (l % 32);
        m[(((l + 64) >>> 9) << 4) + 14] = l;
        len             = m.length;
      }else{
        len             = bytesToWordsNewer(message,memView);
        memView[l >>> 5] |= 0x80 << (l % 32);
        memView[(((l + 64) >>> 9) << 4) + 14] = l;
        len             = (((l + 64) >>> 9) << 4) + 15;
        m               = memView
      }

      // console.log("first loop took "+((new Date().getTime())-qwerty)+"ms");

      while ( i < len ) {
        if(!legacy&&len>i+bounder){
          setA(a);
          setB(b);
          setC(c);
          setD(d);
          loops(biteSize);
          i             = i + biteSize*16;
          a             = getA();
          b             = getB();
          c             = getC();
          d             = getD();
          md5Used++ 
        }else{
          aa            = a;
          bb            = b;
          cc            = c;
          dd            = d;
          m00           =  m[i+ 0] >>> 0;
          m01           =  m[i+ 1] >>> 0;
          m02           =  m[i+ 2] >>> 0;
          m03           =  m[i+ 3] >>> 0;
          m04           =  m[i+ 4] >>> 0;
          m05           =  m[i+ 5] >>> 0;
          m06           =  m[i+ 6] >>> 0;
          m07           =  m[i+ 7] >>> 0;
          m08           =  m[i+ 8] >>> 0;
          m09           =  m[i+ 9] >>> 0;
          m10           =  m[i+10] >>> 0;
          m11           =  m[i+11] >>> 0;
          m12           =  m[i+12] >>> 0;
          m13           =  m[i+13] >>> 0;
          m14           =  m[i+14] >>> 0;
          m15           =  m[i+15] >>> 0;

          a             = ____( 7, 25, a + ( b & c | ~b & d ) + m00 - 680876936) + b ;
          d             = ____(12, 20, d + ( a & b | ~a & c ) + m01 - 389564586) + a ;
          c             = ____(17, 15, c + ( d & a | ~d & b ) + m02 + 606105819) + d ;
          b             = ____(22, 10, b + ( c & d | ~c & a ) + m03 - 1044525330) + c ;
          a             = ____( 7, 25, a + ( b & c | ~b & d ) + m04 - 176418897) + b ;
          d             = ____(12, 20, d + ( a & b | ~a & c ) + m05 + 1200080426) + a ;
          c             = ____(17, 15, c + ( d & a | ~d & b ) + m06 - 1473231341) + d ;
          b             = ____(22, 10, b + ( c & d | ~c & a ) + m07 - 45705983) + c ;
          a             = ____( 7, 25, a + ( b & c | ~b & d ) + m08 + 1770035416) + b ;
          d             = ____(12, 20, d + ( a & b | ~a & c ) + m09 - 1958414417) + a ;
          c             = ____(17, 15, c + ( d & a | ~d & b ) + m10 - 42063) + d ;
          b             = ____(22, 10, b + ( c & d | ~c & a ) + m11 - 1990404162) + c ;
          a             = ____( 7, 25, a + ( b & c | ~b & d ) + m12 + 1804603682) + b ;
          d             = ____(12, 20, d + ( a & b | ~a & c ) + m13 - 40341101) + a ;
          c             = ____(17, 15, c + ( d & a | ~d & b ) + m14 - 1502002290) + d ;
          b             = ____(22, 10, b + ( c & d | ~c & a ) + m15 + 1236535329) + c ;

          a             = ____( 5, 27, a + ( b & d | c & ~d ) + m01 - 165796510) + b ;
          d             = ____( 9, 23, d + ( a & c | b & ~c ) + m06 - 1069501632) + a ;
          c             = ____(14, 18, c + ( d & b | a & ~b ) + m11 + 643717713) + d ;
          b             = ____(20, 12, b + ( c & a | d & ~a ) + m00 - 373897302) + c ;
          a             = ____( 5, 27, a + ( b & d | c & ~d ) + m05 - 701558691) + b ;
          d             = ____( 9, 23, d + ( a & c | b & ~c ) + m10 + 38016083) + a ;
          c             = ____(14, 18, c + ( d & b | a & ~b ) + m15 - 660478335) + d ;
          b             = ____(20, 12, b + ( c & a | d & ~a ) + m04 - 405537848) + c ;
          a             = ____( 5, 27, a + ( b & d | c & ~d ) + m09 + 568446438) + b ;
          d             = ____( 9, 23, d + ( a & c | b & ~c ) + m14 - 1019803690) + a ;
          c             = ____(14, 18, c + ( d & b | a & ~b ) + m03 - 187363961) + d ;
          b             = ____(20, 12, b + ( c & a | d & ~a ) + m08 + 1163531501) + c ;
          a             = ____( 5, 27, a + ( b & d | c & ~d ) + m13 - 1444681467) + b ;
          d             = ____( 9, 23, d + ( a & c | b & ~c ) + m02 - 51403784) + a ;
          c             = ____(14, 18, c + ( d & b | a & ~b ) + m07 + 1735328473) + d ;
          b             = ____(20, 12, b + ( c & a | d & ~a ) + m12 - 1926607734) + c ;

          a             = ____( 4, 28, a + (b ^ c ^ d) + m05 - 378558) + b ;
          d             = ____(11, 21, d + (a ^ b ^ c) + m08 - 2022574463) + a ;
          c             = ____(16, 16, c + (d ^ a ^ b) + m11 + 1839030562) + d ;
          b             = ____(23,  9, b + (c ^ d ^ a) + m14 - 35309556) + c ;
          a             = ____( 4, 28, a + (b ^ c ^ d) + m01 - 1530992060) + b ;
          d             = ____(11, 21, d + (a ^ b ^ c) + m04 + 1272893353) + a ;
          c             = ____(16, 16, c + (d ^ a ^ b) + m07 - 155497632) + d ;
          b             = ____(23,  9, b + (c ^ d ^ a) + m10 - 1094730640) + c ;
          a             = ____( 4, 28, a + (b ^ c ^ d) + m13 + 681279174) + b ;
          d             = ____(11, 21, d + (a ^ b ^ c) + m00 - 358537222) + a ;
          c             = ____(16, 16, c + (d ^ a ^ b) + m03 - 722521979) + d ;
          b             = ____(23,  9, b + (c ^ d ^ a) + m06 + 76029189) + c ;
          a             = ____( 4, 28, a + (b ^ c ^ d) + m09 - 640364487) + b ;
          d             = ____(11, 21, d + (a ^ b ^ c) + m12 - 421815835) + a ;
          c             = ____(16, 16, c + (d ^ a ^ b) + m15 + 530742520) + d ;
          b             = ____(23,  9, b + (c ^ d ^ a) + m02 - 995338651) + c ;

          a             = ____( 6, 26, a + (c ^ (b | ~d)) + m00 - 198630844) + b ;
          d             = ____(10, 22, d + (b ^ (a | ~c)) + m07 + 1126891415) + a ;
          c             = ____(15, 17, c + (a ^ (d | ~b)) + m14 - 1416354905) + d ;
          b             = ____(21, 11, b + (d ^ (c | ~a)) + m05 - 57434055) + c ;
          a             = ____( 6, 26, a + (c ^ (b | ~d)) + m12 + 1700485571) + b ;
          d             = ____(10, 22, d + (b ^ (a | ~c)) + m03 - 1894986606) + a ;
          c             = ____(15, 17, c + (a ^ (d | ~b)) + m10 - 1051523) + d ;
          b             = ____(21, 11, b + (d ^ (c | ~a)) + m01 - 2054922799) + c ;
          a             = ____( 6, 26, a + (c ^ (b | ~d)) + m08 + 1873313359) + b ;
          d             = ____(10, 22, d + (b ^ (a | ~c)) + m15 - 30611744) + a ;
          c             = ____(15, 17, c + (a ^ (d | ~b)) + m06 - 1560198380) + d ;
          b             = ____(21, 11, b + (d ^ (c | ~a)) + m13 + 1309151649) + c ;
          a             = ____( 6, 26, a + (c ^ (b | ~d)) + m04 - 145523070) + b ;
          d             = ____(10, 22, d + (b ^ (a | ~c)) + m11 - 1120210379) + a ;
          c             = ____(15, 17, c + (a ^ (d | ~b)) + m02 + 718787259) + d ;
          b             = ____(21, 11, b + (d ^ (c | ~a)) + m09 - 343485551) + c ;

          i             = i + 16;
          a = (a + aa) >>> 0;
          b = (b + bb) >>> 0;
          c = (c + cc) >>> 0;
          d = (d + dd) >>> 0;
        }
      }

      // console.log("md5WA, elapsed="+((new Date().getTime())-qwerty)+(md5Used?", WebAssembly called "+md5Used+" times":", WebAssembly not called"));

      return crypt.endian([a, b, c, d]);

      function ____(s,t,n){ return ( ( n << s ) | ( n >>> t ) ) }

      // Convert a byte array to big-endian 32-bit words
      function bytesToWordsNewer(bytes,words) {
        var i           = -1,
            l           = Math.floor((bytes.length-1)/4),
            j           = 0,b0,b1,b2,b3;
        while(l-8>i++){
          j             = i<<2;
          words[i]      = (bytes[j+0]) | (bytes[j+1]<<8) | (bytes[j+2]<<16) | (bytes[j+3]<<24)
        }
        i--;
        while(l>i++){
          j             = i<<2;
          b0            = typeof bytes[j+0] === "undefined" ? 0 : bytes[j+0];
          b1            = typeof bytes[j+1] === "undefined" ? 0 : bytes[j+1];
          b2            = typeof bytes[j+2] === "undefined" ? 0 : bytes[j+2];
          b3            = typeof bytes[j+3] === "undefined" ? 0 : bytes[j+3];
          words[i]      = b0 | b1<<8 | b2<<16 | b3<<24
        }
        return l+1;
      }
    };

    return function (message, options) {
      if (message === undefined || message === null)
        throw new Error('Illegal argument ' + message);

      var digestbytes   = crypt.wordsToBytes(md5WA(message, options)),
          result        = options&&options.asBytes ?
                               digestbytes
                              :crypt.bytesToHex(digestbytes);
      return result
    }
  }

  function makeMD5JS(){

    var md5JS         = function (message, options) {
      var m00,m01,m02,m03,m04,m05,m06,m07,m08,m09,m10,m11,m12,m13,m14,m15,aa,bb,cc,dd,m;
      var qwerty      = new Date().getTime();

      // console.log("md5 start");

      var a           =  1732584193,
          b           = -271733879,
          c           = -1732584194,
          d           =  271733878,
          l           = message.length * 8;

      m               = crypt.bytesToWords(message);

      // Swap endian
      for (var j = 0; j < m.length; j++) {
        m[j] = ((m[j] <<  8) | (m[j] >>> 24)) & 0x00FF00FF | ((m[j] << 24) | (m[j] >>>  8)) & 0xFF00FF00;
      }

      // Padding
      m[l >>> 5] |= 0x80 << (l % 32);
      m[(((l + 64) >>> 9) << 4) + 14] = l;

      for (var i = 0; i < m.length ; i += 16) {
        aa            = a;
        bb            = b;
        cc            = c;
        dd            = d;
        m00           = m[i+ 0] >>> 0;
        m01           = m[i+ 1] >>> 0;
        m02           = m[i+ 2] >>> 0;
        m03           = m[i+ 3] >>> 0;
        m04           = m[i+ 4] >>> 0;
        m05           = m[i+ 5] >>> 0;
        m06           = m[i+ 6] >>> 0;
        m07           = m[i+ 7] >>> 0;
        m08           = m[i+ 8] >>> 0;
        m09           = m[i+ 9] >>> 0;
        m10           = m[i+10] >>> 0;
        m11           = m[i+11] >>> 0;
        m12           = m[i+12] >>> 0;
        m13           = m[i+13] >>> 0;
        m14           = m[i+14] >>> 0;
        m15           = m[i+15] >>> 0;

        a             = ____( 7, 25, a + ( b & c | ~b & d ) + m00 - 680876936) + b ;
        d             = ____(12, 20, d + ( a & b | ~a & c ) + m01 - 389564586) + a ;
        c             = ____(17, 15, c + ( d & a | ~d & b ) + m02 + 606105819) + d ;
        b             = ____(22, 10, b + ( c & d | ~c & a ) + m03 - 1044525330) + c ;
        a             = ____( 7, 25, a + ( b & c | ~b & d ) + m04 - 176418897) + b ;
        d             = ____(12, 20, d + ( a & b | ~a & c ) + m05 + 1200080426) + a ;
        c             = ____(17, 15, c + ( d & a | ~d & b ) + m06 - 1473231341) + d ;
        b             = ____(22, 10, b + ( c & d | ~c & a ) + m07 - 45705983) + c ;
        a             = ____( 7, 25, a + ( b & c | ~b & d ) + m08 + 1770035416) + b ;
        d             = ____(12, 20, d + ( a & b | ~a & c ) + m09 - 1958414417) + a ;
        c             = ____(17, 15, c + ( d & a | ~d & b ) + m10 - 42063) + d ;
        b             = ____(22, 10, b + ( c & d | ~c & a ) + m11 - 1990404162) + c ;
        a             = ____( 7, 25, a + ( b & c | ~b & d ) + m12 + 1804603682) + b ;
        d             = ____(12, 20, d + ( a & b | ~a & c ) + m13 - 40341101) + a ;
        c             = ____(17, 15, c + ( d & a | ~d & b ) + m14 - 1502002290) + d ;
        b             = ____(22, 10, b + ( c & d | ~c & a ) + m15 + 1236535329) + c ;

        a             = ____( 5, 27, a + ( b & d | c & ~d ) + m01 - 165796510) + b ;
        d             = ____( 9, 23, d + ( a & c | b & ~c ) + m06 - 1069501632) + a ;
        c             = ____(14, 18, c + ( d & b | a & ~b ) + m11 + 643717713) + d ;
        b             = ____(20, 12, b + ( c & a | d & ~a ) + m00 - 373897302) + c ;
        a             = ____( 5, 27, a + ( b & d | c & ~d ) + m05 - 701558691) + b ;
        d             = ____( 9, 23, d + ( a & c | b & ~c ) + m10 + 38016083) + a ;
        c             = ____(14, 18, c + ( d & b | a & ~b ) + m15 - 660478335) + d ;
        b             = ____(20, 12, b + ( c & a | d & ~a ) + m04 - 405537848) + c ;
        a             = ____( 5, 27, a + ( b & d | c & ~d ) + m09 + 568446438) + b ;
        d             = ____( 9, 23, d + ( a & c | b & ~c ) + m14 - 1019803690) + a ;
        c             = ____(14, 18, c + ( d & b | a & ~b ) + m03 - 187363961) + d ;
        b             = ____(20, 12, b + ( c & a | d & ~a ) + m08 + 1163531501) + c ;
        a             = ____( 5, 27, a + ( b & d | c & ~d ) + m13 - 1444681467) + b ;
        d             = ____( 9, 23, d + ( a & c | b & ~c ) + m02 - 51403784) + a ;
        c             = ____(14, 18, c + ( d & b | a & ~b ) + m07 + 1735328473) + d ;
        b             = ____(20, 12, b + ( c & a | d & ~a ) + m12 - 1926607734) + c ;

        a             = ____( 4, 28, a + (b ^ c ^ d) + m05 - 378558) + b ;
        d             = ____(11, 21, d + (a ^ b ^ c) + m08 - 2022574463) + a ;
        c             = ____(16, 16, c + (d ^ a ^ b) + m11 + 1839030562) + d ;
        b             = ____(23,  9, b + (c ^ d ^ a) + m14 - 35309556) + c ;
        a             = ____( 4, 28, a + (b ^ c ^ d) + m01 - 1530992060) + b ;
        d             = ____(11, 21, d + (a ^ b ^ c) + m04 + 1272893353) + a ;
        c             = ____(16, 16, c + (d ^ a ^ b) + m07 - 155497632) + d ;
        b             = ____(23,  9, b + (c ^ d ^ a) + m10 - 1094730640) + c ;
        a             = ____( 4, 28, a + (b ^ c ^ d) + m13 + 681279174) + b ;
        d             = ____(11, 21, d + (a ^ b ^ c) + m00 - 358537222) + a ;
        c             = ____(16, 16, c + (d ^ a ^ b) + m03 - 722521979) + d ;
        b             = ____(23,  9, b + (c ^ d ^ a) + m06 + 76029189) + c ;
        a             = ____( 4, 28, a + (b ^ c ^ d) + m09 - 640364487) + b ;
        d             = ____(11, 21, d + (a ^ b ^ c) + m12 - 421815835) + a ;
        c             = ____(16, 16, c + (d ^ a ^ b) + m15 + 530742520) + d ;
        b             = ____(23,  9, b + (c ^ d ^ a) + m02 - 995338651) + c ;

        a             = ____( 6, 26, a + (c ^ (b | ~d)) + m00 - 198630844) + b ;
        d             = ____(10, 22, d + (b ^ (a | ~c)) + m07 + 1126891415) + a ;
        c             = ____(15, 17, c + (a ^ (d | ~b)) + m14 - 1416354905) + d ;
        b             = ____(21, 11, b + (d ^ (c | ~a)) + m05 - 57434055) + c ;
        a             = ____( 6, 26, a + (c ^ (b | ~d)) + m12 + 1700485571) + b ;
        d             = ____(10, 22, d + (b ^ (a | ~c)) + m03 - 1894986606) + a ;
        c             = ____(15, 17, c + (a ^ (d | ~b)) + m10 - 1051523) + d ;
        b             = ____(21, 11, b + (d ^ (c | ~a)) + m01 - 2054922799) + c ;
        a             = ____( 6, 26, a + (c ^ (b | ~d)) + m08 + 1873313359) + b ;
        d             = ____(10, 22, d + (b ^ (a | ~c)) + m15 - 30611744) + a ;
        c             = ____(15, 17, c + (a ^ (d | ~b)) + m06 - 1560198380) + d ;
        b             = ____(21, 11, b + (d ^ (c | ~a)) + m13 + 1309151649) + c ;
        a             = ____( 6, 26, a + (c ^ (b | ~d)) + m04 - 145523070) + b ;
        d             = ____(10, 22, d + (b ^ (a | ~c)) + m11 - 1120210379) + a ;
        c             = ____(15, 17, c + (a ^ (d | ~b)) + m02 + 718787259) + d ;
        b             = ____(21, 11, b + (d ^ (c | ~a)) + m09 - 343485551) + c ;

        a = (a + aa) >>> 0;
        b = (b + bb) >>> 0;
        c = (c + cc) >>> 0;
        d = (d + dd) >>> 0;
      }

      // console.log("md5JS, elapsed="+((new Date().getTime())-qwerty));

      return crypt.endian([a, b, c, d]);

      function ____(s,t,n){ return ( ( n << s ) | ( n >>> t ) ) }
    };

    return function (message, options) {
      if (message === undefined || message === null)
        throw new Error('Illegal argument ' + message);

      var digestbytes = crypt.wordsToBytes(md5JS(message, options)),
          result      = options&&options.asBytes ?
                             digestbytes
                            :crypt.bytesToHex(digestbytes);
      return result
    }
  }
  function str2ab(str) {
    var l,buff,buffView,i=-1;
    l                 = str.length-1;
    buff              = new ArrayBuffer(str.length);
    buffView          = new Uint8Array(buff);
    while(l>i++){
      buffView[i]     = str.charCodeAt(i)
    }
    return buffView
  }

  function makeCrypt() {
    var base64map  = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

    return {
      // Bit-wise rotation left
      rotl: function(n, b) {
        return (n << b) | (n >>> (32 - b));
      },

      // Bit-wise rotation right
      rotr: function(n, b) {
        return (n << (32 - b)) | (n >>> b);
      },

      // Swap big-endian to little-endian and vice versa
      endian: function(n) {
        // If number given, swap endian
        if (n.constructor == Number) {
          return crypt.rotl(n, 8) & 0x00FF00FF | crypt.rotl(n, 24) & 0xFF00FF00;
        }

        // Else, assume array and swap all items
        for (var i = 0; i < n.length; i++)
          n[i] = crypt.endian(n[i]);
        return n;
      },

      // Convert a byte array to big-endian 32-bit words
      bytesToWords: function(bytes) {
        for (var words = [], i = 0, b = 0; i < bytes.length; i++, b += 8)
          words[b >>> 5] |= bytes[i] << (24 - b % 32);
        return words;
      },

      // Convert big-endian 32-bit words to a byte array
      wordsToBytes: function(words) {
        for (var bytes = [], b = 0; b < words.length * 32; b += 8)
          bytes.push((words[b >>> 5] >>> (24 - b % 32)) & 0xFF);
        return bytes;
      },

      // Convert a byte array to a hex string
      bytesToHex: function(bytes) {
        for (var hex = [], i = 0; i < bytes.length; i++) {
          hex.push((bytes[i] >>> 4).toString(16));
          hex.push((bytes[i] & 0xF).toString(16));
        }
        return hex.join('');
      },

      // Convert a hex string to a byte array
      hexToBytes: function(hex) {
        for (var bytes = [], c = 0; c < hex.length; c += 2)
          bytes.push(parseInt(hex.substr(c, 2), 16));
        return bytes;
      }
    }
  }
  function getThen(res){
    if(res){onResult=res}
    if(onResult){
      if ( thenFun && typeof thenFun === "function" ) {
        thenFun(onResult);
        onResult        = false;
      }
    }
  }
  function getCatch(err){
    if(err){onError=err}
    if(onError){
      if ( catchFun && typeof catchFun === "function" ) {
        catchFun(onError);
        onError         = false;
      }
    }
  }
})()
