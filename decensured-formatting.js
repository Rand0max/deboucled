///////////////////////////////////////////////////////////////////////////////////////
// DECENSURED FORMATTING
///////////////////////////////////////////////////////////////////////////////////////

function formatSpoilers(text) {
    return text.replace(DECENSURED_CONFIG.FORMATTING_REGEX.spoilers, (match, content) => {
        return `<span class="JvCare JvCare--masked" data-tooltip="Cliquer pour révéler"><span class="JvCare-content">${content.trim()}</span></span>`;
    });
}

function formatCodeBlocks(text) {
    return text.replace(DECENSURED_CONFIG.FORMATTING_REGEX.codeBlocks, (match, content) => {
        const cleanContent = content.trim().replace(/\n/g, '\n');
        return `<pre class="pre-jv"><code class="code-jv">${cleanContent}</code></pre>`;
    });
}

function formatInlineCode(text) {
    return text.replace(DECENSURED_CONFIG.FORMATTING_REGEX.inlineCode, '<code class="jv-code">$1</code>');
}

function formatJvcBold(text) {
    return text.replace(DECENSURED_CONFIG.FORMATTING_REGEX.jvcBold, '<strong>$1</strong>');
}

function formatJvcItalic(text) {
    return text.replace(DECENSURED_CONFIG.FORMATTING_REGEX.jvcItalic, '<em>$1</em>');
}

function formatJvcUnderline(text) {
    return text.replace(DECENSURED_CONFIG.FORMATTING_REGEX.jvcUnderline, '<u>$1</u>');
}

function formatJvcStrikethrough(text) {
    return text.replace(DECENSURED_CONFIG.FORMATTING_REGEX.jvcStrikethrough, '<s>$1</s>');
}

function formatJvcCode(text) {
    return text.replace(DECENSURED_CONFIG.FORMATTING_REGEX.jvcCode, '<code>$1</code>');
}

function formatJvcSpoiler(text) {
    return text.replace(DECENSURED_CONFIG.FORMATTING_REGEX.jvcSpoiler, (match, content) => {
        const spoilerId = Math.random().toString(36).substr(2, DECENSURED_CONFIG.SPOILER_ID_LENGTH);
        return `<div class="bloc-spoil-jv"><input type="checkbox" id="${spoilerId}" class="open-spoil"><label class="barre-head" for="${spoilerId}"><span class="txt-spoil">Spoil</span><span class="aff-spoil">Afficher</span><span class="masq-spoil">Masquer</span></label><div class="contenu-spoil"><p>${content}</p></div></div>`;
    });
}

function formatJvcLists(text) {
    // Listes à puces avec *
    text = text.replace(DECENSURED_CONFIG.FORMATTING_REGEX.bulletList, (match, items) => {
        const listItems = items.split('\n').filter(line => line.trim().startsWith('*')).map(line => {
            const content = line.trim().substring(1).trim();
            return `  <li>${content}</li>`;
        }).join('\n');
        return `<ul class="liste-default-jv">\n${listItems}\n</ul>`;
    });

    // Listes numérotées avec #
    text = text.replace(DECENSURED_CONFIG.FORMATTING_REGEX.numberedList, (match, items) => {
        const listItems = items.split('\n').filter(line => line.trim().startsWith('#')).map(line => {
            const content = line.trim().substring(1).trim();
            return `  <li>${content}</li>`;
        }).join('\n');
        return `<ol class="liste-default-jv">\n${listItems}\n</ol>`;
    });

    return text;
}

function formatJvcBlockquotes(text) {
    return text.replace(DECENSURED_CONFIG.FORMATTING_REGEX.blockquote, (match, quote) => {
        const quotedText = quote.split('\n').map(line => line.trim().substring(1).trim()).join('<br>');
        return `<blockquote class="blockquote-jv"><p>${quotedText}</p></blockquote>`;
    });
}

