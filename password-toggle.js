// function togglePassword(btn) {
//     const input = document.getElementById("senha");
//     if (!input) return;

//     const isHidden = input.type === "password";

//     input.type = isHidden ? "text" : "password";

//     // alterna estado visual
//     btn.classList.toggle("active", isHidden);
// }

function togglePassword(button) {
    const wrapper = button.parentElement;
    const input = wrapper.querySelector("input");

    if (input.type === "password") {
        input.type = "text";
        button.classList.add("active");
    } else {
        input.type = "password";
        button.classList.remove("active");
    }
}