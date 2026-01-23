let sesion;
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const res = await fetch('/api/session/estado', {
            credentials: 'include'
        });

        sesion = await res.json();
        
        const divPago = document.querySelector('.metodoPago');
        if (sesion.autenticado) {
            divPago.style.display = "flex";
        } else {
            divPago.style.display = "none";
}
    } catch (error) {
        console.error('Error verificando sesión', error);
    }
});
function generateTables(container, totalTables, tablesPerColumn, numFila, zona, chairsPerTable = 4) {
    for (let col = 0; col < Math.ceil(totalTables / tablesPerColumn); col++) {
        
        // Crear un contenedor para la columna
        const column = document.createElement('div');
        column.style.display = 'grid';
        column.style.gridTemplateRows = `repeat(${tablesPerColumn}, auto)`;
        column.style.gap = '10px';
        if(zona === "der" || zona === "izq"){
            column.classList.add('mesasLaterales');
        }
        if(zona === "centro"){
            column.classList.add('mesasCentro');
        }

        for (let i = 0; i < tablesPerColumn; i++) {
            const tableIndex = col * tablesPerColumn + i; // Índice global de la mesa
            if (tableIndex >= totalTables) break; // No generar más mesas si excede el total

            const tableWrapper = document.createElement('div');
            tableWrapper.classList.add('table-wrapper');

            const table = document.createElement('div');
            const span = document.createElement('span');
            table.classList.add('table');
            span.classList.add('numMesa');
            table.id = (numFila++); 
            span.textContent = numFila-1;
            table.appendChild(span);
            if(zona ==='centro'){
                //primeras 3 mesas de cada fila del centro son vip
                table.classList.add('vip');                             
                tableWrapper.appendChild(table);
            }else if(zona === 'izq' || zona ==='der'){
                //primeras 2 mesas pegadas al centro vip
                table.classList.add('preferente');                             
                tableWrapper.appendChild(table);
            }
            // Crear el número adecuado de sillas según 'chairsPerTable'
            for (let j = 0; j < chairsPerTable; j++) {
                const chair = document.createElement('div');   
                // //console.log(table.className);
                switch(j){
                    case 0: chair.id = 'A'; 
                        break;
                    case 1: chair.id = 'B';
                        break;
                    case 2: chair.id = 'C';
                        break;
                    case 3: chair.id = 'D';
                        break;
                }                    
                if(container.className === "centro-mesas" && table.className.includes("tres")){
                    chair.classList.add('chair3');
                }else{
                    chair.classList.add('chair');
                }
                table.appendChild(chair);
            }
            chairsPerTable = 4;
            column.appendChild(tableWrapper);     
        }

        // Agregar la columna completa al contenedor principal
        container.appendChild(column);
    }
}



function generateTablesHorizontal(container, totalTables, tablesPerRow, numFila, chairsPerTable = 3) {
    // Crear un contenedor para las filas
    const rowWrapper = document.createElement('div');
    rowWrapper.style.display = 'grid';
    rowWrapper.style.gridTemplateColumns = `repeat(${tablesPerRow}, auto)`;
    rowWrapper.style.gap = '0px';
    rowWrapper.classList.add('plataforma');

    for (let i = 0; i < totalTables; i++) {
        const tableIndex = i; // Índice global de la mesa

        // Si la mesa está en los índices vip, añadir la clase 'vip'
        const tableWrapper = document.createElement('div');
        tableWrapper.classList.add('table-wrapper');

        const table = document.createElement('div');
        const span = document.createElement('span');

        if(chairsPerTable == 3){
            table.classList.add('table','gral','tres');
            span.classList.add('numMesa');
            table.id = (numFila); 
            span.textContent = numFila++;
            span.style.transform = 'rotate(0deg)'; 
            table.appendChild(span);
            tableWrapper.appendChild(table);


            // Crear el número adecuado de sillas según 'chairsPerTable'
            for (let j = 0; j < chairsPerTable; j++) {
                const chair = document.createElement('div');
                switch(j){
                    case 0: chair.id = 'A'; 
                        break;
                    case 1: chair.id = 'B';
                        break;
                    case 2: chair.id = 'C';
                        break;
                    case 3: chair.id = 'D';
                        break;
                }    
                chair.classList.add('chair3');
                table.appendChild(chair);
            }
        } else if(chairsPerTable == 2){
            table.classList.add('table','gral','dos');
            span.classList.add('numMesa');
            table.id = (numFila); 
            span.textContent = numFila++;
            span.style.transform = 'rotate(0deg)'; 
            table.appendChild(span);
            tableWrapper.appendChild(table);

            // Crear el número adecuado de sillas según 'chairsPerTable'
            for (let j = 0; j < chairsPerTable; j++) {
                const chair = document.createElement('div');
                switch(j){
                    case 0: chair.id = 'A'; 
                        break;
                    case 1: chair.id = 'B';
                        break;
                }    
                chair.classList.add('chair2');
                table.appendChild(chair);
            }
        }
        

        // Agregar la mesa y sus sillas a la fila
        rowWrapper.appendChild(tableWrapper);
    }

    // Agregar todas las mesas horizontales al contenedor principal
    container.appendChild(rowWrapper);
}

// Generar mesas en la sección VIP con 3 sillas por mesa

//Zona Vip naranja
//Zona Preferente blanco
//Zona General Azul

const vipContainer = document.querySelector('.centro-mesas');
generateTables(vipContainer, 6, 6, 411,"centro"); // Zona Centro fila 1
generateTables(vipContainer, 6, 6, 421,"centro"); // Zona Centro fila 2S
generateTables(vipContainer, 6, 6, 431,"centro"); // Zona Centro fila 3
generateTables(vipContainer, 6, 6, 441,"centro"); // Zona Centro fila 4


// Generar mesas en la sección General Izquierda (tercera columna con 'vip')
const leftContainer = document.querySelector('.izq');
generateTables(leftContainer, 6, 6,311,"izq"); // La primera columna
generateTables(leftContainer, 3, 3,321,"izq"); // La segunda columna
generateTables(leftContainer, 4, 4,331,"izq"); // La tercera columna

