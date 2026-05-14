// script.js

const form = document.getElementById("leadForm");

form.addEventListener("submit", (e) => {
  e.preventDefault();

  alert("Formulario enviado correctamente");

  form.reset();
});