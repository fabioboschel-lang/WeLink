// feedView.js
import { supabase } from "./supabase.js";

export async function FeedView(app) {
  console.log("🚀 FeedView iniciado");

  app.innerHTML = `
    <div class="feed-container">
      <div id="imagesGrid" class="imagesGrid"></div>
    </div>
  `;

  const imagesGrid = document.getElementById("imagesGrid");
  const BATCH_SIZE = 30;

  // ⚠️ Usuario actual
  const currentUserId = localStorage.getItem("user_id");
  console.log("👤 currentUserId:", currentUserId, "length:", currentUserId?.length);

  if (!currentUserId) {
    alert("No hay user_id en localStorage");
    return;
  }

  try {
    // 🔹 1. Traer posts
    const { data: posts, error: postsError } = await supabase
      .from("posts")
      .select("imagenPost, user_id")
      .not("imagenPost", "is", null)
      .order("created_at", { ascending: false })
      .limit(BATCH_SIZE);

    if (postsError) {
      console.error("❌ Error posts:", postsError);
      return;
    }
    console.log("📦 posts:", posts);

    if (!posts || posts.length === 0) {
      console.warn("⚠️ No hay posts");
      return;
    }

    // 🔹 2. Traer likes donde yo soy destinatario
    const { data: likes, error: likesError } = await supabase
      .from("Likes")
      .select("*")
      .eq("Destinatario", currentUserId);

    if (likesError) {
      console.error("❌ Error likes:", likesError);
      return;
    }
    console.log("❤️ likes crudos:", likes);

    // 🔹 3. Revisar tipos y keys
    likes.forEach((l, i) => {
      console.log(`🔍 like[${i}] keys:`, Object.keys(l), "values:", l);
    });

    // 🔹 4. Crear Set de remitentes que me dieron like
    const likesSet = new Set(likes.map(like => like.Remitente));
    console.log("⚡ likesSet:", [...likesSet]);

    // 🔹 5. Limpiar grid
    imagesGrid.innerHTML = "";

    // 🔹 6. Renderizar posts
    posts.forEach((post, index) => {
      console.log(`🧩 Post ${index}`, post);

      const hasLikeFromUser = likesSet.has(post.user_id);
      console.log("➡️ Comparación:");
      console.log("post.user_id:", post.user_id, "¿Está en likesSet?:", hasLikeFromUser);

      const wrapper = document.createElement("div");
      wrapper.classList.add("post");
      wrapper.dataset.userId = post.user_id;
      wrapper.dataset.hasLikeFromUser = hasLikeFromUser;

      console.log("🧠 wrapper.dataset.hasLikeFromUser:", wrapper.dataset.hasLikeFromUser);

      const img = document.createElement("img");
      img.src = post.imagenPost;
      img.alt = "Imagen del post";
      img.classList.add("feed-img");

      const btn = document.createElement("button");
      btn.textContent = "❤️";
      btn.classList.add("likeBtn");

      // 💜 Corazón violeta
      if (hasLikeFromUser) {
        console.log("💜 Se debería mostrar corazón violeta");
        const purpleHeart = document.createElement("div");
        purpleHeart.textContent = "💜";
        purpleHeart.classList.add("matchHeart");
        wrapper.appendChild(purpleHeart);
      }

      wrapper.appendChild(img);
      wrapper.appendChild(btn);
      imagesGrid.appendChild(wrapper);
    });

  } catch (err) {
    console.error("💥 Error general:", err);
  }
}

// 🔥 Evento global de likes
document.addEventListener("click", async (e) => {
  if (e.target.classList.contains("likeBtn")) {

    console.log("🖱 Click en like");

    const post = e.target.closest(".post");
    console.log("📦 Post clickeado:", post);

    const destinatario = post.dataset.userId;
    const remitente = localStorage.getItem("user_id");

    console.log("➡️ remitente:", remitente, "➡️ destinatario:", destinatario);

    if (!remitente) {
      alert("No hay user_id en localStorage");
      return;
    }

    const { error } = await supabase
      .from("Likes")
      .insert([{ Remitente: remitente, Destinatario: destinatario }]);

    if (error) {
      console.error("❌ Error insert:", error);
      return;
    }
    console.log("✅ Like insertado");

    const hasLikeFromUser = post.dataset.hasLikeFromUser === "true";
    console.log("🔍 hasLikeFromUser desde dataset:", hasLikeFromUser);

    if (hasLikeFromUser) {
      console.log("💜 MATCH detectado en click");
      const existingPurple = post.querySelector(".matchHeart");
      if (!existingPurple) {
        const purpleHeart = document.createElement("div");
        purpleHeart.textContent = "💜";
        purpleHeart.classList.add("matchHeart");
        post.appendChild(purpleHeart);
      }
    } else {
      console.log("❌ No hay match (nadie te dio like antes)");
    }
  }
});
