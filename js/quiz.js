// quiz.js - "Think Wise" quiz ng Interactive page.
// DITO LANG papalitan ang mga tanong. Isang object = isang tanong. Pwede kang magdagdag ng kahit ilan.
// Sa bawat round, 10 tanong lang ang ipinapakita (QUIZ_LENGTH sa ibaba), random na pinili mula sa LAHAT ng tanong dito.
// Random din ang pagkakasunod-sunod ng mga tanong at choices, kaya hindi mahalaga ang pagkakasunod-sunod dito.
//   q: tanong | options: mga sagot (walang a. b. c.) | answer: index ng tamang sagot (0 = una, 1 = pangalawa, ...)
//   why: explanation na lalabas pagkatapos mag-click

const quizQuestions = [
  {
    q: "What is the main goal of the Pax Silica initiative?",
    options: [
      "To strengthen global semiconductor and AI supply chains",
      "To promote international sports competitions",
      "To reduce agricultural production",
      "To establish a global environmental agency"
    ],
    answer: 0,
    why: "Pax Silica is about building secure, trusted supply chains for semiconductors and artificial intelligence. It has nothing to do with sports, farming, or creating an environmental agency."
  },
  {
    q: "What is one possible benefit of the Philippines joining Pax Silica?",
    options: [
      "Less need for technological development",
      "More opportunities for technology investments and advanced manufacturing",
      "Complete elimination of international trade",
      "Removal of technology industries"
    ],
    answer: 1,
    why: "Being part of a semiconductor and AI supply-chain partnership can attract technology investments and open the door to advanced manufacturing. The other choices would hurt, not help, the country."
  },
  {
    q: "A company wants to produce computer chips but lacks important raw materials. Which Pax Silica goal can help address this problem?",
    options: [
      "Promoting tourism development",
      "Reducing agricultural imports",
      "Securing critical minerals and semiconductor supply chains",
      "Increasing plastic packaging production"
    ],
    answer: 2,
    why: "Chips need critical minerals. Securing those minerals and the semiconductor supply chain directly solves the company's shortage of raw materials."
  },
  {
    q: "What is El Niño?",
    options: [
      "A period of unusually strong rainfall worldwide",
      "A climate pattern involving warmer-than-average Pacific Ocean surface waters",
      "A sudden increase in Earth's land area",
      "A type of volcanic eruption"
    ],
    answer: 1,
    why: "El Niño is a climate pattern where the surface waters of the Pacific Ocean become warmer than average. In many places, including the Philippines, it can bring less rainfall and dry conditions, not worldwide heavy rain."
  },
  {
    q: "A farmer experiences extremely hot weather and very little rainfall during an El Niño period. What is one possible effect on the farm?",
    options: [
      "Increased water supply for irrigation",
      "Automatic improvement in crop production",
      "Reduced risk of drought",
      "Crop damage and reduced harvest"
    ],
    answer: 3,
    why: "Heat and very little rain dry out the soil and stress the plants, which can damage crops and lower the harvest. Water supply goes down and drought risk goes up."
  },
  {
    q: "During an El Niño event, a community experiences a shortage of clean water. What is the most responsible action?",
    options: [
      "Store and use water responsibly",
      "Leave faucets running",
      "Use drinking water to wash empty streets",
      "Ignore water conservation warnings"
    ],
    answer: 0,
    why: "When water is scarce, every drop counts. Storing water and using it carefully makes the limited supply last longer. The other choices waste water or ignore the problem."
  },
  {
    q: "Which of the following is an example of a natural water resource?",
    options: [
      "Plastic bottles",
      "Gasoline",
      "Rivers and lakes",
      "Concrete roads"
    ],
    answer: 2,
    why: "Rivers and lakes are bodies of water found in nature. Plastic bottles, gasoline, and concrete roads are man-made products."
  },
  {
    q: "A student notices that a faucet in the school restroom is leaking continuously. What should the student do?",
    options: [
      "Ignore the leak",
      "Report it to the teacher or maintenance staff",
      "Open another faucet",
      "Use more water to clean the area"
    ],
    answer: 1,
    why: "A continuous leak wastes a lot of water over time. Reporting it to the teacher or maintenance staff gets it fixed. Ignoring it or using more water only makes the waste worse."
  },
  {
    q: "Why is it important to protect watersheds and forests?",
    options: [
      "They increase plastic waste",
      "They prevent all natural disasters",
      "They eliminate the need for water treatment",
      "They help maintain water quality and support the water cycle"
    ],
    answer: 3,
    why: "Watersheds and forests catch and filter rainwater, keep our water cleaner, and support the water cycle. They help a lot, but they cannot prevent all disasters or replace water treatment."
  },
  {
    q: "A barangay wants to conserve water for future generations. Which project would be the BEST choice?",
    options: [
      "Organizing rainwater harvesting and water conservation programs",
      "Throwing garbage into nearby rivers",
      "Cutting down trees near water sources",
      "Allowing unlimited water usage"
    ],
    answer: 0,
    why: "Rainwater harvesting and conservation programs help save water for the long term. Polluting rivers, cutting trees near water sources, and unlimited usage all damage or waste our water."
  },
  {
    q: "What is the main purpose of technology in our daily lives?",
    options: [
      "To make tasks more difficult",
      "To help people communicate and complete tasks",
      "To increase pollution",
      "To replace all natural resources"
    ],
    answer: 1,
    why: "Technology exists to help people communicate, work, learn, and finish tasks faster and more easily. The other choices describe harm, which is not its purpose."
  },
  {
    q: "Which of the following is an example of a semiconductor device?",
    options: [
      "Wooden chair",
      "Paper notebook",
      "Computer chip",
      "Glass bottle"
    ],
    answer: 2,
    why: "A computer chip is built on semiconductor material, the same material at the center of Pax Silica. A chair, a notebook, and a glass bottle are not electronic devices."
  },
  {
    q: "Why is technological development important?",
    options: [
      "It helps improve people's lives and creates new opportunities.",
      "It prevents people from learning.",
      "It eliminates the need for education.",
      "It only increases environmental damage."
    ],
    answer: 0,
    why: "Technological development improves daily life, such as in health, education, and work, and it opens new opportunities. It does not stop learning or replace education."
  },
  {
    q: "What is one possible environmental impact of industrial development?",
    options: [
      "Cleaner air in all areas",
      "More natural forests",
      "Reduced energy consumption in every case",
      "Increased use of water and energy"
    ],
    answer: 3,
    why: "Factories and industries often use a lot of water and energy, which can put pressure on natural resources. It does not automatically mean cleaner air or more forests."
  },
  {
    q: "Why should industries practice environmental responsibility?",
    options: [
      "To increase waste production",
      "To reduce negative effects on the environment",
      "To use more natural resources than necessary",
      "To avoid following environmental regulations"
    ],
    answer: 1,
    why: "Environmental responsibility means reducing harmful effects like pollution and waste, so nature and people stay protected. The other choices would make the damage worse."
  },
  {
    q: "What is El Niño?",
    options: [
      "A type of earthquake",
      "A strong ocean storm",
      "A climate pattern characterized by warmer-than-average surface waters in the Pacific Ocean",
      "A type of volcanic eruption"
    ],
    answer: 2,
    why: "El Niño is a climate pattern where the surface waters of the Pacific Ocean are warmer than average. It is not an earthquake, a storm, or a volcanic eruption."
  },
  {
    q: "Which of the following conditions may occur during El Niño in the Philippines?",
    options: [
      "Reduced rainfall and warmer temperatures",
      "Continuous snowfall",
      "Permanent flooding in all provinces",
      "Extremely cold weather throughout the country"
    ],
    answer: 0,
    why: "In the Philippines, El Niño usually brings less rainfall and warmer temperatures, which can lead to dry spells and drought. Snow, permanent flooding, and extreme cold do not happen here."
  },
  {
    q: "Which group is commonly affected by drought?",
    options: [
      "Movie actors",
      "Musicians",
      "Athletes",
      "Farmers"
    ],
    answer: 3,
    why: "Farmers depend on rain and irrigation to grow crops, so drought hits them first and hardest. The other groups are not directly tied to water for their work."
  },
  {
    q: "What is one possible effect of prolonged drought on agriculture?",
    options: [
      "Increased water supply",
      "Crop damage and reduced harvests",
      "Unlimited irrigation water",
      "Faster forest growth"
    ],
    answer: 1,
    why: "Without enough water, plants dry out and die, which damages crops and lowers the harvest. Drought reduces the water supply; it does not increase it."
  },
  {
    q: "Which action can help communities prepare for dry conditions?",
    options: [
      "Wasting available water",
      "Ignoring weather updates",
      "Practicing water conservation",
      "Leaving faucets open"
    ],
    answer: 2,
    why: "Practicing water conservation helps the community make its water last during dry conditions. Wasting water, ignoring weather updates, and leaving faucets open make shortages worse."
  },
  {
    q: "What are water resources?",
    options: [
      "Natural sources of water that people and the environment depend on",
      "Manufactured products",
      "Types of electrical equipment",
      "Sources of plastic materials"
    ],
    answer: 0,
    why: "Water resources are natural sources of water, such as rivers, lakes, groundwater, and oceans, that people and the environment depend on. The other choices are man-made things."
  },
  {
    q: "Which of the following is a source of freshwater?",
    options: [
      "Ocean",
      "Sea",
      "Saltwater pool",
      "Lake"
    ],
    answer: 3,
    why: "A lake is a freshwater source. Oceans, seas, and saltwater pools contain salt water, which is not suitable for drinking or farming without treatment."
  },
  {
    q: "Why is clean water important to human beings?",
    options: [
      "It is used only for transportation.",
      "It supports health, sanitation, and daily activities.",
      "It is needed only by farmers.",
      "It has no connection to human health."
    ],
    answer: 1,
    why: "Clean water keeps us healthy and is needed for sanitation, cooking, drinking, and daily activities. It is not only for transportation or farmers."
  },
  {
    q: "What is water conservation?",
    options: [
      "Using water without limits",
      "Throwing waste into rivers",
      "Using water wisely and avoiding unnecessary waste",
      "Preventing people from accessing water"
    ],
    answer: 2,
    why: "Water conservation means using water wisely and avoiding unnecessary waste, so there is enough for everyone now and later."
  },
  {
    q: "Which of the following activities can cause water pollution?",
    options: [
      "Throwing garbage into rivers",
      "Planting trees near waterways",
      "Practicing proper waste disposal",
      "Cleaning water sources"
    ],
    answer: 0,
    why: "Throwing garbage into rivers pollutes the water. Planting trees, proper waste disposal, and cleaning water sources all protect it."
  },
  {
    q: "What is the main purpose of protecting watersheds?",
    options: [
      "To increase soil pollution",
      "To encourage illegal logging",
      "To reduce the number of freshwater sources",
      "To protect water sources and maintain water quality"
    ],
    answer: 3,
    why: "Protecting watersheds keeps water sources safe and maintains water quality. Pollution and illegal logging would damage them."
  },
  {
    q: "Which of the following human activities helps conserve water?",
    options: [
      "Taking unnecessarily long showers",
      "Turning off the faucet when it is not in use",
      "Washing only one item at a time under running water",
      "Ignoring leaking pipes"
    ],
    answer: 1,
    why: "Turning off the faucet when it is not in use saves water. The other choices waste water, including leaking pipes that nobody fixes."
  },
  {
    q: "What can happen when people waste too much water?",
    options: [
      "Water resources become unlimited.",
      "Rivers automatically become cleaner.",
      "Available water supplies may decrease.",
      "Water pollution disappears."
    ],
    answer: 2,
    why: "Wasting too much water means less is left for everyone, so available water supplies may decrease. Water is not unlimited, and waste does not clean rivers or remove pollution."
  },
  {
    q: "Why are El Niño, technological development, and water resources important environmental topics?",
    options: [
      "They are connected to water availability and environmental sustainability.",
      "They only affect entertainment.",
      "They have no effect on communities.",
      "They are unrelated to people's daily lives."
    ],
    answer: 0,
    why: "El Niño, technological development, and water resources are all linked to how much water is available and to a sustainable environment, so they affect communities and daily life."
  },
  {
    q: "What is the best way to help protect the environment for future generations?",
    options: [
      "Ignoring environmental problems",
      "Using natural resources without limits",
      "Allowing pollution to increase",
      "Practicing sustainability and using natural resources responsibly"
    ],
    answer: 3,
    why: "Practicing sustainability and using natural resources responsibly keeps the environment healthy for the next generations. Ignoring problems or letting pollution grow harms them."
  }
];

