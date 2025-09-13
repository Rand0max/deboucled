///////////////////////////////////////////////////////////////////////////////////////
// DECENSURED USERS
///////////////////////////////////////////////////////////////////////////////////////

function createDecensuredUsersHeader() {
    if (document.querySelector(DECENSURED_CONFIG.SELECTORS.DEBOUCLED_HEADER_DECENSURED)) return;

    const headerAccount = findElement(DECENSURED_CONFIG.SELECTORS.HEADER_ACCOUNT_CONNECTED);
    if (!headerAccount) return;

    const headerDecensured = document.createElement('div');
    headerDecensured.className = 'headerAccount headerAccount--decensured';
    headerDecensured.id = 'deboucled-header-decensured';

    headerAccount.insertAdjacentElement('afterend', headerDecensured);

    const decensuredButton = document.createElement('span');
    decensuredButton.className = 'headerAccount__notif js-header-decensured';
    decensuredButton.id = 'deboucled-users-counter';
    decensuredButton.setAttribute('data-val', '0');
    decensuredButton.title = 'Cliquer pour voir les utilisateurs Décensured connectés';
    decensuredButton.style.cursor = 'pointer';

    const icon = document.createElement('i');
    icon.className = 'icon-people';
    icon.id = 'deboucled-users-counter-icon';

    decensuredButton.appendChild(icon);
    headerDecensured.appendChild(decensuredButton);

    decensuredButton.addEventListener('click', showDecensuredUsersModal);

    return decensuredButton;
}

