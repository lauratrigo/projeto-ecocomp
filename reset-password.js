document.getElementById("formReset").addEventListener("submit", async (e) => {
  e.preventDefault();

  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");

  const newPassword = document.querySelector("input").value;

  const res = await fetch("http://localhost:3000/api/reset-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, newPassword })
  });

  const data = await res.json();
  alert(data.message || data.erro);
});