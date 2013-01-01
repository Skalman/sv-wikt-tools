'use strict';

exports.Dump_reader = Dump_reader;

function Dump_reader( file ) {
	this.file = file || require( './conf' ).get( 'full_dump_file' );
};

function create_true_obj( props ) {
	var obj = Object.create( null );
	for ( var i = 0; i < props.length; i++ ) {
		obj[ props[i] ] = true;
	}
	return obj;
}

// page properties
var PP = create_true_obj( ['title', 'ns', 'id', 'text'] );
var PP_IN_REVISION = create_true_obj( ['text'] );
var PP_INTEGER = create_true_obj( ['ns', 'id'] );


Dump_reader.prototype.stream = function () {
	var sax = require( './vendor/sax' );
	var fs = require( 'fs' );

	var stream = sax.createStream( true, {
		trim: false,
		normalize: false,
		lowercase: false,
		xmlns: false,
		position: false,
	} );

	var self = this;

	// state
	var page = null,
		prop = null,
		in_revision = false;

	stream.on( 'error', function ( err ) {
		console.log('got a stream error:');
		console.log(err);
	} );

	stream.on( 'opentag', function ( node ) {
		var tag = node.name;
		if ( tag === 'page' ) {
			page = {};
		}
		if ( PP[tag] && !PP_IN_REVISION[tag] === !in_revision ) {
			prop = tag;
		}
		if ( tag === 'revision' ) {
			in_revision = true;
		}

	} );

	stream.on( 'text', function ( text ) {
		if ( prop ) {
			if ( PP_INTEGER[prop] ) {
				text = parseInt( text, 10 );
			}
			page[prop] = text;
		}
	} );

	stream.on( 'closetag', function ( tag ) {
		if ( tag === 'page' ) {
			self.onpage && self.onpage( page );
			page = null;
		}
		if ( prop && PP[tag] ) {
			prop = null;
		}
		if ( in_revision && tag === 'revision' ) {
			in_revision = false;
		}
	} );

	stream.on( 'end', function () {
		self.onend && self.onend();
	} );


	fs.createReadStream( this.file )
		.pipe( stream );
};
