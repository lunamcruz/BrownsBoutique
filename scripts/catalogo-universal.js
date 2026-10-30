// ID de tu libro de Google Sheets
const SPREADSHEET_ID = "1ialkNMv22CEdk5jlWDLJHYnT0PzBKMyMXtEbJ13tcNY";

let productosGlobales = [];

document.addEventListener("DOMContentLoaded", () => {
  // Lógica de carga de catálogo y ordenamiento
  fetchProducts();

  const sortSelect = document.getElementById("sort-select");
  if (sortSelect) {
    sortSelect.addEventListener("change", (e) => {
      ordenarProductos(e.target.value);
    });
  }

  // Delegación de eventos global para detectar el clic en la lupa
  document.addEventListener("click", (e) => {
    const btnSearch = e.target.closest("#btn-search");
    const searchContainer = document.getElementById("search-container");
    const searchInput = document.getElementById("search-input");

    // Si hace clic en la lupa
    if (btnSearch && searchContainer) {
      e.preventDefault();
      e.stopPropagation();

      searchContainer.classList.toggle("active");

      if (searchContainer.classList.contains("active") && searchInput) {
        searchInput.focus();
      } else if (searchInput && searchInput.value.trim() !== "") {
        searchInput.value = "";
        renderProducts(productosGlobales);
      }
      return;
    }

    // Si hace clic fuera del buscador, cerrarlo si el campo está vacío
    if (searchContainer && !searchContainer.contains(e.target)) {
      if (searchInput && searchInput.value.trim() === "") {
        searchContainer.classList.remove("active");
      }
    }
  });

  // Escuchar el evento del formulario para cuando el usuario presione Enter
  document.addEventListener("submit", (e) => {
    if (e.target && e.target.id === "search-form") {
      e.preventDefault();
      const searchInput = document.getElementById("search-input");
      if (searchInput) {
        filtrarCatalogo(searchInput.value);
      }
    }
  });

  // Escuchar el texto introducido para filtrar el catálogo en tiempo real
  document.addEventListener("input", (e) => {
    if (e.target && e.target.id === "search-input") {
      filtrarCatalogo(e.target.value);
    }
  });
});

function filtrarCatalogo(textoIngresado) {
  const texto = textoIngresado.toLowerCase().trim();

  const productosFiltrados = productosGlobales.filter(prod => {
    const nombre = (prod.nombre || prod.titulo || prod.producto || '').toLowerCase();
    const marca = (prod.marca || prod.franquicia || '').toLowerCase();
    return nombre.includes(texto) || marca.includes(texto);
  });

  renderProducts(productosFiltrados);
}

async function fetchProducts() {
  const grid = document.getElementById("products-grid");
  const countEl = document.getElementById("product-count");

  // Verificar que se haya definido la variable HOJA_ACTUAL en el HTML
  if (typeof HOJA_ACTUAL === "undefined") {
    console.error("No se definió la variable HOJA_ACTUAL en el HTML.");
    if (grid) {
      grid.innerHTML = `<p class="error-msg">Error: No se especificó el nombre de la hoja a cargar.</p>`;
    }
    return;
  }

  const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(HOJA_ACTUAL)}`;

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

    renderProducts(productosGlobales);
  } catch (error) {
    console.error(`Error al cargar productos de "${HOJA_ACTUAL}":`, error);
    if (grid) {
      grid.innerHTML = `<p class="error-msg">No se pudieron cargar los productos de "${HOJA_ACTUAL}". Revisa la pestaña en Google Sheets.</p>`;
    }
    if (countEl) countEl.textContent = "0 productos encontrados";
  }
}

function renderProducts(products) {
  const grid = document.getElementById("products-grid");
  const countEl = document.getElementById("product-count");

  if (!grid) return;

  grid.innerHTML = "";
  if (countEl) countEl.textContent = `Mostrando ${products.length} productos`;

  if (products.length === 0) {
    grid.innerHTML = `<p class="empty-msg">No hay productos disponibles en esta sección.</p>`;
    return;
  }

  products.forEach(prod => {
    const nombre = prod.nombre || prod.titulo || prod.producto || 'Producto';
    const precio = prod.precio || prod.costo || '0.00';
    let imagen = prod.imagen || prod.img || prod.foto || prod.url || '';

    // Extracción de ID universal para Google Drive
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

    grid.appendChild(card);
  });
}

function ordenarProductos(criterio) {
  let listaOrdenada = [...productosGlobales];

  if (criterio === "price-asc") {
    listaOrdenada.sort((a, b) => parseFloat(a.precio || 0) - parseFloat(b.precio || 0));
  } else if (criterio === "price-desc") {
    listaOrdenada.sort((a, b) => parseFloat(b.precio || 0) - parseFloat(a.precio || 0));
  }

  renderProducts(listaOrdenada);
}