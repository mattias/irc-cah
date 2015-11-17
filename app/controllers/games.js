// import modules
var _ = require('underscore'),
    s = require('underscore.string'),
    Game = require('./game'),
    Player = require('../models/player'),
    config = require('../../config/config');

var Games = function Games() {
    var self = this;
    self.games = [];
    self.beerPending = {};
    _.each(config.clientOptions.channels, function(channel) { self.beerPending[channel] = []});

    /**
     * Find a game by channel it is running on
     * @param channel
     * @returns {*}
     */
    self.findGame = function (channel) {
        return _.findWhere(self.games, {channel: channel});
    };

    /**
     * Start a game
     * @param client
     * @param message
     * @param cmdArgs
     */
    self.start = function (client, message, cmdArgs) {
        // check if game running on the channel
        var channel = message.args[0],
            nick = message.nick,
            user = message.user,
            hostname = message.host;

        if (typeof self.findGame(channel) !== 'undefined') {
            // game exists
            client.say(channel, 'A game is already running. Type !join to join the game.');
        } else {
            // init game
            var game = new Game(channel, client, config, cmdArgs);
            self.games.push(game);
            self.join(client, message, cmdArgs)
        }

    };

    /**
     * Stop a game
     * @param client
     * @param message
     * @param cmdArgs
     */
    self.stop = function (client, message, cmdArgs) {
        var channel = message.args[0],
            user = message.user,
            hostname = message.host,
            game = self.findGame(channel);
        if (typeof game === 'undefined') {
            client.say(channel, 'No game running. Start the game by typing !start.');
        } else {
            var player = game.getPlayer({user: user, hostname: hostname});
            if (typeof(player) !== 'undefined') {
                game.stop(game.getPlayer({user: user, hostname: hostname}));
                self.games = _.without(self.games, game);
            }
        }
    };

    /**
     * Pause a game
     * @param client
     * @param message
     * @param cmdArgs
     */
     self.pause = function(client, message, cmdArgs) {
         var channel = message.args[0],
            nick = message.nick,
            user = message.user,
            hostname = message.host,
            game = self.findGame(channel);
        if (typeof game === 'undefined') {
            client.say(channel, 'No game running. Start the game by typing !start.');
        } else {
            var player = game.getPlayer({user: user, hostname: hostname});
            if (typeof(player) !== 'undefined') {
                game.pause();
            }
        }
     };

    /**
     * Resume a game
     * @param client
     * @param message
     * @param cmdArgs
     */
     self.resume = function(client, message, cmdArgs) {
         var channel = message.args[0],
            nick = message.nick,
            user = message.user,
            hostname = message.host,
            game = self.findGame(channel);
        if (typeof game === 'undefined') {
            client.say(channel, 'No game running. Start the game by typing !start.');
        } else {
            var player = game.getPlayer({user: user, hostname: hostname});
            if (typeof(player) !== 'undefined') {
                game.resume();
            }
        }
     };

    /**
     * Add player to game
     * @param client
     * @param message
     * @param cmdArgs
     */
    self.join = function (client, message, cmdArgs) {
        var channel = message.args[0],
            nick = message.nick,
            user = message.user,
            hostname = message.host,
            game = self.findGame(channel);

        if (typeof game === 'undefined') {
            if (config.startOnFirstJoin === false) {
                client.say(channel, 'No game running. Start the game by typing !start.');
            } else {
                self.start(client, message, cmdArgs);
            }
        } else {
            var player = new Player(nick, user, hostname);
            game.addPlayer(player);
        }
    };

    /**
     * Remove player from game
     * @param client
     * @param message
     * @param cmdArgs
     */
    self.quit = function (client, message, cmdArgs) {
        var channel = message.args[0],
            user = message.user,
            hostname = message.host,
            game = self.findGame(channel);
        if (typeof game === 'undefined') {
            client.say(channel, 'No game running. Start the game by typing !start.');
        } else {
            game.removePlayer(game.getPlayer({user: user, hostname: hostname}));
        }
    };

    /**
     * Get players cards
     * @param client
     * @param message
     * @param cmdArgs
     */
    self.cards = function (client, message, cmdArgs) {
        var channel = message.args[0],
            user = message.user,
            hostname = message.host,
            game = self.findGame(channel);
        if (typeof game === 'undefined') {
            client.say(channel, 'No game running. Start the game by typing !start.');
        } else {
            var player = game.getPlayer({user: user, hostname: hostname});
            game.showCards(player);
        }
    };

    /**
     * Play cards
     * @param client
     * @param message
     * @param cmdArgs
     */
    self.play = function (client, message, cmdArgs) {
        // check if everyone has played and end the round
        var channel = message.args[0],
            user = message.user,
            hostname = message.host,
            game = self.findGame(channel);
        if (typeof game === 'undefined') {
            client.say(channel, 'No game running. Start the game by typing !start.');
        } else {
            var player = game.getPlayer({user: user, hostname: hostname});
            if (typeof(player) !== 'undefined') {
                game.playCard(cmdArgs, player);
            }
        }
    };

    /**
     * Lisst players in the game
     * @param client
     * @param message
     * @param cmdArgs
     */
    self.list = function (client, message, cmdArgs) {
        var channel = message.args[0],
            game = self.findGame(channel);
        if (typeof game === 'undefined') {
            client.say(channel, 'No game running. Start the game by typing !start.');
        } else {
            game.listPlayers();
        }
    };

    /**
     * Select the winner
     * @param client
     * @param message
     * @param cmdArgs
     */
    self.winner = function (client, message, cmdArgs) {
        var channel = message.args[0],
            user = message.user,
            hostname = message.host,
            game = self.findGame(channel);
        if (typeof game === 'undefined') {
            client.say(channel, 'No game running. Start the game by typing !start.');
        } else {
            var player = game.getPlayer({user: user, hostname: hostname});
            if (typeof(player) !== 'undefined') {
                game.selectWinner(cmdArgs[0], player);
            }
        }
    };

    /**
     * Show top players in current game
     * @param client
     * @param message
     * @param cmdArgs
     */
    self.points = function (client, message, cmdArgs) {
        var channel = message.args[0],
            hostname = message.host,
            game = self.findGame(channel);
        if (typeof game === 'undefined') {
            client.say(channel, 'No game running. Start the game by typing !start.');
        } else {
            game.showPoints();
        }
    };

    /**
     * Show top players in current game
     * @param client
     * @param message
     * @param cmdArgs
     */
    self.status = function(client, message, cmdArgs) {
        var channel = message.args[0],
            game = self.findGame(channel);
        if (typeof game === 'undefined') {
            client.say(channel, 'No game running. Start the game by typing !start.');
        } else {
            game.showStatus();
        }
    };

    /**
     * Alias command for winner and play
     * @param client
     * @param message
     * @param cmdArgs
     */
    self.pick = function (client, message, cmdArgs)
    {
        // check if everyone has played and end the round
        var channel = message.args[0],
            user = message.user,
            hostname = message.host,
            game = self.findGame(channel);

        if (typeof game === 'undefined'){
            client.say(channel, 'No game running. Start the game by typing !start.');
        } else {
            var player = game.getPlayer({user: user, hostname: hostname});

            if (typeof(player) !== 'undefined') {
                if (game.state === Game.STATES.PLAYED) {
                    game.selectWinner(cmdArgs[0], player);
                } else if (game.state === Game.STATES.PLAYABLE) {
                    game.playCard(cmdArgs, player);
                } else {
                    client.say(channel, '!pick command not available in current state.');
                }
            }
        }
    };

    /**
     * Show game help
     * @param client
     * @param message
     * @param cmdArgs
     */
    self.help = function(client, message, cmdArgs) {
        var channel = message.args[0],
            help = [
            "Commands: !start [#] - start a game of # rounds",
            "!join, !j - join/start a game",
            "!quit, !q - leave the game",
            "!cards, !c - see your cards",
            "!pick, !p [# ...] - play a card or choose a winner",
            "!test - get a test NOTICE from the bot",
            "other commands: !pause, !resume, !play, !winner, !beer [nick]"
        ];
        client.say(channel, help.join('; '));
    };

    /**
     * Send someone a NOTICE to help them test their client
     * @param client
     * @param message
     * @param cmdArgs
     */
    self.test = function(client, message, cmdArgs) {
        var nick = message.nick;
        client.notice(nick, 'Can you hear me now?');
    };

    /**
     * Send a beer
     * @param client
     * @param message
     * @param cmdArgs
     */
    self.beer = function (client, message, cmdArgs)
    {
        // check if everyone has played and end the round
        var channel = message.args[0],
            user = message.user,
            hostname = message.host,
            game = self.findGame(channel),
            nick = cmdArgs[0] || message.nick

        self.beerPending[channel].push(nick);
        client.send('NAMES', channel);
    };

    /**
     * Handle names response to send beer
     * @param channel
     * @param nicks
     */
    self.beerHandler = function(client, arguments)
    {
        var channel = arguments[0],
            nicks = arguments[1],
            message = _.template('slides a tall, cold glass of <%= randomBeer %> over to <%= nick %>');
        _.each(self.beerPending[channel], function (nick) {
            if (_.indexOf(_.keys(nicks), nick) > -1) {
                client.action(channel, message({
                    randomBeer: config.beers[Math.floor(Math.random() * config.beers.length)],
                    nick: nick
                }));
            }
        });
        self.beerPending[channel] = [];
    };

};

exports = module.exports = Games;
