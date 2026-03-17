// feedView.js
import { supabase } from "./supabase.js";

export async function FeedView(app) {
  app.innerHTML = `
    <div class="feed-container">
      <div id="imagesGrid" class="imagesGrid"></div>
    </div>
  `;

  const imagesGrid = document.getElementById("imagesGrid");

  try {
    const { data: posts, error } = await supabase
      .from("posts")
      .select("imagenPost, user_id")
      .not("imagenPost", "is", null);

    if (error) {
      alert("Error cargando imágenes: " + error.message);
      return;
    }

    if (!posts || posts.length === 0) {
      alert("No hay imágenes para mostrar");
      return;
    }

    // Limpiar grid
    imagesGrid.innerHTML = "";

    posts.forEach((post) => {
      // Contenedor del post
      const wrapper = document.createElement("div");
      wrapper.classList.add("post");
      wrapper.dataset.userId = post.user_id;

      // Imagen
      const img = document.createElement("img");
      img.src = post.imagenPost;
      img.alt = "Imagen del post";
      img.classList.add("feed-img");

      // Botón like
      const btn = document.createElement("button");
      btn.textContent = "❤️";
      btn.classList.add("likeBtn");

      // Armar estructura
      wrapper.appendChild(img);
      wrapper.appendChild(btn);
      imagesGrid.appendChild(wrapper);
    });

  } catch (err) {
    alert("Error inesperado al cargar Feed: " + err.message);
  }
}

// Evento global para manejar likes
document.addEventListener("click", async (e) => {
  if (e.target.classList.contains("likeBtn")) {

    const post = e.target.closest(".post");

    const destinatario = post.dataset.userId;

    // ⚠️ temporal (después lo conectás con auth real)
const remitente = localStorage.getItem("user_id");

if (!remitente) {
  alert("No hay user_id en localStorage");
  return;
}

const { error } = await supabase
  .from("Likes")
  .insert([
    {
      Remitente: remitente,
      Destinatario: destinatario
    }
  ]);
    if (error) {
      console.error("Error al insertar like:", error);
    } else {
      console.log("Like insertado");
    }
  }
});
