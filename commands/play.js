const ytdl = require('ytdl-core')
const ytSearch = require('yt-search')

const queue = new Map();

module.exports = {
    name: "play",
    description: "Join and plays a video from youtube",
    async execute(message, args) {
        const isInVoiceChannel = message.member.voice.channel

        if (!isInVoiceChannel) {
            return message.channel.send('Harus di dalam voice channel bambank!')
        }

        const permissions = isInVoiceChannel.permissionsFor(message.client.user);
        if (!permissions.has('CONNECT') || !permissions.has('SPEAK')) {
            return message.channel.send('Ye gabisa masuk karna gapunya akses ye')
        }

        const server_queue = queue.get(message.guild.id)

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
    }
}

const video_player = async (guild, song) => {
    const song_queue = queue.get(guild.id)

    if (!song) {
        song_queue.voice_channel.leave()
        queue.delete(guild.id)
    }

    const stream = ytdl(song.url, {filter: 'audioonly'})

    song_queue.connection.play(stream, {seek: 0, volume: 1})
        .on('finish', () => {
            song_queue.songs.shift();
            video_player(guild, song_queue.songs[0])
        })

    await song_queue.text_channel.send(`:man_bowing: Ini Baginda lagunya, ***${song.title}***.`)
}