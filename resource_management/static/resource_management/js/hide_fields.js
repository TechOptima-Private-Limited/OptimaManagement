document.addEventListener('DOMContentLoaded', function() {
    const requestType = document.querySelector('#id_request_type');
    const fieldsToHide = [
        document.querySelector('.field-resource_type'),
        document.querySelector('.field-resource'),
        document.querySelector('.field-access_level')
    ];

    function toggleFields() {
        const isITSupport = requestType.value === 'IT';
        fieldsToHide.forEach(field => {
            if (field) {
                field.style.display = isITSupport ? 'none' : 'flex';
            }
        });
    }

    if (requestType) {
        toggleFields();
        requestType.addEventListener('change', toggleFields);
    }
});