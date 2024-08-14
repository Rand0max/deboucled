
///////////////////////////////////////////////////////////////////////////////////////
// HEADER
///////////////////////////////////////////////////////////////////////////////////////

function buildHeaderNotifQuotes(markAllReadFn) {
    const headerPm = document.querySelector('.headerAccount--pm');
    if (!headerPm) return;

    // Main Header container
    const headerQuotes = document.createElement('div');
    headerQuotes.className = 'headerAccount headerAccount--notif dropdown deboucled-header-quotes';
    headerQuotes.id = 'deboucled-header-quotes';

    headerPm.insertAdjacentElement('afterend', headerQuotes);

    // Header menu button
    const hqMenu = document.createElement('span');
    hqMenu.className = 'headerAccount__notif js-header-menu-dropdown js-header-notif-quotes';
    hqMenu.id = 'deboucled-header-quotes-menu';
    hqMenu.setAttribute('data-val', '0');
    hqMenu.setAttribute('data-bs-toggle', 'dropdown');
    hqMenu.setAttribute('data-bs-display', 'static');
    hqMenu.setAttribute('list-loaded', '2');
    hqMenu.setAttribute('aria-expanded', 'false');

    headerQuotes.append(hqMenu);

    // Header icon
    const hqIcon = document.createElement('i');
    hqIcon.className = `deboucled-quoteround-logo${preferDarkTheme() ? ' dark' : ''}`;

    hqMenu.append(hqIcon);

    // Header dropdown container
    const hqDropdownContainer = document.createElement('div');
    hqDropdownContainer.className = 'dropdown-menu headerAccount__dropdownContainer';

    headerQuotes.append(hqDropdownContainer);

    // Header dropdown container top
    const hqDropdownContainerTop = document.createElement('div');
    hqDropdownContainerTop.className = 'headerAccount__dropdownContainerTop';

    hqDropdownContainer.append(hqDropdownContainerTop);

    // Header dropdown container top title
    const hqDropdownContainerTopTitle = document.createElement('span');
    hqDropdownContainerTopTitle.className = 'headerAccount__dropdownTitle';
    hqDropdownContainerTopTitle.textContent = 'Citations';

    hqDropdownContainerTop.append(hqDropdownContainerTopTitle);

    // Header dropdown container top link
    const hqDropdownContainerTopLink = document.createElement('span');
    hqDropdownContainerTopLink.className = 'headerAccount__dropdownLink js-header-notif-reset';
    hqDropdownContainerTopLink.textContent = 'Tout marquer comme lu';
    hqDropdownContainerTopLink.onclick = markAllReadFn;

    hqDropdownContainerTop.append(hqDropdownContainerTopLink);

    // Header dropdown container content
    const hqDropdownContainerContent = document.createElement('div');
    hqDropdownContainerContent.className = 'headerAccount__dropdownContainerContent js-header-dropdown-content';
    hqDropdownContainerContent.id = 'deboucled-header-quotes-content';

    hqDropdownContainer.append(hqDropdownContainerContent);

    return hqDropdownContainerContent;
}

function getHeaderNotifQuotesCount() {
    const quotesContainerElement = document.querySelector('#deboucled-header-quotes-menu');
    if (!quotesContainerElement) return;
    const notifCount = parseInt(quotesContainerElement.getAttribute('data-val'));
    return notifCount;
}

function setHeaderNotifQuotesCount(value) {
    if (value < 0) value = 0;
    const quotesContainerElement = document.querySelector('#deboucled-header-quotes-menu');
    if (!quotesContainerElement) return;
    quotesContainerElement.setAttribute('data-val', value);
    quotesContainerElement.classList.toggle('headerAccount__notif--hasNotif', (value > 0));
    return quotesContainerElement;
}

