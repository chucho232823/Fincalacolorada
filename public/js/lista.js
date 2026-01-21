const boletos = document.querySelectorAll('.ver');
const descargar = document.querySelectorAll('.descargar');
//console.log(`nombre:${nombreEvento} idEvento:${idEvento}`);

function cerrarModal() {
    document.getElementById('boletoModal').style.display = 'none';
    document.getElementById('contenidoBoleto').innerHTML = '';
}

boletos.forEach(boleto => {
    boleto.addEventListener('click', (evento) => {
        const codigoBoleto = evento.target.id;
        //alert(`Viendo boleto: ${codigoBoleto}`);

        fetch(`/verBoleto/${codigoBoleto}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Boleto no encontrado o error en el servidor');
            }
            return response.json();
        })
        .then(data => {
            // Agrupar sillas por mesa
            const mesasMap = new Map();
            let nombre = '';

            data.forEach(entry => {
                nombre = entry.nombre; // Asumimos que el nombre es el mismo en todos
                const mesa = entry.numero_mesa;
                const silla = entry.letra_silla;

                if (!mesasMap.has(mesa)) {
                    mesasMap.set(mesa, new Set());
                }
                mesasMap.get(mesa).add(silla);
            });

            // Construir contenido del modal
            const modal = document.getElementById('boletoModal');
            const contenido = document.getElementById('contenidoBoleto');

            contenido.innerHTML = `<p>👤 <strong>Nombre:</strong> ${nombre}</p>`;

            mesasMap.forEach((sillas, mesa) => {
                const sillasStr = Array.from(sillas).join(', ');
                const p = document.createElement('p');
                p.innerHTML = `🪑 <strong>Mesa:</strong> ${mesa} | <strong>Sillas:</strong> ${sillasStr}`;
                contenido.appendChild(p);
            });

            modal.style.display = 'block';
        })
        .catch(error => {
            alert('Error: ' + error.message);
        });
    });
});

descargar.forEach(boleto => {
    boleto.addEventListener('click', (evento) => {
        // 1. Obtenemos los datos necesarios
        const codigo = evento.currentTarget.id; 
        console.log(`nombre${nombreEvento} idEvento:${idEvento}`);
        // 2. Construimos la URL con parámetros (Query Strings)
        const url = `/descargar-boleto?idEvento=${idEvento}&codigo=${codigo}`;
        // 3. Redirigimos para iniciar la descarga
        window.location.href = url;
    });
});

// function generarExcel() {
//   const datos = reservas.map(r => ({
//     Nombre: r.nombre,
//     Teléfono: r.telefono,
//     Código: r.codigo,
//     Boletos: r.boletos,
//     Juntar: r.juntar ? 'Sí' : 'No'
//   }));

//   const hoja = XLSX.utils.json_to_sheet(datos);
//   const libro = XLSX.utils.book_new();

//   XLSX.utils.book_append_sheet(libro, hoja, 'Reservas');

//   XLSX.writeFile(libro, `Reservas ${nombreEvento}.xlsx`);
// }

async function generarExcel() {
    try {
        const response = await fetch(`/api/reporte-ventas/${idEvento}`);
        const datos = await response.json();

        // Formateo de fecha larga
        const opcionesFecha = { day: 'numeric', month: 'long', year: 'numeric' };
        const fechaTexto = new Date(fecha).toLocaleDateString('es-ES', opcionesFecha);

        // 1. Transformar datos con nombres de columnas personalizados
        const datosProcesados = datos.map(fila => {
            const precioElegido = fila.preventa === 1 ? fila.precio : fila.precioD;
            const montoCalculado = precioElegido * fila.total_sillas;
            const tipoPago = fila.tipoPago === "Mostrador(Transferencia)" ? "Transferencia" :
                             fila.tipoPago === "Mostrador(Baucher)" ? "Baucher" :
                             fila.tipoPago === "Mostrador(Efectivo)" ? "Efectivo" :
                             "Linea";
            // Aquí personalizas los títulos (las llaves del objeto serán los encabezados)
            return {
                // "ID": fila.idEvento,
                "Mesa": fila.numero,
                "No. P": fila.total_sillas,
                "Monto": montoCalculado,
                "Método de Pago": tipoPago,
                "Código": fila.codigo,
                "Precio Unitario": precioElegido,
                "Preventa": fila.preventa === 1 ? "Si" : "No"
            };
        });

        const wb = XLSX.utils.book_new();

        // 2. Título superior (Fila 1: Nombre del Evento, Fila 2: Fecha escrita)
        const encabezadoSuperior = [
            [`EVENTO: ${nombreEvento.toUpperCase()}`],
            [`FECHA: ${fechaTexto.toUpperCase()}`],
            [] // Fila vacía de separación
        ];

        // 3. Crear la hoja iniciando en A4 para dejar espacio al encabezado
        const ws = XLSX.utils.json_to_sheet(datosProcesados, { origin: "A4" });

        // 4. Agregar el encabezado superior en A1
        XLSX.utils.sheet_add_aoa(ws, encabezadoSuperior, { origin: "C1" });

        ws['!merges'] = [
            // Combinar Fila 1 (r:0): desde Columna C (c:2) hasta Columna F (c:5)
            { s: { r: 0, c: 2 }, e: { r: 0, c: 4 } }, 
            // Combinar Fila 2 (r:1): desde Columna C (c:2) hasta Columna F (c:5)
            { s: { r: 1, c: 2 }, e: { r: 1, c: 4 } }
        ];

        // 5. Ajustar anchos de columna para que el texto no se corte
        ws['!cols'] = [
            // { wch: 6 },  // ID
            { wch: 8 }, // Número de Mesa
            { wch: 8 },  // Sillas
            { wch: 8 }, // Método de Pago
            { wch: 15 }, // Código
            { wch: 8 }, // Precio Unit.
            { wch: 12 }, // Estado Preventa
            { wch: 12 },  // Monto Final
            { wch: 25 }, //Titulo y fecha
        ];

        // 6. Generar archivo
        XLSX.utils.book_append_sheet(wb, ws, "Ventas");
        XLSX.writeFile(wb, `Reporte_${nombreEvento.replace(/ /g, '_')}.xlsx`);

    } catch (error) {
        console.error("Error:", error);
    }
}


const volver = document.getElementById('volver');


volver.addEventListener("click", () => {
  window.history.length > 1
    ? window.history.back()
    : window.location.href = "/";
});


async function eliminaReserva(codigo) {
    if (!confirm(`¿Estás seguro de que deseas eliminar la reserva ${codigo}?`)) {
        return;
    }

    try {
        const response = await fetch(`/quitar-reserva/${codigo}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            alert('Reserva eliminada correctamente');
            // Aquí puedes recargar la página o quitar el elemento del DOM
            location.reload(); 
        } else {
            const error = await response.json();
            alert('Error: ' + (error.error || 'No se pudo eliminar'));
        }
    } catch (error) {
        console.error('Error al llamar a eliminaReserva:', error);
        alert('Ocurrió un error en la conexión');
    }
}

const borrar = document.querySelectorAll('.borrar');
borrar.forEach(boton => {
    boton.addEventListener("click", async (e) => {
        // Obtenemos el código directamente del ID del elemento clickeado
        const codigo = e.currentTarget.id;

        // Confirmación estética
        const confirmar = confirm(`¿Estás seguro de eliminar la reserva: ${codigo}?`);
        
        if (confirmar) {
            try {
                const response = await fetch(`/quitar-reserva/${codigo}`, {
                    method: 'POST'
                });

                if (response.ok) {
                    location.reload();
                } else {
                    alert("No se pudo eliminar la reserva en el servidor.");
                }
            } catch (error) {
                console.error("Error en la petición:", error);
                alert("Error de conexión al intentar eliminar.");
            }
        }
    });
});