const cuerpo = document.getElementById("cuerpoHorario");
const form = document.getElementById("formulario");
const selector = document.getElementById("selectorHorario");
const celdaVirtuales = document.getElementById("virtualesCelda");

let horarios = JSON.parse(localStorage.getItem("horarios")) || {};
let horarioActual = Object.keys(horarios)[0] || "Horario 1";
const coloresCurso = {};
let colorIndex = 0;
const MAX_COLORES = 7;

const horasDecimal = [];
let hora = 8.5;
while (hora <= 23) {
  horasDecimal.push(hora);
  hora += 0.25;
}

function cargarSelector() {
  selector.innerHTML = "";
  for (let nombre in horarios) {
    const opt = document.createElement("option");
    opt.value = nombre;
    opt.textContent = nombre;
    if (nombre === horarioActual) opt.selected = true;
    selector.appendChild(opt);
  }
}

function renderHorario() {
  cuerpo.innerHTML = "";
  celdaVirtuales.innerHTML = "";

  horasDecimal.forEach(h => {
    const fila = document.createElement("tr");
    const celdaHora = document.createElement("td");
    celdaHora.textContent = `${formatoHora(h)} - ${formatoHora(h + 0.25)}`;
    fila.appendChild(celdaHora);
    for (let i = 0; i < 7; i++) {
      fila.appendChild(document.createElement("td"));
    }
    cuerpo.appendChild(fila);
  });

  horarios[horarioActual].asincronos.forEach((c, index) => {
    const span = document.createElement("div");
    span.className = `ocupado virtual ${getColor(c.nombre)}`;
    span.style.margin = "4px";
    span.style.display = "inline-block";
    span.innerHTML = `<strong>${c.nombre}</strong><br><small>${c.profesor}</small>`;
    span.addEventListener("contextmenu", e => {
      e.preventDefault();
      if (confirm(`¿Eliminar curso virtual: ${c.nombre}?`)) {
        horarios[horarioActual].asincronos.splice(index, 1);
        guardar();
      }
    });
    celdaVirtuales.appendChild(span);
  });

  horarios[horarioActual].bloques.forEach((c, idx) => {
    horasDecimal.forEach((h, i) => {
      if (h >= c.hInicio && h < c.hFin) {
        const fila = cuerpo.children[i];
        const celda = fila.children[c.dia + 1];
        celda.innerHTML = `<strong>${c.nombre}</strong><br><small>${c.profesor}</small>`;
        celda.className = `ocupado ${getColor(c.nombre)} ${c.virtual ? 'virtual' : ''}`;
        celda.addEventListener("contextmenu", e => {
          e.preventDefault();
          if (confirm(`¿Eliminar todo el bloque de: ${c.nombre}?`)) {
            horarios[horarioActual].bloques = horarios[horarioActual].bloques.filter((_, j) => j !== idx);
            guardar();
          }
        });
      }
    });
  });
}

function formatoHora(decimal) {
  const h = Math.floor(decimal);
  const m = Math.round((decimal % 1) * 60);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = ((h + 11) % 12 + 1);
  return `${h12}:${m.toString().padStart(2, "0")} ${ampm}`;
}

function aDecimal(str) {
  const [h, m] = str.split(":").map(Number);
  return h + m / 60;
}

function getColor(nombre) {
  if (!(nombre in coloresCurso)) {
    coloresCurso[nombre] = `bg-curso-${colorIndex % MAX_COLORES}`;
    colorIndex++;
  }
  return coloresCurso[nombre];
}

form.addEventListener("submit", e => {
  e.preventDefault();
  const nombre = document.getElementById("curso").value.trim();
  const profesor = document.getElementById("profesor").value.trim();
  const dia = parseInt(document.getElementById("dia").value);
  const hIni = document.getElementById("horaInicio").value;
  const hFin = document.getElementById("horaFin").value;
  const esVirtual = document.getElementById("virtual").checked;

  if (!nombre || !profesor) return alert("Completa los datos");

  if (esVirtual) {
    horarios[horarioActual].asincronos.push({ nombre, profesor });
  } else {
    if (isNaN(dia) || !hIni || !hFin) return alert("Faltan datos de horario");
    horarios[horarioActual].bloques.push({
      nombre,
      profesor,
      dia,
      hInicio: aDecimal(hIni),
      hFin: aDecimal(hFin),
      virtual: false
    });
  }

  guardar();
  form.reset();
});

function guardar() {
  localStorage.setItem("horarios", JSON.stringify(horarios));
  renderHorario();
  cargarSelector();
}

function crearNuevoHorario() {
  const nuevo = prompt("Nombre del nuevo horario:");
  if (!nuevo || horarios[nuevo]) return;
  horarios[nuevo] = { bloques: [], asincronos: [] };
  horarioActual = nuevo;
  guardar();
}

selector.addEventListener("change", e => {
  horarioActual = e.target.value;
  guardar();
});

if (!horarios[horarioActual]) horarios[horarioActual] = { bloques: [], asincronos: [] };
guardar();
