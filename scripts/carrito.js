// Teléfono de contacto de la boutique para WhatsApp
const TELEFONO_WHATSAPP = "527971227699"; 

let carrito = [];
let opcionSeleccionada = "apartar";

// Cargar datos guardados
try {
  const guardado = localStorage.getItem("carrito_browns");
  carrito = guardado ? JSON.parse(guardado) : [];
  if (!Array.isArray(carrito)) carrito = [];
} catch (e) {
  carrito = [];
}

document.addEventListener("DOMContentLoaded", () => {
  guardarYActualizar();
  setTimeout(guardarYActualizar, 300);
  setTimeout(guardarYActualizar, 800);

  // --- ESCUCHADOR GLOBAL DE CLICS (Detecta todo en tiempo real) ---
  document.addEventListener("click", (e) => {
    
    // 1. BOTÓN DE WHATSAPP
    const btnWhatsapp = e.target.closest("#btn-checkout-whatsapp");
    if (btnWhatsapp) {
      e.preventDefault();
      enviarPedidoWhatsApp();
      return;
    }

    // 2. Pestañas (Apartar / Pagar)
    const tabBtn = e.target.closest(".cart-tab-btn");
    if (tabBtn) {
      const tabGroup = tabBtn.closest(".cart-tabs-nav");
      const tabType = tabBtn.dataset.tab;

      if (tabGroup && tabType) {
        tabGroup.querySelectorAll(".cart-tab-btn").forEach(b => b.classList.remove("active"));
        tabBtn.classList.add("active");

        tabGroup.setAttribute("data-active", tabType);
        opcionSeleccionada = tabType;
        
        renderizarCarrito();
      }
      return;
    }

    // 3. Abrir / Cerrar Carrito
    const btnCart = e.target.closest("#btn-cart") || e.target.closest("#floating-cart");
    const closeCart = e.target.closest("#close-cart") || e.target.closest("#cart-overlay");

    if (btnCart) {
      e.preventDefault();
      abrirCarrito();
      return;
    } else if (closeCart) {
      cerrarCarrito();
      return;
    }

    // 4. Botón "Agregar al carrito"
    const btnBuy = e.target.closest(".btn-buy");
    if (btnBuy) {
      const card = btnBuy.closest(".product-card") || btnBuy.closest("article");
      if (card) {
        const nombre = card.querySelector(".product-name")?.textContent.trim() || 
                       card.querySelector("h3")?.textContent.trim() || "Producto";
        
        const precioText = card.querySelector(".product-price")?.textContent || "0";
        const precio = parseFloat(precioText.replace(/[^0-9.]/g, "")) || 0;
        
        const imagen = card.querySelector("img")?.src || "";

        agregarAlCarrito({ nombre, precio, imagen });
      }
      return;
    }

    // 5. Botones +, -, eliminar en el carrito
    const btnPlus = e.target.closest(".qty-plus");
    const btnMinus = e.target.closest(".qty-minus");
    const btnRemove = e.target.closest(".remove-item-btn");

    if (btnPlus) {
      const index = parseInt(btnPlus.dataset.index);
      if (!isNaN(index) && carrito[index]) {
        carrito[index].cantidad++;
        guardarYActualizar();
      }
    } else if (btnMinus) {
      const index = parseInt(btnMinus.dataset.index);
      if (!isNaN(index) && carrito[index]) {
        if (carrito[index].cantidad > 1) {
          carrito[index].cantidad--;
        } else {
          carrito.splice(index, 1);
        }
        guardarYActualizar();
      }
    } else if (btnRemove) {
      const index = parseInt(btnRemove.dataset.index);
      if (!isNaN(index) && carrito[index]) {
        carrito.splice(index, 1);
        guardarYActualizar();
      }
    }
  });
});

function agregarAlCarrito(producto) {
  const existe = carrito.find(item => item.nombre === producto.nombre);

  if (existe) {
    existe.cantidad++;
  } else {
    carrito.push({ ...producto, cantidad: 1 });
  }

  guardarYActualizar();
  abrirCarrito();
}

function guardarYActualizar() {
  localStorage.setItem("carrito_browns", JSON.stringify(carrito));
  actualizarContadores();
  renderizarCarrito();
}

