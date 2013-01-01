'use strict';

var path = require( 'path' );

exports.conf = {
	get: function get_func( key ) {
		// prevent infinite loops
		if ( this[key] === get_func ) {
			return;
		}
		return typeof this[key] === 'function' ? this[key]() : this[key];
	},

	wiki_host: not_provided( 'wiki_host' ),
	contact: not_provided( 'contact' ),
	wiki_user: not_provided( 'wiki_user' ),
	wiki_password: not_provided( 'wiki_password' ),

	wiki_script_path: '/w/index.php',
	wiki_user_agent: function () {
		return 'Bot/script of ' + this.get( 'contact' );
	},

	http_timeout: 2000,

	cache_dir: path.join( __dirname, '../cache/' ),

	dump_prefix: function () {
		var host = this.get( 'wiki_host' );
		var lang = /^[a-z-]+/.exec( host );
		lang = lang ? lang[0] : '';

		var db = /wiktionary\.org$/.test( host ) ? lang + 'wiktionary'
			: undefined;

		return db ? db + '-' : '';
	},

	full_dump_file: function () {
		return path.join(
			__dirname,
			'../data/',
			this.get( 'dump_prefix' ) + 'latest-pages-articles.xml'
		);
	},
};

function not_provided( prop ) {
	return function () {
		throw new Error( 'Configuration property missing: ' + prop );
	}
}
