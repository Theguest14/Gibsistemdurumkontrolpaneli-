const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files from public folder
app.use(express.static(path.join(__dirname, 'public')));

// Fallback: also serve from root for existing files
app.use(express.static(__dirname));

// Shared system state
let systemState = {
    busy: false,
    userName: null,
    loginTime: null,
    activeSocketId: null
};

io.on('connection', (socket) => {
    console.log(`[+] Kullanıcı bağlandı: ${socket.id}`);

    // Send current state to newly connected client
    socket.emit('state-update', {
        busy: systemState.busy,
        userName: systemState.userName,
        loginTime: systemState.loginTime
    });

    // Handle login attempt
    socket.on('login', (data) => {
        if (systemState.busy) {
            socket.emit('login-rejected', { reason: 'Sistem şu anda meşgul.' });
            return;
        }

        systemState.busy = true;
        systemState.userName = data.name;
        systemState.loginTime = new Date().toISOString();
        systemState.activeSocketId = socket.id;

        console.log(`[>] Giriş yapıldı: ${data.name}`);

        // Broadcast new state to ALL clients
        io.emit('state-update', {
            busy: systemState.busy,
            userName: systemState.userName,
            loginTime: systemState.loginTime
        });
    });

    // Handle logout
    socket.on('logout', () => {
        if (systemState.activeSocketId === socket.id) {
            console.log(`[<] Çıkış yapıldı: ${systemState.userName}`);
            resetState();
            io.emit('state-update', {
                busy: false,
                userName: null,
                loginTime: null
            });
        }
    });

    // Handle disconnect (user closes browser/tab)
    socket.on('disconnect', () => {
        console.log(`[-] Kullanıcı ayrıldı: ${socket.id}`);
        if (systemState.activeSocketId === socket.id) {
            console.log(`[!] Aktif kullanıcı bağlantısı koptu: ${systemState.userName}`);
            resetState();
            io.emit('state-update', {
                busy: false,
                userName: null,
                loginTime: null
            });
        }
    });
});

function resetState() {
    systemState.busy = false;
    systemState.userName = null;
    systemState.loginTime = null;
    systemState.activeSocketId = null;
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`\n========================================`);
    console.log(`  GİB Sistem Durum Paneli çalışıyor`);
    console.log(`  Yerel test için: http://localhost:${PORT}`);
    console.log(`  Ağdaki cihazlar için: http://192.168.1.9:${PORT}`);
    console.log(`========================================\n`);
});