function formatBoldAndItalicText(text) {
    return text.replace(DECENSURED_CONFIG.FORMATTING_REGEX.combined, (match, bold1, boldContent1, bold2, boldContent2, italic1, italicContent1, italic2, italicContent2) => {
        if (bold1) return `<strong>${boldContent1}</strong>`;
        if (bold2) return `<strong>${boldContent2}</strong>`;
        if (italic1) return `<em>${italicContent1}</em>`;
        if (italic2) return `<em>${italicContent2}</em>`;
        return match;
    });
}

function formatStrikethrough(text) {
    return text.replace(DECENSURED_CONFIG.FORMATTING_REGEX.strikethrough, '<del>$1</del>');
}

function formatImages(text) {
    return text.replace(/https:\/\/(?:www\.|image\.)?noelshack\.com\/[^\s<>"']+\.(png|jpg|jpeg|gif|webp)/gi, (match) => {
        const imageUrl = match;
        let miniUrl;

        if (match.includes('/minis/')) {
            miniUrl = imageUrl;
        } else if (match.includes('/fichiers/')) {
            miniUrl = match.replace('/fichiers/', '/minis/').replace(/\.(jpg|jpeg|gif|webp)$/i, '.png');
        } else if (match.includes('www.noelshack.com/') && match.match(/\/\d{4}-\d{2}-\d-\d+-/)) {
            const urlParts = match.match(/https:\/\/www\.noelshack\.com\/(\d{4})-(\d{2})-(\d)-(\d+-)(.+)\.(png|jpg|jpeg|gif|webp)/i);
            if (urlParts) {
                const [, year, week, day, timestamp, fileName, extension] = urlParts;
                const fichiersUrl = `https://image.noelshack.com/fichiers/${year}/${week}/${day}/${timestamp}${fileName}.${extension}`;
                miniUrl = fichiersUrl.replace('/fichiers/', '/minis/').replace(/\.(jpg|jpeg|gif|webp)$/i, '.png');
            } else {
                miniUrl = imageUrl;
            }
        } else if (match.includes('www.noelshack.com/')) {
            miniUrl = match.replace('www.noelshack.com/', 'image.noelshack.com/minis/').replace(/\.(jpg|jpeg|gif|webp)$/i, '.png');
        } else {
            miniUrl = match.replace('noelshack.com/', 'noelshack.com/minis/').replace(/\.(jpg|jpeg|gif|webp)$/i, '.png');
        }

        return `<a href="${imageUrl}" target="_blank" class="xXx "><img class="img-shack" width="${DECENSURED_CONFIG.IMAGE_THUMBNAIL_WIDTH}" height="${DECENSURED_CONFIG.IMAGE_THUMBNAIL_HEIGHT}" src="${miniUrl}" alt="${imageUrl}"></a>`;
    });
}

