'use strict';

exports.Live_reader = Live_reader;

var fs = require( 'fs' );
var http = require( 'http' );
var conf = require( './conf' ).get;

function Live_reader( options ) {
	options = options || {};

	this.host = options.host || conf( 'wiki_host' );
	this.script_path = options.script_path || conf( 'wiki_script_path' );
	this.user_agent = options.user_agent || conf( 'wiki_user_agent' );
	this.cache_dir = options.cache_dir || conf( 'cache_dir' ) + '/' + this.host;
}

Live_reader.get = function ( options, page, next ) {
	new Live_reader( options ).get( page, next );
};

Live_reader.prototype.get = function( page, next ) {
	var self = this,
		host = this.host;
	var req = http.get( {
			hostname: host,
			path: this.script_path + '?title=' + encodeURIComponent( page ) + '&action=raw',
			headers: {
				'User-Agent': this.user_agent,
			},
		},
		function ( res ) {
			var data = '';
			if ( res.statusCode === 200 ) {
				res.setEncoding( 'utf8' );
				res.on( 'data', function ( chunk ) {
					data += chunk;
				} );
				res.on( 'end', function () {
					console.log( host, 'Retrieved ' + page );
					next && next( false, data );
				} );
			} else if ( res.statusCode === 301 || res.statusCode === 302 ) {
				console.log( host, 'Redirect... (TODO)' );
				console.trace();
			} else {
				console.error( host, 'Could not get page ' + page + ' (status code: ' + res.statusCode + ')');
				error( undefined, 'Bad status code: ' + res.statusCode, res );
			}
		}
	)
	req.on( 'error', function ( err ) {
		console.error( host, 'Could not get page ' + page );
		error( err, 'Could not get page' );
	} )
	req.setTimeout( conf( 'http_timeout' ), function () {
		req.abort();
	} );

	function error( err, message, res ) {
		var cache_file = self.cache_file( page );
		fs.readFile( cache_file, 'utf-8', function ( err, data ) {
			if ( err ) {
				console.log( '  ...and could not get cached version (' + cache_file + ')' );
				next && next( {
					err: err,
					page: page,
					message: message,
					res: res,
				}, null );
			} else {
				console.log( '  ...but got cached version' );
				next && next( null, data );
			}

		} );
	}
};

Live_reader.prototype.cache_file = function ( page ) {
	return this.cache_dir + '/' + page.replace( /\//g, '-' ) + '.wikitext';
}
