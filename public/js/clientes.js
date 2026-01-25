//para el swiper
const swiper = new Swiper(".mySwiper", {
    slidesPerView: 4,      // Mostrar 3 a la vez
    slidesPerGroup: 1,     // Avanzar de 1 en 1
    spaceBetween: 60,      // Separación entre items
    watchOverflow: true,
    loop: false,            // Loop infinito
    navigation: {
        nextEl: ".swiper-button-next",
        prevEl: ".swiper-button-prev",
    },
    breakpoints: {
        0: { slidesPerView: 1 },        // En pantallas muy pequeñas (por debajo de 400px)
        800: { slidesPerView: 2 },
        1100: { slidesPerView: 3 },
        1400: { slidesPerView: 4 }
    },
});

const hoy = new Date().toISOString().split('T')[0]; 

let datosEventos = [];
const listaEventos = 
fetch("/listado-de-eventos")
.then(response => response.json())
.then(data => {
    const eventos = document.querySelector('.principal .swiper .swiper-wrapper');
    data.forEach(evento => {
        const ev = {
            idEvento: evento.idEvento,
            nombre: evento.nombre,
            tipo: evento.tipo,
            fecha: evento.fecha,
            fechaP: evento.fechaP,
            hora: evento.hora,
            subtitulo: evento.subtitulo,
            imagen: evento.imagen,
            estado: evento.estado
        }
        datosEventos.push(ev);
        if(evento.estado === "cancelado")
            return;
        //inicio de creacion de la tarjeta de evento
        const swiperSlide = document.createElement('div');
        swiperSlide.className = 'swiper-slide';
        const eventoDiv = document.createElement('div');
        eventoDiv.className = 'evento';

        const imagenEvento = document.createElement('img');
        imagenEvento.src = `https://fincalacolorada.com/Eventos/${evento.imagen}`;
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
        botonVentas.textContent = 'COMPRAR BOLETOS';
        botonVentas.id = `${evento.idEvento}`;
        botonVentas.classList.add('ventas');
        botonVentas.dataset.eventoId = evento.idEvento;

        botones.append(botonVentas);

        //agregando todo al div evento
        swiperSlide.append(imagenEvento,titulo,subTitulo,fechayHora,botones)

        // eventoDiv.append(imagenEvento,titulo,subTitulo,fechayHora,botones);
        // swiperSlide.appendChild(eventoDiv);
        //agregando al swiper-wrapper correspondiente
        eventos.appendChild(swiperSlide);
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

    });
})
.catch(error => {
    console.error('Error al cargar datos', error);
});
