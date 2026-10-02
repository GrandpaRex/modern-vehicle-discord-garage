fx_version 'cerulean'
game 'gta5'

author 'Grandpa_Rex'
description 'Discord based garage'
version '2.0.0'

dependency 'night_discordapi'

ui_page 'html/index.html'

client_scripts {
    'config.lua',
    'customization.lua',
    'client.lua'
}

server_scripts {
    'config.lua',
    'customization.lua',
    'server.lua'
}

files {
    'html/index.html',
    'html/style.css',
    'html/script.js'
}