// Generar mesas en la sección General Derecha (primera columna con 'vip')
const rightContainer = document.querySelector('.der');
generateTables(rightContainer, 6, 6,511,'der'); // La primera columna
generateTables(rightContainer, 3, 3,521,'der'); // La segunda columna
generateTables(rightContainer, 6, 6,531,'der'); // La tercera columna

//Generar mesas en las nuevas zonas del footer
const footerIzq = document.querySelector('.footer-izq');
generateTablesHorizontal(footerIzq, 2, 2, 231,2); // Mesas con 2 sillas en el footer
generateTablesHorizontal(footerIzq, 3, 3, 233,2); // Mesas con 2 sillas en el footer

const footerDer = document.querySelector('.footer-der');
generateTablesHorizontal(footerDer, 5, 5,215,2); // Mesas con 3 sillas en el footer


let sillas = document.querySelectorAll('.chair, .chair3, .chair2');

/**
 * para orden del map
 */
const controlFila = new Map();
function insertSortedKey(key, value) {
  controlFila.set(key, value);

  // Ordenar por clave numérica
  const sorted = [...controlFila.entries()].sort((a, b) => a[0] - b[0]);

  // Reemplazar el contenido del map con el ordenado
  controlFila.clear();
  sorted.forEach(([k, v]) => controlFila.set(k, v));
}

/**
 * Funcion para mesas consecutivas (antierror)
 */
function conservarSoloSiConsecutivos(map) {
  const keys = [...map.keys()].sort((a, b) => a - b);

  let consecutivos = true;

  for (let i = 1; i < keys.length; i++) {
    if (keys[i] - keys[i - 1] !== 1) {
      consecutivos = false;
      //break;
    }
    if(!consecutivos){
        //console.log(`mesa: ${keys[i]} eliminada`)
        const contenedor = document.getElementById(`${keys[i]}`);
        if (contenedor) {
            // Selecciona todos los elementos hijos con la clase "activa"
            const activos = contenedor.querySelectorAll('.activa');
            // Quitar la clase "activa" a cada uno
            activos.forEach(el => el.classList.remove('activa'));
        }
    }
  }

  if (!consecutivos) {
    const firstKey = keys[0];
    const firstValue = map.get(firstKey);
    map.clear();
    map.set(firstKey, firstValue);
  }

  return map;
}

let principal;
let final;

/*sillas.forEach(silla => {
    silla.addEventListener('click', () => {
        const wrapper = silla.closest('.table-wrapper');
        const mesa = wrapper.querySelector('.table');
        let numero = controlFila.get(mesa.id);
        if(silla.classList.contains('ocupada')){
            alert('Silla ocupada');
            return;
        }
        //console.log(`Mesa: ${mesa.id} Silla: ${silla.id}`);
        if(controlFila.has(mesa.id)){     
            if(silla.classList.contains('activa')){
                insertSortedKey(mesa.id, --numero);
            }else{
                insertSortedKey(mesa.id, ++numero);
            }
            if(numero === 0 ){
                controlFila.delete(mesa.id);
                const [firstKey, firstValue] = controlFila?.entries?.().next?.().value ?? [];
                conservarSoloSiConsecutivos(controlFila);
                principal = firstKey;
                final = [...controlFila.entries()].at(-1);
                //console.log(`Mesa inicial: ${principal} Mesa final: ${final}`);
            }
        }else if(controlFila.size == 0){
            insertSortedKey(mesa.id,1);
            const [firstKey] = controlFila?.entries?.().next?.().value ?? [];
            principal = firstKey;
            final = firstKey;
            //console.log(`Mesa inicial: ${principal} Mesa final: ${final}`);
            ////console.log(firstValue);
        }else{
            //console.log('comprobacion:')
            //console.log(`Eleccion: ${mesa.id} inicial - 1 = ${parseInt(principal) - 1} final + 1 = ${parseInt(final) + 1}`)
            if(parseInt(principal) - 1 != mesa.id && parseInt(final) + 1 != mesa.id){
                alert('esta mesa no puede ser seleccionada');
                return;
            }
            else{
                alert(`para poder apartar mas de una mesa debe sobrar
                como mucho una sola 1 silla de todas las mesas`);
                insertSortedKey(mesa.id,1);
                final = [...controlFila.entries()].at(-1);
                principal = controlFila?.entries?.().next?.().value ?? [];
            }
        }
        //console.log(controlFila);
        silla.classList.toggle('activa');

        if(numero === 2 && mesa.id >= 215 && mesa.id <= 219){
            const respuesta = confirm("Puedes agregar una silla mas, ¿Deseas agregarla?");
            if(respuesta){
                //console.log('se agrego una silla');
                const chair = document.createElement('div');
                chair.id = 'C'
                chair.classList.add('chair3');
                mesa.appendChild(chair);
                // Seleccionar todos los hijos con clase "chair2 activa"
                const sillasL = mesa.querySelectorAll(".chair2.activa");
                // Recorrer y cambiar la clase
                sillasL.forEach((silla) => {
                    silla.classList.remove("chair2");
                    silla.classList.add("chair3");
                });
                sillas = document.querySelectorAll('.chair, .chair3, .chair2');
            }else{
                //console.log('no se agrego nadota');
            }
        }
    });
}); */

//probando con mesas
const mesas = document.querySelectorAll('.table');
// mesas.forEach(mesa => {
//     //console.log(mesa.id);
// })
// //console.log(mesas[30]);
// //console.log(mesas[30].parentElement.parentElement.parentElement.className);
// //console.log(mesas[0].parentElement.parentElement.parentElement.className);

let sillasSeleccionadas = 0;
let sillasMaximas = 2;

/**
 * funcion async para verificar la silla
 */

async function verificarSilla(sembrado, mesa, silla) {
  try {
    const res = await fetch(`/estado-silla/${sembrado}?mesa=${mesa.id}&silla=${silla.id}`);

    if (!res.ok) {
      throw new Error('Error en la solicitud');
    }

    const data = await res.json();
    //console.log('Estado de la silla:', data);

    if (data[0].estado || data[0].bloqueada || data[0].enEspera) {
      silla.classList.add('ocupada');
    }

  } catch (err) {
    console.error('Error:', err);
  }
}


