document.addEventListener('DOMContentLoaded', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {action: "getNetSuiteInfo"}, function(response) {
        const container = document.getElementById('info-container');
        
        function createInfoItem(label, data) {
          const item = document.createElement('div');
          item.className = 'info-item';
          item.innerHTML = `<span class="label">${label}:</span> `;
          
          if (data.error) {
            const errorSpan = document.createElement('span');
            errorSpan.className = 'error';
            errorSpan.textContent = `Error: ${data.error}`;
            item.appendChild(errorSpan);
          } else {
            const valueSpan = document.createElement('span');
            valueSpan.className = 'value';
            valueSpan.textContent = data.value;
            item.appendChild(valueSpan);
          }
          
          return item;
        }
        
        container.appendChild(createInfoItem('User', response.userName));
        container.appendChild(createInfoItem('Environment', response.environment));
        container.appendChild(createInfoItem('Role', response.role));
        container.appendChild(createInfoItem('Account', response.account));
      });
    });
  });