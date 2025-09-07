
// Configuración de la API
const API_BASE_URL = 'https://back-end-encuestas-a5fxb8g7gwavevgh.canadacentral-01.azurewebsites.net/api';

// Variables globales
let encuestaActual = null;

// Inicialización cuando se carga la página
document.addEventListener('DOMContentLoaded', function() {
    inicializarEventListeners();
    mostrarSeccion('seccion-encuesta');
});

// Configurar todos los event listeners
function inicializarEventListeners() {
    // Navegación entre secciones
    document.getElementById('btn-ver-encuesta').addEventListener('click', () => {
        mostrarSeccion('seccion-encuesta');
        actualizarNavegacion('btn-ver-encuesta');
    });
    
    document.getElementById('btn-ver-resultados').addEventListener('click', () => {
        mostrarSeccion('seccion-resultados');
        actualizarNavegacion('btn-ver-resultados');
    });
    
    // Cargar encuesta
    document.getElementById('btn-cargar-encuesta').addEventListener('click', cargarEncuesta);
    
    // Cargar resultados
    document.getElementById('btn-cargar-resultados').addEventListener('click', cargarResultados);
    
    // Enviar respuestas
    document.getElementById('form-respuestas').addEventListener('submit', enviarRespuestas);
    
    // Modal
    document.querySelector('.close').addEventListener('click', cerrarModal);
    document.getElementById('modal').addEventListener('click', function(e) {
        if (e.target === this) {
            cerrarModal();
        }
    });
    
    // Enter en inputs para cargar
    document.getElementById('encuesta-id').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            cargarEncuesta();
        }
    });
    
    document.getElementById('resultados-id').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            cargarResultados();
        }
    });
}

// Navegación entre secciones
function mostrarSeccion(seccionId) {
    // Ocultar todas las secciones
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Mostrar la sección seleccionada
    document.getElementById(seccionId).classList.add('active');
}

function actualizarNavegacion(btnId) {
    // Remover clase active de todos los botones
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Agregar clase active al botón seleccionado
    document.getElementById(btnId).classList.add('active');
}

// Funciones para cargar encuesta
async function cargarEncuesta() {
    const encuestaId = document.getElementById('encuesta-id').value;
    
    if (!encuestaId) {
        mostrarError('error-encuesta', 'Por favor seleccione una encuesta.');
        return;
    }
    
    mostrarCargando('loading-encuesta');
    ocultarElementos(['error-encuesta', 'contenido-encuesta']);
    
    try {
        const response = await fetch(`${API_BASE_URL}/encuestas/${encuestaId}`);
        
        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const rawResponse = await response.json();
        console.log('Respuesta de la API:', rawResponse);
        const jsonResult = rawResponse.data && rawResponse.data[0] && rawResponse.data[0][0] ? rawResponse.data[0][0].JsonResult : null;
        const encuesta = jsonResult ? JSON.parse(jsonResult) : null;
        encuestaActual = encuesta;
        
        mostrarEncuesta(encuesta);
        
    } catch (error) {
        console.error('Error al cargar encuesta:', error);
        mostrarError('error-encuesta', `Error al cargar la encuesta: ${error.message}`);
    } finally {
        ocultarElemento('loading-encuesta');
    }
}

function mostrarEncuesta(encuesta) {
    // Mostrar título y descripción
    document.getElementById('titulo-encuesta').textContent = encuesta.Nombre || 'Encuesta sin título';
    document.getElementById('descripcion-encuesta').textContent = encuesta.Descripcion || 'Sin descripción';

    // Insertar campo de Usuario (si no existe ya)
    const form = document.getElementById('form-respuestas');
    let usuarioGroup = document.getElementById('usuario-group');
    if (!usuarioGroup) {
        usuarioGroup = document.createElement('div');
        usuarioGroup.className = 'input-group';
        usuarioGroup.id = 'usuario-group';
        usuarioGroup.innerHTML = `
            <label for="usuario-id">Usuario:</label>
            <input type="text" id="usuario-id" placeholder="Ingresa tu usuario" required>
        `;
        form.insertBefore(usuarioGroup, form.firstChild);
    }

    // Generar preguntas
    const preguntasContainer = document.getElementById('preguntas-container');
    preguntasContainer.innerHTML = '';
    
    if (encuesta.Preguntas && encuesta.Preguntas.length > 0) {
        encuesta.Preguntas.forEach((pregunta, index) => {
            const preguntaElement = crearElementoPregunta(pregunta, index);
            preguntasContainer.appendChild(preguntaElement);
        });
    } else {
        preguntasContainer.innerHTML = '<p>Esta encuesta no tiene preguntas disponibles.</p>';
    }
    
    // Mostrar el contenido de la encuesta
    mostrarElemento('contenido-encuesta');
}

