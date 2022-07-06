const faceNo = '🙅';
const faceYes = '🙆';
const zwj = '\u200D';
let questions = {};
let answering = null;

window.addEventListener('load', (e) => {
  getQuestions(8);
});

function getQuestions (n) {
  const request = new XMLHttpRequest();
  
  request.open('GET', `https://opentdb.com/api.php?amount=${n}`, false);
  request.send(null);

  if (request.status !== 200) {
    alert('Problem with networking.');
    return;
  }
  
  questions = JSON.parse(request.responseText);
}

function unescape(input) {
  const doc = new DOMParser()
    .parseFromString(input, "text/html");

  return doc.documentElement.textContent;
}

function checkWin(onWin) {
function makeFace(type) {
  const face = type === 'O' ? faceYes : faceNo;

  return face;
}