(function () {
  const root = document.getElementById("quiz");
  if (!root) return;

  // Gawing random ang pagkakasunod-sunod ng listahan (Fisher-Yates)
  function shuffle(list) {
    const a = list.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  // ===== PAGPILI NG 10 TANONG =====
  // Sa bawat round, 10 tanong lang ang ipinapakita, pinili mula sa LAHAT ng tanong sa quizQuestions.
  // Para hindi paulit-ulit ang tanong: naaalala ng quiz kung aling mga tanong ang nailabas na, at ang mga HINDI PA nailalabas
  // ang inuuna. Kapag naubos na ang bago, saka lang ito magsisimula ulit. (Nakasave ito sa browser, kaya tuloy kahit i-refresh.)
  const QUIZ_LENGTH = 10;
  const SEEN_KEY = "agos-quiz-seen";

  function loadSeen() {
    try {
      const list = JSON.parse(localStorage.getItem(SEEN_KEY) || "[]");
      return Array.isArray(list) ? list : [];
    } catch (e) { return []; }              // walang storage (private mode, atbp.): random pa rin, mas may tsansang maulit
  }

  function saveSeen(list) {
    try { localStorage.setItem(SEEN_KEY, JSON.stringify(list)); } catch (e) { /* okay lang */ }
  }

  // Pagsama-samahin ang mga tanong na magkapareho ang tanong (halimbawa "What is El Niño?" na may dalawang bersyon ng choices),
  // para hindi sila sabay na lumabas sa iisang round. Isa lang sa kanila ang pipiliin.
  function groupByQuestion() {
    const groups = {};
    quizQuestions.forEach(function (item) {
      const key = item.q.trim().toLowerCase();
      (groups[key] = groups[key] || []).push(item);
    });
    return groups;
  }

  function pickQuestions() {
    const groups = groupByQuestion();
    const allKeys = Object.keys(groups);
    let seen = loadSeen().filter(function (k) { return allKeys.indexOf(k) !== -1; });   // alisin ang mga tanong na wala na

    let fresh = allKeys.filter(function (k) { return seen.indexOf(k) === -1; });
    let chosen;
    if (fresh.length >= QUIZ_LENGTH) {
      chosen = shuffle(fresh).slice(0, QUIZ_LENGTH);
      seen = seen.concat(chosen);
    } else {
      // Kulang na ang bago: kunin lahat ng natitira, tapos magsimula ulit (pero hindi uulitin ang kakakuha lang)
      const rest = shuffle(allKeys.filter(function (k) { return fresh.indexOf(k) === -1; }));
      const fill = rest.slice(0, Math.max(0, QUIZ_LENGTH - fresh.length));
      chosen = fresh.concat(fill);
      seen = fill;                           // bagong siklo: ang mga idinagdag lang ang "nailabas na"
    }
    saveSeen(seen);

    // Isang bersyon lang bawat tanong (random kung may dalawa), tapos random ang pagkakasunod-sunod
    return shuffle(chosen).map(function (k) { return shuffle(groups[k])[0]; });
  }

  // Random ang order ng tanong AT ng choices. Sinusundan ang tamang sagot kahit nagbago ang pwesto.
  function buildRound() {
    return pickQuestions().map(function (item) {
      const opts = shuffle(item.options.map(function (text, i) { return { text: text, right: i === item.answer }; }));
      return {
        q: item.q,
        why: item.why,
        options: opts.map(function (o) { return o.text; }),
        answer: opts.findIndex(function (o) { return o.right; })
      };
    });
  }

  let round = [];     // mga tanong sa round na ito (random)
  let picks = [];     // sagot ng user bawat tanong (null = wala pang sagot)
  let current = 0;    // anong tanong na

  // Gumawa ng element nang madali (textContent = ligtas)
  function el(tag, className, text) {
    const e = document.createElement(tag);
    if (className) e.className = className;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  // Ulitin ang animation ng isang element
  function replay(node, cls) {
    node.classList.remove(cls);
    void node.offsetWidth;          // para ma-restart ang animation
    node.classList.add(cls);
  }

  function startQuiz() {
    round = buildRound();
    picks = round.map(function () { return null; });
    current = 0;
    buildShell();
    render();
  }

  // Ginagawa nang isang beses ang laman ng quiz; ang render() ang nagpapalit ng tanong.
  // Kaya hindi nawawala ang Back button kapag lumipat ng tanong.
  let ui = {};
  function buildShell() {
    root.innerHTML = "";
    root.className = "quiz-mode-question";   // layout ng tanong (dalawang column, may waves)
    root.appendChild(el("h2", "", "Think Wise"));

    const bar = el("div", "quiz-bar");
    const fill = el("div", "quiz-bar-fill");
    bar.appendChild(fill);
    root.appendChild(bar);

    const progress = el("p", "quiz-progress");
    const question = el("p", "quiz-question");
    const choices = el("div", "quiz-choices");
    const feedback = el("div", "quiz-feedback");
    feedback.setAttribute("aria-live", "polite");
    feedback.hidden = true;

    const nav = el("div", "quiz-nav");
    const back = el("button", "quiz-back", "\u2190 Back");
    back.type = "button";
    back.hidden = true;
    back.addEventListener("click", function () {
      if (current > 0) { current--; render(); }
    });
    const next = el("button", "quiz-next");
    next.type = "button";
    next.hidden = true;
    next.addEventListener("click", function () {
      if (current < round.length - 1) { current++; render(); } else { showResults(); }
    });
    nav.append(back, next);

    root.append(progress, question, choices, feedback, nav);
    ui = { fill: fill, progress: progress, question: question, choices: choices, feedback: feedback, back: back, next: next };
  }

  function render() {
    const item = round[current];
    const picked = picks[current];

    // Progress: Question 1 ay 1/10 na ang laman ng bar (gaya ng design); cyan ang numero ng kasalukuyang tanong
    ui.fill.style.width = ((current + 1) / round.length * 100) + "%";
    const num = el("span", "quiz-progress-num", String(current + 1));
    ui.progress.textContent = "";
    ui.progress.append("Question ", num, " of " + round.length);
    ui.question.textContent = item.q;
    replay(ui.question, "fade-in");

    // Back: lalabas (may animation) pagdating sa pangalawang tanong, tapos nandoon na hanggang dulo
    if (current > 0) {
      if (ui.back.hidden) { ui.back.hidden = false; replay(ui.back, "pop-in"); }
    } else {
      ui.back.hidden = true;
    }

    // Mga choice
    ui.choices.innerHTML = "";
    item.options.forEach(function (text, i) {
      const b = el("button", "quiz-choice", text);
      b.type = "button";
      b.addEventListener("click", function () { pick(i); });
      ui.choices.appendChild(b);
    });
    replay(ui.choices, "fade-in");

    ui.next.textContent = current === round.length - 1 ? "See Results" : "Next Question";
    ui.feedback.hidden = true;
    ui.next.hidden = true;

    // Kapag nasagutan na ito dati (bumalik gamit ang Back), ipakita ulit ang sagot at explanation
    if (picked !== null) showAnswer(picked, false);
  }

  function pick(i) {
    if (picks[current] !== null) return;     // isang sagot lang bawat tanong
    picks[current] = i;
    showAnswer(i, true);
  }

  function showAnswer(i, animate) {
    const item = round[current];
    const isRight = i === item.answer;

    ui.choices.querySelectorAll(".quiz-choice").forEach(function (b, n) {
      b.disabled = true;
      if (n === item.answer) b.classList.add("correct");      // laging green ang tamang sagot
      else if (n === i)      b.classList.add("wrong");        // red ang maling pinili
      else                   b.classList.add("faded");
    });

    ui.feedback.className = "quiz-feedback " + (isRight ? "is-correct" : "is-wrong");
    ui.feedback.innerHTML = "";
    ui.feedback.appendChild(el("strong", "", isRight ? "Correct!" : "Not quite."));
    ui.feedback.appendChild(el("p", "", item.why));
    ui.feedback.hidden = false;

    // Lalabas lang ang Next kapag nakasagot na
    ui.next.hidden = false;
    if (animate) {
      replay(ui.feedback, "fade-in");
      replay(ui.next, "pop-in");
    }
  }

  function showResults() {
    const total = round.length;
    const wrong = [];
    round.forEach(function (item, n) {
      if (picks[n] !== item.answer) {
        wrong.push({ number: n + 1, q: item.q, picked: item.options[picks[n]], right: item.options[item.answer] });
      }
    });
    const correct = total - wrong.length;
    const percent = Math.round(correct / total * 100);
    root.innerHTML = "";
    root.className = "quiz-mode-results";    // layout ng resulta

    root.appendChild(el("h2", "", "Think Wise"));

    const card = el("div", "quiz-score");
    card.appendChild(el("p", "quiz-score-label", "Your Score"));
    card.appendChild(el("p", "quiz-score-number", correct + " / " + total));
    card.appendChild(el("p", "quiz-score-percent", percent + "%"));
    root.appendChild(card);

    const stats = el("div", "quiz-stats");
    const ok = el("div", "quiz-stat stat-ok");
    ok.appendChild(el("strong", "", String(correct)));
    ok.appendChild(el("span", "", "Correct"));
    const bad = el("div", "quiz-stat stat-bad");
    bad.appendChild(el("strong", "", String(wrong.length)));
    bad.appendChild(el("span", "", "Wrong"));
    stats.append(ok, bad);
    root.appendChild(stats);

    if (wrong.length === 0) {
      root.appendChild(el("p", "quiz-perfect", "Perfect score! You really know your water resources."));
    } else {
      root.appendChild(el("h3", "quiz-review-title", "Questions you missed"));
      wrong.forEach(function (w) {
        const box = el("div", "quiz-missed");
        box.appendChild(el("p", "quiz-missed-q", w.number + ". " + w.q));
        const mine = el("p", "quiz-missed-a mine");
        mine.append(el("span", "", "Your answer: "), document.createTextNode(w.picked));
        const right = el("p", "quiz-missed-a right");
        right.append(el("span", "", "Correct answer: "), document.createTextNode(w.right));
        box.append(mine, right);
        root.appendChild(box);
      });
    }

    const again = el("button", "quiz-next", "Try Again");
    again.type = "button";
    again.addEventListener("click", function () {
      startQuiz();                                   // bagong random na order
      root.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    root.appendChild(again);
  }

  startQuiz();
})();
