const faceNo = '🙅';
const faceYes = '🙆';
const zwj = '\u200D';
const skin = [ '🏻', '🏼', '🏽', '🏾', '🏿' ];
const gender = [ '♀️', '♂️' ];
const modifiers = [
  ...skin,
  ...gender,
  zwj,
];
let questionIndex = 0;
let questions = {};
let answering = null;
let turn = -1;
let playTurn = askQuestion;
let useApiToken;

window.addEventListener('load', (e) => {
  const modal = document.getElementById('startup-modal');
  const about = document.getElementById('about-modal');
  const config = document.getElementById('config-modal');
  const stats = document.getElementById('stats-modal');
  const openAbout = document.getElementById('help');
  const closeAbout = document.getElementById('close-about');
  const openConfig = document.getElementById('config');
  const closeConfig = document.getElementById('close-config');
  const openStats = document.getElementById('stats');
  const closeStats = document.getElementById('close-stats');
  const apiCheck = document.getElementById('use-api-token');
  let token = localStorage.getItem('apiToken');
  let lastGame = localStorage.getItem('lastGame');

  useApiToken = localStorage.getItem('useApiToken');
  if (useApiToken !== null) {
    useApiToken = true;
    localStorage.setItem('useApiToken', useApiToken);
  }

  apiCheck.checked = useApiToken;
  if (
    useApiToken
      && (
        token === null
          || Date.now() - lastGame > 21600000
      )
  ) {
    token = openSession();
    localStorage.setItem('apiToken', token);
    localStorage.setItem('lastGame', Date.now());
  }

  Array.from(document.getElementsByTagName('td'))
    .forEach((cell) => cell.addEventListener('click', handleCellClick));
  openAbout.addEventListener(
    'click', () => about.classList.remove('hidden-modal')
  );
  closeAbout.addEventListener(
    'click', () => about.classList.add('hidden-modal')
  );
  openConfig.addEventListener(
    'click', () => config.classList.remove('hidden-modal')
  );
  closeConfig.addEventListener(
    'click', () => config.classList.add('hidden-modal')
  );
  openStats.addEventListener(
    'click', () => {
      populateStats();
      stats.classList.remove('hidden-modal');
    }
  );
  closeStats.addEventListener(
    'click', () => stats.classList.add('hidden-modal')
  );
  questions = getQuestions(8, token);
  nextTurn(true);
  modal.classList.add('hidden-modal');
  incrementStore('games');
});

function getQuestions (n, token) {
  const request = new XMLHttpRequest();
  const tokenVar = token === null ? '' : `&token=${token}`;

  request.open(
    'GET',
    `https://opentdb.com/api.php?amount=${n}${tokenVar}`,
    false
  );
  request.send(null);

  if (request.status !== 200) {
    alert('Problem with networking.');
    return;
  }

  if (request.response_code === 3 || request.response_code === 4) {
    token = openSession();
    localStorage.setItem('apiToken', token);
    localStorage.setItem('lastGame', Date.now());
    return getQuestions(n, token);
  }

  return JSON.parse(request.responseText);
}

function openSession() {
  const request = new XMLHttpRequest();

  request.open(
    'GET',
    'https://opentdb.com/api_token.php?command=request',
    false
  );
  request.send(null);

  if (request.status !== 200) {
    alert('Problem with networking.');
    return;
  }

  return JSON.parse(request.responseText).token;
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
  trivia.scrollTop = trivia.scrollHeight;
  answering = event.target;
  answering.classList.add('answering');
  questionIndex++;
  incrementStore('questionsAsked');
  nextTurn(false);
}

function moveTile(event) {
  const square = event.target;
  const coord = findNode(square.id);
  const emptySquare = document.getElementById('1-1');

  if (isNeighbor(coord)) {
    square.addEventListener('animationend', forgetAnimation);
    square.classList.add('animate__animated', 'animate__headShake');
    return;
  }

  swapNodes(square, emptySquare);
  incrementStore('tilesMoved');
  nextTurn(true);
  checkWin(winState, loseState);
}

function findNode(id) {
  const coord = {
    x: -1,
    y: -1,
  };
  let rowCount = -1;

  const rows = Array
    .from(
      document.getElementById('game-board').getElementsByTagName('tr')
    )
    .forEach((tr) => {
      let colCount = -1;

      rowCount++;
      Array
        .from(tr.getElementsByTagName('td'))
        .forEach((td) => {
          colCount++;
          if (td.id === id) {
            coord.x = colCount;
            coord.y = rowCount;
          }
        });
    });
  return coord;
}

