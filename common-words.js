'use strict';

var path = require( 'path' );
var util = require( 'util' );
var fs = require( 'fs' );
var mkdirSync_recursive = require( './lib/mkdir-recursive' ).mkdirSync_recursive;


var pwd = process.env.PWD || __dirname;
var output_file = path.join( __dirname, '/output/common-words/all.json' );

var words_to_watch = [
	'ref',
	'cv',
	'wa',
];

var POINTS_PER_WORD = 1,
	POINTS_PER_LINK = 10,
	MIN_POINTS = 75;

// TODO: instead of MIN_POINTS, consider
//	MAX_WORDS = 400
//	MAX_DIFFERENCE_RATIO = 100
//		the most common word will be 100 times more common than the least common in the list


var SEMANTIC_TEMPLATES = 'konstr,etymologi,grammatik,användning,stavning,synonymer,antonymer,hyperonymer,hyponymer,kohyponymer,holonymer,meronymer,toponymer,varianter,jämför,homofoner,besläktade ord,sammansättningar,fraser,koder,diverse'.split( ',' );


var Dump_reader = require( './lib/wikimedia-dump-reader.js' ).Dump_reader;
var get_word_regexp = require( './lib/diacritics' ).get_word_regexp;

var R_SEMANTIC_TEMPLATES = new RegExp( '\\{\\{(' + SEMANTIC_TEMPLATES.join( '|' ) + ')\\|([^\\}]+)\\}\\}', 'g' );

var R_WORD;



// process
get_word_regexp( function ( word_regexp ) {
	R_WORD = word_regexp;
	process_pages();
} );

function process_pages() {

	var reader = new Dump_reader(),
		time_begin,
		time_total_processing = 0,
		watched_words = new Watched_words( {
			path: __dirname + '/output/common-words/watched/',
			summary_path: __dirname + '/output/common-words/watched-summary.wikitext',
			words: words_to_watch,
		} );

	process.nextTick( function () {
		time_begin = Date.now();
		reader.stream();
	} );

	var words = Object.create( null );

	function add_word( word, points, page ) {
		if ( false ) {
			console.trace( word );
			throw new Error( word + ' found' );
		}

		var word_lc = word.toLowerCase();

		// mostly for debugging
		if ( watched_words.words[word] || watched_words.words[word_lc] ) {
			watched_words.handle( word, page );
		}

		if ( !words[word_lc] ) {
			words[word_lc] = Object.create( null );
			words[word_lc][word] = points;
		} else if ( !words[word_lc][word] ) {
			words[word_lc][word] = points;
		} else {
			words[word_lc][word] += points;
		}
	}

	var APPENDIX_PREFIX = 'appendix:',
		WIKTIONARY_PREFIX = 'wiktionary:';
	function is_word( word ) {
		return (
			word !== '' &&

			// begins with 'Appendix:'
			word.substr( 0, APPENDIX_PREFIX.length ).toLowerCase() !== APPENDIX_PREFIX &&

			// begins with 'Wiktionary:'
			word.substr( 0, WIKTIONARY_PREFIX.length ).toLowerCase() !== WIKTIONARY_PREFIX
		);
	}

	function filter_words() {
		var i, j;

		var filtered_words = [];

		// choose a single capitalization
		// keep only if the total is at least MIN_POINTS
		// keep only if it's a real word
		var points, best_cap, best_cap_points;
		for ( i in words ) {
			points = 0;
			best_cap_points = 0;
			for ( j in words[i] ) {
				points += words[i][j];
				if ( best_cap_points < words[i][j] ) {
					best_cap = j;
					best_cap_points = words[i][j];
				}
			}

			if ( MIN_POINTS <= points && is_word( best_cap ) ) {
				filtered_words.push( [best_cap, points] );
			}

			// free some memory
			words[i] = undefined;
		}

		words = filtered_words;
	}

	function sort_words() {
		words.sort( function ( a, b ) {
			return b[1] - a[1];
		} );
	}

	var pp_lazy_first = true;
	var pp_batch_count = 0;
	var pp_lazy_pages = [];
	var PP_LAZY_PAGES_PER_BATCH = 500;
	var PP_LAZY_BATCHES_PER_INFO = 20;
	function pp_lazy( page ) {
		if ( page ) {
			pp_lazy_pages.push( page );
		} else {
			// console.log('nope - nothing: ' + pp_lazy_pages.length + ' pages' );
		}
		if ( pp_lazy_pages.length && (PP_LAZY_PAGES_PER_BATCH <= pp_lazy_pages.length || !page) ) {
			if ( pp_lazy_first ) {
				pp_lazy_first = false;
				console.log( 'Each X represents ' + PP_LAZY_PAGES_PER_BATCH + ' pages processed' );
			}
			util.print( page ? 'X' : 'X\n' );
			var tmp = Date.now();
			// console.log(pp_lazy_pages[0].id + ': ' + pp_lazy_pages[0].title);
			pp_lazy_pages.forEach( process_page );
			pp_lazy_pages.length = 0;
			time_total_processing += Date.now() - tmp;

			pp_batch_count++;
			if ( PP_LAZY_BATCHES_PER_INFO <= pp_batch_count && page ) {
				pp_batch_count = 0;
				console.log( ' ' + page.title + ' (id ' + page.id + ')' );
			}
		}
	}

	function process_page( page ) {
		// if ( page.title === 'abdomen' ) {
		// 	console.log( page.text );
		// 	throw new Error( 'quit' );
		// }
		var text = page.text
			// replace certain templates with their param content
			.replace( R_SEMANTIC_TEMPLATES, '$2' )

			// raw translations
			.replace( /\{\{ö\-?\|[a-z\-]+\|([^\|\}]+)(\|[^\}]+)?\}\}/g, '[[$1]]' )

			// remove templates, twice
			.replace( /\{\{[^\}]+\}\}/g, '' )
			.replace( /\{\{[^\}]+\}\}/g, '' )

			// remove math, refs and external links
			.replace( /<(math|ref|sup)[^>]*>[\S\s]*?<\/\1>/gi, '' )
			.replace( /<ref[^\/>]*\/>/gi, '' )
			.replace( /\[http[^\]]+\]/g, '' )

			// replace images with image text, remove iw links
			.replace( /\[\[(file?|bild|image):.+?\|([^\|\]]+)\]\]/gi, ' $2 ' )
			.replace( /\[\[[a-z-]+:[^\]]+\]\]/g, '' )

			// replace entities with space
			.replace( /&[^;]{2,8};/g, ' ' )

			// process non-iw links
			.replace( /\[\[([^\]]+)\]\]/g, function ( match, p1 ) {
				var text, link;
				if ( p1.indexOf( '|' ) !== -1 ) {
					p1 = p1.split( '|' );
					link = p1[0];
					text = p1[1];
				} else {
					link = text = p1;
				}

				if ( link.indexOf( '#' ) !== -1 ) {
					link = link.replace( /#.*/g, '' )
				}
				add_word( link, POINTS_PER_LINK, page );
				return text;

			} )

			// remove other chars
			.replace( /[][\s\.&;:!,_<>{}'"#=\*\(\)\?\/0-9]+/g, ' ' );


		var word;
		while ( (word = R_WORD.exec( text )) !== null ) {
			add_word( word[0], POINTS_PER_WORD, page );
		}
	}

	reader.onpage = function ( page ) {
		if ( page.ns === 0 || page.ns === '0' ) {
			try {
				// process_page( page );
				pp_lazy( page );
			} catch (e) {
				console.log(e);
				console.log(page);
				process.exit(1);
			}
			// if ( page.id%1000 === 0 )
			// 	console.log(page.id + ': ' + page.title);
		}
	}

	reader.onend = function () {
		pp_lazy();
		console.log( 'Completed parsing dump and page content' );

		watched_words.summary();

		console.log( 'Filter words' );
		filter_words();

		console.log( 'Sort words' );
		sort_words();

		console.log( 'Write %d words to %s',
			words.length,
			path.relative( pwd, output_file ) );
		try_mkdirSync_recursive( path.dirname( output_file ) );
		fs.writeFileSync( output_file, JSON.stringify( words ) );

		console.log( 'Stats:' );
		console.log( '  All except setup: %d s', (Date.now() - time_begin) / 1000 );
		console.log( '  Page processing:  %d s', time_total_processing / 1000 );
	}

}

