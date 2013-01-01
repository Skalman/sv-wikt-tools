exports.conf = {
	// The wiki on which to operate
	wiki_host: 'sv.wiktionary.org',

	// Included in the User-Agent when making requests to the wiki. This way
	// site operators can contact you if the script causes problems.
	// Alternatively specify the property `wiki_user_agent`
	contact: 'User:John Doe <john.doe@example.com>',

	// User name and password of the bot on the wiki, for making edits
	// later
	wiki_user: 'John Doe Bot',
	wiki_password: 'secret',
};
