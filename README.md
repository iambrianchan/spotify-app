This is a project to create spotify playlists from http://www.showlistaustin.com, Steve Koepke's San Francisco Bay Area concert guide, and Oh My Rockness.

Currently the can create playlists venues in Austin, San Francisco, and New York City.

Application is run by `node index.js`

The following environment variables are necessary for running:
SPOTIFY_DB // url to the mongo database
SPOTIFY_CLIENT_ID // spotify api client id
SPOTIFY_CLIENT_SECRET // spotify api client secret
SPOTIFY_REDIRECT_URI // spotify api redirect uri
REDIS_SERVER // url to the redis server
REDIS_PORT // redis server port
REDIS_PASS // redis server password