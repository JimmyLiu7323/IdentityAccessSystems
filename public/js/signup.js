document.addEventListener("DOMContentLoaded", function() {
    const signupForm = document.getElementById('signup-form');

    signupForm.addEventListener('submit', function(event) {
        event.preventDefault();

        const formData = new FormData(signupForm);

        // Log FormData contents for debugging
        for (let [key, value] of formData.entries()) {
            console.log(`${key}: ${value}`);
        }

        fetch('/signup', {
            method: 'POST',
            body: formData,
            credentials: 'include' // Include credentials if your server uses sessions
        })
        .then(response => {
            if (!response.ok) {
                // If response is not OK, parse and throw it as an error
                return response.json().then(err => {
                    console.error('Error response from server:', err);
                    return Promise.reject(err);
                });
            }
            // Otherwise, parse the successful response
            return response.json();
        })
        .then(data => {
            if (data.userId) {
                console.log('Signup successful:', data);
                Swal.fire({
                    title: 'Signed Up!',
                    text: 'Your account has been created. Please check your email to verify your account.',
                    icon: 'success',
                    confirmButtonText: 'Ok'
                }).then((result) => {
                    if (result.isConfirmed) {
                        window.location.href = '/dashboard';
                    }
                });
            } else {
                // Log the unsuccessful data for debugging
                console.error('Signup failed:', data);
                Swal.fire({
                    title: 'Signup Failed',
                    text: data.message || 'Unknown error occurred',
                    icon: 'error',
                    confirmButtonText: 'Try Again'
                });
            }
        })
        .catch(error => {
            // Log the error from the catch block
            console.error('Catch block error:', error);
            Swal.fire({
                title: 'Error',
                text: error.message || 'An error occurred during the signup process.',
                icon: 'error',
                confirmButtonText: 'Ok'
            });
        });
    });
      // Event listener for Google Signup button
      document.getElementById('googleSignUpButton').addEventListener('click', function(event) {
        event.preventDefault(); // Prevent default button action
        // Redirect to your server-side Google OAuth route
        window.location.href = '/auth/google';
    });
});
