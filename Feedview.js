// feedview.js
import { supabase } from "./supabase.js";

export async function FeedView(app) {
  // Limpiar el contenedor
  app.innerHTML = `
    <div class="feed-container">
      <h2>Feed de Posts</h2>
      <div id="postsList">Cargando posts...</div>
    </div>
  `;

  const postsList = document.getElementById("postsList");

  try {
    // Intentar cargar posts desde Supabase
    const { data: posts, error } = await supabase
      .from("posts")
      .select("user_id, username, imagenPerfil, imagenPost")
      .order("id", { ascending: false });

    if (error) throw error;

    if (!posts || posts.length === 0) {
      postsList.innerHTML = "<p>No hay posts todavía 😶</p>";
      return;
    }

    // Construir HTML de posts
    postsList.innerHTML = posts
      .map(
        (p) => `
      <div class="post-card">
        <img src="${p.imagenPerfil || ''}" class="profile-img" alt="Perfil">
        <h3>${p.username || "Anonimo"}</h3>
        <img src="${p.imagenPost || ''}" class="post-img" alt="Post">
      </div>
    `
      )
      .join("");

  } catch (err) {
    postsList.innerHTML = `<p>Error cargando posts: ${err.message}</p>`;
    alert("Error cargando posts: " + err.message);
  }
}