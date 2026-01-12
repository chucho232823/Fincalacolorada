document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const idEvento = urlParams.get('idEvento');
    const codigo = urlParams.get('codigo');
    const contenedor = document.getElementById('contenedor-descarga');

    // Configuración
    const MAX_INTENTOS = 10; 
    const INTERVALO = 2000;  
    let intentosRealizados = 0;

    if (!idEvento || !codigo) {
        contenedor.innerHTML = "<p class='error-msg'>⚠️ Datos de reserva incompletos.</p>";
        return;
    }

    const hrefDescarga = `/descargar-boleto?idEvento=${idEvento}&codigo=${codigo}`;

    const verificarArchivo = async () => {
    intentosRealizados++;
    console.log(`Intento ${intentosRealizados} de ${MAX_INTENTOS}`);

    try {
        // Al ser una ruta relativa, el navegador no lo bloquea por CORS
        const respuesta = await fetch(hrefDescarga, { method: 'HEAD' });
        
        if (respuesta.ok) {
            console.log("¡Archivo encontrado!");
            mostrarBotonDescarga(hrefDescarga);
        } else if (intentosRealizados < MAX_INTENTOS) {
            setTimeout(verificarArchivo, INTERVALO);
        } else {
            mostrarErrorTiempo();
        }
    } catch (error) {
        console.error("Error en fetch:", error);
        // Si hay error de red, seguimos intentando hasta el límite
        if (intentosRealizados < MAX_INTENTOS) {
            setTimeout(verificarArchivo, INTERVALO);
        }
    }
};

    const mostrarBotonDescarga = (url) => {
        contenedor.innerHTML = `
            <p>✅ ¡Tu boleto está listo!</p>
            <a href="${url}" class="btn-descarga">
               📥 Descargar Boleto PDF
            </a>
        `;
        // Iniciar descarga automática
        window.location.href = url;
    };

    const mostrarErrorTiempo = () => {
        contenedor.innerHTML = `
            <p class="error-msg">⚠️ Tiempo de espera agotado.</p>
            <p>El PDF está tardando en generarse. Por favor, intenta recargar la página en un momento.</p>
            <button onclick="location.reload()">Reintentar</button>
        `;
    };

    // Iniciamos la primera verificación
    verificarArchivo();
});