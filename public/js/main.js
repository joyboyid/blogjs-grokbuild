/**
 * public/js/main.js
 * Client-side enhancements for BlogJS
 */

document.addEventListener('DOMContentLoaded', () => {
    // Auto-dismiss alerts after 6 seconds
    const alerts = document.querySelectorAll('.alert');
    alerts.forEach(alert => {
        setTimeout(() => {
            if (alert && alert.parentNode) {
                const bsAlert = bootstrap.Alert.getOrCreateInstance(alert);
                bsAlert.close();
            }
        }, 6000);
    });

    // Optional: Confirm before deleting anything
    // Already handled inline via onsubmit in forms
});
