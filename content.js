console.log('Content script loaded');

function extractNetSuiteInfo() {
    const url = window.location.hostname;
    let userName = { value: 'Unknown User', error: null };
    let environment = { value: 'Production', error: null };
    let role = { value: 'Unknown Role', error: null };
    let account = { value: 'Unknown Account', error: null };

    try {
        const scripts = document.getElementsByTagName('script');
        for (let script of scripts) {
            if (script.textContent.includes('"currentRole"')) {
                const userNameMatch = script.textContent.match(/"userName":"([^"]+)"/);
                const roleMatch = script.textContent.match(/"roleName":"([^"]+)"/);
                const accountMatch = script.textContent.match(/"accountName":"([^"]+)"/);

                if (userNameMatch) userName.value = userNameMatch[1];
                if (roleMatch) role.value = roleMatch[1];
                if (accountMatch) account.value = accountMatch[1];

                break;
            }
        }
    } catch (error) {
        console.error('Error extracting user info:', error);
        userName.error = error.message;
        role.error = error.message;
        account.error = error.message;
    }

    try {
        if (url.includes('tstdrv')) {
            environment.value = 'Test Drive';
        } else if (url.includes('-sb')) {
            environment.value = 'Sandbox';
        }
    } catch (error) {
        console.error('Error determining environment:', error);
        environment.error = error.message;
    }

    return { userName, environment, role, account };
}

async function fetchXmlData(url) {
    const response = await fetch(url + '&xml=T');
    const text = await response.text();
    const parser = new DOMParser();
    return parser.parseFromString(text, "text/xml");
}

async function extractArtifactInfo() {
    try {
        const xmlDoc = await fetchXmlData(window.location.href);
        const recordElement = xmlDoc.querySelector('record');

        if (!recordElement) {
            throw new Error('No record element found in XML');
        }

        // Extract all available tags from the XML
        const allTags = Array.from(recordElement.children).map(child => child.tagName);
        allTags.push(...recordElement.getAttributeNames());

        // Store the tags for use in settings
        chrome.storage.sync.set({ xmlTags: allTags });

        // Get the custom column settings
        const { columnSettings } = await new Promise(resolve => chrome.storage.sync.get('columnSettings', resolve));

        const artifactInfo = {};
        columnSettings.forEach(column => {
            if (column.xmlTag === 'userName') {
                // Special case for userName, as it's not in the XML
                artifactInfo[column.name] = extractUserName();
            } else if (recordElement.hasAttribute(column.xmlTag)) {
                artifactInfo[column.name] = recordElement.getAttribute(column.xmlTag);
            } else {
                const element = recordElement.querySelector(column.xmlTag);
                artifactInfo[column.name] = element ? element.textContent : 'N/A';
            }
        });

        return artifactInfo;
    } catch (error) {
        console.error('Error extracting artifact info:', error);
        return { error: error.message };
    }
}

function extractUserName() {
    const scripts = document.getElementsByTagName('script');
    for (let script of scripts) {
        if (script.textContent.includes('"currentRole"')) {
            const userNameMatch = script.textContent.match(/"userName":"([^"]+)"/);
            if (userNameMatch) {
                return userNameMatch[1];
            }
            break;
        }
    }
    return 'Unknown User';
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Received message:', request);
    if (request.action === "getNetSuiteInfo") {
        sendResponse(extractNetSuiteInfo());
    } else if (request.action === "getArtifactInfo") {
        extractArtifactInfo().then(artifactInfo => {
            sendResponse({ artifactInfo });
        });
        return true;  // Indicates that the response is sent asynchronously
    }
});

console.log('Content script setup complete');