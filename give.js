document.querySelectorAll('.christhood-copy-btn').forEach(button => {
    button.addEventListener('click', function () {
        const textToCopy = this.getAttribute('data-text');
        navigator.clipboard.writeText(textToCopy).then(() => {
            // Change button text temporarily to show success
            const originalText = this.innerHTML;
            this.innerHTML = '<i class="fas fa-check"></i> Copied!';
            setTimeout(() => {
                this.innerHTML = originalText;
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy text: ', err);
        });
    });
});

// Tab functionality (if not already implemented)
document.querySelectorAll('.christhood-tab-btn').forEach(button => {
    button.addEventListener('click', () => {
        const tabId = button.getAttribute('data-tab');

        // Remove active class from all buttons and tabs
        document.querySelectorAll('.christhood-tab-btn').forEach(btn =>
            btn.classList.remove('active'));
        document.querySelectorAll('.christhood-tab-content').forEach(tab =>
            tab.classList.remove('active'));

        // Add active class to clicked button and corresponding tab
        button.classList.add('active');
        document.getElementById(tabId).classList.add('active');
    });
});