function actualizarContadores() {
  const totalItems = carrito.reduce((sum, item) => sum + (item.cantidad || 0), 0);

  const countHeader = document.getElementById("cart-count");
  const countFloating = document.getElementById("floating-cart-count");

  if (countHeader) countHeader.textContent = totalItems;
  if (countFloating) countFloating.textContent = totalItems;
}

function abrirCarrito() {
  const sidebar = document.getElementById("cart-sidebar");
  const overlay = document.getElementById("cart-overlay");

  if (sidebar) sidebar.classList.add("active");
  if (overlay) overlay.classList.add("active");
}

function cerrarCarrito() {
  const sidebar = document.getElementById("cart-sidebar");
  const overlay = document.getElementById("cart-overlay");

  if (sidebar) sidebar.classList.remove("active");
  if (overlay) overlay.classList.remove("active");
}

function renderizarCarrito() {
  const container = document.getElementById("cart-items");
  const totalEl = document.getElementById("cart-total-price");
  const apartadoEl = document.getElementById("cart-apartado-price");
  
  // Buscar todas las filas de apartado por si hay duplicadas en el HTML
  const todasLasFilas = document.querySelectorAll(".cart-apartado-row");
  const apartadoRow = todasLasFilas[0]; // Tomamos la primera

  // Si hay más de una fila duplicada en el HTML, borramos las extras de golpe
  for (let i = 1; i < todasLasFilas.length; i++) {
    todasLasFilas[i].remove();
  }

  if (!container) return;

  if (carrito.length === 0) {
    container.innerHTML = `<p class="cart-empty-msg">Tu carrito está vacío</p>`;
    if (totalEl) totalEl.textContent = "$0.00 MXN";
    if (apartadoEl) apartadoEl.textContent = "$0.00 MXN";
    if (apartadoRow) apartadoRow.style.display = "none";
    return;
  }

  let html = "";
  let total = 0;
  let totalUnidades = 0;

  carrito.forEach((item, index) => {
    const subtotal = (item.precio || 0) * (item.cantidad || 1);
    total += subtotal;
    totalUnidades += (item.cantidad || 1);

    html += `
      <div class="cart-item">
        <img src="${item.imagen}" alt="${item.nombre}">
        <div class="cart-item-details">
          <div class="cart-item-title">${item.nombre}</div>
          <div class="cart-item-price">$${(item.precio || 0).toFixed(2)} MXN</div>
          <div class="cart-item-qty">
            <button class="qty-btn qty-minus" data-index="${index}">-</button>
            <span>${item.cantidad}</span>
            <button class="qty-btn qty-plus" data-index="${index}">+</button>
            <button class="remove-item-btn" data-index="${index}">
              <i class="fas fa-trash-alt"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
  
  if (totalEl) totalEl.textContent = `$${total.toFixed(2)} MXN`;
  
  const totalApartado = totalUnidades * 100;
  if (apartadoEl) apartadoEl.textContent = `$${totalApartado.toFixed(2)} MXN`;

  // CONTROL DIRECTO: Se muestra en 'apartar', se oculta en 'pagar'
  if (apartadoRow) {
    if (opcionSeleccionada === "apartar") {
      apartadoRow.style.setProperty("display", "flex", "important");
    } else {
      apartadoRow.style.setProperty("display", "none", "important");
    }
  }
}

function enviarPedidoWhatsApp() {
  if (carrito.length === 0) {
    alert("Tu carrito está vacío. Agrega productos antes de realizar el pedido.");
    return;
  }

  let mensaje = "";
  let total = 0;

  if (opcionSeleccionada === "apartar") {
    mensaje += "¡Hola! Me gustaría apartar los siguientes productos:\n\n";
  } else {
    mensaje += "¡Hola! Deseo realizar la compra directa de los siguientes productos:\n\n";
  }

  carrito.forEach((item) => {
    const subtotal = (item.precio || 0) * (item.cantidad || 1);
    total += subtotal;
    mensaje += `${item.cantidad} ${item.nombre}\n`;
  });

  if (opcionSeleccionada === "apartar") {
    mensaje += "\n¿Me podrías compartir las cuentas bancarias o métodos para realizar el apartado?";
  } else {
    mensaje += "\n¿Me compartes las formas de pago (transferencia/depósito)?";
  }

  const url = `https://api.whatsapp.com/send?phone=${TELEFONO_WHATSAPP}&text=${encodeURIComponent(mensaje)}`;
  window.location.href = url;
}