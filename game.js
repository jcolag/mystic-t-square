const faceNo = '🙅';
const faceYes = '🙆';
const zwj = '\u200D';
const skin = [ '🏻', '🏼', '🏽', '🏾', '🏿' ];
const gender = [ '♀️', '♂️' ];
let questionIndex = 0;
let questions = {};
let answering = null;
let turn = -1;
let playTurn = askQuestion;

window.addEventListener('load', (e) => {
  const modal = document.getElementById('startup-modal');

  Array.from(document.getElementsByTagName('td'))
    .forEach((cell) => cell.addEventListener('click', handleCellClick));
  getQuestions(8);
  nextTurn(true);
  modal.classList.add('hidden-modal');
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
  if (answering !== null) {
    return;
  }

  playTurn(event);
}

function askQuestion(event) {
  if (event.target.innerHTML.length > 0) {
    console.log(event.target.innerHTML.length);
    return;
  }

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
  answering = event.target;
  questionIndex++;
  nextTurn(false);
}

function moveTile(event) {
}

function handleAnswerClick(event) {
  if (answering === null) {
    return;
  }

  const button = event.target;
  const panel = button.parentNode;
  const question = questions.results[panel.id];
  const buttons = Array.from(panel.getElementsByTagName('button'));
  const coord = answering.id.split('-');
  let result;

  if (button.innerHTML === unescape(question.correct_answer)) {
    result = document.createTextNode(makeFace('O'));
  } else {
    result = document.createTextNode(makeFace('X'));
  }
  answering.appendChild(result);
  buttons.forEach((b) => {
    b.disabled = true;
    if (b.innerHTML === unescape(question.correct_answer)) {
      b.classList.add('correct-answer');
    }

    if (b === button) {
      b.classList.add('guessed-answer');
    }
  });
  answering = null;
  nextTurn(true);
  checkWin(winState, loseState, 'O');
}

function unescape(input) {
  const doc = new DOMParser()
    .parseFromString(input, "text/html");

  return doc.documentElement.textContent;
}

function checkWin(reportWin, reportTie, player) {
  let found = [];

  for (let i = 0; i < 3; i++) {
    const row = map[i];
    const col = map.map((r) => r[i]);

    if (row[0] === row[1] && row[1] === row[2]) {
      found.push(row[0]);
    }

    if (col[0] === col[1] && col[1] === col[2]) {
      found.push(col[0]);
    }
  }

  if (map[0][0] === map[1][1] && map[1][1] === map[2][2]) {
    found.push(map[0][0]);
  }

  if (map[0][2] === map[1][1] && map[1][1] === map[2][0]) {
    found.push(map[0][2]);
  }

  const result = found
    .filter((x) => x !== null)
    .filter((v, i, s) => s.indexOf(v) === i);

  if (result.length > 0) {
    reportWin(result, player);
  }

  return result;
}

function loseState() {
}

function winState(result, player) {
}

function makeFace(type) {
  const s = Math.floor(Math.random() * (skin.length + 1));
  const g = Math.floor(Math.random() * (gender.length + 1));
  const face = type === 'O' ? faceYes : faceNo;

  return face +
    (s === skin.length ? '' : skin[s]) +
    (g === gender.length ? '' : (zwj + gender[g])) +
    '\uFE0F';
}

function nextTurn(changePlayer) {
  const whoPlays = document.getElementById('who-plays');
  if (changePlayer) {
    turn++;
    playTurn = turn % 2 === 0 ? askQuestion : moveTile;
    whoPlays.innerHTML = turn % 2 === 0
      ? `${faceYes} - Choose a square/question`
      : `${faceNo} - Slide a tile into the empty space`;
  } else {
    whoPlays.innerHTML = `${faceYes} - Answer the question`;
  }
}