function crearElementoPregunta(pregunta, index) {
    const div = document.createElement('div');
    div.className = 'pregunta';
    
    const titulo = document.createElement('h4');
    titulo.textContent = `${index + 1}. ${pregunta.TextoPregunta || 'Pregunta sin texto'}`;
    div.appendChild(titulo);
    
    const opciones = document.createElement('div');
    opciones.className = 'opciones';
    
    if (pregunta.Opciones && pregunta.Opciones.length > 0) {
        pregunta.Opciones.forEach((opcion, opcionIndex) => {
            const opcionDiv = document.createElement('div');
            opcionDiv.className = 'opcion';
            
            const radio = document.createElement('input');
            radio.type = 'radio';
            radio.name = `pregunta_${pregunta.PreguntaID}`;
            radio.value = opcion.OpcionID;
            radio.id = `pregunta_${pregunta.PreguntaID}_opcion_${opcion.OpcionID}`;
            
            const label = document.createElement('label');
            label.htmlFor = radio.id;
            label.textContent = opcion.TextoOpcion || 'Opción sin texto';
            
            opcionDiv.appendChild(radio);
            opcionDiv.appendChild(label);
            opciones.appendChild(opcionDiv);
        });
    } else {
        opciones.innerHTML = '<p>Esta pregunta no tiene opciones disponibles.</p>';
    }
    
    div.appendChild(opciones);
    return div;
}

// Enviar respuestas
async function enviarRespuestas(event) {
    event.preventDefault();
    
    if (!encuestaActual) {
        mostrarError('error-encuesta', 'No hay una encuesta cargada.');
        return;
    }

    // Validar usuario obligatorio
    const usuarioInput = document.getElementById('usuario-id');
    const usuarioId = usuarioInput && typeof usuarioInput.value === 'string' ? usuarioInput.value.trim() : '';

    if (!usuarioId) {
        mostrarError('error-encuesta', 'Por favor ingresa tu usuario.');
        if (usuarioInput) usuarioInput.focus();
        return;
    }

    const respuestas = recopilarRespuestas();
    
    if (respuestas.length === 0) {
        mostrarError('error-encuesta', 'Por favor responde al menos una pregunta.');
        return;
    }
    
    const btnEnviar = document.querySelector('#form-respuestas button[type="submit"]');
    const textoOriginal = btnEnviar.innerHTML;
    btnEnviar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
    btnEnviar.disabled = true;
    
    try {
        const response = await fetch(`${API_BASE_URL}/encuestas/responder`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                UsuarioID: usuarioId,
                Respuestas: respuestas
            })
        });
        
        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const resultado = await response.json();
        
        mostrarModal('¡Respuestas enviadas exitosamente!', '✅ Gracias por participar en la encuesta.');
        
        // Limpiar formulario
        document.getElementById('form-respuestas').reset();
        
    } catch (error) {
        console.error('Error al enviar respuestas:', error);
        mostrarError('error-encuesta', `Error al enviar respuestas: ${error.message}`);
    } finally {
        btnEnviar.innerHTML = textoOriginal;
        btnEnviar.disabled = false;
    }
}

function recopilarRespuestas() {
    const respuestas = [];
    
    if (!encuestaActual || !encuestaActual.Preguntas) {
        return respuestas;
    }
    
    encuestaActual.Preguntas.forEach((pregunta, index) => {
        const preguntaId = pregunta.PreguntaID;
        const radioSeleccionado = document.querySelector(`input[name="pregunta_${preguntaId}"]:checked`);
        
        if (radioSeleccionado) {
            respuestas.push({
                OpcionID: parseInt(radioSeleccionado.value),
                Seleccionado: 1
            });
        }
    });
    
    return respuestas;
}

