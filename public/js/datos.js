//console.log("Datos recibidos");
//console.log(window.sembrado);
//console.log(window.listaMesaSilla);
const sembrado = parseInt(window.sembrado);
const nombreEvento = window.nombre;
const listaMesaSilla = window.listaMesaSilla;
const tipo = window.tipo;
const controlFila = window.controlFila;
const consecutivas = window.consecutivas;
const agrupadasPorMesa = window.agrupadasPorMesa;
let mesasJuntadas = [];
let cancelarLiberacion = false;

// PASO 1: Convertir el objeto a un array de pares [ [clave, valor], ... ]
console.log(listaMesaSilla);
console.log(typeof(listaMesaSilla));
console.log(consecutivas);
console.log(agrupadasPorMesa);
console.log(sembrado);
console.log(nombreEvento);

let sumatoria = 0;
Object.values(agrupadasPorMesa).forEach((grupo) => {
    sumatoria += grupo.total;
    console.log(`${grupo.sillas} - ${grupo.total}`);

    console.log("Suma parcial:", sumatoria);
});

console.log("Total final:", sumatoria);




const arrayDePares = Object.entries(controlFila);

// PASO 2: Reconstruir el Map
const controlFilaReconstruido = new Map(arrayDePares);
console.log(controlFilaReconstruido);

/**
 * Poniendo sillas en espera
 */
async function esperaSilla( letra, numeroMesa, idEvento ) {
  try {
    const response = await fetch(`/espera-silla/${idEvento}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json' // Ahora usas JSON
      },
      body: JSON.stringify({ letra, numeroMesa })
    });

    if (!response.ok) {
      throw new Error('Error al liberar la silla');
    }

    console.log('✅ Silla espera correctamente');
  } catch (err) {
    console.error('❌ Error en liberarSilla:', err);
  }
}

let sillasExtra = [];
controlFilaReconstruido.forEach(async (num, mesa) => {
  //console.log(`mesa: ${mesa} Reservas: ${num}`);
  //console.log(!(mesa >= 215 && mesa <= 219));
  if (num === 3 && !(mesa >= 215 && mesa <= 219)) {
    const idSilla = ['A', 'B', 'C', 'D'];
    console.log(listaMesaSilla);
    //console.log(idSilla);
    listaMesaSilla.forEach(silla => {
      if (silla.mesa == mesa) {
        const indice = idSilla.indexOf(silla.silla);
        if (indice > -1) {
          // Borrar 1 elemento a partir de ese índice
          idSilla.splice(indice, 1);
        }
      }
    });
    const relleno = {
      mesa: mesa,
      silla: idSilla[0]
    };
    await esperaSilla(idSilla[0], mesa, sembrado);
    await bloqueo(relleno);
    sillasExtra.push(relleno);

  }
  if (num === 2 && (mesa >= 215 && mesa <= 219)) {
    const idSilla = ['A', 'B', 'C'];
    console.log(listaMesaSilla);
    console.log(idSilla);
    listaMesaSilla.forEach(silla => {
      if (silla.mesa == mesa) {
        const indice = idSilla.indexOf(silla.silla);
        if (indice > -1) {
          // Borrar 1 elemento a partir de ese índice
          idSilla.splice(indice, 1);
        }
      }
    });
    const relleno = {
      mesa: mesa,
      silla: idSilla[0]
    };
    await esperaSilla(idSilla[0], mesa, sembrado);
    await bloqueo(relleno);
    console.log(relleno);
    sillasExtra.push(relleno); 
    //console.log(listaMesaSilla);
    //console.log(relleno);
  }
})

listaMesaSilla.forEach(silla =>{
    //faltan las sillas a bloquear
    const sem = sembrado;
    //console.log('sillas puestas en espera');
    esperaSilla(silla.silla,silla.mesa,sem);
})

/**
 * quitando sillas en espera si se cierra la pagina
 */
function liberaTodasLasSillas(listaMesaSilla, idEvento) {
  if (!listaMesaSilla || listaMesaSilla.length === 0) return;
  
  const payload = JSON.stringify({
    idEvento,
    sillas: listaMesaSilla.map(silla => ({
      letra: silla.silla,
      numeroMesa: silla.mesa
    }))
  });

  navigator.sendBeacon(`/liberar-sillas/${idEvento}`, payload);
}

function manejarLiberacion() {
  if (cancelarLiberacion) return;
  liberaTodasLasSillas(sillasExtra,sembrado);
  liberaTodasLasSillas(listaMesaSilla, sembrado);
}

window.addEventListener('beforeunload', manejarLiberacion);
window.addEventListener('pagehide', manejarLiberacion);


const lista = [];
let codigo;

/**
 * Confirmando la compra
 */
const reservarMesa = async (silla,codigo) => {
  silla.mesa = parseInt(silla.mesa);
  console.log(silla);
  try {
    //sembrado tiene el id del evento)
    const response = await fetch(`/reservar/${sembrado}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json' // Indicamos que el cuerpo de la solicitud es JSON
      },
      body: JSON.stringify({
        silla,
        codigo
      }) // Convertimos el objeto 'datos' a JSON
    });

    // Verificamos si la respuesta es exitosa
    if (!response.ok) {
      throw new Error(`Error al reservar: ${response.statusText}`);
    }

    // Convertimos la respuesta en JSON (si es necesario)
    //const result = await response.json();
    
    //console.log('Reserva exitosa:', result.message);
    //alert(result.message); // Por ejemplo, alertamos el mensaje

  } catch (error) {
    console.error('Error en la solicitud:', error);
    alert('Hubo un problema al intentar hacer la reserva.');
  }
};