mesas.forEach(mesa => {
    mesa.addEventListener('click', async function(e) {
        //const wrapper = silla.closest('.table-wrapper');
        //const mesa = wrapper.querySelector('.table');
        if (e.target.classList.contains("chair") || 
              e.target.classList.contains("chair2") || 
              e.target.classList.contains("chair3")) {
    
            const silla = e.target;
            let numero = controlFila.get(mesa.id);
            await verificarSilla(sembrado, mesa, silla);
            if(silla.classList.contains('ocupada')){
                alerta = await Swal.fire({
                    title: 'Finca la colorada dice:',
                    text: "Silla ocupada",
                    icon: 'warning', // puede ser 'success', 'error', 'warning', 'info', 'question'
                    confirmButtonColor: '#68AAFC',
                    confirmButtonText: 'ACEPTAR',
                    allowOutsideClick: false,
                    allowEscapeKey: false,
                    buttonsStyling: false,
                    customClass: {
                        popup: 'alert-popup',
                        title: 'alert-titulo',
                        confirmButton: 'alert-boton'
                    },
                });
                return;
            }

            //Verificar si aun se pueden seleccionar sillas
            if(sillasSeleccionadas >= sillasMaximas && !silla.classList.contains('activa')){
                alerta = await Swal.fire({
                    title: 'Finca la colorada dice:',
                    text:'Para seleccionar mas sillas aumenta el numero de boletos',
                    icon: 'warning', // puede ser 'success', 'error', 'warning', 'info', 'question'
                    confirmButtonColor: '#68AAFC',
                    confirmButtonText: 'ACEPTAR',
                    allowOutsideClick: false,
                    allowEscapeKey: false,
                    buttonsStyling: false,
                    customClass: {
                        popup: 'alert-popup',
                        title: 'alert-titulo',
                        confirmButton: 'alert-boton'
                    },
                });
                // alert('Para seleccionar mas sillas aumenta el numero de boletos');
                ////console.log(`Sillas seleccionadas = ${sillasSeleccionadas}`);
                // insertSortedKey(mesa.id, --numero);
                ////console.log(controlFila);
                return;
            }

            //console.log(`Mesa: ${mesa.id} Silla: ${silla.id}`);
            if(controlFila.has(mesa.id)){     
                if(silla.classList.contains('activa')){
                    insertSortedKey(mesa.id, --numero);
                    sillasSeleccionadas--;
                    //console.log(`Sillas seleccionadas = ${sillasSeleccionadas}`);
                }else{
                    insertSortedKey(mesa.id, ++numero);
                }
                if(numero === 0){
                    controlFila.delete(mesa.id);
                }
            }else if(controlFila.size == 0){
                insertSortedKey(mesa.id,1);
            }else{
                //aqui se hara una desicion sobre la seleccion de mesas
                insertSortedKey(mesa.id,1);
            }
            
            if(!silla.classList.contains('activa')){
                sillasSeleccionadas++;
                //console.log(`Sillas seleccionadas = ${sillasSeleccionadas}`);
                //console.log(controlFila);
            }else{
               //console.log(controlFila); 
            }

            silla.classList.toggle('activa');
            ////console.log('hijos: ',mesa.children.length); esto se queda
            // if(numero === 2 && mesa.id >= 215 && mesa.id <= 219 && mesa.children.length === 3){
            //     const respuesta = confirm("Puedes agregar una silla mas, ¿Deseas agregarla?");
            //     if(respuesta){
            //         //console.log('se agrego una silla');
            //         const chair = document.createElement('div');
            //         chair.id = 'C'
            //         chair.classList.add('chair3');
            //         mesa.appendChild(chair);
            //         // Seleccionar todos los hijos con clase "chair2 activa"
            //         const sillasL = mesa.querySelectorAll(".chair2.activa");
            //         // Recorrer y cambiar la clase
            //         sillasL.forEach((silla) => {
            //             silla.classList.remove("chair2");
            //             silla.classList.add("chair3");
            //         });
            //         sillas = document.querySelectorAll('.chair, .chair3, .chair2');
            //     }else{
            //         //console.log('no se agrego nadota');
            //     }
            // }
        }
        //mostrar mesas elegidas en el boletaje
        //console.log(controlFila);
        const divMesas = document.querySelector('.mesasSeleccionadas');
        
        // while (divMesas.firstChild) {
        //     divMesas.removeChild(divMesas.firstChild);
        // }
        
        //limpiando los divs
        const laterales = document.querySelector('.lateral');
        const generales = document.querySelector('.generales');
        const preferentes = document.querySelector('.preferentes');
        const vips = document.querySelector('.vips');

        laterales.style.display = 'none'
        generales.style.display = 'none'
        preferentes.style.display = 'none'
        vips.style.display = 'none'
        
        while (laterales.children.length > 1) laterales.removeChild(laterales.children[1]);
        while (generales.children.length > 1) generales.removeChild(generales.children[1]);
        while (preferentes.children.length > 1) preferentes.removeChild(preferentes.children[1]);
        while (vips.children.length > 1) vips.removeChild(vips.children[1]);

        let totalPagar = 0;
        controlFila.forEach((numero,mesa) => {
            //console.log(mesa);
            const mesaElegida = document.createElement('div');
            const sillasElegidas = document.createElement('div');
            const spanSillas = document.createElement('span');
            // const zona = document.getElementById(`${mesa}`).parentElement.parentElement.parentElement;
            const sillas = document.getElementById(`${mesa}`).children;
            //extrayendo la sona
            const zona = precios.find(b => parseInt(b.mesa) === parseInt(mesa));  
            //console.log(zona.tipo);
            // mesaElegida.innerText = `Zona ${zona.tipo} (mesa ${mesa})`;   
            spanSillas.innerHTML = `Mesa ${mesa} Silla(s) `;
            let totalMesa = 0;  
            const hoy = new Date();
            hoy.setHours(0, 0, 0, 0); // elimina la hora para comparar solo fechas
            
            let preventa = new Date(fechaPreventa);
            preventa.setHours(0, 0, 0, 0);
            preventa.setDate(preventa.getDate() + 1);
            for (let i = 0; i < sillas.length; i++) {
                if(sillas[i].classList.contains('activa')){
                    const precioSilla = precios.find(b => parseInt(b.mesa) === parseInt(mesa) && b.silla === sillas[i].id)
                    //console.log(`Precio preventa: ${precioSilla.precio} Precio normal: ${precioSilla.precioD}`)
                    //console.log(`Hoy: ${hoy} fecha Preventa: ${preventa}`)
                    if(preventa < hoy){
                        totalMesa += precioSilla.precioD;
                    }else{
                        totalMesa += precioSilla.precio;
                    }
                    spanSillas.innerHTML += `${sillas[i].id} `;
                } 
            }
            const total = document.createElement('span');
            total.innerHTML = `$${totalMesa}`;
            // sillasElegidas.append(spanSillas,total);
            mesaElegida.append(spanSillas,total);
            if(zona.tipo === "Laterales") {laterales.append(mesaElegida); laterales.style.display = 'block';};
            if(zona.tipo === "General") {generales.append(mesaElegida); generales.style.display = 'block'}
            if(zona.tipo === "Preferente") {preferentes.append(mesaElegida); preferentes.style.display = 'block'}
            if(zona.tipo === "VIP") {vips.append(mesaElegida); vips.style.display = 'block'}
            // mesaElegida.appendChild(sillasElegidas);
            // divMesas.appendChild(mesaElegida);
            totalPagar += totalMesa;
        });

        const totalPago = document.querySelector('.totalPagar > :nth-Child(2)');
        totalPago.innerHTML = `$${totalPagar}`;
        // mesaElegida.className = mesa.id;
        // mesaElegida.innerHTML = `Zona General (Mesa ${mesa.id})`;
        
        // divMesas.appendChild(mesaElegida);
    });
});

