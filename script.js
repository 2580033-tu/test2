document.addEventListener('DOMContentLoaded', () => {

  /* ===================================================
     1. 路線図ナビ ― スクロールスパイ + クリックで移動
  =================================================== */
  const routeNav = document.getElementById('routeNav');
  const navItems = routeNav ? Array.from(routeNav.querySelectorAll('li')) : [];
  const sections = navItems.map(li => document.getElementById(li.dataset.target));

  navItems.forEach((li, i) => {
    li.querySelector('.station').addEventListener('click', () => {
      sections[i].scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  const spyObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const idx = sections.indexOf(entry.target);
      if (idx === -1) return;
      if (entry.isIntersecting) {
        navItems.forEach(li => li.classList.remove('active'));
        navItems[idx].classList.add('active');
      }
    });
  }, { rootMargin: '-40% 0px -50% 0px', threshold: 0 });

  sections.forEach(s => { if (s) spyObserver.observe(s); });

  /* ===================================================
     2. モバイル進行バー
  =================================================== */
  const mobileLineFill = document.getElementById('mobileLineFill');
  window.addEventListener('scroll', () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    if (mobileLineFill) mobileLineFill.style.width = pct + '%';
  }, { passive: true });

  /* ===================================================
     3. スクロールリビール（カード等のフェードイン）
  =================================================== */
  const revealTargets = document.querySelectorAll(
    '.concept-card, .service-card, .mentor-card, .needs-card, .diagnosis-panel, .chat-panel'
  );
  revealTargets.forEach(el => el.classList.add('reveal'));
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  revealTargets.forEach(el => revealObserver.observe(el));

  /* ===================================================
     4. ヒーローのボタン動作
  =================================================== */
  document.getElementById('heroScrollConcept').addEventListener('click', () => {
    document.getElementById('concept').scrollIntoView({ behavior: 'smooth' });
  });
  document.getElementById('heroStart').addEventListener('click', () => {
    document.getElementById('diagnosis').scrollIntoView({ behavior: 'smooth' });
  });

  /* ===================================================
     5. レベル診断ツール
  =================================================== */
  const jpLabels = ['N5相当', 'N4相当', 'N3相当', 'N2相当', 'N1相当', '母語級'];
  const progLabels = ['未経験', '入門（文法を学習中）', '基礎学習中', '簡単な実装が可能', '実務レベル', '即戦力'];

  const jpLevel = document.getElementById('jpLevel');
  const progLevel = document.getElementById('progLevel');
  const jpLevelLabel = document.getElementById('jpLevelLabel');
  const progLevelLabel = document.getElementById('progLevelLabel');
  const resultBadge = document.getElementById('resultBadge');
  const resultAdvice = document.getElementById('resultAdvice');
  const resultCompanies = document.getElementById('resultCompanies');

  const companyPool = [
    { name: '地域密着型 SIer', tag: '日本語重視', minJp: 3, minProg: 0 },
    { name: '外国人採用に積極的なIT企業', tag: '日本語やさしめ', minJp: 1, minProg: 2 },
    { name: 'グローバル展開スタートアップ', tag: '英語OK・実力主義', minJp: 0, minProg: 3 },
    { name: '大手メーカー系DX部門', tag: '日本語必須・研修充実', minJp: 4, minProg: 1 },
    { name: '受託開発ベンチャー', tag: '実装力重視', minJp: 2, minProg: 4 },
    { name: '日系コンサル(ITエンジニア職)', tag: '対人日本語力重視', minJp: 4, minProg: 2 },
  ];

  function updateDiagnosis() {
    const jp = parseInt(jpLevel.value, 10);
    const prog = parseInt(progLevel.value, 10);
    jpLevelLabel.textContent = jpLabels[jp];
    progLevelLabel.textContent = progLabels[prog];

    // バッジ判定
    let badge = 'これから伸ばしていくフェーズ';
    if (jp >= 3 && prog >= 3) badge = '応募準備がかなり整っています';
    else if (jp >= 3 || prog >= 3) badge = 'あと一歩で応募レベルです';
    resultBadge.textContent = badge;

    // アドバイス文生成
    let advice = '';
    if (jp <= 1 && prog <= 1) {
      advice = 'まずは日本語とプログラミングの基礎固めを並行して進める時期です。週2〜3回の日本語学習と、簡単なアプリ制作を組み合わせるのがおすすめ。メンターと一緒に半年〜1年の学習計画を立てましょう。';
    } else if (jp >= 3 && prog <= 1) {
      advice = '日本語でのコミュニケーションは強みです。プログラミングは基礎文法から実装経験を積む段階。ポートフォリオを1つ完成させると応募の説得力が大きく上がります。';
    } else if (jp <= 1 && prog >= 3) {
      advice = '技術力は評価されやすい水準です。一方で日本語での面接・報連相に不安が残る場合、外国人採用に慣れた企業から選考を始めるのが安全です。';
    } else if (jp >= 3 && prog >= 3) {
      advice = '日本語・技術ともに応募可能な水準です。あとは志望動機と体験談を通じて「入社後のイメージ」を固めるだけ。先輩メンターに面接対策を相談しましょう。';
    } else {
      advice = '日本語・プログラミングともに伸びしろがあるフェーズ。得意な方から先に一段レベルを上げると、選考対象になる企業の幅が一気に広がります。';
    }
    resultAdvice.textContent = advice;

    // 企業マッチング表示
    const matched = companyPool
      .filter(c => jp >= c.minJp - 1 && prog >= c.minProg - 1)
      .sort((a, b) => (Math.abs(jp - a.minJp) + Math.abs(prog - a.minProg)) - (Math.abs(jp - b.minJp) + Math.abs(prog - b.minProg)))
      .slice(0, 3);

    resultCompanies.innerHTML = '';
    matched.forEach(c => {
      const chip = document.createElement('div');
      chip.className = 'company-chip';
      chip.innerHTML = `<span>${c.name}</span><span class="tag-mini">${c.tag}</span>`;
      resultCompanies.appendChild(chip);
    });
  }

  jpLevel.addEventListener('input', updateDiagnosis);
  progLevel.addEventListener('input', updateDiagnosis);
  updateDiagnosis();

  /* ===================================================
     6. 先輩メンター一覧
  =================================================== */
  const mentors = [
    {
      name: 'グエン・ヴァン・アン', origin: 'ベトナム出身 / 2023年卒', role: 'SIer / SE',
      color: 'var(--line-teal)',
      quote: '「日本語はN3から始めて、面接では熱意を評価してもらえました。」',
      story: '入社当初は敬語の使い方に苦労しましたが、メンター制度で先輩に何度も添削してもらい克服。今は後輩の留学生の相談に乗る立場になりました。'
    },
    {
      name: 'リン・ジャーウェイ', origin: '台湾出身 / 2022年卒', role: 'Webエンジニア',
      color: 'var(--line-indigo)',
      quote: '「未経験からでも、独学のポートフォリオが評価されました。」',
      story: 'プログラミング未経験から独学でアプリを1つ完成させ、それを面接でアピール。技術面接では日本語よりコードで語ることを意識しました。'
    },
    {
      name: 'キム・ソヨン', origin: '韓国出身 / 2023年卒', role: 'ITコンサルタント',
      color: 'var(--line-amber)',
      quote: '「社風が合うかどうかを、内定前にとにかく聞きました。」',
      story: '複数の先輩に会社の雰囲気を聞き、残業文化や評価制度を比較。入社後のギャップがほとんどなく、今でも納得して働けています。'
    },
  ];

  const mentorGrid = document.getElementById('mentorGrid');
  mentors.forEach(m => {
    const card = document.createElement('article');
    card.className = 'mentor-card';
    card.innerHTML = `
      <div class="mentor-top">
        <div class="mentor-avatar" style="background:${m.color}">${m.name.charAt(0)}</div>
        <div>
          <div class="mentor-name">${m.name}</div>
          <div class="mentor-meta">${m.origin} ／ ${m.role}</div>
        </div>
      </div>
      <p class="mentor-quote">${m.quote}</p>
      <div class="mentor-story">${m.story}</div>
      <div class="mentor-toggle">＋ 体験談を読む</div>
    `;
    card.addEventListener('click', () => {
      card.classList.toggle('open');
      const toggle = card.querySelector('.mentor-toggle');
      toggle.textContent = card.classList.contains('open') ? '－ 閉じる' : '＋ 体験談を読む';
    });
    mentorGrid.appendChild(card);
  });

  /* ===================================================
     7. 相談室チャット（Kết nối Gemini API qua Backend）
  =================================================== */
  const chatForm = document.getElementById('chatForm');
  const chatInput = document.getElementById('chatInput');
  const chatLog = document.getElementById('chatLog');

  function addMessage(text, who) {
    const wrap = document.createElement('div');
    wrap.className = 'chat-msg ' + (who === 'user' ? 'chat-user' : 'chat-mentor');
    const initial = who === 'user' ? 'あ' : '先';
    wrap.innerHTML = `<span class="chat-avatar">${initial}</span><div class="chat-bubble"></div>`;
    
    const bubble = wrap.querySelector('.chat-bubble');
    bubble.textContent = text;
    
    chatLog.appendChild(wrap);
    chatLog.scrollTop = chatLog.scrollHeight;
    return bubble; // Trả về element để cập nhật nội dung khi AI phản hồi
  }

  if (chatForm) {
    chatForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const val = chatInput.value.trim();
      if (!val) return;

      // 1. Hiển thị tin nhắn người dùng
      addMessage(val, 'user');
      chatInput.value = '';

      // 2. Hiển thị trạng thái đang chờ AI trả lời
      const loadingBubble = addMessage('Senpai đang suy nghĩ...', 'mentor');

      try {
        // 3. Gọi Backend Serverless Function (/api/chat)
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ message: val }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Lỗi kết nối API');
        }

        // 4. Cập nhật câu trả lời từ Gemini AI
        loadingBubble.textContent = data.reply;

      } catch (err) {
        console.error("Chat Error:", err);
        loadingBubble.textContent = "❌ Trục trặc kết nối: " + err.message;
      }
    });
  }
