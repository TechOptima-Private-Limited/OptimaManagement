// assets/static/assets/js/asset_assignment_admin.js
(function($) {
    $(document).ready(function() {
        // Function to update available assets based on selected asset types
        function updateAvailableAssets() {
            var $assetTypes = $('#id_asset_types');
            var $availableAssets = $('#id_available_assets');
            
            // Get selected asset type IDs
            var selectedTypes = $assetTypes.val() || [];
            
            if (selectedTypes.length > 0) {
                // Enable the available assets field
                $availableAssets.prop('disabled', false);
                
                // Get the base autocomplete URL
                var autocompleteUrl = $availableAssets.data('autocomplete-url');
                
                // Update the select2 instance with the new configuration
                $availableAssets.select2('destroy');
                
                // Reinitialize select2 with the selected asset types in the AJAX data
                django.jQuery.getScript('/static/admin/js/vendor/select2/select2.full.min.js', function() {
                    $availableAssets.select2({
                        'width': '100%',
                        'placeholder': 'Select assets...',
                        'allowClear': true,
                        'multiple': true,
                        'ajax': {
                            'url': autocompleteUrl,
                            'dataType': 'json',
                            'delay': 250,
                            'data': function(params) {
                                return {
                                    'q': params.term,
                                    'page': params.page || 1,
                                    'asset_types': selectedTypes  // Send selected asset types as an array
                                };
                            },
                            'processResults': function(data, params) {
                                params.page = params.page || 1;
                                return {
                                    results: data.results || [],
                                    pagination: {
                                        more: data.more || false
                                    }
                                };
                            },
                            'cache': true
                        },
                        'escapeMarkup': function(markup) { return markup; },
                        'templateResult': function(asset) {
                            if (asset.loading) return asset.text;
                            return $('<span>').html(asset.text);
                        },
                        'templateSelection': function(asset) {
                            if (!asset.id) return asset.text;
                            return $('<span>').html(asset.text);
                        }
                    });
                });
                
                // Clear current selection when asset types change
                $availableAssets.val(null).trigger('change');
            } else {
                // Disable the available assets field if no asset types are selected
                $availableAssets.prop('disabled', true);
                $availableAssets.val(null).trigger('change');
            }
        }
        
        // Initialize the form
        function initializeForm() {
            // Store the autocomplete URL for later use
            var $availableAssets = $('#id_available_assets');
            
            // If select2 is already initialized, get the URL from it
            if ($availableAssets.hasClass('select2-hidden-accessible')) {
                $availableAssets.data('autocomplete-url', $availableAssets.data('select2').options.get('ajax').url);
            } else {
                // Otherwise, use the data attribute if it exists
                $availableAssets.data('autocomplete-url', $availableAssets.data('autocomplete-url') || '/assets/available-assets-autocomplete/');
            }
            
            // Disable available assets field initially if no asset types are selected
            if ($('#id_asset_types').val() === null || $('#id_asset_types').val().length === 0) {
                $availableAssets.prop('disabled', true);
            } else {
                // If there are selected asset types, update the available assets
                updateAvailableAssets();
            }
            
            // Set up event listeners
            $('#id_asset_types').on('change', updateAvailableAssets);
        }
        
        // Run initialization when the document is ready
        initializeForm();
    });
})(django.jQuery);