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

function generarExcel() {
  const datos = reservas.map(r => ({
    Nombre: r.nombre,
    Teléfono: r.telefono,
    Código: r.codigo,
    Boletos: r.boletos,
    Juntar: r.juntar ? 'Sí' : 'No'
  }));

  const hoja = XLSX.utils.json_to_sheet(datos);
  const libro = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(libro, hoja, 'Reservas');

  XLSX.writeFile(libro, `Reservas ${nombreEvento}.xlsx`);
}