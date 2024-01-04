document.getElementById('resendEmail').addEventListener('click', function() {
    console.log('Resend verification email button clicked.');

    fetch('/dashboard/resend-verification', {
        method: 'GET'
    })
    .then(response => {
        console.log('Received response from server for resending verification email.');      
        if (response.ok) {
            console.log('Verification email resend request was successful.');           
            return response.text();
        } else {
            console.error('Failed to resend verification email, server responded with status:', response.status);         
            throw new Error('Failed to resend verification email.');
        }
    })
    .then(message => {
        console.log('Server message:', message);
        Swal.fire({
            icon: 'success',
            title: 'Email Sent',
            text: 'Verification email sent successfully. Please check your inbox.',
        });
    })
    .catch(error => {
        console.error('Error:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Error sending verification email. Please try again later.',
        });
    });
});