/**
 * Bloqueando sillas
 */
const bloqueo = async (silla) => {
  silla.mesa = parseInt(silla.mesa);
  //console.log(`silla ${silla} bloqueada!!!`);
  try {
    //sembrado tiene el id del evento)
    const response = await fetch(`/bloqueo/${sembrado}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json' // Indicamos que el cuerpo de la solicitud es JSON
      },
      body: JSON.stringify({
        silla
      }) // Convertimos el objeto 'datos' a JSON
    });

    // Verificamos si la respuesta es exitosa
    if (!response.ok) {
      throw new Error(`Error al reservar: ${response.statusText}`);
    }

    // Convertimos la respuesta en JSON (si es necesario)
    //const result = await response.json();
    
    //console.log('Reserva exitosa:', result.message);
    //alert(result.message); // Por ejemplo, alertamos el mensaje

  } catch (error) {
    console.error('Error en la solicitud:', error);
    alert('Hubo un problema al intentar hacer la reserva.');
    console.log(error);
  }
};

/**
 * enviar datos
 */
/*async function enviarDatos(codigo,nombre,apellidos,telefono,mesasJuntadas) {
  try {
    const resFecha = await fetch(`/fechaP/${sembrado}`);
    const data = await resFecha.json();

    if (data.length === 0) {
      console.warn('No se encontró fecha para ese sembrado');
      return;
    }

    const fechaP = data[0].fechaP;

    const response = await fetch('/codigo', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ codigo, nombre, apellidos, telefono, fechaP, mesasJuntadas})
    });

    const resultado = await response.json();
    //console.log(mesasJuntadas);
    //console.log('Datos enviados correctamente:', resultado);
    
    //aqui se hace el metodo de pago
    

    for (const silla of listaMesaSilla){
        const cod = codigo;
        await reservarMesa(silla,cod);
    }
  } catch (error) {
    console.error('Error en el proceso:', error);
  }
} */

async function generarPDFBoleto(idEvento, codigo) {
    try {
        console.log(`Generando PDF para Evento: ${idEvento}, Código: ${codigo}...`);
        
        const response = await fetch(`/creaPDFBoleto/${idEvento}/${codigo}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error al generar el PDF del boleto');
        }

        const resultado = await response.json();
        console.log('✅ PDF generado y subido:', resultado.message);
        return resultado;

    } catch (error) {
        console.error('❌ Error en generarPDFBoleto:', error);
        // Opcional: mostrar una alerta al usuario
        throw error; 
    }
}

