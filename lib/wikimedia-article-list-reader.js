'use strict';

var fs = require( 'fs' );
var path = require( 'path' );
var util = require( 'util' );

var pwd = process.env.PWD || __dirname;

exports.Article_list_reader = Article_list_reader;

var BUFFER_SIZE = 4096;
var MIN_NORMAL_SIZE = BUFFER_SIZE - 32;
var PREAMBLE = 'page title\n';
var NEWLINE = '\n'.charCodeAt( 0 ); // 10

function Article_list_reader( file ) {
	this.file = file;
	this.stopped = false;
}

Article_list_reader.prototype.stop = function () {
	this.stopped = true;
};

Article_list_reader.prototype.stream = function () {
	var self = this;

	var bytes_to_read = fs.statSync( self.file ).size;
	fs.open( self.file, 'r', function ( err, fd ) {
		console.log( 'Reading %d KB from %s',
			Math.round( bytes_to_read / 1000 ),
			path.relative( pwd, self.file ) );
		console.log( "Each 'X', 'x' and '.' represent reading %d bytes, at least %d bytes, and fewer",
			BUFFER_SIZE,
			MIN_NORMAL_SIZE );

		var buf = new Buffer( BUFFER_SIZE );
		var is_first_read = true;
		var prev_buf_length = 0;

		read();

		function read( err, bytes_read ) {
			if ( err ) {
				console.log( '\nGot error! Could not read!' );
				console.log( err );
				return;
			}
			if ( bytes_read ) {
				util.print(
					bytes_read === BUFFER_SIZE ? 'X'
					: bytes_read >= MIN_NORMAL_SIZE ? 'x'
					: '.' );
				bytes_to_read -= bytes_read;

				var last_nl_pos = Array.prototype.lastIndexOf.call( buf, NEWLINE, prev_buf_length + bytes_read );
				var buf_str = buf.toString( 'utf-8', 0, last_nl_pos ).replace( /_/g, ' ' );

				prev_buf_length = prev_buf_length + bytes_read - last_nl_pos - 1;
				buf.copy( buf, 0, last_nl_pos + 1, last_nl_pos + 1 + prev_buf_length );

				if ( is_first_read ) {
					is_first_read = false;
					if ( buf_str.substr( 0, PREAMBLE.length ) === PREAMBLE ) {
						buf_str = buf_str.substr( PREAMBLE.length );
					}
				}

				handle_buf_str( buf_str );
			}

			if ( bytes_to_read > 0 ) {
				!self.stopped && fs.read( fd, buf, prev_buf_length, BUFFER_SIZE - prev_buf_length, null, read );
			} else {
				if ( buf_str ) {
					!self.stopped && self.onpage && self.onpage( buf_str );
					// console.log( 'last bit is: [' + buf_str + ']' );
				}
				util.print( '\n' );
				!self.stopped && self.onend && self.onend();
			}
		}

		function handle_buf_str( buf_str ) {
			var i,
				buf_rows = buf_str.split( '\n' );

			if ( self.onpage ) {
				for ( i = 0; i < buf_rows.length && !self.stopped; i++ ) {
					self.onpage( buf_rows[i] );
				}
			}
		}


	} );


	// fs.open( this.file, 'r', function (  ) {
	// 	console.log([].slice.apply(arguments));
	// 	console.log(file);
	// } )	
};
