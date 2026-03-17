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
      .select("imagenPost")
      .not("imagenPost", "is", null);

    if (error) {
      alert("Error cargando imágenes: " + error.message);
      return;
    }

    if (!posts || posts.length === 0) {
      alert("No hay imágenes para mostrar");
      return;
    }

    // Limpiar grid por si hay algo previo
    imagesGrid.innerHTML = "";

    posts.forEach((post) => {
      const img = document.createElement("img");
      img.src = post.imagenPost;
      img.alt = "Imagen del post";
      img.classList.add("feed-img");
      imagesGrid.appendChild(img);
    });
  } catch (err) {
    alert("Error inesperado al cargar Feed: " + err.message);
  }
}