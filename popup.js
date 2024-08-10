document.addEventListener('DOMContentLoaded', function() {
    const mainView = document.getElementById('mainView');
    const additionalInfoView = document.getElementById('additionalInfoView');
    const showAdditionalInfoButton = document.getElementById('showAdditionalInfo');
    const backToMainButton = document.getElementById('backToMain');
    const captureArtifactInfoButton = document.getElementById('captureArtifactInfo');
    const settingsButton = document.getElementById('settingsButton');
    const messageDiv = document.getElementById('message');
  
    showAdditionalInfoButton.addEventListener('click', function() {
      mainView.style.display = 'none';
      additionalInfoView.style.display = 'block';
    });
  
    backToMainButton.addEventListener('click', function() {
      additionalInfoView.style.display = 'none';
      mainView.style.display = 'block';
    });
  
    function createInfoItem(label, data, container) {
      const item = document.createElement('div');
      item.className = 'info-item';
      item.innerHTML = `<span class="label">${label}:</span> `;
      
      if (data.error) {
        const errorSpan = document.createElement('span');
        errorSpan.className = 'error';
        errorSpan.textContent = 'Error obtaining info';
        errorSpan.onclick = function() {
          const details = this.nextElementSibling;
          details.style.display = details.style.display === 'none' ? 'block' : 'none';
        };
        item.appendChild(errorSpan);
  
        const errorDetails = document.createElement('div');
        errorDetails.className = 'error-details';
        errorDetails.textContent = data.error;
        item.appendChild(errorDetails);
      } else {
        const valueSpan = document.createElement('span');
        valueSpan.className = 'value';
        valueSpan.textContent = data.value;
        item.appendChild(valueSpan);
      }
      
      container.appendChild(item);
    }
  
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {action: "getNetSuiteInfo"}, function(response) {
        const mainContainer = document.getElementById('info-container');
        const additionalContainer = document.getElementById('additional-info-container');
        
        if (chrome.runtime.lastError) {
          mainContainer.innerHTML = `<div class="error">Error: ${chrome.runtime.lastError.message}</div>`;
          return;
        }
  
        if (!response) {
          mainContainer.innerHTML = '<div class="error">No data received. Please make sure you are on a NetSuite page.</div>';
          return;
        }
  
        // Main view information
        createInfoItem('User', response.userName, mainContainer);
        createInfoItem('Environment', response.environment, mainContainer);
  
        // Additional information view
        createInfoItem('User', response.userName, additionalContainer);
        createInfoItem('Environment', response.environment, additionalContainer);
        createInfoItem('Role', response.role, additionalContainer);
        createInfoItem('Account', response.account, additionalContainer);
      });
    });
  
    captureArtifactInfoButton.addEventListener('click', function() {
      messageDiv.textContent = 'Fetching artifact info...';
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {action: "getArtifactInfo"}, function(response) {
          if (chrome.runtime.lastError) {
            messageDiv.textContent = `Error: ${chrome.runtime.lastError.message}`;
            return;
          }
  
          if (!response || !response.artifactInfo) {
            messageDiv.textContent = 'No artifact information found on this page.';
            return;
          }
  
          const clipboardText = Object.entries(response.artifactInfo)
            .map(([key, value]) => `${value}`)
            .join('\t');
          
          navigator.clipboard.writeText(clipboardText).then(() => {
            messageDiv.textContent = 'Artifact info copied to clipboard!';
          }, (err) => {
            messageDiv.textContent = 'Failed to copy artifact info.';
            console.error('Could not copy text: ', err);
          });
        });
      });
    });
  
    settingsButton.addEventListener('click', function() {
      chrome.tabs.create({url: 'settings.html'});
    });
  });