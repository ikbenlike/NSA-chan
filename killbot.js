var loginDetails = require("./login.json");
var DiscordClient = require('discord.io');
var bot = new DiscordClient({
    autorun: true,
    token: loginDetails.inToken
});

var mysql = require("mysql");
var connection = mysql.createConnection({
    host: loginDetails.sqlhost,
    user: loginDetails.sqluser,
    password: loginDetails.sqlpassword,
    database: loginDetails.sqldatabase,
    stringifyObjects: true
});

bot.on('ready', function() {
    connection.connect();
    console.log(bot.username + " - (" + bot.id + ")");
});

var count = 0;

bot.on('message', function(user, userID, channelID, message, rawEvent, server) {
    //console.log(userID + " - " + user + "\n" + message)
    count += 1
    if (message === "<@" + bot.id + ">" + " id") {
        bot.sendMessage({
            to: channelID,
            message: bot.id
        });
    }
    else if (message === "<@" + bot.id + ">" + " kill") {
        if (userID == loginDetails.adminid){
            bot.sendMessage({
                to: channelID,
                message: "OKAY"
            });
            bot.disconnect()
            connection.end(function(err){});
        } else {
            if (channelID in bot.directMessages) {
                connection.query("INSERT INTO report VALUES (" + connection.escape(user) + ", " + connection.escape(userID) + ", " + connection.escape(user + " attempted shutdown") + ", " + connection.escape(bot.serverFromChannel(channelID)) + ", \"PM\", \"PM\");")
            }
            else {
                connection.query("INSERT INTO report VALUES (" + connection.escape(user) + ", " + connection.escape(userID) + ", " + connection.escape(user + " attempted shutdown") + ", " + connection.escape(bot.serverFromChannel(channelID)) + ", " + connection.escape(bot.servers[bot.serverFromChannel(channelID)].name) + ", " + channelID + ");")
            }
            bot.sendMessage({
                to: channelID,
                message: "you do not have permission for this, this will be reported"
            });
        }
    }
    else if (message.split(" ")[0] === "<@" + bot.id + ">" && message.split(" ")[1] === "join") {
        bot.sendMessage({
            to: channelID,
            message: "joining"
        });
        bot.acceptInvite(message.split("/").slice(-1)[0])
        console.log("[joining " + message.split("/").slice(-1)[0] + "]")
        connection.query("INSERT INTO  invites VALUES (" + connection.escape(count.toString()) + ", " + connection.escape(user) + ", " + connection.escape(userID) + ", " + connection.escape(message.split("/").slice(-1)[0]) + ");")
    }
    else if (message.split(" ")[0] === "<@" + bot.id + ">" && message.split(" ")[1] === "count") {
        console.log(rawEvent)
        var query = connection.query("SELECT COUNT(messagetext) FROM messages WHERE messagetext LIKE " + connection.escape("%" + message.split(" ").slice(2).join(" ") + "%") + ";", function(err, result){
            console.log(query.sql)
            if (err) {
                bot.sendMessage({
                    to: channelID,
                    message: "an error occured"
                });
            }
            else {
                console.log(result)
                bot.sendMessage({
                    to: channelID,
                    message: JSON.stringify(result)
                });
            }
        });
    }
    if (channelID in bot.directMessages) {
        connection.query("INSERT INTO  messages VALUES (" + connection.escape(count.toString()) + ", " + connection.escape(user) + ", " + connection.escape(userID) + ", " + connection.escape(message) + ", " + connection.escape(channelID) + ", \"PM\", \"0\", \"PM\");")
    }
    else {
        connection.query("INSERT INTO  messages VALUES (" + connection.escape(count.toString()) + ", " + connection.escape(user) + ", " + connection.escape(userID) + ", " + connection.escape(message) + ", " + connection.escape(bot.serverFromChannel(channelID)) + ", " + connection.escape(bot.servers[bot.serverFromChannel(channelID)].name) + ", \"0\", " + channelID + ");")
        connection.query("ALTER TABLE messages MODIFY COLUMN goodCount INT AUTO_INCREMENT;")
    }
});

bot.on('disconnected', function() {
    bot.connect();
});
