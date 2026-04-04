document.addEventListener('DOMContentLoaded', () => {
    // --- Elements ---
    const loginSection = document.getElementById('loginSection');
    const dashboardSection = document.getElementById('dashboardSection');
    const loginForm = document.getElementById('loginForm');
    const loginError = document.getElementById('loginError');
    const passwordInput = document.getElementById('adminPassword');
    const messagesGrid = document.getElementById('messagesGrid');
    const loader = document.getElementById('loader');
    const emptyState = document.getElementById('emptyState');
    const messageCountSpan = document.getElementById('messageCount');
    const refreshBtn = document.getElementById('refreshBtn');
    const logoutBtn = document.getElementById('logoutBtn');

    // --- State ---
    let currentPassword = sessionStorage.getItem('portfolioAdminPin') || null;

    // --- Initial Check ---
    if (currentPassword) {
        authenticate(currentPassword, true);
    }

    // --- Events ---
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const pin = passwordInput.value.trim();
        if (pin) {
            authenticate(pin, false);
        }
    });

    logoutBtn.addEventListener('click', () => {
        sessionStorage.removeItem('portfolioAdminPin');
        currentPassword = null;
        dashboardSection.style.display = 'none';
        loginSection.style.display = 'flex';
        passwordInput.value = '';
        loginError.textContent = '';
    });

    refreshBtn.addEventListener('click', () => {
        if (currentPassword) {
            fetchMessages(currentPassword);
            
            // Spin animation
            const icon = refreshBtn.querySelector('i');
            icon.classList.add('fa-spin');
            setTimeout(() => icon.classList.remove('fa-spin'), 1000);
        }
    });

    // --- Core Functions ---
    async function authenticate(pin, isAutoLogin) {
        if (!isAutoLogin) {
            loginError.innerHTML = '<span style="color:var(--text-muted)"><i class="fas fa-spinner fa-spin"></i> Authenticating...</span>';
        }

        try {
            const response = await fetch('/api/contacts', {
                method: 'GET',
                headers: {
                    'x-admin-password': pin
                }
            });

            if (response.ok) {
                const data = await response.json();
                
                // Success
                currentPassword = pin;
                sessionStorage.setItem('portfolioAdminPin', pin);
                
                loginSection.style.display = 'none';
                dashboardSection.style.display = 'flex';
                
                renderMessages(data.data, data.count);
            } else {
                // Fail
                if (!isAutoLogin) {
                    loginError.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Access Denied. Invalid PIN.';
                } else {
                    // Auto login failed (maybe password changed)
                    sessionStorage.removeItem('portfolioAdminPin');
                    currentPassword = null;
                }
            }
        } catch (error) {
            console.error('Auth Error:', error);
            if (!isAutoLogin) {
                loginError.innerHTML = '<i class="fas fa-satellite-dish"></i> Connection Failed.';
            }
        }
    }

    async function fetchMessages(pin) {
        loader.style.display = 'flex';
        messagesGrid.style.display = 'none';
        emptyState.style.display = 'none';

        try {
            const response = await fetch('/api/contacts', {
                method: 'GET',
                headers: { 'x-admin-password': pin }
            });

            if (response.ok) {
                const data = await response.json();
                renderMessages(data.data, data.count);
            } else if (response.status === 401) {
                // Session expired / password changed
                logoutBtn.click();
            }
        } catch (error) {
            console.error('Fetch Error:', error);
            loader.innerHTML = '<p style="color:var(--danger)">Failed to decrypt records.</p>';
        }
    }

    function renderMessages(messages, count) {
        loader.style.display = 'none';
        messagesGrid.innerHTML = '';
        
        messageCountSpan.textContent = `${count} Message${count !== 1 ? 's' : ''}`;

        if (!messages || messages.length === 0) {
            emptyState.style.display = 'block';
            messagesGrid.style.display = 'none';
            return;
        }

        emptyState.style.display = 'none';
        messagesGrid.style.display = 'grid';

        messages.forEach((msg, index) => {
            const card = document.createElement('div');
            card.className = 'glass-panel msg-card';
            card.style.animationDelay = `${index * 0.1}s`;

            const date = new Date(msg.created_at);
            const formattedDate = date.toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
            });

            card.innerHTML = `
                <div class="msg-header">
                    <div class="msg-sender">
                        <h3>${escapeHtml(msg.name)}</h3>
                        <div class="msg-email"><i class="fas fa-envelope"></i> ${escapeHtml(msg.email)}</div>
                    </div>
                </div>
                <button class="delete-btn" data-id="${msg.id}" title="Delete Message">
                    <i class="fas fa-trash-alt"></i>
                </button>
                <div class="msg-body">${escapeHtml(msg.message)}</div>
                <div class="msg-footer">
                    <div class="msg-phone">
                        <i class="fas fa-phone-alt"></i> ${msg.phone ? escapeHtml(msg.phone) : 'Unknown'}
                    </div>
                    <div class="msg-date">${formattedDate}</div>
                </div>
                <span style="position:absolute; top:15px; right:15px;" class="msg-id">ID: ${msg.id}</span>
            `;
            
            messagesGrid.appendChild(card);

            // Attach delete listener
            const deleteBtn = card.querySelector('.delete-btn');
            deleteBtn.addEventListener('click', () => {
                if (confirm('Are you sure you want to permanently delete this message?')) {
                    deleteMessage(msg.id, card, deleteBtn);
                }
            });
        });
    }

    async function deleteMessage(id, cardElement, btnElement) {
        // Disable button pending request
        btnElement.disabled = true;
        btnElement.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

        try {
            const response = await fetch(`/api/contacts/${id}`, {
                method: 'DELETE',
                headers: { 'x-admin-password': currentPassword }
            });

            if (response.ok) {
                // Animate removal
                cardElement.classList.add('deleting');
                
                // Remove from DOM after animation completes
                setTimeout(() => {
                    cardElement.remove();
                    // Update count visually
                    const currentCount = parseInt(messageCountSpan.textContent) || 1;
                    const newCount = currentCount - 1;
                    messageCountSpan.textContent = `${newCount} Message${newCount !== 1 ? 's' : ''}`;
                    
                    if (newCount === 0) {
                        emptyState.style.display = 'block';
                        messagesGrid.style.display = 'none';
                    }
                }, 500); // 500ms matches css animation duration
            } else {
                alert('Failed to delete message. It may have already been removed.');
                btnElement.disabled = false;
                btnElement.innerHTML = '<i class="fas fa-trash-alt"></i>';
            }
        } catch (error) {
            console.error('Delete Error:', error);
            alert('Connection error while trying to delete.');
            btnElement.disabled = false;
            btnElement.innerHTML = '<i class="fas fa-trash-alt"></i>';
        }
    }

    function escapeHtml(unsafe) {
        if (!unsafe) return '';
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
});
