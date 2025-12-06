const apiURL = "https://script.google.com/macros/s/AKfycbxmr3989V0zqiOrDY7NUrLZg3rGDbsM_60Yiwkn4lroFvu9aIyG9kbmXWpjLiNpvu_GhQ/exec"; // Replace w/ your URL

function login() {
  let uname = document.getElementById("username").value;
  let pwd = document.getElementById("password").value;
  fetch(`${apiURL}?action=login&username=${uname}&password=${pwd}`)
    .then(res => res.json())
    .then(data => {
      if (data.success && data.admin) {
        localStorage.setItem("role", "admin");
        window.location.href = "admin.html";
      } else if (data.success && data.emp) {
        localStorage.setItem("role", "employee");
        localStorage.setItem("emp", JSON.stringify(data.emp));
        window.location.href = "employee.html";
      } else {
        document.getElementById("login-msg").textContent = "Invalid credentials";
      }
    });
}

function logout() {
  localStorage.clear();
  window.location.href = "index.html";
}
