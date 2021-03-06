## test
```
offsetPoint.x > 0 && 0 === offsetPoint.y ? a = 0 : 0 === offsetPoint.x && offsetPoint.y < 0 ? a = 270 : offsetPoint.x < 0 && 0 === offsetPoint.y ? a = 180 : offsetPoint.x < 0 && offsetPoint.y < 0 ? a = 180 + r : offsetPoint.x < 0 && offsetPoint.y > 0 ? a = 180 - r : offsetPoint.x > 0 && offsetPoint.y > 0 ? a = r : offsetPoint.x > 0 && offsetPoint.y < 0 && (a = 360 - r)

offsetPoint.x > 0 && offsetPoint.y < 0 && (a = 360 - r);

var c=a>b?1:e>f?2:3

a>b?c=1:e>f?g=2:h>i?j=4:k=5
var v1=a>b?c=1:e>f?g=2:h>i?j=4:k=5

var a = 1;
var b = 2;
if (a++, b++, a < b) {
    console.log('a<b')
}

function test(){
  return a=1,b=2,c
}

a++, b++, a>1 && c++;
return a>b?1:2

function test(a){
  return a>1?'a':'b'
}
function test(a){
  return a>1?c>d?'e':'f':'b'
}

!(0 >= b[c] || b[c] > originTotalPageCount || (this.pageArray[b[c]] && this.fillContent(b[c]), this.pageArray[b[c]]))
```

# JStillery
 https://github.com/mindedsecurity/JStillery
 
Advanced JS Deobfuscation via Partial Evaluation.


See http://blog.mindedsecurity.com/2015/10/advanced-js-deobfuscation-via-ast-and.html 

# REPL

https://mindedsecurity.github.io/jstillery/

# Install

```
npm install
```

# Usage

## Cli

Deobfuscate file:
```
 ./jstillery_cli.js filename
```
Deobfuscate from stdin
```
echo 'a= String.fromCharCode(41);b=a'|  ./jstillery_cli.js
```

## Server

Build server code:
```
npm run build_server 

```

If you wish change ```server/config_server.json```
Then launch the server:
```
npm run start_server
```

Visit http://0:3001/

## RESTServer
Launch server then:
```
$ curl 'http://localhost:3001/deobfuscate' -d '{"source":"a=1"}' -H 'Content-type: application/json' 
{"source":"a = 1;"}
```
## Web UI

Add obfuscated code to the upper text area and press CTRL-ENTER.
![image](https://user-images.githubusercontent.com/1196560/35220393-836aafd0-ff76-11e7-8ba9-86369e23573a.png?s=200)



# LICENSE

GPL 3.0

# Contribute

Feel free to contribute in any way!
