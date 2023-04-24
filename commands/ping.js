module.exports = {
    data: {
        name: "ping",
        description: "say pong",
        options: [],
        permissions: []
    },
    async execute(interaction) {
        await interaction.reply("Pong 💫");
    },
};
