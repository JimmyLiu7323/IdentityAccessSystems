document.addEventListener("DOMContentLoaded", function() {
    console.log('DOM fully loaded and parsed');
    
    // Log out user
    const logoutButton = document.querySelector(".logout-button");
    console.log('Logout button:', logoutButton);
    logoutButton.addEventListener("click", function() {
        console.log('Logout button clicked');
        window.location.href = '/logout';
    });

    // Initially hide the reset password form
    const resetPasswordForm = document.getElementById('resetPasswordSection');
    console.log('Reset password form section:', resetPasswordForm);
    resetPasswordForm.style.display = 'none';

    // Fetch user information
    console.log('Fetching user information from /api/userinfo');
    fetch('/api/userinfo')
    .then(response => {
        console.log('User info response received:', response);
        return response.json();
    })
    .then(data => {
        console.log('User info received:', data);
        document.getElementById('username').textContent = data.name;
        if (!data.isGoogleOAuth) {
            resetPasswordForm.style.display = 'block';
            console.log('Reset password form displayed');
        }
    })
    .catch(error => {
        console.error('Error fetching user info:', error);
        resetPasswordForm.style.display = 'none';
        console.log('Reset password form hidden due to error');
    });

    // Password reset form submission
    document.getElementById('resetPasswordForm').addEventListener('submit', function(event) {
        event.preventDefault();
        console.log('Password reset form submitted');
        const oldPassword = document.getElementById('oldPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmNewPassword = document.getElementById('confirmNewPassword').value;

        console.log('Old password:', oldPassword);
        console.log('New password:', newPassword);
        console.log('Confirm new password:', confirmNewPassword);

        if (newPassword !== confirmNewPassword) {
            console.log('New passwords do not match');
            Swal.fire({
                icon: 'error',
                title: 'Oops...',
                text: 'New passwords do not match!',
            });
            return;
        }

        // Password reset request
        console.log('Sending password reset request');
        fetch('/api/user/reset-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ oldPassword, newPassword, confirmNewPassword }),
        })
        .then(response => {
            console.log('Password reset response:', response);
            return response.json();
        })
        .then(data => {
            console.log('Password reset data:', data);
            if (data.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Password Updated',
                    text: 'Your password has been successfully updated.',
                }).then((result) => {
                    if (result.value) {
                        window.location.href = '/login'; // Redirect to the login page
                    }
                });
            } else {
                console.log('Password update failed:', data.message);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: data.message || 'An unknown error occurred',
                });
            }
        })
        .catch(error => {
            console.error('Error during password reset fetch operation:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'There was an error processing your request.',
            });
        });
    });
});
