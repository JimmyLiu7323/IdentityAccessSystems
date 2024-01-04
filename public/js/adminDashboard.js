document.addEventListener('DOMContentLoaded', function() {
  // Fetch and display user statistics
  fetchUserStatistics();

  // Fetch and display user data
  fetch('/api/admin/users')
    .then(handleResponse)
    .then(displayUsers)
    .catch(error => console.error('Error fetching users data:', error));
});

function fetchUserStatistics() {
  // Fetch the total number of users
  fetch('/api/admin/statistics/totalUsers')
    .then(handleResponse)
    .then(data => document.getElementById('visitsToday').textContent = data.totalUsers)
    .catch(error => console.error('Error fetching total users:', error));

  // Fetch the total number of active users today
  fetch('/api/admin/statistics/activeToday')
    .then(handleResponse)
    .then(data => document.getElementById('visitsPerMonth').textContent = data.activeToday)
    .catch(error => console.error('Error fetching active users today:', error));

  // Fetch the average active users in the last 7 days
  fetch('/api/admin/statistics/averageActivePastWeek')
    .then(handleResponse)
    .then(data => {
      // Round the number to the nearest whole number
      const averageActive = Math.round(data.averageActivePastWeek);
      document.getElementById('avgActivePastWeek').textContent = averageActive;
    })
    .catch(error => console.error('Error fetching average active users:', error));
}

function displayUsers(users) {
  const tableBody = document.getElementById('usersTable').getElementsByTagName('tbody')[0];

  if (Array.isArray(users)) {
    users.forEach(user => {
      let row = tableBody.insertRow();
      row.insertCell(0).textContent = user.name || 'N/A';
      row.insertCell(1).textContent = user.username || 'N/A';
      row.insertCell(2).textContent = formatDate(user.signUpTimestamp);
      row.insertCell(3).textContent = user.loginCount.toString();
      row.insertCell(4).textContent = formatDate(user.lastSessionTimestamp);
    });
  } else {
    console.error('Expected an array of users, but received:', users);
  }
}

function formatDate(dateString) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleString('en-US');
}

function handleResponse(response) {
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}
