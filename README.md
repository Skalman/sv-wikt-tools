Tools for the [Swedish language Wiktionary]
===========================================

These Node.js tools may be useful for other wikis too, but are especially
designed for the [Swedish language Wiktionary].


Installation
------------

1. Install [Node.js]
2. Get the source code
3. Create a custom copy of `conf.example.js` and place it in `conf.js`
4. Run whatever tools you want


Usage
-----

### Dumps

Some tools require a local dump of the wiki.
In particular the following are useful:

* <http://dumps.wikimedia.org/svwiktionary/latest/>
	* `svwiktionary-latest-pages-articles.xml`
	* `svwiktionary-latest-all-titles-in-ns0`


### General

The tools follow a general pattern:

* Run a tool: `node <tool>`
* The tool reads input data from `data/`
* The tool outputs data to `output/<tool>/`


### Common words

`node common-words`

Analyzes a dump and extracts used words from it and assigns a number to each
word based on frequency.

* By default, existence gives 1 point, and a link to it gives 10 points. Words
  that get less than 75 points are excluded.
* Words contain only the characters listed at [sv-wikt: diacritics], or the
  corresponding uppercase variant.
* E.g. `doesn't` will be classified as two words: `doesn` and `t`.
* All characters are allowed in links: `[[table tennis]]` will result in the
  single word `table tennis` for link points, while `table` and `tennis` will
  receive existence points.
* Only words in Latin, Greek and ??? scripts are included.
* Some text is removed:
	* Within some tags, e.g. `<ref>`
	* Within templates, e.g. `{{wikipedia}}`, except:
		* Content within [semantic templates] are included
		* The linked item in `{{ö}}` and `{{ö-}}` are included
* If a word exists with multiple capitalizations, they are combined into a
  single result, using the most frequent capitalization.

Example and result:

`Here's an [[orange]], here's an [[apple]], and here are two [[pear]]s.`

	[ ["orange",11], // both linked and exists
	  ["apple",11],
	  ["pear",10], // `pear` is linked, while the word that exists in the text is `pear`, see below
	  ["here",3], // most common capitalization chosen
	  ["s",2], // unfortunately, the dangling `s` is considered a word
	  ["an",2],
	  ["and",1],
	  ["are",1],
	  ["two",1],
	  ["pears",1]
	]


#### Filter existing

`node common-words-filter-existing`

Filters the list of words of existing words, based on the article title dump.
Used on [sv-wikt: wishlist].


### Find non-printable characters

`node find-nonprintable-chars`

Generates a list of articles that contain non-printable characters that probably
shouldn't be in a wiki.



License
-------

Copyright 2012 Dan Wolff (<d@danwolff.se>, <http://danwolff.se>)

This program is free software: you can redistribute it and/or modify it under
the terms of the GNU General Public License as published by the Free Software
Foundation, either version 3 of the License, or (at your option) any later
version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY
WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A
PARTICULAR PURPOSE. See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with
this program. If not, see <http://www.gnu.org/licenses/>.


Files available in `lib/vendor/` have other licenses and copyright holders.


If you need these tools under another license, I'll consider releasing them
under 


[Swedish language Wiktionary]: https://sv.wiktionary.org/
[Node.js]: http://nodejs.org/

[sv-wikt: diacritics]: https://sv.wiktionary.org/wiki/Wiktionary:Anv%C3%A4ndare/Robotar/Diakriter
[semantic templates]: https://sv.wiktionary.org/wiki/Wiktionary:Stilguide#List-_och_br.C3.B6dtextmallar
[sv-wikt: wishlist]: https://sv.wiktionary.org/wiki/Wiktionary:Projekt/%C3%96nskelistor/Svenska/Wiktionary
