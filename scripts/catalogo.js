// ID de tu libro de Google Sheets
const SPREADSHEET_ID = "1ialkNMv22CEdk5jlWDLJHYnT0PzBKMyMXtEbJ13tcNY";

// Nombre exacto de la pestaña para la página principal
const NOMBRE_HOJA = "Destacados"; 

let productosGlobales = [];

document.addEventListener("DOMContentLoaded", () => {
  fetchDestacados();

// --- DESPLEGAR/CERRAR MENÚ DE PEANUTS AL HACER CLIC EN EL BOTÓN O FUERA ---
  document.addEventListener("click", (e) => {
    const btnPeanuts = e.target.closest("#btn-peanuts");
    const dropdownPeanuts = Array.from(document.querySelectorAll(".main-nav .dropdown")).find(dropdown => {
      const link = dropdown.querySelector("a");
      return link && link.textContent.trim().toLowerCase().includes("peanuts");
    });

    // 1. Si hace clic en el botón Peanuts del Banner
    if (btnPeanuts) {
      e.preventDefault();
      e.stopPropagation();

      if (dropdownPeanuts) {
        dropdownPeanuts.classList.toggle("active-open");
        
        // Si se acaba de abrir, desplaza suavemente hacia el header
        if (dropdownPeanuts.classList.contains("active-open")) {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      }
      return;
    }

    // 2. Si hace clic en cualquier otro lado de la pantalla, cierra el menú si estaba abierto
    if (dropdownPeanuts && dropdownPeanuts.classList.contains("active-open")) {
      if (!dropdownPeanuts.contains(e.target)) {
        dropdownPeanuts.classList.remove("active-open");
      }
    }
  });

  // Escuchar el ordenador de precios si existe en la página
  const sortSelect = document.getElementById("sort-select");
  if (sortSelect) {
    sortSelect.addEventListener("change", (e) => {
      ordenarProductos(e.target.value);
    });
  }

  // Lógica de interacción para la Lupa en el Home
  document.addEventListener("click", (e) => {
    const btnSearch = e.target.closest("#btn-search");
    const searchContainer = document.getElementById("search-container");
    const searchInput = document.getElementById("search-input");
    const heroSection = document.querySelector(".hero-section");

    if (btnSearch && searchContainer) {
      e.preventDefault();
      e.stopPropagation();

      searchContainer.classList.toggle("active");

      if (searchContainer.classList.contains("active") && searchInput) {
        searchInput.focus();
      } else {
        // Si se cierra manualmente, se borra la búsqueda y regresa el Banner
        if (searchInput) searchInput.value = "";
        if (heroSection) heroSection.style.display = "block";
        renderProductosHome(productosGlobales);
      }
      return;
    }

    // Si hace clic fuera del buscador y el input está vacío, cierra y restaura el Banner
    if (searchContainer && !searchContainer.contains(e.target)) {
      if (searchInput && searchInput.value.trim() === "") {
        searchContainer.classList.remove("active");
        if (heroSection) heroSection.style.display = "block";
      }
    }
  });

  // Escuchar la tecla Enter en el formulario de búsqueda
  document.addEventListener("submit", (e) => {
    if (e.target && e.target.id === "search-form") {
      e.preventDefault();
      const searchInput = document.getElementById("search-input");
      if (searchInput) {
        filtrarCatalogoHome(searchInput.value);
      }
    }
  });

  // Filtrado dinámico mientras el usuario escribe
  document.addEventListener("input", (e) => {
    if (e.target && e.target.id === "search-input") {
      filtrarCatalogoHome(e.target.value);
    }
  });
});

async function fetchDestacados() {
  const container = document.getElementById("productos-container") || document.getElementById("products-grid");
  if (!container) return;

  const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(NOMBRE_HOJA)}`;

  try {
    const response = await fetch(url);
    const text = await response.text();

    const jsonText = text.substring(47, text.length - 2);
    const data = JSON.parse(jsonText);

    const columnas = data.table.cols.map(col => col.label ? col.label.toLowerCase().trim() : '');

    productosGlobales = data.table.rows.map(row => {
      let producto = {};
      if (row.c) {
        row.c.forEach((celda, index) => {
          const nombreCol = columnas[index];
          if (nombreCol) {
            producto[nombreCol] = celda ? celda.v : '';
          }
        });
      }
      return producto;
    });

    renderProductosHome(productosGlobales);
  } catch (error) {
    console.error("Error al cargar productos destacados:", error);
    container.innerHTML = `<p style="grid-column: 1/-1; text-align: center; padding: 20px;">No se pudieron cargar los productos destacados.</p>`;
  }
}

function filtrarCatalogoHome(textoIngresado) {
  const texto = textoIngresado.toLowerCase().trim();
  const heroSection = document.querySelector(".hero-section");

  // Ocultar el banner si el usuario está buscando algo, de lo contrario volverlo a mostrar
  if (texto !== "") {
    if (heroSection) heroSection.style.display = "none";
  } else {
    if (heroSection) heroSection.style.display = "block";
  }

  const productosFiltrados = productosGlobales.filter(prod => {
    const nombre = (prod.nombre || prod.titulo || prod.producto || '').toLowerCase();
    const marca = (prod.marca || prod.franquicia || '').toLowerCase();
    return nombre.includes(texto) || marca.includes(texto);
  });

  renderProductosHome(productosFiltrados);
}

function renderProductosHome(products) {
  const container = document.getElementById("productos-container") || document.getElementById("products-grid");
  if (!container) return;

  container.innerHTML = "";

  if (products.length === 0) {
    container.innerHTML = `<p style="grid-column: 1/-1; text-align: center; padding: 20px;">No se encontraron productos en la búsqueda.</p>`;
    return;
  }

  products.forEach(prod => {
    const nombre = prod.nombre || prod.titulo || prod.producto || 'Producto Destacado';
    const precio = prod.precio || prod.costo || '0.00';
    let imagen = prod.imagen || prod.img || prod.foto || '';

    // Convertir enlaces compartidos de Google Drive
    if (imagen.includes("drive.google.com")) {
      let fileId = "";
      if (imagen.includes("/d/")) {
        fileId = imagen.split("/d/")[1].split("/")[0].split("?")[0];
      } else if (imagen.includes("id=")) {
        fileId = imagen.split("id=")[1].split("&")[0];
      }
      
      if (fileId) {
        imagen = `https://lh3.googleusercontent.com/d/${fileId}`;
      }
    }

    if (!imagen) {
      imagen = 'https://via.placeholder.com/300x300?text=Sin+Imagen';
    }

    const marca = prod.marca || prod.franquicia || '';
    const etiqueta = prod.etiqueta || prod.badge || '';

    const card = document.createElement("article");
    card.className = "product-card";

    const badgeHtml = etiqueta ? `<span class="badge">${etiqueta}</span>` : '';
    const marcaHtml = marca ? `<span class="brand-label">${marca}</span>` : '';

    card.innerHTML = `
      ${badgeHtml}
      <div class="img-wrapper">
        <img src="${imagen}" alt="${nombre}" onerror="this.onerror=null; this.src='https://via.placeholder.com/300x300?text=Sin+Imagen';">
      </div>
      <div class="card-body">
        ${marcaHtml}
        <h3 class="product-name">${nombre}</h3>
        <p class="product-price">$${precio} MXN</p>
        <button class="btn-buy">Agregar al carrito</button>
      </div>
    `;

    container.appendChild(card);
  });
}

function ordenarProductos(criterio) {
  let listaOrdenada = [...productosGlobales];

  if (criterio === "price-asc") {
    listaOrdenada.sort((a, b) => parseFloat(a.precio || 0) - parseFloat(b.precio || 0));
  } else if (criterio === "price-desc") {
    listaOrdenada.sort((a, b) => parseFloat(b.precio || 0) - parseFloat(a.precio || 0));
  }

  renderProductosHome(listaOrdenada);
} 