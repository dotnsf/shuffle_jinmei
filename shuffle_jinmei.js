//. shuffle_jinmei.js
var fs = require( 'fs' );
var MeCab = require( 'mecab-async' );

var mecab = new MeCab();
//mecab.command = 'mecab -d /usr/local/lib/mecab/dic/ipadic';  //. for soruce installed mecab & ipadic
mecab.command = 'mecab -d /var/lib/mecab/dic/ipadic-utf8';     //. for apt installed mecab & ipadic-utf8

var name = process.argv.length > 2 ? process.argv[2] : '';
if( name ){
  var outfile = name + '.txt';
  var orders = makeCombination( name.length );
  var arr = string2array( name );

  writeFile( outfile, '' );
  console.log( '#: ' + orders.length );
  var ts1 = ( new Date() ).getTime();
  check( orders, arr ).then( function(){
    var ts2 = ( new Date() ).getTime();
    var ms = ts2 - ts1;
    console.log( 'check finished. ( ' + ms + 'ms)' );
  });
}else{
  console.log( 'Usage: $ node shuffle_jinmei (ひらがなでのなまえ)' );
}


//. [0, 1, .., n-1] を並び替えてできる全組み合わせを求める
function makeCombination( n ){
  //console.log( 'n = ' + n );
  var newCombination = [];
  if( n == 1 ){
    newCombination.push( [0] );
  }else{
    var prevCombination = makeCombination( n - 1 );
    for( var i = 0; i < prevCombination.length; i ++ ){
      for( var j = 0; j <= prevCombination[i].length; j ++ ){
        var copied = prevCombination[i].concat();
        copied.splice( j, 0, n - 1 );
        newCombination.push( copied );
      }
    }
  }

  return newCombination;
}

//. 文字列を１文字ずつの配列に変換
function string2array( str ){
  var arr = [];
  for( var i = 0; i < str.length; i ++ ){
    var c = str.charAt( i );
    arr.push( c );
  }

  return arr;
}

async function check( orders, arr ){
  return new Promise( async function( resolve, reject ){
    var olen = orders.length;
    for( var idx = 0; idx < olen; idx ++ ){
      console.log( ' idx = ' + ( idx + 1 ) + '/' + olen );
      var order = orders[idx];
      var c = arr[order[0]];
      if( [ 'ん', 'ぁ', 'ぃ', 'ぅ', 'ぇ', 'ぉ', 'ゃ', 'ゅ', 'ょ' ].indexOf( c ) == -1 ){
        var s = '';
        for( var i = 0; i < order.length; i ++ ){
          s += arr[order[i]];
        }

        var morphs = await text2morphs( s );
        if( morphs.length ){
          //appendFile( outfile, ' -> ' + s );
          appendFile( outfile, JSON.stringify( morphs, null, 2 ) );
        }
      }
    }

    resolve( true );
  });
}

async function text2morphs( text ){
  return new Promise( function( resolve, reject ){
    var timeoutId = setTimeout( function(){
      killParse();
    }, 1000 );

    mecab.parseFormat( text, function( err, morphs ){
      if( err ){
        //reject( err );
        console.log( err );
        resolve( [] );
      }else{
        var results = [];
        var len = 0;
        var max_len = 0;
        morphs.forEach( function( morph ){
          //. morph = { kanji: "おはよう", lexical: "感動詞", compound: "*", compound2: "*", compound3: "*", conjugation: "*", inflection: "*", original: "おはよう", "reading": "オハヨウ", pronounciation: "オハヨー" }
          if( morph.lexical.endsWith( '詞' ) && morph.kanji == morph.original ){
            //if( len > 0 || [ '助詞', '助動詞', '接頭詞' ].indexOf( morph.lexical ) == -1 ){
            if( len > 0 || morph.lexical == '名詞' ){
              if( morph.kanji.length > max_len ){ max_len = morph.kanji.length; }
              len += morph.kanji.length;
              results.push( { kanji: morph.kanji, original: morph.original, lexical: morph.lexical } );
            }
          }
        });

        if( text.length == len && max_len > 2 ){
          resolve( results );
        }else{
          resolve( [] );
        }
      }
    });

    function killParse(){
      clearTimeout( timeoutId );
      resolve( [] );
    }
  });
}

function writeFile( path, line ){
  fs.writeFile( path, line + '\n', function( err ){} );
}

function appendFile( path, line ){
  fs.appendFile( path, line + '\n', function( err ){} );
}
