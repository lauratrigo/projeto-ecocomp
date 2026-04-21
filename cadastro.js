document.addEventListener("DOMContentLoaded", () => {

    const form = document.getElementById("formCadastro");

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const name = document.getElementById("nome").value.trim();
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("senha").value;
        const confirmPassword = document.getElementById("confirmar").value;
        const deviceId = document.getElementById("deviceId").value.trim();

        // 🔴 valida estufa
        if (!deviceId) {
            alert("Código da estufa é obrigatório!");
            return;
        }

        // 🔴 valida senha
        if (password !== confirmPassword) {
            alert("As senhas não coincidem!");
            return;
        }

        try {
            const response = await fetch("https://projeto-ecocomp-zuk4.onrender.com/api/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name,
                    email,
                    password,
                    deviceId
                })
            });

            const data = await response.json();

            if (!response.ok) {
                alert(data.erro || "Erro ao cadastrar");
                return;
            }

            alert("Cadastro realizado com sucesso!");
            window.location.href = "login.html";

        } catch (error) {
            console.error("Erro de conexão:", error);
            alert("Erro de conexão com o servidor");
        }
    });
});