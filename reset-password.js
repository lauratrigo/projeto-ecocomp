document.getElementById("formReset").addEventListener("submit", async (e) => {
  e.preventDefault();

  const params = new URLSearchParams(window.location.search);
  const email = params.get("email");

  const newPassword = document.getElementById("newPassword").value;
  const confirmPassword = document.getElementById("confirmPassword").value;

  // validação básica
  if (newPassword !== confirmPassword) {
    alert("As senhas não coincidem");
    return;
  }

  try {
    const res = await fetch("https://projeto-ecocomp-zuk4.onrender.com/api/reset-password-direct", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email,
        newPassword
      })
    });

    const data = await res.json();

    if (res.ok) {
      alert("Senha alterada com sucesso!");
      window.location.href = "index.html"; 
    } else {
      alert(data.erro || "Erro ao resetar senha");
    }

  } catch (err) {
    console.error(err);
    alert("Erro de conexão");
  }
});