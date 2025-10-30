document.addEventListener('DOMContentLoaded', function() {
    const categorySelect = document.querySelector('.asset-category-select');
    const assetTypeSelect = document.querySelector('.asset-type-select');
    const assetSelect = document.querySelector('.asset-select');
    const csrftoken = getCookie('csrftoken');

    // Helper function to get CSRF token
    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }

    // Helper function to reset and disable a select element
    function resetAndDisable(selectElement) {
        if (!selectElement) return;
        
        // Save the first option (if it's a placeholder)
        const firstOption = selectElement.options[0];
        
        // Clear all options
        selectElement.innerHTML = '';
        
        // Add back the first option if it exists
        if (firstOption) {
            selectElement.appendChild(firstOption);
        } else {
            // Add a default empty option
            const defaultOption = document.createElement('option');
            defaultOption.value = '';
            defaultOption.textContent = '---------';
            defaultOption.selected = true;
            defaultOption.disabled = true;
            selectElement.hidden = false;
            selectElement.appendChild(defaultOption);
        }
        
        // Disable the select
        selectElement.disabled = true;
    }

    // Handle category change
    if (categorySelect) {
        categorySelect.addEventListener('change', function() {
            const category = this.value;
            const assetTypeUrl = this.dataset.url;
            
            // Reset and disable dependent fields
            if (assetTypeSelect) resetAndDisable(assetTypeSelect);
            if (assetSelect) resetAndDisable(assetSelect);
            
            if (!category) return;
            
            // Show loading state
            const loadingOption = document.createElement('option');
            loadingOption.textContent = 'Loading...';
            loadingOption.disabled = true;
            assetTypeSelect.innerHTML = '';
            assetTypeSelect.appendChild(loadingOption);
            assetTypeSelect.disabled = false;
            
            // Fetch asset types for the selected category
            fetch(assetTypeUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'X-CSRFToken': csrftoken,
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: `category=${encodeURIComponent(category)}`
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                // Clear loading state
                assetTypeSelect.innerHTML = '';
                
                // Add default option
                const defaultOption = document.createElement('option');
                defaultOption.value = '';
                defaultOption.textContent = '---------';
                defaultOption.selected = true;
                defaultOption.disabled = true;
                assetTypeSelect.appendChild(defaultOption);
                
                if (data && data.length > 0) {
                    // Populate asset type dropdown
                    data.forEach(assetType => {
                        const option = document.createElement('option');
                        option.value = assetType.id;
                        option.textContent = assetType.name;
                        assetTypeSelect.appendChild(option);
                    });
                    
                    // Enable asset type select
                    assetTypeSelect.disabled = false;
                }
            })
            .catch(error => {
                console.error('Error fetching asset types:', error);
                // Reset to default state on error
                resetAndDisable(assetTypeSelect);
                resetAndDisable(assetSelect);
                
                // Show error message
                const errorOption = document.createElement('option');
                errorOption.textContent = 'Error loading asset types';
                errorOption.disabled = true;
                assetTypeSelect.innerHTML = '';
                assetTypeSelect.appendChild(errorOption);
            });
        });
    }
    
    // Handle asset type change
    if (assetTypeSelect) {
        assetTypeSelect.addEventListener('change', function() {
            const assetTypeId = this.value;
            const assetsUrl = this.dataset.url;
            
            // Reset and disable asset select
            if (assetSelect) resetAndDisable(assetSelect);
            
            if (!assetTypeId) return;
            
            // Show loading state
            const loadingOption = document.createElement('option');
            loadingOption.textContent = 'Loading...';
            loadingOption.disabled = true;
            assetSelect.innerHTML = '';
            assetSelect.appendChild(loadingOption);
            assetSelect.disabled = false;
            
            // Fetch assets for the selected asset type
            fetch(assetsUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'X-CSRFToken': csrftoken,
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: `asset_type=${encodeURIComponent(assetTypeId)}`
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                // Clear loading state
                assetSelect.innerHTML = '';
                
                // Add default option
                const defaultOption = document.createElement('option');
                defaultOption.value = '';
                defaultOption.textContent = '---------';
                defaultOption.selected = true;
                defaultOption.disabled = true;
                assetSelect.appendChild(defaultOption);
                
                if (data && data.length > 0) {
                    // Populate assets dropdown
                    data.forEach(asset => {
                        const option = document.createElement('option');
                        option.value = asset.id;
                        option.textContent = `${asset.name} (${asset.asset_tag || 'No Tag'})`;
                        assetSelect.appendChild(option);
                    });
                    
                    // Enable assets select
                    assetSelect.disabled = false;
                } else {
                    const noAssetsOption = document.createElement('option');
                    noAssetsOption.textContent = 'No assets available';
                    noAssetsOption.disabled = true;
                    assetSelect.appendChild(noAssetsOption);
                }
            })
            .catch(error => {
                console.error('Error fetching assets:', error);
                // Reset to default state on error
                resetAndDisable(assetSelect);
                
                // Show error message
                const errorOption = document.createElement('option');
                errorOption.textContent = 'Error loading assets';
                errorOption.disabled = true;
                assetSelect.innerHTML = '';
                assetSelect.appendChild(errorOption);
            });
        });
    }
    
    // Initialize the form if there's a selected category
    if (categorySelect && categorySelect.value) {
        categorySelect.dispatchEvent(new Event('change'));
    }
    
    // Initialize the form if there's a selected asset type
    if (assetTypeSelect && assetTypeSelect.value) {
        assetTypeSelect.dispatchEvent(new Event('change'));
    }
});