const compra = document.querySelector('.pagar');
const confirma = document.querySelector('.confirma-compra');
const fondo = document.querySelector('.fondoCompra');

//aki
let listaMesaSilla = [];
let precios = [];
let total;

/**
 * Funcion para obtener las mesas consecutivas, obviar las mesas de 2 y 3 sillas
 */

function agruparClavesConsecutivas(mapa) {
  // Obtener las claves como números y ordenarlas
  const clavesNumericas = Array.from(mapa.keys())
    .map(Number)
    .sort((a, b) => a - b);

  const secuencias = [];
  let actual = [clavesNumericas[0]];
  const espacios = new Set([415, 425, 435, 445, 515]);

  for (let i = 1; i < clavesNumericas.length; i++) {
    if(clavesNumericas[i] < 300){
        continue;
    }
    if (clavesNumericas[i] === clavesNumericas[i - 1] + 1 && !espacios.has(clavesNumericas[i])) {
      actual.push(clavesNumericas[i]);
    } else {
      if (actual.length > 1) {
        secuencias.push([...actual]);
      }
      actual = [clavesNumericas[i]];
    }
  }

  // Agregar la última secuencia si aplica
  if (actual.length > 1) {
    secuencias.push([...actual]);
  }

  // Convertir los números a strings para coincidir con las claves originales
  return secuencias.map(secuencia => secuencia.map(String));
}

/**
 * obtener sillas
 */
async function obtenerEstadoSilla(idEvento, mesa, letra) {
    try {
        const resp = await fetch(`/api/verificar-silla/${idEvento}/${mesa}/${letra}`);
        if (!resp.ok) throw new Error("Error en la consulta");
        return await resp.json();
    } catch (error) {
        console.error("Error al verificar:", error);
        return null;
    }
}

/**
 * 
 */
async function verificarOcupacionEnMesa(idEvento, mesaId) {
    const letras = ['A', 'B', 'C', 'D'];
    
    // Solo recorre las letras de LA mesa que recibe por parámetro
    for (const letra of letras) {
        const datosSilla = await obtenerEstadoSilla(idEvento, mesaId, letra);

        if (datosSilla) {
            const { estado, bloqueada, enEspera } = datosSilla;

            if (estado === 1 || bloqueada === 1 || enEspera === 1) {
                return {
                    ocupada: true,
                    letra: letra,
                    motivo: estado === 1 ? 'Vendida' : (bloqueada === 1 ? 'Bloqueada' : 'En Espera')
                };
            }
        }
    }
    // Si termina las 4 letras y nada está ocupado
    return { ocupada: false };
}


/**
 * Verificacion de la disponibilidad de la silla
 */
async function verificaEstadoSilla(idEvento, mesa, silla) {
    try {
        // Realizamos la petición al endpoint que creaste
        const response = await fetch(`/api/verificar-silla/${idEvento}/${mesa}/${silla}`);
        
        if (!response.ok) {
            if (response.status === 404) {
                console.warn("La silla no existe en la base de datos.");
            }
            return null; 
        }

        const data = await response.json();
        
        // Retornamos el objeto con: estado, bloqueada, enEspera
        return data; 

    } catch (error) {
        console.error("Error en la comunicación con el servidor:", error);
        return null;
    }
}

/**
 * funcion para mejor visualizacion de la compra
*/
let consecutivas = [];
let agrupadasPorMesa = {};
/**
 * Visualizando la compra 
 */
