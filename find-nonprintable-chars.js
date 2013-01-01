'use strict';

var fs = require( 'fs' );
var path = require( 'path' );
var util = require( 'util' );

var pwd = process.env.PWD || __dirname;

var wikitext_file = __dirname + '/output/find-nonprintable-chars/all.wikitext';
var json_file = __dirname + '/output/find-nonprintable-chars/all.json';

var Dump_reader = require( './lib/wikimedia-dump-reader.js' ).Dump_reader;
var mkdirSync_recursive = require( './lib/mkdir-recursive' ).mkdirSync_recursive;

var reader = new Dump_reader();

var non_printable_info = Object.create( null );
non_printable_info['\u00AD'] = 'No break space';
non_printable_info['\u200C'] = 'Zero-Width Non-Joiner (used in Arabic, Persian, Indic scripts)';
non_printable_info['\u200E'] = 'Left-to-Right Mark (should not be needed)';

// List of non-printable characters: https://en.wiktionary.org/wiki/Appendix:Control_characters
// see also: https://en.wiktionary.org/wiki/Appendix:Blank_characters
var non_printable = [
	// ## C0 set

	'\u0000-\u0008',
	// allow tab \u0009
	// allow line feed \u000A
	'\u000B-\u001F',
	// allow space \u0020

	'\u007F',


	// ## C1 set
	'\u0080-\u009F',


	// ## Unicode
	// allow non-breaking space for now
	// '\u00AD',

	// allow combining grapheme joiner \u034F
	// allow Syriac abbreviation mark \u070F
	// allow Mongolian vowel separator \u180E

	'\u200B',
	// allow Zero-Width Non-Joiner \u200C
	// allow Zero-Width Joine \u200D
	'\u200E-\u200F',

	'\u202A-\u202E',
	'\u2060-\u2064',

	'\u206A-\u206F',
	'\uFEFF',
	'\uFFF9-\uFFFB',
];
var rnon_printable = new RegExp( '[' + non_printable.join( '' ) + ']' );

var BOLD = '\u001B[1;34m';
var GREEN = '\u001B[22;32m';
var DEFAULT = '\u001B[0;37m';

var got = 0;
var MAX_PAGES = 200;

var results = [];
var results_wikitext = [];

reader.onpage = function ( page ) {
	if ( rnon_printable.test( page.title ) ) {
		console.log( 'TITLE contains!!  ' + page.title );
	}
	var text = page.text;

	var gotten_char_info, context_before, context_after;

	if ( rnon_printable.test( text ) ) {
		got++;
		var char = rnon_printable.exec( text );
		var char_code = '\\u' + ('000' + char[0].charCodeAt( 0 ).toString( 16 ).toUpperCase()).substr( -4 );
		var pos = char.index;
		char = char[0];

		gotten_char_info = non_printable_info[char] ? ' ' + non_printable_info[char] : '';

		context_before = encode_str( pos < 15 ? text.substr( 0, pos ) : '...' + text.substr( pos - 15, 15 ) );
		context_after = encode_str( text.length - pos < 15 ? text.substr( pos + 1 ) : text.substr( pos + 1, 15 ) + '...' );

		console.log( BOLD + page.title + DEFAULT );
		console.log( '  contains %s%s', GREEN + char_code + DEFAULT, gotten_char_info );
		console.log( '  context: %s%s%s',
			context_before,
			GREEN + char_code + DEFAULT,
			context_after
		);

		results.push( {
			title: page.title,
			char_code: char_code,
			char_code_info: gotten_char_info || null,
		} )
		results_wikitext.push( util.format(
			"* [[%s]] contains '''%s'''%s\n" +
			"** context: %s'''%s'''%s\n",
			page.title,
			char_code, gotten_char_info,
			context_before, char_code, context_after
		) );
	}
	if ( got === MAX_PAGES ) {
		console.log( 'Got %d pages with characters, stopping', got );
		reader.onend();
		process.exit( 0 );
	}
};

function encode_str( str ) {
	return str
		.replace( /\t/g, '\\t' )
		.replace( /\n/g, '\\n' );
}

reader.onend = function () {
	try {
		mkdirSync_recursive( path.dirname( wikitext_file ) );
	} catch ( e ) {}
	try {
		mkdirSync_recursive( path.dirname( json_file ) );
	} catch ( e ) {}

	console.log( 'Write %d results to...', results.length );
	console.log( '  ' + path.relative( pwd, json_file ) );
	fs.writeFileSync( json_file, JSON.stringify( results ) );
	console.log( '  ' + path.relative( pwd, wikitext_file ) );
	fs.writeFileSync( wikitext_file, results_wikitext.join( '' ) );
};


reader.stream();

