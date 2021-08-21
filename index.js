require('dotenv').config()

const express = require('express');
const app = express();
const port = 3000;
app.get('/', (req, res) => res.send('Babu bot!'));

app.listen(port, () => console.log(`Listening at port ${port}`));

const Discord = require('discord.js')
const Client = new Discord.Client()

const ytdl = require('ytdl-core')
const ytSearch = require('yt-search')

const prefix = '$'

const fs = require('fs')

const queue = new Map();

Client.commands = new Discord.Collection();

const commandFiles = fs.readdirSync('./commands/').filter(file => file.endsWith('.js'))

for (const file of commandFiles) {
    const command = require(`./commands/${file}`)

    Client.commands.set(command.name, command)
}


Client.once('ready', () => {
    console.log('Babu ready!')
    Client.user.setPresence({
        game: {
            name: 'Prefix $ | v. 1.0.0'
        }
    })
})

Client.on('message', async message => {
    if (!message.content.startsWith(prefix) || message.author.bot) 
        return;
    const args = message.content.slice(prefix.length).split(/ +/)
    const command = args.shift().toLowerCase()

    const server_queue = queue.get(message.guild.id)

    if (command === 'ping') {
        Client.commands.get('ping').execute(message, args)
    }

    if (command === 'clear') {
        Client.commands.get('clear').execute(message, args)
    } else if (command === 'play') {
        // INI BUAT PLAY
        // Client.commands.get('play').execute(message, args)
        const isInVoiceChannel = message.member.voice.channel

        if (!isInVoiceChannel) {
            return message.channel.send('Harus di dalam voice channel bambank!')
        }

        const permissions = isInVoiceChannel.permissionsFor(message.client.user);
        if (!permissions.has('CONNECT') || !permissions.has('SPEAK')) {
            return message.channel.send('Ye gabisa masuk karna gapunya akses ye')
        }

        

        if (!args.length) {
            return message.channel.send('Mana lagunya?')
        }

        

        let song = {}

        const videoFinder = async (q) => {
            await message.channel.send(`Sabar Baginda lagi dicariin.`)
            const videoResult = await ytSearch(q)

            return (videoResult.videos.length > 1 ) ? videoResult.videos[0] : null;
        }

        const video = await videoFinder(args.join(' '))

        if (video) {
            song = {title: video.title, url: video.url}
        } else {
            message.channel.send('Ga nemu.')
        }

        if (!server_queue) {
            const queue_constructor = {
                voice_channel: isInVoiceChannel,
                text_channel: message.channel,
                connection: null,
                songs: [],
            }

            queue.set(message.guild.id, queue_constructor)
            queue_constructor.songs.push(song)

            try {
                const connection = await isInVoiceChannel.join()
                queue_constructor.connection = connection
                video_player(message.guild, queue_constructor.songs[0])
            } catch (err) {
                queue.delete(message.guild.id)
                message.channel.send('Ada error bang')
            }
        } else {
            server_queue.songs.push(song)
            await message.channel.send(`***${song.title}*** sudah ditambahkan Baginda. :man_bowing:`)
        }
    } else if (command === 'stop') {
        // INI BUAT STOP
        stop_song(message, server_queue)
    }
    else if (command === 'skip') {
        // INI BUAT skip
        skip_song(message, server_queue)
    }
})

const video_player = async (guild, song) => {
    const song_queue = queue.get(guild.id)

    if (!song) {
        song_queue.voice_channel.leave()
        queue.delete(guild.id)
    } else {
        const stream = ytdl(song.url, {filter: 'audioonly'})
    
        song_queue.connection.play(stream, {seek: 0, volume: 1})
            .on('finish', () => {
                song_queue.songs.shift();
                video_player(guild, song_queue.songs[0])
            })
    
        await song_queue.text_channel.send(`:man_bowing: Ini Baginda lagunya, ***${song.title}***.`)
    }
    
}

const skip_song = async (message, server_queue) => {
    if(!message.member.voice.channel) return message.channel.send('Harus di dalam voice channel bambank!')

    if (!server_queue) {
        return message.channel.send('Ga ada lagu di queue')
    }

    server_queue.connection.dispatcher.end()
}

const stop_song = async (message, server_queue) => {
    const isInVoiceChannel = message.member.voice.channel

    if (!isInVoiceChannel) {
        return message.channel.send('Harus di dalam voice channel bambank!')
    }

    server_queue.songs = []
    await server_queue.connection.dispatcher.end()
    await isInVoiceChannel.leave()
    await message.channel.send('Terima Kasih Baginda. :man_bowing:')
}

Client.login(process.env.BOT_TOKEN)