document.addEventListener('DOMContentLoaded', function() {
    // Fetch user information and populate the fields
    fetch('/api/userinfo')
        .then(response => response.json())
        .then(data => {
            document.getElementById('email').textContent = data.email;
            document.getElementById('name').textContent = data.name;
        })
        .catch(error => {
            console.error('Error fetching user info:', error);
        });

    // Logout Button Event Handler
    document.getElementById('logoutButton').addEventListener('click', function() {        
        window.location.href = '/logout';
    });
});