async function createAndShowUsersModal(users, totalCount) {
    const existingModal = document.querySelector('.deboucled-users-modal');
    if (existingModal) {
        existingModal.remove();
    }

    const modal = document.createElement('div');
    modal.className = 'deboucled-users-modal';

    const sortedUsers = [...users].sort((a, b) => new Date(b.lastActiveDate) - new Date(a.lastActiveDate));

    const USERS_PER_PAGE = 15;
    let currentPage = 0;
    let isLoading = false;

    async function loadMoreUsers() {
        const startIndex = currentPage * USERS_PER_PAGE;
        const endIndex = Math.min(startIndex + USERS_PER_PAGE, sortedUsers.length);
        const usersToShow = sortedUsers.slice(startIndex, endIndex);

        if (usersToShow.length === 0) return;

        const modalBody = modal.querySelector('.deboucled-users-modal-body');
        const userContainer = modalBody.querySelector('.deboucled-users-container');

        if (!userContainer) return;

        const optionDisplayTopicAvatar = store.get(storage_optionDisplayTopicAvatar, storage_optionDisplayTopicAvatar_default);

        await Promise.all(usersToShow.map(async user => {
            const userItem = document.createElement('div');
            userItem.className = 'deboucled-user-item';

            const userLink = document.createElement('a');
            userLink.href = `https://www.jeuxvideo.com/profil/${encodeURIComponent(user.username.toLowerCase())}?mode=infos`;
            userLink.target = '_blank';
            userLink.rel = 'noopener noreferrer';
            userLink.className = 'deboucled-user-pseudo';

            if (optionDisplayTopicAvatar) {
                const userAvatar = document.createElement('img');
                userAvatar.className = 'deboucled-user-avatar';
                userAvatar.src = defaultAvatarUrl;
                userAvatar.alt = user.username;
                userAvatar.setAttribute('onerror', `this.onerror=null; this.src='${defaultAvatarUrl}';`);

                const avatarUrl = await getAuthorAvatarUrl(user.username.toLowerCase(), userLink.href);
                if (avatarUrl?.length) {
                    userAvatar.src = avatarUrl;
                }

                userLink.appendChild(userAvatar);
            }

            const usernameSpan = document.createElement('span');
            usernameSpan.textContent = user.username;
            userLink.appendChild(usernameSpan);

            const statusSpan = document.createElement('span');
            statusSpan.className = 'deboucled-user-status';
            statusSpan.textContent = `Actif ${formatTimeAgo(user.lastActiveDate)}`;

            userItem.appendChild(userLink);
            userItem.appendChild(statusSpan);
            userContainer.appendChild(userItem);
        }));

        currentPage++;

        await saveLocalStorage();

        if (endIndex >= sortedUsers.length) {
            const loader = modalBody.querySelector('.deboucled-users-loader');
            if (loader) loader.style.display = 'none';
        }
    }

    modal.innerHTML = `
        <div class="deboucled-users-modal-content">
            <div class="deboucled-users-modal-header">
                <h3><span class="deboucled-decensured-premium-logo users"></span> Utilisateurs Décensured en ligne (${totalCount})</h3>
                <button class="deboucled-users-modal-close">×</button>
            </div>
            <div class="deboucled-users-modal-body">
                ${sortedUsers.length === 0 ?
            '<div class="deboucled-no-users">Aucun utilisateur connecté</div>' :
            `<div class="deboucled-users-container"></div>
                     <div class="deboucled-users-loader">
                         <div class="deboucled-loading-text">Chargement...</div>
                     </div>`
        }
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    const modalBody = modal.querySelector('.deboucled-users-modal-body');
    const loader = modal.querySelector('.deboucled-users-loader');

    if (loader) {
        loader.style.display = sortedUsers.length > USERS_PER_PAGE ? 'block' : 'none';
    }

    if (sortedUsers.length > 0) {
        await loadMoreUsers();
    }

    if (modalBody && sortedUsers.length > USERS_PER_PAGE) {
        modalBody.addEventListener('scroll', () => {
            if (isLoading) return;

            const { scrollTop, scrollHeight, clientHeight } = modalBody;
            const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;
            const isNearBottom = scrollPercentage >= 0.8;

            if (isNearBottom && currentPage * USERS_PER_PAGE < sortedUsers.length) {
                isLoading = true;

                if (loader) loader.style.display = 'block';

                setTimeout(async () => {
                    await loadMoreUsers();
                    isLoading = false;
                }, DECENSURED_CONFIG.ANIMATION_DELAY);
            }
        });
    }

    const closeButton = modal.querySelector('.deboucled-users-modal-close');
    if (closeButton) {
        closeButton.addEventListener('click', () => modal.remove());
    }

    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });

    const handleEscape = (e) => {
        if (e.key === 'Escape') {
            modal.remove();
            document.removeEventListener('keydown', handleEscape);
        }
    };
    document.addEventListener('keydown', handleEscape);
}

function toggleDecensuredUsersCountDisplay() {
    const headerElement = document.querySelector(DECENSURED_CONFIG.SELECTORS.DEBOUCLED_HEADER_DECENSURED);
    const isEnabled = store.get(storage_optionDisplayDecensuredUsersCount, storage_optionDisplayDecensuredUsersCount_default);

    if (headerElement) {
        headerElement.style.display = isEnabled ? '' : 'none';
    }
}

async function startDecensuredUsersMonitoring() {
    if (!store.get(storage_optionDisplayDecensuredUsersCount, storage_optionDisplayDecensuredUsersCount_default)) {
        return;
    }
    if (decensuredUsersTimer) return;
    loadDecensuredStatsData();
    decensuredUsersTimer = setInterval(loadDecensuredStatsData, DECENSURED_CONFIG.USERS_REFRESH_INTERVAL);
}

function updateDecensuredStatsOnlineCount(count) {
    const button = document.querySelector(DECENSURED_CONFIG.SELECTORS.DEBOUCLED_USERS_COUNTER);
    if (!button) return;

    button.setAttribute('data-val', count);

    button.classList.toggle('headerAccount__notif--hasNotif', count > 0);
}

function toggleDecensuredBadgesDisplay() {
    const isEnabled = store.get(storage_optionEnableDecensuredBadges, storage_optionEnableDecensuredBadges_default);
    const badges = document.querySelectorAll(DECENSURED_CONFIG.SELECTORS.DEBOUCLED_DECENSURED_BADGE);

    badges.forEach(badge => {
        badge.style.display = isEnabled ? '' : 'none';
    });
}
