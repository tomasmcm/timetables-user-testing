if(localStorage.getItem("other_votes") === null){
  resetResults();
}
updateResults();

function resetResults(){
  localStorage.setItem("app_votes", 0);
  localStorage.setItem("web_votes", 0);
  localStorage.setItem("other_votes", 0);
  localStorage.setItem("mobile_votes", 0);
  localStorage.setItem("tablet_votes", 0);
  localStorage.setItem("desktop_votes", 0);
  localStorage.setItem("total_votes", 0);
  updateResults();
}

function getItem(s){
  return parseInt(localStorage.getItem(s));
}

var app_votes, web_votes, other_votes, mobile_votes, tablet_votes, desktop_votes, total_votes;

document.querySelector(".o-header__js").addEventListener("click", function(){
  document.querySelector(".o-section__version__js").scrollIntoView();
}, false);

document.querySelector(".c-results-link__js").addEventListener("click", function(e){
  e.stopPropagation();
  document.querySelector(".o-section__results__js").scrollIntoView();
}, false);

document.querySelector(".c-button-app__js").addEventListener("click", versionQuestion, false);
document.querySelector(".c-button-web__js").addEventListener("click", versionQuestion, false);
document.querySelector(".c-button-other__js").addEventListener("click", versionQuestion, false);

document.querySelector(".c-button-mobile__js").addEventListener("click", platformQuestion, false);
document.querySelector(".c-button-tablet__js").addEventListener("click", platformQuestion, false);
document.querySelector(".c-button-desktop__js").addEventListener("click", platformQuestion, false);

document.querySelector(".c-results__reset__js").addEventListener("click", confirmationReset, false);


function confirmationReset(){
  if (window.confirm("Are you sure you want to reset?")) {
    resetResults();
  }
}

function versionQuestion(e){
  var id = e.target.dataset.answer+"_votes";
  localStorage.setItem(id, getItem(id) + 1);
  localStorage.setItem("total_votes", getItem("total_votes") + 1);
  updateResults();
  document.querySelector(".o-section__platform__js").scrollIntoView();
}

function platformQuestion(e){
  var id = e.target.dataset.answer+"_votes";
  localStorage.setItem(id, getItem(id) + 1);
  updateResults();
  document.querySelector(".o-section__thanks__js").scrollIntoView();
  setTimeout(function(){
    document.querySelector(".o-section__version__js").scrollIntoView();
  },1000);
}

function updateResults(){
  app_votes = getItem("app_votes");
  web_votes = getItem("web_votes");
  other_votes = getItem("other_votes");
  mobile_votes = getItem("mobile_votes");
  tablet_votes = getItem("tablet_votes");
  desktop_votes = getItem("desktop_votes");
  total_votes = getItem("total_votes");

  document.querySelector(".c-results__app_votes").innerHTML = app_votes;
  document.querySelector(".c-results__web_votes").innerHTML = web_votes;
  document.querySelector(".c-results__other_votes").innerHTML = other_votes;
  document.querySelector(".c-results__mobile_votes").innerHTML = mobile_votes;
  document.querySelector(".c-results__tablet_votes").innerHTML = tablet_votes;
  document.querySelector(".c-results__desktop_votes").innerHTML = desktop_votes;
  document.querySelector(".c-results__total_votes").innerHTML = total_votes;
}
