'use strict';

var fs = require( 'fs' );
var path = require( 'path' );

exports.mkdir_recursive = mkdir_recursive;
exports.mkdirSync_recursive = mkdirSync_recursive;


function mkdir_recursive( p, mode, next ) {
	if ( typeof mode === 'function' ) {
		next = mode;
		mode = null;
	}

	var parent = path.dirname( p );

	fs.exists( parent, function ( exists ) {
		if ( exists ) {
			fs.mkdir( p, mode, next );
		} else {
			mkdir_recursive( parent, mode, function ( err ) {
				if ( err ) {
					next && next( err );
					return;
				}
				fs.mkdir( p, mode, next );
			} );
		}
	} );
}

function mkdirSync_recursive( p, mode ) {
	var parent = path.dirname( p );
	if ( !fs.existsSync( parent ) ) {
		mkdirSync_recursive( parent, mode );
	}

	fs.mkdirSync( p, mode );
}