compra.addEventListener('click', async () => {
    // Obtener todas las sillas activas
    listaMesaSilla = [];
    agrupadasPorMesa = {};
    const sillasActivas = document.querySelectorAll('.chair.activa, .chair3.activa, .chair2.activa');
    total = 0;
    document.querySelector('.confirma-compra ul').innerHTML = '';
    const numSillas = controlFila.size * 4 - 1;
    
    //console.log(`Sillas minimas: ${numSillas}`);
    //console.log(`Sillas seleccionadas: ${sillasActivas.length}`);
    //verificacion de sillas seleccionadas en vertical
    //imprimir las mesas con posibles para juntar 
    //console.log(controlFila);
    consecutivas = agruparClavesConsecutivas(controlFila);
    //console.log(consecutivas);
    // if(numSillas > sillasActivas.length && controlFila.size > 1){
    //     alert(`Para apartar mas de una mesa solo tiene puede quedar una silla vacia entre todas las mesas`);
    //     return;
    // }


    if (sillasActivas.length === 0) {
        alerta = await Swal.fire({
            title: 'Finca la colorada dice:',
            text: "No hay sillas seleccionadas!",
            icon: 'warning', // puede ser 'success', 'error', 'warning', 'info', 'question'
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
        return;
    }

    const lista = document.querySelector('.confirma-compra ul');
    //console.log(lista);
    const fondo = document.querySelector('.fondo-compra');
    // viendo sillas activas
    //console.log(`posibles juntadas ${cantidad}`);
    const juntar = document.querySelector('.confirma-compra span');
    juntar.innerHTML = '';
    console.log(consecutivas);
    console.log(controlFila);
    //Encontrar la mesa con menos sillas
    let idsValidos = [];

    // Aplanamos 'consecutivas' para tener una lista única de IDs a verificar
    // .flat() convierte [[313, 314], [213]] en [313, 314, 213]
    const listaIdsAProbar = consecutivas.flat();

    // Filtramos basándonos en controlFila
    idsValidos = listaIdsAProbar.filter(id => {
        const valor = controlFila.get(id);
        // Verificamos que exista en el Map y que sea menor a 4
        return valor !== undefined && valor < 4;
    });

    console.log("Todos los IDs que cumplen ambas condiciones:", idsValidos);
    let mesasNoJuntables = [];
  
    // El ciclo ahora vive aquí afuera
    for (const mesaId of idsValidos) {
        console.log(`Analizando Mesa ${mesaId}...`);
        
        // Llamamos a la función para esta mesa específica
        const resultado = await verificarOcupacionEnMesa(sembrado, mesaId);

        if (resultado.ocupada) {
            console.log(`⚠️ Mesa ${mesaId} no disponible. Silla ${resultado.letra} está ${resultado.motivo}.`);
            
            // La agregamos a tu lista de descartadas
            mesasNoJuntables.push(mesaId);
            
            // Si quieres detenerte al encontrar la PRIMERA mesa ocupada de toda la lista, usa 'break'
            // Si quieres encontrar TODAS las mesas ocupadas en la lista, no pongas break.
        } else {
            console.log(`Mesa ${mesaId} está totalmente libre.`);
        }
    }

    console.log("Mesas que NO se pueden juntar:", mesasNoJuntables);

    // 1. Filtramos los sub-arreglos
    consecutivas = consecutivas
        .map(grupo => {
            // Quitamos de cada grupo las mesas que estén en mesasNoJuntables
            return grupo.filter(mesa => !mesasNoJuntables.includes(mesa));
        })
        .filter(grupo => {
            // Solo dejamos los grupos que aún tengan 2 o más mesas
            // (Si quedó con 1 sola mesa, ya no es "consecutiva", se elimina)
            return grupo.length >= 2;
        });

    console.log("Consecutivas finales:", consecutivas);
    // Resultado esperado: [ ['315', '316'] ]
    const cantidad = consecutivas.length;
    for (let i = 0; i < cantidad; i++) {
        console.log("Consecutivas finales:", consecutivas);
        const sillasSobrantes = consecutivas[i].length >= 4 ? 2 : 1;
        juntar.innerHTML = juntar.innerHTML +
        `Puede solicitar juntar las mesas ${consecutivas[i]} pero para ello debe comprar al menos ${consecutivas[i].length*4-sillasSobrantes} boletos entre ambas mesas<br>`;
    }
    //console.log('compra: ');
    sillasActivas.forEach(silla => {
        const wrapper = silla.closest('.table-wrapper');
        const mesa = wrapper.querySelector('.table');
        const idMesa = mesa.id;
        ////console.log(precios);
        const precioSilla = precios.find(b => parseInt(b.mesa) === parseInt(mesa.id) && b.silla === silla.id)
        ////console.log(precioSilla.precio);
        ////console.log(`Mesa: ${mesa.id} Silla: ${silla.id} Precio: ${2}`);
        // Agrupar por mesa
        if (!agrupadasPorMesa[idMesa]) {
            agrupadasPorMesa[idMesa] = {
                sillas: [],
                total: 0
            };
        }

        agrupadasPorMesa[idMesa].sillas.push(silla.id);
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0); // elimina la hora para comparar solo fechas
        let preventa = new Date(fechaPreventa);
        preventa.setHours(0, 0, 0, 0);
        preventa.setDate(preventa.getDate() + 1);
        if(preventa < hoy){
            agrupadasPorMesa[idMesa].total += precioSilla.precioD;
            total += precioSilla.precioD;
        }else{
            agrupadasPorMesa[idMesa].total += precioSilla.precio;
            total += precioSilla.precio;
        }
        //lista.appendChild(item);
        ////console.log(`Mesa: ${mesa.id} Silla: ${silla.id} Precio: ${p.precio}`);  
        const MesaSilla = {
            mesa : mesa.id,
            silla : silla.id
        }   
        listaMesaSilla.push(MesaSilla);  
    });
    //console.log(agrupadasPorMesa);
    Object.entries(agrupadasPorMesa).forEach(([mesaId, data]) => {
        const item = document.createElement('li');
        item.textContent = `Mesa ${mesaId} Silla(s): ${data.sillas.join(', ')} Total: ${data.total}`;
        lista.appendChild(item);
    });

    //confirma.appendChild(lista);
    document.querySelector('.confirma-compra h3').innerHTML = `Total a pagar: $${total}`;
    
    const sillasBloqueadas = [];
    ////////////////////////////////////////////////////////////////////////
    controlFila.forEach(async (num, mesa) => {
        console.log(`mesa: ${mesa} Reservas: ${num}`);
        // console.log(`consecutivas: ${consecutivas} tamaño: ${consecutivas.length}`);
        if (num === 3 && !(mesa >= 215 && mesa <= 219)) {
            const idSilla = ['A', 'B', 'C', 'D'];
            console.log(listaMesaSilla);
            console.log(listaMesaSilla.length);
            //console.log(idSilla);
            listaMesaSilla.forEach(silla => {
                if (silla.mesa == mesa) {
                    const indice = idSilla.indexOf(silla.silla); 
                    if (indice > -1) {
                        idSilla.splice(indice, 1);
                    }
                }
            });
            //Comprobar que la otra silla este disponible
            const relleno = {
                mesa: mesa,
                silla: idSilla[0]
            };
            const infoSilla = await verificaEstadoSilla(idEvento, relleno.mesa, relleno.silla);
            if(infoSilla.estado){
                console.log("Esta silla no se puede bloquear");
            }
            sillasBloqueadas.push(relleno);
        }
        if (num === 2 && (mesa >= 215 && mesa <= 219)) {
            const idSilla = ['A', 'B', 'C'];
            console.log(listaMesaSilla);
            console.log(idSilla);
            listaMesaSilla.forEach(silla => {
            if (silla.mesa == mesa) {
                    const indice = idSilla.indexOf(silla.silla); 
                    if (indice > -1) {;
                        idSilla.splice(indice, 1);
                    }
                }
            });
            const relleno = {
                mesa: mesa,
                silla: idSilla[0]
            };
            sillasBloqueadas.push(relleno);
        }
        const buscarMesa = mesa;

            // Buscar la posición donde se encuentra la mesa
        const indice = consecutivas.findIndex(arr => arr.includes(buscarMesa));

        // Si encontramos la mesa, contamos los valores en esa posición
        let cantidadValores;
        console.log(`indice: ${indice}`);
        console.log(`consecutivas: ${consecutivas[indice]}`);
        if (indice !== -1) {
            cantidadValores = consecutivas[indice].length;
            console.log(cantidadValores); // Muestra el número de valores en la posición
        } else {
            console.log('Mesa no encontrada');
        }

        if(num === 2 && !(mesa >= 215 && mesa <= 219) && cantidadValores >= 4){
            //aqui se ponen en sillas exra las que falten cuando son mas de 3 mesas
            console.log("Apartando 4 mesas");
            const idSilla = ['A', 'B', 'C', 'D'];
            console.log(listaMesaSilla);
            //console.log(idSilla);
            listaMesaSilla.forEach(silla => {
            if (silla.mesa == mesa) {
                    const indice = idSilla.indexOf(silla.silla); 
                    if (indice > -1) {
                        console.log(`Esta silla esta en la lista: ${silla.silla}`);
                        idSilla.splice(indice, 1);
                    }
                }
            });
            for (let index = 0; index < idSilla.length; index++) {
                const relleno = {
                    mesa: mesa,
                    silla: idSilla[index]
                };
                sillasBloqueadas.push(relleno);
            }    
        }
    })

    console.log("Sillas a bloquear:", sillasBloqueadas);
    ///////////////////////////////////////////////////////////////////////

    //confirma.appendChild(totalCompra);
    confirma.style.display = 'flex';
    fondo.style.position = 'fixed';
    document.querySelector('.main-container').style.pointerEvents = 'none';
})

console.log('evento recibido: ', window.evento);
//console.log('id del Evento: ', window.evento.idEvento);
//nombre que se recibira 
const sembrado = window.evento.idEvento;
const nombreEvento = window.evento.nombre;
const fecha = window.evento.fecha;
const fechaPreventa = window.evento.fechaP;
// console.log("fecha: ", fecha);
// console.log("fecha preventa: ",fechaPreventa);
// fechaPreventa.setHours(0, 0, 0, 0);
// fechaPreventa.setDate(fechaPreventa.getDate() + 1);
/**
 * Verificando el estado de la silla
 */
/*const estadoSilla = 
fetch(`/estado-sillas/${sembrado}`)
.then(response => response.json())
.then(data => {
    const lista = document.getElementById('lista-sillas');
    precios = [];
    data.forEach(item => {
        // const li = document.createElement('li');
        // //console.log(`Mesa: ${item.Mesa}, Silla: ${item.Silla}, Estado: ${item.estado} Precio: ${item.precio} Bloqueada: ${item.bloqueada}`);
        const precioSilla = {
            mesa: item.Mesa,
            silla: item.Silla,
            precio: item.precio
        };
        precios.push(precioSilla);
        if(item.estado || item.bloqueada || item.enEspera){
            const mesa = document.getElementById(`${item.Mesa}`);
            const table = mesa.closest('.table-wrapper');
            switch(item.Silla){
                case 'A': if(table.querySelector('#A') != null) table.querySelector('#A').classList.toggle('ocupada');
                    break;
                case 'B': if(table.querySelector('#B') != null) table.querySelector('#B').classList.toggle('ocupada');
                    break;
                case 'C': if(table.querySelector('#C') != null) table.querySelector('#C').classList.toggle('ocupada');
                    break;
                case 'D': if(table.querySelector('#D') != null) table.querySelector('#D').classList.toggle('ocupada');
                    break;
            }
        }
        // lista.appendChild(li);
    });
})
.catch(error => {
    console.error('Error al cargar datos', error);
});*/

/**
 * Cargar estado de las sillas (FETCH)
 */
async function cargarEstadoSillas() {
  try {
    const response = await fetch(`/estado-sillas/${sembrado}`);
    const data = await response.json();

    precios = [];

    data.forEach(item => {
      const precioSilla = {
        mesa: item.Mesa,
        silla: item.Silla,
        precio: item.precio,
        precioD: item.precioD,
        tipo: item.tipo
      };
      precios.push(precioSilla);

      // Si la silla está ocupada / bloqueada / en espera
      if (item.estado || item.bloqueada || item.enEspera) {
        const mesa = document.getElementById(`${item.Mesa}`);
        if (!mesa) return;
        const table = mesa.closest('.table-wrapper');
        if (!table) return;
        const silla = table.querySelector(`#${item.Silla}`);
        if (silla) {
          silla.classList.add('ocupada'); // NO toggle
        }
      }
    });

  } catch (error) {
    console.error('Error al cargar datos', error);
  }
}

/**
 * Verificar sillas ocupadas (DESPUÉS del fetch)
 */
function verificarSillas() {
  mesas.forEach(mesa => {
    const sillas = mesa.querySelectorAll(':scope > div');
    let cont = 0;
    sillas.forEach(silla => {
      if (silla.classList.contains('ocupada')) {
        ////console.log(`Silla ${silla.id} ocupada en mesa ${mesa.id}`);
        cont++;
      }
    });
    if(cont >= sillas.length)
        mesa.classList.add('mesaOcupada');
  });
}

/**
 * Ejecución en orden correcto
 */
(async function iniciar() {
  await cargarEstadoSillas(); // espera el fetch
  verificarSillas();          // se ejecuta después
})();

/**
 * Visualizando informacion de compra
 * Envia los datos a al formulario para el nombre y telefono del usuario
 */
document.querySelector('.confirma-compra').addEventListener('click', function (event) {
    if (event.target.classList.contains('volver')) {
        this.style.display = 'none';
        //fondo.style.display = 'none';
        document.querySelector('.main-container').style.pointerEvents = 'all';
        document.querySelector('.fondo-compra').style.position = 'unset';
    }
    if (event.target.classList.contains('confirmar')) {
        //ir a formulario de compra para ir a metodo de pago o reservacion
        const tipo = window.evento.tipo;
        const form = document.getElementById('jsonform');
        let tipoPago;
        form.action = `/datos`
        const controlFilaObjeto = Object.fromEntries(controlFila);
        //console.log(controlFilaObjeto);
        const metodoPago = document.querySelector('.metodoPago');
        // Obtenemos el estilo que realmente está aplicando el navegador
        const estiloActual = window.getComputedStyle(metodoPago).display;

        if (estiloActual === "none") {
            // Si el display es none, significa que no es administrador (Pago en Línea)
            tipoPago = "Linea";
        } else {
            // Si se está mostrando, obtenemos el valor del radio seleccionado
            const seleccionado = document.querySelector('input[name="eleccion"]:checked');
            tipoPago = seleccionado ? seleccionado.value : "Linea"; 
        }

        document.getElementById('jsonData').value = JSON.stringify({
            nombre: nombreEvento,
            sembrado: sembrado,
            listaMesaSilla: listaMesaSilla,
            controlFila: controlFilaObjeto,
            tipo: tipo,
            consecutivas: consecutivas,
            agrupadasPorMesa: agrupadasPorMesa,
            tipoPago, tipoPago
        });
        //Enviar los datos
        form.submit();
        this.style.display = 'none';
        //console.log(`idEvento: ${sembrado}`);
        //console.log(listaMesaSilla);
        //console.log(controlFila);
        document.querySelector('.fondo-compra').style.position = 'unset';   
        //aqui se hace el update
        // listaMesaSilla.forEach(silla =>{
        //     reserva)rMesa(silla);
        // })
        // //fondo.style.display = 'none';
        // alert('Reservacion hecha!');
        document.querySelector('.main-container').style.pointerEvents = 'all';
        // location.reload();
    }
});

/**
 * precios
 */

fetch(`/precios/${sembrado}`)
.then(res => res.json())
.then(data => {
const tbody = document.querySelector('#tablaPrecios tbody');
data.forEach(row => {
    const tr = document.createElement('tr');

    
    const fechaPreventa = new Date(row.fechaP);
    fechaPreventa.setHours(0, 0, 0, 0);
    fechaPreventa.setDate(fechaPreventa.getDate() + 1);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0); // elimina la hora para comparar solo fechas
    const mostrarPrecio = (fechaPreventa < hoy) ? row.precioD : row.precio;

    tr.innerHTML = `
    <td>
        <span id='bolita${row.tipo}'></span>
        ${row.tipo}
    </td>
    <td>$${mostrarPrecio}</td>
    `;
    tbody.appendChild(tr);
});
})
.catch(err => {
console.error('Error al cargar los precios:', err);
});

