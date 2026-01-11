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

    const hrefDescarga = `https://fincalacolorada.com/Eventos/boletos/evento_${idEvento}/${codigo}.pdf`;

    const verificarArchivo = async () => {
        intentosRealizados++;
        
        try {
            // Hacemos una petición HEAD para ver si el archivo existe (devuelve 200 OK)
            const respuesta = await fetch(hrefDescarga, { method: 'HEAD' });
            
            if (respuesta.ok) {
                mostrarBotonDescarga(hrefDescarga);
            } else if (intentosRealizados < MAX_INTENTOS) {
                // Si no existe, esperamos y reintentamos
                setTimeout(verificarArchivo, INTERVALO);
            } else {
                mostrarErrorTiempo();
            }
        } catch (error) {
            console.error("Error al verificar archivo:", error);
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