module.exports = {
    name: "stop",
    description: "Stop the music and leave the channel",
    async execute(message, args) {
        const isInVoiceChannel = message.member.voice.channel

        if (!isInVoiceChannel) {
            return message.channel.send('Harus di dalam voice channel bambank!')
        }

        await isInVoiceChannel.leave()
        await message.channel.send('Terima Kasih Baginda. :man_bowing:')
    }
}