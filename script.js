const cuerpo = document.getElementById("cuerpoHorario");
const form = document.getElementById("formulario");
const selector = document.getElementById("selectorHorario");
const celdaVirtuales = document.getElementById("virtualesCelda");

let horarios = JSON.parse(localStorage.getItem("horarios")) || {};
let horarioActual = Object.keys(horarios)[0] || "Horario 1";
const coloresCurso = {};
let colorIndex = 0;
const MAX_COLORES = 7;

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

  const bloques = horarios[horarioActual].bloques;
  const horasUsadas = new Set();

  
  bloques.forEach(b => {
    for (let h = b.hInicio; h < b.hFin; h += 0.25) {
      horasUsadas.add(h.toFixed(2));
    }
  });

  const horasOrdenadas = Array.from(horasUsadas).map(parseFloat).sort((a, b) => a - b);

  horasOrdenadas.forEach(h => {
    const fila = document.createElement("tr");
    const celdaHora = document.createElement("td");
    celdaHora.textContent = `${formatoHora(h)} - ${formatoHora(h + 0.25)}`;
    fila.appendChild(celdaHora);

    for (let i = 0; i < 7; i++) {
      fila.appendChild(document.createElement("td"));
    }

    cuerpo.appendChild(fila);
  });

  
  bloques.forEach((c, idx) => {
    for (let h = c.hInicio; h < c.hFin; h += 0.25) {
      const index = horasOrdenadas.indexOf(parseFloat(h.toFixed(2)));
      if (index === -1) continue;

      c.dias.forEach(d => {
        const fila = cuerpo.children[index];
        const celda = fila.children[d + 1];
        celda.innerHTML = `
          <strong>${c.nombre}</strong><br>
          ${c.profesor ? `<small>${c.profesor}</small><br>` : ""}
          <button onclick="eliminarBloque(${idx})">🗑️</button>
        `;
        celda.className = `ocupado ${getColor(c.nombre)} ${c.virtual ? 'virtual' : ''}`;
      });
    }
  });

  
  horarios[horarioActual].asincronos.forEach((c, index) => {
    const contenedor = document.createElement("div");
    contenedor.className = `ocupado virtual ${getColor(c.nombre)}`;
    contenedor.style.margin = "4px";
    contenedor.style.display = "inline-block";
    contenedor.innerHTML = `
      <strong>${c.nombre}</strong><br>
      ${c.profesor ? `<small>${c.profesor}</small><br>` : ""}
      <button onclick="eliminarAsincronico(${index})">🗑️</button>
    `;
    celdaVirtuales.appendChild(contenedor);
  });
}

function eliminarBloque(idx) {
  horarios[horarioActual].bloques.splice(idx, 1);
  guardar();
}

function eliminarAsincronico(index) {
  horarios[horarioActual].asincronos.splice(index, 1);
  guardar();
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
  const dias = Array.from(document.querySelectorAll('input[name="dia"]:checked')).map(x => parseInt(x.value));
  const hIni = document.getElementById("horaInicio").value;
  const hFin = document.getElementById("horaFin").value;
  const esVirtual = document.getElementById("virtual").checked;

  if (!nombre) return alert("Falta el nombre del curso");

  if (esVirtual) {
    horarios[horarioActual].asincronos.push({ nombre, profesor });
  } else {
    if (dias.length === 0 || !hIni || !hFin) return alert("Faltan datos del horario");
    horarios[horarioActual].bloques.push({
      nombre,
      profesor,
      dias,
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
