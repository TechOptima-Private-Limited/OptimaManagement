// assets/static/assets/js/asset_assignment_admin.js
(function($) {
    $(document).ready(function() {
        // Function to update asset names in the inline forms
        function updateAssetNames() {
            // Get the selected assets from the autocomplete widget
            var selectedAssets = [];
            $('#id_assets').find('option:selected').each(function() {
                selectedAssets.push($(this).text());
            });

            // Update the asset_name fields in the inline forms
            var inlineForms = $('#assetassignmentimage_set-group .inline-related');
            inlineForms.each(function(index) {
                if (index < selectedAssets.length) {
                    $(this).find('.field-asset_name input').val(selectedAssets[index]);
                } else {
                    $(this).find('.field-asset_name input').val('Not assigned yet');
                }
            });

            // Show/hide inline forms based on the number of selected assets
            inlineForms.each(function(index) {
                if (index < selectedAssets.length) {
                    $(this).show();
                } else {
                    $(this).hide();
                }
            });
        }

        // Initial update on page load
        updateAssetNames();

        // Listen for changes in the assets field
        $('#id_assets').on('change', function() {
            updateAssetNames();
        });

        // Ensure the inline forms are updated when adding a new inline form
        $('#assetassignmentimage_set-group').on('click', '.add-row a', function() {
            setTimeout(updateAssetNames, 100); // Delay to ensure the new form is rendered
        });
    });
})(django.jQuery);