function isNeighbor(coor) {
  const emp = findNode('1-1');

  return Math.abs(coor.x - emp.x) + Math.abs(coor.y - emp.y) !== 1;
}

function swapNodes(n1, n2) {
  const p1 = n1.parentNode;
  const p2 = n2.parentNode;
  var i1, i2;

  if (!p1 || !p2 || p1.isSameNode(n2) || p2.isSameNode(n1)) {
    return;
  }

  for (var i = 0; i < p1.children.length; i++) {
    if (p1.children[i].isSameNode(n1)) {
      i1 = i;
    }
  }

  for (var i = 0; i < p2.children.length; i++) {
    if (p2.children[i].isSameNode(n2)) {
      i2 = i;
    }
  }

  if (p1.isSameNode(p2) && i1 < i2) {
    i2++;
  }

  p1.insertBefore(n2, p1.children[i1]);
  p2.insertBefore(n1, p2.children[i2]);
}

function forgetAnimation(event) {
  const target = event.target;

  target.removeEventListener('animationend', forgetAnimation);
  target.classList.remove('animate__animated', 'animate__headShake');
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
    incrementStore('questionsCorrect');
  } else {
    result = document.createTextNode(makeFace('X'));
    incrementStore('questionsIncorrect');
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
  answering.classList.remove('answering');
  answering = null;
  nextTurn(true);
  checkWin(winState, loseState);
}

function unescape(input) {
  const doc = new DOMParser()
    .parseFromString(input, "text/html");

  return doc.documentElement.textContent;
}

function checkWin(reportWin, reportTie) {
  const map = [];
  let found = [];
  let empties = 0;

  const rows = Array
    .from(
      document.getElementById('game-board').getElementsByTagName('tr')
    )
    .forEach((tr) => {
      const row = [];

      Array
        .from(tr.getElementsByTagName('td'))
        .forEach((td) => {
          row.push(td.innerHTML);
          if (td.innerHTML.length === 0) {
            empties++;
          }
        });
      for (let a = 0; a < 3; a++) {
        row[a] = stripModifiers(row[a]);
      }

      map.push(row);
    });
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
    .filter((x) => x !== null && x.length > 0)
    .filter((v, i, s) => s.indexOf(v) === i);

  if (result.length > 0) {
    reportWin(result);
  } else if (empties === 0) {
    reportTie();
  }

  return result;
}

function loseState() {
  const whoPlays = document.getElementById('who-plays');
  const trivia = document.getElementById('right-panel');
  const panel = document.createElement('div');
  const report = document.createTextNode('A tie!');

  panel.appendChild(report);
  trivia.appendChild(panel);
  whoPlays.parentNode.removeChild(whoPlays);
  trivia.scrollTop = trivia.scrollHeight;
  incrementStore('gameTies');
}

function winState(result) {
  const which = stripModifiers(result[0]);
  const whoPlays = document.getElementById('who-plays');
  const trivia = document.getElementById('right-panel');
  const panel = document.createElement('div');
  const report = document.createTextNode(`${which} wins!`);

  incrementStore(`gamesTo${which.indexOf('🙆') >= 0 ? 'O' : 'X'}`);
  panel.appendChild(report);
  trivia.appendChild(panel);
  Array.from(
      document.getElementById('game-board').getElementsByTagName('tr')
    )
    .forEach((tr) => {
      Array
        .from(tr.getElementsByTagName('td'))
        .forEach((td) => {
          let xo = td.innerHTML;

          td.removeEventListener('click', handleCellClick);
          xo = stripModifiers(xo);
          if (xo === which) {
            td.classList.add('winning-side');
          }
        });
    });
  whoPlays.parentNode.removeChild(whoPlays);
  trivia.scrollTop = trivia.scrollHeight;
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

function stripModifiers(face) {
  let result = face;

  for (let i = 0; i < modifiers.length; i++) {
    result = result.replace(modifiers[i], '');
  }

  return result;
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


function changeTokenUse(checkbox) {
  useApiToken = checkbox.checked;
  localStorage.setItem('useApiToken', useApiToken);
}

function incrementStore(key) {
  let value = localStorage.getItem(key);

  if (value === null) {
    value = 0;
  } else {
    value = Number(value);
  }

  if (!Number.isInteger(value)) {
    return;
  }

  localStorage.setItem(key, value + 1);
}