async function confirmarReservaDirecta(codigo) {
    try {
        const response = await fetch('/api/reservas/confirmar-directa', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ codigo })
        });

        if (!response.ok) {
            throw new Error('No se pudo confirmar la reserva en la base de datos');
        }

        const data = await response.json();
        console.log('✅ Reserva confirmada en BD:', data.message);
        return data;
    } catch (error) {
        console.error('❌ Error en confirmarReservaDirecta:', error);
        throw error;
    }
}

async function enviarDatos(codigo, nombre, apellidos, telefono, mesasJuntadas) {
  try {
    const resFecha = await fetch(`/fechaP/${sembrado}`);
    const data = await resFecha.json();

    if (data.length === 0) {
      console.warn('No se encontró fecha para ese sembrado');
      return;
    }

    const fechaP = data[0].fechaP;

    const response = await fetch('/codigo', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        codigo,
        nombre,
        apellidos,
        telefono,
        fechaP,
        mesasJuntadas,
        listaMesaSilla,
        sembrado
      })
    });
    console.log('Resultado completo:', response);
    if (!response.ok) {
      throw new Error('Error al crear la reserva');
    }
    
    // const resultado = await response.json();

    for (const silla of listaMesaSilla){
        const cod = codigo;
        await reservarMesa(silla,cod);
    }

    for(const silla of sillasExtra){
       const cod = codigo;
       await reservarMesa(silla,cod);
    }
    //cambiar a endpoint
     // 2️⃣ Crear pago
    const pagoResponse = await fetch(
      `/api/pagos/crear-pago`,
      {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          codigo,
          idEvento: sembrado,
          total: sumatoria,
          nombre: nombreEvento
        })
      }
    );

    const pago = await pagoResponse.json();

    console.log('Respuesta pago:', pago); // 🔥 DEBUG

    if (pago.modo === 'directo') {
      // ✅ Usuario autenticado → reservar directo
      console.log("Procesando reserva administrativa...");
      await confirmarReservaDirecta(codigo);
      await generarPDFBoleto(sembrado, codigo);
      window.location.href = "/";
      return;
    }

    // REDIRIGIR A MERCADO PAGO (AQUÍ va el pago)
    if (pago.init_point) {
      window.location.href = pago.init_point;
      return;
    } else {
      throw new Error('No se recibió link de pago');
    }

  } catch (error) {
    console.error('Error en el proceso:', error);
    alert('Ocurrió un error al iniciar el pago');
  }
}

const overlay = document.getElementById('cargando');

overlay.addEventListener('click', (e) => {
  e.stopPropagation();
});

/**
 * Obteniendo los valores del formulario para reservar
 */
