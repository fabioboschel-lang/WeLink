
import { ProfileView } from './Profileview.js';

import { FeedView } from './Feedview.js';
import { initNavigation } from './navigate.js';

const app = document.getElementById("app");

export function navigate(view){

  if(view === "profile"){
    ProfileView(app);
  }

  if(view === "feed"){
    FeedView(app);
  }

}

document.addEventListener("DOMContentLoaded", () => {

  
   
   
   initNavigation();
   
  navigate("profile");
  
  
  
  
  
  

});