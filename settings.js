let xmlTags = [];

document.addEventListener('DOMContentLoaded', function() {
    const columnList = document.getElementById('columnList');
    const addColumnButton = document.getElementById('addColumn');
    const saveSettingsButton = document.getElementById('saveSettings');
    const messageDiv = document.getElementById('message');

    // Load existing settings
    chrome.storage.sync.get(['columnSettings', 'xmlTags'], function(result) {
        xmlTags = result.xmlTags || [];
        const columnSettings = result.columnSettings || [
            { name: 'Artifact Type', xmlTag: 'recordType' },
            { name: 'Artifact Name', xmlTag: 'name' },
            { name: 'Artifact ID', xmlTag: 'id' },
            { name: 'User Name', xmlTag: 'userName' }
        ];
        columnSettings.forEach(column => addColumnToList(column));
    });

    addColumnButton.addEventListener('click', () => addColumnToList());

    saveSettingsButton.addEventListener('click', function() {
        const columnSettings = Array.from(columnList.children).map(item => ({
            name: item.querySelector('.column-name').value,
            xmlTag: item.querySelector('.xml-tag').value
        }));

        chrome.storage.sync.set({ columnSettings }, function() {
            messageDiv.textContent = 'Settings saved successfully!';
            setTimeout(() => messageDiv.textContent = '', 3000);
        });
    });

    function addColumnToList(column = { name: '', xmlTag: '' }) {
        const li = document.createElement('li');
        li.className = 'column-item';
        li.innerHTML = `
            <input type="text" class="column-name" placeholder="Column Name" value="${column.name}">
            <input type="text" class="xml-tag" list="xmlTagsList" placeholder="XML Tag" value="${column.xmlTag}">
            <datalist id="xmlTagsList">
                ${xmlTags.map(tag => `<option value="${tag}">`).join('')}
            </datalist>
            <button class="remove-column">Remove</button>
            <button class="move-up">▲</button>
            <button class="move-down">▼</button>
        `;

        li.querySelector('.remove-column').addEventListener('click', () => li.remove());
        li.querySelector('.move-up').addEventListener('click', () => moveColumn(li, -1));
        li.querySelector('.move-down').addEventListener('click', () => moveColumn(li, 1));

        columnList.appendChild(li);
    }

    function moveColumn(li, direction) {
        if (direction === -1 && li.previousElementSibling) {
            li.parentNode.insertBefore(li, li.previousElementSibling);
        } else if (direction === 1 && li.nextElementSibling) {
            li.parentNode.insertBefore(li.nextElementSibling, li);
        }
    }
});