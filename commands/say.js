module.exports = {
    data: {
        name: "say",
        description: "say ♥",
        options: [{ name: "test", description: "test", type: 3, required: true }], // { name: "", description: "", type: 3, required: true }
        permissions: ['ADMINISTRATOR'] // Discord Permissions
    },
    async execute(interaction) {
        const inputValue = interaction.options.getString('test');
        await interaction.reply(inputValue);
    },
};