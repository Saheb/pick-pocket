console.log("Pick Pocket is ready!");

const getSelectedIdea = () => {
    let text = "";
    if (window.getSelection) {
        text = window.getSelection().toString();
    } else if (document.selection && document.selection.type != "Control") {
        text = document.selection.createRange().text;
    }
    return text;
};

const getSelectionTextAndContainerElement = () => {
    let text = "", containerElement = null;
    if (typeof window.getSelection != "undefined") {
        const sel = window.getSelection();
        if (sel.rangeCount) {
            const node = sel.getRangeAt(0).commonAncestorContainer;
            containerElement = node.nodeType == 1 ? node : node.parentNode;
            text = sel.toString();
        }
    } else if (typeof document.selection != "undefined" &&
        document.selection.type != "Control") {
        const textRange = document.selection.createRange();
        containerElement = textRange.parentElement();
        text = textRange.text;
    }
    return {
        text: text,
        containerElement: containerElement
    };
};

const saveIdea = (ideaText, pageUrl) => {
    console.log("Saving Idea ...");
    ideaText = ideaText.replace(/<(?:.|\n)*?>/gm, ''); // Strip HTML tags
    console.info(ideaText);
    if (!ideaText) {
        console.log('Error: No value specified');
        return;
    }

    const timestamp = (new Date()).toISOString();

    // Save it using the Chrome extension LOCAL storage API.
    chrome.storage.local.get(pageUrl, function (items) {
        let store = items || {};
        let linkIdeas = items[pageUrl] || [];

        const obj = {};
        obj[timestamp] = ideaText;
        linkIdeas.push(obj);

        store[pageUrl] = linkIdeas;

        chrome.storage.local.set(store, function () {
            console.log('Idea Saved locally!');

            // Also sync to server if enabled
            syncToServer({
                text: ideaText,
                url: pageUrl,
                timestamp: timestamp
            });
        });
    });
};

// Sync idea to server for weekly digest
const syncToServer = (idea) => {
    // Delegate to background script to avoid CSP issues on some sites
    try {
        chrome.runtime.sendMessage({
            cmd: 'sync_idea',
            data: idea
        });
    } catch (e) {
        console.error("Failed to send sync message:", e);
    }
};

chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        if (request.greeting == "hello") {
            const pageUrl = window.location.href;
            const elm = getSelectionTextAndContainerElement().containerElement;

            // Use robust extraction
            const traceLink = extractTraceUrl(elm, pageUrl);
            saveIdea(getSelectedIdea(), traceLink);

            sendResponse({ farewell: "goodbye" });
        }
    });

function extractTraceUrl(elm, pageUrl) {
    let permaLink = pageUrl;
    try {
        if (pageUrl.includes("quora.com")) {
            permaLink = extractQuoraPermalink(elm) || pageUrl;
        } else if (pageUrl.includes("stackoverflow.com")) {
            permaLink = extractStackoverflowPermalink(elm) || pageUrl;
        } else if (pageUrl.includes("reddit.com")) {
            permaLink = extractRedditPermalink(elm) || pageUrl;
        } else if (pageUrl.includes("news.ycombinator.com")) {
            permaLink = extractHNPermalink(elm) || pageUrl;
        } else if (pageUrl.includes("twitter.com") || pageUrl.includes("x.com")) {
            permaLink = extractTwitterPermalink(elm) || pageUrl;
        }
    } catch (e) {
        console.warn("Piccadilly: Failed to extract specific permalink, falling back to page URL.", e);
        permaLink = pageUrl;
    }
    return permaLink;
}

// Helper safely gets text or attribute, returns null if not found
const safeGetHref = (jqEl) => (jqEl && jqEl.length > 0 && jqEl[0].href) ? jqEl[0].href : null;

function extractQuoraPermalink(elm) {
    // Quora structure changes frequently. 
    // Attempting to find a link that looks like a date/time anchor or share link.
    // This is a best-effort fallback logic or simplified logic.
    try {
        const parent = $(elm).closest(".q-box");
        // Try to find a link that contains the answer ID or profile/answer pattern
        const potentialLinks = parent.find("a[href*='/answer/']");
        if (potentialLinks.length > 0) {
            return potentialLinks[0].href;
        }
    } catch (e) { console.warn("Quora extraction error", e); }
    return null;
}

