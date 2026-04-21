document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("formForgot");

    if (!form) return;

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = form.querySelector("input").value;

        try {
            const res = await fetch("https://projeto-ecocomp-zuk4.onrender.com/api/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email })
            });

            const data = await res.json();

            if (res.ok) {
                alert("Link enviado para seu e-mail!");
            } else {
                alert(data.erro || "Erro ao enviar link");
            }

        } catch (err) {
            console.error(err);
            alert("Erro de conexão");
        }
    });
});