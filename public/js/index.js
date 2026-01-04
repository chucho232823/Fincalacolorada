//para el swiper
const swiper = new Swiper(".mySwiper", {
    slidesPerView: 3,      // Mostrar 3 a la vez
    slidesPerGroup: 1,     // Avanzar de 1 en 1
    spaceBetween: 60,      // Separación entre items
    // watchOverflow: true,
    loop: false,            // Loop infinito
    navigation: {
        nextEl: ".swiper-button-next",
        prevEl: ".swiper-button-prev",
    },
    breakpoints: {
        0: { slidesPerView: 1 },
        1100: { slidesPerView: 2 },
        1400: { slidesPerView: 3 }
    },
});

const hoy = new Date().toISOString().split('T')[0]; 
const controlIdEvento = document.querySelector('.idEvento');
let datosEventos = [];
const listaEventos = 
fetch("/listado-de-eventos")
.then(response => response.json())
.then(data => {
    const eventoTrova = document.querySelector('.trova .swiper .swiper-wrapper');
    const eventoBaile = document.querySelector('.baile .swiper .swiper-wrapper');
    data.forEach(evento => {
        //console.log(`id: ${evento.idEvento} nombre: ${evento.nombre} tipo: ${evento.tipo} fecha: ${evento.fecha}`);
        //console.log(`hora: ${evento.hora} descripcion:${evento.descripcion} imagen:${evento.imagen}`);
        //console.log(`Fecha evento ${evento.fecha}`);
        //console.log(`Fecha ${hoy}`);
        const ev = {
            idEvento: evento.idEvento,
            nombre: evento.nombre,
            tipo: evento.tipo,
            fecha: evento.fecha,
            hora: evento.hora,
            subtitulo: evento.subtitulo,
            imagen: evento.imagen
        }
        datosEventos.push(ev);

        //inicio de creacion de la tarjeta de evento
        const swiperSlide = document.createElement('div');
        swiperSlide.className = 'swiper-slide';
        const eventoDiv = document.createElement('div');
        eventoDiv.className = 'evento';
        
        const editarTxt = document.createElement('span');
        
        editarTxt.className = "editar";
        const icono = document.createElement('img');
        icono.className = "ico";
        icono.id = `${evento.idEvento}`;
        icono.src = "ico/editar.png";
        icono.alt = "icono editar";
        icono.dataset.eventoId = evento.idEvento;
        editarTxt.innerHTML = "EDITAR";
        editarTxt.appendChild(icono);

        const imagenEvento = document.createElement('img');
        imagenEvento.src = evento.imagen;
        imagenEvento.alt = "imagen evento";

        const titulo = document.createElement('span');
        titulo.className = "titulo";
        titulo.innerHTML = evento.nombre;

        const subTitulo = document.createElement('span');
        subTitulo.className = "subtitulo";
        subTitulo.innerHTML = evento.subtitulo;

        const fechayHora = document.createElement('div');
        fechayHora.className = 'fechaHora';

        const fechaEvento = document.createElement('span');
        const icoFecha = document.createElement('img');
        icoFecha.className = 'ico';
        icoFecha.src = 'ico/calendario.png';
        fechaEvento.appendChild(icoFecha);
        // console.log(`Evento: ${evento.nombre} fecha: ${evento.fecha}`)
        // console.log(`fecha: ${evento.fecha.replace(/ de/g,'')}`);
        fechaEvento.appendChild(document.createTextNode(`${evento.fecha.replace(/ de/g,'')}`));

        const horaEvento = document.createElement('span');
        const icoHora = document.createElement('img');
        icoHora.className = 'ico';
        icoHora.src = 'ico/reloj.png';
        horaEvento.appendChild(icoHora);
        horaEvento.appendChild(document.createTextNode(`   ${evento.hora}`));

        fechayHora.append(fechaEvento,horaEvento);

        const botones = document.createElement('div');
        botones.className = "botones";

        const botonVentas = document.createElement('button');
        botonVentas.textContent = 'VENTA MOSTRADOR';
        botonVentas.id = `${evento.idEvento}`;
        botonVentas.classList.add('ventas');
        botonVentas.dataset.eventoId = evento.idEvento;

        const botonReservas = document.createElement('button');
        botonReservas.textContent = 'RESERVAS';
        botonReservas.classList.add('reservas');
        botonReservas.dataset.eventoId = evento.idEvento;

        const botonEliminar = document.createElement('button');
        botonEliminar.textContent = 'ELIMINAR';
        botonEliminar.classList.add('eliminar');
        botonEliminar.dataset.eventoId = evento.idEvento;

        botones.append(botonVentas,botonReservas,botonEliminar);

        //agregando todo al div evento
        eventoDiv.append(editarTxt,imagenEvento,titulo,subTitulo,fechayHora,botones);
        swiperSlide.appendChild(eventoDiv);
        //agregando al swiper-wrapper correspondiente
        console.log(evento.tipo)
        if(evento.tipo === "Baile")
            eventoBaile.appendChild(swiperSlide);
        if(evento.tipo === "Trova")
            eventoTrova.appendChild(swiperSlide);
        
        //funcion del boton Ventas
        botonVentas.addEventListener('click', (e) => {
            e.preventDefault();

            const idEvento = e.currentTarget.dataset.eventoId;

            // Buscar el objeto del evento correspondiente
            const eventoSeleccionado = datosEventos.find(ev => ev.idEvento == idEvento);

            // Preparar y enviar el formulario
            const form = document.getElementById('jsonform');
            form.action = `/sembrado/${eventoSeleccionado.tipo.toLowerCase()}`;
            document.getElementById('jsonData').value = JSON.stringify(eventoSeleccionado);
            form.submit();
        });


        //funcion del boton Reservas
        botonReservas.addEventListener('click', (e) => {
            e.preventDefault();
            const idEvento = e.currentTarget.dataset.eventoId;
            window.location.href = `/lista/${idEvento}`;
        });

        //funcion del boton eliminar
        botonEliminar.addEventListener('click', async (e) => {
            e.preventDefault();
            console.log("evento id: " , e.currentTarget.dataset.eventoId)

            const idEvento = e.currentTarget.dataset.eventoId;

            // 1. Alerta de confirmación
            const confirmacion = await Swal.fire({
                title: '¿Estás seguro?',
                text: "Esta acción no se puede deshacer",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Sí, eliminar',
                cancelButtonText: 'Cancelar',
                buttonsStyling: false,
                customClass: {
                    popup: 'alert-popup',
                    title: 'alert-titulo',
                    confirmButton: 'alert-boton',
                    cancelButton: 'alert-boton-cancelar' // Opcional: añade estilo al botón cancelar
                }
            });

            // Si el usuario cancela, detenemos la ejecución
            if (!confirmacion.isConfirmed) return;
            

            try {
                const response = await fetch(`/eliminar/${idEvento}`, {
                    method: 'DELETE'
                });

                if (!response.ok) throw new Error('Error al eliminar');
                
                const data = await response.json();

                // 2. Alerta de éxito (usando tu estilo personalizado)
                await Swal.fire({
                    title: 'Finca la colorada dice:',
                    text: data.message || 'Evento eliminado correctamente',
                    icon: 'success',
                    confirmButtonColor: '#68AAFC',
                    confirmButtonText: 'Aceptar',
                    allowOutsideClick: false,
                    allowEscapeKey: false,
                    buttonsStyling: false,
                    customClass: {
                        popup: 'alert-popup',
                        title: 'alert-titulo',
                        confirmButton: 'alert-boton'
                    },
                });

                location.reload();

            } catch (error) {
                console.error('Error:', error);
                
                // 3. Alerta de error
                Swal.fire({
                    title: 'Error',
                    text: 'Hubo un error al eliminar el evento.',
                    icon: 'error',
                    confirmButtonText: 'Cerrar',
                    buttonsStyling: false,
                    customClass: {
                        popup: 'alert-popup',
                        confirmButton: 'alert-boton'
                    }
                });
            }
        });

        // boton editar
        icono.addEventListener('click', async (e) => {
            e.preventDefault();
            controlIdEvento.id = icono.id;
            document.querySelector(".modal").style.display = "flex";
            if(evento.tipo === "Trova"){
                document.querySelector("#Modal-Edita-Trova").style.display = "grid";
                // e.currentTarget siempre será el span aunque el usuario haga click en el icono
                const idEvento = e.currentTarget.dataset.eventoId;
                // === 1. Obtener datos del servidor ===
                const response = await fetch(`/api/editar/${idEvento}`);
                const data = await response.json();
                // === 2. Llenar inputs del modal ===
                
                document.querySelector("#Modal-Edita-Trova input[name='nombre']").value = data.nombreEvento;
                document.querySelector("#Modal-Edita-Trova input[name='subtitulo']").value = data.subtitulo;
                document.querySelector("#Modal-Edita-Trova input[name='fecha']").value = data.fechaEvento.split("T")[0];
                document.querySelector("#Modal-Edita-Trova input[name='fechap']").value = data.fechaPreventa.split("T")[0];
                document.querySelector("#Modal-Edita-Trova input[name='hora']").value = data.hora;
                // === 3. Llenar precios ===
                data.precios.forEach(p => {
                    const tipo = p.tipo.toLowerCase(); // vip, general, preferente
                    document.querySelector(`#Modal-Edita-Trova input[name="${tipo.toLowerCase()}"]`).value = p.precio;
                    document.querySelector(`#Modal-Edita-Trova input[name="${tipo.toLowerCase()}D"]`).value = p.precioD;
                });
            }

            if(evento.tipo === "Baile"){
                document.querySelector("#Modal-Edita-Baile").style.display = "grid";
                // e.currentTarget siempre será el span aunque el usuario haga click en el icono
                const idEvento = e.currentTarget.dataset.eventoId;
                // === 1. Obtener datos del servidor ===
                const response = await fetch(`/api/editar/${idEvento}`);
                const data = await response.json();
                // === 2. Llenar inputs del modal ===
                
                document.querySelector("#Modal-Edita-Baile input[name='nombre']").value = data.nombreEvento;
                document.querySelector("#Modal-Edita-Baile input[name='subtitulo']").value = data.subtitulo;
                document.querySelector("#Modal-Edita-Baile input[name='fecha']").value = data.fechaEvento.split("T")[0];
                document.querySelector("#Modal-Edita-Baile input[name='fechap']").value = data.fechaPreventa.split("T")[0];
                document.querySelector("#Modal-Edita-Baile input[name='hora']").value = data.hora;
                // === 3. Llenar precios ===
                data.precios.forEach(p => {
                    const tipo = p.tipo.toLowerCase(); // vip, general, preferente
                    document.querySelector(`#Modal-Edita-Baile input[name="${tipo.toLowerCase()}"]`).value = p.precio;
                    document.querySelector(`#Modal-Edita-Baile input[name="${tipo.toLowerCase()}D"]`).value = p.precioD;
                });
            }

            console.log("Evento cargado en modal:", data);
        });
    });
})
.catch(error => {
    console.error('Error al cargar datos', error);
});

