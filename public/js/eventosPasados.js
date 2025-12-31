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
        0: { slidesPerView: 1 },
        600: { slidesPerView: 2 },
        900: { slidesPerView: 4 }
    },
});

let datosEventos = [];
const listaEventos = 
fetch("/listado-de-eventos-pasados")
.then(response => response.json())
.then(data => {
    const eventoTrova = document.querySelector('.trova .swiper .swiper-wrapper');
    const eventoBaile = document.querySelector('.baile .swiper .swiper-wrapper');
    data.forEach(evento => {
        //console.log(`id: ${evento.idEvento} nombre: ${evento.nombre} tipo: ${evento.tipo} fecha: ${evento.fecha}`);
        const ev = {
            idEvento: evento.idEvento,
            nombre: evento.nombre,
            tipo: evento.tipo,
            fecha: evento.fecha,
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
        fechaEvento.appendChild(document.createTextNode(`${evento.fecha}`));


        fechayHora.append(fechaEvento);

        const botones = document.createElement('div');
        botones.className = "botones";

        const botonVentas = document.createElement('button');
        botonVentas.textContent = 'MOSTRAR VENTAS';
        botonVentas.id = `${evento.idEvento}`;
        botonVentas.classList.add('ventas');
        botonVentas.dataset.eventoId = evento.idEvento;

        const botonEliminar = document.createElement('button');
        botonEliminar.textContent = 'ELIMINAR';
        botonEliminar.classList.add('eliminar');
        botonEliminar.dataset.eventoId = evento.idEvento;

        botones.append(botonVentas,botonEliminar);

        //agregando todo al div evento
        eventoDiv.append(editarTxt,imagenEvento,titulo,subTitulo,fechayHora,botones);
        swiperSlide.appendChild(eventoDiv);
        //agregando al swiper-wrapper correspondiente
        if(evento.tipo === "General")
            eventoBaile.appendChild(swiperSlide);
        if(evento.tipo === "Trova")
            eventoTrova.appendChild(swiperSlide);
        
        //funcion del boton Ventas
        botonVentas.addEventListener('click', (e) => {
           e.preventDefault();

            const idEvento = e.currentTarget.dataset.eventoId;  

            // Redirige directamente a la ruta del servidor
            window.location.href = `/reporte/${idEvento}`;
        });

        //funcion del boton eliminar
        botonEliminar.addEventListener('click', (e) => {
            e.preventDefault();
            if(!confirm("Estas seguro que deseas eliminar el evento?")){
                return;
            }
            const idEvento = e.currentTarget.dataset.eventoId;

            fetch(`/eliminar/${idEvento}`, {
                method: 'DELETE'
            })
            .then(response => {
                if (!response.ok) throw new Error('Error al eliminar');
                return response.json();
            })
            .then(data => {
                console.log(data.message);
                alert('Evento eliminado correctamente');
                location.reload();  // Puedes cambiarlo si quieres actualizar el DOM sin recargar
            })
            .catch(error => {
                console.error('Error al eliminar el evento:', error);
                alert('Hubo un error al eliminar el evento.');
            });
        });

    });
})
.catch(error => {
    console.error('Error al cargar datos', error);
});


document.getElementById('volver').addEventListener('click', ()=> {
    window.location.href = "eventosAdmin.html";
})