function buildHeaderNotif(notifSeen, notifRead, notifTitle, notifId, notifUrl, notifUrlDescription, notifSubInfo, notifDate) {
    const notifSeenClass = notifSeen ? '' : ' js-header-unread';
    const notifReadClass = notifRead ? '' : ' headerAccount__dropdownItem--unread';

    const rootDropdownItem = document.createElement('div');
    rootDropdownItem.className = `headerAccount__dropdownItem${notifSeenClass}${notifReadClass} deboucled-quote-notif`;
    rootDropdownItem.setAttribute('data-id', notifId);

    const dropdownDetails = document.createElement('div');
    dropdownDetails.className = 'headerAccount__dropdownDetails';
    rootDropdownItem.append(dropdownDetails);

    const dropdownSubInfoAuthor = document.createElement('div');
    dropdownSubInfoAuthor.className = 'headerAccount__dropdownSubInfo headerAccount__dropdownSubInfo--author';
    dropdownSubInfoAuthor.innerHTML = `<small>${notifTitle}</small>`;
    dropdownDetails.append(dropdownSubInfoAuthor);

    const dropdownItemLabel = document.createElement('a');
    dropdownItemLabel.className = 'headerAccount__dropdownItemLabel stretched-link js-header-open-notif';
    dropdownItemLabel.href = notifUrl;
    dropdownItemLabel.title = notifUrlDescription;
    dropdownItemLabel.innerHTML = `<strong>${notifUrlDescription}</strong>`;
    dropdownDetails.append(dropdownItemLabel);

    const dropdownSubInfoFooter = document.createElement('span');
    dropdownSubInfoFooter.className = 'headerAccount__dropdownSubInfo';
    rootDropdownItem.append(dropdownSubInfoFooter);

    const dropdownSubInfoFooterLabel = document.createElement('span');
    dropdownSubInfoFooterLabel.className = 'headerAccount__dropdownSubInfoLabel icon-reply deboucled-header-subinfolabel';
    dropdownSubInfoFooterLabel.textContent = notifSubInfo;
    dropdownSubInfoFooter.append(dropdownSubInfoFooterLabel);

    const dropdownSubInfoFooterDate = document.createElement('span');
    dropdownSubInfoFooterDate.className = 'headerAccount__dropdownSubInfoDate';
    dropdownSubInfoFooterDate.textContent = notifDate;
    dropdownSubInfoFooter.append(dropdownSubInfoFooterDate);

    return rootDropdownItem;
}

async function buildQuoteNotifications() {
    const hqDropdownContainerContent = buildHeaderNotifQuotes(markReadAllQuoteNotifications);
    if (!hqDropdownContainerContent) return;

    setHeaderNotifQuotesCount(messageQuotesData.filter(q => !q.notification_read).length)

    messageQuotesData.forEach(q => {
        const notifChildElement = buildHeaderNotif(
            q.notification_read,
            q.notification_read,
            `Citation de <b>${q.new_message_username.toUpperCase()}</b>`,
            q.new_message_id,
            q.new_message_url,
            q.topic_title,
            q.new_message_content, //.slice(0, 20),
            formatDateToFrenchFormat(new Date(q.creation_date), true)
        );
        hqDropdownContainerContent.append(notifChildElement);
        notifChildElement.onmousedown = () => markQuoteNotifRead(notifChildElement, q.id);
    });

    document.querySelector('.toggleTheme').addEventListener('click', () => {
        document.querySelector('i.deboucled-quoteround-logo').classList.toggle('dark');

        if (preferDarkTheme() !== document.querySelector('#deboucled_optionEnableDeboucledDarkTheme').checked) {
            document.querySelector('#deboucled_optionEnableDeboucledDarkTheme').click();
        }
    });
}

async function markReadAllQuoteNotifications() {
    await updateMessageQuote(userId, userPseudo.toLowerCase(), 'true');

    messageQuotesData.forEach(q => q.notification_read = true);
    store.set(storage_messageQuotesData, JSON.stringify(messageQuotesData));

    const notifContainer = document.querySelector('#deboucled-header-quotes-content');
    if (!notifContainer) return;
    notifContainer.querySelectorAll('.deboucled-quote-notif').forEach(qn => {
        qn.classList.remove('headerAccount__dropdownItem--unread');
        qn.classList.remove('js-header-unread');
    });

    setHeaderNotifQuotesCount(0);
}

async function markQuoteNotifRead(notifChildElement, notifId) {
    if (!notifChildElement || !notifId) return;
    notifChildElement.classList.remove('headerAccount__dropdownItem--unread');
    notifChildElement.classList.remove('js-header-unread');

    const currentNotifCount = getHeaderNotifQuotesCount();
    setHeaderNotifQuotesCount(currentNotifCount - 1);

    await updateMessageQuote(userId, userPseudo.toLowerCase(), 'true', notifId);

    const mqElem = messageQuotesData.find(q => q.id === notifId);
    if (mqElem) {
        mqElem.notification_read = true;
        store.set(storage_messageQuotesData, JSON.stringify(messageQuotesData));
    }
}