function formatLinks(text) {
    return text.replace(/(https?:\/\/[^\s<>"']+)/g, (url, match, offset) => {
        const beforeUrl = text.substring(Math.max(0, offset - DECENSURED_CONFIG.URL_CONTEXT_LENGTH), offset);
        const afterUrl = text.substring(offset + url.length, Math.min(text.length, offset + url.length + DECENSURED_CONFIG.URL_CONTEXT_LENGTH));

        if (beforeUrl.includes('href="') || beforeUrl.includes('src="') ||
            afterUrl.startsWith('"') || beforeUrl.endsWith('="')) {
            return url;
        }

        if (url.includes('image.noelshack.com')) {
            return url;
        }

        return `<a href="${url}" target="_blank" rel="noreferrer">${url}</a>`;
    });
}

function formatSmileys(text) {
    if (!text) return text;
    return text.replaceAll(smileyGifRegex, (e) => getSmileyImgHtml(e, false));
}

function processParagraphContent(paragraph) {
    const lines = paragraph.split('\n');
    let processedLines = [];
    let inList = false;
    let inQuote = false;
    let quoteLines = [];

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();
        if (!line) continue;

        // Citations > texte
        if (line.startsWith('>')) {
            if (!inQuote) {
                inQuote = true;
                quoteLines = [];
            }
            quoteLines.push(line.substring(1).trim());
            continue;
        } else if (inQuote) {
            // Fin de citation
            processedLines.push(`<blockquote class="blockquote-jv">${quoteLines.join('<br>')}</blockquote>`);
            inQuote = false;
            quoteLines = [];
        }

        // Listes - élément ou * élément
        if (line.match(/^[-*]\s+/)) {
            if (!inList) {
                inList = true;
                processedLines.push('<ul class="jv-list">');
            }
            const itemText = line.replace(/^[-*]\s+/, '');
            processedLines.push(`<li>${itemText}</li>`);
            continue;
        } else if (inList) {
            // Fin de liste
            processedLines.push('</ul>');
            inList = false;
        }

        // Mentions @pseudo (simple détection)
        line = line.replace(/@([a-zA-Z0-9_-]+)/g, '<span class="jv-mention">@$1</span>');

        // Ligne normale
        processedLines.push(line);
    }

    // Fermer les blocs ouverts en fin de paragraphe
    if (inQuote) {
        processedLines.push(`<blockquote class="blockquote-jv">${quoteLines.join('<br>')}</blockquote>`);
    }
    if (inList) {
        processedLines.push('</ul>');
    }

    return processedLines.join('\n');
}

function cleanupContent(content) {
    return content
        .replace(/\n\n+/g, '\n')  // Supprime les doubles \n
        .replace(/\n(<\/ul>|<\/blockquote>)/g, '$1')  // Supprime \n avant les fermetures
        .replace(/(<ul[^>]*>|<blockquote[^>]*>)\n/g, '$1')  // Supprime \n après les ouvertures
        .replace(/\n(<li>)/g, '$1')  // Supprime \n avant les <li>
        .replace(/\n/g, '<br>');  // Convertit les \n restants en <br>
}

function formatParagraphs(text) {
    const paragraphs = text.split(/\n\s*\n/);

    const processedParagraphs = paragraphs.map(paragraph => {
        if (!paragraph.trim()) return '';

        const content = processParagraphContent(paragraph.trim());
        if (!content || content.trim() === '') return '';

        const finalContent = cleanupContent(content);

        // Gère la classe spéciale pour les images seules sans ligne blanche précédente
        const isImageOnly = /^<a href[^>]*><img class="message__urlImg"[^>]*><\/a>$/.test(finalContent);
        const className = isImageOnly ? 'class="message__noBlankline"' : '';

        return `<p ${className}>${finalContent}</p>`;
    }).filter(p => p && p.trim() !== '' && p !== '<p></p>').join('');

    // Post-traitement final pour supprimer les paragraphes vides résiduels
    return processedParagraphs.replace(/<p><\/p>/g, '').replace(/<p\s+><\/p>/g, '');
}

function formatMessageContent(rawText) {
    if (!rawText) return '';

    let text = rawText;

    // Formatage JVC natif en priorité
    text = formatJvcBold(text);
    text = formatJvcItalic(text);
    text = formatJvcUnderline(text);
    text = formatJvcStrikethrough(text);
    text = formatJvcCode(text);
    text = formatJvcSpoiler(text);
    text = formatJvcLists(text);
    text = formatJvcBlockquotes(text);

    // Formatage Markdown pour compatibilité
    text = formatSpoilers(text);
    text = formatCodeBlocks(text);
    text = formatInlineCode(text);
    text = formatBoldAndItalicText(text);
    text = formatStrikethrough(text);

    text = formatImages(text);
    text = formatLinks(text);
    text = formatSmileys(text);

    return formatParagraphs(text);
}

function initializeSpoilerHandlers(container) {
    if (!container) return;

    const markdownSpoilers = container.querySelectorAll('.JvCare--masked');
    markdownSpoilers.forEach(spoiler => {
        spoiler.addEventListener('click', function () {
            this.classList.remove('JvCare--masked');
            this.classList.add('JvCare--revealed');
        });
    });
}
