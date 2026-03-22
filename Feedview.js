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
  
  // ⚠️ usuario actual desde localStorage  
  const currentUserId = localStorage.getItem("user_id");  
  console.log("👤 currentUserId:", currentUserId);  
  
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
      .order("created_at", { ascending: false })  
      .limit(BATCH_SIZE);  
  
    if (postsError) {  
      console.error("❌ Error posts:", postsError);  
      return;  
    }  
  
    if (!posts || posts.length === 0) {  
      console.warn("⚠️ No hay posts");  
      return;  
    }  
  
    console.log("📦 posts cargados:", posts);  
  
    // 🔹 2. Traer todos los likes donde yo soy destinatario (para match violeta)  
    const { data: likesReceived, error: likesError } = await supabase  
      .from("Likes")  
      .select("Remitente, Destinatario")  
      .eq("Destinatario", currentUserId);  
  
    if (likesError) {  
      console.error("❌ Error likes:", likesError);  
      return;  
    }  
  
    console.log("❤️ likes recibidos:", likesReceived);  
  
    // 🔹 3. Crear Set de remitentes que ya me dieron like (match visual)  
    const likesSet = new Set(likesReceived.map(like => like.Remitente));  
    console.log("⚡ likesSet:", [...likesSet]);  
  
    // 🔹 4. Traer likes que yo ya di (para toggle rojo/gris)  
    const { data: likesGiven } = await supabase  
      .from("Likes")  
      .select("Remitente, Destinatario")  
      .eq("Remitente", currentUserId);  
  
    const givenSet = new Set(likesGiven.map(like => like.Destinatario));  
    console.log("💌 likesGiven:", [...givenSet]);  

    // 🔹 5. Traer textos aleatorios de la tabla "Proposiciones"  
    const { data: textos, error: textosError } = await supabase  
      .from("Proposiciones")  
      .select("Estado1");  

    if (textosError) {  
      console.error("❌ Error textos:", textosError);  
    } else {  
      console.log("📝 Textos cargados:", textos);  
    }  
  
    // 🔹 6. Limpiar grid  
    imagesGrid.innerHTML = "";  
  
    // 🔹 7. Renderizar posts  
    posts.forEach((post, index) => {  
      const wrapper = document.createElement("div");  
      wrapper.classList.add("post");  
      wrapper.dataset.userId = post.user_id;  

      // Estado del toggle rojo/gris  
      const hasGivenLike = givenSet.has(post.user_id);  
      wrapper.dataset.hasGivenLike = hasGivenLike;  

      // Imagen  
      const img = document.createElement("img");  
      img.src = post.imagenPost;  
      img.alt = "Imagen del post";  
      img.classList.add("feed-img");  

      // Botón like  
      const btn = document.createElement("button");  
      btn.textContent = hasGivenLike ? "❤️" : "🤍";  
      btn.classList.add("likeBtn");  

      // Corazón violeta si el otro usuario ya me dio like (match visual)  
      if (likesSet.has(post.user_id)) {  
        const purpleHeart = document.createElement("div");  
        purpleHeart.textContent = "💜";  
        purpleHeart.classList.add("matchHeart");  
        wrapper.appendChild(purpleHeart);  
      }  

      // 🔹 Texto aleatorio relacionado al post  
      let textoAleatorio = "";  
      if (textos && textos.length > 0) {  
        const idx = Math.floor(Math.random() * textos.length);  
        textoAleatorio = textos[idx].Estado1;  
      }  
      const textoDiv = document.createElement("div");  
      textoDiv.classList.add("post-text");  
      textoDiv.textContent = textoAleatorio;  
textoDiv.classList.add("show");
      // Armar estructura  
      wrapper.appendChild(img);  
      wrapper.appendChild(btn);  
      wrapper.appendChild(textoDiv);  
      imagesGrid.appendChild(wrapper);  
    });  
  
  } catch (err) {  
    console.error("💥 Error general:", err);  
  }  
}  
  