console.log(datosEventos);

//console.log(datosEventos);


//Agregar Trova

const modalTrova = document.querySelector('.modal.trova');

document.querySelector('.trova .contA .Anadir .evento #Agregar')
.addEventListener('click', () => {
    document.querySelector(".modal").style.display = "flex";
    document.querySelector("#Modal-Trova").style.display = "grid";
});

document.querySelector('.baile .contA .Anadir .evento #Agregar')
.addEventListener('click', () => {
    document.querySelector(".modal").style.display = "flex";
    document.querySelector("#Modal-Baile").style.display = "grid";
});

document.getElementById('eventosPasados').addEventListener('click', ()=> {
    window.location.href = "eventosPasados.html";
})


//obtencion de datos
document.getElementById("Modal-Trova").addEventListener("submit", async function(e) {
    e.preventDefault(); // Evita que el form recargue la página

    const form = e.target;
    const data = new FormData(form);

    // Crear constantes para cada dato
    const nombre = data.get("nombre");
    const subtitulo = data.get("subtitulo");
    const fecha = data.get("fecha");
    const fechaPreventa = data.get("fechap");
    const hora = data.get("hora");
    const laterales = data.get("laterales");
    const lateralesD = data.get("lateralesD");
    const general = data.get("general");
    const generalD = data.get("generalD");
    const preferente = data.get("preferente");
    const preferenteD = data.get("preferenteD");
    const vip = data.get("vip");
    const vipD = data.get("vipD");    

    // Ejemplo: mostrar en consola
    console.log({
        nombre,
        subtitulo,
        fecha,
        fechaPreventa,
        hora,
        laterales,
        lateralesD,
        general,
        generalD,
        preferente,
        preferenteD,
        vip,
        vipD
    });
    // Enviando al backend
    const enviarDatos = {
        nombre: nombre,
        fecha: fecha,
        fechaP: fechaPreventa,
        tipo: "Trova",
        subtitulo: subtitulo,
        hora: hora,
        precio: {
            VIP: vip,
            Preferente: preferente,
            General: general,
            Laterales: laterales
        },
        precioD: {
            VIP: vipD,
            Preferente: preferenteD,
            General: generalD,
            Laterales: lateralesD
        }
    };

    let alerta;
    try {
        const res = await fetch("/crearEvento", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(enviarDatos)
        });
        const respuesta = await res.json();
        console.log("📥 Respuesta servidor:", respuesta);

        // Cargando la imagen
        const idEvento = respuesta.idEvento; 
        const imagen = data.get("imagen"); 
        console.log(imagen && imagen.size > 0);
        if (imagen && imagen.size > 0) {
            const imageFormData = new FormData();
            imageFormData.append("imagen", imagen);
            imageFormData.append("idEvento", idEvento); 

            // Enviamos la imagen al servidor
            await fetch('/subir-imagen', { // Ajusta a tu endpoint real
                method: 'POST',
                body: imageFormData
            });
        } else {
            console.log("No se seleccionó imagen, se usara una por defecto");
        }

        alerta = await Swal.fire({
            title: 'Finca la colorada dice:',
            text: respuesta.message,
            icon: 'success', // puede ser 'success', 'error', 'warning', 'info', 'question'
            confirmButtonColor: '#68AAFC',
            confirmButtonText: 'Aceptar',
            allowOutsideClick: false,
            allowEscapeKey: false,
            buttonsStyling: false,
            customClass: {
                popup: 'alert-popup',
                title: 'alert-titulo',
                confirmButton: 'alert-boton'
            },
        });
        //alert(respuesta);
        
    } catch (err) {
        console.error("❌ Error al enviar:", err);
    }
    if(alerta.isConfirmed)
        window.location.href = "/";
});