function Watched_words( options ) {
	options = options || {};
	this.path = options.path;
	this.summary_path = options.summary_path || this.path + '_summary.wikitext';
	this.words = Object.create( null );
	if ( options.words ) {
		this.add( options.words );
	}
	this.gotten = Object.create( null );
	this.gotten_count = 0;
	this.max_pages = options.max_pages || Watched_words.default_max_pages;
}

Watched_words.default_max_pages = 100;

Watched_words.prototype.add = function ( words ) {
	var self = this;
	if ( Array.isArray( words ) ) {
		words.forEach( function ( w ) {
			self.words[w] = true;
		} );
	} else {
		self.words[words] = true;
	}
};

Watched_words.prototype.handle = function ( word, page ) {
	if ( !this.created ) {
		this.created = Object.create( null );
		console.log( '\nWatched words: relevant pages\' wikitext is placed in ' + path.relative( pwd, this.path ) );
	} else if ( this.max_pages <= this.gotten_count ) {
		if ( this.max_pages === this.gotten_count && !this.gotten[page.title] ) {
			console.log( '\nWatched words: got words from ' + this.gotten_count + ' pages; skipping additional' );
			this.gotten_count++;
		}
		return;
	}
	console.log( "Watched words: '" + word + "' in '" + page.title + "'" );
	if ( !this.created[this.path] ) {
		try_mkdirSync_recursive( this.path );
		this.created[this.path] = true;
	}
	var wikitext_file = path.join( this.path, page.title.replace( /\//g, '-' ) );
	if ( !this.created[wikitext_file] ) {
		fs.writeFileSync( wikitext_file, page.text );
		this.created[wikitext_file] = true;
	}
	if ( !this.gotten[page.title] ) {
		this.gotten[page.title] = [];
		this.gotten_count++;
	}
	this.gotten[page.title].push( word );
};

Watched_words.prototype.summary = function () {
	if ( this.created ) {
		var gotten = this.gotten;
		console.log( 'Watched words: Writing summary to ' + path.relative( pwd, this.summary_path ) );
		try_mkdirSync_recursive( path.dirname( this.summary_path ) );
		fs.writeFileSync(
			this.summary_path,
			'== Watched words: Summary ==\n\n' +
			Object.keys( gotten )
				.map( function ( title ) {
					return '*[[' + title + ']]: ' + gotten[title].join( ', ' );
				} )
				.join( '\n' ) +
			'\n' +
			( this.gotten_count === this.max_pages + 1 ? '*Skipping additional pages' : '' )
		);
		return true;
	} else {
		return false;
	}
};

function try_mkdirSync_recursive( path ) {
	try {
		mkdirSync_recursive( path );
	} catch ( e ) {}
}

