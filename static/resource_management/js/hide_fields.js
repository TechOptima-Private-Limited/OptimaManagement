function initAccessRequestFieldToggles() {
    const requestType = document.querySelector('#id_request_type');

    function getRowForInputId(inputId) {
        const el = document.querySelector('#' + inputId);
        if (!el) {
            return null;
        }
        return (
            el.closest('.form-row') ||
            el.closest('.fieldBox') ||
            el.closest('.form-group') ||
            el.parentElement
        );
    }

    function getTargetRows() {
        return {
            resourceTypeRow: getRowForInputId('id_resource_type'),
            resourceRow: getRowForInputId('id_resource'),
            accessLevelRow: getRowForInputId('id_access_level'),
            assetRow: getRowForInputId('id_asset'),
        };
    }

    function toggleFields() {
        if (!requestType) {
            return;
        }
        const isITSupport = requestType.value === 'IT';
        const isAssetRepair = requestType.value === 'ASSET_REPAIR';
        const hideResourceFields = isITSupport || isAssetRepair;

        const { resourceTypeRow, resourceRow, accessLevelRow, assetRow } = getTargetRows();

        [resourceTypeRow, resourceRow, accessLevelRow].forEach(row => {
            if (row) {
                row.style.display = hideResourceFields ? 'none' : '';
            }
        });

        if (assetRow) {
            assetRow.style.display = isAssetRepair ? '' : 'none';
        }
    }

    if (requestType) {
        toggleFields();
        setTimeout(toggleFields, 0);
        setTimeout(toggleFields, 50);
        setTimeout(toggleFields, 250);
        requestType.addEventListener('change', toggleFields);
    }
}

if (window.django && django.jQuery) {
    django.jQuery(function () {
        initAccessRequestFieldToggles();
    });
} else if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAccessRequestFieldToggles);
} else {
    initAccessRequestFieldToggles();
}