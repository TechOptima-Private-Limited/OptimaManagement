document.addEventListener('DOMContentLoaded', function () {
    const searchBar = document.getElementById('searchbar');
    if (!searchBar) return;

    // Set placeholder and width
    searchBar.placeholder = 'Search by Name, Email, Skills (e.g. Python), Experience (e.g. 3.5)...';
    searchBar.style.width = '500px';
    searchBar.autocomplete = 'off';

    // Create suggestions container
    const suggestionsContainer = document.createElement('div');
    suggestionsContainer.id = 'search-suggestions';
    suggestionsContainer.style.cssText = `
        position: absolute;
        background: white;
        border: 1px solid #ddd;
        border-radius: 4px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        z-index: 1000;
        display: none;
        max-height: 300px;
        overflow-y: auto;
        width: 500px;
    `;
    searchBar.parentNode.appendChild(suggestionsContainer);

    let debounceTimer;

    searchBar.addEventListener('input', function () {
        clearTimeout(debounceTimer);
        const query = this.value.trim();

        if (query.length < 2) {
            suggestionsContainer.style.display = 'none';
            return;
        }

        debounceTimer = setTimeout(() => {
            fetch(`/onboarding/candidate-autocomplete/?q=${encodeURIComponent(query)}`)
                .then(response => response.json())
                .then(data => {
                    if (data.results && data.results.length > 0) {
                        suggestionsContainer.innerHTML = '';
                        data.results.forEach(name => {
                            const item = document.createElement('div');
                            item.className = 'suggestion-item';
                            item.textContent = name;
                            item.style.cssText = `
                                padding: 8px 12px;
                                cursor: pointer;
                                border-bottom: 1px solid #eee;
                            `;
                            item.addEventListener('mouseover', () => item.style.background = '#f8f9fa');
                            item.addEventListener('mouseout', () => item.style.background = 'white');
                            item.addEventListener('click', () => {
                                searchBar.value = name;
                                suggestionsContainer.style.display = 'none';
                                searchBar.closest('form').submit();
                            });
                            suggestionsContainer.appendChild(item);
                        });
                        suggestionsContainer.style.display = 'block';

                        // Position container correctly under searchbar
                        const rect = searchBar.getBoundingClientRect();
                        suggestionsContainer.style.top = (searchBar.offsetTop + searchBar.offsetHeight) + 'px';
                        suggestionsContainer.style.left = searchBar.offsetLeft + 'px';
                    } else {
                        suggestionsContainer.style.display = 'none';
                    }
                });
        }, 300);
    });

    // Close suggestions on click outside
    document.addEventListener('click', function (e) {
        if (e.target !== searchBar && e.target !== suggestionsContainer) {
            suggestionsContainer.style.display = 'none';
        }
    });
});
