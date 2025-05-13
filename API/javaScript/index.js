 // Espera o DOM estar pronto
 document.addEventListener('DOMContentLoaded', function () {
    const inputId = document.getElementById('inputId');

    // Evento ao sair do campo (ou você pode usar outro evento como 'change' ou um botão de envio)
    inputId.addEventListener('change', function () {
        const salaId = inputId.value.trim();
        if (salaId) {
            localStorage.setItem('nomeSala', salaId);
            console.log('ID salvo no localStorage:', salaId);
        }
    });
});