function extractStackoverflowPermalink(elm) {
    try {
        const answerCell = $(elm).closest(".answercell");
        if (answerCell.length) {
            const link = answerCell.find("a.js-share-link, a[title~='permalink']");
            return safeGetHref(link);
        }
    } catch (e) { console.warn("SO extraction error", e); }
    return null;
}

function extractRedditPermalink(elm) {
    try {
        const entry = $(elm).closest(".entry, .Post"); // .Post is newer reddit, .entry classic
        if (entry.length) {
            // Classic
            let link = entry.find("a.bylink");
            if (safeGetHref(link)) return safeGetHref(link);

            // Modern (approximate, Reddit DOM is complex/obfuscated)
            link = entry.find("a[href*='/comments/']");
            return safeGetHref(link);
        }
    } catch (e) { console.warn("Reddit extraction error", e); }
    return null;
}

function extractHNPermalink(elm) {
    try {
        // HN structure is table-based and fairly stable but still tricky with selection
        const row = $(elm).closest("tr");
        if (row.length) {
            // Look for the subtext row which usually follows the title row
            // Or if we are in a comment
            const ageSpan = row.find("span.age"); // works if in comment
            if (ageSpan.length) {
                return safeGetHref(ageSpan.children("a"));
            }
            // Try next sibling row for stories
            const nextRow = row.next();
            const nextAgeSpan = nextRow.find("span.age");
            if (nextAgeSpan.length) {
                return safeGetHref(nextAgeSpan.children("a"));
            }
        }
    } catch (e) { console.warn("HN extraction error", e); }
    return null;
}

function extractTwitterPermalink(elm) {
    try {
        const currentUrl = window.location.href;

        // CASE 1: If we're already on a specific tweet page (x.com/user/status/123)
        // Just return the current URL - it IS the permalink.
        if (/\/(twitter|x)\.com\/[^/]+\/status\/\d+/.test(currentUrl)) {
            console.log("Piccadilly: On a tweet page, using current URL");
            return currentUrl.split('?')[0]; // Remove query params like ?s=20
        }

        // CASE 2: We're on a timeline (home, profile, search, etc.)
        // Need to find the specific tweet the selection is within.

        // Step 1: Find the tweet article container
        const article = $(elm).closest("article");

        if (article.length) {
            // Step 2: Find the timestamp link within THIS article only
            // The timestamp <time> element is inside an <a> that links to the tweet
            const timeElements = article.find("time");

            for (let i = 0; i < timeElements.length; i++) {
                const timeEl = $(timeElements[i]);
                const parentLink = timeEl.closest("a");
                const href = safeGetHref(parentLink);

                // Validate it's a proper status link
                if (href && /\/status\/\d+/.test(href)) {
                    console.log("Piccadilly: Found tweet via time element:", href);
                    return href.split('?')[0];
                }
            }

            // Step 3: Fallback - find any status link, but be more selective
            // We want the first link that looks like a main tweet link (not analytics, not quoted)
            const allLinks = article.find("a[href*='/status/']");
            for (let i = 0; i < allLinks.length; i++) {
                const href = allLinks[i].href;
                // Skip analytics links (contain /analytics), photo links, etc.
                if (/\/status\/\d+$/.test(href) || /\/status\/\d+\?/.test(href)) {
                    console.log("Piccadilly: Found tweet via status link:", href);
                    return href.split('?')[0];
                }
            }
        }

        // CASE 3: Couldn't find article - maybe selection is in a weird place
        // Try a broader search
        const nearestParentWithStatus = $(elm).parents().filter(function () {
            return $(this).find("a[href*='/status/']").length > 0;
        }).first();

        if (nearestParentWithStatus.length) {
            const statusLink = nearestParentWithStatus.find("a[href*='/status/']").first();
            const href = safeGetHref(statusLink);
            if (href && /\/status\/\d+/.test(href)) {
                console.log("Piccadilly: Found tweet via parent search:", href);
                return href.split('?')[0];
            }
        }

    } catch (e) {
        console.warn("Piccadilly: Twitter extraction error", e);
    }

    console.log("Piccadilly: Could not extract Twitter permalink, falling back to page URL");
    return null;
}