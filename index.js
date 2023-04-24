const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection } = require('discord.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const discordPermissions = [
    'CREATE_INSTANT_INVITE', 'KICK_MEMBERS', 'BAN_MEMBERS', 'ADMINISTRATOR', 'MANAGE_CHANNELS',
    'MANAGE_GUILD', 'ADD_REACTIONS', 'VIEW_AUDIT_LOG', 'PRIORITY_SPEAKER', 'STREAM',
    'VIEW_CHANNEL', 'SEND_MESSAGES', 'SEND_TTS_MESSAGES', 'MANAGE_MESSAGES', 'EMBED_LINKS',
    'ATTACH_FILES', 'READ_MESSAGE_HISTORY', 'MENTION_EVERYONE', 'USE_EXTERNAL_EMOJIS', 'VIEW_GUILD_INSIGHTS',
    'CONNECT', 'SPEAK', 'MUTE_MEMBERS', 'DEAFEN_MEMBERS', 'MOVE_MEMBERS',
    'USE_VAD', 'CHANGE_NICKNAME', 'MANAGE_NICKNAMES', 'MANAGE_ROLES', 'MANAGE_WEBHOOKS',
    'MANAGE_EMOJIS_AND_STICKERS', 'USE_APPLICATION_COMMANDS', 'REQUEST_TO_SPEAK', 'MANAGE_THREADS', 'USE_PUBLIC_THREADS',
    'USE_PRIVATE_THREADS', 'USE_EXTERNAL_STICKERS',
]
const { token, clientId } = require('./config.json');
const client = new Client({ intents: ['GUILDS'] });

client.on('ready', () => {
    client.commands = new Collection();

    const commandsPath = path.join(__dirname, 'commands');
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        // Set a new item in the Collection with the key as the command name and the value as the exported module
        if ('data' in command && 'execute' in command) {

            if ('name' in command.data && 'description' in command.data) {
                if (command.data.permissions) {
                    for (let i = 0; i < command.data.permissions.length; i++) {
                        if (!discordPermissions.includes(command.data.permissions[i])) {
                            throw `unknown permission type ( "${command.data.permissions[i]}" )`;
                        }
                    }
                    client.commands.set(command.data.name, command);
                } else {
                    client.commands.set(command.data.name, command);
                }
            } else {
                console.log(`[WARNING] The command at ${filePath} is missing a required "name" or "description" property.`);
            }

        } else {
            console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
        }
    }

    console.log(`client is ready with \`${client.commands.size}\` commands`);
    const rest = new REST({ version: '9' }).setToken(token);

    // and deploy your commands!
    (async () => {
        try {
            const rowCommands = [];
            client.commands.forEach(element => {
                rowCommands.push(
                    {
                        name: element.data.name,
                        description: element.data.description,
                        options: element.data.options
                    }
                )
            });

            // The put method is used to fully refresh all commands in the guild with the current set
            const data = await rest.put(
                Routes.applicationCommands(clientId),
                { body: rowCommands },
            );

            console.log(`Successfully reloaded application (/) commands.`);
        } catch (error) {
            console.error(error);
        }
    })();
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
        console.error(`No command matching ${interaction.commandName} was found.`);
        return;
    }

    try {
        const permissions = command.data.permissions;
        for (let i = 0; i < permissions.length; i++) {
            if (!interaction.member.permissions.has(permissions[i])) {
                interaction.reply({ ephemeral: true, content: 'you dont have permission to run this command' });
                return;
            }
        }
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
        } else {
            await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
        }
    }
});

client.login(token);