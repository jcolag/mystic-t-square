const faceNo = '🙅';
const faceYes = '🙆';
const zwj = '\u200D';
let questions = {};
let answering = null;

window.addEventListener('load', (e) => {
  Array.from(document.getElementsByTagName('td'))
    .forEach((cell) => cell.addEventListener('click', handleCellClick));
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

function handleCellClick(event) {
  const trivia = document.getElementById('right-panel');
  const panel = document.createElement('div');
  const q = questions.results[questionIndex];
  const question = document.createTextNode(unescape(q.question));
  const line = document.createElement('br');
  const answers = [];

  answers.push(q.correct_answer);
  q.incorrect_answers.forEach((a) => answers.push(a));
  panel.id = questionIndex;
  panel.appendChild(question);
  panel.appendChild(line);
  answers
    .map((value) => ({ value, sort: Math.random() }))
    .sort((a,b) => a.sort - b.sort)
    .map(({value}) => value)
    .forEach((a) => {
      const answer = document.createElement('button');
      const answerText = document.createTextNode(unescape(a));

      answer.addEventListener('click', handleAnswerClick);
      answer.appendChild(answerText);
      panel.appendChild(answer);
    });
  trivia.appendChild(panel);
}

function unescape(input) {
  const doc = new DOMParser()
    .parseFromString(input, "text/html");

  return doc.documentElement.textContent;
}

function makeFace(type) {
  const face = type === 'O' ? faceYes : faceNo;

  return face;
}