document.getElementById('inicio').addEventListener('click',(e) => {
    e.preventDefault();
    window.location.href = "/volverEventos";
})

// Para control de sillas
// const allSillas = wrapper.querySelectorAll('.chair');
// allSillas.forEach(s => s.classList.remove('activa'));
// silla.classList.add('activa');

//modal para elegir cantidad de boletos
// Variable global para guardar la cantidad

// Función que se ejecuta al hacer clic en el botón del modal
function seleccionarBoletos() {
    // 1. Obtiene el valor del campo de entrada
    const input = document.getElementById('inputBoletos');
    const cantidad = parseInt(input.value);

    const laterales = document.querySelector('.lateral');
    const generales = document.querySelector('.generales');
    const preferentes = document.querySelector('.preferentes');
    const vips = document.querySelector('.vips');

    laterales.style.display = 'none'
    generales.style.display = 'none'
    preferentes.style.display = 'none'
    vips.style.display = 'none'
    document.querySelector('.totalPagar :last-child').innerHTML='$0';

    // 2. Validación (Asegura que sea un número positivo)
    if (isNaN(cantidad) || cantidad <= 0) {
        alert("Ingresa la cantidad de boletos a comprar.");
        return; // Detiene la función si la validación falla
    }

    // 3. Guarda el valor en la variable
    sillasMaximas = cantidad;

    mesas.forEach(mesa => {
    // Seleccionar todos los hijos de mesa que tengan la clase 'activa'
    const hijosActivos = mesa.querySelectorAll('.activa');

    // Remover la clase 'activa' de cada uno
    hijosActivos.forEach(hijo => {
        hijo.classList.remove('activa');
    });
    sillasSeleccionadas = 0;
    controlFila.clear();
    
    //Si se requieren 3 boletos activar las 3 sillas en la plataforma elevada
    if(sillasMaximas == 3){
        mesas.forEach(mesa => { 
            //aqui se usara el estado silla para verificar el estado de las sillas a anadir    
            if(mesa.id >= 215 && mesa.id <= 219 && mesa.children.length === 3){
                const chair = document.createElement('div');
                chair.id = 'C'
                chair.classList.add('chair3');
                // verificacion del estado de la silla
                fetch(`/estado-silla/${sembrado}?mesa=${mesa.id}&silla=${chair.id}`)
                .then(res => {
                    if (!res.ok) throw new Error('Error en la solicitud');
                    return res.json();
                })
                .then(data => {
                    //console.log('Estado de la silla:', data);
                    if(data[0].estado || data[0].bloqueada || data[0].enEspera)
                        chair.classList.add('ocupada');    
                })
                .catch(err => {
                    console.error('Error:', err);
                });
                mesa.appendChild(chair);
                // Seleccionar todos los hijos con clase "chair2 activa"
                const sillasL = mesa.querySelectorAll(".chair2");
                // Recorrer y cambiar la clase
                sillasL.forEach((silla) => {
                    silla.classList.remove("chair2");
                    silla.classList.add("chair3");
                });
            }
        });
    }

    // if(sillasMaximas == 4){
    //     const idsValidos = new Set([
    //         '411', '412', '413',
    //         '421', '422', '423',
    //         '431', '432', '433',
    //         '441', '442', '443',
    //         '451', '452', '453',
    //         '461', '462', '463',
    //         '417', '427', '437',
    //         '447', '457', '467',
    //     ]);
    //     mesas.forEach(mesa => { 
    //         //aqui se usara el estado silla para verificar el estado de las sillas a anadir 
    //         // //console.log(idsValidos.has(mesa.id))   
    //         if(idsValidos.has(mesa.id) && mesa.children.length === 4){
    //             const chair = document.createElement('div');
    //             chair.id = 'D'
    //             chair.classList.add('chair');
    //             // verificacion del estado de la silla
    //             fetch(`/estado-silla/${sembrado}?mesa=${mesa.id}&silla=${chair.id}`)
    //             .then(res => {
    //                 if (!res.ok) throw new Error('Error en la solicitud');
    //                 return res.json();
    //             })
    //             .then(data => {
    //                 // //console.log('Estado de la silla:', data);
    //                 if(data[0].estado || data[0].bloqueada || data[0].enEspera)
    //                     chair.classList.add('ocupada');    
    //             })
    //             .catch(err => {
    //                 console.error('Error:', err);
    //             });
    //             mesa.appendChild(chair);
    //             // Seleccionar todos los hijos con clase "chair2 activa"
    //             const sillasL = mesa.querySelectorAll(".chair3");
    //             // Recorrer y cambiar la clase
    //             sillasL.forEach((silla) => {
    //                 silla.classList.remove("chair3");
    //                 silla.classList.add("chair");
    //             });
    //         }
    //     });
    // }
});

}