document.getElementById('reservar').addEventListener('click', async function() {
    // Obtener los valores de los campos del formulario
    overlay.style.display = 'flex';
    const nombre = document.getElementById('nombre').value;
    const apellidos = document.getElementById('apellidos').value;
    const telefono = document.getElementById('telefono').value;
    if (telefono.length < 12) {
      alert("El teléfono debe de ser de 10 digitos");
      overlay.style.display = 'flex';
      return; 
    }
    let i = 0;
    cancelarLiberacion = true;
    document.querySelectorAll('input[type="checkbox"][name="grupoMesas"]').forEach(check => {
      mesasJuntadas[i++].juntar = check.checked;
    })
    // Verificar si todos los campos están llenos
    if (nombre && apellidos && telefono) {
        // Mostrar los datos en consola
        console.log('Nombre:', nombre);
        console.log('Apellidos:', apellidos);
        console.log('Teléfono:', telefono);
        const res = await fetch(`/conteo/${sembrado}`);
        const data = await res.json();
        const conteo = data.conteo;
        //console.log('Conteo recibido con fetch:', conteo);
        // Aquí puedes hacer lo que desees con los datos (enviarlos al servidor, etc.)
        // Por ejemplo, podrías enviar los datos a un servidor usando fetch
        const codigo = `${sembrado}-${conteo}`;
        
        // Paso 1: Obtener fechaP primero
        
        await enviarDatos(codigo,nombre,apellidos,telefono,mesasJuntadas);


        //no usar foreach con async
        /*for (const [mesa, num] of controlFilaReconstruido.entries()){
          //console.log(`mesa: ${mesa} Reservas: ${num}`);
          console.log(!(mesa >= 215 && mesa <= 219));
          if(num === 3 && !(mesa >= 215 && mesa <= 219)){
            const idSilla = ['A','B','C','D'];
            //console.log(listaMesaSilla);
            //console.log(idSilla);
            listaMesaSilla.forEach(silla => {
              if(silla.mesa == mesa){
                const indice = idSilla.indexOf(silla.silla);
                if (indice > -1) { 
                  // Borrar 1 elemento a partir de ese índice
                  idSilla.splice(indice, 1);
                }
              }
            })
            const relleno = {
              mesa: mesa,
              silla: idSilla[0]
            }
            await bloqueo(relleno);
            //console.log(listaMesaSilla);
            //console.log(relleno);
          }
          if(num === 2 && (mesa >= 215 && mesa <= 219)){
            const idSilla = ['A','B','C'];
            console.log(listaMesaSilla);
            console.log(idSilla);
            listaMesaSilla.forEach(silla => {
              if(silla.mesa == mesa){
                const indice = idSilla.indexOf(silla.silla);
                if (indice > -1) { 
                  // Borrar 1 elemento a partir de ese índice
                  idSilla.splice(indice, 1);
                }
              }
            })
            const relleno = {
              mesa: mesa,
              silla: idSilla[0]
            }
            await bloqueo(relleno);
            //console.log(listaMesaSilla);
            //console.log(relleno);
          }          
        }
        // alert('Reservacion hecha!'); */

        //generacion del pdf
       
        // setTimeout(()=>{
        //   alert('Reservacion hecha!');
        //  
        // },500)
            
        } else {
            alert('Por favor, complete todos los campos.');
        }
});

document.getElementById('volver').addEventListener('click', () =>{
  history.back();
})

/**
 * Validacion para el telefono
 */
const telefonoInput = document.getElementById('telefono');

  telefonoInput.addEventListener('input', function (e) {
    const cursorPos = this.selectionStart;

    // 1. Obtener solo números (limpia el input)
    let numeros = this.value.replace(/\D/g, '').slice(0, 10);

    // 2. Aplicar formato: XX XXXX XXXX
    let formateado = '';
    if (numeros.length > 0) {
      formateado += numeros.slice(0, 2);
    }
    if (numeros.length > 2) {
      formateado += ' ' + numeros.slice(2, 6);
    }
    if (numeros.length > 6) {
      formateado += ' ' + numeros.slice(6, 10);
    }

    // 3. Guardar longitud anterior para intentar mantener el cursor
    const valorAnterior = this.value;
    this.value = formateado;

    // // 4. (Opcional) Mover cursor al final siempre
    // this.setSelectionRange(this.value.length, this.value.length);
  });



/**
 * Verificando mesas que cumplen para juntar
 */
const container = document.getElementById('grupo-mesas');

consecutivas.forEach( con =>{
  let juntar;
  let conteo = 0;
  con.forEach(can => {
    console.log(can);
    conteo += controlFilaReconstruido.get(can);
  })
  //console.log(conteo);
  //console.log(con.length * 4 - 1);
  if(conteo < (con.length * 4 -1 )){
    return;
  } 

  const label = document.createElement('label');
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.name = 'grupoMesas';
  checkbox.value = con.join(',');
  mesasJuntadas.push({
    mesas: con.join(','),
    juntar: false
  });
  label.appendChild(checkbox);
  label.appendChild(document.createTextNode(` Juntar mesas: ${con.join(', ')}`));

  container.appendChild(label);
  container.appendChild(document.createElement('br'));
});