// Funciones para cargar resultados
async function cargarResultados() {
    const encuestaId = document.getElementById('resultados-id').value;
    
    if (!encuestaId) {
        mostrarError('error-resultados', 'Por favor ingresa un ID de encuesta válido.');
        return;
    }
    
    mostrarCargando('loading-resultados');
    ocultarElementos(['error-resultados', 'contenido-resultados']);
    
    try {
        const response = await fetch(`${API_BASE_URL}/encuestas/resumen/${encuestaId}`);
        
        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const responseText = await response.text();
        const resumen = responseText ? JSON.parse(responseText) : null;

        if (!resumen) {
            throw new Error('La respuesta del servidor está vacía o no es válida.');
        }
        
        mostrarResultados(resumen);
        
    } catch (error) {
        console.error('Error al cargar resultados:', error);
        mostrarError('error-resultados', `Error al cargar los resultados: ${error.message}`);
    } finally {
        ocultarElemento('loading-resultados');
    }
}

function mostrarResultados(resumen) {
    // Mostrar título
    document.getElementById('titulo-resultados').textContent = resumen.Encuesta || 'Resultados de la Encuesta';
    
    // Generar resumen
    const resumenContainer = document.getElementById('resumen-container');
    resumenContainer.innerHTML = '';

    if (resumen.Preguntas && resumen.Preguntas.length > 0) {
        resumen.Preguntas.forEach(resultado => {
            const resultadoElement = crearElementoResultado(resultado);
            resumenContainer.appendChild(resultadoElement);
        });
    } else {
        resumenContainer.innerHTML = '<p>No hay resultados disponibles para esta encuesta.</p>';
    }
    
    // Mostrar el contenido de resultados
    mostrarElemento('contenido-resultados');
}

function crearElementoResultado(resultado) {
    const div = document.createElement('div');
    div.className = 'resultado-item';
    
    const pregunta = document.createElement('div');
    pregunta.className = 'resultado-pregunta';
    pregunta.textContent = resultado.TextoPregunta || 'Pregunta sin título';
    div.appendChild(pregunta);
    
    const stats = document.createElement('div');
    stats.className = 'resultado-stats';
    
    const porcentaje = Math.round(resultado.Porcentaje || 0);
    
    const porcentajeElement = document.createElement('div');
    porcentajeElement.className = `porcentaje ${obtenerClaseEstado(porcentaje)}`;
    porcentajeElement.textContent = `${porcentaje}%`;
    
    const indicador = document.createElement('div');
    indicador.className = 'indicador';
    indicador.innerHTML = resultado.Carita || '';

    // Mostrar Número de usuarios que respondieron (reutilizando estilo "porcentaje")
    const responded = typeof resultado.NumeroUsuariosRespondieron === 'number'
        ? resultado.NumeroUsuariosRespondieron
        : (parseInt(resultado.NumeroUsuariosRespondieron, 10) || 0);

    const respondedElement = document.createElement('div');
    respondedElement.className = 'porcentaje estado-bueno';
    respondedElement.textContent = `${responded} usuarios`;

    stats.appendChild(porcentajeElement);
    stats.appendChild(indicador);
    stats.appendChild(respondedElement);
    div.appendChild(stats);
    
    return div;
}

function obtenerClaseEstado(porcentaje) {
    if (porcentaje >= 60) {
        return 'estado-excelente';
    } else if (porcentaje >= 30) {
        return 'estado-bueno';
    } else {
        return 'estado-malo';
    }
}

// Funciones de utilidad para UI
function mostrarCargando(elementId) {
    mostrarElemento(elementId);
}

function mostrarError(elementId, mensaje) {
    const errorElement = document.getElementById(elementId);
    errorElement.textContent = mensaje;
    mostrarElemento(elementId);
}

function mostrarElemento(elementId) {
    document.getElementById(elementId).classList.remove('hidden');
}

function ocultarElemento(elementId) {
    document.getElementById(elementId).classList.add('hidden');
}

function ocultarElementos(elementIds) {
    elementIds.forEach(id => ocultarElemento(id));
}

// Funciones del modal
function mostrarModal(titulo, mensaje) {
    const modalBody = document.getElementById('modal-body');
    modalBody.innerHTML = `
        <h3>${titulo}</h3>
        <p>${mensaje}</p>
        <button class="btn btn-primary" onclick="cerrarModal()">Cerrar</button>
    `;
    mostrarElemento('modal');
}

function cerrarModal() {
    ocultarElemento('modal');
}
