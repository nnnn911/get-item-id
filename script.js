const rewardConfigs = {
    'UPOINT_200K': {
        rewardType: 'UPOINT_200K',
        animals: ['MONKEY', 'MOUSE', 'DRAGON']
    },
    'UPOINT_100K_1': {
        rewardType: 'UPOINT_100K',
        animals: ['MOUSE', 'OX']
    },
    'UPOINT_100K_2': {
        rewardType: 'UPOINT_100K',
        animals: ['SNAKE', 'MONKEY']
    },
    'UPOINT_100K_3': {
        rewardType: 'UPOINT_100K',
        animals: ['DRAGON', 'ROOSTER']
    },
    'UPOINT_68686': {
        rewardType: 'UPOINT_68686',
        animals: [] // Will be set by user selection
    }
};

// Show/hide animal selector based on reward type
document.getElementById('rewardType').addEventListener('change', function() {
    const animalSelector = document.getElementById('animalSelector');
    if (this.value === 'UPOINT_68686') {
        animalSelector.classList.add('active');
    } else {
        animalSelector.classList.remove('active');
    }
});

function showError(message) {
    const errorMsg = document.getElementById('errorMsg');
    errorMsg.textContent = message;
    errorMsg.classList.add('active');
    setTimeout(() => {
        errorMsg.classList.remove('active');
    }, 5000);
}

function extractIds() {
    // Hide previous output and errors
    document.getElementById('output').classList.remove('active');
    document.getElementById('errorMsg').classList.remove('active');

    // Get inputs
    const jsonInput = document.getElementById('jsonInput').value.trim();
    const rewardTypeKey = document.getElementById('rewardType').value;
    const animalType = document.getElementById('animalType').value;

    // Validate inputs
    if (!jsonInput) {
        showError('Please enter JSON data');
        return;
    }

    if (!rewardTypeKey) {
        showError('Please select a reward type');
        return;
    }

    if (rewardTypeKey === 'UPOINT_68686' && !animalType) {
        showError('Please select an animal type for UPOINT_68686');
        return;
    }

    // Parse JSON
    let data;
    try {
        data = JSON.parse(jsonInput);
    } catch (error) {
        showError('Invalid JSON format: ' + error.message);
        return;
    }

    // Validate JSON structure
    if (!data.items || !Array.isArray(data.items)) {
        showError('JSON must contain an "items" array');
        return;
    }

    // Get reward config
    const config = rewardConfigs[rewardTypeKey];
    let animalsToFind = config.animals;

    // For UPOINT_68686, find 3 of the same animal
    if (rewardTypeKey === 'UPOINT_68686') {
        animalsToFind = [animalType, animalType, animalType];
    }

    // Extract IDs
    const materialIds = [];
    const foundAnimals = {};  // Map to store first found ID for each animal

    // For UPOINT_68686, just find 3 of the same type
    if (rewardTypeKey === 'UPOINT_68686') {
        for (const item of data.items) {
            if (!item.itemKey || !item.id) continue;
            
            if (item.itemKey === animalType && materialIds.length < 3) {
                materialIds.push(item.id);
            }

            if (materialIds.length === 3) {
                break;
            }
        }
    } else {
        // For other reward types, find one of each required animal
        for (const item of data.items) {
            if (!item.itemKey || !item.id) continue;

            if (animalsToFind.includes(item.itemKey) && !foundAnimals[item.itemKey]) {
                foundAnimals[item.itemKey] = item.id;
            }

            // Stop when we have all required animals
            if (Object.keys(foundAnimals).length === animalsToFind.length) {
                break;
            }
        }

        // Build materialIds array in the same order as animalsToFind
        for (const animal of animalsToFind) {
            if (foundAnimals[animal]) {
                materialIds.push(foundAnimals[animal]);
            }
        }
    }

    // Check if we found all required items
    if (materialIds.length < animalsToFind.length) {
        const missing = rewardTypeKey === 'UPOINT_68686' 
            ? `Only found ${materialIds.length} out of 3 ${animalType} items`
            : `Missing animals: ${animalsToFind.filter(a => !foundAnimals[a]).join(', ')}`;
        showError(`Could not find all required items. ${missing}`);
        return;
    }

    // Create output
    const output = {
        rewardType: config.rewardType,
        materialIds: materialIds,
        campaignId: "TCB_ZODIAC"
    };

    // Display output
    const outputContent = document.getElementById('outputContent');
    outputContent.textContent = JSON.stringify(output, null, 2);
    document.getElementById('output').classList.add('active');
}

function copyOutput() {
    const outputContent = document.getElementById('outputContent').textContent;
    const copyBtn = document.getElementById('copyBtn');

    navigator.clipboard.writeText(outputContent).then(() => {
        copyBtn.textContent = 'Copied!';
        copyBtn.classList.add('copied');
        setTimeout(() => {
            copyBtn.textContent = 'Copy';
            copyBtn.classList.remove('copied');
        }, 2000);
    }).catch(err => {
        showError('Failed to copy: ' + err.message);
    });
}

function copyInput() {
    const jsonInput = document.getElementById('jsonInput');
    const copyInputBtn = document.getElementById('copyInputBtn');
    
    if (!jsonInput.value.trim()) {
        showError('Nothing to copy');
        return;
    }

    navigator.clipboard.writeText(jsonInput.value).then(() => {
        const originalText = copyInputBtn.textContent;
        copyInputBtn.textContent = '✅ Copied!';
        setTimeout(() => {
            copyInputBtn.textContent = originalText;
        }, 2000);
    }).catch(err => {
        showError('Failed to copy: ' + err.message);
    });
}

function pasteInput() {
    const jsonInput = document.getElementById('jsonInput');
    const pasteInputBtn = document.getElementById('pasteInputBtn');

    navigator.clipboard.readText().then(text => {
        if (text.trim()) {
            jsonInput.value = text;
            const originalText = pasteInputBtn.textContent;
            pasteInputBtn.textContent = '✅ Pasted!';
            jsonInput.focus();
            setTimeout(() => {
                pasteInputBtn.textContent = originalText;
            }, 2000);
        } else {
            showError('Clipboard is empty');
        }
    }).catch(err => {
        showError('Failed to paste. Please allow clipboard access or paste manually.');
    });
}

function clearInput() {
    const jsonInput = document.getElementById('jsonInput');
    jsonInput.value = '';
    jsonInput.blur(); // Prevent zoom on iOS
}

// Allow Enter key in textarea
document.getElementById('jsonInput').addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && e.ctrlKey) {
        extractIds();
    }
});
