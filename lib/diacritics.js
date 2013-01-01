'use strict';

var Live_reader = require( './wikimedia-live-reader.js' ).Live_reader;

var cached = [
	'*a:à,ȁ,á,â,ấ,ầ,ẩ,ā,ã,ä,ǟ,å,ǻ,ą̊,ă,ȃ,ą,ǎ,ȧ,ǡ,ḁ,ạ,ả,ẚ',
	'*ae:æ,ǽ,ǣ',
	'*b:ḃ,ḅ,ḇ,ƀ,ᵬ,ᶀ,ɓ,ƃ',
	'*c:ç,ç,č,ĉ,ć,ḉ,ċ',
	'*d:ď,đ,ƌ,ȡ,ḍ,ḏ,ḑ,ḓ,ɗ,ð,ɖ,ḋ',
	'*e:ē,é,ě,è,ȅ,ê,ę,ë,ė,ẹ,ẽ,ĕ,ȇ,ȩ,ḕ,ḗ,ḙ,ḛ,ḝ,ẻ,ể,ề,ễ,ế,ệ,ẹ̀,ẹ́',
	'*f:ƒ,ḟ',
	'*ff:ﬀ',
	'*ffi:ﬃ',
	'*ffl:ﬄ',
	'*fi:ﬁ',
	'*fl:ﬂ',
	'*g:ǵ,ġ,ĝ,ǧ,ğ,ģ,g̃,ǥ,⅁,₲,ℊ',
	'*h:ȟ,ĥ,ħ,ḩ,ḫ,ẖ,ḣ,ḥ,ḧ,ƕ,ⱨ,ⱶ,Ⱶ,h̡',
	'*i:ī,í,ǐ,ĭ,ì,î,İ,į,ï,í,ì,ĩ,ĩ,ỉ,ỉ,ị,ị,ı',
	'*ij:ĳ',
	'*j:ĵ',
	'*k:ķ,ĸ,ǩ,ḱ,Ḳ,ḵ,₭,ƙ',
	'*l:ĺ,ḹ,ḷ,ľ,ł',
	'*m:ṁ,ṃ',
	'*n:ñ,ń,ņ,ň,ɲ,ƞ,ǹ,ȵ,ɳ,ṅ,ṇ,ṉ,ṋ',
	'*o:ō,ó,ǒ,ò,ô,ö,õ,ő,ṓ,ø,ǿ,ǫ,ȱ,ȯ,ỏ,ồ,ổ,ỗ,ố,ộ,ơ,ờ,ở,ỡ,ớ,ợ,ọ,ọ̀,ọ́,ŏ,ɵ,o̲',
	'*oe:œ,œ̞,œ̃',
	'*p:ƥ,ṕ,ṗ',
	'*q:ʠ,ɋ',
	'*r:ŕ,ř,ȑ,ȓ,ɼ,ɽ,ɾ,ṙ,ṛ,ṝ,ṟ,r̃',
	'*s:ş,ŝ,ș,ṩ,ṥ,ṡ,ṧ,š,ś,ṣ,ſ,ẛ',
	'*t:ƫ,ț,ţ,ʈ,ŧ,ť,ṫ,ṭ,t̄',
	'*u:ū,ú,ǔ,ù,ŭ,û,ü,ů,ų,ũ,ű,ȕ,ṳ,ṵ,ṷ,ṹ,ṻ,ǖ,ǘ,ǚ,ǜ,ủ,ũ,ụ,ư,ừ,ử,ữ,ứ,ự',
	'*v:ṽ,ṿ,ʋ',
	'*w:ẃ,ẁ,ŵ,ẘ,ẅ,ẇ,ẉ,ʍ,ʬ',
	'*x:ẍ,ẋ,ᶍ',
	'*y:ý,ÿ,ȳ,ƴ,ẏ,ȳ,ɏ,ŷ,¥,ỳ,ỷ,ỹ,ỵ',
	'*z:ž,ż,ẓ,ź,ẕ,ẑ,ʐ,ʑ,ȥ,ƶ',
	'*եւ:և',
	'*մե:ﬔ',
	'*մի:ﬕ',
	'*մն:ﬓ',
	'*մխ:ﬗ',
	'*վն:ﬖ',
	'*α:ά,ὰ,ἀ,ἅ,ᾶ,ἆ,ἇ',
	'*ε:έ,ἐ,ἒ,ἑ,ἕ,ἓ,ὲ',
	'*η:ή,ἠ,ᾐ,ἤ,ᾔ,ἢ,ᾒ,ἦ,ᾖ,ἡ,ᾑ,ἥ,ᾕ,ἣ,ᾓ,ἧ,ᾗ,ῃ,ῄ,ὴ,ῂ,ῆ,ῇ',
	'*ι:ί',
	'*ο:ό',
	'*σ:ς',
	'*υ:ύ,ϋ,ΰ,ὐ,ὔ,ὒ,ὖ,ὑ,ὕ,ὓ,ὗ,ὺ,ῦ,ῠ,ῡ,ῢ,ῧ',
	'*ω:ώ',
].join( '\n' );


// Options defaults: { obj: true, word_regexp: true }
exports.get = function ( options, next ) {
	if ( typeof options === 'function' ) {
		next = options;
		options = {};
	} else if ( !options ) {
		options = {};
	}
	Live_reader.get(
		{ host: 'sv.wiktionary.org', script_path: '/w/index.php' },
		'Wiktionary:Användare/Robotar/Diakriter',
		function ( err, data ) {
			if ( err ) {
				console.log( 'Using cached version of diacritics' );
				data = cached;
			}
			next && next( process_diacritics( options, data ) );
		}
	);
};

// Shortcut functions for getting a single value
exports.get_obj = get_one( 'obj' );
exports.get_word_regexp = get_one( 'word_regexp' );

function get_one( prop ) {
	return function ( next ) {
		var options = {
			obj: false,
			word_regexp: false,
		};
		options[prop] = true;
		exports.get( options, function ( result ) {
			next && next( result[prop] );
		} );
	};
}


function process_diacritics( options, data ) {
	var get_obj = options.obj === undefined || options.obj,
		get_regexp = options.word_regexp === undefined || options.word_regexp,

		diacritics = Object.create( null ),
		letters = [],

		result = {};

	// Not actually replacing, but this provides a quick way to process all
	// RegExp matches
	var found_diacritics = false;
	data.replace( /(^|\n)\*([^:]+):([^\n]+)/g, function ( match, nl, key, vals ) {
		found_diacritics = true;

		var vals_uc = vals.toUpperCase().split( ',' );
		vals = vals.split( ',' );
		
		if ( get_obj ) {
			diacritics[key] = vals;
		}

		if ( get_regexp ) {
			if ( !/^[a-z]+$/.test( key ) ) {
				letters.push( key, key.toUpperCase() );
			}
			letters.push.apply( letters, vals );
			letters.push.apply( letters, vals_uc );
		}
		return '';
	} );
	if ( !found_diacritics ) {
		console.log( 'Found no diacritics' );
	}

	if ( get_obj ) {
		result.obj = diacritics;
	}

	if ( get_regexp ) {
		// get unique letters
		letters = (function ( arr ) {
			var i,
				new_arr = [];
			arr.sort();
			for ( i = 0; i < arr.length; i++ ) {
				if ( arr[i - 1] !== arr[i] ) {
					new_arr.push( arr[i] );
				}
			}
			return new_arr;
		}( letters ) );

		letters.unshift( '[a-zA-Z]' );
		result.word_regexp = new RegExp( '(' + letters.join( '|' ) + ')+', 'g' );
	}

	return result;
}

