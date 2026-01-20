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
        if (!response.ok) throw new Error("No se pudo obtener la información");
        const datos = await response.json();

        if (datos.length === 0) {
            alert("No hay ventas registradas.");
            return;
        }

        const fechaFormateada = new Date(fecha).toLocaleDateString('es-ES');

        // 1. Transformar los datos para el Excel
        const datosProcesados = datos.map(fila => {
            // Lógica: Si preventa === 1 usa 'precio', si no usa 'precioD'
            const precioElegido = fila.preventa === 1 ? fila.precio : fila.precioD;
            const montoCalculado = precioElegido * fila.total_sillas;

            return {
                "Evento ID": fila.idEvento,
                "Mesa": fila.numero,
                "Cant. Sillas": fila.total_sillas,
                "Tipo de Pago": fila.tipoPago,
                "Código Reserva": fila.codigo,
                "Precio Unit.": precioElegido,
                "Preventa": fila.preventa === 1 ? "Sí" : "No",
                "Monto Total": montoCalculado // La última columna que pediste
            };
        });

        // 2. Crear el libro y la hoja de trabajo
        const wb = XLSX.utils.book_new();
        
        // 3. Crear encabezado personalizado (Nombre y Fecha)
        const titulo = [[`Evento: ${nombreEvento}`, `Fecha: ${fechaFormateada}`], []]; 
        
        // 4. Combinar título con los datos
        // origin: "A3" deja las primeras dos filas para el título
        const ws = XLSX.utils.json_to_sheet(datosProcesados, { origin: "A3" });
        XLSX.utils.sheet_add_aoa(ws, titulo, { origin: "A1" });

        // 5. Ajustar anchos de columna (opcional pero recomendado)
        ws['!cols'] = [{ wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 25 }, { wch: 15 }, { wch: 12 }, { wch: 10 }, { wch: 15 }];

        // 6. Generar archivo y descargar
        XLSX.utils.book_append_sheet(wb, ws, "Reporte Ventas");
        XLSX.writeFile(wb, `Reporte_${nombreEvento.replace(/ /g, '_')}.xlsx`);

        console.log("Excel generado exitosamente");

    } catch (error) {
        console.error("Error:", error);
        alert("Hubo un error al generar el archivo.");
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