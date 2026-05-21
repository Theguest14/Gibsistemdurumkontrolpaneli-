(() => {
    'use strict';

    // DOM Elements
    const statusCard = document.getElementById('statusCard');
    const statusDot = document.getElementById('statusDot');
    const statusPulse = document.getElementById('statusPulse');
    const statusText = document.getElementById('statusText');
    const loginPanel = document.getElementById('loginPanel');
    const sessionPanel = document.getElementById('sessionPanel');
    const nameInput = document.getElementById('nameInput');
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const userName = document.getElementById('userName');
    const userAvatar = document.getElementById('userAvatar');
    const loginTime = document.getElementById('loginTime');
    const sessionDuration = document.getElementById('sessionDuration');
    const timestampEl = document.getElementById('timestamp');

    let sessionStartTime = null;
    let durationInterval = null;
    let isOwner = false; // true if THIS client is the one who logged in

    // --- Socket.IO Connection ---
    const socket = io();

    // --- Clock ---
    function updateClock() {
        const now = new Date();
        timestampEl.textContent = now.toLocaleDateString('tr-TR', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        }) + ' \u2022 ' + now.toLocaleTimeString('tr-TR');
    }
    updateClock();
    setInterval(updateClock, 1000);

    // --- Receive state updates from server (real-time for ALL clients) ---
    socket.on('state-update', (state) => {
        if (state.busy) {
            showBusyState(state.userName, state.loginTime);
        } else {
            showAvailableState();
        }
    });

    // --- Login rejected (system already busy) ---
    socket.on('login-rejected', (data) => {
        alert(data.reason);
    });

    // --- Input validation ---
    nameInput.addEventListener('input', () => {
        loginBtn.disabled = nameInput.value.trim().length === 0;
    });

    nameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !loginBtn.disabled) {
            loginBtn.click();
        }
    });

    // --- Login: send to server ---
    loginBtn.addEventListener('click', () => {
        const name = nameInput.value.trim();
        if (!name) return;
        isOwner = true;
        socket.emit('login', { name: name });
    });

    // --- Logout: send to server ---
    logoutBtn.addEventListener('click', () => {
        isOwner = false;
        socket.emit('logout');
    });

    // --- UI State Functions ---
    function showBusyState(name, serverLoginTime) {
        // Status indicator -> red
        statusCard.classList.remove('available');
        statusCard.classList.add('busy');
        statusDot.classList.add('busy');
        statusPulse.classList.add('busy', 'active');
        statusText.classList.add('busy');
        statusText.textContent = 'ME\u015eGUL';

        // User info
        userName.textContent = name;
        userAvatar.textContent = getInitials(name);

        // Login time
        sessionStartTime = new Date(serverLoginTime);
        loginTime.textContent = sessionStartTime.toLocaleTimeString('tr-TR');

        // Start duration timer
        clearInterval(durationInterval);
        updateDuration();
        durationInterval = setInterval(updateDuration, 1000);

        // Show session panel, hide login panel
        loginPanel.classList.add('hidden');
        sessionPanel.classList.remove('hidden');
        sessionPanel.style.animation = 'none';
        void sessionPanel.offsetHeight;
        sessionPanel.style.animation = '';

        // Only show logout button if this client is the owner
        logoutBtn.style.display = isOwner ? '' : 'none';
    }

    function showAvailableState() {
        // Status indicator -> green
        statusCard.classList.remove('busy');
        statusCard.classList.add('available');
        statusDot.classList.remove('busy');
        statusPulse.classList.remove('busy');
        statusPulse.classList.add('active');
        statusText.classList.remove('busy');
        statusText.textContent = 'M\u00dcSA\u0130T';

        // Stop timer
        clearInterval(durationInterval);
        durationInterval = null;
        sessionStartTime = null;

        // Show login panel, hide session panel
        sessionPanel.classList.add('hidden');
        loginPanel.classList.remove('hidden');
        loginPanel.style.animation = 'none';
        void loginPanel.offsetHeight;
        loginPanel.style.animation = '';

        // Clear input
        nameInput.value = '';
        loginBtn.disabled = true;
        isOwner = false;
    }

    // --- Helpers ---
    function getInitials(name) {
        return name
            .split(' ')
            .filter(Boolean)
            .map(w => w[0].toUpperCase())
            .slice(0, 2)
            .join('');
    }

    function updateDuration() {
        if (!sessionStartTime) return;
        const diff = Math.floor((Date.now() - sessionStartTime.getTime()) / 1000);
        const hrs = Math.floor(diff / 3600);
        const mins = Math.floor((diff % 3600) / 60);
        const secs = diff % 60;

        if (hrs > 0) {
            sessionDuration.textContent =
                String(hrs).padStart(2, '0') + ':' +
                String(mins).padStart(2, '0') + ':' +
                String(secs).padStart(2, '0');
        } else {
            sessionDuration.textContent =
                String(mins).padStart(2, '0') + ':' +
                String(secs).padStart(2, '0');
        }
    }

    // Initial state
    statusCard.classList.add('available');
    statusPulse.classList.add('active');
})();
