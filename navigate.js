import { navigate } from "./app.js";

export function initNavigation(){

  const nav = document.getElementById("nav");

  nav.innerHTML = `
    <div class="nav-bar">
      <button id="nav-profile">Profile</button>
      <button id="nav-feed">Feed</button>
    </div>
  `;

  const profileBtn = document.getElementById("nav-profile");
  const feedBtn = document.getElementById("nav-feed");

  profileBtn.addEventListener("click", () => {
    navigate("profile");
  });

  feedBtn.addEventListener("click", () => {
    navigate("feed");
  });








}