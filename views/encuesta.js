// Configuración de la API
const API_BASE_URL = 'http://localhost:3000/api'; // Cambiar por la URL real de tu API

// Variables globales
let encuestaActual = null;

// --- LÓGICA PARA TOMAR ENCUESTAS ---

async function cargarEncuesta() {
    const encuestaId = document.getElementById('encuesta-id').value;
    if (!encuestaId) {
        mostrarError('error-encuesta', 'Por favor ingresa un ID de encuesta válido.');
        return;
    }
    mostrarCargando('loading-encuesta');
    ocultarElementos(['error-encuesta', 'contenido-encuesta']);
    try {
        const response = await fetch(`${API_BASE_URL}/encuestas/${encuestaId}`);
        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        const encuesta = await response.json();
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
    document.getElementById('titulo-encuesta').textContent = encuesta.Nombre || 'Encuesta sin título';
    document.getElementById('descripcion-encuesta').textContent = encuesta.Descripcion || 'Sin descripción';
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

async function enviarRespuestas(event) {
    event.preventDefault();
    if (!encuestaActual) {
        mostrarError('error-encuesta', 'No hay una encuesta cargada.');
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
        const response = await fetch(`${API_BASE_URL}/respuestas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                EncuestaID: encuestaActual.EncuestaID,
                Respuestas: respuestas
            })
        });
        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        const resultado = await response.json();
        mostrarModal('¡Respuestas enviadas exitosamente!', '✅ Gracias por participar en la encuesta.');
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
                PreguntaID: preguntaId,
                OpcionID: parseInt(radioSeleccionado.value)
            });
        }
    });
    return respuestas;
}

// --- LÓGICA PARA VER RESULTADOS ---

async function cargarResultados() {
    const encuestaId = document.getElementById('resultados-id').value;
    if (!encuestaId) {
        mostrarError('error-resultados', 'Por favor ingresa un ID de encuesta válido.');
        return;
    }
    mostrarCargando('loading-resultados');
    ocultarElementos(['error-resultados', 'contenido-resultados']);
    try {
        const response = await fetch(`${API_BASE_URL}/encuestas/${encuestaId}/resumen`);
        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        const resumen = await response.json();
        mostrarResultados(resumen);
    } catch (error) {
        console.error('Error al cargar resultados:', error);
        mostrarError('error-resultados', `Error al cargar los resultados: ${error.message}`);
    } finally {
        ocultarElemento('loading-resultados');
    }
}

function mostrarResultados(resumen) {
    document.getElementById('titulo-resultados').textContent = resumen.Encuesta || 'Resultados de la Encuesta';
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
    stats.appendChild(porcentajeElement);
    stats.appendChild(indicador);
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


// --- LÓGICA DE SIMULACIÓN ---

function simularDatosEncuesta(id) {
    // Devolver la encuesta proporcionada por el usuario, ignorando el ID.
    return { "EncuestaID": 1, "Nombre": "Encuesta de Conocimiento y Dominio", "Descripcion": "Evalúa si el catedrático demuestra dominio y usa recursos adecuados.", "Preguntas": [{ "PreguntaID": 1, "TextoPregunta": "¿Qué recursos tecnológicos brinda el catedrático para impartir el curso?", "Opciones": [{ "OpcionID": 1, "TextoOpcion": "Ejercicios prácticos resueltos" }, { "OpcionID": 2, "TextoOpcion": "Presentaciones y diapositivas" }, { "OpcionID": 3, "TextoOpcion": "Recursos tecnológicos como APIs o simuladores" }, { "OpcionID": 4, "TextoOpcion": "Videos explicativos" }, { "OpcionID": 5, "TextoOpcion": "Foros o plataformas de discusión" }, { "OpcionID": 6, "TextoOpcion": "No brinda nada" }, { "OpcionID": 91, "TextoOpcion": "Aplicaciones de ejemplo" }] }, { "PreguntaID": 2, "TextoPregunta": "¿Qué estrategias usa para explicar los temas?", "Opciones": [{ "OpcionID": 7, "TextoOpcion": "Ejemplos prácticos en clase" }, { "OpcionID": 8, "TextoOpcion": "Analogías y casos reales" }, { "OpcionID": 9, "TextoOpcion": "Demostraciones en vivo" }, { "OpcionID": 10, "TextoOpcion": "Material escrito complementario" }, { "OpcionID": 11, "TextoOpcion": "Sesiones grabadas" }, { "OpcionID": 12, "TextoOpcion": "No utiliza ninguna estrategia clara" }] }, { "PreguntaID": 3, "TextoPregunta": "¿Qué materiales de apoyo entrega en clase?", "Opciones": [{ "OpcionID": 13, "TextoOpcion": "Guías de estudio" }, { "OpcionID": 14, "TextoOpcion": "Banco de ejercicios" }, { "OpcionID": 15, "TextoOpcion": "Manuales o tutoriales" }, { "OpcionID": 16, "TextoOpcion": "Acceso a bibliografía digital" }, { "OpcionID": 17, "TextoOpcion": "Plantillas de trabajo" }, { "OpcionID": 18, "TextoOpcion": "No entrega materiales" }] }, { "PreguntaID": 4, "TextoPregunta": "¿Qué herramientas usa para evaluar el aprendizaje?", "Opciones": [{ "OpcionID": 19, "TextoOpcion": "Exámenes cortos" }, { "OpcionID": 20, "TextoOpcion": "Quices prácticos en clase" }, { "OpcionID": 21, "TextoOpcion": "Trabajos de investigación" }, { "OpcionID": 22, "TextoOpcion": "Evaluaciones con software especializado" }, { "OpcionID": 23, "TextoOpcion": "Rúbricas de evaluación claras" }, { "OpcionID": 24, "TextoOpcion": "No utiliza herramientas de evaluación" }] }, { "PreguntaID": 5, "TextoPregunta": "¿Qué medios utiliza para mantener actualizados los contenidos?", "Opciones": [{ "OpcionID": 25, "TextoOpcion": "Lecturas recientes de la materia" }, { "OpcionID": 26, "TextoOpcion": "Enlaces a artículos académicos" }, { "OpcionID": 27, "TextoOpcion": "Uso de software actualizado" }, { "OpcionID": 28, "TextoOpcion": "Referencias a normativas vigentes" }, { "OpcionID": 29, "TextoOpcion": "Comparación con tendencias actuales" }, { "OpcionID": 30, "TextoOpcion": "No actualiza los contenidos" }] }] };
}

function simularDatosResultados(id) {
    // Devuelve los datos de resultados proporcionados por el usuario.
    return { "EncuestaID": 1, "Encuesta": "Encuesta de Conocimiento y Dominio", "Descripcion": "Evalúa si el catedrático demuestra dominio y usa recursos adecuados.", "Preguntas": [{ "PreguntaID": 1, "TextoPregunta": "¿Qué recursos tecnológicos brinda el catedrático para impartir el curso?", "TotalOpcionesDisponibles": 6, "NumeroUsuariosRespondieron": 6, "TotalGeneralDisponibles": 36, "TotalOpcionesSeleccionadas": 13, "Porcentaje": 36.11, "Carita": "&#128528;" }, { "PreguntaID": 2, "TextoPregunta": "¿Qué estrategias usa para explicar los temas?", "TotalOpcionesDisponibles": 5, "NumeroUsuariosRespondieron": 5, "TotalGeneralDisponibles": 25, "TotalOpcionesSeleccionadas": 11, "Porcentaje": 44.00, "Carita": "&#128528;" }, { "PreguntaID": 3, "TextoPregunta": "¿Qué materiales de apoyo entrega en clase?", "TotalOpcionesDisponibles": 5, "NumeroUsuariosRespondieron": 5, "TotalGeneralDisponibles": 25, "TotalOpcionesSeleccionadas": 10, "Porcentaje": 40.00, "Carita": "&#128528;" }, { "PreguntaID": 4, "TextoPregunta": "¿Qué herramientas usa para evaluar el aprendizaje?", "TotalOpcionesDisponibles": 5, "NumeroUsuariosRespondieron": 5, "TotalGeneralDisponibles": 25, "TotalOpcionesSeleccionadas": 13, "Porcentaje": 52.00, "Carita": "&#128528;" }, { "PreguntaID": 5, "TextoPregunta": "¿Qué medios utiliza para mantener actualizados los contenidos?", "TotalOpcionesDisponibles": 5, "NumeroUsuariosRespondieron": 5, "TotalGeneralDisponibles": 25, "TotalOpcionesSeleccionadas": 10, "Porcentaje": 40.00, "Carita": "&#128528;" }] };
}

// Función temporal para probar sin API
function probarSinAPI() {
    console.log('Modo de prueba activado - usando datos simulados');
    
    // Sobrescribir funciones para usar datos simulados
    window.cargarEncuestaOriginal = cargarEncuesta;
    window.cargarResultadosOriginal = cargarResultados;
    
    cargarEncuesta = async function() {
        const encuestaId = document.getElementById('encuesta-id').value;
        if (!encuestaId) {
            mostrarError('error-encuesta', 'Por favor ingresa un ID de encuesta válido.');
            return;
        }
        mostrarCargando('loading-encuesta');
        ocultarElementos(['error-encuesta', 'contenido-encuesta']);
        setTimeout(() => {
            const encuesta = simularDatosEncuesta(encuestaId);
            encuestaActual = encuesta;
            mostrarEncuesta(encuesta);
            ocultarElemento('loading-encuesta');
        }, 1000);
    };
    
    cargarResultados = async function() {
        const encuestaId = document.getElementById('resultados-id').value;
        if (!encuestaId) {
            mostrarError('error-resultados', 'Por favor ingresa un ID de encuesta válido.');
            return;
        }
        mostrarCargando('loading-resultados');
        ocultarElementos(['error-resultados', 'contenido-resultados']);
        setTimeout(() => {
            const resumen = simularDatosResultados(encuestaId);
            mostrarResultados(resumen);
            ocultarElemento('loading-resultados');
        }, 1000);
    };
};

// Activar modo de prueba automáticamente
probarSinAPI();