// 🔥 Evento global de toggle like (PRO version)
document.addEventListener("click", async (e) => {
  if (!e.target.classList.contains("likeBtn")) return;

  const post = e.target.closest(".post");
  const destinatario = post.dataset.userId;
  const remitente = localStorage.getItem("user_id");

  if (!remitente || !destinatario) {
    console.error("❌ Falta remitente o destinatario");
    return;
  }

  // 🔥 anti-spam
  if (post.dataset.liking === "true") return;
  post.dataset.liking = "true";

  const btn = e.target;

  try {
    if (post.dataset.hasGivenLike === "true") {
      // 🔥 1. UI instantánea (remove)
      btn.textContent = "🤍";
      post.dataset.hasGivenLike = "false";

      // 🔥 2. backend
      const { error: delError } = await supabase
        .from("Likes")
        .delete()
        .eq("Remitente", remitente)
        .eq("Destinatario", destinatario);

      // 🔥 3. rollback si falla
      if (delError) {
        console.error("❌ Error al eliminar like:", delError);

        btn.textContent = "❤️";
        post.dataset.hasGivenLike = "true";
      }

    } else {
      // 🔥 1. UI instantánea (insert)
      btn.textContent = "❤️";
      post.dataset.hasGivenLike = "true";

      // 🔥 2. backend
      const { error: insError } = await supabase
        .from("Likes")
        .insert([{ Remitente: remitente, Destinatario: destinatario }]);

      // 🔥 3. rollback si falla
      if (insError) {
        console.error("❌ Error al insertar like:", insError);

        btn.textContent = "🤍";
        post.dataset.hasGivenLike = "false";
      } else {
        // 🔥 4. CHECK MATCH (solo si insert fue OK)

        if (!post.querySelector(".matchHeart")) {
          const { data: reciprocal } = await supabase
            .from("Likes")
            .select("*")
            .eq("Remitente", destinatario)
            .eq("Destinatario", remitente);

          if (reciprocal && reciprocal.length > 0) {
            const purpleHeart = document.createElement("div");
            purpleHeart.textContent = "💜";
            purpleHeart.classList.add("matchHeart");
            post.appendChild(purpleHeart);

            console.log("💜 Match detectado y mostrado");
          }
        }
      }
    }

  } catch (err) {
    console.error("💥 Error toggle like:", err);

    // 🔥 rollback general seguro
    if (post.dataset.hasGivenLike === "true") {
      btn.textContent = "🤍";
      post.dataset.hasGivenLike = "false";
    } else {
      btn.textContent = "❤️";
      post.dataset.hasGivenLike = "true";
    }

  } finally {
    post.dataset.liking = "false";
  }
});
// 🔹 Efecto visual de doble tap (degradado)
// 🔹 Efecto visual de doble tap con corazón SVG degradado
// 🔹 Efecto visual de doble tap con 

document.addEventListener("dblclick", async (e) => {
  if (e.target.classList.contains("feed-img")) {
    const img = e.target;
    const wrapper = img.closest(".post");
    if (!wrapper) return;

    const destinatario = wrapper.dataset.userId;
    const remitente = localStorage.getItem("user_id");
    const hasGivenLike = wrapper.dataset.hasGivenLike === "true";

    // 🔹 lógica like
    if (!hasGivenLike && remitente && destinatario) {
      if (wrapper.dataset.liking === "true") return;
      wrapper.dataset.liking = "true";

      const btn = wrapper.querySelector(".likeBtn");

      // 🔥 UI instantánea
      wrapper.dataset.hasGivenLike = "true";
      if (btn) btn.textContent = "❤️";

      try {
        const { error: insError } = await supabase
          .from("Likes")
          .insert([{ Remitente: remitente, Destinatario: destinatario }]);

        if (insError) {
          console.error("❌ Error insert:", insError);

          wrapper.dataset.hasGivenLike = "false";
          if (btn) btn.textContent = "🤍";
        }

      } catch (err) {
        console.error("💥 Error dblclick like:", err);

        wrapper.dataset.hasGivenLike = "false";
        if (btn) btn.textContent = "🤍";
      } finally {
        wrapper.dataset.liking = "false";
      }
    }

    // 🔹 resto igual (tu código visual)
    const rect = img.getBoundingClientRect();

    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;

    y -= 100;

    x = Math.max(75, Math.min(rect.width - 75, x));
    y = Math.max(75, Math.min(rect.height - 75, y));

    const bigHeart = document.createElement("div");
    bigHeart.classList.add("bigHeartEffect");

    bigHeart.style.left = `${x}px`;
    bigHeart.style.top = `${y}px`;

    wrapper.appendChild(bigHeart);
const gradientId = "gradientHeart-" + Date.now();

bigHeart.innerHTML = `
<svg viewBox="0 0 512 512">
  <defs>
    <linearGradient id="${gradientId}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FF8C00"/>
      <stop offset="50%" stop-color="#FF69B4"/>
      <stop offset="100%" stop-color="#FFD700"/>
    </linearGradient>
  </defs>
  <path fill="url(#${gradientId})" d="M256 464s-16-14.8-70-68.3C88.5 331 32 271.5 32 192 32 120 88 64 160 64c48 0 80 32 96 64 16-32 48-64 96-64 72 0 128 56 128 128 0 79.5-56.5 139-154 203.7-54 53.5-70 68.3-70 68.3z"/>
</svg>
`;
    void bigHeart.offsetWidth;

    bigHeart.classList.add("show");

    setTimeout(() => {
      bigHeart.classList.remove("show");
    }, 900);

    bigHeart.addEventListener("transitionend", () => {
      bigHeart.remove();
    });

  }
});