document.getElementById("Modal-Baile").addEventListener("submit", async function(e) {
    e.preventDefault(); // Evita que el form recargue la página

    const form = e.target;
    const data = new FormData(form);

    // Crear constantes para cada dato
    const nombre = data.get("nombre");
    const subtitulo = data.get("subtitulo");
    const fecha = data.get("fecha");
    const fechaPreventa = data.get("fechap");
    const hora = data.get("hora");
    const imagen = data.get("imagen");

    const general = data.get("general");
    const generalD = data.get("generalD");
    const preferente = data.get("preferente");
    const preferenteD = data.get("preferenteD");
    const vip = data.get("vip");
    const vipD = data.get("vipD");

    // Ejemplo: mostrar en consola
    console.log({
        nombre,
        subtitulo,
        fecha,
        fechaPreventa,
        hora,
        imagen,
        general,
        generalD,
        preferente,
        preferenteD,
        vip,
        vipD
    });

    // Enviando al backend
    const enviarDatos = {
        nombre: nombre,
        fecha: fecha,
        fechaP: fechaPreventa,
        tipo: "Baile",
        subtitulo: subtitulo,
        hora: hora,
        precio: {
            VIP: vip,
            Preferente: preferente,
            General: general,
        },
        precioD: {
            VIP: vipD,
            Preferente: preferenteD,
            General: generalD,
        }
    };

    let alerta;
    try {
        const res = await fetch("/crearEvento", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(enviarDatos)
        });
        const respuesta = await res.json();
        console.log("📥 Respuesta servidor:", respuesta);

        // Cargando la imagen
        const idEvento = respuesta.idEvento; 
        const imagen = data.get("imagen"); 
        console.log(imagen && imagen.size > 0);
        if (imagen && imagen.size > 0) {
            const imageFormData = new FormData();
            imageFormData.append("imagen", imagen);
            imageFormData.append("idEvento", idEvento); 

            // Enviamos la imagen al servidor
            await fetch('/subir-imagen', { // Ajusta a tu endpoint real
                method: 'POST',
                body: imageFormData
            });
        } else {
            console.log("No se seleccionó imagen, se usara una por defecto");
        }

        alerta = await Swal.fire({
            title: 'Finca la colorada dice:',
            text: respuesta.message,
            icon: 'success', // puede ser 'success', 'error', 'warning', 'info', 'question'
            confirmButtonColor: '#68AAFC',
            confirmButtonText: 'Aceptar',
            allowOutsideClick: false,
            allowEscapeKey: false,
            buttonsStyling: false,
            customClass: {
                popup: 'alert-popup',
                title: 'alert-titulo',
                confirmButton: 'alert-boton'
            },
        });
        //alert(respuesta);
        
    } catch (err) {
        console.error("❌ Error al enviar:", err);
    }
    if(alerta.isConfirmed)
        window.location.href = "/";
});