document.getElementById('inputBoletos').addEventListener('input',seleccionarBoletos);

// Lógica para mostrar el modal inmediatamente al cargar la página (ya lo hace el HTML)
// No es necesario código adicional ya que el modal está visible por defecto.

/**
 * Reabrir modal de boletos
 */
function abrirModalBoletos() {
    // 1. Muestra el modal
    document.getElementById('cantidadBoletos').style.display = 'flex';
    mesas.forEach(mesa => {       
        if(mesa.id >= 215 && mesa.id <= 219 && mesa.querySelector('#C')){
            const chair = mesa.querySelector('#C');
            chair.remove();
            // Seleccionar todos los hijos con clase "chair2 activa"
            const sillasL = mesa.querySelectorAll(".chair3");
            // Recorrer y cambiar la clase
            sillasL.forEach((silla) => {
                silla.classList.remove("chair3");
                silla.classList.add("chair2");
            });
        }

        // const idsValidos = new Set([
        //     '411', '412', '413',
        //     '421', '422', '423',
        //     '431', '432', '433',
        //     '441', '442', '443',
        //     '451', '452', '453',
        //     '461', '462', '463',
        //     '417', '427', '437',
        //     '447', '457', '467',
        // ]);
        // if(idsValidos.has(mesa.id) && mesa.querySelector('#D')){
        //     const chair = mesa.querySelector('#D');
        //     chair.remove();
        //     // Seleccionar todos los hijos con clase "chair2 activa"
        //     const sillasL = mesa.querySelectorAll(".chair");
        //     // Recorrer y cambiar la clase
        //     sillasL.forEach((silla) => {
        //         silla.classList.remove("chair");
        //         silla.classList.add("chair3");
        //     });
        // }
    });
    // 2. Oculta el botón de reabrir para que no estorbe
    //document.getElementById('btnReabrirModal').style.display = 'none';
}

// para la fecha

// Extraer el día, mes y año del string de fecha
// La fecha que llega del servidor
const fechaStr = window.evento.fecha;

// Crear un array con los nombres de los meses en español (abreviados)
const meses = {
"enero": "Ene",
"febrero": "Feb",
"marzo": "Mar",
"abril": "Abr",
"mayo": "May",
"junio": "Jun",
"julio": "Jul",
"agosto": "Ago",
"septiembre": "Sep",
"octubre": "Oct",
"noviembre": "Nov",
"diciembre": "Dic"
};

const partesFecha = fechaStr.split(" de ");
const dia = partesFecha[0]; // El primer elemento es el día
const mes = meses[partesFecha[1].toLowerCase()]; // El segundo es el mes, convertimos a minúsculas para evitar errores de mayúsculas
// const anio = partesFecha[2]; // El tercer elemento sería el año (si lo necesitas, puedes usarlo también)

// Insertar los valores en el HTML
document.getElementById("mes").innerText = mes;
document.getElementById("dia").innerText = dia;

window.addEventListener("pageshow", function () {
    const navEntries = performance.getEntriesByType("navigation");
    if (navEntries.length > 0 && navEntries[0].type === "back_forward") {
        document.getElementById("inputBoletos").value = 2;
    }
});