'use strict';

var fs = require( 'fs' );
var path = require( 'path' );

var pwd = process.env.PWD || __dirname;

var dump_file = __dirname + '/data/svwiktionary-latest-all-titles-in-ns0';
var common_words_file = __dirname + '/output/common-words/all.json';
var output_file_json = __dirname + '/output/common-words/nonexisting.json';
var output_file_wikitext = __dirname + '/output/common-words/nonexisting.wikitext';

var Article_list_reader = require( './lib/wikimedia-article-list-reader' ).Article_list_reader;

var common_words = read_and_parse_common_words( common_words_file );

var stream = new Article_list_reader( dump_file );

process.nextTick( function () {
	stream.stream();
} )

function read_and_parse_common_words( common_words_file ) {
	var common_words_arr = JSON.parse( fs.readFileSync( common_words_file, 'utf-8' ) );
	console.log( 'Read %d words from %s',
		common_words_arr.length,
		path.relative( pwd, common_words_file ) );
	var common_words = Object.create( null );

	common_words_arr.forEach( function ( word ) {
		if ( word[0] === 'konstruktivism' ) {
			console.log( 'found konstruktivism' );
		}

		common_words[ word[0].toLowerCase() ] = word;
	} )

	return common_words;
}

function write_common_words( output_file_json, output_file_wikitext, common_words ) {
	var i,
		common_words_arr = [];
	for ( i in common_words ) {
		if ( common_words[i] ) {
			common_words_arr.push( common_words[i] );
		}			
	}

	console.log( 'Write ' + common_words_arr.length + ' words to...' );

	fs.writeFileSync( output_file_json, JSON.stringify( common_words_arr ), 'utf-8' );
	console.log( '  ' + path.relative( pwd, output_file_json ) );

	fs.writeFileSync( output_file_wikitext, ( function ( words ) {
		words = words.map( function ( word ) {
			return '*[[' + word[0] + ']] (' + word[1] + ')';
		} );

		var quarter = Math.ceil( words.length / 4 ),
			cols = [];
		for ( i = 0; i < 4; i++ ) {
			cols[i] = words.slice( i*quarter, (i+1)*quarter ).join( '\n' );
		}
		return '{{topp}}\n' + cols.join( '\n{{mitt4}}\n' ) + '\n{{botten}}\n';
	}( common_words_arr ) ) );
	console.log( '  ' + path.relative( pwd, output_file_wikitext ) );
}

var stop = 'konstruktivism retronym‎'.split( ' ' );
stop = [];

stream.onpage = function ( page ) {
	if ( stop.indexOf( page ) !== -1 ) {
		console.log( '  got ' + page + ' exists=' + (!!common_words[page]) );
		// stream.stop();
	}

	var page_lc = page.toLowerCase();
	if ( common_words[page_lc] ) {
		common_words[page_lc] = undefined;
	}
};

stream.onend = function () {
	write_common_words( output_file_json, output_file_wikitext, common_words );
};
