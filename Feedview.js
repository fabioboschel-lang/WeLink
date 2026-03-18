// feedView.js
import { supabase } from "./supabase.js";

export async function FeedView(app) {
  app.innerHTML = `
    <div class="feed-container">
      <div id="imagesGrid" class="imagesGrid"></div>
    </div>
  `;

  const imagesGrid = document.getElementById("imagesGrid");

  // ⚙️ CONFIG
  const BATCH_SIZE = 30;

  // ⚠️ usuario actual desde localStorage
  const currentUserId = localStorage.getItem("user_id");

  if (!currentUserId) {
    alert("No hay user_id en localStorage");
    return;
  }

  try {
    // 🔹 1. Traer posts (batch)
    const { data: posts, error: postsError } = await supabase
      .from("posts")
      .select("imagenPost, user_id")
      .not("imagenPost", "is", null)
      .limit(BATCH_SIZE);

    if (postsError) {
      alert("Error cargando imágenes: " + postsError.message);
      return;
    }

    if (!posts || posts.length === 0) {
      alert("No hay imágenes para mostrar");
      return;
    }

    // 🔹 2. Traer TODOS los likes donde yo soy destinatario
    const { data: likes, error: likesError } = await supabase
      .from("Likes")
      .select("Remitente, Destinatario")
      .eq("Destinatario", currentUserId);

    if (likesError) {
      console.error("Error cargando likes:", likesError);
      return;
    }

    // 🔹 3. Convertir likes en un Set para lookup rápido
    const likesSet = new Set(
      likes.map(like => like.Remitente)
    );

    // 🔹 4. Limpiar grid
    imagesGrid.innerHTML = "";

    // 🔹 5. Renderizar posts con estado
    posts.forEach((post) => {

      // Estado interno del post
      const hasLikeFromUser = likesSet.has(post.user_id);

      // Contenedor
      const wrapper = document.createElement("div");
      wrapper.classList.add("post");
      wrapper.dataset.userId = post.user_id;

      // Imagen
      const img = document.createElement("img");
      img.src = post.imagenPost;
      img.alt = "Imagen del post";
      img.classList.add("feed-img");

      // Botón like (normal)
      const btn = document.createElement("button");
      btn.textContent = "❤️";
      btn.classList.add("likeBtn");

      // 💜 Corazón violeta (solo visual si ya te dio like)
      if (hasLikeFromUser) {
        const purpleHeart = document.createElement("div");
        purpleHeart.textContent = "💜";
        purpleHeart.classList.add("matchHeart");
        wrapper.appendChild(purpleHeart);
      }

      // Armar estructura
      wrapper.appendChild(img);
      wrapper.appendChild(btn);
      imagesGrid.appendChild(wrapper);
    });

  } catch (err) {
    alert("Error inesperado al cargar Feed: " + err.message);
  }
}

// 🔥 Evento global de likes
document.addEventListener("click", async (e) => {
  if (e.target.classList.contains("likeBtn")) {

    const post = e.target.closest(".post");
    const destinatario = post.dataset.userId;
    const remitente = localStorage.getItem("user_id");

    if (!remitente) {
      alert("No hay user_id en localStorage");
      return;
    }

    // 🔹 Insertar like en DB
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
      return;
    }

    console.log("Like insertado");

    // 🔥 RESPUESTA INMEDIATA (sin esperar DB)
    // Si ya te había dado like → mostrar corazón violeta (match visual)
    const existingPurple = post.querySelector(".matchHeart");

    if (!existingPurple) {
      const purpleHeart = document.createElement("div");
      purpleHeart.textContent = "💜";
      purpleHeart.classList.add("matchHeart");
      post.appendChild(purpleHeart);
    }
  }
});
