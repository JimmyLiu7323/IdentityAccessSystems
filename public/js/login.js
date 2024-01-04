document.getElementById('loginForm').addEventListener('submit', function(event) {
    event.preventDefault();

    var email = document.getElementById('email').value;
    var password = document.getElementById('password').value;

    console.log('Attempting to login with:', email, password); // Log the credentials being used to attempt login

    loginUser(email, password);
});

function loginUser(email, password) {
    console.log('Sending login request to server');
    
    fetch('/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
    })
    .then(response => {
        console.log('Received response status:', response.status); // Log the response status code
        if (!response.ok) {
            // If the response is not ok, extract the JSON to see the error message
            console.log(`Login request for email ${email} was not successful. Status code:`, response.status);           
            return response.json().then(jsonResponse => {
                console.log('Error details:', jsonResponse); // Log the error details from the JSON response
                throw new Error(jsonResponse.message || 'Login request failed');
            });
        }
        console.log(`Login request for email ${email} was successful.`);     
        return response.json(); // If response is ok, parse the JSON body
    })
    .then(data => {
        console.log('Data received:', data); // Log the data received from the server
        
        if (data.success && data.urlWithToken) {
            // Assuming server responds with a urlWithToken field when login is successful
            console.log('Token URL:', data.urlWithToken); // Log the URL with token
            Swal.fire({
                title: 'Logged In',
                text: `You are logged in successfully.`,
                icon: 'success',
                showCancelButton: true,
                confirmButtonText: 'Copy URL',
                cancelButtonText: 'Close'
            }).then((result) => {
                if (result.isConfirmed) {
                    // Copy the URL to the clipboard
                    navigator.clipboard.writeText(data.urlWithToken).then(() => {
                        console.log('Token URL copied to clipboard'); // Log the success copy action
                        Swal.fire('Copied!', 'The token URL has been copied to your clipboard.', 'success');
                    }).catch(err => {
                        console.error('Failed to copy token URL:', err); // Log the error if copy fails
                        Swal.fire('Oops!', 'Failed to copy the token URL.', 'error');
                    });
                }
            }).then(() => {
                // This will run after SweetAlert is closed
                // Update the URL in the browser's address bar without reloading the page
                window.history.pushState({ path: data.urlWithToken }, '', data.urlWithToken);
                console.log('Browser URL updated to:', data.urlWithToken); // Log the URL update action
            });
        } else {
            console.log('Login failed:', data.message); // Log the failure message
            Swal.fire({
                title: 'Error!',
                text: data.message || 'Login failed, please try again.',
                icon: 'error',
                confirmButtonText: 'OK'
            });
        }
    })
    .catch(error => {
        console.error('Login failed with error:', error); // Log any errors caught in the catch block
        Swal.fire({
            title: 'Error!',
            text: error.toString(),
            icon: 'error',
            confirmButtonText: 'OK'
        });
    });
}

// an event listener for the Google Sign-In button
document.getElementById('googleSignInButton').addEventListener('click', function(event) {
    event.preventDefault(); // Prevent the default form submit
    window.location.href = '/auth/google'; // Redirect to the Google auth route
});