//edicion de trova

//obtencion de datos
document.getElementById("Modal-Edita-Trova").addEventListener("submit", async function(e) {
    e.preventDefault(); // Evita que el form recargue la página
    const idEvento = controlIdEvento.id;
    const form = e.target;
    const data = new FormData(form);

    try {
      const nombre = document.querySelector('#Modal-Edita-Trova input[name=nombre]').value;
      const subtitulo = document.querySelector('#Modal-Edita-Trova input[name=subtitulo]').value;
      const fecha = document.querySelector('#Modal-Edita-Trova input[name=fecha]').value;
      const fechaPreventa = document.querySelector('#Modal-Edita-Trova input[name=fechap]').value;
      const hora = document.querySelector('#Modal-Edita-Trova input[name=hora]').value;

      const laterales = parseFloat(document.querySelector('#Modal-Edita-Trova input[name=laterales]').value);
      const lateralesD = parseFloat(document.querySelector('#Modal-Edita-Trova input[name=lateralesD]').value);
      const general = parseFloat(document.querySelector('#Modal-Edita-Trova input[name=general]').value);
      const generalD = parseFloat(document.querySelector('#Modal-Edita-Trova input[name=generalD]').value);
      const preferente = parseFloat(document.querySelector('#Modal-Edita-Trova input[name=preferente]').value);
      const preferenteD = parseFloat(document.querySelector('#Modal-Edita-Trova input[name=preferenteD]').value);
      const vip = parseFloat(document.querySelector('#Modal-Edita-Trova input[name=vip]').value);
      const vipD = parseFloat(document.querySelector('#Modal-Edita-Trova input[name=vipD]').value);

      // 🔹 Objeto que espera tu backend
      const enviarDatos = {
        tipo: "Trova",
        nombre: nombre,
        subtitulo: subtitulo,
        fecha: fecha,
        fechaP: fechaPreventa,
        hora: hora,
        precio: {
          VIP: vip,
          Preferente: preferente,
          General: general,
          Laterales: laterales
        },
        precioD: {
          VIP: vipD,
          Preferente: preferenteD,
          General: generalD,
          Laterales: lateralesD
        }
      };
      console.log(typeof(idEvento));
      const entero = parseInt(idEvento);
      console.log(typeof(entero));
      console.log("Enviando:", enviarDatos);

      const response = await fetch(`/cambio/${idEvento}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(enviarDatos)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al actualizar el evento");
      }

      const result = await response.json();
      console.log("Evento actualizado:", result);

      alert("Evento actualizado correctamente");
      location.reload();
    } catch (error) {
      console.error("Error:", error.message);
      alert("Error al actualizar el evento");
    }
});

document.getElementById("Modal-Edita-Baile").addEventListener("submit", async function(e) {
    e.preventDefault(); // Evita que el form recargue la página
    const idEvento = controlIdEvento.id;
    const form = e.target;
    const data = new FormData(form);

    try {
      const nombre = document.querySelector('#Modal-Edita-Baile input[name=nombre]').value;
      const descripcion = document.querySelector('#Modal-Edita-Baile input[name=subtitulo]').value;
      const fecha = document.querySelector('#Modal-Edita-Baile input[name=fecha]').value;
      const fechaPreventa = document.querySelector('#Modal-Edita-Baile input[name=fechap]').value;
      const hora = document.querySelector('#Modal-Edita-Baile input[name=hora]').value;

      const general = parseFloat(document.querySelector('#Modal-Edita-Baile input[name=general]').value);
      const generalD = parseFloat(document.querySelector('#Modal-Edita-Baile input[name=generalD]').value);
      const preferente = parseFloat(document.querySelector('#Modal-Edita-Baile input[name=preferente]').value);
      const preferenteD = parseFloat(document.querySelector('#Modal-Edita-Baile input[name=preferenteD]').value);
      const vip = parseFloat(document.querySelector('#Modal-Edita-Baile input[name=vip]').value);
      const vipD = parseFloat(document.querySelector('#Modal-Edita-Baile input[name=vipD]').value);

      // 🔹 Objeto que espera tu backend
      const enviarDatos = {
        tipo: "Baile",
        nombre: nombre,
        subtitulo: descripcion,
        fecha: fecha,
        fechaP: fechaPreventa,
        hora: hora,
        precio: {
          VIP: vip,
          Preferente: preferente,
          General: general,
        },
        precioD: {
          VIP: vipD,
          Preferente: preferenteD,
          General: generalD,
        }
      };
      console.log(typeof(idEvento));
      const entero = parseInt(idEvento);
      console.log(typeof(entero));
      console.log("Enviando:", enviarDatos);

      const response = await fetch(`/cambio/${idEvento}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(enviarDatos)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al actualizar el evento");
      }

      const result = await response.json();
      console.log("Evento actualizado:", result);

      alert("Evento actualizado correctamente");
      location.reload();
    } catch (error) {
      console.error("Error:", error.message);
      alert("Error al actualizar el evento");
    }
});



document.addEventListener("DOMContentLoaded", () => {
  // Busca todos los formularios que tengan fecha y fechap
  document.querySelectorAll("form").forEach(form => {
    const fechaInput = form.querySelector("input[name='fecha']");
    const fechaPInput = form.querySelector("input[name='fechap']");

    // Si el form no tiene esos inputs, se ignora
    if (!fechaInput || !fechaPInput) return;

    const hoy = new Date().toISOString().split("T")[0];

    // La fecha principal no puede ser menor a hoy
    fechaInput.min = hoy;

    // Cuando cambia la fecha principal
    fechaInput.addEventListener("change", () => {
      fechaPInput.max = fechaInput.value;

      if (fechaPInput.value && fechaPInput.value > fechaInput.value) {
        fechaPInput.value = "";
      }
    });
  });
});
